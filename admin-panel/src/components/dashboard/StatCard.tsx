import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'teal' | 'orange' | 'blue';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color }) => {
  // Цветовые схемы в концепции Sellvo
  const colorClasses = {
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    orange: 'bg-orange-500/10 text-orange-500 dark:text-orange-400',
    blue: 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>

      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-bold ${change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{change > 0 ? '+' : ''} {change}%</span>
          <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">за последний месяц</span>
        </div>
      )}
    </div>
  );
};