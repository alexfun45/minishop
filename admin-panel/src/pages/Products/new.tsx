// pages/products/new.tsx
import React, { useState } from 'react';
import { Header } from '../../components/header';
import { useCategories } from '../../hooks/useCategories';
import { useNavigate } from "react-router-dom";
import { ImageUpload } from '../../components/ImageUpload';
import { useProducts } from '../../hooks/useProducts';
import { apiClient } from '../../services/api';

export const NewProduct: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { categories, loading } = useCategories();
  const { createProduct } = useProducts();
  const [imageFile, setImageFile] = useState<File | null>(null);
  let navigate = useNavigate();

  // --- СОСТОЯНИЯ ДЛЯ ИИ ФУНКЦИОНАЛА ---
  const [aiTextPrompt, setAiTextPrompt] = useState('');
  const [isGeneratingForm, setIsGeneratingForm] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [backgroundPreset, setBackgroundPreset] = useState('');
  const [customBannerPrompt, setCustomBannerPrompt] = useState('');

  // --- ОСНОВНАЯ ФОРМА ---
  const [formData, setFormData] = useState({
    name_ru: '',
    name_tj: '',
    name_uz: '',
    description_ru: '',
    description_tj: '',
    description_uz: '',
    price: '',
    old_price: '',
    category_id: 0,
    weight: '', // Изменено на string для поддержки форматов "500г", "1л" из твоего placeholder
    ingredients_ru: '',
    ingredients_tj: '',
    ingredients_uz: '',
    image_url: '',
    available: true
  });

  const resetForm = () => {
    setFormData({
      name_ru: '', name_tj: '', name_uz: '',
      description_ru: '', description_tj: '', description_uz: '',
      price: '', old_price: '', category_id: 0, weight: '',
      ingredients_ru: '', ingredients_tj: '', ingredients_uz: '',
      image_url: '', available: true
    });
    setImageFile(null);
    setAiTextPrompt('');
    setBackgroundPreset('');
    setCustomBannerPrompt('');
  };

  // --- ИИ ОБРАБОТЧИКИ ---

  // 1. Автоматическое заполнение всей формы по текстовому описанию
  const handleAiFillForm = async () => {
    if (!aiTextPrompt.trim()) return;
    setIsGeneratingForm(true);
    setError(null);
    try {
      // Пример интеграции с твоим apiClient:
       const response = await apiClient.post('/ai/fill-product', { prompt: aiTextPrompt });
       const generatedFields = response.data;
       if(generatedFields.price)
        generatedFields.price = parseInt(generatedFields.price);
       if(generatedFields.weight)
        generatedFields.weight = parseInt(generatedFields.weight);
      // Имитация ответа от бэкенда для теста:
      /*const generatedFields = {
        name_ru: 'Сырная улитка',
        price: '150',
        weight: '120г',
        ingredients_ru: 'Слоеное тесто, сыр сулугуни, яйцо, соль.',
        description_ru: 'Хрустящая выпечка из слоеного теста с сочной начинкой из традиционного сыра сулугуни. Идеальный перекус.',
      };*/

      setFormData(prev => ({ ...prev, ...generatedFields }));
    } catch (err) {
      setError("Не удалось автоматически заполнить форму. Попробуйте ввести данные вручную.");
    } finally {
      setIsGeneratingForm(false);
    }
  };

  // 2. Генерация только текста описания (на основе имени и ингредиентов)
  const handleGenerateDescription = async () => {
    if (!formData.name_ru) {
      setError("Сначала введите название товара на русском языке для генерации описания.");
      return;
    }
    setIsGeneratingDesc(true);
    setError(null);
    try {
       const response = await apiClient.post('/ai/generate-description', { name: formData.name_ru, ingredients: formData.ingredients_ru });
       const newDescription = response.data;
      //const newDescription = `Эксклюзивный продукт "${formData.name_ru}" приготовлен по проверенным рецептам. Обладает богатым вкусом и натуральным составом, в который входят: ${formData.ingredients_ru || 'лучшие отобранные компоненты'}.`;
      
      setFormData(prev => ({ ...prev, description_ru: newDescription }));
    } catch (err) {
      setError("Ошибка при создании маркетингового описания.");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  // 3. Генерация баннера (удаление фона + ИИ подложка)
  const handleGenerateBanner = async () => {
    if (!imageFile) {
      setError("Загрузите исходное фото товара в блок слева, чтобы ИИ мог заменить фон.");
      return;
    }
    const finalPrompt = backgroundPreset === 'custom' ? customBannerPrompt : backgroundPreset;
    if (!finalPrompt) {
      setError("Выберите готовый пресет фона или напишите свой вариант.");
      return;
    }

    setIsGeneratingBanner(true);
    setError(null);
    try {
      const bannerData = new FormData();
      bannerData.append('image', imageFile);
      bannerData.append('prompt', finalPrompt);

      // Отправка на разработанный нами эндпоинт
      const response = await apiClient.post('/ai/generate-banner', bannerData);

      //if (!response.ok) throw new Error('Ошибка сервера при обработке изображения');
      //const data = await response.json();

      setFormData(prev => ({ ...prev, image_url: response.imageUrl }));
      setImageFile(null); // Переключаемся на использование сгенерированного URL
    } catch (err) {
      console.log('err', err);
      setError("Не удалось сгенерировать студийный фон. Проверьте соединение с сервером.");
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  // --- СТАНДАРТНЫЕ ОБРАБОТЧИКИ ФОРМЫ ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'image_url' && value !== null && value !== undefined) {
          if (typeof value === 'boolean') {
            submitData.append(key, value ? 'true' : 'false');
          } else {
            submitData.append(key, value.toString());
          }
        }
      });

      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.image_url && !imageFile) {
        submitData.append('image_url', formData.image_url);
      }
        
      await createProduct(submitData);
      resetForm();
      navigate("/products");
    } catch (error: any) {
      console.log('Полный объект ошибки на фронте:', error);
      const serverError = error?.responseData?.error || 'Произошла ошибка при создании товара';
      setError(serverError);
    }
  };

  const handleImageChange = (file: File | null, previewUrl: string | null) => {
    setImageFile(file);
    setError(null);
    if (previewUrl && !file) {
      setFormData(prev => ({ ...prev, image_url: previewUrl }));
    } else {
      setFormData(prev => ({ ...prev, image_url: '' }));
    }
  };

  const handleCancel = () => {
    navigate("/products");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-medium text-gray-600">Загрузка категорий...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">      
      <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Добавить новый товар
          </h2>
        </div>

        {/* --- 1. ПАНЕЛЬ ОБЩЕЙ ГЕНЕРАЦИИ ФОРМЫ ПО ТЕКСТУ --- */}
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-5 border border-amber-200 shadow-sm">
          <h3 className="text-base font-semibold text-amber-900 mb-1 flex items-center">
            <span className="mr-2">✨</span> AI-Заполнение всей карточки
          </h3>
          <p className="text-xs text-amber-700 mb-3">
            Введите краткое описание товара, ИИ попробует распознать имя, цену, состав и написать тексты.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={aiTextPrompt}
              onChange={(e) => setAiTextPrompt(e.target.value)}
              placeholder="Например: Медовик праздничный, 800 грамм, цена 1400 руб, состав: натуральный мед, сметанный крем..."
              className="block w-full border border-amber-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white"
            />
            <button
              type="button"
              onClick={handleAiFillForm}
              disabled={isGeneratingForm || !aiTextPrompt.trim()}
              className="whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
            >
              {isGeneratingForm ? 'Распознавание...' : 'Заполнить форму'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* --- 2. БЛОК СТУДИЙНОЙ ФОТОГРАФИИ (МЕДИА СТЕК) --- */}
          <div className="bg-white shadow sm:rounded-lg px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Визуальное оформление
            </h3>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:flex-[1.8]">
                <ImageUpload
                  onImageChange={handleImageChange}
                  existingImageUrl={formData.image_url}
                  label="Основное изображение товара"
                />
              </div>

              {/* Настройки генерации фона */}
              <div className="w-full md:flex-1 bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-lg border border-indigo-100 flex flex-col justify-between min-h-[350px]">
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900 mb-1 flex items-center">
                    <span className="mr-2">🎨</span> Генерация карточки товара
                  </h4>
                  <p className="text-xs text-indigo-700 mb-4">
                    Вырежем объект из кадра и сгенерируем красивую коммерческую сцену вокруг.
                  </p>
                  
                  <div className="space-y-3">
                    <select
                      value={backgroundPreset}
                      onChange={(e) => setBackgroundPreset(e.target.value)}
                      disabled={!imageFile || isGeneratingBanner}
                      className="block w-full border border-indigo-200 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                    >
                      <option value="">Выберите стилистику подложки...</option>
                      <option value="Пустой светлый деревянный стол в пекарне, на столе ничего нет, много свободного места по центру для предмета, теплое утреннее солнце, размытый задний план пекарни, профессиональное фото товара">🪵 Деревянный стол (Пекарня)</option>
                      <option value="На идеально чистой белой мраморной поверхности, минималистичный премиальный фон, рассеянный студийный свет">🪨 Минималистичный мрамор</option>
                      <option value="На черной сланцевой доске, ресторанная подача, темный изысканный фон, контрастные тени">⬛ Стильный темный сланец</option>
                      <option value="custom">✍️ Свой вариант оформления...</option>
                    </select>

                    {backgroundPreset === 'custom' && (
                      <textarea
                        rows={2}
                        value={customBannerPrompt}
                        onChange={(e) => setCustomBannerPrompt(e.target.value)}
                        disabled={!imageFile || isGeneratingBanner}
                        placeholder="Опишите окружение детально (например: на фоне летней террасы, на тарелке с мятой)..."
                        className="block w-full border border-indigo-200 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                      />
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateBanner}
                  disabled={!imageFile || isGeneratingBanner || !backgroundPreset}
                  className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isGeneratingBanner ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Нейросеть меняет фон...
                    </>
                  ) : (
                    'Превратить в студийное фото'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* --- 3. ГРУППА ПОЛЕЙ: ОСНОВНЫЕ ДАННЫЕ И ЛОКАЛИЗАЦИЯ --- */}
          <div className="bg-white shadow sm:rounded-lg p-4 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Основная информация
            </h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Название RU */}
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
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
                  value={formData.category_id || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white"
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
                  Вес / Объем / Размер
                </label>
                <input
                  type="text"
                  name="weight"
                  id="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="Например: 500г, 1л, 6 шт."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>

              {/* Старая цена */}
              <div>
                <label htmlFor="old_price" className="block text-sm font-medium text-gray-700">
                  Старая цена (для отображения скидки)
                </label>
                <input
                  type="number"
                  name="old_price"
                  id="old_price"
                  min="0"
                  step="0.01"
                  value={formData.old_price}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Дополнительные локализации названий */}
            <div className="mt-6 border-t pt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* --- 4. БЛОК ОПИСАНИЙ И ИНГРЕДИЕНТОВ С ИИ-ГЕНЕРАЦИЕЙ --- */}
          <div className="bg-white shadow sm:rounded-lg p-4 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Детальное описание и состав
            </h3>

            {/* Ингредиенты RU */}
            <div>
              <label htmlFor="ingredients_ru" className="block text-sm font-medium text-gray-700">
                Ингредиенты (русский)
              </label>
              <textarea
                name="ingredients_ru"
                id="ingredients_ru"
                rows={2}
                value={formData.ingredients_ru}
                onChange={handleChange}
                placeholder="Перечислите основные компоненты через запятую..."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              />
            </div>

            {/* Описание RU + кнопка ИИ */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="description_ru" className="block text-sm font-medium text-gray-700">
                  Описание (русский)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDesc}
                  className="text-xs font-medium text-amber-600 hover:text-amber-800 flex items-center transition-colors"
                >
                  {isGeneratingDesc ? 'Пишу красивый текст...' : '✨ Сгенерировать вкусное описание'}
                </button>
              </div>
              <textarea
                name="description_ru"
                id="description_ru"
                rows={3}
                value={formData.description_ru}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              />
            </div>

            {/* Переводы Описаний и Составов */}
            <div className="mt-6 border-t pt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Таджикский блок */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="ingredients_tj" className="block text-sm font-medium text-gray-500">
                    Ингредиенты (таджикский)
                  </label>
                  <textarea
                    name="ingredients_tj"
                    id="ingredients_tj"
                    rows={2}
                    value={formData.ingredients_tj}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="description_tj" className="block text-sm font-medium text-gray-500">
                    Описание (таджикский)
                  </label>
                  <textarea
                    name="description_tj"
                    id="description_tj"
                    rows={2}
                    value={formData.description_tj}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Узбекский блок */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="ingredients_uz" className="block text-sm font-medium text-gray-500">
                    Ингредиенты (узбекский)
                  </label>
                  <textarea
                    name="ingredients_uz"
                    id="ingredients_uz"
                    rows={2}
                    value={formData.ingredients_uz}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="description_uz" className="block text-sm font-medium text-gray-500">
                    Описание (узбекский)
                  </label>
                  <textarea
                    name="description_uz"
                    id="description_uz"
                    rows={2}
                    value={formData.description_uz}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- 5. ДОСТУПНОСТЬ ТОВАРА --- */}
          <div className="bg-white shadow sm:rounded-lg p-4 sm:p-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="available"
                id="available"
                checked={formData.available}
                onChange={handleChange}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded transition-colors"
              />
              <label htmlFor="available" className="ml-2 block text-sm text-gray-900 font-medium">
                Товар доступен для заказа и отображается на витрине
              </label>
            </div>
          </div>

          {/* ХЕНДЛЕР ОШИБОК СЕРВЕРА */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* КНОПКИ ДЕЙСТВИЙ */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
            >
              Создать товар
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};