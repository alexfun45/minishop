// src/bot/handlers/cart.ts
import { getTranslation } from '../types.js';
import type { BotContext, textMap } from '../types.js';
import { apiClient } from '../services/api.js';
import { SessionService } from '../services/session.js';

export async function cartHandler(ctx: BotContext, data?: string): Promise<void> {
  //const { bot, chatId, session } = ctx;

  if (data && data.startsWith('cart_')) {
    await handleCartAction(ctx, data);
    return;
  }

  await showCart(ctx);
}

async function showCart(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;
  
  const cart = session.cart || [];
  
  if (cart.length === 0) {
    await showEmptyCart(ctx);
    return;
  }

  await showCartContents(ctx);
}

async function showEmptyCart(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;

  const emptyCartText = {
    ru: '🛒 Ваша корзина пуста.\n\nДобавьте товары из категорий!',
    tj: '🛒 Аробаи шумо холӣ аст.\n\nАз категорияҳо маҳсулот илова кунед!',
    uz: '🛒 Sizning savatingiz boʻsh.\n\nToifalardan mahsulot qoʻshing!'
  };

  await bot.sendMessage(
    chatId,
    emptyCartText[session.language] || emptyCartText.ru,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: getTranslation(session, 'categories'), callback_data: 'categories' }]
        ]
      }
    }
  );
}

async function showCartContents(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;
  const cart = session.cart || [];

  let message = '🛒 *' + getCartTitleText(session.language) + '*\n\n';
  let totalPrice = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    totalPrice += itemTotal;
    message += `${index + 1}. *${item.name}*\n`;
    message += `   💵 ${item.price} ₽ x ${item.quantity} = ${itemTotal} ₽\n`;
  });

  message += `\n💎 *${getTotalText(session.language)}: ${totalPrice} ₽*`;

  const keyboard = [];
  
  // Кнопки управления для каждого товара
  cart.forEach(item => {
    keyboard.push([
      {
        text: `➖ ${getDecreaseText(session.language)}`,
        callback_data: `cart_update_${item.productId}_-1`
      },
      {
        text: `➕ ${getIncreaseText(session.language)}`,
        callback_data: `cart_update_${item.productId}_1`
      }
    ]);
    keyboard.push([
      {
        text: `❌ ${getRemoveText(session.language)} "${item.name}"`,
        callback_data: `cart_remove_${item.productId}`
      }
    ]);
  });

  // Кнопки управления корзиной
  keyboard.push(
    [{ 
      text: '🗑️ ' + getClearCartText(session.language), 
      callback_data: 'cart_clear' 
    }],
    [{ 
      text: '✅ ' + getCheckoutText(session.language), 
      callback_data: 'cart_checkout' 
    }],
    [{ 
      text: '🛍️ ' + getContinueShoppingText(session.language), 
      callback_data: 'categories' 
    }]
  );

  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
}

async function handleCartAction(ctx: BotContext, action: string): Promise<void> {
  const { bot, chatId, session, callbackQuery } = ctx;

  try {
    if (action === 'cart_clear') {
      await clearCart(ctx);
    } 
    else if (action === 'cart_checkout') {
      await startCheckout(ctx);
    }
    else if (action.startsWith('cart_remove_')) {
      const productId = parseInt(action.replace('cart_remove_', ''));
      await removeFromCart(ctx, productId);
    }
    else if (action.startsWith('cart_update_')) {
      const [productId, change] = action.replace('cart_update_', '').split('_');
      await updateCartItem(ctx, parseInt(productId), parseInt(change));
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('Cart action error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, { 
      text: getTranslation(session, 'error') 
    });
  }
}

async function updateCartItem(ctx: BotContext, productId: number, change: number): Promise<void> {
  const { bot, chatId, session } = ctx;
  const cart = session.cart || [];
  const item = cart.find(item => item.productId === productId);
  
  if (item) {
    item.quantity += change;
    
    if (item.quantity <= 0) {
      // Удаляем товар если количество стало 0 или меньше
      session.cart = cart.filter(item => item.productId !== productId);
      await bot.sendMessage(chatId, '🗑️ ' + getItemRemovedText(session.language));
    } else {
      const updateText = {
        ru: `✅ Количество обновлено: ${item.quantity}`,
        tj: `✅ Миқдор нав карда шуд: ${item.quantity}`,
        uz: `✅ Miqdor yangilandi: ${item.quantity}`
      };
      await bot.sendMessage(chatId, updateText[session.language] || updateText.ru);
    }
    
    SessionService.saveUserSession(chatId, session);
    await showCart(ctx);
  }
}

async function removeFromCart(ctx: BotContext, productId: number): Promise<void> {
  const { bot, chatId, session } = ctx;
  
  session.cart = (session.cart || []).filter(item => item.productId !== productId);
  SessionService.saveUserSession(chatId, session);
  
  await bot.sendMessage(chatId, '🗑️ ' + getItemRemovedText(session.language));
  await showCart(ctx);
}

async function clearCart(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;
  
  session.cart = [];
  SessionService.saveUserSession(chatId, session);
  
  const clearText = {
    ru: '🗑️ Корзина очищена!',
    tj: '🗑️ Ароба тоза карда шуд!',
    uz: '🗑️ Savat tozalandi!'
  };
  
  await bot.sendMessage(chatId, clearText[session.language] || clearText.ru);
}

async function startCheckout(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;
  const cart = session.cart || [];
  
  if (cart.length === 0) {
    await bot.sendMessage(chatId, '❌ ' + getEmptyCartText(session.language));
    return;
  }

  // Рассчитываем общую сумму
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Сохраняем временные данные заказа
  session.tempOrder = {
    items: [...cart],
    total: totalAmount
  };
  session.checkoutStep = 'phone';
  SessionService.saveUserSession(chatId, session);

  const checkoutText = {
    ru: `📋 *Оформление заказа*\n\n` +
        `💎 Общая сумма: ${totalAmount} ₽\n\n` +
        `Для оформления заказа нам нужны ваши данные.\n\n` +
        `Пожалуйста, отправьте ваш номер телефона:`,
    tj: `📋 *Содир кардани фармоиш*\n\n` +
        `💎 Маблағи умумӣ: ${totalAmount} ₽\n\n` +
        `Барои содир кардани фармоиш ба маълумоти шумо ниёз дорем.\n\n` +
        `Лутфан, рақами телефони худро фиристед:`,
    uz: `📋 *Buyurtma rasmiylashtirish*\n\n` +
        `💎 Umumiy summa: ${totalAmount} ₽\n\n` +
        `Buyurtma rasmiylashtirish uchun maʼlumotlaringiz kerak.\n\n` +
        `Iltimos, telefon raqamingizni yuboring:`
  };

  await bot.sendMessage(chatId, checkoutText[session.language] || checkoutText.ru, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: '📞 ' + getSendPhoneText(session.language), request_contact: true }],
        ['⬅️ ' + getCancelOrderText(session.language)]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
}

// Вспомогательные функции для мультиязычности

function getCartTitleText(language: string): string {
  const texts: textMap = {
    ru: 'Ваша корзина',
    tj: 'Аробаи шумо',
    uz: 'Sizning savatingiz'
  };
  return texts[language] || texts.ru;
}

function getTotalText(language: string): string {
  const texts: textMap = {
    ru: 'Итого',
    tj: 'Ҳамагӣ',
    uz: 'Jami'
  };
  return texts[language] || texts.ru;
}

function getDecreaseText(language: string): string {
  const texts: textMap = {
    ru: 'Уменьшить',
    tj: 'Кам кардан',
    uz: 'Kamaytirish'
  };
  return texts[language] || texts.ru;
}

function getIncreaseText(language: string): string {
  const texts: textMap = {
    ru: 'Увеличить',
    tj: 'Зиёд кардан',
    uz: 'Oshirish'
  };
  return texts[language] || texts.ru;
}

function getRemoveText(language: string): string {
  const texts: textMap = {
    ru: 'Удалить',
    tj: 'Ҳазф кардан',
    uz: 'Oʻchirish'
  };
  return texts[language] || texts.ru;
}

function getClearCartText(language: string): string {
  const texts: textMap = {
    ru: 'Очистить корзину',
    tj: 'Аробаро тоза кардан',
    uz: 'Savatni tozalash'
  };
  return texts[language] || texts.ru;
}

function getCheckoutText(language: string): string {
  const texts: textMap = {
    ru: 'Оформить заказ',
    tj: 'Фармоиш содир кардан',
    uz: 'Buyurtma berish'
  };
  return texts[language] || texts.ru;
}

function getContinueShoppingText(language: string): string {
  const texts: textMap = {
    ru: 'Продолжить покупки',
    tj: 'Харид давом додан',
    uz: 'Xaridni davom ettirish'
  };
  return texts[language] || texts.ru;
}

function getItemRemovedText(language: string): string {
  const texts: textMap = {
    ru: 'Товар удален из корзины',
    tj: 'Маҳсулот аз ароба ҳазф шуд',
    uz: 'Mahsulot savatdan olib tashlandi'
  };
  return texts[language] || texts.ru;
}

function getEmptyCartText(language: string): string {
  const texts: textMap = {
    ru: 'Корзина пуста',
    tj: 'Ароба холӣ аст',
    uz: 'Savat boʻsh'
  };
  return texts[language] || texts.ru;
}

function getSendPhoneText(language: string): string {
  const texts: textMap = {
    ru: 'Отправить номер телефона',
    tj: 'Рақами телефонро фиристед',
    uz: 'Telefon raqamini yuborish'
  };
  return texts[language] || texts.ru;
}

function getCancelOrderText(language: string): string {
  const texts: textMap = {
    ru: 'Отменить заказ',
    tj: 'Фармоишро бекор кардан',
    uz: 'Buyurtmani bekor qilish'
  };
  return texts[language] || texts.ru;
}