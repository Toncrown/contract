import { toNano, Address } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown'; // Ensure this path is correct based on your build output
import { NetworkProvider, compile } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const ownerAddress = sender.address;
    if (!ownerAddress) {
        throw new Error("Cannot get sender address from provider.");
    }

    console.log(`Deploying TonCrown contract...`);
    console.log(`Owner/Deployer Address: ${ownerAddress.toString()}`);

    // Compile the contract to get the latest code cell
    // This is optional if your build process is reliable, but good for certainty
    await compile('TonCrown'); 

    // Create the contract instance with fromInit to get the stateInit
    const tonCrown = provider.open(
        await TonCrown.fromInit(ownerAddress)
    );

    console.log(`New contract address will be: ${tonCrown.address.toString()}`);
    console.log("Sending deployment transaction...");

    // Send the deployment transaction
    await tonCrown.send(
        sender,
        {
            value: toNano('0.5'), // Send enough TON for gas and initial balance
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    // Wait for the transaction to be confirmed and the contract to appear on-chain
    console.log('Waiting for contract deployment to be confirmed...');
    await provider.waitForDeploy(tonCrown.address);

    console.log('Contract deployed successfully!');
    console.log('Deployment Summary:');
    console.log('Contract: TonCrown');
    console.log(`Address: ${tonCrown.address.toString()}`);
    console.log(`Owner: ${ownerAddress.toString()}`);
    console.log(`Network: ${provider.network()}`);
}