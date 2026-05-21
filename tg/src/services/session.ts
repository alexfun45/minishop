
import NodeCache from 'node-cache';
import { createClient } from 'redis';
import type { UserSession } from '../types.ts';

//const userCache = new NodeCache({ stdTTL: 3600 }); // 1 час
const redisClient = createClient();

redisClient.on('error', (err) => console.error('Redis Client Error', err));

if (!redisClient.isOpen) {
  redisClient.connect();
}

const SESSION_TTL = 3600*24;

export class SessionService {

  private static getKey(chatId: number): string {
    return `session:${chatId}`;
  }

  static async getUserSession(chatId: number): Promise<UserSession> {
    const key = this.getKey(chatId);
    const data = await redisClient.get(key);

    if (!data) {
      const defaultSession: UserSession = {
        cart: [],
        userPhone: '',
        userId: 0,
        language: 'ru'
      };
      // Сохраняем и сразу задаем TTL (время жизни кэша)
      await redisClient.setEx(key, SESSION_TTL, JSON.stringify(defaultSession));
      return defaultSession;
    }

    return JSON.parse(data) as UserSession;
  }

  static async saveUserSession(chatId: number, session: UserSession): Promise<void> {
    const key = this.getKey(chatId);
    await redisClient.setEx(key, SESSION_TTL, JSON.stringify(session));
  }

  static async updateSession(chatId: number, updates: Partial<UserSession>): Promise<UserSession> {
    const session = await this.getUserSession(chatId);
    const updatedSession = { ...session, ...updates };
    await this.saveUserSession(chatId, updatedSession);
    return updatedSession;
  }
  
}