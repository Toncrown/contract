import { Address, Cell } from '@ton/core';

export interface StakeInfo {
  stakeId: number;
  amount: bigint;
  startTime: number;
  duration: number;
  vipClass: number;
  autoRestake: boolean;
  lastClaim: number;
  totalClaimed: bigint;
  isActive: boolean;
  stakedAsset: number;
}

export interface User {
  referrer?: Address;
  level: number;
  vipClass: number;
  directReferrals: number;
  totalReferrals: number;
  otherReferrals: number;
  lastCheckIn: number;
  levelExpiration: number;
  totalEarned: bigint;
  isActive: boolean;
  registrationTime: number;
  stakeCounter: number;
  stakes: Map<number, StakeInfo>;
  downlines: Map<number, Address>;
  spilloverIndex: number;
}

export interface VipConfig {
  dailyRoi: number;
  minLevel: number;
  maxLevel: number;
  stakingRoi: number;
}

export interface PlatformStats {
  totalUsers: number;
  totalStakedTon: bigint;
  totalStakedUsdt: bigint;
  totalDistributed: bigint;
  activeStakes: number;
}

export interface DistributionJob {
  id: string;
  userAddress: string;
  stakeId: number;
  scheduledTime: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  lastAttempt?: Date;
  error?: string;
}

export interface DistributionConfig {
  contractAddress: string;
  distributorPrivateKey: string;
  tonEndpoint: string;
  checkInterval: number; // minutes
  apiKey?: string;
  maxRetries: number;
  gasLimit: bigint;
  minRewardThreshold: bigint;
}
