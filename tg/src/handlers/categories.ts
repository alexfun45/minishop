import { getTranslation } from '../types.ts';
import type {BotContext} from '../types.ts';
import { apiClient } from '../services/api.ts';
import { SessionService } from '../services/session.ts';

export async function categoriesHandler(ctx: BotContext, data?: string): Promise<void> {
  //const { bot, chatId, session} = ctx;

  if (data && data.startsWith('category_')) {
    const categoryId = parseInt(data.replace('category_', ''));
    await showCategoryProducts(ctx, categoryId);
    return;
  }

  await showCategories(ctx);
}

async function showCategories(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;

  try {
    const categories = await apiClient.getCategories(session.language);
    
    if (categories.length === 0) {
      await bot.sendMessage(chatId, getTranslation(session, 'emptyCategories'));
      return;
    }

    const keyboard = categories.map((category: any) => [
      {
        text: `📁 ${category.name}`,
        callback_data: `category_${category.id}`
      }
    ]);

    await bot.sendMessage(
      chatId,
      getTranslation(session, 'chooseCategory'),
      {
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );
  } catch (error) {
    console.error('Categories error:', error);
    await bot.sendMessage(chatId, getTranslation(session, 'error'));
  }
}

async function showCategoryProducts(ctx: BotContext, categoryId: number): Promise<void> {
  const { bot, chatId, session } = ctx;

  try {
    const products = await apiClient.getProductsByCategory(categoryId, session.language);
    
    if (products.length === 0) {
      await bot.sendMessage(chatId, getNoProductsText(session.language));
      return;
    }

    SessionService.updateSession(chatId, { currentCategory: categoryId });

    let message = getProductsListText(session.language) + '\n\n';
    
    products.forEach((product: any, index: number) => {
      message += `${index + 1}. ${product.name} - ${product.price} ₽\n`;
      if (product.description) {
        message += `   ${product.description}\n`;
      }
      message += '\n';
    });

    const keyboard = products.map((product: any) => [
      {
        text: `🛒 ${product.name} - ${product.price} ₽`,
        callback_data: `product_${product.id}`
      }
    ]);

    keyboard.push([{ 
      text: getTranslation(session, 'back'), 
      callback_data: 'categories' 
    }]);

    await bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    console.error('Show category products error:', error);
    await bot.sendMessage(chatId, getTranslation(session, 'error'));
  }
}

function getNoProductsText(language: string): string {
  const texts: any = {
    ru: '📭 В этой категории пока нет товаров.',
    tj: '📭 Дар ин категория ҳоло маҳсулот нест.',
    uz: '📭 Ushbu toifada hozircha mahsulotlar yo‘q.'
  };
  return texts[language] || texts.ru;
}

function getProductsListText(language: string): string {
  const texts: any = {
    ru: '📦 Товары в категории:',
    tj: '📦 Маҳсулотҳо дар категория:',
    uz: '📦 Toifadagi mahsulotlar:'
  };
  return texts[language] || texts.ru;
}