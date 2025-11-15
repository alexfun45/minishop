import { getTranslation } from '../types.ts';
import type {BotContext, textMap} from '../types.ts';
import { apiClient } from '../services/api.ts';
import { SessionService } from '../services/session.ts';
import axios from 'axios';

export async function ProductsHandler(ctx: BotContext, data?: string): Promise<void> {
  //const { bot, chatId, session} = ctx;
  if (data && data.startsWith('product_')){
    const productId = parseInt(data.replace('product_', ''));
    await showProduct(ctx, productId);
    return;
  }

  if (data && data.startsWith('add_to_cart_')) {
    const productId = parseInt(data.replace('add_to_cart_', ''));
    await addToCart(ctx, productId);
    return;
  }
}

async function showProduct(ctx: BotContext, productId: number): Promise<void> {
  const { bot, chatId, session } = ctx;

  try {
    const product = await apiClient.getProduct(productId, session.language);
    if (!product) {
      await bot.sendMessage(chatId, getProductNotFoundText(session.language));
      return;
    }

    // Получаем правильное имя и описание в зависимости от языка
    const productName = getProductName(product, session.language);
    const productDescription = getProductDescription(product, session.language);
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
    
    if (productDescription) {
      message += `\n📝 ${productDescription}\n`;
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

async function addToCart(ctx: BotContext, productId: number): Promise<void> {
  const { bot, chatId, session, callbackQuery } = ctx;

  try {
    const product = await apiClient.getProduct(productId, session.language);
    
    if (!product) {
      await bot.answerCallbackQuery(callbackQuery.id, { 
        text: getProductNotFoundText(session.language) 
      });
      return;
    }

    if (!product.available) {
      await bot.answerCallbackQuery(callbackQuery.id, { 
        text: getNotAvailableText(session.language) 
      });
      return;
    }

    // Получаем имя продукта для текущего языка
    const productName = getProductName(product, session.language);

    // Инициализируем корзину если её нет
    if (!session.cart) {
      session.cart = [];
    }

    // Проверяем есть ли товар уже в корзине
    const existingItem = session.cart.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      session.cart.push({
        productId: product.id,
        name: productName,
        price: parseFloat(product.price),
        quantity: 1,
        imageUrl: product.image_url
      });
    }

    // Сохраняем обновленную сессию
    SessionService.saveUserSession(chatId, session);

    // Подтверждаем добавление
    await bot.answerCallbackQuery(callbackQuery.id, { 
      text: `✅ ${productName} ${getAddedToCartText(session.language)}` 
    });

    // Показываем превью корзины
    await showCartPreview(ctx);

  } catch (error) {
    console.error('Add to cart error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, { 
      text: getTranslation(session, 'error') 
    });
  }
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

function getAddedToCartText(language: string): string {
  const texts: textMap = {
    ru: 'добавлен в корзину!',
    tj: 'ба ароба илова шуд!',
    uz: 'savatga qo‘shildi!'
  };
  return texts[language] || texts.ru;
}

async function showCartPreview(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;
  
  const cart = session.cart || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const previewText = {
    ru: `🛒 В корзине: ${totalItems} товаров на сумму ${totalPrice} ₽\n` +
        `Нажмите "🛒 Корзина" для управления заказом.`,
    tj: `🛒 Дар ароба: ${totalItems} маҳсулот ба маблағи ${totalPrice} ₽\n` +
        `Барои идоракунии фармоиш "🛒 Ароба"-ро пахш кунед.`,
    uz: `🛒 Savatda: ${totalItems} ta mahsulot ${totalPrice} ₽\n` +
        `Buyurtmani boshqarish uchun "🛒 Savat" ni bosing.`
  };

  await bot.sendMessage(chatId, previewText[session.language] || previewText.ru);
}


function getProductName(product: any, language: string): string {
  const nameField = `name_${language}`;
  return product[nameField] || product.name_ru || product.name || 'Без названия';
}

function getProductDescription(product: any, language: string): string {
  const descField = `description_${language}`;
  return product[descField] || product.description_ru || product.description || '';
}

function getProductNotFoundText(language: string): string {
  const texts: textMap = {
    ru: '❌ Товар не найден',
    tj: '❌ Маҳсулот ёфт нашуд',
    uz: '❌ Mahsulot topilmadi'
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