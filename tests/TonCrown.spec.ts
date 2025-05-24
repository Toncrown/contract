import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import '@ton/test-utils';

describe('TonCrown', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let tonCrown: SandboxContract<TonCrown>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        tonCrown = blockchain.openContract(await TonCrown.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await tonCrown.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            null,
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tonCrown.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and tonCrown are ready to use
    });
});
