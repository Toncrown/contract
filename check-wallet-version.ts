import { mnemonicToWalletKey } from "@ton/crypto";
import {
    WalletContractV3R2,
    WalletContractV4,
    WalletContractV5R1,
} from "@ton/ton";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const mnemonic = process.env.WALLET_MNEMONIC?.split(" ");

    if (!mnemonic) {
        throw new Error("WALLET_MNEMONIC not found in .env");
    }

    const key = await mnemonicToWalletKey(mnemonic);

    const v3 = WalletContractV3R2.create({
        workchain: 0,
        publicKey: key.publicKey,
    });

    const v4 = WalletContractV4.create({
        workchain: 0,
        publicKey: key.publicKey,
    });

    const v5 = WalletContractV5R1.create({
        workchain: 0,
        publicKey: key.publicKey,
    });

    console.log("V3R2:", v3.address.toString());
    console.log("V4R2:", v4.address.toString());
    console.log("V5R1:", v5.address.toString());
}

main().catch(console.error);