// src/bot/services/session.ts
import NodeCache from 'node-cache';
import type { UserSession } from '../types.ts';

const userCache = new NodeCache({ stdTTL: 3600 }); // 1 час

export class SessionService {
  static getUserSession(chatId: number): UserSession {
    let session: any = userCache.get<UserSession>(chatId.toString());
    if (!session) {
      session = {
        cart: [],
        language: 'ru'
      };
      userCache.set(chatId.toString(), session);
    }
    return session;
  }

  static saveUserSession(chatId: number, session: UserSession): void {
    userCache.set(chatId.toString(), session);
  }

  static updateSession(chatId: number, updates: Partial<UserSession>): UserSession {
    const session = this.getUserSession(chatId);
    const updatedSession = { ...session, ...updates };
    this.saveUserSession(chatId, updatedSession);
    return updatedSession;
  }
}