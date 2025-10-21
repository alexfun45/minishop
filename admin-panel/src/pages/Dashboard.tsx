import React from 'react';
import { Header } from '../components/header'
import { StatCard } from '../components/dashboard/StatCard';
import { RecentOrders } from '../components/dashboard/RecentOrders';
import { QuickActions } from '../components/dashboard/QuickActions';

// Mock данные - потом замените на реальные из API
const mockStats = {
  totalOrders: 154,
  revenue: 125430,
  activeProducts: 28,
  pendingOrders: 12
};

const mockOrders = [
  {
    id: 1001,
    customer_name: 'Иван Петров',
    total: 1250,
    status: 'pending' as const,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 1002, 
    customer_name: 'Мария Сидорова',
    total: 890,
    status: 'confirmed' as const,
    created_at: '2024-01-15T09:15:00Z'
  },
  // ... больше заказов
];

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Всего заказов"
            value={mockStats.totalOrders}
            change={12}
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
            value={mockStats.activeProducts}
            change={-2}
            icon="🍞"
            color="amber"
          />
          <StatCard
            title="Ожидают обработки"
            value={mockStats.pendingOrders}
            change={5}
            icon="⏳"
            color="red"
          />
        </div>

        {/* Основной контент */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RecentOrders orders={mockOrders} />
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Активность</h3>
            <div className="space-y-2 text-sm">
              <div>✅ Новый заказ #1003</div>
              <div>🔄 Статус заказа #1001 изменен</div>
              <div>📦 Добавлен новый товар</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard