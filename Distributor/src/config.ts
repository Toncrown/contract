import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable ${key}`);
    }
    return value;
}

export const config = {
    toncenterEndpoint: required('TONCENTER_API_ENDPOINT'),
    toncenterApiKey: required('TONCENTER_API_KEY'),
    contractAddress: required('CONTRACT_ADDRESS'),
    distributorMnemonic: required('DISTRIBUTOR_MNEMONIC').split(' '),
    cronSchedule: process.env.CRON_SCHEDULE || '0 1 * * *', // Default to 1 AM UTC
    distributeRewardsOpcode: parseInt(required('DISTRIBUTE_REWARDS_OPCODE'), 16),
};