import { createClient } from 'redis';

const redisClient = createClient();

redisClient.on('error', (err) => console.error('Redis Client Error', err));

if (!redisClient.isOpen) {
  redisClient.connect();
}

export default redisClient