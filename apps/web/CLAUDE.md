@AGENTS.md

https://github.com/redis/ioredis

Укажите REDIS_URL в .env.local, например: REDIS_URL=redis://:password@127.0.0.1:6379/0

Пример 1 — pages/api (JavaScript)

name=pages/api/example.js
import Redis from 'ioredis';

if (!global.__redis) {
// Создаём один глобальный экземпляр (предотвращает дублирование в dev)
global.__redis = new Redis(process.env.REDIS_URL);
}
const redis = global.__redis;

export default async function handler(req, res) {
try {
const key = 'example_key';
const value = await redis.get(key);
if (!value) {
await redis.set(key, 'hello from redis', 'EX', 60);
return res.status(200).json({ ok: true, created: true, value: 'hello from redis' });
}
return res.status(200).json({ ok: true, created: false, value });
} catch (err) {
console.error('Redis error', err);
return res.status(500).json({ ok: false, error: 'Redis error' });
}
}