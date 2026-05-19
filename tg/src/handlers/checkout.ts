import type {BotContext, textMap} from '../types.js'
import { SessionService } from '../services/session.js';
import { apiClient } from '../services/api.js';
import * as multi from '../lang/multi.js'
import {mainMenu} from '../keyboards/mainMenu.js'

export async function handleCheckoutStep(ctx: BotContext, msg: any): Promise<void> {
  const { bot, chatId, session } = ctx;
  const text = msg.text || '';

  if (text === multi.getCancelOrderText(session.language) || text.includes('Отменить') || text.includes('Бекор') || text.includes('Bekor')) {
    // Отмена заказа
    session.checkoutStep = undefined;
    session.tempOrder = undefined;
    SessionService.saveUserSession(chatId, session);
    
    const cancelText = {
      ru: '❌ Заказ отменен.',
      tj: '❌ Фармоиш бекор карда шуд.',
      uz: '❌ Buyurtma bekor qilindi.'
    };
    
    await bot.sendMessage(chatId, (cancelText as any)[session.language] || cancelText.ru, mainMenu);
    return;
  }

   // Обработка выбора метода оплаты (если нужно обрабатывать текстовые команды)
   if (session.checkoutStep === 'payment') {
    if (text.includes('налич') || text.includes('cash') || text.includes('пул')) {
      await handlePaymentSelection(ctx, 'payment_cash');
      return;
    }
    else if (text.includes('карт') || text.includes('card') || text.includes('корт')) {
      await handlePaymentSelection(ctx, 'payment_card');
      return;
    }
    else if (text.includes('онлайн') || text.includes('online')) {
      await handlePaymentSelection(ctx, 'payment_online');
      return;
    }
  }

  // Обработка номера телефона
  if (session.checkoutStep === 'phone') {
    let phone = '';
    
    if (msg.contact) {
      phone = msg.contact.phone_number;
    } else if (text && /^[\+]?[0-9\s\-\(\)]+$/.test(text)) {
      phone = text;
    }

    if (phone) {
      session.userPhone = phone;
      session.tempOrder.phone = phone;
      session.checkoutStep = 'address';
      SessionService.saveUserSession(chatId, session);

      const addressText = {
        ru: '📝 Теперь введите адрес доставки:',
        tj: '📝 Акнун суроғаи расонданро ворид кунед:',
        uz: '📝 Endi yetkazib berish manzilini kiriting:'
      };

      await bot.sendMessage(
        chatId,
        (addressText as any)[session.language] || addressText.ru,
        {
          reply_markup: {
            keyboard: [['⬅️ ' + multi.getCancelOrderText(session.language)]],
            resize_keyboard: true
          }
        }
      );
    } else {
      const errorText = {
        ru: '❌ Пожалуйста, введите корректный номер телефона.',
        tj: '❌ Лутфан, рақами телефони дурустро ворид кунед.',
        uz: '❌ Iltimos, toʻgʻri telefon raqamini kiriting.'
      };
      await bot.sendMessage(chatId, (errorText as any)[session.language] || errorText.ru);
    }
  }
  // Обработка адреса
  else if (session.checkoutStep === 'address' && text) {
    session.tempOrder.address = text;
    session.tempOrder.customer_name = msg.chat.first_name + (msg.chat.last_name ? ' ' + msg.chat.last_name : '');
    session.checkoutStep = 'confirm';
    SessionService.saveUserSession(chatId, session);

    await showOrderConfirmation(ctx);
  }
  // Подтверждение заказа
  else if (session.checkoutStep === 'confirm') {
    if (text === '✅ ' + multi.getConfirmOrderText(session.language)) {
      await placeOrder(ctx);
    }
  }
}

async function handlePaymentSelection(ctx: BotContext, action: string): Promise<void> {
  const { bot, chatId, session } = ctx;

  const paymentMethod = action.replace('payment_', '');
  
  // Сохраняем выбранный метод оплаты
  session.tempOrder.payment_method = paymentMethod;
  session.checkoutStep = 'phone'; // Переходим к следующему шагу
  SessionService.saveUserSession(chatId, session);

  const confirmationText: any = {
    cash: {
      ru: '💵 Вы выбрали оплату наличными при получении',
      tj: '💵 Шумо пардохти пулакӣ дар вақти гирифтанро интихоб кардед',
      uz: '💵 Siz olib ketish paytida naqd pul to\'lashni tanladingiz'
    },
    card: {
      ru: '💳 Вы выбрали оплату картой при получении',
      tj: '💳 Шумо пардохти кортӣ дар вақти гирифтанро интихоб кардед',
      uz: '💵 Siz olib ketish paytida kartadan to\'lashni tanladingiz'
    },
    online: {
      ru: '📱 Вы выбрали онлайн оплату',
      tj: '📱 Шумо пардохти онлайн-ро интихоб кардед',
      uz: '📱 Siz onlayn to\'lovni tanladingiz'
    }
  };

  await bot.sendMessage(
    chatId, 
    confirmationText[paymentMethod]?.[session.language] || confirmationText.cash[session.language],
    {
      reply_markup: {
        keyboard: [
          [{ text: '📞 ' + multi.getSendPhoneText(session.language), request_contact: true }],
          ['⬅️ ' + multi.getCancelOrderText(session.language)]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    }
  );
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
// Размещение заказа
async function placeOrder(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;

  try {
    const order = session.tempOrder;
    if (!order) {
      console.log('🔴 No tempOrder in session');
      throw new Error('No temporary order data found');
    }

    // Отправляем заказ на бэкенд
    const orderData = {
      customer_name: order.customer_name,
      customer_phone: order.phone,
      delivery_address: order.address,
      user_id: chatId,
      total_amount: order.total,
      payment_method: order.payment_method, // Передаем метод оплаты на бэкенд
      items: order.items.map((item: any) => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price
      }))
    };
    console.log('🟡 Sending order data to API:', JSON.stringify(orderData, null, 2));
   
    const result = await apiClient.createOrder(orderData);
    console.log('🟡 API response received:', result);

    if (!result.success) {
      console.log('🔴 API returned error:', result.error);
      throw new Error(result.error || 'Unknown API error');
    }
   
    // Разделяем логику для ОНЛАЙН оплаты и НАЛИЧНЫХ/КАРТЫ при получении
    const isOnlinePayment = order.payment_method === 'online' && result.data.payment_url;

    // Очищаем корзину и сессию
    session.cart = [];
    session.checkoutStep = undefined;
    session.tempOrder = undefined;
    SessionService.saveUserSession(chatId, session);

    console.log('🟢 Order created successfully, session cleared');

    if (isOnlinePayment) {
      // Сценарий 1: Онлайн оплата (Выдаем ссылку на ЮKassa)
      const payText = {
        ru: `✨ *Заказ #${result.data.id} успешно сформирован!*\n\nДля завершения оформления необходимо оплатить его онлайн по кнопке ниже.`,
        tj: `✨ *Фармоиши #${result.data.id} бо муваффақият сохта шуд!*\n\nБарои анҷом додани он, шумо бояд онро тавассути тугмаи зер онлайн пардохт кунед.`,
        uz: `✨ *Buyurtma #${result.data.id} muvaffaqiyatli yaratildi!*\n\nHisobni rasmiylashtirishni yakunlash uchun quyidagi tugma orqali onlayn to'lovni amalga oshiring.`
      };

      const btnPayText = {
        ru: '💳 Оплатить заказ',
        tj: '💳 Пардохти фармоиш',
        uz: '💳 Buyurtmani to\'lash'
      };

      await bot.sendMessage(
        chatId,
        (payText as any)[session.language] || payText.ru,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: (btnPayText as any)[session.language] || btnPayText.ru,
                  url: result.data.payment_url // Ссылка, которую сгенерировал бэкенд через ЮKassa
                }
              ]
            ]
          }
        }
      );

      // Возвращаем главное меню отдельным сообщением, чтобы у пользователя были кнопки навигации
      const afterPayText = {
        ru: 'После оплаты вы сможете отслеживать статус в разделе "📦 Мои заказы".',
        tj: 'Пас аз пардохт, шумо метавонед ҳолатро дар бахши "📦 Фармоишҳои ман" пайгирӣ кунед.',
        uz: 'To\'lovdan so\'ng holatni "📦 Mening buyurtmalarim" bo\'limida kuzatishingiz mumkin.'
      };
      
      await bot.sendMessage(chatId, (afterPayText as any)[session.language] || afterPayText.ru, mainMenu);

    } else {
      // Сценарий 2: Оплата при получении (Твой стандартный текст)
      const successText = {
        ru: '🎉 *Заказ успешно оформлен!*\n\n' +
            `Номер вашего заказа: #${result.data.id}\n` +
            'Мы свяжемся с вами в ближайшее время для подтверждения.\n' +
            'Вы можете отслеживать статус заказа в разделе "📦 Мои заказы"\n\n' +
            'Спасибо за покупку! 🥖',
        tj: '🎉 *Фармоиш бо муваффақият содир шуд!*\n\n' +
            `Рақами фармоиши шумо: #${result.data.id}\n` +
            'Мо барои тасдиқ кардан ба зудӣ бо шумо тамос мегирем.\n' +
            'Шумо метавонед ҳолати фармоишро дар бахши "📦 Фармоишҳои ман" пайгирӣ кунед\n\n' +
            'Барои харид ташаккур! 🥖',
        uz: '🎉 *Buyurtma muvaffaqiyatli rasmiylashtirildi!*\n\n' +
            `Buyurtma raqamingiz: #${result.data.id}\n` +
            'Tasdiqlash uchun tez orada siz bilan bog\'lanamiz.\n' +
            'Buyurtma holatini "📦 Mening buyurtmalarim" bo\'limida kuzatishingiz mumkin\n\n' +
            'Xaridingiz uchun rahmat! 🥖'
      };

      await bot.sendMessage(
        chatId,
        (successText as any)[session.language] || successText.ru,
        {
          parse_mode: 'Markdown',
          ...mainMenu
        }
      );
    }

  } catch (error) {
    console.error('Place order error:', error);
    
    const errorText = {
      ru: '❌ Произошла ошибка при оформлении заказа. Попробуйте позже.',
      tj: '❌ Дар вақти содир кардани фармоиш хато рӯй дод. Баъдтар кӯшиш кунед.',
      uz: '❌ Buyurtma rasmiylashtirishda xatolik yuz berdi. Keyinroq urinib koʻring.'
    };
    
    await bot.sendMessage(chatId, (errorText as any)[session.language] || errorText.ru, mainMenu);
  }
}
/*async function placeOrder(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;

  try {
    const order = session.tempOrder;
    if (!order) {
      console.log('🔴 No tempOrder in session');
      throw new Error('No temporary order data found');
    }
    // Отправляем заказ на бэкенд
    const orderData = {
      customer_name: order.customer_name,
      customer_phone: order.phone,
      delivery_address: order.address,
      user_id: chatId,
      total_amount: order.total,
      items: order.items.map((item: any) => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price
      }))
    };
    console.log('🟡 Sending order data to API:', JSON.stringify(orderData, null, 2));
   
    const result = await apiClient.createOrder(orderData);
    console.log('🟡 API response received:', result);

    if (!result.success) {
      console.log('🔴 API returned error:', result.error);
      throw new Error(result.error || 'Unknown API error');
    }
   
    // Очищаем корзину и сессию
    session.cart = [];
    session.checkoutStep = undefined;
    session.tempOrder = undefined;
    SessionService.saveUserSession(chatId, session);

    console.log('🟢 Order created successfully, session cleared');

    const successText = {
      ru: '🎉 *Заказ успешно оформлен!*\n\n' +
          `Номер вашего заказа: #${result.data.id}\n` +
          'Мы свяжемся с вами в ближайшее время для подтверждения.\n' +
          'Вы можете отслеживать статус заказа в разделе "📦 Мои заказы"\n\n' +
          'Спасибо за покупку! 🥖',
      tj: '🎉 *Фармоиш бо муваффақият содир шуд!*\n\n' +
          `Рақами фармоиши шумо: #${result.data.id}\n` +
          'Мо барои тасдиқ кардан ба зудӣ бо шумо тамос мегирем.\n' +
          'Шумо метавонед ҳолати фармоишро дар бахши "📦 Фармоишҳои ман" пайгирӣ кунед\n\n' +
          'Барои харид ташаккур! 🥖',
      uz: '🎉 *Buyurtma muvaffaqiyatli rasmiylashtirildi!*\n\n' +
          `Buyurtma raqamingiz: #${result.data.id}\n` +
          'Tasdiqlash uchun tez orada siz bilan bog\'lanamiz.\n' +
          'Buyurtma holatini "📦 Mening buyurtmalarim" bo\'limida kuzatishingiz mumkin\n\n' +
          'Xaridingiz uchun rahmat! 🥖'
    };

    await bot.sendMessage(
      chatId,
      (successText as any)[session.language] || successText.ru,
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
    
    await bot.sendMessage(chatId, (errorText as any)[session.language] || errorText.ru, mainMenu);
  }
}*/