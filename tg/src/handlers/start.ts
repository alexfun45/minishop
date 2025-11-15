// src/bot/handlers/start.ts
import type {BotContext} from '../types.ts'
import {getTranslation} from '../types.ts'
import { SessionService } from '../services/session.ts'

export async function startHandler(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;

  // Сбрасываем сессию при старте
  const newSession = SessionService.updateSession(chatId, {
    cart: [], 
    language: 'ru',
    checkoutStep: undefined,
    tempOrder: undefined
  });

  const welcomeMessage = getTranslation(newSession, 'welcome');

  await bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      keyboard: [
        [getTranslation(newSession, 'categories'), getTranslation(newSession, 'search')],
        [getTranslation(newSession, 'cart'), getTranslation(newSession, 'orders')],
        [getTranslation(newSession, 'profile'), getTranslation(newSession, 'about')]
      ],
      resize_keyboard: true
    }
  });
}