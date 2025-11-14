/ README.md
# TonCrown Auto Distribution Service

An automated off-chain service for distributing staking rewards in the TonCrown smart contract.

## Features

- **Automated Scanning**: Regularly scans all users for pending staking rewards
- **Reliable Distribution**: Handles reward distribution with retry mechanisms
- **Job Queue Management**: SQLite-based job queue for reliable processing
- **Comprehensive Logging**: Detailed logging for monitoring and debugging
- **Error Handling**: Robust error handling with configurable retry limits
- **Statistics**: Real-time statistics and monitoring capabilities

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables in `.env`:
   - `CONTRACT_ADDRESS`: Your TonCrown contract address
   - `DISTRIBUTOR_PRIVATE_KEY`: Mnemonic words for the distributor wallet
   - `TON_ENDPOINT`: TON network endpoint
   - Other configuration options...

4. Build the project:
   ```bash
   npm run build
   ```

5. Start the service:
   ```bash
   npm start
   ```

## How It Works

1. **Scanning Phase**: Every hour (configurable), the service scans all registered users
2. **Reward Calculation**: Calculates pending rewards based on stake info and VIP class
3. **Job Scheduling**: Creates distribution jobs for users with claimable rewards
4. **Processing Phase**: Every 5 minutes, processes pending distribution jobs
5. **Transaction Execution**: Sends `DistributeDailyRewards` messages to the contract
6. **Monitoring**: Continuous logging and statistics collection

## Configuration

The service is highly configurable through environment variables:

- `CHECK_INTERVAL`: How often to scan for rewards (minutes)
- `MAX_RETRIES`: Maximum retry attempts for failed distributions
- `GAS_LIMIT`: Gas limit for distribution transactions
- `MIN_REWARD_THRESHOLD`: Minimum reward amount to trigger distribution

## Monitoring

The service provides comprehensive logging and statistics:
- Transaction logs with success/failure details
- Daily statistics on distribution performance
- Error tracking and retry information
- Database cleanup for maintenance

## Production Deployment

For production deployment:
1. Use a process manager like PM2
2. Set up log rotation
3. Monitor the service health
4. Ensure the distributor wallet has sufficient TON balance
5. Set up alerts for failed distributions

## Safety Features

- Duplicate job prevention
- Transaction retry with exponential backoff
- Comprehensive error logging
- Database integrity checks
- Graceful shutdown handling