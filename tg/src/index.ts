import TelegramBot from 'node-telegram-bot-api';
import { SessionService } from './services/session.js';
import { startHandler } from './handlers/start.js';
import { categoriesHandler } from './handlers/categories.js';
import {handleCheckoutStep} from './handlers/checkout.js'
import { ProductsHandler } from './handlers/products.js';
import { cartHandler } from './handlers/cart.js';
import * as multi from './lang/multi.js'
import  'dotenv/config'
//import { cartHandler } from './handlers/cart.js';
import { orderHandler } from './handlers/orders.js';
import { profileHandler } from './handlers/profile.js';
import { searchHandler } from './handlers/search.js';
import {aiService} from './services/aiService.js'
import type { BotContext } from './types.js';
import { HttpsProxyAgent } from 'https-proxy-agent';

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
console.log('BOT_TOKEN', BOT_TOKEN);
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is required');
  process.exit(1);
}

const mainMenu = {
  reply_markup: {
    keyboard: [
      ['🛍️ Категории', '🔍 Поиск'],
      ['🛒 Корзина', '📦 Мои заказы'],
      ['ℹ️ О нас']
    ],
    resize_keyboard: true
  }
};

let bot: any;
if (process.env.USE_PROXY === 'true') {
  const proxyAgent = new HttpsProxyAgent('http://user361622:lw0kic@45.159.180.166:1768');
  bot = new TelegramBot(BOT_TOKEN, { 
    polling: true,
    request: {
      agent: proxyAgent
    } as any
  });

  console.log('Запуск бота через прокси...');
} else{
  try{
    bot = new TelegramBot(BOT_TOKEN!, { 
      polling: true
    });
    console.log('Запуск бота напрямую (без прокси)...');
  }
  catch(error){
    console.log('error', error);
  }
}

// Создание контекста для обработчиков
async function createContext(chatId: number, message?: any, callbackQuery?: any): Promise<BotContext> {
  const session = await SessionService.getUserSession(chatId);
  let botContext: BotContext = {
    chatId,
    message,
    callbackQuery,
    session, 
    bot
  }
  return botContext;
}

// Обработчик команды /start
bot.onText(/\/start/, async (msg: any) => {
  const ctx = await createContext(msg.chat.id, msg);
  await startHandler(ctx);
});

// Обработчик текстовых сообщений
bot.on('message', async (msg: any) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  const ctx = await createContext(chatId, msg);
  const session = ctx.session;

  if (session.checkoutStep) {
    await handleCheckoutStep(ctx, msg);
    return;
  }

  // Пропускаем команды
  if (text.startsWith('/')) return;

  // Обработка в зависимости от текста
  switch (text) {
    case '🛍️ Категории':
    case '🛍️ Категорияҳо':
    case '🛍️ Toifalar':
      await categoriesHandler(ctx);
      break;
    case '🔍 Поиск':
    case '🔍 Ҷустуҷӯ':
    case '🔍 Qidiruv':
      await searchHandler(ctx);
      break;
    case '🛒 Корзина':
    case '🛒 Ароба':
    case '🛒 Savat':
      await cartHandler(ctx);
      break;
    case '📦 Мои заказы':
    case '📦 Фармоишҳои ман':
    case '📦 Mening buyurtmalarim':
      await orderHandler(ctx);
      break;
    case '👤 Профиль':
    case '👤 Профил':
    case '👤 Profil':
      await profileHandler(ctx);
      break;
    case 'ℹ️ О нас':
    case 'ℹ️ Дар бораи мо':
    case 'ℹ️ Biz haqimizda':
      await bot.sendMessage(chatId, multi.getAboutText(ctx.session.language));
      break;
    default:
      // Если это не команда, считаем что это 
      const answer = await aiService.handleUserMessage(chatId, text);
      await bot.sendMessage(chatId, answer.text);
      //if (text && !['⬅️ Назад', '⬅️ Бозгашт', '⬅️ Orqaga'].includes(text)) {
        //await searchHandler(ctx, text);
      }
});

// Обработчик callback запросов
bot.on('callback_query', async (callbackQuery: any) => {
  const message = callbackQuery.message;
  const chatId = message?.chat.id || 0;
  const data = callbackQuery.data;
  const ctx = await createContext(chatId, undefined, callbackQuery);
  

  try {
    if (data?.startsWith('category_')) {
      await categoriesHandler(ctx, data);
    }
    else if (data?.startsWith('product_')) {
      await ProductsHandler(ctx, data);
    }
    else if (data?.startsWith('add_to_cart_')) {
      await ProductsHandler(ctx, data);
    }
    else if (data?.startsWith('cart_') || data?.startsWith('payment_')) {
      await cartHandler(ctx, data);
    }
    else if (data?.startsWith('profile_')) {
      await profileHandler(ctx, data);
    }
    else if(data?.startsWith('order_')){
      await orderHandler(ctx, data);
    }
    else if (data === 'categories') {
      await categoriesHandler(ctx);
    }
    else if (data === 'profile') {
      await profileHandler(ctx);
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('Callback error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Error' });
  }
});




console.log('🤖 Telegram bot started!');

export { bot };