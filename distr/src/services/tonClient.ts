// src/services/tonClient.ts
import { TonClient, Address, Cell, beginCell, toNano, WalletContractV4, internal, Dictionary } from '@ton/ton';
import { KeyPair, mnemonicToWalletKey } from '@ton/crypto';
import { logger } from '../utils/logger';
import { withRetry } from '../utils/retryWrapper';
import { config } from '../config';

export class TonClientService {
  private client: TonClient;
  private keyPair!: KeyPair;
  private wallet!: WalletContractV4;
  private distributorAddress!: Address;

  constructor() {
    this.client = new TonClient({
      endpoint: config.tonEndpoint,
      apiKey: config.apiKey,
        timeout: 30000,
    });
    this.initializeWallet(); 
  }

  private async initializeWallet(): Promise<void> {
    try {
      const mnemonic = config.distributorPrivateKey.split(' ');
      this.keyPair = await mnemonicToWalletKey(mnemonic);
      this.wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: this.keyPair.publicKey
      });
      this.distributorAddress = this.wallet.address;
      
      logger.info(`Distributor wallet initialized: ${this.distributorAddress.toString()}`);
    } catch (error: any) {
      logger.error('Failed to initialize wallet:', error);
      throw error;
    }
  }

  async getContractState(): Promise<any> {
    try {
      const contractAddress = Address.parse(config.contractAddress);
      const state = await this.client.getContractState(contractAddress);
      return state;
    } catch (error: any) {
      logger.error('Failed to get contract state:', error);
      throw error;
    }
  }

async getUserInfo(userAddress: string): Promise<any> {
  try {
    return await withRetry(async () => {
      const contractAddress = Address.parse(config.contractAddress);
      const userAddr = Address.parse(userAddress);
      
      const result = await this.client.runMethod(contractAddress, 'getUserInfo', [
        { type: 'slice', cell: beginCell().storeAddress(userAddr).endCell() }
      ]);
      
      return result;
    }, {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 10000,
      backoffMultiplier: 2
    }, `getUserInfo for ${userAddress}`);
  } catch (error: any) {
    logger.error(`Failed to get user info for ${userAddress}:`, error);
    return null;
  }
}

async sendDistributionMessage(userAddress: string, stakeId: number): Promise<string> {
  try {
    const contractAddress = Address.parse(config.contractAddress);
    const userAddr = Address.parse(userAddress);

    const messageBody = beginCell()
      .storeUint(0x2b5d4c2e, 32)
      .storeAddress(userAddr)
      .storeUint(stakeId, 16)
      .endCell();

    const walletClient = this.client.open(this.wallet);
    let seqno = await walletClient.getSeqno() || 0;

    await walletClient.sendTransfer({
      seqno,
      secretKey: this.keyPair.secretKey,
      messages: [internal({
        to: contractAddress,
        value: toNano(config.gasLimit.toString()),
        body: messageBody,
        bounce: true
      })]
    });

    let currentSeqno = seqno;
    while (currentSeqno === seqno) {
      logger.debug('Waiting for transaction to confirm...');
      await this.delay(1500);
      currentSeqno = await walletClient.getSeqno() || 0;
    }

    const txs = await this.client.getTransactions(this.distributorAddress, { limit: 1 });
    if (txs.length === 0) {
      throw new Error('Failed to retrieve transaction hash');
    }

    const txHash = txs[0].hash().toString('hex');
    logger.info(`Distribution message sent for user ${userAddress}, stake ${stakeId}. TX: ${txHash}`);
    
    return txHash;
  } catch (error: any) {
    logger.error(`Failed to send distribution message for ${userAddress}:`, error);
    throw error;
  }
}

  async getPlatformStats(): Promise<{ totalUsers: number, totalStakedTon: bigint, totalStakedUsdt: bigint, totalDistributed: bigint, activeStakes: number }> {
    try {
      const contractAddress = Address.parse(config.contractAddress);
      const result = await this.client.runMethod(contractAddress, 'getPlatformStats', []);
      const stack = result.stack;
      const totalUsers = Number(stack.readBigNumber());
      const totalStakedTon = stack.readBigNumber();
      const totalStakedUsdt = stack.readBigNumber();
      const totalDistributed = stack.readBigNumber();
      const activeStakes = Number(stack.readBigNumber());
      return { totalUsers, totalStakedTon, totalStakedUsdt, totalDistributed, activeStakes };
    } catch (error: any) {
      logger.error('Failed to get platform stats:', error);
      throw error;
    }
  }

  async getUserByIndex(index: number): Promise<string | null> {
    try {
      const contractAddress = Address.parse(config.contractAddress);
      const result = await this.client.runMethod(contractAddress, 'getUserAddressByIndex', [
        { type: 'int', value: BigInt(index) }
      ]);
      
      if (result.stack.remaining === 0) return null;
      
      const addressCell = result.stack.readCell();
      const address = addressCell.beginParse().loadAddress();
      return address?.toString() || null;
    } catch (error: any) {
      if (error.message.includes('exit_code: -13')) {
        return null; // Treat out-of-bounds as null
      }
      logger.error(`Failed to get user by index ${index}:`, error);
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}