// src/utils/retryWrapper.ts
import { logger } from './logger';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  },
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.maxRetries + 1; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        logger.info(`${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error: any) {
      lastError = error;
      
      if (attempt === options.maxRetries + 1) {
        logger.error(`${operationName} failed after ${options.maxRetries} retries:`, error);
        throw error;
      }

      const isRetryableError = 
        error.status === 429 || // Rate limit
        error.code === 'ERR_SSL_SSLV3_ALERT_BAD_RECORD_MAC' || // SSL error
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        (error.message && error.message.includes('timeout'));

      if (!isRetryableError) {
        logger.error(`${operationName} failed with non-retryable error:`, error);
        throw error;
      }

      const delay = Math.min(
        options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1),
        options.maxDelay
      );
      
      logger.warn(`${operationName} failed on attempt ${attempt}, retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}