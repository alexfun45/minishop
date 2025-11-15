import type {BotContext, textMap} from '../types'
import { SessionService } from '../services/session.ts';
import { apiClient } from '../services/api.ts';
import * as multi from '../lang/multi.ts'
import {mainMenu} from '../keyboards/mainMenu.ts'



async function showOrderConfirmation(ctx: BotContext): Promise<void> {
  const { bot, chatId, session } = ctx;
  const order = session.tempOrder;
  
  let message = '📦 *' + getOrderConfirmationText(session.language) + '*\n\n';
  message += `👤 ${getCustomerNameText(session.language)}: ${order.customer_name}\n`;
  message += `📞 ${getPhoneText(session.language)}: ${order.phone}\n`;
  message += `🏠 ${getAddressText(session.language)}: ${order.address}\n\n`;
  message += `*${getOrderContentsText(session.language)}:*\n`;

  order.items.forEach((item: any, index: number) => {
    message += `${index + 1}. ${item.name} - ${item.quantity} x ${item.price} ₽\n`;
  });

  message += `\n💎 *${getTotalText(session.language)}: ${order.total} ₽*`;

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

// Дополнительные текстовые функции
function getOrderConfirmationText(language: string): string {
  const texts: textMap = {
    ru: 'Подтверждение заказа',
    tj: 'Тасдиқ кардани фармоиш',
    uz: 'Buyurtmani tasdiqlash'
  };
  return texts[language] || texts.ru;
}

function getCustomerNameText(language: string): string {
  const texts: textMap = {
    ru: 'Имя',
    tj: 'Ном',
    uz: 'Ism'
  };
  return texts[language] || texts.ru;
}

function getPhoneText(language: string): string {
  const texts: textMap = {
    ru: 'Телефон',
    tj: 'Телефон',
    uz: 'Telefon'
  };
  return texts[language] || texts.ru;
}

function getAddressText(language: string): string {
  const texts: textMap = {
    ru: 'Адрес',
    tj: 'Суроға',
    uz: 'Manzil'
  };
  return texts[language] || texts.ru;
}

function getOrderContentsText(language: string): string {
  const texts: textMap = {
    ru: 'Состав заказа',
    tj: 'Таркиби фармоиш',
    uz: 'Buyurtma tarkibi'
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