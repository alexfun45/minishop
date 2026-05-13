
import axios from "axios";
import type {NotifiesType, Notifiers} from '../types/NotifyTypes.ts'
import {isNotify} from '../types/NotifyTypes.ts'
import {HttpsProxyAgent} from 'https-proxy-agent'
import 'dotenv/config'

export async function sendStatusUpdateNotification(telegramId: number, orderId: number, newStatus: string) {
  const statusMessages = {
    confirmed: "✅ Ваш заказ #ID подтвержден и скоро начнет готовиться!",
    preparing: "👨‍🍳 Мы начали готовить ваш заказ #ID!",
    ready: "🥯 Ваш заказ #ID готов! Можно забирать или ожидать курьера.",
    delivered: "🚚 Заказ #ID доставлен. Приятного аппетита!",
    cancelled: "❌ К сожалению, заказ #ID был отменен."
  };

  const proxyAgent = new HttpsProxyAgent('http://user361622:lw0kic@45.159.180.166:1768');

  if(isNotify(newStatus)){
    const message = statusMessages[newStatus].replace('#ID', orderId.toString());
    const botToken = process.env.TELEGRAM_BOT_TOKEN;


    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: telegramId,
        text: message,
        parse_mode: 'HTML'
      },
      { 
        httpsAgent: proxyAgent,
        httpAgent: proxyAgent,
        proxy: false // Важно отключить встроенную логику прокси axios
      }
      );
    } catch (error) {
      console.error('Ошибка отправки в Telegram:', error);
    }
  }
}