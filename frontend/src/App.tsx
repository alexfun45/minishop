import React, { useEffect, useState, useRef } from 'react';
import { ShoppingBag, Sparkles, MessageCircle, X, Search, Star, Flame, Leaf } from 'lucide-react';
import { apiClient } from './services/api';

export default function App() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<{ [key: number]: number }>({});

  // Состояния ИИ-чата
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: 'Привет! Я твой виртуальный пекарь. Помогу найти идеальный безглютеновый хлеб или выпечку к завтраку. Что вы любите?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const DEMO_USER_ID = 42; // Условный ID для сессии ИИ

  // Скролл чата вниз при новых сообщениях
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiTyping]);

  // Загрузка категорий при старте
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

  // Переключение категорий
  const handleCategoryClick = async (id: number) => {
    setSearchQuery(''); // Сбрасываем поиск при клике на категорию
    setActiveCategory(id);
    setIsLoading(true);
    const prods = await apiClient.getProductsByCategory(id);
    setProducts(prods);
    setIsLoading(false);
  };

  // Живой поиск по товарам через твой API
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsLoading(true);
        setActiveCategory(null); // Убираем активную категорию при поиске
        const searchResults = await apiClient.searchProducts(searchQuery);
        setProducts(searchResults);
        setIsLoading(false);
      } else if (searchQuery.trim().length === 0 && categories.length > 0) {
        // Если поиск стерли — возвращаем первую категорию
        handleCategoryClick(categories[0].id);
      }
    }, 400002); // Небольшой дебаунс, чтобы не спамить бэкенд на каждый символ

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Управление корзиной
  const addToCart = (id: number) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[id] > 1) updated[id]--;
      else delete updated[id];
      return updated;
    });
  };

  const totalCartItems = Object.values(cart).reduce((a, b) => a + b, 0);

  // Отправка в RAG бэкенд
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('inputMessage', inputMessage);
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setAiMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMessage('');
    setIsAiTyping(true);

    const response = await apiClient.sendAi(DEMO_USER_ID, userText);
    console.log('response', response);
    setAiMessages(prev => [...prev, { 
      sender: 'ai', 
      text: response?.text || 'Я немного отвлекся на аромат свежих булочек. Повторите, пожалуйста!' 
    }]);
    setIsAiTyping(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 antialiased font-sans">
      
      {/* ВКУСВИЛЛ-СТАЙЛ ШАПКА */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-stone-100 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          
          {/* Логотип */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => categories.length > 0 && handleCategoryClick(categories[0].id)}>
            <div className="w-10 h-10 bg-amber-700 rounded-xl flex items-center justify-center text-white font-serif text-xl font-bold shadow-sm">
              К
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-serif font-black tracking-tight text-stone-900 block leading-tight">Корица & Закваска</span>
              <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                <Leaf className="w-3 h-3 fill-emerald-700" /> Натурально на 100%
              </span>
            </div>
          </div>

          {/* Умная поисковая строка */}
          <div className="flex-1 max-w-lg relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск свежей выпечки, багетов, десертов..."
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-700 focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* Корзина */}
          <button className="relative bg-stone-50 hover:bg-stone-100 border border-stone-200 p-3 rounded-2xl transition-all flex items-center gap-2 shrink-0 group">
            <ShoppingBag className="w-5 h-5 text-stone-700 group-hover:text-amber-800 transition-colors" />
            {totalCartItems > 0 && (
              <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-lg font-bold animate-fade-in">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* МЕНЮ КАТЕГОРИЙ */}
      <section className="bg-white border-b border-stone-100 py-4 sticky top-20 z-30">
        <div className="max-w-6xl mx-auto px-4 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-sm font-semibold transition-all duration-200 ${
                activeCategory === cat.id 
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/10 scale-102' 
                  : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100 hover:border-stone-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Заголовок секции */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight">
            {searchQuery ? `Результаты поиска для: "${searchQuery}"` : categories.find(c => c.id === activeCategory)?.name || 'Каталог'}
          </h2>
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider bg-stone-100 px-3 py-1 rounded-md">
            {products.length} товаров
          </span>
        </div>

        {/* СЕТКА ТОВАРОВ */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white h-80 rounded-3xl border border-stone-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
            <p className="text-stone-500 font-medium text-lg">Ничего не нашлось... Попробуйте спросить нашего ИИ-шефа в углу экрана!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {products.map(product => {
              // Заглушки красивых картинок для демо, если в базе их нет
              const demoImg = product.image_url || `https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80`;
              const count = cart[product.id] || 0;

              return (
                <div key={product.id} className="bg-white rounded-3xl border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(139,92,26,0.06)] transition-all duration-300 flex flex-col overflow-hidden relative group">
                  
                  {/* Имитация премиум-баджей ВкусВилла */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                    {product.price < 300 && (
                      <span className="bg-amber-100/90 text-amber-900 text-[11px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-700 fill-amber-700" /> Выгодно
                      </span>
                    )}
                  </div>

                  {/* Картинка */}
                  <div className="h-52 overflow-hidden bg-stone-100 relative">
                    <img 
                      src={demoImg} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  </div>

                  {/* Контент карточки */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-500" /> 4.9 <span className="text-stone-400 font-normal">(48 отзывов)</span>
                      </div>
                      <h3 className="font-serif font-bold text-lg text-stone-900 leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-stone-500 text-xs leading-relaxed line-clamp-2">
                        {product.description || 'Классический крафтовый рецепт из натуральных ингредиентов без использования искусственных добавок.'}
                      </p>
                    </div>

                    {/* Цена и Управление кнопкой корзины */}
                    <div className="flex items-center justify-between pt-3 border-t border-stone-50">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black tracking-tight text-stone-900">{product.price} ₽</span>
                        <span className="text-[10px] text-stone-400 font-medium">за 1 шт.</span>
                      </div>

                      {count === 0 ? (
                        <button 
                          onClick={() => addToCart(product.id)}
                          className="bg-emerald-50 text-emerald-800 hover:bg-emerald-700 hover:text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 shadow-sm"
                        >
                          В корзину
                        </button>
                      ) : (
                        <div className="bg-emerald-700 text-white flex items-center rounded-2xl overflow-hidden shadow-sm">
                          <button onClick={() => removeFromCart(product.id)} className="px-3 py-2.5 font-bold hover:bg-emerald-800 transition-colors">-</button>
                          <span className="px-2 text-sm font-bold min-w-[24px] text-center">{count}</span>
                          <button onClick={() => addToCart(product.id)} className="px-3 py-2.5 font-bold hover:bg-emerald-800 transition-colors">+</button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ПРЕМИАЛЬНЫЙ ИИ-ВИДЖЕТ В УГЛУ */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isAiOpen ? (
          <button 
            onClick={() => setIsAiOpen(true)} 
            className="bg-stone-900 text-white p-4 rounded-3xl shadow-2xl hover:bg-amber-800 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-semibold text-sm group"
          >
            <MessageCircle className="w-5 h-5 fill-white group-hover:rotate-12 transition-transform" />
            <span>Спросить ИИ-шефа</span>
          </button>
        ) : (
          <div className="bg-white w-[360px] sm:w-[400px] h-[520px] rounded-3xl shadow-2xl border border-stone-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
            
            {/* Шапка чата */}
            <div className="bg-stone-900 text-white px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-700 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm leading-tight">Нейро-помощник</h4>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    Онлайн
                  </span>
                </div>
              </div>
              <button onClick={() => setIsAiOpen(false)} className="text-stone-400 hover:text-white transition-colors bg-stone-800 p-1.5 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Тело чата */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF9F5]">
              {aiMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.02)] border ${
                    msg.sender === 'user' 
                      ? 'bg-emerald-700 text-white border-transparent rounded-tr-none font-medium' 
                      : 'bg-white text-stone-800 border-stone-200/60 rounded-tl-none leading-relaxed'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex gap-1.5 items-center text-stone-400 text-xs bg-white border border-stone-200/60 rounded-2xl px-4 py-2 w-max rounded-tl-none shadow-sm">
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Инпут чата */}
            <form onSubmit={handleSendAiMessage} className="p-3.5 bg-white border-t border-stone-100 flex gap-2">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="«Какая выпечка без сахара?»"
                className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-stone-900 focus:bg-white transition-all"
              />
              <button type="submit" className="bg-stone-900 hover:bg-stone-800 text-white px-4 rounded-2xl text-sm font-bold transition-colors">
                Ок
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}