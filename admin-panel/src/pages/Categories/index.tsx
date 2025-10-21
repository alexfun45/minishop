// pages/categories/index.tsx
import React, { useState } from 'react';
import { Header } from '../../components/header';
import { useCategories } from '../../hooks/useCategories';

export const CategoriesManagement: React.FC = () => {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name_ru: '',
    name_tj: '',
    name_uz: '',
    description_ru: '',
    description_tj: '',
    description_uz: '',
    image_url: '',
    sort_order: 0,
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateCategory(editingId, formData);
      setEditingId(null);
    } else {
      await createCategory(formData);
      setIsCreating(false);
    }
    setFormData({
      name_ru: '', name_tj: '', name_uz: '', description_ru: '', description_tj: '', description_uz: '',
      image_url: '', sort_order: 0, is_active: true
    });
  };

  const startEdit = (category: any) => {
    setEditingId(category.id);
    setFormData(category);
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Управление категориями
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => setIsCreating(true)}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Добавить категорию
            </button>
          </div>
        </div>

        {/* Форма создания/редактирования */}
        {(isCreating || editingId) && (
          <div className="bg-white shadow sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {editingId ? 'Редактирование категории' : 'Новая категория'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Название (русский) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name_ru}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Название (таджикский)
                    </label>
                    <input
                      type="text"
                      value={formData.name_tj}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_tj: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Название (узбекский)
                    </label>
                    <input
                      type="text"
                      value={formData.name_uz}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_uz: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Порядок сортировки
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      URL изображения
                    </label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Категория активна
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingId(null);
                      setFormData({
                        name_ru: '', name_tj: '', name_uz: '', description_ru: '', description_tj: '', description_uz: '',
                        image_url: '', sort_order: 0, is_active: true
                      });
                    }}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
                  >
                    {editingId ? 'Обновить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Список категорий */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {categories.map((category:any) => (
              <li key={category.id}>
                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                  <div className="flex items-center">
                    {category.image_url && (
                      <img
                        className="h-10 w-10 rounded-lg object-cover"
                        src={category.image_url}
                        alt={category.name_ru}
                      />
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name_ru}
                      </div>
                      <div className="text-sm text-gray-500">
                        Порядок: {category.sort_order} • 
                        {category.is_active ? (
                          <span className="text-green-600 ml-1">Активна</span>
                        ) : (
                          <span className="text-red-600 ml-1">Неактивна</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="text-amber-600 hover:text-amber-900 text-sm font-medium"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};