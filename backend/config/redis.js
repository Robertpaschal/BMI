const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: require('path').resolve(__dirname, '../', envFile) });

const redis = require('redis');
const { promisify } = require('util');

console.log('Redis URL:', process.env.REDIS_URL);
class RedisClient {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL,
      tls: {}
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.get = promisify(this.client.get).bind(this.client);
    this.client.set = promisify(this.client.set).bind(this.client);
    this.client.del = promisify(this.client.del).bind(this.client);
  }

  async isAlive() {
    if (this.client && this.client.connected) {
        return true;
    }
    return new Promise((resolve, reject) => {
      this.client.ping((err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response === 'PONG');
        }
      });
    });
  }

  async reconnect() {
    if (!(await this.isAlive())) {
      this.client.quit();
      this.client = redis.createClient({ url: process.env.REDIS_URL });
      this.client.on('error', (err) => console.error('Redis Client Error', err));
      this.client.get = promisify(this.client.get).bind(this.client);
      this.client.set = promisify(this.client.set).bind(this.client);
      this.client.del = promisify(this.client.del).bind(this.client);
    }
  }

  async get(key) {
    return this.client.get(key);
  }

  async set(key, value, duration) {
    this.client.set(key, value, 'EX', duration);
  }

  async del(key) {
   this.client.del(key);
  }

  async close() {
    this.client.quit();
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
