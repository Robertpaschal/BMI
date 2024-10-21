const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: require('path').resolve(__dirname, '../', envFile) });

const Redis = require('ioredis');
let instance = null; // Singleton instance to ensure only one connection

class RedisClient {
  constructor() {
    if (!instance) {
      this.client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error', err);
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
      });

      instance = this;  // Save this instance to avoid redundant connections
    } else {
      return instance;
    }
  }

  async reconnect() {
    if (!(await this.isAlive())) {
      await this.client.quit();
      this.client = redis.createClient({ url: process.env.REDIS_URL });
      this.client.on('error', (err) => console.error('Redis Client Error', err));
      await this.client.connect().catch((err) => {
        console.error('Redis Reconnection Error', err);
      });
    }
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch (err) {
      console.error('Redis GET Error:', err);
    }
  }

  async set(key, value, duration) {
    try {
      await this.client.set(key, value, 'EX', duration);
    } catch (err) {
      console.error('Redis SET Error:', err);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error('Redis DEL Error:', err);
    }
  }

  async close() {
    await this.client.quit();
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
