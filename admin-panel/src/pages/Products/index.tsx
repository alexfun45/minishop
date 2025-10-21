// pages/products/index.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '../../components/header';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/api';

interface Product {
  id: string;
  name_ru: string;
  name_tj: string;
  name_uz: string;
  price: number;
  old_price?: number;
  category_id: string;
  category_name?: string;
  weight?: string;
  available: boolean;
  image_url?: string;
  created_at: string;
}

export const ProductsList: React.FC = () => {

  
  // Mock данные товаров
  /*const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name_ru: 'Хлеб Бородинский',
      name_tj: 'Нони Бородинский',
      name_uz: 'Borodinskiy noni',
      price: 85,
      old_price: 95,
      category_id: '1',
      category_name: 'Хлеб',
      weight: '500г',
      available: true,
      created_at: '2024-01-15'
    },
    {
      id: '2',
      name_ru: 'Круассан с шоколадом',
      name_tj: 'Круассан бо шоколад',
      name_uz: 'Shokoladli kruassan',
      price: 120,
      category_id: '2',
      category_name: 'Выпечка',
      weight: '100г',
      available: true,
      created_at: '2024-01-16'
    },
    {
      id: '3',
      name_ru: 'Торт Наполеон',
      name_tj: 'Торти Наполеон',
      name_uz: 'Napoleon torti',
      price: 720,
      category_id: '3',
      category_name: 'Торты',
      weight: '1.2кг',
      available: true,
      created_at: '2024-01-17'
    },
    {
      id: '4',
      name_ru: 'Батон нарезной',
      name_tj: 'Нони бурида',
      name_uz: 'Kesilgan non',
      price: 65,
      category_id: '1',
      category_name: 'Хлеб',
      weight: '400г',
      available: false,
      created_at: '2024-01-14'
    },
    {
      id: '5',
      name_ru: 'Эклер с заварным кремом',
      name_tj: 'Эклер бо креми заварной',
      name_uz: 'Zakvaska kremli ekler',
      price: 95,
      category_id: '2',
      category_name: 'Выпечка',
      weight: '80г',
      available: true,
      created_at: '2024-01-18'
    },
    {
      id: '6',
      name_ru: 'Медовик торт',
      name_tj: 'Торти асалӣ',
      name_uz: 'Asal torti',
      price: 680,
      old_price: 750,
      category_id: '3',
      category_name: 'Торты',
      weight: '1кг',
      available: true,
      created_at: '2024-01-13'
    }
  ]);*/

  const [products, setProducts] = useState<Product[]>([]);
  const [Categories, setCategories] = useState([]);
  // Состояния для фильтрации, сортировки и пагинации
  const [filter, setFilter] = useState({
    category: '',
    available: '',
    search: ''
  });

  useEffect(()=>{
    apiClient.get('/categories').then(res => {
      setCategories(res.data);
    });

  }, []);

  useEffect(()=>{
    apiClient.get('/products/'+filter.category);
  }, [filter.category]);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Product;
    direction: 'asc' | 'desc';
  }>({
    key: 'created_at',
    direction: 'desc'
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 5
  });

  // Обработчик сортировки
  const handleSort = (key: keyof Product) => {
    if(key!==undefined){
    setSortConfig({
      key,
      direction: 
        sortConfig.key === key && sortConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    });
  }
  };

  // Обработчик изменения элементов на странице
  const handleItemsPerPageChange = (value: number) => {
    setPagination({
      currentPage: 1,
      itemsPerPage: value
    });
  };

  // Функция для переключения доступности товара
  const toggleAvailability = (productId: string) => {
    setProducts(prev => prev?.map(product =>
      product.id === productId 
        ? { ...product, available: !product.available }
        : product
    ));
  };

  // Фильтрация и сортировка товаров
  // Замените блок useMemo с фильтрацией и сортировкой на этот:

const filteredAndSortedProducts = useMemo(() => {
  let filtered = products?.filter(product => {
    const matchesCategory = !filter.category || product.category_id === filter.category;
    const matchesAvailable = 
      !filter.available || 
      (filter.available === 'available' && product.available) ||
      (filter.available === 'unavailable' && !product.available);
    
    const matchesSearch = !filter.search || 
      product.name_ru.toLowerCase().includes(filter.search.toLowerCase()) ||
      product.name_tj.toLowerCase().includes(filter.search.toLowerCase()) ||
      product.name_uz.toLowerCase().includes(filter.search.toLowerCase());

    return matchesCategory && matchesAvailable && matchesSearch;
  });

  // Сортировка с проверкой типов
  filtered.sort((a, b) => {
    const aValue = a[sortConfig.key]; 
    const bValue = b[sortConfig.key];
    
    // Если значения undefined или null, обрабатываем их
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
    if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

    // Для строк
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Для чисел и boolean
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    
    return 0;
  });

  return filtered;
}, [products, filter, sortConfig]);

  // Пагинация
  const paginatedProducts = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, startIndex + pagination.itemsPerPage);
  }, [filteredAndSortedProducts, pagination]);

  // Общее количество страниц
  const totalPages = Math.ceil(filteredAndSortedProducts.length / pagination.itemsPerPage);

  // Категории для фильтра
  const categories = [
    { id: '1', name_ru: 'Хлеб' },
    { id: '2', name_ru: 'Выпечка' },
    { id: '3', name_ru: 'Торты' }
  ];

  // Опции для количества элементов на странице
  const itemsPerPageOptions = [5, 10, 20, 50];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Заголовок и кнопка добавления */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Товары
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Всего товаров: {filteredAndSortedProducts.length}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/products/new"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Добавить товар
            </Link>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Поиск по названию */}
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Поиск по названию
              </label>
              <input
                type="text"
                id="search"
                placeholder="Введите название на любом языке..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            {/* Фильтр по категории */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Категория
              </label>
              <select
                id="category"
                value={filter.category}
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name_ru}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Фильтр по доступности */}
            <div>
              <label htmlFor="available" className="block text-sm font-medium text-gray-700">
                Доступность
              </label>
              <select
                id="available"
                value={filter.available}
                onChange={(e) => setFilter(prev => ({ ...prev, available: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">Все</option>
                <option value="available">Доступные</option>
                <option value="unavailable">Недоступные</option>
              </select>
            </div>
          </div>
        </div>

        {/* Настройки отображения */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          {/* Количество элементов на странице */}
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <span className="text-sm text-gray-700">Показывать:</span>
            <select
              value={pagination.itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500">
              из {filteredAndSortedProducts.length}
            </span>
          </div>

          {/* Информация о текущей странице */}
          <div className="text-sm text-gray-500">
            Страница {pagination.currentPage} из {totalPages}
          </div>
        </div>

        {/* Таблица товаров */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name_ru')}
                >
                  <div className="flex items-center">
                    Название
                    {sortConfig.key === 'name_ru' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category_name')}
                >
                  <div className="flex items-center">
                    Категория
                    {sortConfig.key === 'category_name' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    Цена
                    {sortConfig.key === 'price' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('available')}
                >
                  <div className="flex items-center">
                    Статус
                    {sortConfig.key === 'available' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-amber-100 rounded-md flex items-center justify-center mr-4">
                        <span className="text-amber-600">🍞</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-center font-medium text-gray-900">
                          {product.name_ru}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.name_tj} / {product.name_uz}
                        </div>
                        {product.weight && (
                          <div className="text-sm text-gray-400">
                            {product.weight}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.category_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.price} ₽
                    </div>
                    {product.old_price && (
                      <div className="text-sm text-gray-400 line-through">
                        {product.old_price} ₽
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.available ? 'Доступен' : 'Недоступен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => toggleAvailability(product.id)}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md ${
                          product.available
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                      >
                        {product.available ? 'Скрыть' : 'Включить'}
                      </button>
                      
                      <Link
                        to={`/products/${product.id}`}
                        className="text-amber-600 hover:text-amber-900"
                      >
                        Редактировать
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Сообщение если товары не найдены */}
          {paginatedProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">Товары не найдены</div>
              <div className="text-gray-500 mt-2">
                Попробуйте изменить параметры фильтрации
              </div>
            </div>
          )}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ 
                  ...prev, 
                  currentPage: Math.max(1, prev.currentPage - 1) 
                }))}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={() => setPagination(prev => ({ 
                  ...prev, 
                  currentPage: Math.min(totalPages, prev.currentPage + 1) 
                }))}
                disabled={pagination.currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Вперед
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Показано <span className="font-medium">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> -{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredAndSortedProducts.length)}
                  </span> из{' '}
                  <span className="font-medium">{filteredAndSortedProducts.length}</span> товаров
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPagination(prev => ({ 
                      ...prev, 
                      currentPage: Math.max(1, prev.currentPage - 1) 
                    }))}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Предыдущая</span>
                    &larr;
                  </button>
                  
                  {/* Номера страниц */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.currentPage === page
                          ? 'z-10 bg-amber-50 border-amber-500 text-amber-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setPagination(prev => ({ 
                      ...prev, 
                      currentPage: Math.min(totalPages, prev.currentPage + 1) 
                    }))}
                    disabled={pagination.currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Следующая</span>
                    &rarr;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};