import React, { useState, useMemo } from 'react';
import { Header } from '../../components/header';
import type { Order } from '../../types/index';
import { useOrders } from '../../hooks/useOrders';

// Вспомогательная функция для красивого формата даты
const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

export const OrdersManagement: React.FC = () => {
  const { orders, updateOrder, loading } = useOrders();
  const [filter, setFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusLabels: Record<string, string> = {
    pending: 'Ожидает',
    confirmed: 'Подтвержден',
    preparing: 'Готовится',
    ready: 'Готов',
    delivered: 'Доставлен',
    cancelled: 'Отменен'
  };

  type TabType = 'active' | 'delivered' | 'cancelled';

  const [activeTab, setActiveTab] = useState<TabType>('active');

  // Логика фильтрации заказов по статусу
  /*const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(order => order.status === filter);
  }, [orders, filter]);
  */

  const filteredOrders = orders.filter(order => {
      if (activeTab === 'active') {
        // Показываем ВСЁ, что требует внимания админа
        return order.status !== 'delivered' && order.status !== 'cancelled';
      }
      if (activeTab === 'delivered') {
        return order.status === 'delivered';
      }
      if (activeTab === 'cancelled') {
        return order.status === 'cancelled';
      }
      return true;
  });


  const handleStatusChange = async (orderId: number, newStatus: Order['status']) => {
    try {
      await updateOrder(orderId, newStatus);
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Заголовок и Фильтр */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-extrabold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Управление заказами
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Статус:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="all">Все заказы</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="orders-manager">
    {/* Панель вкладок */}
    <div className="flex space-x-2 border-b border-gray-200 mb-6">
      <button
        onClick={() => setActiveTab('active')}
        className={`py-2 px-4 font-medium text-sm transition-all ${
          activeTab === 'active' 
            ? 'border-b-2 border-blue-600 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Активные 
        {/* Счетчик активных заказов */}
        <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-bold">
          {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}
        </span>
      </button>

      <button
        onClick={() => setActiveTab('delivered')}
        className={`py-2 px-4 font-medium text-sm transition-all ${
          activeTab === 'delivered' 
            ? 'border-b-2 border-blue-600 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Выполненные
      </button>

      <button
        onClick={() => setActiveTab('cancelled')}
        className={`py-2 px-4 font-medium text-sm transition-all ${
          activeTab === 'cancelled' 
            ? 'border-b-2 border-blue-600 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Отмененные
      </button>
    </div>
    <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20 italic text-gray-500">Загрузка данных...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6">
                  
                  {/* ВЕРХНЯЯ ЧАСТЬ: Номер, Клиент, Общая сумма */}
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-black border border-amber-100 text-lg">
                        #{order.id}
                      </div>
                      <div className="ml-4 text-left">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{order.customer_name}</h3>
                        <p className="text-sm text-gray-500 font-medium">{order.customer_phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="text-2xl font-black text-gray-900">{order.total_amount} ₽</div>
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                        className={`mt-2 text-[10px] uppercase tracking-wider font-bold rounded-full px-3 py-1 border-none cursor-pointer transition-colors ${statusColors[order.status]}`}
                      >
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* СРЕДНЯЯ ЧАСТЬ: Две колонки (Инфо слева | Состав справа) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-b py-6 border-gray-50">
                    
                    {/* Левая колонка: Доставка и Оплата */}
                    <div className="flex flex-col space-y-4 text-left">
                      <div className="flex items-start">
                        <span className="text-lg mr-3">📍</span>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Адрес доставки</p>
                          <p className="text-sm font-semibold text-gray-800">{order.delivery_address}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <span className="text-lg mr-3">⏰</span>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Желаемое время</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {order.delivery_time ? order.delivery_time : 'Как можно скорее'}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Создан: {formatDate(order.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <span className="text-lg mr-3">💳</span>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Оплата</p>
                          <div className="flex items-center mt-0.5">
                            <span className="text-sm font-semibold text-gray-800">
                              {order.payment_method === 'cash' ? 'Наличные' : 'Картой онлайн'}
                            </span>
                            <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {order.payment_status === 'paid' ? 'Оплачено' : 'Не оплачено'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Правая колонка: Заметки и Состав */}
                    <div className="flex flex-col space-y-4 text-left">
                      <div className={`p-4 rounded-xl border ${order.notes ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                        <p className="text-[10px] text-amber-800 uppercase font-black mb-1">Заметка пекарю:</p>
                        <p className="text-sm text-gray-700 italic leading-relaxed">
                          {order.notes || 'Клиент не оставил комментариев'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight mb-3">Состав корзины:</p>
                        <div className="space-y-2">
                          {order.order_items?.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700 font-medium">
                                {item.product_name} <span className="text-gray-400 font-normal ml-1">x {item.quantity}</span>
                              </span>
                              <span className="font-bold text-gray-900">{item.price * item.quantity} ₽</span>
                            </div>
                          ))}
                          <div className="flex justify-between pt-3 mt-2 border-t border-gray-100">
                            <span className="text-sm font-bold text-gray-900">Итого к оплате:</span>
                            <span className="text-lg font-black text-amber-600">{order.total_amount} ₽</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* НИЖНЯЯ ЧАСТЬ: Быстрые кнопки управления */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'confirmed')}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 shadow-sm transition-all"
                      >
                        Принять заказ
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'preparing')}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                      >
                        Начать готовить
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'ready')}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 shadow-sm transition-all"
                      >
                        Готов к выдаче
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleStatusChange(order.id, 'cancelled')}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-all"
                    >
                      Отмена
                    </button>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="ml-auto text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest p-2"
                    >
                      Инфо
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 font-medium">
                Нет заказов в категории «{statusLabels[filter] || 'Все'}»
              </div>
            )}
          </div>
        )}
        </div>
        </div>
      </main>

      {/* Модалка с доп. данными (ID, координаты и т.д.) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-left">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
              <span className="mr-2">🔍</span> Технические данные
            </h3>
            <div className="space-y-4 text-xs font-mono bg-gray-50 p-5 rounded-xl border border-gray-100 text-gray-600">
               <p><span className="text-gray-400">Telegram ID:</span> {selectedOrder.telegram_id}</p>
               <p><span className="text-gray-400">Координаты:</span> {selectedOrder.delivery_lat}, {selectedOrder.delivery_lng}</p>
               <p><span className="text-gray-400">User ID:</span> {selectedOrder.telegram_id}</p>
            </div>
            <button 
              onClick={() => setSelectedOrder(null)}
              className="mt-8 w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
};