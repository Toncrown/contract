import { Address, internal, WalletContractV4, toNano } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { client } from './ton-client';
import { config } from './config';
import { TonCrown, DistributeDailyRewards } from './wrapper/TonCrown_TonCrown';

// HELPER FUNCTION TO ADD DELAY BETWEEN TXS
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function runDistributionCycle() {
    console.log(`[${new Date().toISOString()}] Starting new distribution cycle...`);

    try {
        // INITIALIZE THE DISTRIBUTOR WALLET
        const keyPair = await mnemonicToPrivateKey(config.distributorMnemonic);
        const wallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 });
        const walletContract = client.open(wallet);
        console.log(`Distributor wallet address: ${walletContract.address.toString()}`);
        
        // OPEN THE TONCROWN CONTRACT
        const contractAddress = Address.parse(config.contractAddress);
        const contract = client.open(TonCrown.fromAddress(contractAddress));

        // GET PLATFORM STATS TO DETERMINE TOTAL USERS
        const stats = await contract.getGetPlatformStats();
        const totalUsers = stats.totalUsers;
        console.log(`Found ${totalUsers} total users to check.`);

        if (totalUsers === 0n) {
            console.log("No users to process. Ending cycle.");
            return;
        }

        const eligibleTasks: { userAddress: Address; stakeId: bigint }[] = [];

        // ITERATE OVER EACH USER TO CHECK THEIR STAKES
        for (let i = 0; i < totalUsers; i++) {
            const userIndex = BigInt(i);
            try {
                // CALL GETTER TO FETCH USER ADDRESS BY INDEX
                const userAddress = await contract.getGetUserAddressByIndex(userIndex);
                if (!userAddress) {
                    console.warn(` - Warning: No user found at index ${userIndex}. Skipping.`);
                    continue;
                }

                // USE THE USER ADDRESS TO FETCH THEIR INFO
                const userInfo = await contract.getGetUserInfo(userAddress);
                if (!userInfo) {
                    console.warn(` - Warning: Could not retrieve info for user ${userAddress.toString()}. Skipping.`);
                    continue;
                }

                const now = Math.floor(Date.now() / 1000);
                const SECONDS_PER_DAY = 86400;

                // CHECK EACH STAKE FOR ELIGIBILITY
                for (const stakeInfo of userInfo.stakes.values()) {
                    if (stakeInfo.isActive && (now - Number(stakeInfo.lastClaim) >= SECONDS_PER_DAY)) {
                        console.log(`   - Found eligible stake! User: ${userAddress.toString()}, StakeID: ${stakeInfo.stakeId}`);
                        eligibleTasks.push({ userAddress, stakeId: stakeInfo.stakeId });
                    }
                }
            } catch (error: any) {
                console.error(`[ERROR] Failed to process user at index ${userIndex}: ${error.message}`);
            }
        }

        console.log(`Found ${eligibleTasks.length} eligible stakes to distribute.`);
        if (eligibleTasks.length === 0) {
            console.log("No eligible stakes found in this cycle.");
            return;
        }

        // SEQUENTIALLY SEND TRANSACTIONS FOR EACH ELIGIBLE STAKE
        const sender = walletContract.sender(keyPair.secretKey);

        for (const [index, task] of eligibleTasks.entries()) {
            try {
                console.log(`Sending tx ${index + 1}/${eligibleTasks.length} for User: ${task.userAddress.toString()}, StakeID: ${task.stakeId}`);
                
                // Construct the message payload using the typed message from the wrapper
                const message: DistributeDailyRewards = {
                    $$type: 'DistributeDailyRewards',
                    user: task.userAddress,
                    stakeId: task.stakeId
                };
                
                // FIX #2: Use toNano to convert string value to bigint
                await contract.send(sender, { value: toNano("0.1") }, message);
                
                console.log(`   - Transaction sent successfully.`);
                
                // Crucial delay to prevent API rate limiting and blockchain congestion
                await sleep(2000); 

            } catch (error: any) {
                console.error(`[ERROR] Failed to send transaction for User: ${task.userAddress.toString()}, StakeID: ${task.stakeId}: ${error.message}`);
            }
        }
        
    } catch (error: any) {
        console.error(`[FATAL] A critical error occurred during the distribution cycle: ${error.message}`);
    }
    console.log(`[${new Date().toISOString()}] Distribution cycle finished.`);
}