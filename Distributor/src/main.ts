import cron from 'node-cron';
import { config } from './config';
import { runDistributionCycle } from './distributor';

console.log('TonCrown Distributor Service starting...');
console.log(`Cron schedule set to: "${config.cronSchedule}"`);

if (!cron.validate(config.cronSchedule)) {
    console.error('Invalid cron schedule in .env file. Please check the format. Exiting.');
    process.exit(1);
}

// RUN ONCE IMMEDIATELY ON STARTUP
console.log('Running an initial distribution cycle on startup...');
runDistributionCycle();

// SCHEDULED RUNS BASED ON CRON SCHEDULE
cron.schedule(config.cronSchedule, () => {
    console.log(`Cron job triggered by schedule. Running the distribution cycle now.`);
    runDistributionCycle();
});

console.log('Service is running and waiting for the next scheduled execution.');