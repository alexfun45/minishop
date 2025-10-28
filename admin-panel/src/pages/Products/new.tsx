// pages/products/new.tsx
import React, { useState } from 'react';
import { Header } from '../../components/header';
import { useCategories } from '../../hooks/useCategories';
import {apiClient} from '../../services/api'
import { useNavigate } from "react-router-dom";
import { ImageUpload } from '../../components/ImageUpload'
import { useProducts } from '../../hooks/useProducts';

export const NewProduct: React.FC = () => {
  const { categories, loading } = useCategories();
  const {createProduct} = useProducts();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name_ru: '',
    name_tj: '',
    name_uz: '',
    description_ru: '',
    description_tj: '',
    description_uz: '',
    price: '',
    old_price: '',
    category_id: '',
    weight: '',
    ingredients_ru: '',
    ingredients_tj: '',
    ingredients_uz: '',
    image_url: '',
    available: true
  });
  let navigate = useNavigate();

  const resetForm = () => {
    setFormData({
      name_ru: '',
      name_tj: '',
      name_uz: '',
      description_ru: '',
      description_tj: '',
      description_uz: '',
      price: '',
      old_price: '',
      category_id: '',
      weight: '',
      ingredients_ru: '',
      ingredients_tj: '',
      ingredients_uz: '',
      image_url: '',
      available: true
      });
    setImageFile(null);
  };
  let submitData = new FormData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      
      console.log('formData', formData);
      /*Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'image_url' && value !== null && value !== undefined) {
          console.log('value', value);
          submitData.append(key, value.toString());
        }
      });*/
      console.log('submitData', submitData);
      // Добавляем файл изображения
      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.image_url && !imageFile) {
        submitData.append('image_url', formData.image_url);
      }
      
      //createProduct(submitData);
      //resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
    }
    //apiClient.post('/products/create', formData);
    //navigate("/products");
  };

  const handleImageChange = (file: File | null, previewUrl: string | null) => {
    setImageFile(file);
    if (previewUrl && !file) {
      // Если это URL, а не файл
      setFormData(prev => ({ ...prev, image_url: previewUrl }));
    } else {
      setFormData(prev => ({ ...prev, image_url: '' }));
    }
  };

  const handleCancel = () => {
    navigate("/products");
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = (type === 'checkbox') ? (e.target as HTMLInputElement).checked : value
    submitData.append(name, val.toString());
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
              Добавить новый товар
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Основная информация
              </h3>
              <ImageUpload
                  onImageChange={handleImageChange}
                  existingImageUrl={formData.image_url}
                  label="Изображение категории"
                />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Русское название */}
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

                {/* Цена */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Цена (₽) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                {/* Категория */}
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                    Категория *
                  </label>
                  <select
                    name="category_id"
                    id="category_id"
                    required
                    value={formData.category_id}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name_ru}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Вес */}
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                    Вес/размер
                  </label>
                  <input
                    type="text"
                    name="weight"
                    id="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="500г, 1л, и т.д."
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Многоязычные описания */}
              <div className="mt-6">
                <label htmlFor="description_ru" className="block text-sm font-medium text-gray-700">
                  Описание (русский)
                </label>
                <textarea
                  name="description_ru"
                  id="description_ru"
                  rows={3}
                  value={formData.description_ru}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Дополнительные названия */}
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
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

              {/* Старая цена */}
              <div className="mt-6">
                <label htmlFor="old_price" className="block text-sm font-medium text-gray-700">
                  Старая цена (для акции)
                </label>
                <input
                  type="number"
                  name="old_price"
                  id="old_price"
                  min="0"
                  step="0.01"
                  value={formData.old_price}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Ингредиенты */}
              <div className="mt-6">
                <label htmlFor="ingredients_ru" className="block text-sm font-medium text-gray-700">
                  Ингредиенты (русский)
                </label>
                <textarea
                  name="ingredients_ru"
                  id="ingredients_ru"
                  rows={2}
                  value={formData.ingredients_ru}
                  onChange={handleChange}
                  placeholder="Мука, вода, соль, дрожжи..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Доступность */}
              <div className="mt-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="available"
                    id="available"
                    checked={formData.available}
                    onChange={handleChange}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
                    Товар доступен для заказа
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Создать товар
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};