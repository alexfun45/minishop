import { Order, OrderItem, User, Product } from '../models/index.js';
import { orderItemService } from './OrderItemService.js';
import {sendStatusUpdateNotification} from '../api/telegramNotification.js'
import { Op, fn, col } from 'sequelize';
import sequelize from '../config/database.js';

export class OrderService {

  async getOrders(){
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: 'order_items'
        }]
    });
    return orders;
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
      items: (order.order_items || []).map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product ? item.product.name_ru : 'Товар',
        quantity: item.quantity,
        price: item.price
      })),
      created_at: order.created_at
      //product_count: await this.getProductCount(category.id),
    }));
  }

  async update(orderId: number, key: string, newValue: any) {
    const order: any = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Product not found');
    }
    order[key] = newValue;
    await order.save();
  }


  // Создать заказ
  async create(orderData: any) {
    const { items, user_id, telegram_id, ...orderMainData } = orderData;

    try {
      // Сначала находим или создаем пользователя
      let user = await User.findOne({
        where: {
          [Op.or]: [
            { user_id: user_id },       // Условие 1: совпадает внутренний ID
            { telegram_id: telegram_id } // Условие 2: совпадает Telegram ID
          ]
        }
      });
     
      if (!user) {
        // Создаем нового пользователя
        user = await User.create({
          user_id: user_id,
          telegram_id: (orderMainData.telegram_id) ? orderMainData.telegram_id : null, 
          role: 'user',
          username: orderData.customer_name || 'Пользователь',
          phone: orderData.customer_phone,
          //created_at: new Date()
        });
      } else{
        if (user.username !== orderMainData.name || user.phone !== orderMainData.phone) {
          user.username = orderMainData.name;
          user.phone = orderMainData.phone;
          if (telegram_id && !user.telegram_id) {
              user.telegram_id = telegram_id;
          }
          await user.save();
        }
      }
  
      // Создаем заказ с user_id из найденного/созданного пользователя
      const order = await Order.create({
        ...orderMainData,
        user_id: user.id, // Используем id из таблицы users
        telegram_id: (telegram_id) ? telegram_id : null,
      });
      
      const itemsToCreate = [];

      for (const item of orderData.items) {
        // Находим продукт в базе данных по его id, чтобы взять имя и картинку
        const product = await Product.findByPk(item.product_id);
        
        if (!product) {
          throw new Error(`Продукт с ID ${item.product_id} не найден`);
        }

        itemsToCreate.push({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price, 
          product_name: product.name_ru,
          product_image: product.image_url
        });

      }
      // Добавляем товары в заказ
      if (itemsToCreate && itemsToCreate.length > 0) {
        await OrderItem.bulkCreate(itemsToCreate);
        //await orderItemService.addItemsToOrder(order.id, items);
      }
  
      // Пересчитываем общую сумму
      await this.calculateTotal(order.id);
  
      return await this.findById(order.id);
  
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  }

  async delete(orderId: number) {
    return await Order.destroy({
      where: {
        id: orderId
      },
    });
  }

  // Найти заказ по ID
  async findById(orderId: number) {
    const orderInstance = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'user_id', 'username', 'first_name', 'phone'],
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

    if (!orderInstance) return null;

    // Превращаем в простой JSON-объект
    const order = orderInstance.get({ plain: true }) as any;

    // Преобразуем структуру под нужды бота (чтобы items был простым плоским массивом)
    return {
      id: order.id,
      user_id: order.user_id,
      telegram_id: order.telegram_id,
      total_amount: order.total_amount,
      status: order.status,
      delivery_time: order.delivery_time,
      delivery_address: order.delivery_address,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      payment_method: order.payment_method,
      payment_url: order.payment_url, // Убедись, что это поле есть в твоей модели БД для хранения ссылок ЮKassa
      items: (order.order_items || []).map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product ? item.product.name_ru : 'Товар',
        quantity: item.quantity,
        price: item.price
      }))
    };
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

  async updatePaymentStatus(orderId: number, status: string){
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    order.payment_status = status;
    await order.save();

  }

  // Обновить статус заказа
  async updateStatus(orderId: number, status: string) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    console.log('order service', order);
    console.log(`отправляю в чат ${order.telegram_id}`);

    if(order.telegram_id)
      await sendStatusUpdateNotification(order.telegram_id, orderId, status);
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

  async getPopularProducts() {
    try {
      const popularItems = await OrderItem.findAll({
        attributes: [
          'product_id',
          // Суммируем количество купленных штук
          [fn('SUM', col('quantity')), 'total_sales']
        ],
        include: [
          {
            model: Order,
            as: 'order', // Название связи OrderItem -> Order
            attributes: [], // Из самого заказа поля в селект не берем
            where: {
              // Только успешные и неоплаченные/оплаченные, исключая отмены
              status: { [Op.ne]: 'cancelled' },
              payment_status: { [Op.in]: ['paid', 'payment_success'] }
            }
          },
          {
            model: Product,
            as: 'product', // Название связи OrderItem -> Product
            // Вытягиваем нужные для фронтенда поля из таблицы продуктов
            attributes: ['name_ru', 'image_url', 'price']
          }
        ],
        // Группируем по ID товара и по всем полям из Product, которые участвуют в выборке
        group: [
          'OrderItem.product_id', 
          'product.id', 
          'product.name_ru', 
          'product.image_url', 
          'product.price'
        ],
        // Сортируем по сумме проданного от большего к меньшему
        order: [[fn('SUM', col('quantity')), 'DESC']],
        limit: 10,
        // Убираем nesting, чтобы получить плоский или удобно вложенный объект
        nest: true,
        raw: true
      });
      
      // Мапим данные в чистый и понятный формат для фронтенд-панели
      return popularItems.map((item: any) => ({
        productId: item.product_id,
        name: item.product?.name_ru || 'Без названия',
        image: item.product?.image_url || '',
        price: item.product?.price ? Number(item.product.price) : Number(item.price), // Фолбэк на историческую цену из OrderItem, если в Product она изменилась
        salesCount: Number(item.total_sales)
      }));
  
    } catch (error) {
      console.error('Ошибка при получении популярных товаров:', error);
      return [];
    }
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

  async getBasicStats() {
    let totalRevenue = await Order.sum('total_amount', {
      where: {
        // Исключаем отмененные заказы и берем только успешные статусы оплаты
        status: { [Op.ne]: 'cancelled' },
        [Op.or]: [
          {
            payment_status: { [Op.in]: ['payment_success'] }
          },
          {
            status: {[Op.in]: ['delivered']}
          }
      ]
      }
    });
    
    totalRevenue = totalRevenue ? Number(totalRevenue) : 0;
    const popularProducts: any = await this.getPopularProducts();
    // Если заказов нет, sum вернет NaN или null, поэтому приводим к числу
    return {
      totalRevenue: totalRevenue,
      popularProducts: popularProducts
    }
  }

  async getAdvancedStats() {
    // 1. Общие показатели (За всё время)
    const totalOrders = await Order.count();
    const paidStatuses = ['payment_success', 'delivered'];
    // Приводим результат sum к числу, так как DECIMAL в БД возвращается строкой
    const totalRevenueResult = await Order.sum('total_amount', {
      where: { status: { [Op.in]: paidStatuses } }
    });
    const totalRevenue = Number(totalRevenueResult) || 0;
  
    // Берем статусы строго из твоего ENUM в модели
    const pendingOrders = await Order.count({ where: { status: 'pending_payment' } });
    const completedOrders = await Order.count({ where: { status: 'delivered' } }); // у тебя финальный статус 'delivered'
  
    // 2. Статистика выручки по дням за последние 7 дней
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
    const revenueByDay = await Order.findAll({
      attributes: [
        [fn('DATE', col('Order.created_at')), 'date'], 
        [fn('SUM', col('total_amount')), 'total']
      ],
      where: {
        status: { [Op.in]: paidStatuses },
        delivery_time: { [Op.gte]: sevenDaysAgo } // Здесь пишем имя свойства из модели (createdAt)
      },
      group: [fn('DATE', col('Order.created_at'))],
      order: [[fn('DATE', col('Order.created_at')), 'ASC']],
      raw: true
    });
  
    // 3. Топ-5 популярных товаров
    const topProducts = await OrderItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('quantity')), 'total_quantity']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name_ru'],
        // Внутренний include для фильтрации по статусу самого заказа
      }, {
        model: Order,
        as: 'order', // Убедись, что связь OrderItem -> Order называется так
        attributes: [],
        where: { status: { [Op.in]: paidStatuses } } 
      }],
      group: ['product_id', 'product.id'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: 5,
      raw: true,
      nest: true
    });
  
    return {
      summary: {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        pending_orders: pendingOrders,
        completed_orders: completedOrders
      },
      // Безопасный маппинг дат
      revenueData: revenueByDay.map((item: any) => {
        const rawDate = item.date;
        const formattedDate = rawDate 
          ? new Date(rawDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
          : 'Неизвестно';
          
        return {
          date: formattedDate,
          'Выручка (₽)': parseFloat(item.total) || 0
        };
      }),
      topProductsData: topProducts.map((item: any) => ({
        name: item.product?.name_ru || `Товар #${item.product_id}`,
        value: parseInt(item.total_quantity, 10) || 0
      }))
    };
  }

}

export const orderService = new OrderService();