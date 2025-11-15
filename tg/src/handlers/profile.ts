// src/bot/handlers/profile.ts
import { getTranslation } from '../types.ts';
import type {BotContext} from '../types.ts';
import { SessionService } from '../services/session.ts';

export async function profileHandler(ctx: BotContext, data?: string): Promise<void> {
  //const { bot, chatId, session } = ctx;

  if (data && data.startsWith('profile_language_')) {
    await handleLanguageChange(ctx, data);
    return;
  }

  await showProfile(ctx);
}

async function showProfile(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;

  const profileText = {
    ru: `👤 *Ваш профиль*\n\n` +
        `🌐 Язык: ${getLanguageName(session.language)}\n` +
        `🛒 Товаров в корзине: ${session.cart.length}\n` +
        `💎 Активных заказов: 0\n\n` +
        `Выберите действие:`,

    tj: `👤 *Профили шумо*\n\n` +
        `🌐 Забон: ${getLanguageName(session.language)}\n` +
        `🛒 Маҳсулотҳо дар ароба: ${session.cart.length}\n` +
        `💎 Фармоишҳои фаъол: 0\n\n` +
        `Амалро интихоб кунед:`,

    uz: `👤 *Sizning profilingiz*\n\n` +
        `🌐 Til: ${getLanguageName(session.language)}\n` +
        `🛒 Savatdagi mahsulotlar: ${session.cart.length}\n` +
        `💎 Faol buyurtmalar: 0\n\n` +
        `Harakatni tanlang:`
  };

  const text = profileText[session.language] || profileText.ru;

  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🌐 Сменить язык / Забонро иваз кунед / Tilni o‘zgartirish', callback_data: 'profile_language' }],
        [{ text: getTranslation(session, 'back'), callback_data: 'categories' }]
      ]
    }
  });
}

async function handleLanguageChange(ctx: BotContext, data: string): Promise<void> {
  const { bot, chatId, session } = ctx;

  if (data === 'profile_language') {
    // Показываем выбор языка
    await bot.sendMessage(chatId, '🌐 Выберите язык / Забонро интихоб кунед / Tilni tanlang:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇷🇺 Русский', callback_data: 'profile_language_ru' }],
          [{ text: '🇹🇯 Тоҷикӣ', callback_data: 'profile_language_tj' }],
          [{ text: '🇺🇿 Oʻzbekcha', callback_data: 'profile_language_uz' }],
          [{ text: getTranslation(session, 'back'), callback_data: 'profile' }]
        ]
      }
    });
    return;
  }

  // Меняем язык
  const newLanguage = data.replace('profile_language_', '') as 'ru' | 'tj' | 'uz';
  SessionService.updateSession(chatId, { language: newLanguage });

  const successText = {
    ru: '✅ Язык изменен на Русский!',
    tj: '✅ Забон ба Тоҷикӣ иваз шуд!',
    uz: '✅ Til Oʻzbekchaga o‘zgartirildi!'
  };

  await bot.sendMessage(chatId, successText[newLanguage], {
    reply_markup: {
      keyboard: [
        [getTranslation({ language: newLanguage } as any, 'categories'), getTranslation({ language: newLanguage } as any, 'search')],
        [getTranslation({ language: newLanguage } as any, 'cart'), getTranslation({ language: newLanguage } as any, 'orders')],
        [getTranslation({ language: newLanguage } as any, 'profile'), getTranslation({ language: newLanguage } as any, 'about')]
      ],
      resize_keyboard: true
    }
  });
}

function getLanguageName(lang: string): string {
  const names: any = {
    ru: '🇷🇺 Русский',
    tj: '🇹🇯 Тоҷикӣ', 
    uz: '🇺🇿 Oʻzbekcha'
  };
  return names[lang] || '🇷🇺 Русский';
}