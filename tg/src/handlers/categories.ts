import { getTranslation } from '../types.js';
import type {BotContext} from '../types.js';
import { apiClient } from '../services/api.js';
import { SessionService } from '../services/session.js';
import {getAddToCartText} from '../lang/multi.js'
import icons from '../utils/icons.js'
import sharp from 'sharp';
import axios from 'axios';

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

async function sendPhotoAsBuffer(ctx: BotContext, imageUrl: string, caption: string, keyboard: any[]): Promise<void> {
  const { bot, chatId } = ctx;
  
  try {
    // Скачиваем изображение
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'arraybuffer'
    });

    // Конвертируем в Buffer
    //const photoBuffer = Buffer.from(response.data, 'binary');
    const photoBuffer = await sharp(response.data)
      .resize(500, 500, { // Делаем картинку небольшой
        fit: 'inside',   // Сохраняем пропорции, но вписываем в размер
        withoutEnlargement: true 
      })
      .jpeg({ quality: 100 }) // Сжимаем качество для веса
      .toBuffer();
    
    // Отправляем как Buffer
    await bot.sendPhoto(chatId, photoBuffer, {
      caption: caption,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
    
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error; // Пробрасываем ошибку для fallback
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

    //let message = getProductsListText(session.language) + '\n\n';
    let message = '';

    products.forEach(async (product: any, index: number) => {
      const keyboard = [];
      
      message = `${index + 1}. ${product.name} - ${product.price} ₽\n`;
      //if (product.description) {
      //  message += `   ${product.description}\n`;
      //}
      message += '\n';
      keyboard.push([{
        text: `${icons['info']} посмотреть подробнее`,
        callback_data: `product_${product.id}`
        }
      ]);
      keyboard.push([{
        text: '🛒 ' + getAddToCartText(session.language),
        callback_data: `add_to_cart_${product.id}`
      }]);
      try {
        
        if(product.image_url.includes('localhost') || product.image_url.includes('127.0.0.1')){
          await sendPhotoAsBuffer(ctx, product.image_url, message, keyboard);
        }
        else{
          
       await bot.sendPhoto(chatId, product.image_url, {
         caption: message,
         parse_mode: 'Markdown',
         reply_markup: {
           inline_keyboard: keyboard
         }
       });
      }
     } catch (photoError) {
      console.log('image error', photoError);
     }

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

    type productKeybord = {
      text: string;
      callback_data: string;
    }

    /*keyboard.forEach(async (item: productKeybord, i: number)=>{

      await bot.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: keyboard[i]
        }
      });
    })*/
    

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