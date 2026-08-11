const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'savory-money-sunstruck-30179.db.redis.io',
        port: 10169
    }
});

module.exports= redisClient;