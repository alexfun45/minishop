// pages/categories/index.tsx
import React, { useState, useRef } from 'react';
import { Header } from '../../components/header';
import { useCategories } from '../../hooks/useCategories';

export const CategoriesManagement: React.FC = () => {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
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

  // Сброс формы
  const resetForm = () => {
    setFormData({
      name_ru: '', name_tj: '', name_uz: '', description_ru: '', description_tj: '', description_uz: '',
      image_url: '', sort_order: 0, is_active: true
    });
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      
      // Добавляем текстовые поля
      Object.entries(formData).forEach(([key, value]) => {
        //console.log('value', value);
        if (key !== 'image_url' && value!==null && value!==undefined) { // Не добавляем старый image_url если есть новый файл
          submitData.append(key, value.toString());
        }
      });
      // Добавляем файл изображения, если есть
      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.image_url && !imageFile) {
        // Если есть URL изображения и нет нового файла, сохраняем URL
        submitData.append('image_url', formData.image_url);
      }
      if (editingId) {
        await updateCategory(editingId, submitData);
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
      setFormData(prev => ({ ...prev, image_url: '' })); // Очищаем URL если загружаем файл
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, перетащите файл изображения');
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

  const startEdit = (category: any) => {
    setEditingId(category.id);
    setFormData(category);
    setImagePreview(category.image_url || null);
    setImageFile(null);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
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
              onClick={startCreate}
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Загрузка изображения */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Изображение категории
                  </label>
                  
                  {imagePreview ? (
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          {imageFile ? 'Новое изображение' : 'Текущее изображение'}
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 text-sm text-amber-600 hover:text-amber-500"
                        >
                          Выбрать другое изображение
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-amber-400 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <span className="relative cursor-pointer rounded-md font-medium text-amber-600 hover:text-amber-500">
                            Загрузите изображение
                          </span>
                          <p className="pl-1">или перетащите его сюда</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF до 5MB
                        </p>
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
                  
                  {/* Поле для URL изображения (альтернатива загрузке файла) */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Основные поля */}
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

                {/* Описания */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Описание (русский)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description_ru}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Описание (таджикский)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description_tj}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_tj: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Описание (узбекский)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description_uz}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_uz: e.target.value }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    />
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
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
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
            {categories.map((category: any) => (
              <li key={category.id}>
                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      {category.image_url ? (
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={category.image_url}
                          alt={category.name_ru}
                        />
                      ) : (
                        <span className="text-amber-600 text-lg">📁</span>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name_ru}
                      </div>
                      <div className="text-sm text-gray-500">
                        {category.name_tj} / {category.name_uz}
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
                      onClick={() => {
                        if (window.confirm(`Удалить категорию "${category.name_ru}"?`)) {
                          deleteCategory(category.id);
                        }
                      }}
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