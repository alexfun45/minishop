// services/OrderItemService.ts
import { OrderItem, Product } from '../models/index.ts';

export class OrderItemService {
  // Добавить товары в заказ
  async addItemsToOrder(orderId: number, items: Array<{
    product_id: number;
    quantity: number;
    price: number;
    product_name: string;
    product_image?: string;
  }>) {
    const orderItems = await OrderItem.bulkCreate(
      items.map(item => ({
        order_id: orderId,
        ...item,
      }))
    );

    return orderItems;
  }

  // Получить позиции заказа
  async findByOrderId(orderId: number) {
    return await OrderItem.findAll({
      where: { order_id: orderId },
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name_ru', 'name_tj', 'name_uz', 'image_url'],
      }],
    });
  }

  // Обновить количество товара
  async updateQuantity(orderItemId: number, quantity: number) {
    const item = await OrderItem.findByPk(orderItemId);
    if (!item) {
      throw new Error('Order item not found');
    }

    item.quantity = quantity;
    await item.save();

    return item;
  }

  // Удалить позицию из заказа
  async removeFromOrder(orderItemId: number) {
    const item = await OrderItem.findByPk(orderItemId);
    if (!item) {
      throw new Error('Order item not found');
    }

    await item.destroy();
    return true;
  }

  // Подсчитать общую сумму заказа
  async calculateOrderTotal(orderId: number) {
    const items = await OrderItem.findAll({
      where: { order_id: orderId },
      attributes: ['quantity', 'price'],
    });

    const total = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.price);
    }, 0);

    return total;
  }
}

export const orderItemService = new OrderItemService();