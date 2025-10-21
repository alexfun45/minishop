import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  color: 'green' | 'blue' | 'amber' | 'red';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700', 
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
};