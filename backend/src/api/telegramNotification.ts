
import axios from "axios";
import {isNotify} from '../types/NotifyTypes.js'
import {HttpsProxyAgent} from 'https-proxy-agent'
import 'dotenv/config'


// Отправка сообщению я телеграм
export async function sendMessage(chatId: number, message: string){
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  console.log('Отправляю увдомление chatId', chatId);
  console.log('use proxy', process.env.USE_PROXY == "true");
  if(process.env.USE_PROXY == "true"){
    const proxyAgent = new HttpsProxyAgent('http://user361622:lw0kic@45.159.180.166:1768');
    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
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
  else{
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });
  }

}

export async function sendStatusUpdateNotification(telegramId: number, orderId: number, newStatus: string) {
  const statusMessages = {
    confirmed: `✅ Ваш заказ #${orderId} подтвержден и скоро начнет готовиться!`,
    preparing: `👨‍🍳 Мы начали готовить ваш заказ #${orderId}!`,
    payment_success: `🎉 Отличные новости! Ваш заказ #${orderId} успешно оплачен и передан в обработку! 🥖`,
    ready: `🥯 Ваш заказ #${orderId} готов! Можно забирать или ожидать курьера.`,
    delivered: `🚚 Заказ #${orderId} доставлен. Приятного аппетита!`,
    cancelled: `❌ К сожалению, заказ #${orderId} был отменен.`
  };

  const proxyAgent = new HttpsProxyAgent('http://user361622:lw0kic@45.159.180.166:1768');

  if(isNotify(newStatus)){
    const message = statusMessages[newStatus].replace('#ID', orderId.toString());
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    sendMessage(telegramId, message);
    /*try {
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
    }*/
  }
}