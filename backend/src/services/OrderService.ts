import { Order, OrderItem, User, Product } from '../models/index.ts';
import { orderItemService } from './OrderItemService.ts';

export class OrderService {
  // Создать заказ
  async create(orderData: any) {
    const { items, ...orderMainData } = orderData;

    // Создаем заказ
    const order = await Order.create(orderMainData);

    // Добавляем товары в заказ
    if (items && items.length > 0) {
      await orderItemService.addItemsToOrder(order.id, items);
    }

    // Пересчитываем общую сумму
    await this.calculateTotal(order.id);

    return await this.findById(order.id);
  }

  // Найти заказ по ID
  async findById(orderId: number) {
    return await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'telegram_id', 'username', 'first_name', 'phone'],
        },
        {
          model: OrderItem,
          as: 'order_items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name_ru', 'name_tj', 'name_uz', 'image_url'],
          }],
        },
      ],
    });
  }

  // Найти заказы пользователя
  async findByUserId(userId: number, limit: number = 10) {
    return await Order.findAll({
      where: { user_id: userId },
      include: [{
        model: OrderItem,
        as: 'order_items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name_ru', 'name_tj', 'name_uz'],
        }],
      }],
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  // Обновить статус заказа
  async updateStatus(orderId: number, status: string) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    await order.save();

    return order;
  }

  // Пересчитать общую сумму заказа
  async calculateTotal(orderId: number) {
    const total = await orderItemService.calculateOrderTotal(orderId);

    const order = await Order.findByPk(orderId);
    if (order) {
      order.total_amount = total;
      await order.save();
    }

    return total;
  }

  // Получить статистику заказов
  async getStats() {
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('total_amount');
    const pendingOrders = await Order.count({ where: { status: 'pending' } });

    return {
      total_orders: totalOrders,
      total_revenue: totalRevenue || 0,
      pending_orders: pendingOrders,
    };
  }
}

export const orderService = new OrderService();