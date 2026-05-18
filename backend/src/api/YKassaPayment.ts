// @ts-ignore
import { YooKassaSDK } from 'yookassa-sdk-node';

export async function checkout(order: any, order_id: number){
    const checkout = new YooKassaSDK({ 
      shopId: process.env.YOO_KASSA_SHOP_ID!, 
      secretKey: process.env.YOO_KASSA_SECRET_KEY! 
    });

    const shopId = process.env.YOO_KASSA_SHOP_ID!;
    const secretKey = process.env.YOO_KASSA_SECRET_KEY!;

    const authString = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    const requestBody = {
      amount: {
        value: order.total_amount.toFixed(2),
        currency: 'RUB'
      },
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: `https://t.me/bakeryshop_bot`
      },
      metadata: {
        order_id: order_id.toString()
      },
      description: `Оплата заказа №${order_id}`,
      capture: true
    };

    try {
      // 3. Делаем прямой запрос к API ЮKassa
      const response = await fetch('https://api.yookassa.ru/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Idempotence-Key': order_id.toString(), // Ключ идемпотентности (id заказа)
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
  
      const data: any = await response.json();
  
      if (!response.ok) {
        console.error('🔴 Ошибка ЮKassa API:', data);
        throw new Error(data.message || 'YooKassa payment creation failed');
      }
  
      console.log('🟢 Успешный платеж создан:', data);
      
      return data;
  
    } catch (error) {
      console.error('🔴 Исключение при вызове чекаута:', error);
      throw error;
    }

    /*const payment = await checkout.createPayment({
      amount: {
        value: order.total_amount.toFixed(2),
        currency: 'RUB'
      },
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: `https://t.me/bakeryshop_bot`
      },
      metadata: {
        order_id: order_id.toString()
      },
      description: `Оплата заказа №${order_id}`,
      capture: true
    });
    console.log('payment', payment);
    return payment;*/
  }