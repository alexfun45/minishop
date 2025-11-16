import type {BotContext, textMap} from '../types'
import { SessionService } from '../services/session.ts';
import { apiClient } from '../services/api.ts';
import * as multi from '../lang/multi.ts'
import {mainMenu} from '../keyboards/mainMenu.ts'
import { getTranslation } from '../types.js';

export async function orderHandler(ctx: BotContext, data?: string): Promise<void> {
  //const { bot, chatId, session } = ctx;

  if (data && data.startsWith('order_')) {
    await handleOrderAction(ctx, data);
    return;
  }

  await showOrderHistory(ctx);
}

async function showOrderHistory(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;

  try {
    // Получаем заказы по Telegram ID
    const orders = await apiClient.getUserOrders(chatId);
    
    if (orders.length === 0) {
      await showNoOrders(ctx);
      return;
    }

    await showOrdersList(ctx, orders);

  } catch (error) {
    console.error('Load orders error:', error);
    await bot.sendMessage(chatId, getTranslation(session, 'error'));
  }
}

async function askForPhoneNumber(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;

  const askPhoneText = {
    ru: `📞 *Для просмотра заказов нужен ваш номер телефона*\n\n` +
        `Мы найдем ваши заказы по номеру телефона, который вы указывали при оформлении.\n\n` +
        `Пожалуйста, отправьте ваш номер телефона:`,
    tj: `📞 *Барои дидани фармоишҳо ба рақами телефони шумо ниёз аст*\n\n` +
        `Мо фармоишҳои шуморо бо рақами телефоне, ки шумо дар вақти содир кардан зикр кардед, пайдо мекунем.\n\n` +
        `Лутфан, рақами телефони худро фиристед:`,
    uz: `📞 *Buyurtmalarni ko'rish uchun telefon raqamingiz kerak*\n\n` +
        `Sizning buyurtmalaringizni rasmiylashtirish paytida ko'rsatgan telefon raqamingiz orqali topamiz.\n\n` +
        `Iltimos, telefon raqamingizni yuboring:`
  };

  await bot.sendMessage(chatId, askPhoneText[session.language] || askPhoneText.ru, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: '📞 ' + multi.getSendPhoneText(session.language), request_contact: true }],
        ['⬅️ ' + multi.getBackText(session.language)]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });

  // Сохраняем состояние ожидания номера телефона
  session.awaitingPhoneForOrders = true;
  SessionService.saveUserSession(chatId, session);
}

async function loadAndShowOrders(ctx: BotContext, userId: number): Promise<void> {
  const { bot, chatId, session } = ctx;

  try {
    const orders = await apiClient.getUserOrders(userId);
    
    if (orders.length === 0) {
      await showNoOrders(ctx);
      return;
    }

    await showOrdersList(ctx, orders);

  } catch (error) {
    console.error('Load orders error:', error);
    await bot.sendMessage(chatId, getTranslation(session, 'error'));
  }
}

async function showNoOrders(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;

  const noOrdersText = {
    ru: `📭 *У вас пока нет заказов*\n\n` +
        `Совершите свой первый заказ и он появится здесь!`,
    tj: `📭 *Шумо то ҳол ягон фармоиш надоред*\n\n` +
        `Якумин фармоиши худро содир кунед ва он дар ин ҷо пайдо мешавад!`,
    uz: `📭 *Hozircha sizda buyurtmalar yo'q*\n\n` +
        `Birinchi buyurtmangizni bering va u shu yerda paydo bo'ladi!`
  };

  await bot.sendMessage(chatId, noOrdersText[session.language] || noOrdersText.ru, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛍️ ' + multi.getStartShoppingText(session.language), callback_data: 'categories' }],
        [{ text: '🏠 ' + multi.getMainMenuText(session.language), callback_data: 'main_menu' }]
      ]
    }
  });
}

async function showOrdersList(ctx: BotContext, orders: any[]): Promise<void> {
  const { bot, chatId, session } = ctx;

  let message = `📦 *${multi.getOrderHistoryText(session.language)}*\n\n`;
  message += `👤 *Пользователь:* ${ctx.message?.chat.first_name || 'Пользователь'}\n`;
  message += `🆔 *Telegram ID:* ${chatId}\n\n`;
  
  orders.forEach((order, index) => {
    const orderDate = new Date(order.created_at).toLocaleDateString('ru-RU');
    const status = multi.getOrderStatusText(order.status, session.language);
    
    message += `${index + 1}. *Заказ #${order.id}* (${orderDate})\n`;
    message += `   💰 ${multi.getTotalAmountText(session.language)}: ${order.total_amount} ₽\n`;
    message += `   📍 ${multi.getStatusText(session.language)}: ${status}\n`;
    
    if (order.items && order.items.length > 0) {
      const itemCount = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      message += `   🛍️ Товаров: ${itemCount}\n`;
    }
    
    message += `   └─ /order_${order.id}\n\n`;
  });

  const keyboard = orders.map(order => [
    {
      text: `📋 ${multi.getOrderText(session.language)} #${order.id} - ${order.total_amount} ₽`,
      callback_data: `order_details_${order.id}`
    }
  ]);

  // Добавляем кнопки навигации
  keyboard.push([
    { text: '🔄 ' + multi.getRefreshText(session.language), callback_data: 'orders_refresh' },
    { text: '🏠 ' + multi.getMainMenuText(session.language), callback_data: 'main_menu' }
  ]);

  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
}

async function handleOrderAction(ctx: BotContext, data: string): Promise<void> {
  const { bot, chatId, session, callbackQuery } = ctx;

  try {
    if (data.startsWith('order_details_')) {
      const orderId = parseInt(data.replace('order_details_', ''));
      await showOrderDetails(ctx, orderId);
    }
    else if (data === 'orders_refresh') {
      await loadAndShowOrders(ctx, session.userId);
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('Order action error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, { 
      text: getTranslation(session, 'error') 
    });
  }
}

async function showOrderDetails(ctx: BotContext, orderId: number): Promise<void> {
  const { bot, chatId, session } = ctx;

  try {
    const order = await apiClient.getOrderById(orderId);
    
    if (!order) {
      await bot.sendMessage(chatId, multi.getOrderNotFoundText(session.language));
      return;
    }

    // Проверяем, что заказ принадлежит пользователю
    if (order.telegram_id !== chatId) {
      await bot.sendMessage(chatId, multi.getOrderAccessDeniedText(session.language));
      return;
    }

    const orderDate = new Date(order.created_at).toLocaleString('ru-RU');
    const status = multi.getOrderStatusText(order.status, session.language);

    let message = `📋 *${multi.getOrderDetailsText(session.language)} #${order.id}*\n\n`;
    message += `📅 ${multi.getDateText(session.language)}: ${orderDate}\n`;
    message += `👤 ${multi.getCustomerText(session.language)}: ${order.customer_name}\n`;
    message += `📞 ${multi.getPhoneText(session.language)}: ${order.customer_phone}\n`;
    message += `🏠 ${multi.getAddressText(session.language)}: ${order.customer_address}\n`;
    message += `💰 ${multi.getTotalAmountText(session.language)}: ${order.total_amount} ₽\n`;
    message += `📊 ${multi.getStatusText(session.language)}: ${status}\n\n`;
    
    message += `*${multi.getOrderItemsText(session.language)}:*\n`;
    
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any, index: number) => {
        const itemTotal = item.price * item.quantity;
        message += `${index + 1}. ${item.name}\n`;
        message += `   ${item.quantity} x ${item.price} ₽ = ${itemTotal} ₽\n`;
      });
    } else {
      message += multi.getNoItemsText(session.language) + '\n';
    }

    const keyboard = [
      [
        { text: '📦 ' + multi.getBackToOrdersText(session.language), callback_data: 'orders_show' },
        { text: '🔄 ' + multi.getRefreshText(session.language), callback_data: `order_details_${orderId}` }
      ],
      [
        { text: '🛍️ ' + multi.getNewOrderText(session.language), callback_data: 'categories' },
        { text: '🏠 ' + multi.getMainMenuText(session.language), callback_data: 'main_menu' }
      ]
    ];

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });

  } catch (error) {
    console.error('Show order details error:', error);
    await bot.sendMessage(chatId, getTranslation(session, 'error'));
  }
}

async function showOrderConfirmation(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;
  const order = session.tempOrder;
  
  let message = '📦 *' + multi.getOrderConfirmationText(session.language) + '*\n\n';
  message += `👤 ${multi.getCustomerNameText(session.language)}: ${order.customer_name}\n`;
  message += `📞 ${multi.getPhoneText(session.language)}: ${order.phone}\n`;
  message += `🏠 ${multi.getAddressText(session.language)}: ${order.address}\n\n`;
  message += `*${multi.getOrderContentsText(session.language)}:*\n`;

  order.items.forEach((item: any, index: number) => {
    message += `${index + 1}. ${item.name} - ${item.quantity} x ${item.price} ₽\n`;
  });

  message += `\n💎 *${multi.getTotalText(session.language)}: ${order.total} ₽*`;

  await bot.sendMessage(
    chatId,
    message,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          ['✅ ' + multi.getConfirmOrderText(session.language)],
          ['⬅️ ' + multi.getCancelOrderText(session.language)]
        ],
        resize_keyboard: true
      }
    }
  );
}

async function placeOrder(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;

  try {
    const order = session.tempOrder;
    
    // Отправляем заказ на бэкенд
    const orderData = {
      customer_name: order.customer_name,
      customer_phone: order.phone,
      customer_address: order.address,
      total_amount: order.total,
      items: order.items.map((item:any) => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price
      }))
    };

    const result = await apiClient.createOrder(orderData);

    // Очищаем корзину и сессию
    session.cart = [];
    session.checkoutStep = undefined;
    session.tempOrder = undefined;
    SessionService.saveUserSession(chatId, session);

    const successText = {
      ru: '🎉 *Заказ успешно оформлен!*\n\n' +
          'Мы свяжемся с вами в ближайшее время для подтверждения заказа.\n' +
          'Спасибо за покупку! 🥖',
      tj: '🎉 *Фармоиш бо муваффақият содир шуд!*\n\n' +
          'Мо барои тасдиқ кардани фармоиш ба зудӣ бо шумо тамос мегирем.\n' +
          'Барои харид ташаккур! 🥖',
      uz: '🎉 *Buyurtma muvaffaqiyatli rasmiylashtirildi!*\n\n' +
          'Buyurtmani tasdiqlash uchun tez orada siz bilan bogʻlanamiz.\n' +
          'Xaridingiz uchun rahmat! 🥖'
    };

    await bot.sendMessage(
      chatId,
      successText[session.language] || successText.ru,
      {
        parse_mode: 'Markdown',
        ...mainMenu
      }
    );

  } catch (error) {
    console.error('Place order error:', error);
    
    const errorText = {
      ru: '❌ Произошла ошибка при оформлении заказа. Попробуйте позже.',
      tj: '❌ Дар вақти содир кардани фармоиш хато рӯй дод. Баъдтар кӯшиш кунед.',
      uz: '❌ Buyurtma rasmiylashtirishda xatolik yuz berdi. Keyinroq urinib koʻring.'
    };
    
    await bot.sendMessage(chatId, errorText[session.language] || errorText.ru, mainMenu);
  }
}
