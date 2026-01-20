// pages/orders/index.tsx
import React, { useState } from 'react';
import { Header } from '../../components/header';
import { useOrders } from '../../hooks/useOrders';

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  delivery_address: string;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

export const OrdersManagement: React.FC = () => {
  const {orders, loading}: {orders: Order[], loading: boolean} = useOrders();
  const [filter, setFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mock данные
  const mockOrders: Order[] = [
    {
      id: 1001,
      customer_name: 'Иван Петров',
      customer_phone: '+992123456789',
      total_amount: 1250,
      status: 'pending',
      delivery_address: 'ул. Мирзо Турсунзода 45, кв. 12',
      payment_method: 'cash',
      created_at: '2024-01-15T10:30:00Z',
      order_items: [
        { product_name: 'Хлеб белый', quantity: 2, price: 50 },
        { product_name: 'Круассан', quantity: 3, price: 80 }
      ]
    }
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    pending: 'Ожидает',
    confirmed: 'Подтвержден',
    preparing: 'Готовится',
    ready: 'Готов',
    delivered: 'Доставлен',
    cancelled: 'Отменен'
  };

  const updateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
    // API call to update status
    console.log(`Updating order ${orderId} to ${newStatus}`);
  };

  const filteredOrders = filter === 'all' 
    ? mockOrders 
    : mockOrders.filter(order => order.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Управление заказами
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
            >
              <option value="all">Все заказы</option>
              <option value="pending">Ожидают обработки</option>
              <option value="confirmed">Подтвержденные</option>
              <option value="preparing">Готовятся</option>
              <option value="ready">Готовы к выдаче</option>
              <option value="delivered">Доставленные</option>
            </select>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {orders.map((order) => (
              <li key={order.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                          <span className="text-amber-800 font-bold text-sm">#</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Заказ #{order.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer_name} • {order.customer_phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                      <div className="text-sm text-gray-900 font-medium">
                        {order.total_amount} ₽
                      </div>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-amber-600 hover:text-amber-900 text-sm font-medium"
                      >
                        Подробнее
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        📍 {order.delivery_address}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <span>
                        {new Date(order.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>
                  </div>

                  {/* Быстрое управление статусом */}
                  <div className="mt-3 flex space-x-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                      >
                        Подтвердить
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Начать готовить
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700"
                      >
                        Готов
                      </button>
                    )}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Отменить
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Модальное окно с деталями заказа */}
        {selectedOrder && (
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Детали заказа #{selectedOrder.id}
                </h3>
                {/* Детали заказа */}
                <div className="mt-2">
                  <p><strong>Клиент:</strong> {selectedOrder.customer_name}</p>
                  <p><strong>Телефон:</strong> {selectedOrder.customer_phone}</p>
                  <p><strong>Адрес:</strong> {selectedOrder.delivery_address}</p>
                  <p><strong>Способ оплаты:</strong> {selectedOrder.payment_method === 'cash' ? 'Наличные' : 'Карта'}</p>
                  
                  <div className="mt-4">
                    <h4 className="font-medium">Состав заказа:</h4>
                    {selectedOrder.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between mt-1">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span>{item.price * item.quantity} ₽</span>
                      </div>
                    ))}
                    <div className="flex justify-between mt-2 border-t pt-2 font-medium">
                      <span>Итого:</span>
                      <span>{selectedOrder.total_amount} ₽</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:text-sm"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};