// src/database/sqlite.ts
import sqlite3 from 'sqlite3';
import { DistributionJob } from '../types';
import { logger } from '../utils/logger';

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string = 'distribution.db') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  private initializeTables(): void {
    const createJobsTable = `
      CREATE TABLE IF NOT EXISTS distribution_jobs (
        id TEXT PRIMARY KEY,
        user_address TEXT NOT NULL,
        stake_id INTEGER NOT NULL,
        scheduled_time DATETIME NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        last_attempt DATETIME,
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_status ON distribution_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_scheduled_time ON distribution_jobs(scheduled_time);
      CREATE INDEX IF NOT EXISTS idx_user_stake ON distribution_jobs(user_address, stake_id);
    `;

    this.db.exec(createJobsTable, (err) => {
      if (err) {
        logger.error('Failed to create jobs table:', err);
        throw err;
      }
      this.db.exec(createIndexes, (err) => {
        if (err) {
          logger.error('Failed to create indexes:', err);
        }
      });
    });
  }

  async addJob(job: DistributionJob): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO distribution_jobs 
        (id, user_address, stake_id, scheduled_time, status, retry_count, last_attempt, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        job.id,
        job.userAddress,
        job.stakeId,
        job.scheduledTime.toISOString(),
        job.status,
        job.retryCount,
        job.lastAttempt?.toISOString() || null,
        job.error || null
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getPendingJobs(): Promise<DistributionJob[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM distribution_jobs 
        WHERE status IN ('pending', 'failed') 
        AND scheduled_time <= datetime('now')
        AND retry_count < ?
        ORDER BY scheduled_time ASC
      `, [3], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const jobs = rows.map(row => ({
            id: row.id,
            userAddress: row.user_address,
            stakeId: row.stake_id,
            scheduledTime: new Date(row.scheduled_time),
            status: row.status,
            retryCount: row.retry_count,
            lastAttempt: row.last_attempt ? new Date(row.last_attempt) : undefined,
            error: row.error
          }));
          resolve(jobs);
        }
      });
    });
  }

  async updateJobStatus(jobId: string, status: string, error?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE distribution_jobs 
        SET status = ?, last_attempt = datetime('now'), error = ?, retry_count = retry_count + 1
        WHERE id = ?
      `);

      stmt.run([status, error || null, jobId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async cleanup(olderThanDays: number = 30): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        DELETE FROM distribution_jobs 
        WHERE created_at < datetime('now', '-${olderThanDays} days')
        AND status = 'completed'
      `, function(err) {
        if (err) {
          reject(err);
        } else {
          logger.info(`Cleaned up ${this.changes} old completed jobs`);
          resolve();
        }
      });
    });
  }

  // Added to support getStats in distributionService.ts
  all(sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void): void {
    this.db.all(sql, params, callback);
  }
}