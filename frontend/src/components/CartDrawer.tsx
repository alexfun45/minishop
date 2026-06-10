import { useState } from 'react';
import { ShoppingBag, X, Trash2, Minus, Plus, ChevronRight } from 'lucide-react';
import { apiClient } from '../services/api';

// Описываем типы для пропсов, которые компонент ожидает получить от App.tsx
interface Product {
  id: number;
  name_ru: string;
  description: string;
  price: number;
  image_url?: string;
}

interface CartItem {
  product: Product;
  count: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalPrice: number;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (id: number, removeAll?: boolean) => void;
  onClearCart: () => void; // Чтобы очистить корзину после успешного заказа
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  totalPrice,
  onAddToCart,
  onRemoveFromCart,
  onClearCart
}: CartDrawerProps) {
  
  // Локальные состояния для пошагового оформления
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'delivery' | 'contacts' | 'payment' | 'success'>('cart');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentUrl, setPaymentUrl] = useState<string>('');

  // Если шторка закрыта, ничего не рендерим
  if (!isOpen) return null;

  const handlePlaceOrder = async () => {
    setIsSubmitting(false); // Сброс стейта на старте
  
  // 1. Формируем тело запроса один в один как в ТГ-боте
  // Так как у нас демо, в качестве user_id можно передать токен из localStorage
  const rawUserId = localStorage.getItem('bakery_ai_user_id');

  const numericUserId = rawUserId 
    ? Number(rawUserId) 
    : Number(Date.now().toString() + Math.floor(100 + Math.random() * 900).toString());
  
  const orderData = {
    customer_name: name,
    customer_phone: phone,
    delivery_address: deliveryType === 'delivery' ? address : 'Самовывоз (ул. Коричная, д. 12)',
    user_id: numericUserId,
    telegram_id: null,
    total_amount: totalPrice,
    payment_method: paymentMethod, // 'online' или 'cash'
    items: cartItems.map(item => ({
      product_id: item.product.id,
      quantity: item.count,
      price: item.product.price
    }))
  };

  try {
    setIsSubmitting(true);
    console.log('🟡 Sending order data to API:', JSON.stringify(orderData, null, 2));
    
    // Вызываем реальный метод вашего API
    const result = await apiClient.createOrder(orderData);
    console.log('🟡 API response received:', result);

    if (result && result.success) {
      setOrderNumber(result.data.id.toString());
      
      // Проверяем сценарий онлайн-оплаты
      if (paymentMethod === 'online' && result.data.payment_url) {
        // Сохраняем ссылку во временный стейт компонента (добавьте его к остальным useState вверху)
        setPaymentUrl(result.data.payment_url);
      } else {
        setPaymentUrl(''); // Сброс для налички
      }

      // Очищаем корзину в App.tsx
      onClearCart();
      // Переходим на финальный экран
      setCheckoutStep('success');
    } else {
      alert(`❌ Ошибка API: ${result?.error || 'Неизвестная ошибка'}`);
    }
  } catch (error) {
    console.error('Place order error:', error);
    alert('❌ Произошла ошибка при оформлении заказа. Проверьте консоль или статус бэкенда.');
  } finally {
    setIsSubmitting(false);
  }
  };

  const handleClose = () => {
    // Если заказ успешен, при закрытии возвращаем форму в исходное состояние 'cart'
    if (checkoutStep === 'success') {
      setCheckoutStep('cart');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Оверлей (задний фон) */}
      <div 
        className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={() => {
          if (checkoutStep !== 'success') handleClose();
        }} 
      />
      
      {/* Контейнер панели */}
      <div className="relative w-full max-w-md bg-stone-950/90 border-l border-white/10 h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 backdrop-blur-2xl text-stone-200">
        
        {/* ШАПКА КОРЗИНЫ */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
          <h3 className="font-serif text-2xl font-black text-white flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-amber-500" />
            {checkoutStep === 'cart' && 'Ваша корзина'}
            {checkoutStep === 'delivery' && '1. Доставка'}
            {checkoutStep === 'contacts' && '2. Контакты'}
            {checkoutStep === 'payment' && '3. Оплата'}
            {checkoutStep === 'success' && 'Заказ принят!'}
          </h3>
          {checkoutStep !== 'success' && (
            <button onClick={handleClose} className="text-stone-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* СТЕППЕР (ПРОГРЕСС-БАР) */}
        {checkoutStep !== 'cart' && checkoutStep !== 'success' && (
          <div className="bg-stone-900/50 px-6 py-3 border-b border-white/5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500 shrink-0">
            <span className={checkoutStep === 'delivery' ? 'text-amber-500' : 'text-stone-300'}>Доставка</span>
            <ChevronRight className="w-3 h-3" />
            <span className={checkoutStep === 'contacts' ? 'text-amber-500' : checkoutStep === 'payment' ? 'text-stone-300' : ''}>Контакты</span>
            <ChevronRight className="w-3 h-3" />
            <span className={checkoutStep === 'payment' ? 'text-amber-500' : ''}>Оплата</span>
          </div>
        )}

        {/* КОНТЕНТ ШАГОВ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          
          {/* ШАГ 0: СПИСОК ТОВАРОВ */}
          {checkoutStep === 'cart' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {cartItems === undefined || cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-500 py-32 space-y-4">
                  <ShoppingBag className="w-16 h-16 opacity-20" />
                  <p className="font-serif text-lg">Корзина пуста</p>
                </div>
              ) : (
                cartItems.map(({ product, count }) => (
                  <div key={product.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center">
                    <img src={product.image_url || 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=200'} alt={product.name_ru} className="w-16 h-16 rounded-xl object-cover border border-white/5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate text-sm">{product.name_ru}</h4>
                      <div className="text-amber-400 font-bold text-sm mt-1">{product.price * count} ₽</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => onRemoveFromCart(product.id, true)} className="text-stone-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-3 bg-stone-900 border border-white/10 rounded-lg px-2 py-1">
                        <button onClick={() => onRemoveFromCart(product.id)} className="text-stone-400 hover:text-white"><Minus className="w-3 h-3" /></button>
                        <span className="text-xs font-bold text-white w-4 text-center">{count}</span>
                        <button onClick={() => onAddToCart(product)} className="text-stone-400 hover:text-white"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ШАГ 1: СПОСОБ ПОЛУЧЕНИЯ */}
          {checkoutStep === 'delivery' && (
            <div className="space-y-5 animate-in slide-in-from-right-5 duration-200">
              <div className="grid grid-cols-2 gap-3 bg-white/5 p-1.5 rounded-xl border border-white/5">
                <button 
                  onClick={() => setDeliveryType('delivery')}
                  className={`py-3 rounded-lg text-sm font-bold transition-all ${deliveryType === 'delivery' ? 'bg-amber-600 text-stone-950 shadow-md' : 'text-stone-400 hover:text-white'}`}
                >
                  Доставка курьером
                </button>
                <button 
                  onClick={() => setDeliveryType('pickup')}
                  className={`py-3 rounded-lg text-sm font-bold transition-all ${deliveryType === 'pickup' ? 'bg-amber-600 text-stone-950 shadow-md' : 'text-stone-400 hover:text-white'}`}
                >
                  Самовывоз
                </button>
              </div>

              {deliveryType === 'delivery' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Адрес доставки</label>
                  <textarea 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Город, улица, дом, квартира..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all resize-none"
                  />
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-bold text-white">Пункт выдачи:</p>
                  <p className="text-sm text-stone-400 font-light">ул. Коричная, д. 12 (с 09:00 до 21:00)</p>
                </div>
              )}
            </div>
          )}

          {/* ШАГ 2: КОНТАКТЫ */}
          {checkoutStep === 'contacts' && (
            <div className="space-y-4 animate-in slide-in-from-right-5 duration-200">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Ваше имя</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Как к вам обращаться?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Номер телефона</label>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          )}

          {/* ШАГ 3: ОПЛАТА */}
          {checkoutStep === 'payment' && (
            <div className="space-y-4 animate-in slide-in-from-right-5 duration-200">
              <div 
                onClick={() => setPaymentMethod('online')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'online' ? 'bg-amber-500/10 border-amber-500' : 'bg-white/5 border-white/10'}`}
              >
                <div>
                  <p className="text-sm font-bold text-white">Картой онлайн</p>
                  <p className="text-xs text-stone-400 mt-1">СБП, Мир, Visa</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-amber-500' : 'border-stone-600'}`}>
                  {paymentMethod === 'online' && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
                </div>
              </div>

              <div 
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'cash' ? 'bg-amber-500/10 border-amber-500' : 'bg-white/5 border-white/10'}`}
              >
                <div>
                  <p className="text-sm font-bold text-white">При получении</p>
                  <p className="text-xs text-stone-400 mt-1">Наличными или картой курьеру</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-amber-500' : 'border-stone-600'}`}>
                  {paymentMethod === 'cash' && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
                </div>
              </div>
            </div>
          )}

          {/* ШАГ 4: УСПЕХ */}
          {checkoutStep === 'success' && (
            <div className="text-center py-8 space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 rounded-full flex items-center justify-center text-4xl font-black mx-auto shadow-[0_0_30px_rgba(217,119,6,0.4)]">
                ✓
              </div>
              
              <div className="space-y-2">
                <h4 className="font-serif text-2xl font-black text-white">
                  Заказ #{orderNumber} сформирован!
                </h4>
                
                {/* Условный рендеринг текста в зависимости от платежки */}
                {paymentUrl ? (
                  <p className="text-sm text-stone-400 font-light px-6">
                    Для завершения оформления необходимо оплатить его онлайн по кнопке ниже. После успешной транзакции мы передадим чек на кухню.
                  </p>
                ) : (
                  <p className="text-sm text-stone-400 font-light px-6">
                    Мы уже передали ваш чек пекарям. Выпечка начинает готовиться, ожидайте звонка для подтверждения!
                  </p>
                )}
              </div>

              {/* ЕСЛИ ОНЛАЙН-ОПЛАТА: Выводим кнопку ЮKassa */}
              {paymentUrl && (
                <div className="px-6 animate-in fade-in slide-in-from-bottom-3 delay-150 duration-300">
                  <a 
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-stone-950 py-4 px-6 rounded-xl font-black text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3 decoration-0"
                  >
                    💳 Оплатить заказ онлайн
                  </a>
                  <span className="text-[11px] text-stone-500 block mt-2 font-light">
                    Ссылка откроется в новой вкладке через безопасный шлюз ЮKassa
                  </span>
                </div>
              )}

              <div className="border-t border-white/5 pt-4">
                <button 
                  onClick={handleClose}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 px-8 py-3 rounded-xl text-sm font-bold transition-all"
                >
                  Вернуться на витрину
                </button>
              </div>
            </div>
          )}

        </div>

        {/* КНОПКИ ДЕЙСТВИЯ ВНИЗУ ЭКРАНА */}
        {checkoutStep !== 'success' && cartItems.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-stone-900/90 space-y-4 backdrop-blur-md shrink-0">
            {checkoutStep === 'cart' ? (
              <>
                <div className="flex justify-between items-center text-stone-300">
                  <span className="font-medium">Сумма заказа</span>
                  <span className="text-xl font-black text-white">{totalPrice} ₽</span>
                </div>
                <button 
                  onClick={() => setCheckoutStep('delivery')}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2"
                >
                  Оформить доставку <ChevronRight className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <button
                  disabled={isSubmitting}
                  onClick={() => {
                    if (checkoutStep === 'delivery') setCheckoutStep('cart');
                    if (checkoutStep === 'contacts') setCheckoutStep('delivery');
                    if (checkoutStep === 'payment') setCheckoutStep('contacts');
                  }}
                  className="px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  Назад
                </button>
                
                {checkoutStep === 'payment' ? (
                  <button
                    disabled={isSubmitting}
                    onClick={handlePlaceOrder}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 py-4 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(217,119,6,0.3)]"
                  >
                    {isSubmitting ? 'Отправка...' : `Подтвердить заказ на ${totalPrice} ₽`}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (checkoutStep === 'delivery' && deliveryType === 'delivery' && !address.trim()) return alert('Пожалуйста, укажите адрес');
                      if (checkoutStep === 'contacts' && (!name.trim() || !phone.trim())) return alert('Заполните имя и телефон');
                      
                      if (checkoutStep === 'delivery') setCheckoutStep('contacts');
                      if (checkoutStep === 'contacts') setCheckoutStep('payment');
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-stone-950 py-4 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2"
                  >
                    Продолжить <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}