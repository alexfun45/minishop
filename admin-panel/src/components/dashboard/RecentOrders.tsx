import React from 'react';
import type { Order } from '../../types/index';

interface RecentOrdersProps {
  orders: Order[];
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ orders = [] }) => {
  
  // Хелпер для отрисовки красивых статусов
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">
            Доставлен
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wider">
            Ожидает
          </span>
        );
      case 'payment_success':
        return (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wider">
            Успешная оплата
          </span>
        )
      case 'confirmed':
        return (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wider">
            Подтверждён
          </span>
        )
      case 'preparing':
        return (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wider">
            Готовится
          </span>
        )
      case 'ready':
        return (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wider">
            Готов к выдаче
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wider">
            Отменён
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h4 className="font-bold text-lg text-slate-900 dark:text-white">Последние заказы</h4>
        <button className="text-teal-600 dark:text-teal-400 text-sm font-bold hover:underline">
          Посмотреть все заказы
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest font-bold">
            <tr>
              <th className="px-8 py-4">Номер заказа</th>
              <th className="px-8 py-4">Имя клиента</th>
              <th className="px-8 py-4">Статус</th>
              <th className="px-8 py-4">Количество</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-8 text-center text-sm text-slate-400">
                  Активные заказы не найдены
                </td>
              </tr>
            ) : (
              orders.slice(0, 5).map((order, idx) => (
                <tr 
                  key={order.id || idx} 
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors duration-150"
                >
                  <td className="px-8 py-5 text-sm font-bold text-slate-900 dark:text-white">
                    #ORD-{order.id ? order.id.toString().slice(-4) : idx + 9024}
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-600 dark:text-slate-300">
                    {order.customer_name || 'Inconnu'}
                  </td>
                  <td className="px-8 py-5">
                    {renderStatusBadge(order.payment_status)}
                  </td>
                  {/*<td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">
                    {order.total_price ? `${order.total_price.toLocaleString()} ₽` : '0 ₽'}
                  </td>*/}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};