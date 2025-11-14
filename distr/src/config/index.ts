// src/config/index.ts
import dotenv from 'dotenv';
import { DistributionConfig } from '../types';

dotenv.config();

export const config: DistributionConfig = {
  contractAddress: process.env.CONTRACT_ADDRESS || 'EQDu9s9buoGdW6SMYWYRl4oydHM1UpVS1dQIUJzOBO24kHdb',
  distributorPrivateKey: process.env.DISTRIBUTOR_PRIVATE_KEY || '',
  tonEndpoint: process.env.TON_ENDPOINT || 'https://testnet.toncenter.com/api/v2/jsonRPC',
  apiKey: process.env.TON_API_KEY || '04223a85c342177d35915c71ca57b9755d09202b7e91b46fc92fc14bbd73906b',
  checkInterval: parseInt(process.env.CHECK_INTERVAL || '60'), // 1 hour default
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  gasLimit: BigInt(process.env.GAS_LIMIT || '100000000'), // 0.1 TON
  minRewardThreshold: 0n
};

// Validation
if (!config.contractAddress || !config.distributorPrivateKey) {
  throw new Error('Missing required environment variables: CONTRACT_ADDRESS, DISTRIBUTOR_PRIVATE_KEY');
}
