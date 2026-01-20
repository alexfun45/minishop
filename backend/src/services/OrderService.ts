import { Order, OrderItem, User, Product } from '../models/index.ts';
import { orderItemService } from './OrderItemService.ts';

export class OrderService {

  async getOrders(){
    const orders = await Order.findAll();
   
    return orders.map((order: any) => ({
      id: order.id,
      user_id: order.user_id,
      telegram_id: order.telegram_id,
      total_amount: order.total_amount,
      status: order.status,
      delivery_address: order.delivery_address,
      delivery_time: order.delivery_time,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      notes: order.notes,
      //product_count: await this.getProductCount(category.id),
    }));
  }

  // Создать заказ
  async create(orderData: any) {
    const { items, user_id, ...orderMainData } = orderData;

    try {
      // Сначала находим или создаем пользователя
      let user = await User.findOne({ where: { telegram_id: user_id } });
      
      if (!user) {
        // Создаем нового пользователя
        user = await User.create({
          telegram_id: user_id,
          role: 'user',
          username: orderData.customer_name || 'Пользователь',
          phone: orderData.customer_phone,
          //created_at: new Date()
        });
      }
  
      // Создаем заказ с user_id из найденного/созданного пользователя
      const order = await Order.create({
        ...orderMainData,
        user_id: user.id, // Используем id из таблицы users
        telegram_id: user_id // Сохраняем также telegram_id для быстрого поиска
      });
  
      // Добавляем товары в заказ
      if (items && items.length > 0) {
        await orderItemService.addItemsToOrder(order.id, items);
      }
  
      // Пересчитываем общую сумму
      await this.calculateTotal(order.id);
  
      return await this.findById(order.id);
  
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
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
      where: { telegram_id: userId },
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