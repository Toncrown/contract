import { TonClient } from '@ton/ton';
import { config } from './config';

export const client = new TonClient({
    endpoint: config.toncenterEndpoint,
    apiKey: config.toncenterApiKey,
});