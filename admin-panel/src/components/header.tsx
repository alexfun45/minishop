import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Лого и название */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🍞</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-gray-900">Панель управления пекарней</h1>
            </div>
          </div>

          {/* Правая часть */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                Онлайн
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};