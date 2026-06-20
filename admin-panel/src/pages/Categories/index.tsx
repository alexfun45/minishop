// pages/categories/index.tsx
import React, { useState, useRef } from 'react';
import { useCategories } from '../../hooks/useCategories';

type ViewMode = 'list' | 'create' | 'edit';

interface CategoryFormData {
  name_ru: string;
  name_tj: string;
  name_uz: string;
  description_ru: string;
  description_tj: string;
  description_uz: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

const initialFormState: CategoryFormData = {
  name_ru: '',
  name_tj: '',
  name_uz: '',
  description_ru: '',
  description_tj: '',
  description_uz: '',
  image_url: '',
  sort_order: 0,
  is_active: true
};

export const CategoriesManagement: React.FC = () => {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  
  const [view, setView] = useState<ViewMode>('list');
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormState);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const resetForm = () => {
    setFormData(initialFormState);
    setImageFile(null);
    setImagePreview(null);
    setCurrentCategoryId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setView('list');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'image_url' && value !== null && value !== undefined) {
          submitData.append(key, value.toString());
        }
      });

      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.image_url) {
        submitData.append('image_url', formData.image_url);
      }

      if (view === 'edit' && currentCategoryId) {
        await updateCategory(currentCategoryId, submitData);
      } else {
        await createCategory(submitData);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите файл изображения');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }
      
      setImageFile(file);
      setFormData(prev => ({ ...prev, image_url: '' }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startEdit = (category: any) => {
    setCurrentCategoryId(category.id);
    setFormData({
      name_ru: category.name_ru || '',
      name_tj: category.name_tj || '',
      name_uz: category.name_uz || '',
      description_ru: category.description_ru || '',
      description_tj: category.description_tj || '',
      description_uz: category.description_uz || '',
      image_url: category.image_url || '',
      sort_order: category.sort_order || 0,
      is_active: category.is_active !== undefined ? category.is_active : true
    });
    setImagePreview(category.image_url || null);
    setImageFile(null);
    setView('edit');
  };

  const startCreate = () => {
    resetForm();
    setView('create');
  };

  if (loading) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">      
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Шапка */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl">
              Управление категориями
            </h2>
          </div>
          {view === 'list' && (
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={startCreate}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Добавить категорию
              </button>
            </div>
          )}
        </div>

        {/* Форма создания/редактирования */}
        {(view === 'create' || view === 'edit') && (
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                {view === 'edit' ? 'Редактирование категории' : 'Новая категория'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Загрузка изображения */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Изображение категории
                  </label>
                  
                  {imagePreview ? (
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {imageFile ? 'Новое изображение' : 'Текущее изображение'}
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 text-sm text-amber-600 hover:text-amber-500 font-medium dark:text-amber-400 dark:hover:text-amber-300"
                        >
                          Выбрать другое
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith('image/')) {
                          setImageFile(file);
                          const reader = new FileReader();
                          reader.onload = (el) => setImagePreview(el.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-amber-400 dark:hover:border-amber-500 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="space-y-1 text-center">
                        <span className="text-3xl block mb-2">📸</span>
                        <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                          <span className="relative cursor-pointer rounded-md font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300">
                            Загрузите изображение
                          </span>
                          <p className="pl-1">или перетащите</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF до 5MB</p>
                      </div>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Или укажите URL изображения
                    </label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, image_url: e.target.value }));
                        if (e.target.value) {
                          setImagePreview(e.target.value);
                          setImageFile(null);
                        }
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Название *</label>
                    <input
                      type="text"
                      required
                      value={formData.name_ru}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>                  
                </div>

                {/* Описания */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
                    <textarea
                      rows={2}
                      value={formData.description_ru}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Сортировка и статус */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Порядок сортировки</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center mt-5">
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-300 select-none">
                      Категория активна
                    </label>
                  </div>
                </div>

                {/* Кнопки управления формой */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
                  >
                    {view === 'edit' ? 'Обновить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Список категорий */}
        {view === 'list' && (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md border border-gray-200 dark:border-gray-700">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {categories?.map((category: any) => (
                <li key={category.id}>
                  <div className="px-4 py-4 flex items-center justify-between sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                        {category.image_url ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={category.image_url}
                            alt={category.name_ru}
                          />
                        ) : (
                          <span className="text-amber-600 dark:text-amber-500 text-lg">📁</span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {category.name_ru}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {category.name_tj || '—'} / {category.name_uz || '—'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                          <span>Порядок: {category.sort_order}</span>
                          <span>•</span>
                          {category.is_active ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">Активна</span>
                          ) : (
                            <span className="text-red-500 dark:text-red-400 font-medium">Неактивна</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => startEdit(category)}
                        className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 text-sm font-medium"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Удалить категорию "${category.name_ru}"?`)) {
                            deleteCategory(category.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {(!categories || categories.length === 0) && (
                <li className="p-6 text-center text-gray-400 dark:text-gray-500">Список категорий пуст</li>
              )}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};