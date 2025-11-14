// index.ts - Integration example for the fixed distribution service

import { TonClient } from '@ton/ton';
import { Address } from '@ton/core';
import { DistributionService, UserData } from './services/distributionService'; // Import UserData
import * as dotenv from 'dotenv';
dotenv.config();

// Configuration
const TONCENTER_ENDPOINT = process.env.TON_ENDPOINT || 'https://testnet.toncenter.com/api/v2/jsonRPC';
const TONCENTER_API_KEY = process.env.TON_API_KEY || '04223a85c342177d35915c71ca57b9755d09202b7e91b46fc92fc14bbd73906b';
const CONTRACT_ADDRESS = Address.parse(process.env.CONTRACT_ADDRESS!);
const DDISTRIBUTOR_PRIVATE_KEY = (process.env.DDISTRIBUTOR_PRIVATE_KEY || 'dignity response melody annual pyramid loan essence penalty assault neither sight chimney age brown print doctor note clay report stone mixed lizard cram door').split(' ');

class TonCrownDistributor {
  private client: TonClient;
  private distributionService: DistributionService;
  private isRunning: boolean = false;
  private scanInterval: NodeJS.Timeout | null = null;
  private distributionInterval: NodeJS.Timeout | null = null; 

  constructor() {
    this.client = new TonClient({ 
      endpoint: TONCENTER_ENDPOINT, 
      apiKey: TONCENTER_API_KEY
    });
    
    this.distributionService = new DistributionService(this.client, CONTRACT_ADDRESS);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Distribution service is already running');
      return;
    }

    console.info('Starting TonCrown Distribution Service...');
    console.info(`Config: Contract=${CONTRACT_ADDRESS.toString()}, Interval=60min`);

    if (!DDISTRIBUTOR_PRIVATE_KEY || DDISTRIBUTOR_PRIVATE_KEY.length < 24) {
      throw new Error("DDISTRIBUTOR_PRIVATE_KEY is not set or invalid in .env file.");
    }
    
    try {
      // Initialize the wallet that will be sending transactions
      await this.distributionService.initDistributor(DDISTRIBUTOR_PRIVATE_KEY);
      this.isRunning = true;
      
      // Initial scan
      await this.performRewardScan();
      
      // Set up periodic scanning
      this.scanInterval = setInterval(() => this.performRewardScan(), 60 * 60 * 1000); // 60 minutes
      
      // Set up periodic distribution
      this.distributionInterval = setInterval(() => this.distributionService.processDistributions(), 5 * 60 * 1000); // 5 minutes
      
      console.info('TonCrown Distribution Service started successfully');
      
    } catch (error) {
      console.error('Failed to start distribution service:', error);
      this.isRunning = false;
      throw error;
    }
  }

  stop(): void {
    console.info('Stopping TonCrown Distribution Service...');
    this.isRunning = false;
    if (this.scanInterval) clearInterval(this.scanInterval);
    if (this.distributionInterval) clearInterval(this.distributionInterval);
    console.info('TonCrown Distribution Service stopped');
  }

  private async performRewardScan(): Promise<void> {
    if (!this.isRunning) return;
    try {
      const usersWithRewards = await this.distributionService.scanForPendingRewards();
      
      if (usersWithRewards.length > 0) {
        console.info(`Found ${usersWithRewards.length} users with stakes due for rewards:`);
        
        for (const user of usersWithRewards) {
          // Calculate the total rewards for logging purposes
          const totalPendingRewards = user.stakes.reduce((sum, stake) => sum + (stake.pendingRewards || 0n), 0n);
          
          console.info(`- ${user.address}: ${user.stakes.length} stakes due. Total potential rewards: ${totalPendingRewards}`);
          
          for (const stake of user.stakes) {
            const rewardAmount = stake.pendingRewards || 0n;
            // Use the correct field name: lastClaim
            const stakeAgeHours = Math.floor((Date.now() / 1000 - Number(stake.lastClaim)) / 3600);
            
            console.debug(`  Stake ${stake.id}: ${stake.amount} ${stake.tokenType}, last claim was ${stakeAgeHours}h ago, rewards: ${rewardAmount}`);
          }
        }
      } else {
        console.log("No users found with stakes currently due for rewards.");
      }
      
    } catch (error) {
      console.error('Error during reward scan:', error);
    }
  }
}

async function main() {
  const distributor = new TonCrownDistributor();
  
  process.on('SIGINT', () => {
    console.info('Received SIGINT, shutting down...');
    distributor.stop();
    process.exit(0);
  });

  try {
    await distributor.start();
    console.info('Distributor is running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Failed to start distributor:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}