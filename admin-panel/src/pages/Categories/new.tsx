import React, { useState } from 'react';
import { Header } from '../../components/header';
import { useCategories } from '../../hooks/useCategories';

export const NewCategory: React.FC = () => {
  const { createCategory, loading } = useCategories();
  const [formData, setFormData] = useState({
    name_ru: '',
    name_tj: '',
    name_uz: '',
    description_ru: '',
    description_tj: '',
    description_uz: '',
    sort_order: 0,
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory(formData);
      // Редирект или уведомление об успехе
      console.log('Category created successfully');
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Создать новую категорию
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Информация о категории
              </h3>
              
              {/* Названия на трех языках */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label htmlFor="name_ru" className="block text-sm font-medium text-gray-700">
                    Название (русский) *
                  </label>
                  <input
                    type="text"
                    name="name_ru"
                    id="name_ru"
                    required
                    value={formData.name_ru}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label htmlFor="name_tj" className="block text-sm font-medium text-gray-700">
                    Название (таджикский)
                  </label>
                  <input
                    type="text"
                    name="name_tj"
                    id="name_tj"
                    value={formData.name_tj}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label htmlFor="name_uz" className="block text-sm font-medium text-gray-700">
                    Название (узбекский)
                  </label>
                  <input
                    type="text"
                    name="name_uz"
                    id="name_uz"
                    value={formData.name_uz}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Описания на трех языках */}
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="description_ru" className="block text-sm font-medium text-gray-700">
                    Описание (русский)
                  </label>
                  <textarea
                    name="description_ru"
                    id="description_ru"
                    rows={2}
                    value={formData.description_ru}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label htmlFor="description_tj" className="block text-sm font-medium text-gray-700">
                    Описание (таджикский)
                  </label>
                  <textarea
                    name="description_tj"
                    id="description_tj"
                    rows={2}
                    value={formData.description_tj}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label htmlFor="description_uz" className="block text-sm font-medium text-gray-700">
                    Описание (узбекский)
                  </label>
                  <textarea
                    name="description_uz"
                    id="description_uz"
                    rows={2}
                    value={formData.description_uz}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Порядок сортировки и активность */}
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700">
                    Порядок сортировки
                  </label>
                  <input
                    type="number"
                    name="sort_order"
                    id="sort_order"
                    min="0"
                    value={formData.sort_order}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Категория активна
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Создать категорию
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};