import type { Request, Response } from 'express';
import { orderService } from "../services/OrderService.js";
import {sendStatusUpdateNotification} from '../api/telegramNotification.js'

export async function getPayment(req: Request, res: Response){
  try {
    const event = req.body;
    console.log('Получен платеж', event);
    // Проверяем, что событие — это успешная оплата
    if (event.event === 'payment.succeeded') {
      const payment = event.object;
      const orderId = payment.metadata?.order_id;

      if (orderId) {
        console.log(`🟢 Получено уведомление! Заказ №${orderId} успешно оплачен.`);
        const userId = payment.metadata?.user_id;
        if (userId) {
          // отправка уведомления в телегарм об успешной оплате
          await orderService.updateStatus(orderId, "payment_success");
          //await sendStatusUpdateNotification(userId, orderId, status);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка при обработке вебхука ЮKassa:', error);
    // Даже при ошибке лучше вернуть 200 или 500, но залогировать её
    res.status(500).send('Internal Error');
  }
}