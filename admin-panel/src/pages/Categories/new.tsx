import React, { useState, useRef } from 'react';
import { Header } from '../../components/header';
import { useCategories } from '../../hooks/useCategories';

export const NewCategory: React.FC = () => {
  const { createCategory, loading } = useCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
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

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Создаем FormData для отправки файла
      const submitData = new FormData();
      
      // Добавляем текстовые поля
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value.toString());
      });
      
      // Добавляем файл изображения, если есть
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      await createCategory(submitData);
      console.log('Category created successfully');
      
      // Сброс формы после успешного создания
      setFormData({
        name_ru: '',
        name_tj: '',
        name_uz: '',
        description_ru: '',
        description_tj: '',
        description_uz: '',
        sort_order: 0,
        is_active: true
      });
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите файл изображения');
        return;
      }
      
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Создаем preview изображения
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
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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

              {/* Загрузка изображения */}
              <div className="mb-6">
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
                      <p className="text-sm text-gray-600">Изображение выбрано</p>
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
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-amber-400 transition-colors cursor-pointer"
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
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer rounded-md font-medium text-amber-600 hover:text-amber-500">
                          <span>Загрузите изображение</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">или перетащите его сюда</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF до 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
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