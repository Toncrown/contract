// src/services/distributionService.ts

import {
    Cell, Address, TupleBuilder, Dictionary, Slice, beginCell, Sender, toNano, fromNano, TupleReader, TupleItem, internal
} from '@ton/core';
import { TonClient, WalletContractV4, OpenedContract } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';

// --- INTERFACES ---
interface StakeInfoValue {
    amount: bigint; 
    startTime: bigint; 
    duration: number; 
    vipClass: number;
    autoRestake: boolean; 
    lastClaim: bigint; 
    totalClaimed: bigint;
    isActive: boolean; 
    stakedAsset: number;
}

export interface StakeInfo {
    id: number; 
    amount: bigint; 
    startTime: bigint; 
    duration: number; 
    vipClass: number;
    autoRestake: boolean; 
    lastClaim: bigint; 
    totalClaimed: bigint; 
    isActive: boolean;
    tokenType: 'TON' | 'USDT'; 
    pendingRewards: bigint;
}

export interface UserData {
    address: string; 
    stakes: StakeInfo[]; 
    isActive: boolean;
    level: number;
    vipClass: number;
    directReferrals: number;
    totalReferrals: number;
    registrationTime: bigint;
    stakeCounter: number;
}

// --- PARSER ---
const stakeInfoValueParser = {
    serialize: () => { throw new Error('Serialization not needed.'); },
    parse: (src: Slice): StakeInfoValue => ({
        amount: src.loadCoins(), 
        startTime: src.loadUintBig(32),
        duration: src.loadUint(32), 
        vipClass: src.loadUint(8),
        autoRestake: src.loadBit(), 
        lastClaim: src.loadUintBig(32),
        totalClaimed: src.loadCoins(), 
        isActive: src.loadBit(),
        stakedAsset: src.loadUint(8),
    })
};

class DistributionService {
    private client: TonClient;
    private contractAddress: Address;
    private distributorWallet: OpenedContract<WalletContractV4> | null = null;
    private secretKey: Buffer | null = null;

    constructor(client: TonClient, contractAddress: Address) {
        this.client = client;
        this.contractAddress = contractAddress;
    }

    async initDistributor(mnemonic: string[]): Promise<void> {
        const key = await mnemonicToWalletKey(mnemonic);
        this.secretKey = key.secretKey;
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
        this.distributorWallet = this.client.open(wallet);
        console.log(`Distributor wallet initialized: ${this.distributorWallet.address.toString()}`);
        const balance = await this.client.getBalance(this.distributorWallet.address);
        console.log(`Distributor wallet balance: ${fromNano(balance)} TON`);
        if (balance < toNano('0.5')) {
            console.warn('Warning: Distributor wallet balance is low.');
        }
    }

    async processDistributions(): Promise<void> {
        if (!this.distributorWallet || !this.secretKey) {
            console.error('Distributor wallet not initialized.');
            return;
        }
        console.log('--- Starting Reward Distribution Cycle ---');
        try {
            const usersWithRewards = await this.scanForPendingRewards();
            console.log(`Found ${usersWithRewards.length} user(s) with stakes due for rewards.`);

            for (const user of usersWithRewards) {
                console.log(`Processing user ${user.address} with ${user.stakes.length} due stakes`);
                for (const stake of user.stakes) {
                    try {
                        console.log(`Distributing rewards for Stake ID ${stake.id} (${stake.tokenType}) - Last claim: ${new Date(Number(stake.lastClaim) * 1000).toISOString()}`);
                        await this.distributeRewardForStake(Address.parse(user.address), stake.id);
                        await new Promise(resolve => setTimeout(resolve, 3000)); // Increased delay to 3 seconds
                    } catch (stakeError) {
                        console.error(`Failed to distribute for User ${user.address}, Stake ID ${stake.id}:`, stakeError);
                    }
                }
            }
        } catch (error) {
            console.error('Error during reward distribution cycle:', error);
        }
        console.log('--- Reward Distribution Cycle Finished ---');
    }

    async scanForPendingRewards(): Promise<UserData[]> {
        const allUsers = await this.getAllUserAddresses();
        const usersWithPendingRewards: UserData[] = [];
        const now = BigInt(Math.floor(Date.now() / 1000));
        const SECONDS_PER_DAY = 86400n;
        
        console.log(`Scanning ${allUsers.length} users for pending rewards...`);
        console.log(`Current timestamp: ${now} (${new Date(Number(now) * 1000).toISOString()})`);

        for (const userAddress of allUsers) {
            try {
                const userData = await this.getUserData(userAddress);
                if (!userData || !userData.isActive) {
                    console.log(`User ${userAddress.toString()}: ${!userData ? 'not found' : 'inactive'}`);
                    continue;
                }
                
                if (userData.stakes.length === 0) {
                    console.log(`User ${userAddress.toString()}: no stakes`);
                    continue;
                }
                
                console.log(`User ${userAddress.toString()}: ${userData.stakes.length} total stakes`);
                
                const dueStakes = userData.stakes.filter(stake => {
                    const timeSinceLastClaim = now - stake.lastClaim;
                    const isDue = stake.isActive && (timeSinceLastClaim >= SECONDS_PER_DAY - 3600n); // 1 hour buffer
                    
                    console.log(`  Stake ID ${stake.id} (${stake.tokenType}): Active=${stake.isActive}, Last claim: ${new Date(Number(stake.lastClaim) * 1000).toISOString()}, Time since claim: ${timeSinceLastClaim}s, Due: ${isDue}`);
                    
                    return isDue;
                });

                if (dueStakes.length > 0) {
                    console.log(`User ${userAddress.toString()}: ${dueStakes.length} stakes due for rewards`);
                    
                    // Calculate pending rewards for each stake to match index.ts expectations
                    const stakesWithRewards = dueStakes.map(stake => {
                        // VIP reward rates from contract (per 10000, so divide by 10000 for percentage)
                        const vipRates = { 1: 95, 2: 145, 3: 195, 4: 250 };
                        const dailyRate = vipRates[stake.vipClass as keyof typeof vipRates] || 95;
                        
                        const daysSinceLastClaim = Number(now - stake.lastClaim) / 86400;
                        let dailyReward: bigint;
                        
                        if (stake.tokenType === 'TON') {
                            dailyReward = (stake.amount * BigInt(dailyRate)) / 10000n;
                        } else {
                            // For USDT, amount is already in micro-USDT (6 decimals)
                            dailyReward = (stake.amount * BigInt(dailyRate)) / 10000n;
                        }
                        
                        const totalReward = dailyReward * BigInt(Math.floor(daysSinceLastClaim));
                        
                        return {
                            ...stake,
                            pendingRewards: totalReward
                        };
                    });
                    
                    usersWithPendingRewards.push({ ...userData, stakes: stakesWithRewards });
                } else {
                    console.log(`User ${userAddress.toString()}: no stakes due for rewards`);
                }
            } catch (error) {
                console.error(`Error processing user ${userAddress.toString()}:`, error);
            }
        }
        return usersWithPendingRewards;
    }

    private async distributeRewardForStake(userAddress: Address, stakeId: number): Promise<void> {
        if (!this.distributorWallet || !this.secretKey) throw new Error('Distributor not initialized');

        const messageBody = beginCell()
            .storeUint(0xf552f45f, 32) // OP-Code for DistributeDailyRewards
            .storeAddress(userAddress)
            .storeUint(stakeId, 16)
            .endCell();

        const seqno = await this.distributorWallet.getSeqno();

        await this.distributorWallet.sendTransfer({
            seqno,
            secretKey: this.secretKey,
            messages: [internal({
                to: this.contractAddress,
                value: toNano('0.15'), // Increased gas fee from 0.1 to 0.15
                bounce: true,
                body: messageBody,
            })]
        });
        console.log(`Distribution tx sent for User: ${userAddress}, Stake ID: ${stakeId}.`);
    }

    private async getAllUserAddresses(): Promise<Address[]> {
        const users = new Set<string>();
        
        try {
            // Get more transactions to find all users
            const transactions = await this.client.getTransactions(this.contractAddress, { 
                limit: 512, 
                archival: true 
            });
            
            console.log(`Found ${transactions.length} transactions to scan for users`);
            
            for (const tx of transactions) {
                if (tx.inMessage?.info.type === 'internal' && tx.inMessage.info.src) {
                    users.add(tx.inMessage.info.src.toRawString());
                }
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            // Fallback to a smaller limit if archival fails
            const transactions = await this.client.getTransactions(this.contractAddress, { limit: 100 });
            for (const tx of transactions) {
                if (tx.inMessage?.info.type === 'internal' && tx.inMessage.info.src) {
                    users.add(tx.inMessage.info.src.toRawString());
                }
            }
        }
        
        console.log(`Found ${users.size} unique user addresses`);
        return Array.from(users).map(addr => Address.parseRaw(addr));
    }

    // Updated getUserData method with fixed USDT amount parsing
    private async getUserData(userAddress: Address): Promise<UserData | null> {
        const userArgs = new TupleBuilder();
        userArgs.writeAddress(userAddress);
        
        const { stack } = await this.client.runMethod(this.contractAddress, 'getUserInfo', userArgs.build());
        
        if (stack.peek().type === 'null') {
            console.log(`User ${userAddress.toString()}: No data found (null)`);
            return null;
        }

        const userTuple: TupleReader = stack.readTuple();
        
        // Use the same parsing logic as App.jsx
        const EXPECTED_TUPLE_LENGTH = 15;
        const tupleItems = (userTuple as any).items;
        
        if (!tupleItems || tupleItems.length !== EXPECTED_TUPLE_LENGTH) {
            console.error(`Invalid user tuple structure for ${userAddress.toString()}: expected ${EXPECTED_TUPLE_LENGTH} items, got ${tupleItems?.length}`);
            return null;
        }

        try {
            const getBigInt = (item: any) => (typeof item === 'bigint' ? item : BigInt(item));
            
            // Parse basic user info using the same structure as App.jsx
            const level = getBigInt(tupleItems[1]);
            const vipClass = getBigInt(tupleItems[2]);
            const directReferrals = getBigInt(tupleItems[3]);
            const totalReferrals = getBigInt(tupleItems[4]);
            const isActive = getBigInt(tupleItems[9]) === -1n;
            const registrationTime = getBigInt(tupleItems[10]);
            const stakeCounter = getBigInt(tupleItems[11]);

            console.log(`User ${userAddress.toString()}: Level=${level}, VIP=${vipClass}, Active=${isActive}, StakeCounter=${stakeCounter}`);

            // Parse stakes from index 12
            const stakes: StakeInfo[] = [];
            
            console.log(`User ${userAddress.toString()}: Stakes item type: ${tupleItems[12]?.type}, Is array: ${Array.isArray(tupleItems[12])}`);
            
            // Check if it's a Cell object (it might not have a type property but be a Cell instance)
            const isCell = tupleItems[12] && (
                tupleItems[12].type === 'cell' || 
                tupleItems[12].constructor?.name === 'Cell' ||
                (typeof tupleItems[12] === 'object' && tupleItems[12].beginParse)
            );
            
            if (isCell) {
                try {
                    console.log(`User ${userAddress.toString()}: Manually parsing stake tree structure`);
                    
                    // Parse the tree structure manually to extract stakes
                    const extractedStakes = this.extractStakesFromTree(tupleItems[12], userAddress.toString());
                    
                    for (const [stakeId, stakeData] of extractedStakes) {
                        const stake: StakeInfo = {
                            id: stakeId,
                            amount: stakeData.amount,
                            startTime: stakeData.startTime,
                            duration: stakeData.duration,
                            vipClass: stakeData.vipClass,
                            autoRestake: stakeData.autoRestake,
                            lastClaim: stakeData.lastClaim,
                            totalClaimed: stakeData.totalClaimed,
                            isActive: stakeData.isActive,
                            tokenType: stakeData.stakedAsset === 0 ? 'TON' : 'USDT',
                            pendingRewards: 0n,
                        };
                        stakes.push(stake);
                        
                        // Fixed amount display for logging - USDT uses 6 decimals, TON uses 9
                        const amountDisplay = stake.tokenType === 'TON' 
                            ? fromNano(stake.amount)
                            : (Number(stake.amount) / 1_000_000).toString();
                        
                        console.log(`  Stake ${stakeId}: ${stake.tokenType}, Amount=${amountDisplay}, Active=${stake.isActive}, LastClaim=${new Date(Number(stake.lastClaim) * 1000).toISOString()}`);
                    }
                    
                    console.log(`User ${userAddress.toString()}: Found ${stakes.length} stakes total`);
                } catch (e) {
                    console.log(`User ${userAddress.toString()}: Error parsing stakes:`, e);
                }
            } else if (Array.isArray(tupleItems[12])) {
                console.log(`User ${userAddress.toString()}: Stakes is an empty array`);
            } else if (tupleItems[12] === null || tupleItems[12] === undefined) {
                console.log(`User ${userAddress.toString()}: Stakes is null/undefined`);
            } else {
                console.log(`User ${userAddress.toString()}: Unexpected stakes format:`, typeof tupleItems[12], tupleItems[12]);
            }

            return {
                address: userAddress.toString(),
                isActive,
                stakes,
                level: Number(level),
                vipClass: Number(vipClass),
                directReferrals: Number(directReferrals),
                totalReferrals: Number(totalReferrals),
                registrationTime,
                stakeCounter: Number(stakeCounter),
            };

        } catch (e) {
            console.error(`User ${userAddress.toString()}: tuple parsing error:`, e);
            return null;
        }
    }

    private extractStakesFromTree(cell: any, userAddress: string): Map<number, StakeInfoValue> {
        const stakes = new Map<number, StakeInfoValue>();
        
        try {
            this.traverseForStakes(cell, stakes, userAddress, 0);
        } catch (error) {
            console.log(`${userAddress}: Error extracting stakes from tree:`, (error as Error).message);
        }
        
        return stakes;
    }
    
    private traverseForStakes(cell: any, stakes: Map<number, StakeInfoValue>, userAddress: string, depth: number): void {
        if (depth > 10) return; // Prevent infinite recursion
        
        try {
            const slice = cell.beginParse();
            console.log(`${userAddress}: Tree depth ${depth} - bits: ${slice.remainingBits}, refs: ${slice.remainingRefs}`);
            
            // First, always traverse all child references to explore the entire tree
            if (slice.remainingRefs > 0) {
                const traversalSlice = slice.clone(); // Use a separate slice for traversal
                for (let i = 0; i < slice.remainingRefs; i++) {
                    try {
                        const refCell = traversalSlice.loadRef();
                        console.log(`${userAddress}: Traversing reference ${i} at depth ${depth}`);
                        this.traverseForStakes(refCell, stakes, userAddress, depth + 1);
                    } catch (refError) {
                        console.log(`${userAddress}: Error traversing ref ${i} at depth ${depth}:`, (refError as Error).message);
                    }
                }
            }
            
            // If this is a leaf cell with enough bits for stake data, try to parse it
            if (slice.remainingBits >= 160 && slice.remainingRefs === 0) {
                try {
                    console.log(`${userAddress}: Trying to parse leaf cell at depth ${depth} with ${slice.remainingBits} bits`);
                    
                    // Try parsing as: 16-bit stakeId + stake data
                    try {
                        const tempSlice = slice.clone();
                        const stakeId = tempSlice.loadUint(16);
                        console.log(`${userAddress}: Potential stake ID: ${stakeId}`);
                        
                        // Parse the stake data
                        const stakeData: StakeInfoValue = {
                            amount: tempSlice.loadCoins(),
                            startTime: tempSlice.loadUintBig(32), 
                            duration: tempSlice.loadUint(32),
                            vipClass: tempSlice.loadUint(8),
                            autoRestake: tempSlice.loadBit(),
                            lastClaim: tempSlice.loadUintBig(32),
                            totalClaimed: tempSlice.loadCoins(),
                            isActive: tempSlice.loadBit(),
                            stakedAsset: tempSlice.loadUint(8),
                        };
                        
                        stakes.set(stakeId, stakeData);
                        
                        // Fixed amount display for logging - USDT uses 6 decimals, TON uses 9
                        const amountDisplay = stakeData.stakedAsset === 0 
                            ? fromNano(stakeData.amount)
                            : (Number(stakeData.amount) / 1_000_000).toString();
                        
                        console.log(`${userAddress}: Successfully parsed stake ${stakeId} - Amount: ${amountDisplay}, Asset: ${stakeData.stakedAsset === 0 ? 'TON' : 'USDT'}, Active: ${stakeData.isActive}`);
                        
                        // Continue processing - don't return here
                    } catch (parseError) {
                        console.log(`${userAddress}: 16-bit stake ID parsing failed at depth ${depth}:`, (parseError as Error).message);
                    }
                    
                } catch (leafError) {
                    console.log(`${userAddress}: Error parsing leaf cell at depth ${depth}:`, (leafError as Error).message);
                }
            }
            
        } catch (error) {
            console.log(`${userAddress}: Error in traverseForStakes at depth ${depth}:`, (error as Error).message);
        }
    }

    private safeParseInt(item: any, defaultValue: bigint = 0n): bigint {
        if (!item) return defaultValue;
        if (item.type === 'int') return item.value;
        if (typeof item === 'bigint') return item;
        if (typeof item === 'number') return BigInt(item);
        return defaultValue;
    }
}

export { DistributionService }; 