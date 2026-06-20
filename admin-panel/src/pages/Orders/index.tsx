import React, { useState, useMemo, useEffect } from 'react';
import type { Order } from '../../types/index';
import { useOrders } from '../../hooks/useOrders';

const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

type SortKey = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export const OrdersManagement: React.FC = () => {
  const { orders, updateOrder, deleteOrder, loading } = useOrders();
  const [filter, setFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'delivered' | 'cancelled'>('active');
  
  const [sortBy, setSortBy] = useState<SortKey>('date_desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Стейт для принудительного ререндера при смене темы оформления в DOM
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Следим за добавлением/удалением класса 'dark' на элементе html/body
  useEffect(() => {
    const checkTheme = () => {
      const darkModeOn = document.documentElement.classList.contains('dark') || 
                         document.body.classList.contains('dark');
      setIsDarkMode(darkModeOn);
    };

    // Первичная проверка при монтировании
    checkTheme();

    // Настраиваем observer, чтобы ловить глобальное переключение темы без перезагрузки
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40',
    confirmed: 'bg-blue-50 text-blue-950 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40',
    preparing: 'bg-purple-50 text-purple-950 dark:bg-purple-950/30 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40',
    ready: 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40',
    delivered: 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800/60 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60',
    cancelled: 'bg-red-50 text-red-950 dark:bg-red-950/30 dark:text-red-300 border border-red-200/60 dark:border-red-900/40'
  };

  const statusLabels: Record<string, string> = {
    pending: 'Ожидает',
    confirmed: 'Подтвержден',
    preparing: 'Готовится',
    ready: 'Готов',
    delivered: 'Доставлен',
    cancelled: 'Отменен'
  };

  const processedOrders = useMemo(() => {
    let result = orders.filter(order => {
      if (activeTab === 'active') return order.status !== 'delivered' && order.status !== 'cancelled';
      if (activeTab === 'delivered') return order.status === 'delivered';
      if (activeTab === 'cancelled') return order.status === 'cancelled';
      return true;
    });

    if (filter !== 'all') {
      result = result.filter(order => order.status === filter);
    }

    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      if (sortBy === 'date_desc') return dateB - dateA;
      if (sortBy === 'date_asc') return dateA - dateB;
      if (sortBy === 'amount_desc') return (b.total_amount || 0) - (a.total_amount || 0);
      if (sortBy === 'amount_asc') return (a.total_amount || 0) - (b.total_amount || 0);
      return 0;
    });
  }, [orders, activeTab, filter, sortBy]);

  const totalPages = Math.ceil(processedOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const safePage = currentPage > totalPages ? 1 : currentPage;
    const startIndex = (safePage - 1) * itemsPerPage;
    return processedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [processedOrders, currentPage, itemsPerPage, totalPages]);

  const handleStatusChange = async (orderId: number, newStatus: Order['status']) => {
    try {
      await updateOrder(orderId, newStatus);
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
    }
  };

  const handleOrderDelete = async (orderId: number) => {
    const isConfirmed = window.confirm(`Вы уверены, что хотите безвозвратно удалить заказ #${orderId}?`);
    if (!isConfirmed) return;
    try {
      if (typeof deleteOrder === 'function') await deleteOrder(orderId);
    } catch (error) {
      console.error("Ошибка при удалении заказа:", error);
    }
  };

  const getPaymentMethod = (payment_value: string) => {
    switch(payment_value) {
      case 'cash': return 'Наличные';
      case 'online': return 'Онлайн';
      case 'card': return 'Картой';
      default: return payment_value;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-zinc-950 pb-20 text-gray-950 dark:text-zinc-50 transition-colors duration-300">      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* ХЕДЕР С ПАНЕЛЬЮ УПРАВЛЕНИЯ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-zinc-200/80 dark:border-zinc-800/60 pb-5">
          <div>
            <h2 className="text-xl font-black text-gray-950 dark:text-white sm:text-2xl tracking-tight">
              Управление заказами
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <label className="font-bold text-zinc-500 dark:text-zinc-400">Статус:</label>
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 font-bold text-gray-950 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Все</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="font-bold text-zinc-500 dark:text-zinc-400">Сортировка:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 font-bold text-gray-950 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="date_desc">Сначала новые ↓</option>
                <option value="date_asc">Сначала старые ↑</option>
                <option value="amount_desc">Сумма: по убыванию ↓</option>
                <option value="amount_asc">Сумма: по возрастанию ↑</option>
              </select>
            </div>
          </div>
        </div>

        {/* ТАБЫ КАТЕГОРИЙ */}
        <div className="flex space-x-2 border-b border-zinc-200/80 dark:border-zinc-800/60 mb-6 text-xs">
          {(['active', 'delivered', 'cancelled'] as const).map((tab) => {
            const isTabActive = activeTab === tab;
            const count = orders.filter(o => {
              if (tab === 'active') return o.status !== 'delivered' && o.status !== 'cancelled';
              return o.status === tab;
            }).length;

            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setFilter('all'); setCurrentPage(1); }}
                className={`py-2.5 px-4 font-bold transition-all relative rounded-t-xl ${
                  isTabActive 
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white/40 dark:bg-zinc-900/30' 
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab === 'active' && 'Активные'}
                {tab === 'delivered' && 'Выполненные'}
                {tab === 'cancelled' && 'Отмененные'}
                <span className="ml-2 bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 py-0.5 px-2 rounded-full text-[10px] font-black">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* СПИСОК ЗАКАЗОВ */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-10 italic text-zinc-400 dark:text-zinc-500">Считывание базы данных...</div>
          ) : (
            <>
              {paginatedOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="group relative bg-white/70 dark:bg-zinc-900/65 backdrop-blur-md border border-white dark:border-zinc-800/50 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_10px_40px_-8px_rgba(0,0,0,0.5)] hover:border-zinc-200 dark:hover:border-indigo-500/20 transition-all duration-300 overflow-hidden text-left"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* КОЛОНКА 1: ID, КЛИЕНТ И ВРЕМЯ */}
                    <div className="lg:col-span-4 flex items-start gap-3.5">
                      <div className="h-10 w-10 bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-800/40 rounded-xl flex items-center justify-center text-zinc-950 dark:text-white font-black border border-zinc-200/60 dark:border-zinc-700/60 shrink-0 text-xs shadow-sm transition-transform duration-300 group-hover:scale-105">
                        #{order.id}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-gray-950 dark:text-white truncate leading-tight tracking-tight">
                          {order.customer_name}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold mt-1">{order.customer_phone}</p>
                        
                        <div className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500 space-y-0.5 font-medium">
                          <p><span className="font-bold text-zinc-400/80 dark:text-zinc-500">Создан:</span> <span className="text-zinc-700 dark:text-zinc-300">{formatDate(order.createdAt)}</span></p>
                          <p><span className="font-bold text-zinc-400/80 dark:text-zinc-500">Время:</span> <span className="text-zinc-700 dark:text-zinc-300">{order.delivery_time || 'Как можно скорее'}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* КОЛОНКА 2: АДРЕС И ОПЛАТА */}
                    <div className="lg:col-span-4 text-xs space-y-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-zinc-100 dark:border-zinc-800/40">
                      <div>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-wider">Адрес доставки</p>
                        <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-1.5 line-clamp-2 leading-relaxed">{order.delivery_address}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 pt-0.5">
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-wider">Оплата</p>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-zinc-800 dark:text-zinc-200">
                            {getPaymentMethod(order.payment_method)}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tight ${
                            order.payment_status === 'payment_success' 
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                              : 'bg-red-500/10 text-red-700 dark:text-red-400'
                          }`}>
                            {order.payment_status === 'payment_success' ? 'Оплачено' : 'Не оплачено'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* КОЛОНКА 3: СОСТАВ КОРЗИНЫ */}
                    <div className="lg:col-span-4 bg-zinc-50/60 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/40 text-xs">
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black mb-2 tracking-wider">Состав заказа</p>
                      <div className="space-y-1.5 max-h-[90px] overflow-y-auto pr-1">
                        {order.order_items?.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-zinc-700 dark:text-zinc-300 font-bold text-[11px]">
                            <span className="truncate mr-2 font-medium">
                              {item.product_name} <span className="text-zinc-400 dark:text-zinc-500 font-normal text-[10px]">×{item.quantity}</span>
                            </span>
                            <span className="font-black shrink-0 text-zinc-950 dark:text-zinc-100">{item.price * item.quantity} ₽</span>
                          </div>
                        ))}
                      </div>
                      
                      {order.comment && (
                        <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 text-[11px] text-amber-700 dark:text-amber-400 font-semibold italic truncate">
                          💬 {order.comment}
                        </div>
                      )}

                      <div className="flex justify-between items-baseline pt-2 mt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="font-black text-zinc-400 dark:text-zinc-500 text-[9px] uppercase tracking-wider">Итого:</span>
                        <span className="text-base font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{order.total_amount} ₽</span>
                      </div>
                    </div>

                  </div>

                  {/* НИЖНЯЯ ПАНЕЛЬ ДЕЙСТВИЙ */}
                  <div className="bg-zinc-50/50 dark:bg-zinc-900/30 px-5 py-3 border-t border-zinc-100 dark:border-zinc-800/40 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-wider">Статус:</label>
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                        className={`text-[11px] font-bold rounded-lg px-2.5 py-1 cursor-pointer focus:outline-none transition-all shadow-sm ${statusColors[order.status]}`}
                      >
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <option key={key} value={key} className="bg-white dark:bg-zinc-900 text-gray-950 dark:text-zinc-100">{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <>
                          {order.status === 'pending' && (
                            <button onClick={() => handleStatusChange(order.id, 'confirmed')} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors">
                              Принять
                            </button>
                          )}
                          {order.status === 'confirmed' && (
                            <button onClick={() => handleStatusChange(order.id, 'preparing')} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors">
                              Готовить
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button onClick={() => handleStatusChange(order.id, 'ready')} className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors">
                              Готов
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button onClick={() => handleStatusChange(order.id, 'delivered')} className="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-[11px] font-bold rounded-lg shadow-sm transition-colors">
                              Доставить
                            </button>
                          )}
                          <button onClick={() => handleStatusChange(order.id, 'cancelled')} className="px-3.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-red-600 dark:text-red-400 text-[11px] font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors">
                            Отмена
                          </button>
                        </>
                      )}

                      {order.status === 'cancelled' && (
                        <button 
                          onClick={() => handleOrderDelete(order.id)} 
                          className="px-3 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded-lg shadow-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                        >
                          Удалить
                        </button>
                      )}

                      <button 
                        onClick={() => setSelectedOrder(order)} 
                        className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 uppercase tracking-wider px-2 py-1 transition-colors"
                      >
                        Лог
                      </button>
                    </div>
                  </div>

                </div>
              ))}

              {processedOrders.length === 0 && (
                <div className="text-center py-16 bg-white/60 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold text-xs">
                  Нет заказов, соответствующих выборке
                </div>
              )}
            </>
          )}
        </div>

        {/* БЛОК ПОСТРАНИЧНОГО ВЫВОДА */}
        {processedOrders.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-zinc-200/60 dark:border-zinc-800/60 pt-5">
            <div className="flex items-center space-x-2 text-zinc-400 dark:text-zinc-500 font-bold">
              <span>Показывать по:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-0.5 text-gray-950 dark:text-zinc-200 focus:ring-1 focus:ring-indigo-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span className="font-medium text-zinc-400/60">из {processedOrders.length}</span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold disabled:opacity-30 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Назад
              </button>
              <div className="px-4 py-1.5 font-black text-gray-950 dark:text-zinc-200 bg-zinc-200/40 dark:bg-zinc-900/40 rounded-lg">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold disabled:opacity-30 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Вперед
              </button>
            </div>
          </div>
        )}

      </main>

      {/* МОДАЛЬНОЕ ОКНО */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-left border border-white dark:border-zinc-800 transition-colors">
            <h3 className="text-sm font-black text-gray-950 dark:text-white mb-4 flex items-center">
              <span className="mr-2">🔍</span> Технические параметры
            </h3>
            <div className="space-y-2 text-[11px] font-mono bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-850 text-zinc-600 dark:text-zinc-400">
               <p><span className="text-zinc-400 dark:text-zinc-500 font-bold">Telegram ID:</span> {selectedOrder.telegram_id}</p>
               <p><span className="text-zinc-400 dark:text-zinc-500 font-bold">Координаты:</span> {selectedOrder.delivery_lat}, {selectedOrder.delivery_lng}</p>
            </div>
            <button 
              onClick={() => setSelectedOrder(null)}
              className="mt-6 w-full py-2.5 bg-gray-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};