import React, { useState, useMemo, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { useCategories } from '../../hooks/useCategories';

// Импортируем готовые компоненты формы
import { NewProduct } from './new'; 
import { EditProduct } from './[id]'; 

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

type ViewMode = 'list' | 'create' | 'edit';

export const ProductsList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { categories } = useCategories();
  
  const [view, setView] = useState<ViewMode>('list');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Стейт для синхронизации темного режима
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Состояния для фильтрации, сортировки и пагинации
  const [filter, setFilter] = useState({
    category: '',
    available: '',
    search: ''
  });

  // Отслеживаем изменение темы оформления в DOM
  useEffect(() => {
    const checkTheme = () => {
      const darkModeOn = document.documentElement.classList.contains('dark') || 
                         document.body.classList.contains('dark');
      setIsDarkMode(darkModeOn);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const refreshProducts = () => {
    apiClient.get('/products/').then(async (res) => {
      setProducts(res.data);
    });
  };

  useEffect(() => {
    refreshProducts();
  }, []);

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

  const handleSort = (key: keyof Product) => {
    if (key !== undefined) {
      setSortConfig({
        key,
        direction: 
          sortConfig.key === key && sortConfig.direction === 'asc' 
            ? 'desc' 
            : 'asc'
      });
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setPagination({
      currentPage: 1,
      itemsPerPage: value
    });
  };

  const toggleAvailability = (selectedProduct: Product) => {
    apiClient.post('/product/update/' + selectedProduct.id, { ...selectedProduct, available: !selectedProduct.available });
    setProducts(prev => prev?.map(product => 
      product.id === selectedProduct.id 
        ? { ...product, available: !selectedProduct.available }
        : product
    ));
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products?.filter(product => {
      const matchesCategory = !filter.category || product.category_id == filter.category;
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

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key]; 
      const bValue = b[sortConfig.key];
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

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

  const paginatedProducts = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, startIndex + pagination.itemsPerPage);
  }, [filteredAndSortedProducts, pagination]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / pagination.itemsPerPage);
  const itemsPerPageOptions = [5, 10, 20, 50];

  if (view === 'create') {
    return (
      <NewProduct 
        onClose={() => setView('list')} 
        onSuccess={() => {
          setView('list');
          refreshProducts();
        }} 
      />
    );
  }

  if (view === 'edit' && selectedProductId) {
    return (
      <EditProduct 
        productId={selectedProductId} 
        onClose={() => {
          setView('list');
          setSelectedProductId(null);
        }} 
        onSuccess={() => {
          setView('list');
          setSelectedProductId(null);
          refreshProducts();
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-zinc-950 pb-20 text-gray-950 dark:text-zinc-50 transition-colors duration-300">      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Заголовок и кнопка добавления */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-zinc-200/80 dark:border-zinc-800/60 pb-5">
          <div className="flex-1 min-w-0 text-left">
            <h2 className="text-xl font-black text-gray-950 dark:text-white sm:text-2xl tracking-tight">
              Товары
            </h2>
            <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
              Всего товаров: <span className="text-zinc-800 dark:text-zinc-200 font-black">{filteredAndSortedProducts.length}</span>
            </p>
          </div>
          <div className="flex sm:mt-0">
            <button
              onClick={() => setView('create')}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 rounded-xl shadow-sm text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none transition-colors"
            >
              Добавить товар
            </button>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="mb-6 bg-white/70 dark:bg-zinc-900/65 backdrop-blur-md p-4 rounded-2xl border border-white dark:border-zinc-800/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] text-left">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs">
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
                Поиск по названию
              </label>
              <input
                type="text"
                id="search"
                placeholder="Введите название на любом языке..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-gray-950 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-bold"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
                Категория
              </label>
              <select
                id="category"
                value={filter.category}
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-gray-950 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-bold"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name_ru}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="available" className="block font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
                Доступность
              </label>
              <select
                id="available"
                value={filter.available}
                onChange={(e) => setFilter(prev => ({ ...prev, available: e.target.value }))}
                className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-gray-950 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-bold"
              >
                <option value="">Все</option>
                <option value="available">Доступные</option>
                <option value="unavailable">Недоступные</option>
              </select>
            </div>
          </div>
        </div>

        {/* Настройки отображения верхние */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <span>Показывать по:</span>
            <select
              value={pagination.itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-0.5 text-gray-950 dark:text-zinc-200 focus:ring-1 focus:ring-amber-500"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <span className="font-medium text-zinc-400/60">из {filteredAndSortedProducts.length}</span>
          </div>

          <div>
            Страница {pagination.currentPage} из {totalPages || 1}
          </div>
        </div>

        {/* Таблица товаров */}
        <div className="bg-white/70 dark:bg-zinc-900/65 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_-10px_rgba(0,0,0,0.3)] overflow-hidden rounded-2xl border border-white dark:border-zinc-800/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-xs">
              <thead className="bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider text-left">
                <tr>
                  <th scope="col" className="px-6 py-3.5 cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors" onClick={() => handleSort('name_ru')}>
                    <div className="flex items-center gap-1">
                      Название
                      {sortConfig.key === 'name_ru' && (
                        <span className="text-zinc-800 dark:text-zinc-200">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3.5 cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors" onClick={() => handleSort('category_name')}>
                    <div className="flex items-center gap-1">
                      Категория
                      {sortConfig.key === 'category_name' && (
                        <span className="text-zinc-800 dark:text-zinc-200">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3.5 cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors" onClick={() => handleSort('price')}>
                    <div className="flex items-center gap-1">
                      Цена
                      {sortConfig.key === 'price' && (
                        <span className="text-zinc-800 dark:text-zinc-200">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3.5 cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors" onClick={() => handleSort('available')}>
                    <div className="flex items-center gap-1">
                      Статус
                      {sortConfig.key === 'available' && (
                        <span className="text-zinc-800 dark:text-zinc-200">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-left font-bold text-gray-950 dark:text-zinc-200">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.image_url ? (
                          <div className="flex-shrink-0 h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mr-4 border border-zinc-200/40 dark:border-zinc-700/40 overflow-hidden shadow-sm">
                            <img src={product.image_url} alt="" className="h-10 w-10 object-cover" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 rounded-xl flex items-center justify-center mr-4 shadow-sm text-base">
                            📦
                          </div>
                        )}
                        
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-black text-gray-950 dark:text-white tracking-tight leading-tight">
                            {product.name_ru}
                          </div>
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium">
                            {product.name_tj} / {product.name_uz}
                          </div>
                          {product.weight && (
                            <div className="text-[10px] text-zinc-400/80 dark:text-zinc-500/80 mt-1 font-mono">
                              {product.weight}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {product.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-zinc-950 dark:text-zinc-100">{product.price} ₽</div>
                      {product.old_price && (
                        <div className="text-[11px] text-zinc-400 line-through font-medium mt-0.5">
                          {product.old_price} ₽
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${
                        product.available 
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-red-500/10 text-red-700 dark:text-red-400'
                      }`}>
                        {product.available ? 'Доступен' : 'Недоступен'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-3 text-[11px]">
                        <button
                          onClick={() => toggleAvailability(product)}
                          className={`inline-flex items-center px-3 py-1.5 border border-transparent font-black rounded-lg transition-colors shadow-sm ${
                            product.available
                              ? 'bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400'
                              : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
                          } focus:outline-none`}
                        >
                          {product.available ? 'Скрыть' : 'Включить'}
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setView('edit');
                          }}
                          className="text-amber-600 dark:text-amber-400 hover:underline uppercase tracking-wider px-1 py-1 transition-colors bg-transparent border-none cursor-pointer font-black"
                        >
                          Редактировать
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginatedProducts.length === 0 && (
            <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 font-bold">
              <div className="text-sm">Товары не найдены</div>
              <div className="text-xs font-medium text-zinc-400/60 mt-1">
                Попробуйте изменить параметры фильтрации
              </div>
            </div>
          )}
        </div>

        {/* Пагинация нижняя */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between text-xs font-bold">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 font-bold disabled:opacity-30 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(totalPages, prev.currentPage + 1) }))}
                disabled={pagination.currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 font-bold disabled:opacity-30 transition-colors"
              >
                Вперед
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between text-zinc-400 dark:text-zinc-500">
              <div>
                <p>
                  Показано <span className="font-black text-gray-950 dark:text-zinc-200">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> -{' '}
                  <span className="font-black text-gray-950 dark:text-zinc-200">
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredAndSortedProducts.length)}
                  </span> из{' '}
                  <span className="font-black text-gray-950 dark:text-zinc-200">{filteredAndSortedProducts.length}</span> товаров
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-2 py-1.5 rounded-l-lg text-zinc-400 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    &larr;
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                      className={`relative inline-flex items-center px-3 py-1.5 text-xs rounded-md transition-all ${
                        pagination.currentPage === page
                          ? 'bg-amber-500 text-white font-black'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(totalPages, prev.currentPage + 1) }))}
                    disabled={pagination.currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-1.5 rounded-r-lg text-zinc-400 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
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