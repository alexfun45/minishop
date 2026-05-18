import type { Request, Response } from 'express';

export async function getPayment(req: Request, res: Response){
  try {
    const event = req.body;

    // Проверяем, что событие — это успешная оплата
    if (event.event === 'payment.succeeded') {
      const payment = event.object;
      const orderId = payment.metadata?.order_id;

      if (orderId) {
        console.log(`🟢 Получено уведомление! Заказ №${orderId} успешно оплачен.`);

        // 1. Изменяем статус заказа в твоей базе данных
        // Пример для условного db:
        // await db.order.update({ where: { id: Number(orderId) }, data: { status: 'paid' } });
        
        // 2. Отправляем уведомление пользователю в Телеграм-бот
        const userId = payment.metadata?.user_id; // Если ты добавишь user_id (chatId) в metadata при создании платежа
        if (userId) {
          // Здесь вызываешь метод отправки сообщения твоего бота:
          // await bot.sendMessage(userId, `🎉 Отличные новости! Ваш заказ #${orderId} успешно оплачен и передан в обработку! 🥖`);
        }
      }
    }

    // ЮKassa строго требует вернуть статус 200 OK, иначе она будет присылать этот вебхук повторно каждые несколько минут
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка при обработке вебхука ЮKassa:', error);
    // Даже при ошибке лучше вернуть 200 или 500, но залогировать её
    res.status(500).send('Internal Error');
  }
}