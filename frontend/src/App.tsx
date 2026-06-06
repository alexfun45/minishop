import { useEffect, useState } from 'react';
import { 
  ShoppingBag, X, Search, Star, 
  Flame, Leaf, ArrowLeft, Plus, Minus 
} from 'lucide-react';
import { apiClient } from './services/api';
import AiWidget from './components/ai-widget';
import CartDrawer from './components/CartDrawer';

// Типы для TypeScript (опционально, но полезно для структуры)
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
}

interface CartItem {
  product: Product;
  count: number;
}

export default function App() {
  // Базовые стейты
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Стейты поиска
  const [searchQuery, setSearchQuery] = useState('');
  
  // Стейты навигации и UI
  const [currentView, setCurrentView] = useState<'home' | 'product'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Стейт корзины (теперь хранит полные данные товара)
  const [cart, setCart] = useState<{ [key: number]: CartItem }>({});

  // Логика управления корзиной для каталога
  const addToCart = (product: Product) => {
    setCart(prev => ({ ...prev, [product.id]: { product, count: (prev[product.id]?.count || 0) + 1 } }));
  };

  const removeFromCart = (id: number, removeAll = false) => {
    setCart(prev => {
      const updated = { ...prev };
      if (removeAll || updated[id].count === 1) delete updated[id];
      else updated[id].count--;
      return updated;
    });
  };

  const clearCart = () => setCart({}); // Метод очистки для стейта

  // Вычисляемые данные для передачи в дочерний компонент корзины
  const cartItemsArray = Object.values(cart);
  const totalCartItems = cartItemsArray.reduce((acc, item) => acc + item.count, 0);
  const totalCartPrice = cartItemsArray.reduce((acc, item) => acc + (item.product.price * item.count), 0);

  // Инициализация
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const cats = await apiClient.getCategories();
      setCategories(cats);
      if (cats.length > 0) {
        setActiveCategory(cats[0].id);
        const prods = await apiClient.getProductsByCategory(cats[0].id);
        setProducts(prods);
      }
      setIsLoading(false);
    };
    initData();
  }, []);

  // Мгновенный поиск с дебаунсом
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsLoading(true);
        setActiveCategory(null);
        if (currentView === 'product') setCurrentView('home'); // Возвращаем в каталог при поиске
        
        const searchResults = await apiClient.searchProducts(searchQuery);
        setProducts(searchResults);
        setIsLoading(false);
      } else if (searchQuery.trim().length === 0 && categories.length > 0 && activeCategory === null) {
        handleCategoryClick(categories[0].id);
      }
    }, 300); // 300ms для ощущения "мгновенности"

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleCategoryClick = async (id: number) => {
    setSearchQuery('');
    setCurrentView('home');
    setActiveCategory(id);
    setIsLoading(true);
    const prods = await apiClient.getProductsByCategory(id);
    setProducts(prods);
    setIsLoading(false);
  };

  // Навигация
  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    setCurrentView('home');
  };

  
  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-fixed text-stone-200 antialiased font-sans selection:bg-amber-600 selection:text-white">
      <div className="min-h-screen bg-stone-950/80 backdrop-blur-[4px] flex flex-col">
        
        {/* ШАПКА */}
        <header className="sticky top-0 z-40 bg-stone-950/70 border-b border-white/10 backdrop-blur-xl transition-all">
          <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between gap-6">
            
            {/* Логотип */}
            <div className="flex items-center gap-4 cursor-pointer shrink-0 group" onClick={() => { setSearchQuery(''); handleCategoryClick(categories[0]?.id); }}>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-700 rounded-2xl flex items-center justify-center text-stone-950 font-serif text-2xl font-black shadow-[0_0_20px_rgba(217,119,6,0.3)] group-hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] transition-all duration-500">
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

        {/* МЕНЮ КАТЕГОРИЙ (скрываем на странице товара) */}
        {currentView === 'home' && (
          <section className="bg-stone-950/40 border-b border-white/5 py-4 sticky top-24 z-30 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`px-6 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold tracking-wide transition-all duration-300 ${
                    activeCategory === cat.id 
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 shadow-[0_0_20px_rgba(217,119,6,0.4)] scale-105' 
                      : 'bg-white/5 text-stone-300 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <main className="max-w-7xl mx-auto px-4 py-12 flex-1 w-full">
          
          {currentView === 'home' ? (
            /* ВЬЮ: КАТАЛОГ */
            <div className="animate-in fade-in duration-500">
              <div className="mb-10 flex items-end justify-between border-b border-white/10 pb-4">
                <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-white">
                  {searchQuery ? `Результаты: "${searchQuery}"` : categories.find(c => c.id === activeCategory)?.name || 'Эксклюзивная коллекция'}
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
                  {products.map(product => {
                    const demoImg = product.image_url || `https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&auto=format&fit=crop&q=80`;
                    const count = cart[product.id]?.count || 0;

                    return (
                      <div key={product.id} className="bg-stone-900/40 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-amber-500/30 shadow-2xl hover:shadow-[0_10px_40px_rgba(217,119,6,0.15)] transition-all duration-500 flex flex-col overflow-hidden relative group cursor-pointer" onClick={() => openProduct(product)}>
                        
                        {product.price < 300 && (
                          <div className="absolute top-4 left-4 z-10">
                            <span className="bg-stone-950/80 border border-amber-500/30 text-amber-400 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5">
                              <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> Выбор шефа
                            </span>
                          </div>
                        )}

                        <div className="h-60 overflow-hidden bg-stone-950 relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent z-10" />
                          <img src={demoImg} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700 opacity-90 group-hover:opacity-100" />
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between space-y-6 relative z-20 -mt-8 bg-gradient-to-b from-transparent to-stone-900/90 rounded-b-3xl">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold tracking-wide">
                              <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.9 <span className="text-stone-500 font-normal ml-1">Premium</span>
                            </div>
                            <h3 className="font-serif font-bold text-xl text-white leading-snug group-hover:text-amber-400 transition-colors line-clamp-2 drop-shadow-md">
                              {product.name}
                            </h3>
                            <p className="text-stone-400 text-sm leading-relaxed line-clamp-2 font-light">
                              {product.description || 'Изысканный вкус, созданный вручную из лучших ингредиентов по авторской рецептуре.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col">
                              <span className="text-2xl font-black tracking-tight text-white">{product.price} ₽</span>
                            </div>

                            {count === 0 ? (
                              <button onClick={() => addToCart(product)} className="bg-white/10 border border-white/20 text-white hover:bg-amber-600 hover:border-amber-500 hover:text-stone-950 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm backdrop-blur-md">
                                Добавить
                              </button>
                            ) : (
                              <div className="bg-amber-600 text-stone-950 flex items-center rounded-xl overflow-hidden shadow-[0_0_15px_rgba(217,119,6,0.3)]">
                                <button onClick={() => removeFromCart(product.id)} className="px-3 py-2.5 hover:bg-amber-500 transition-colors"><Minus className="w-4 h-4" /></button>
                                <span className="px-2 text-sm font-black min-w-[32px] text-center">{count}</span>
                                <button onClick={() => addToCart(product)} className="px-3 py-2.5 hover:bg-amber-500 transition-colors"><Plus className="w-4 h-4" /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ВЬЮ: КАРТОЧКА ТОВАРА */
            selectedProduct && (
              <div className="animate-in slide-in-from-bottom-8 fade-in duration-500">
                <button onClick={closeProduct} className="flex items-center gap-2 text-stone-400 hover:text-amber-400 transition-colors mb-8 group font-medium">
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                  Назад к витрине
                </button>

                <div className="bg-stone-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 md:p-8 shadow-2xl flex flex-col md:flex-row gap-8 lg:gap-16">
                  {/* Левая колонка: Изображение */}
                  <div className="w-full md:w-1/2">
                    <div className="rounded-[2rem] overflow-hidden border border-white/5 shadow-inner relative aspect-square">
                       <img 
                        src={selectedProduct.image_url || `https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=1000&auto=format&fit=crop&q=80`} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent pointer-events-none" />
                    </div>
                  </div>

                  {/* Правая колонка: Информация */}
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
                      {selectedProduct.description || 'Классический рецепт, доведенный до совершенства. Мы используем только натуральную закваску долгой ферментации, фермерское масло и органическую муку, чтобы добиться идеального баланса хрустящей корочки и нежного мякиша.'}
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm">
                      <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-amber-500" /> Состав & БЖУ
                      </h4>
                      <p className="text-stone-400 text-sm leading-relaxed mb-4">
                        Мука пшеничная высшего сорта, вода артезианская, закваска пшеничная (мука, вода), соль морская, мед акациевый.
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

                      {(!cart[selectedProduct.id] || cart[selectedProduct.id].count === 0) ? (
                        <button 
                          onClick={() => addToCart(selectedProduct)}
                          className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 py-4 px-8 rounded-2xl text-lg font-black transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] transform hover:-translate-y-1"
                        >
                          В корзину
                        </button>
                      ) : (
                        <div className="flex-1 bg-white/10 border border-white/20 flex items-center justify-between rounded-2xl overflow-hidden backdrop-blur-md">
                          <button onClick={() => removeFromCart(selectedProduct.id)} className="p-4 hover:bg-white/10 transition-colors text-white"><Minus className="w-6 h-6" /></button>
                          <span className="text-xl font-black text-white min-w-[40px] text-center">{cart[selectedProduct.id].count}</span>
                          <button onClick={() => addToCart(selectedProduct)} className="p-4 hover:bg-white/10 transition-colors text-white"><Plus className="w-6 h-6" /></button>
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
      {(!isCartOpen) && (
        <AiWidget />
      )}
    </div>
  );
}