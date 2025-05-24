import { toNano } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tonCrown = provider.open(await TonCrown.fromInit());

    await tonCrown.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        null,
    );

    await provider.waitForDeploy(tonCrown.address);

    // run methods on `tonCrown`
}
