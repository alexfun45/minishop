import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingBag, X, Search, Star, 
  Leaf, ArrowLeft, Plus, Minus 
} from 'lucide-react';
import ProductCard from './components/ProductCart';
import { apiClient } from './services/api';
import AiWidget from './components/ai-widget';
import CartDrawer from './components/CartDrawer';
import { AnalyticsService } from './services/AnalyticsService';
import WebApp from '@twa-dev/sdk'; 
import { initTelegramApp, isTelegramApp } from './services/telegram';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
}

export default function App() {
  // Стейты навигации и UI
  //const [tgUser, setTgUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'home' | 'product'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    initTelegramApp();
    //setTgUser(getTelegramUser());
  }, []);

  // Стейт корзины
  const [cart, setCart] = useState<any[]>(() => {
    const savedCart = localStorage.getItem('bakery_shop_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 2. ХУК КЭШИРОВАНИЯ КАТЕГОРИЙ
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const cats = await apiClient.getCategories();
      // Автоматически выставляем первую категорию активной, если она ещё не выбрана
      if (cats.length > 0 && activeCategory === null && !debouncedSearchQuery) {
        setActiveCategory(cats[0].id);
      }
      return cats;
    },
    staleTime: 60 * 60 * 1000, // Категории меняются редко, кэшируем на 1 час
  });

  // 3. ХУК КЭШИРОВАНИЯ ТОВАРОВ (Обрабатывает и категории, и поиск!)
  const { data: products = [], isLoading } = useQuery({
    // Ключ зависит либо от активной категории, либо от поискового запроса
    queryKey: ['products', { category: activeCategory, search: debouncedSearchQuery }],
    queryFn: async () => {
      if (debouncedSearchQuery.trim().length > 0) {
        return await apiClient.searchProducts(debouncedSearchQuery);
      }
      if (activeCategory !== null) {
        return await apiClient.getProductsByCategory(activeCategory);
      }
      return [];
    },
    // Включаем запрос, только если у нас есть выбранная категория ИЛИ поисковый запрос
    enabled: activeCategory !== null || debouncedSearchQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000, // Кэшируем товары на 5 минут
  });

  // Логика управления корзиной
  const addToCart = (incomingProduct: any, source: 'catalog' | 'ai_chat' | 'product_detail' = 'catalog') => {
    if (!incomingProduct) return;
    const product = incomingProduct.product ? incomingProduct.product : incomingProduct;
    const initialCount = incomingProduct.count || incomingProduct.quantity || 1;
  
    if (product.id === undefined || product.price === undefined) {
      console.error("Некорректный формат товара:", incomingProduct);
      return;
    }

    AnalyticsService.track('add_to_cart', {
      productId: product.id,
      productName: product.name_ru || product.name || 'Товар без названия',
      price: Number(product.price),
      quantity: initialCount,
      source: source
    });
  
    setCart((prevCart) => {
      const currentCartArray = Array.isArray(prevCart) ? prevCart : Object.values(prevCart);
      const existingItemIndex = currentCartArray.findIndex(
        (item) => item && item.product && item.product.id === product.id
      );
  
      if (existingItemIndex > -1) {
        const newCart = [...currentCartArray];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          count: newCart[existingItemIndex].count + initialCount
        };
        return newCart;
      } else {
        const newCartItem = {
          count: initialCount,
          product: {
            id: product.id,
            name_ru: product.name_ru || product.name || 'Товар без названия',
            price: Number(product.price),
            image_url: product.image_url || ''
          }
        };
        return [...currentCartArray, newCartItem];
      }
    });
  };

  const removeFromCart = (id: number, removeAll = false) => {
    setCart((prevCart) => {
      const currentCartArray = Array.isArray(prevCart) ? prevCart : Object.values(prevCart);
      const existingItemIndex = currentCartArray.findIndex(
        (item) => item && item.product && item.product.id === id
      );
  
      if (existingItemIndex === -1) return currentCartArray;
  
      const newCart = [...currentCartArray];
      const currentItem = newCart[existingItemIndex];
  
      if (removeAll || currentItem.count <= 1) {
        newCart.splice(existingItemIndex, 1);
      } else {
        newCart[existingItemIndex] = {
          ...currentItem,
          count: currentItem.count - 1
        };
      }
      return newCart;
    });
  };

  const clearCart = () => setCart([]);

  let cartItemsArray = [];
  let totalCartItems = 0;
  let totalCartPrice = 0;
  if(cart.length > 0){
    cartItemsArray = Object.values(cart);
    totalCartItems = cartItemsArray.reduce((acc, item) => acc + item.count, 0);
    totalCartPrice = cartItemsArray.reduce((acc, item) => acc + (item.product.price * item.count), 0);
  }

  // Эффект для дебаунса поиска (теперь просто выставляет стейт для React Query)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const trimmed = searchQuery.trim();
      setDebouncedSearchQuery(trimmed);

      if (trimmed.length > 0) {
        setActiveCategory(null);
        if (currentView === 'product') setCurrentView('home');
      } else if (trimmed.length === 0 && categories.length > 0 && activeCategory === null) {
        handleCategoryClick(categories[0].id);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, categories]);

  useEffect(() => {
    localStorage.setItem('bakery_shop_cart', JSON.stringify(cart));
  }, [cart]);

  // Сбор сквозной трекинг-аналитики
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      const productIds = products.map((p: any) => p.id);
  
      AnalyticsService.track('page_view', {
        categoryActive: activeCategory ? categories.find((c: any) => c.id === activeCategory)?.name : 'Поиск',
        hasSearchQuery: !!debouncedSearchQuery,
        searchQuery: debouncedSearchQuery || null,
        viewed_products: productIds
      });
    }
  }, [isLoading, products, activeCategory, categories, debouncedSearchQuery]);

  useEffect(() => {

    if (!isTelegramApp()) return;

    if (totalCartItems > 0) {
      // Настраиваем кнопку: текст и цвет (в стиле твоей пекарни)
      WebApp.MainButton.setText(`Посмотреть корзину (${totalCartItems} шт) — ${totalCartPrice} ₽`);
      WebApp.MainButton.setParams({
        color: '#d97706',     // Вместо bg_color используем color (amber-600)
        text_color: '#0c0a09'
      } as any);
      WebApp.MainButton.show();

      // Вешаем колбэк на клик по кнопке Telegram
      const handleMainButtonClick = () => {
        setIsCartOpen(true);
      };
      
      WebApp.MainButton.onClick(handleMainButtonClick);

      // Обязательно очищаем обработчик при изменении стейта
      return () => {
        WebApp.MainButton.offClick(handleMainButtonClick);
      };
    } else {
      WebApp.MainButton.hide();
    }
  }, [totalCartItems, totalCartPrice]);

  useEffect(() => {
    if (!isTelegramApp()) return; 
  
    if (currentView === 'product') {
      WebApp.BackButton.show();
      
      const handleBackClick = () => {
        closeProduct();
      };
      
      WebApp.BackButton.onClick(handleBackClick);
      
      // ДОБАВИЛИ ФИГУРНЫЕ СКОБКИ: теперь функция возвращает void, и React счастлив
      return () => { 
        WebApp.BackButton.offClick(handleBackClick); 
      };
    } else {
      WebApp.BackButton.hide();
    }
  }, [currentView]);

  const handleCategoryClick = (id: number) => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCurrentView('home');
    setActiveCategory(id);
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    AnalyticsService.track('product_detail_open', {
      productId: product.id,
      productName: product.name
    });
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    setCurrentView('home');
  };

  const currentProductInCart = Array.isArray(cart) ? cart.find(item => item?.product?.id === selectedProduct?.id) : null;

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-fixed text-stone-200 antialiased font-sans selection:bg-amber-600 selection:text-white">
      <div className="min-h-screen bg-stone-950/90 md:bg-stone-950/85 backdrop-blur-[4px] flex flex-col will-change-transform">
        
        {/* ШАПКА */}
        <header className="sticky top-0 z-40 bg-stone-950 border-b border-white/10 shadow-lg transition-all">
          <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between gap-6">
            
            {/* Логотип */}
            <div className="flex items-center gap-4 cursor-pointer shrink-0 group" onClick={() => { handleCategoryClick(categories[0]?.id); }}>
              <div style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)' }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 text-stone-950 font-serif text-2xl font-black shadow-[0_0_20px_rgba(217,119,6,0.3)] group-hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] transition-all duration-500 flex items-center justify-center">
                К
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-serif font-black tracking-widest text-white uppercase block leading-tight">Корица & Закваска</span>
                <span className="text-xs font-medium text-amber-500/80 flex items-center gap-1 tracking-widest uppercase mt-1">
                  <Leaf className="w-3 h-3 fill-amber-500/80" /> Авторская пекарня
                </span>
              </div>
            </div>

            {/* Поисковая строка */}
            <div className="flex-1 max-w-xl relative group">
              <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-amber-500 transition-colors" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по коллекции выпечки..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-stone-400 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all shadow-inner backdrop-blur-md"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Кнопка Корзины */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative bg-white/5 hover:bg-white/10 border border-white/10 p-3.5 rounded-2xl transition-all duration-300 flex items-center gap-2 shrink-0 group backdrop-blur-md hover:border-amber-500/30"
            >
              <ShoppingBag className="w-5 h-5 text-stone-300 group-hover:text-amber-400 transition-colors" />
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-xs w-6 h-6 flex items-center justify-center rounded-full font-black shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-in zoom-in">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* МЕНЮ КАТЕГОРИЙ */}
        {currentView === 'home' && (
          <section className="bg-stone-950/40 border-b border-white/5 py-4 sticky top-24 z-30 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat: any) => {
  const isActive = activeCategory === cat.id;
  
  return (
    <button
      key={cat.id}
      onClick={() => handleCategoryClick(cat.id)}
      /* Инлайн-стилем жестко прописываем фон для активной кнопки */
      style={
        isActive 
          ? { background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' } 
          : {}
      }
      className={`px-6 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold tracking-wide transition-all duration-300 ${
        isActive 
          ? 'text-stone-950 font-black shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-105' 
          : 'bg-white/5 text-stone-300 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
      }`}
    >
      {cat.name}
    </button>
  );
})}
            </div>
          </section>
        )}

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <main className="max-w-7xl mx-auto px-4 py-12 flex-1 w-full">
          {currentView === 'home' ? (
            <div className="animate-in fade-in duration-500">
              <div className="mb-10 flex items-end justify-between border-b border-white/10 pb-4">
                <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-white">
                  {searchQuery ? `Результаты: "${searchQuery}"` : categories.find((c: any) => c.id === activeCategory)?.name || 'Эксклюзивная коллекция'}
                </h2>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 backdrop-blur-sm">
                  {products.length} позиций
                </span>
              </div>

              {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-pulse">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="bg-white/5 h-[420px] rounded-3xl border border-white/5" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-32 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                  <p className="text-stone-400 font-medium text-lg font-serif">Ничего не найдено...</p>
                  <button onClick={() => setSearchQuery('')} className="mt-4 text-amber-500 hover:text-amber-400 border-b border-amber-500/30 pb-1 transition-colors">
                    Сбросить поиск
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {products.map((product: any) => {
                    const cartItem = Array.isArray(cart) ? cart.find(item => item?.product?.id === product.id) : null;
                    const count = cartItem ? cartItem.count : 0;

                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        count={count}
                        onOpen={openProduct}
                        onAddToCart={addToCart}
                        onRemoveFromCart={removeFromCart}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            selectedProduct && (
              <div className="animate-in slide-in-from-bottom-8 fade-in duration-500">
                <button onClick={closeProduct} className="flex items-center gap-2 text-stone-400 hover:text-amber-400 transition-colors mb-8 group font-medium">
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                  Назад к витрине
                </button>

                <div className="bg-stone-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 md:p-8 shadow-2xl flex flex-col md:flex-row gap-8 lg:gap-16">
                  <div className="w-full md:w-1/2">
                    <div className="rounded-[2rem] overflow-hidden border border-white/5 shadow-inner relative aspect-square">
                       <img 
                        crossOrigin="anonymous"
                        src={selectedProduct.image_url?.replace('http://', 'https://') || `https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=1000&auto=format&fit=crop&q=80`} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent pointer-events-none" />
                    </div>
                  </div>

                  <div className="w-full md:w-1/2 flex flex-col justify-center py-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full backdrop-blur-md">
                        Ручная работа
                      </span>
                      <div className="flex items-center gap-1 text-stone-400 text-sm">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.9 (128 отзывов)
                      </div>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-serif font-black text-white mb-6 leading-tight">
                      {selectedProduct.name}
                    </h1>

                    <p className="text-stone-300 text-lg leading-relaxed font-light mb-8">
                      {selectedProduct.description || 'Классический рецепт, доведенный до совершенства...'}
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm">
                      <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-amber-500" /> Состав & БЖУ
                      </h4>
                      <p className="text-stone-400 text-sm leading-relaxed mb-4">
                        Мука пшеничная высшего сорта, вода артезианская, закваска пшеничная (мука, water), соль морская, мед акациевый.
                      </p>
                      <div className="flex justify-between border-t border-white/10 pt-4 text-sm text-stone-300">
                        <span className="flex flex-col"><span className="text-stone-500 text-xs">Белки</span>8.5 г</span>
                        <span className="flex flex-col"><span className="text-stone-500 text-xs">Жиры</span>1.2 г</span>
                        <span className="flex flex-col"><span className="text-stone-500 text-xs">Углеводы</span>48.6 г</span>
                        <span className="flex flex-col"><span className="text-stone-500 text-xs">Ккал</span>245</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-6 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-stone-400 text-sm uppercase tracking-wider mb-1">Итоговая стоимость</span>
                        <span className="text-4xl font-black text-white">{selectedProduct.price} ₽</span>
                      </div>
                      
                      {(!currentProductInCart || currentProductInCart.count === 0) ? (
                        <button 
                          onClick={() => addToCart(selectedProduct, 'product_detail')}
                          className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 py-4 px-8 rounded-2xl text-lg font-black transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] transform hover:-translate-y-1"
                        >
                          В корзину
                        </button>
                      ) : (
                        <div className="flex-1 bg-white/10 border border-white/20 flex items-center justify-between rounded-2xl overflow-hidden backdrop-blur-md">
                          <button onClick={() => removeFromCart(selectedProduct.id)} className="p-4 hover:bg-white/10 transition-colors text-white"><Minus className="w-6 h-6" /></button>
                          <span className="text-xl font-black text-white min-w-[40px] text-center">{currentProductInCart ? currentProductInCart.count : 0}</span>
                          <button onClick={() => addToCart(selectedProduct, 'product_detail')} className="p-4 hover:bg-white/10 transition-colors text-white"><Plus className="w-6 h-6" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </main>
      </div>

      {/* ШТОРКА КОРЗИНЫ (DRAWER) */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItemsArray}
        totalPrice={totalCartPrice}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onClearCart={clearCart}
      />
      {!isCartOpen && (
        <AiWidget addToCart={(prod) => addToCart(prod, 'ai_chat')} />
      )}
    </div>
  );
}