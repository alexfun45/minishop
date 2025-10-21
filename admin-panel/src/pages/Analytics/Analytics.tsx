import React from 'react';
import { Header } from '../../components/header';

export const Analytics: React.FC = () => {
  // Mock данные для статистики
  const stats = {
    totalRevenue: 125430,
    totalOrders: 154,
    averageOrder: 814,
    popularProducts: [
      { name: 'Хлеб белый', sales: 45, revenue: 2250 },
      { name: 'Круассан', sales: 38, revenue: 3040 },
      { name: 'Пирожок с мясом', sales: 32, revenue: 2560 },
    ],
    dailyOrders: [
      { date: '15 янв', orders: 12, revenue: 9800 },
      { date: '16 янв', orders: 18, revenue: 14600 },
      { date: '17 янв', orders: 15, revenue: 12200 },
      { date: '18 янв', orders: 22, revenue: 17900 },
      { date: '19 янв', orders: 14, revenue: 11400 },
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl mb-8">
          Статистика и аналитика
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Общая выручка
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.totalRevenue.toLocaleString()} ₽
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Всего заказов
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.totalOrders}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Средний чек
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.averageOrder} ₽
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Активных товаров
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                28
              </dd>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Популярные товары */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Популярные товары
              </h3>
              <div className="space-y-4">
                {stats.popularProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.sales} продаж
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {product.revenue} ₽
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Статистика по дням */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Заказы по дням
              </h3>
              <div className="space-y-3">
                {stats.dailyOrders.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {day.date}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {day.orders} заказов
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {day.revenue.toLocaleString()} ₽
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
       