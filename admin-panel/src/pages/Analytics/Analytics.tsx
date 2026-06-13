import React, { useEffect, useState } from 'react';
import { Header } from '../../components/header';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, Clock, CheckCircle } from 'lucide-react';
import { apiClient } from '../../services/api';

interface StatsState {
  summary: {
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    completed_orders: number;
  };
  revenueData: Array<{ date: string; 'Выручка (₽)': number }>;
  topProductsData: Array<{ name: string; value: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const StatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Подставь сюда свой метод запроса к API бэкенда
    apiClient.get('/stats')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Ошибка загрузки статистики:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6 text-center text-xl">Загрузка аналитики...</div>;
  if (!stats) return <div className="p-6 text-center text-red-500">Не удалось загрузить данные.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">📊 Аналитика магазина</h1>

      {/* РЯД 1: Карточки с основными показателями */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Карточка 1: Выручка */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase">Общая выручка</p>
            <p className="text-2xl font-bold text-gray-800">{stats.summary.total_revenue.toLocaleString()} ₽</p>
          </div>
        </div>

        {/* Карточка 2: Всего заказов */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase">Всего заказов</p>
            <p className="text-2xl font-bold text-gray-800">{stats.summary.total_orders}</p>
          </div>
        </div>

        {/* Карточка 3: Ожидают оплаты */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase">Ждут оплаты</p>
            <p className="text-2xl font-bold text-gray-800">{stats.summary.pending_orders}</p>
          </div>
        </div>

        {/* Карточка 4: Выполненные */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase">Выполнены</p>
            <p className="text-2xl font-bold text-gray-800">{stats.summary.completed_orders}</p>
          </div>
        </div>
      </div>

      {/* РЯД 2: Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Линейный график выручки (Занимает 2 колонки) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Тренды выручки (За 7 дней)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value} ₽`]} />
                <Legend />
                <Line type="monotone" dataKey="Выручка (₽)" stroke="#10B981" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Круговая диаграмма топ товаров (Занимает 1 колонку) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Популярные товары (шт.)</h2>
          <div className="h-80 flex flex-col justify-center items-center">
            {stats.topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={stats.topProductsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.topProductsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400">Нет данных о проданных товарах</p>
            )}
          </div>
        </div>

      </div>
    </div>
    </div>
  );
};