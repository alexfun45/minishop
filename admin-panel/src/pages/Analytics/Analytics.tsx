import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  BarChart, Bar, Cell as BarCell 
} from 'recharts';
import { DollarSign, ShoppingBag, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { apiClient } from '../../services/api';

// 1. Расширяем интерфейс типов под новые данные с бэкенда
interface StatsState {
  summary: {
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    completed_orders: number;
  };
  revenueData: Array<{ date: string; 'Выручка (₽)': number }>;
  topProductsData: Array<{ name: string; value: number }>;
  // Новые поля аналитики:
  funnelData: Array<{ step: string; count: number; fill: string }>;
  cartSourcesData: Array<{ name: string; value: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
// Палитра для источников (сделаем ИИ-бот выделяющимся янтарным/золотым цветом)
const SOURCE_COLORS: Record<string, string> = {
  'Главный каталог': '#3B82F6',   // Blue
  'Карточка товара': '#10B981',   // Green
  'ИИ Чат-бот': '#F59E0B',        // Amber / Gold
  'Неизвестно': '#9CA3AF'         // Gray
};

export const StatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) return <div className="p-6 text-center text-xl font-medium text-gray-500">Загрузка аналитики...</div>;
  if (!stats) return <div className="p-6 text-center text-red-500 font-medium">Не удалось загрузить данные.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
        <span>📊</span> Аналитика магазина
      </h1>

      {/* РЯД 1: Карточки с основными показателями */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Карточка 1: Выручка */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Общая выручка</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{stats.summary.total_revenue.toLocaleString()} ₽</p>
          </div>
        </div>

        {/* Карточка 2: Всего заказов */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Всего заказов</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{stats.summary.total_orders}</p>
          </div>
        </div>

        {/* Карточка 3: Ожидают оплаты */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ждут оплаты</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{stats.summary.pending_orders}</p>
          </div>
        </div>

        {/* Карточка 4: Выполненные */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Выполнены</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{stats.summary.completed_orders}</p>
          </div>
        </div>
      </div>

      {/* РЯД 2: Основные тренды продаж и топ товаров */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Линейный график выручки */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Тренды выручки (За последние 7 дней)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} formatter={(value: any) => [`${value} ₽`]} />
                <Legend />
                <Line type="monotone" dataKey="Выручка (₽)" stroke="#10B981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Круговая диаграмма топ товаров */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Популярные товары (Продажи в шт.)</h2>
          <div className="h-80 flex flex-col justify-center items-center">
            {stats.topProductsData && stats.topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.topProductsData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.topProductsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm">Нет данных о проданных товарах</p>
            )}
          </div>
        </div>
      </div>

      {/* 🚀 РЯД 3: НОВЫЙ БЛОК — Сквозная ИИ и продуктовая аналитика (Воронка + Источники) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Воронка конверсии (BarChart) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800">Маркетинговая воронка конверсии</h2>
            <p className="text-xs text-gray-400 mt-0.5">Количество уникальных событий за последние 30 дней</p>
          </div>
          <div className="h-80">
            {stats.funnelData && stats.funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.funnelData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="step" tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(243, 244, 246, 0.6)' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} 
                    formatter={(value: any) => [`${value} раз(а)`, 'Активность']} 
                  />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} maxBarSize={60}>
                    {stats.funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center pt-24 text-sm">Данные воронки еще не накопились</p>
            )}
          </div>
        </div>

        {/* Эффективность ИИ-бота (PieChart источников) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Источники добавлений</h2>
            <p className="text-xs text-gray-400 mt-0.5">Вклад ИИ-ассистента в наполнение корзин</p>
          </div>
          
          <div className="h-64 flex justify-center items-center relative mt-2">
            {stats.cartSourcesData && stats.cartSourcesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.cartSourcesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0} // Делаем сплошным пирогом для разнообразия внешнего вида
                    outerRadius={80}
                    dataKey="value"
                  >
                    {stats.cartSourcesData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={SOURCE_COLORS[entry.name] || SOURCE_COLORS['Неизвестно']} 
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(value: any) => [`${value} добавлений`]} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm">Добавления в корзину пока не зафиксированы</p>
            )}
          </div>

          {/* Небольшой красивый инсайт-блок под графиком источников */}
          {stats.cartSourcesData && stats.cartSourcesData.length > 0 && (
            <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between text-xs text-amber-800">
              <span className="font-medium flex items-center gap-1.5">
                ✨ Роботы работают на тебя
              </span>
              <span className="font-bold">
                {(() => {
                  const aiVal = stats.cartSourcesData.find(d => d.name === 'ИИ Чат-бот')?.value || 0;
                  const totalVal = stats.cartSourcesData.reduce((acc, curr) => acc + curr.value, 0);
                  return totalVal > 0 ? `${Math.round((aiVal / totalVal) * 100)}% от корзины` : '0%';
                })()}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};