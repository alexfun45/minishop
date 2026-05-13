import { getTranslation } from '../types.ts';
import type {BotContext, textMap} from '../types.ts';
import axios from 'axios';

function getProductName(product: any, language: string): string {
  const nameField = `name_${language}`;
  return product[nameField] || product.name_ru || product.name || 'Без названия';
}

function getProductNotFoundText(language: string): string {
  const texts: textMap = {
    ru: '❌ Товар не найден',
    tj: '❌ Маҳсулот ёфт нашуд',
    uz: '❌ Mahsulot topilmadi'
  };
  return texts[language] || texts.ru;
}

export async function showProduct(ctx: BotContext, product: any): Promise<void> {
  const { bot, chatId, session } = ctx;

  try {
    if (!product) {
      await bot.sendMessage(chatId, getProductNotFoundText(session.language));
      return;
    }

    // Получаем правильное имя и описание в зависимости от языка
    const productName = getProductName(product, session.language);
    //const productDescription = getProductDescription(product, session.language);
    //const productIngredients = getProductIngredients(product, session.language);
    // Формируем сообщение
    let message = `🍞 *${productName}*\n\n`;
    message += `💵 ${getPriceText(session.language)}: *${product.price} ₽*\n`;
    
    if (product.old_price && parseFloat(product.old_price) > 0) {
      message += `💫 ${getOldPriceText(session.language)}: ~${product.old_price} ₽~\n`;
    }
    
    if (product.weight) {
      message += `⚖️ ${getWeightText(session.language)}: ${product.weight}\n`;
    }
    
    
    //if (productIngredients) {
    //  message += `\n🍴 ${getIngredientsText(session.language)}: ${productIngredients}\n`;
    //}

    // Статус доступности
    if (!product.available) {
      message += `\n❌ ${getNotAvailableText(session.language)}\n`;
    }

     // Создаем клавиатуру
     const keyboard = [];
    
     if (product.available) {
       keyboard.push([
         {
           text: '🛒 ' + getAddToCartText(session.language),
           callback_data: `add_to_cart_${product.id}`
         }
       ]);
     }
     
     keyboard.push([
       {
         text: '📦 ' + getMoreProductsText(session.language),
         callback_data: `category_${product.category_id}`
       }
     ]);
     
     keyboard.push([
       {
         text: getTranslation(session, 'back'),
         callback_data: 'categories'
       }
     ]);
 
     // Отправляем фото с подписью или просто сообщение
     if (product.image_url) {
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
         console.error('Photo send error:', photoError);
         // Если не удалось отправить фото, отправляем текстовое сообщение
         await bot.sendMessage(chatId, message, {
           parse_mode: 'Markdown',
           reply_markup: {
             inline_keyboard: keyboard
           }
         });
       }
     } else {
       await bot.sendMessage(chatId, message, {
         parse_mode: 'Markdown',
         reply_markup: {
           inline_keyboard: keyboard
         }
       });
     }

  } catch(error){
    console.error('Products error:', error);
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
    const photoBuffer = Buffer.from(response.data, 'binary');
    
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

function getPriceText(language: string): string {
  const texts: textMap = {
    ru: 'Цена',
    tj: 'Нарх',
    uz: 'Narx'
  };
  return texts[language] || texts.ru;
}

function getOldPriceText(language: string): string {
  
  const texts: textMap = {
    ru: 'Старая цена',
    tj: 'Нархи кӯҳна',
    uz: 'Eski narx'
  };
  return texts[language] || texts.ru;
}

function getWeightText(language: string): string {
  const texts: textMap = {
    ru: 'Вес',
    tj: 'Вазн',
    uz: 'Vazn'
  };
  return texts[language] || texts.ru;
}

function getNotAvailableText(language: string): string {
  const texts: textMap = {
    ru: '❌ Товар временно недоступен',
    tj: '❌ Маҳсулот ҳоло дастрас нест',
    uz: '❌ Mahsulot hozircha mavjud emas'
  };
  return texts[language] || texts.ru;
}

function getAddToCartText(language: string): string {
  const texts: textMap = {
    ru: 'Добавить в корзину',
    tj: 'Ба ароба илова кунед',
    uz: 'Savatga qo‘shish'
  };
  return texts[language] || texts.ru;
}

function getMoreProductsText(language: string): string {
  const texts: textMap = {
    ru: 'Еще товары',
    tj: 'Маҳсулоти дигар',
    uz: 'Boshqa mahsulotlar'
  };
  return texts[language] || texts.ru;
}