// src/bot/handlers/search.ts
import { getTranslation } from '../types.ts';
import type {BotContext} from '../types.ts';
import { apiClient } from '../services/api.ts';

export async function searchHandler(ctx: BotContext, query?: string): Promise<void> {
  const { bot, chatId, session } = ctx;

  if (!query) {
    await bot.sendMessage(chatId, getSearchPromptText(session.language));
    return;
  }

  await handleSearch(ctx, query);
}

async function handleSearch(ctx: BotContext, query: string): Promise<void> {
  const { bot, chatId, session } = ctx;

  try {
    const products = await apiClient.searchProducts(query, session.language);
    
    if (products.length > 0) {
      let message = getSearchResultsText(session.language, query) + '\n\n';
      
      products.forEach((product: any, index: number) => {
        message += `${index + 1}. ${product.name} - ${product.price} ₽\n`;
      });
      
      message += `\n${getSearchFooterText(session.language)}`;
      
      await bot.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: getTranslation(session, 'categories'), callback_data: 'categories' }]
          ]
        }
      });
    } else {
      await bot.sendMessage(
        chatId,
        getNoResultsText(session.language, query),
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: getTranslation(session, 'categories'), callback_data: 'categories' }]
            ]
          }
        }
      );
    }
  } catch (error) {
    console.error('Search error:', error);
    await bot.sendMessage(chatId, getTranslation(session, 'error'));
  }
}

function getSearchPromptText(language: string): string {
  const texts: any = {
    ru: 'Введите название товара для поиска:',
    tj: 'Барои ҷустуҷӯ номи маҳсулотро ворид кунед:',
    uz: 'Qidiruv uchun mahsulot nomini kiriting:'
  };
  return texts[language] || texts.ru;
}

function getSearchResultsText(language: string, query: string): string {
  const texts: any = {
    ru: `🔍 Результаты поиска по запросу "${query}":`,
    tj: `🔍 Натиҷаҳои ҷустуҷӯ барои "${query}":`,
    uz: `🔍 "${query}" so‘rovi bo‘yicha qidiruv natijalari:`
  };
  return texts[language] || texts.ru;
}

function getSearchFooterText(language: string): string {
  const texts: any = {
    ru: 'Нажмите на категорию чтобы посмотреть все товары.',
    tj: 'Барои дидани ҳама маҳсулотҳо категорияро пахш кунед.',
    uz: 'Barcha mahsulotlarni ko‘rish uchun toifani bosing.'
  };
  return texts[language] || texts.ru;
}

function getNoResultsText(language: string, query: string): string {
  const texts: any = {
    ru: `😔 По запросу "${query}" ничего не найдено.\nПопробуйте изменить запрос или посмотрите все категории.`,
    tj: `😔 Барои "${query}" чизе ёфт нашуд.\nДархостро тағйир диҳед ё ҳама категорияҳоро бубинед.`,
    uz: `😔 "${query}" so‘rovi bo‘yicha hech narsa topilmadi.\nSo‘rovni o‘zgartiring yoki barcha toifalarni ko‘ring.`
  };
  return texts[language] || texts.ru;
}