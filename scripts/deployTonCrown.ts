import { toNano } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Get the deployer's address as the owner
    const owner = provider.sender().address!;
    
    console.log('Deploying TonCrown contract...');
    console.log('Owner address:', owner.toString());
    
    // Initialize the contract with the owner address
    const tonCrown = provider.open(
        await TonCrown.fromInit(owner)
    );
    
    console.log('Contract address:', tonCrown.address.toString());
    
    // Deploy the contract
    await tonCrown.send(
        provider.sender(),
        {
            value: toNano('0.1'), // Increased deployment fee for contract complexity
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );
    
    console.log('Waiting for contract deployment...');
    await provider.waitForDeploy(tonCrown.address);
    
    console.log('✅ Contract deployed successfully!');
    
    // Optional: Test some view functions after deployment
    try {
        const platformStats = await tonCrown.getGetPlatformStats();
        console.log('Platform stats:', {
            totalUsers: platformStats.totalUsers.toString(),
            totalStaked: platformStats.totalStaked.toString(),
            totalDistributed: platformStats.totalDistributed.toString(),
            activeStakes: platformStats.activeStakes.toString()
        });
        
        const isPaused = await tonCrown.getIsPaused();
        console.log('Contract paused:', isPaused);
        
        // Check some level costs
        const level1Cost = await tonCrown.getGetLevelCost(1n);
        const level5Cost = await tonCrown.getGetLevelCost(5n);
        console.log('Level costs:', {
            level1: level1Cost?.toString() + ' nanoTON',
            level5: level5Cost?.toString() + ' nanoTON'
        });
        
        // Check creator wallets
        const wallet1 = await tonCrown.getGetCreatorWallet(1n);
        const wallet2 = await tonCrown.getGetCreatorWallet(2n);
        const wallet3 = await tonCrown.getGetCreatorWallet(3n);
        console.log('Creator wallets:', {
            wallet1: wallet1?.toString(),
            wallet2: wallet2?.toString(),
            wallet3: wallet3?.toString()
        });
        
    } catch (error) {
        console.log('Note: Some view functions may not be available immediately after deployment');
        console.log('Error details:', error);
    }
    
    console.log('\n📋 Deployment Summary:');
    console.log('Contract: TonCrown');
    console.log('Address:', tonCrown.address.toString());
    console.log('Owner:', owner.toString());
    console.log('Network:', provider.network());
    
    return tonCrown;
}