import dotenv from 'dotenv';
import config from 'config';

// Load .env file
dotenv.config();

console.log('Loaded ENV variables:');
console.log(process.env.COMPASS_URL);
console.log(process.env.OCEANBASE_URL);

console.log('\nLoaded config:');
console.log(config); 