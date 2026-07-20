import type { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import {Redis} from 'ioredis';

const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  enableOfflineQueue: false,
});

// Настраиваем лимит (например, 500 символов — этого с головой хватит для любого вопроса про товары)
const MAX_AI_PROMPT_LENGTH = 500;

// Настройка: Не более 5 запросов за 15 секунд с одного IP/userId
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ratelimit_ai',
  points: 5,
  duration: 15,
});

export const aiRateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
   
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const key = req.body?.userId ? `user:${req.body.userId}` : `ip:${ip}`;
    
    await rateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    console.error(rejRes)
    // Если лимит превышен
    if (rejRes && typeof rejRes.msBeforeNext === 'number') {
      const secondsToWait = Math.ceil(rejRes.msBeforeNext / 1000) || 1;

      return res.status(429).json({ 
        success: false, 
        error: `Вы отправляете сообщения слишком часто. Пожалуйста, подождите ${secondsToWait} сек.` 
      });
    }

    console.error('CRITICAL: Redis Rate Limiter failed, skipping check:', rejRes?.message || rejRes);
    next();

  }
}; 

export const checkAiMessageLength = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {

  const userText = req.body?.message || req.body?.prompt || req.body?.text;

  if (typeof userText !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Запрос должен содержать текстовое сообщение.' 
    });
  }

  const trimmedText = userText.trim();

  // 2. Проверяем на пустую строку или одни пробелы
  if (trimmedText.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Сообщение не может быть пустым.' 
    });
  }

  // 3. Главная проверка на предельную длину
  if (trimmedText.length > MAX_AI_PROMPT_LENGTH) {
    return res.status(400).json({ 
      success: false, 
      error: `Сообщение слишком длинное (максимум ${MAX_AI_PROMPT_LENGTH} символов). Пожалуйста, сократите вопрос.` 
    });
  }

  // Записываем очищенный текст обратно в req.body, чтобы дальше передать чистые данные
  req.body.message = trimmedText;

  // Если всё хорошо — передаем управление дальше в контроллер AI
  next();
};