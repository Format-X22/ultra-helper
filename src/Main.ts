import { Telegram } from './Telegram';

const config: {
    telegram: {
        owner: number;
        key: string;
    };
} = require('../config.json');

if (!config.telegram.key.length) {
    console.error('Empty telegram config');
    process.exit(1);
}

new Telegram(config.telegram.key, config.telegram.owner);
