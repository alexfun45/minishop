import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/header';
import { useCategories } from '../../hooks/useCategories';

interface Product {
  id: string;
  name_ru: string;
  name_tj: string;
  name_uz: string;
  description_ru: string;
  description_tj: string;
  description_uz: string;
  price: string;
  old_price: string;
  category_id: string;
  weight: string;
  ingredients_ru: string;
  ingredients_tj: string;
  ingredients_uz: string;
  available: boolean;
}

export const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading } = useCategories();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Product>({
    id: '',
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
    available: true
  });

  useEffect(() => {
    // Загрузка данных товара
    const fetchProduct = async () => {
      try {
        // Mock данные - в реальном приложении здесь будет API вызов
        const mockProduct: Product = {
          id: id || '',
          name_ru: 'Хлеб Бородинский',
          name_tj: 'Нони Бородинский',
          name_uz: 'Borodinskiy noni',
          description_ru: 'Ржаной хлеб с кориандром',
          description_tj: 'Нони чӯявонӣ бо кориандр',
          description_uz: 'Koriandrli javdar noni',
          price: '85',
          old_price: '95',
          category_id: '1',
          weight: '500г',
          ingredients_ru: 'Мука ржаная, вода, соль, кориандр',
          ingredients_tj: 'Орди чӯявонӣ, об, намак, кориандр',
          ingredients_uz: 'Javdar un, suv, tuz, koriandr',
          available: true
        };
        
        setFormData(mockProduct);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Здесь будет вызов API для обновления товара
      console.log('Updating product:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация API вызова
      
      // После успешного сохранения - редирект
      navigate('/products');
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        // Здесь будет вызов API для удаления товара
        console.log('Deleting product:', id);
        navigate('/products');
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  if (loading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Загрузка...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Редактировать товар
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              ID: {id}
            </p>
          </div>
          <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Удалить
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Основная информация
              </h3>
              
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
                    {categories.map((category) => (
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
              onClick={() => navigate('/products')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};