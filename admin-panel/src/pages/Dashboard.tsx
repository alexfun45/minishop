import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { RecentOrders } from '../components/dashboard/RecentOrders';
import { useOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import { Activity } from '../components/dashboard/Activity';

import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

import { 
  LayoutGrid, 
  ShoppingCart, 
  Package, 
  Users, 
  MessageSquare, 
  Sun, 
  Moon, 
  LogOut, 
  Search,
  Banknote,
  Award,
  Calendar
} from 'lucide-react';

const salesData = [
  { day: '01', sales: 4200 },
  { day: '05', sales: 7800 },
  { day: '10', sales: 6100 },
  { day: '15', sales: 12500 },
  { day: '20', sales: 9400 },
  { day: '25', sales: 14200 },
  { day: '30', sales: 19500 },
];

const Dashboard: React.FC = () => {
  const { orders = [] } = useOrders();
  const { products = [] } = useProducts();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('admin-theme') === 'dark';
  });

  useEffect(() => {
    const html = window.document.documentElement;
    const body = window.document.body;
    const appRoot = window.document.getElementById('root') || window.document.querySelector('.App');

    if (darkMode) {
      html.classList.add('dark');
      body.className = 'dark bg-[#0F172A] text-slate-100 antialiased';
      localStorage.setItem('admin-theme', 'dark');
    } else {
      html.classList.remove('dark');
      body.className = 'bg-[#F8FAFC] text-slate-900 antialiased';
      localStorage.setItem('admin-theme', 'light');
    }

    if (appRoot) {
      appRoot.setAttribute('style', 'max-width: 100% !important; width: 100% !important; padding: 0 !important; margin: 0 !important;');
    }
  }, [darkMode]);

  const totalRevenue = 125430;
  const activeProductsCount = products ? products.length : 0;
  const pendingOrdersCount = orders.filter((o: any) => o.payment_status === 'pending').length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="w-5 h-5" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-5 h-5" />, count: orders.length },
    { id: 'products', label: 'Products', icon: <Package className="w-5 h-5" />, count: activeProductsCount },
    { id: 'customers', label: 'Customers', icon: <Users className="w-5 h-5" /> },
    { id: 'ai-assistant', label: 'AI Assistant', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  return (
    <div className={`w-full h-screen font-sans flex overflow-hidden transition-colors duration-300 ${
      darkMode ? 'bg-[#0F172A] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      
      {/* ЛЕВЫЙ САЙДБАР (Теперь полностью динамический) */}
      <aside className={`w-64 border-r flex flex-col h-full flex-shrink-0 z-20 transition-all duration-300 ${
        darkMode ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-teal-600/20">
              C
            </div>
            <span className={`font-bold text-xl tracking-tight transition-colors ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Sellvo <span className="text-teal-600">Admin</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-teal-600/10 text-teal-600 dark:text-teal-400 border-r-4 border-teal-600 rounded-r-none' 
                    : darkMode 
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                {item.count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-teal-600/20 text-teal-600' 
                      : darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className={`p-6 border-t space-y-2 transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-teal-600" />}
            <span>{darkMode ? 'Светлая тема' : 'Темная тема'}</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
            <LogOut className="w-5 h-5" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* ОСНОВНАЯ РАБОЧАЯ ОБЛАСТЬ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* ВЕРХНИЙ ХЕДЕР (Динамические цвета) */}
        <header className={`h-20 border-b px-8 flex items-center justify-between sticky top-0 z-10 flex-shrink-0 transition-all duration-300 ${
          darkMode ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Поиск по панели..." 
              className={`w-full border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-600/20 focus:outline-none transition-colors ${
                darkMode ? 'bg-slate-900 text-white placeholder-slate-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Alex Devlab</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest">Store Manager</p>
            </div>
            <div className={`w-10 h-10 rounded-full border overflow-hidden ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Avatar" />
            </div>
          </div>
        </header>

        {/* КОНТЕНТ СТРАНИЦЫ */}
        <main className="flex-1 py-8 px-8 lg:px-16 overflow-y-auto w-full max-w-full">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Dashboard <span className="text-slate-400 dark:text-slate-500 font-light">Overview</span>
            </h1>
          </div>

          {/* СЕТКА МЕТРИК */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Earnings"
              value={`${totalRevenue.toLocaleString()} ₽`}
              change={12}
              icon={<Banknote className="w-6 h-6" />}
              color="teal"
            />
            <StatCard
              title="Active Matrix"
              value={`${activeProductsCount} Items`}
              change={-2.5}
              icon={<Package className="w-6 h-6" />}
              color="orange"
            />
            <StatCard
              title="Pending Processing"
              value={pendingOrdersCount}
              change={5}
              icon={<ShoppingCart className="w-6 h-6" />}
              color="blue"
            />
          </div>

          {/* СЕТКА: ГРАФИК ПРОДАЖ + ПОПУЛЯРНЫЕ ТОВАРЫ */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
  
  {/* ГРАФИК ПРОДАЖ */}
  <div className={`p-6 lg:p-8 rounded-3xl border shadow-sm flex flex-col justify-between transition-all duration-300 min-w-0 lg:col-span-2 h-[460px] ${
    darkMode ? 'bg-[#1E293B] border-slate-800/60' : 'bg-white border-slate-100'
  }`}>
    <div className="flex justify-between items-center mb-4 flex-shrink-0">
      <div>
        <h4 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>Sales Analysis</h4>
        <p className="text-xs text-slate-400 mt-0.5">Динамика выручки по числам месяца</p>
      </div>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors flex-shrink-0 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
      }`}>
        <Calendar className="w-3.5 h-3.5 text-teal-600" />
        <span>Текущий месяц</span>
      </div>
    </div>

    {/* График теперь занимает всё оставшееся место внутри 460-пиксельной карточки */}
    <div className="w-full flex-1 min-h-0 relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#E2E8F0'} opacity={0.5} />
          <XAxis dataKey="day" stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: darkMode ? '#1E293B' : '#FFFFFF', 
              borderColor: darkMode ? '#334155' : '#E2E8F0',
              borderRadius: '12px',
              color: darkMode ? '#F1F5F9' : '#0F172A',
            }} 
          />
          <Area type="monotone" dataKey="sales" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* ПОПУЛЯРНЫЕ ТОВАРЫ */}
  {/* Добавлен класс h-full, чтобы блок растянулся ровно под высоту соседа (460px) */}
  <div className={`p-6 lg:p-8 rounded-3xl border shadow-sm h-full flex flex-col justify-start transition-all duration-300 ${
    darkMode ? 'bg-[#1E293B] border-slate-800/60' : 'bg-white border-slate-100'
  }`}>
    <h4 className={`font-bold text-lg mb-6 flex items-center gap-2 flex-shrink-0 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
      <Award className="w-5 h-5 text-teal-600" /> Popular Items
    </h4>
    <div className="space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100" className="w-full h-full object-cover" alt="Bread" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>Sourdough Bread</p>
          <p className="text-xs text-slate-400">45 sales</p>
        </div>
        <p className="font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">450 ₽</p>
      </div>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <img src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100" className="w-full h-full object-cover" alt="Croissant" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>Cherry Croissant</p>
          <p className="text-xs text-slate-400">38 sales</p>
        </div>
        <p className="font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">180 ₽</p>
      </div>
    </div>
  </div>

</div>

          {/* ТАБЛИЦА СТАТУСА ЗАКАЗОВ */}
          <div className="w-full mb-8">
            <RecentOrders orders={orders} />
          </div>

          {/* ЖИВАЯ АКТИВНОСТЬ */}
          <div className="w-full">
            <Activity />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;