import React from 'react';

interface Action {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

export const QuickActions: React.FC = () => {
  const actions: Action[] = [
    {
      title: 'Добавить товар',
      description: 'Создать новую позицию в меню',
      icon: '➕',
      href: '/products/new',
      color: 'bg-green-50 text-green-700 hover:bg-green-100'
    },
    {
      title: 'Товары',
      description: 'Просмотр товаров',
      icon: '🏬',
      href: '/products',
      color: 'bg-orange-50 text-black-700 hover:bg-green-100'
    },
    {
      title: 'Управление заказами',
      description: 'Просмотр и обработка заказов',
      icon: '📦',
      href: '/orders',
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100'
    },
    {
      title: 'Категории',
      description: 'Управление категориями товаров',
      icon: '📁',
      href: '/categories',
      color: 'bg-amber-50 text-amber-700 hover:bg-amber-100'
    },
    {
      title: 'Статистика',
      description: 'Аналитика и отчеты',
      icon: '📊',
      href: '/analytics',
      color: 'bg-purple-50 text-purple-700 hover:bg-purple-100'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Быстрые действия</h3>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <a
            key={index}
            href={action.href}
            className={`p-4 rounded-lg border border-transparent transition-all duration-200 hover:shadow-md ${action.color}`}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">{action.icon}</span>
              <div>
                <div className="font-medium">{action.title}</div>
                <div className="text-sm opacity-75">{action.description}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};