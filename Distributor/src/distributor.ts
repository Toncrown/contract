// // Updated distributionService.ts with proper stake parsing

// import { Cell, Address, TupleBuilder, Dictionary } from '@ton/core';
// import { TonClient } from '@ton/ton';

// interface StakeInfo {
//   id: number;
//   amount: bigint;
//   startTime: bigint;
//   duration: number;
//   autoRestake: boolean;
//   lastRewardTime: bigint;
//   referrer: string | null;
//   isActive: boolean;
//   tokenType: 'TON' | 'USDT';
//   pendingRewards?: bigint;
// }

// interface UserData {
//   address: string;
//   level: bigint;
//   vipClass: bigint;
//   stakeCounter: bigint;
//   stakes: StakeInfo[];
//   isActive: boolean;
//   totalEarned: bigint;
// }

// class DistributionService {
//   private client: TonClient;
//   private contractAddress: Address;

//   constructor(client: TonClient, contractAddress: Address) {
//     this.client = client;
//     this.contractAddress = contractAddress;
//   }

//   // Main method to scan for users with pending rewards
//   async scanForPendingRewards(): Promise<{ address: string, stakes: StakeInfo[], totalPendingRewards: bigint }[]> {
//     console.info('Starting reward scan...');
    
//     try {
//       // Get all users from the contract
//       const users = await this.getAllUsers();
//       console.info(`Scanning ${users.length} users for pending rewards`);
      
//       const usersWithPendingRewards: { address: string, stakes: StakeInfo[], totalPendingRewards: bigint }[] = [];
      
//       // Process users in batches
//       const batchSize = 10;
//       for (let i = 0; i < users.length; i += batchSize) {
//         const batch = users.slice(i, i + batchSize);
//         const batchNumber = Math.floor(i / batchSize) + 1;
//         const totalBatches = Math.ceil(users.length / batchSize);
        
//         console.info(`Processing batch ${batchNumber}/${totalBatches} (users ${i}-${Math.min(i + batchSize - 1, users.length - 1)})`);
        
//         for (const userAddress of batch) {
//           try {
//             const userData = await this.getUserData(userAddress);
            
//             if (!userData || userData.stakes.length === 0) {
//               console.debug(`No stakes found for user ${userAddress}`);
//               continue;
//             }
            
//             const stakesWithRewards = this.calculateStakeRewards(userData.stakes);
//             const totalPendingRewards = stakesWithRewards.reduce((sum, stake) => sum + (stake.pendingRewards || 0n), 0n);
            
//             if (totalPendingRewards > 0n) {
//               usersWithPendingRewards.push({
//                 address: userAddress,
//                 stakes: stakesWithRewards.filter(s => (s.pendingRewards || 0n) > 0n),
//                 totalPendingRewards
//               });
              
//               console.info(`Found pending rewards for ${userAddress}: ${totalPendingRewards} (${stakesWithRewards.length} stakes)`);
//             } else {
//               console.debug(`No rewards scheduled for ${userAddress}`);
//             }
            
//           } catch (error) {
//             console.error(`Error processing user ${userAddress}:`, error);
//             continue;
//           }
//         }
//       }
      
//       console.info(`Reward scan completed. Found ${usersWithPendingRewards.length} users with pending rewards.`);
//       return usersWithPendingRewards;
      
//     } catch (error) {
//       console.error('Error during reward scan:', error);
//       throw error;
//     }
//   }

//   // Get all user addresses from the contract
//   private async getAllUsers(): Promise<string[]> {
//     try {
//       // This would need to be implemented based on your contract's user storage structure
//       // For now, return the addresses from your logs
//       return [
//         'EQBLDTtYt33GAzKXLdLeDlTTTMKsIz7wAYpkq1eXq3E89eqT',
//         'EQDMixPIWRosGle-BviB1ByuQbhOS2DLYzL6GWjg6NwvbTLe',
//         'EQAZ_WhkfqdqiRyatwUzPach2P96Pg1qhbLXeNI80iS4Kxod'
//       ];
//     } catch (error) {
//       console.error('Error fetching users:', error);
//       return [];
//     }
//   }

//   // Get user data from the contract
//   private async getUserData(userAddress: string): Promise<UserData | null> {
//     try {
//       const userArgs = new TupleBuilder();
//       userArgs.writeAddress(Address.parse(userAddress));
      
//       const { stack } = await this.client.runMethod(this.contractAddress, 'getUserInfo', userArgs.build());
      
//       if (stack.peek().type === 'null') {
//         return null;
//       }
      
//       const userTuple = stack.readTuple();
//       return this.parseUserDataFromTuple(userTuple, userAddress);
      
//     } catch (error) {
//       console.error(`Error fetching user data for ${userAddress}:`, error);
//       return null;
//     }
//   }

//   // Parse user data from contract tuple
//   private parseUserDataFromTuple(tuple: any, userAddress: string): UserData | null {
//     const EXPECTED_TUPLE_LENGTH = 15;
    
//     if (!tuple || !tuple.items || tuple.items.length !== EXPECTED_TUPLE_LENGTH) {
//       console.error(`Invalid user tuple structure for ${userAddress}: expected ${EXPECTED_TUPLE_LENGTH} items, got ${tuple.items?.length}`);
//       return null;
//     }

//     console.debug(`User tuple has ${tuple.items.length} items`);
//     const items = tuple.items;
    
//     try {
//       const getBigInt = (item: any) => (typeof item === 'bigint' ? item : BigInt(item));
      
//       const userData: UserData = {
//         address: userAddress,
//         level: getBigInt(items[1]),
//         vipClass: getBigInt(items[2]),
//         stakeCounter: getBigInt(items[11]),
//         stakes: [],
//         isActive: getBigInt(items[9]) === -1n,
//         totalEarned: getBigInt(items[8])
//       };

//       // Parse stakes from items[12] with enhanced error handling
//       console.debug(`Stakes item type: ${items[12].type}, raw value: ${JSON.stringify(items[12])}`);
      
//       if (items[12].type === 'cell') {
//         userData.stakes = this.parseStakesFromCell(items[12].cell, userAddress);
//       } else if (Array.isArray(items[12]) && items[12].length === 0) {
//         console.debug('Stakes field is empty array - no stakes');
//         userData.stakes = [];
//       } else {
//         console.debug('Stakes field has unexpected format');
//         userData.stakes = [];
//       }

//       console.debug(`Found ${userData.stakes.length} stakes for user ${userAddress}:`, userData.stakes.map(s => ({ id: s.id, amount: s.amount.toString(), type: s.tokenType })));
      
//       return userData;
      
//     } catch (error) {
//       console.error(`User tuple parsing error for ${userAddress}:`, error);
//       return null;
//     }
//   }

//   // Parse stakes from cell with robust error handling
//   private parseStakesFromCell(stakesCell: Cell, userAddress: string): StakeInfo[] {
//     const stakes: StakeInfo[] = [];
    
//     try {
//       const slice = stakesCell.beginParse();
      
//       console.debug(`Stakes cell parsing started. Remaining bits: ${slice.remainingBits}, remaining refs: ${slice.remainingRefs}`);
      
//       if (slice.remainingBits < 1) {
//         console.debug('Stakes cell is empty - no stakes');
//         return stakes;
//       }

//       // Try to parse as dictionary
//       try {
//         console.debug('Parsing sparse dictionary with tree structure');
//         const parsedStakes = this.traverseStakesDictionary(stakesCell, userAddress);
//         stakes.push(...parsedStakes);
//       } catch (dictError) {
//         console.error('Dictionary parsing failed, trying linear parsing:', dictError);
        
//         // Fallback to linear parsing
//         try {
//           const linearStakes = this.parseStakesLinear(stakesCell, userAddress);
//           stakes.push(...linearStakes);
//         } catch (linearError) {
//           console.error('Linear parsing also failed:', linearError);
//         }
//       }

//     } catch (error) {
//       console.error(`Error parsing stakes cell for ${userAddress}:`, error);
//     }
    
//     console.debug(`Parsed ${stakes.length} stakes total`);
//     return stakes;
//   }

//   // Traverse stakes dictionary with proper bounds checking
//   private traverseStakesDictionary(cell: Cell, userAddress: string): StakeInfo[] {
//     const stakes: StakeInfo[] = [];
    
//     try {
//       // Use a more robust dictionary parsing approach
//       const dict = Dictionary.loadDirect(
//         Dictionary.Keys.Uint(16), // Assuming 16-bit keys for stake IDs
//         Dictionary.Values.Cell(),
//         cell
//       );

//       for (const [stakeId, stakeCell] of dict) {
//         console.debug(`Found leaf at key ${stakeId} (binary: ${stakeId.toString(2).padStart(3, '0')})`);
        
//         try {
//           const stake = this.parseStakeFromCell(Number(stakeId), stakeCell);
//           if (stake) {
//             stakes.push(stake);
//           }
//         } catch (error) {
//           console.error(`Error parsing stake data for key ${stakeId}:`, error);
//           continue; // Skip this stake and continue with others
//         }
//       }
//     } catch (error) {
//       console.error(`Dictionary traversal failed for ${userAddress}:`, error);
//       throw error;
//     }
    
//     return stakes;
//   }

//   // Linear parsing fallback
//   private parseStakesLinear(cell: Cell, userAddress: string): StakeInfo[] {
//     const stakes: StakeInfo[] = [];
//     let stakeId = 0;
    
//     try {
//       let currentSlice = cell.beginParse();
      
//       while (currentSlice.remainingBits >= 200) { // Minimum bits for a stake
//         try {
//           const stake: StakeInfo = {
//             id: stakeId++,
//             amount: currentSlice.loadUintBig(64),
//             startTime: currentSlice.loadUintBig(64),
//             duration: currentSlice.loadUint(32),
//             autoRestake: currentSlice.loadBit(),
//             lastRewardTime: currentSlice.loadUintBig(64),
//             tokenType: currentSlice.loadUint(8) === 0 ? 'TON' : 'USDT',
//             referrer: null,
//             isActive: true,
//           };
          
//           // Check if stake is still active
//           const now = Math.floor(Date.now() / 1000);
//           const stakeEndTime = Number(stake.startTime) + stake.duration;
//           stake.isActive = now < stakeEndTime;
          
//           stakes.push(stake);
          
//         } catch (error) {
//           console.error(`Error parsing stake ${stakeId} in linear method:`, error);
//           break;
//         }
//       }
//     } catch (error) {
//       console.error(`Linear parsing failed for ${userAddress}:`, error);
//     }
    
//     return stakes;
//   }

//   // Parse individual stake from cell
//   private parseStakeFromCell(stakeId: number, stakeCell: Cell): StakeInfo | null {
//     try {
//       const slice = stakeCell.beginParse();
      
//       // Check available bits before reading
//       const availableBits = slice.remainingBits;
//       const requiredBits = 64 + 64 + 32 + 1 + 64 + 8; // amount + startTime + duration + autoRestake + lastReward + tokenType
      
//       if (availableBits < requiredBits) {
//         console.warn(`Stake ${stakeId}: Insufficient bits. Required: ${requiredBits}, Available: ${availableBits}`);
//         return null;
//       }

//       const stake: StakeInfo = {
//         id: stakeId,
//         amount: slice.loadUintBig(64),
//         startTime: slice.loadUintBig(64),
//         duration: slice.loadUint(32),
//         autoRestake: slice.loadBit(),
//         lastRewardTime: slice.loadUintBig(64),
//         tokenType: slice.loadUint(8) === 0 ? 'TON' : 'USDT',
//         referrer: null,
//         isActive: true,
//       };

//       // Try to load referrer if there are remaining bits/refs
//       if (slice.remainingRefs > 0) {
//         try {
//           const referrerAddress = slice.loadAddress();
//           stake.referrer = referrerAddress?.toString() || null;
//         } catch (e) {
//           // Referrer might be null, that's okay
//           stake.referrer = null;
//         }
//       }

//       // Determine if stake is still active
//       const now = Math.floor(Date.now() / 1000);
//       const stakeEndTime = Number(stake.startTime) + stake.duration;
//       stake.isActive = now < stakeEndTime;

//       return stake;
      
//     } catch (error) {
//       console.error(`Error parsing stake ${stakeId}:`, error);
//       return null;
//     }
//   }

//   // Calculate rewards for stakes
//   private calculateStakeRewards(stakes: StakeInfo[]): StakeInfo[] {
//     const now = Math.floor(Date.now() / 1000);
    
//     return stakes.map(stake => {
//       if (!stake.isActive) {
//         return { ...stake, pendingRewards: 0n };
//       }

//       const timeSinceLastReward = BigInt(now) - stake.lastRewardTime;
      
//       // Only calculate rewards if it's been at least 24 hours (86400 seconds)
//       if (timeSinceLastReward < 86400n) {
//         return { ...stake, pendingRewards: 0n };
//       }
      
//       // Calculate daily rewards based on stake type and amount
//       // TON: 0.027% daily (10% APY)
//       // USDT: 0.033% daily (12% APY)
//       const dailyRate = stake.tokenType === 'TON' ? 27n : 33n; // basis points per day
//       const daysElapsed = timeSinceLastReward / 86400n;
      
//       const pendingRewards = (stake.amount * dailyRate * daysElapsed) / 1000000n; // Divide by 1M to get from basis points
      
//       return { ...stake, pendingRewards };
//     });
//   }

//   // Process distribution for a specific user and stake
//   async distributeRewards(userAddress: string, stakeId: number, amount: bigint): Promise<boolean> {
//     try {
//       console.info(`Distributing ${amount} rewards to ${userAddress} for stake ${stakeId}`);
      
//       // Here you would implement the actual reward distribution logic
//       // This might involve sending transactions to the contract or updating state
      
//       // For now, just log the action
//       console.info(`Reward distribution completed for ${userAddress}`);
//       return true;
      
//     } catch (error) {
//       console.error(`Error distributing rewards to ${userAddress}:`, error);
//       return false;
//     }
//   }

//   // Main distribution process
//   async processDistributions(): Promise<void> {
//     console.debug('Processing pending distributions...');
    
//     try {
//       const usersWithRewards = await this.scanForPendingRewards();
      
//       if (usersWithRewards.length === 0) {
//         console.debug('No pending distributions found');
//         return;
//       }
      
//       console.info(`Processing distributions for ${usersWithRewards.length} users`);
      
//       for (const user of usersWithRewards) {
//         for (const stake of user.stakes) {
//           if (stake.pendingRewards && stake.pendingRewards > 0n) {
//             await this.distributeRewards(user.address, stake.id, stake.pendingRewards);
//           }
//         }
//       }
      
//     } catch (error) {
//       console.error('Error processing distributions:', error);
//     }
//   }
// }

// export { DistributionService, StakeInfo, UserData };


// src/services/distributionService.ts

import {
    Cell, Address, TupleBuilder, Dictionary, Slice, beginCell, Sender, toNano, fromNano, TupleReader, TupleItem
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
                        await new Promise(resolve => setTimeout(resolve, 2000));
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
                    usersWithPendingRewards.push({ ...userData, stakes: dueStakes });
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

        await this.distributorWallet.send({
            seqno,
            secretKey: this.secretKey,
            messages: [{
                info: {
                    type: 'internal',
                    dest: this.contractAddress,
                    value: toNano('0.1'),
                    bounce: true,
                },
                body: messageBody,
            }]
        } as any);
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

    // Updated getUserData method based on the working App.jsx parsing
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

            // Parse stakes from index 12 - this is where the issue was
            const stakes: StakeInfo[] = [];
            if (tupleItems[12] && tupleItems[12].type === 'cell') {
                try {
                    const stakesDict = tupleItems[12].cell.asSlice().loadDict(
                        Dictionary.Keys.Int(16), 
                        stakeInfoValueParser
                    );
                    
                    console.log(`User ${userAddress.toString()}: Found stakes dictionary with ${stakesDict.size} entries`);
                    
                    for (const [stakeId, stakeValue] of stakesDict) {
                        const stake: StakeInfo = {
                            id: stakeId,
                            amount: stakeValue.amount,
                            startTime: stakeValue.startTime,
                            duration: stakeValue.duration,
                            vipClass: stakeValue.vipClass,
                            autoRestake: stakeValue.autoRestake,
                            lastClaim: stakeValue.lastClaim,
                            totalClaimed: stakeValue.totalClaimed,
                            isActive: stakeValue.isActive,
                            tokenType: stakeValue.stakedAsset === 0 ? 'TON' : 'USDT',
                            pendingRewards: 0n,
                        };
                        stakes.push(stake);
                        
                        console.log(`  Stake ${stakeId}: ${stake.tokenType}, Amount=${fromNano(stake.amount)}, Active=${stake.isActive}, LastClaim=${new Date(Number(stake.lastClaim) * 1000).toISOString()}`);
                    }
                } catch (e) {
                    console.log(`User ${userAddress.toString()}: Error parsing stakes dictionary:`, e);
                }
            } else if (Array.isArray(tupleItems[12])) {
                console.log(`User ${userAddress.toString()}: Stakes is an empty array`);
            } else {
                console.log(`User ${userAddress.toString()}: No stakes data or unexpected format`);
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

    private safeParseInt(item: any, defaultValue: bigint = 0n): bigint {
        if (!item) return defaultValue;
        if (item.type === 'int') return item.value;
        if (typeof item === 'bigint') return item;
        if (typeof item === 'number') return BigInt(item);
        return defaultValue;
    }
}

export { DistributionService };