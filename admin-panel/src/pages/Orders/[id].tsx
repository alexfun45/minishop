import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/header';

interface OrderItem {
  id: string;
  product_id: string;
  name_ru: string;
  name_tj: string;
  name_uz: string;
  price: number;
  quantity: number;
  total: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: 'new' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  items: OrderItem[];
  notes?: string;
}

export const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Mock данные заказа
        const mockOrder: Order = {
          id: id || '1234',
          customer_name: 'Алишер Каримов',
          customer_phone: '+992 123-45-67',
          customer_address: 'г. Душанбе, ул. Рудаки 45, кв. 12',
          status: 'preparing',
          total_amount: 1250,
          created_at: '2024-01-20T14:30:00Z',
          notes: 'Позвонить за 15 минут до доставки',
          items: [
            {
              id: '1',
              product_id: '1',
              name_ru: 'Хлеб Бородинский',
              name_tj: 'Нони Бородинский',
              name_uz: 'Borodinskiy noni',
              price: 85,
              quantity: 2,
              total: 170
            },
            {
              id: '2',
              product_id: '2',
              name_ru: 'Круассан с шоколадом',
              name_tj: 'Круассан бо шоколад',
              name_uz: 'Shokoladli kruassan',
              price: 120,
              quantity: 3,
              total: 360
            },
            {
              id: '3',
              product_id: '3',
              name_ru: 'Наполеон торт',
              name_tj: 'Торти Наполеон',
              name_uz: 'Napoleon torti',
              price: 720,
              quantity: 1,
              total: 720
            }
          ]
        };
        
        setOrder(mockOrder);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching order:', error);
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const statusLabels = {
    new: { label: 'Новый', color: 'bg-blue-100 text-blue-800' },
    preparing: { label: 'Готовится', color: 'bg-amber-100 text-amber-800' },
    ready: { label: 'Готов', color: 'bg-green-100 text-green-800' },
    delivering: { label: 'Доставляется', color: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Доставлен', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Отменен', color: 'bg-red-100 text-red-800' }
  };

  const updateStatus = async (newStatus: Order['status']) => {
    try {
      // Здесь будет вызов API для обновления статуса
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      console.log('Updating order status to:', newStatus);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Загрузка...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Заказ не найден</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Заголовок и статус */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Заказ #{order.id}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Создан {new Date(order.created_at).toLocaleString('ru-RU')}
            </p>
          </div>
          <div className="mt-4 flex items-center space-x-4 md:mt-0">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusLabels[order.status].color}`}>
              {statusLabels[order.status].label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Товары в заказе */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Состав заказа
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <ul className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.name_ru}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.name_tj} / {item.name_uz}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.price} ₽ × {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.total} ₽
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>Итого</p>
                    <p>{order.total_amount} ₽</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Примечания */}
            {order.notes && (
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Примечания к заказу
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Информация о клиенте */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Информация о клиенте
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Имя</dt>
                    <dd className="text-sm text-gray-900">{order.customer_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Телефон</dt>
                    <dd className="text-sm text-gray-900">
                      <a href={`tel:${order.customer_phone}`} className="text-amber-600 hover:text-amber-500">
                        {order.customer_phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Адрес</dt>
                    <dd className="text-sm text-gray-900">{order.customer_address}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Управление статусом */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Управление заказом
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-3">
                  {Object.entries(statusLabels).map(([status, { label, color }]) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(status as Order['status'])}
                      disabled={order.status === status}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                        order.status === status
                          ? color + ' font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      } disabled:opacity-50`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/orders')}
                    className="w-full bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    Назад к списку заказов
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};