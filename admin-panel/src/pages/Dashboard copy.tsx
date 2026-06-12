import React from 'react';
import { Header } from '../components/header'
import { StatCard } from '../components/dashboard/StatCard';
import { RecentOrders } from '../components/dashboard/RecentOrders';
import { QuickActions } from '../components/dashboard/QuickActions';
import type {Order} from '../types/index'
import { useOrders } from '../hooks/useOrders'
import { useProducts } from '../hooks/useProducts';
import { Activity } from '../components/dashboard/Activity';

// Mock данные - потом замените на реальные из API
const mockStats = {
  totalOrders: 154,
  revenue: 125430,
  activeProducts: 28,
  pendingOrders: 12
};


const Dashboard: React.FC = () => {
  const {orders} = useOrders();
  const {products} = useProducts();

  console.log('products', products);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Всего заказов"
            value={orders.length}
            icon="📦"
            color="blue"
          />
          <StatCard
            title="Выручка"
            value={`${mockStats.revenue.toLocaleString()} ₽`}
            change={8}
            icon="💰"
            color="green"
          />
          <StatCard
            title="Товаров в продаже"
            value={(products)?products.length:0}
            change={-2}
            icon="🍞"
            color="amber"
          />
          <StatCard
            title="Ожидают обработки"
            value={ (orders.filter((v: Order)=>v.payment_status=='pending')).length }
            change={5}
            icon="⏳"
            color="red"
          />
        </div>

        {/* Основной контент */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RecentOrders orders={orders} />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Дополнительные виджеты */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Графики, популярные товары и т.д. */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Популярные товары</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Хлеб белый</span>
                <span className="font-medium">45 продаж</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Круассан</span>
                <span className="font-medium">38 продаж</span>
              </div>
            </div>
          </div>
          <Activity/>
        </div>
      </main>
    </div>
  );
};

export default Dashboard