import { Star, Flame, Minus, Plus } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
}


interface ProductCardProps {
  product: Product;
  count: number;
  onOpen: (product: Product) => void;
  onAddToCart: (product: any) => void;
  onRemoveFromCart: (id: number) => void;
}

export default function ProductCard({ 
  product, 
  count, 
  onOpen, 
  onAddToCart, 
  onRemoveFromCart 
}: ProductCardProps) {
  
  const demoImg = product.image_url?.replace('http://', 'https://') || `https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&auto=format&fit=crop&q=80`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Чтобы не срабатывал клик по карточке (открытие модалки)
    onAddToCart(product);
    
    /*AnalyticsService.track('add_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      currentCountInCart: count + 1
    });*/
  };

  const handleRemoveFromCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveFromCart(product.id);
  };

  return (
    <div 
      className="bg-stone-900/40 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-amber-500/30 shadow-2xl hover:shadow-[0_10px_40px_rgba(217,119,6,0.15)] transition-all duration-500 flex flex-col overflow-hidden relative group cursor-pointer" 
      onClick={() => onOpen(product)}
    >
      {/* Лейбл "Выбор шефа" */}
      {product.price < 300 && (
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-stone-950/80 border border-amber-500/30 text-amber-400 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> Выбор шефа
          </span>
        </div>
      )}

      {/* Изображение */}
      <div className="h-60 overflow-hidden bg-stone-950 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent z-10" />
        <img 
          src={demoImg} 
          crossOrigin="anonymous"
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700 opacity-90 group-hover:opacity-100" 
        />
      </div>

      {/* Контентная часть */}
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

        {/* Блок цены и управления корзиной */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-white">{product.price} ₽</span>
          </div>

          {count === 0 ? (
            <button 
              onClick={handleAddToCart} 
              className="bg-white/10 border border-white/20 text-white hover:bg-amber-600 hover:border-amber-500 hover:text-stone-950 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm backdrop-blur-md"
            >
              Добавить
            </button>
          ) : (
            <div className="bg-amber-600 text-stone-950 flex items-center rounded-xl overflow-hidden shadow-[0_0_15px_rgba(217,119,6,0.3)]">
              <button 
                onClick={handleRemoveFromCart} 
                className="px-3 py-2.5 hover:bg-amber-500 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-2 text-sm font-black min-w-[32px] text-center">{count}</span>
              <button 
                onClick={handleAddToCart} 
                className="px-3 py-2.5 hover:bg-amber-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}