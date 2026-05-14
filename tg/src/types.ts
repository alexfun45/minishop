export interface UserSession {
  cart: CartItem[];
  userPhone: string;
  userId: number;
  awaitingPhoneForOrders?: boolean;
  currentCategory?: number;
  language: 'ru' | 'tj' | 'uz';
  checkoutStep?: 'phone' | 'address' | 'confirm' | 'payment';
  tempOrder?: any;
  lastMessageId?: number;
}

export type Language = 'ru' | 'tj' | 'uz';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface BotContext {
  chatId: number;
  message?: any;
  callbackQuery?: any;
  session: UserSession;
  bot: any;
}

export interface textMap {
  [name: string]: string;
}

// Тексты на разных языках
export const translations: any = {
  ru: {
    welcome: `🍞 Добро пожаловать в нашу пекарню!

Здесь вы можете:
• 🛍️ Просмотреть товары по категориям
• 🔍 Найти нужный товар через поиск
• 🛒 Добавлять товары в корзину
• 📦 Оформлять заказы с доставкой
• 👤 Настроить язык и профиль

Выберите действие из меню ниже:`,

    categories: '🛍️ Категории',
    search: '🔍 Поиск',
    cart: '🛒 Корзина',
    orders: '📦 Мои заказы',
    profile: '👤 Профиль',
    about: 'ℹ️ О нас',
    back: '⬅️ Назад',
    chooseCategory: '🏪 Выберите категорию:',
    emptyCategories: '📭 Категории временно недоступны.',
    error: '⚠️ Произошла ошибка.'
  },
  tj: {
    welcome: `🍞 Ба мо нонвойхона хуш омадед!

Дар ин чо шумо метавонед:
• 🛍️ Маҳсулотҳоро аз рӯи категорияҳо бубинед
• 🔍 Маҳсулоти дархостро тавассути ҷустуҷӯ пайдо кунед
• 🛒 Маҳсулотҳоро ба ароба илова кунед
• 📦 Фармоишҳоро бо расондан тартиб диҳед
• 👤 Забон ва профилро танзим кунед

Аз менюи поин як амалро интихоб кунед:`,

    categories: '🛍️ Категорияҳо',
    search: '🔍 Ҷустуҷӯ',
    cart: '🛒 Ароба',
    orders: '📦 Фармоишҳои ман',
    profile: '👤 Профил',
    about: 'ℹ️ Дар бораи мо',
    back: '⬅️ Бозгашт',
    chooseCategory: '🏪 Категорияро интихоб кунед:',
    emptyCategories: '📭 Категорияҳо ҳоло дастрас нестанд.',
    error: '⚠️ Хато рӯй дод.'
  },
  uz: {
    welcome: `🍞 Nonvoyxonamizga xush kelibsiz!

Bu yerda siz quyidagilarni qilishingiz mumkin:
• 🛍️ Mahsulotlarni toifalar bo‘yicha ko‘ring
• 🔍 Qidiruv orqali kerakli mahsulotni toping
• 🛒 Mahsulotlarni savatga qo‘shing
• 📦 Yetkazib berish bilan buyurtma bering
• 👤 Til va profilni sozlang

Quyidagi menyudan harakatni tanlang:`,

    categories: '🛍️ Toifalar',
    search: '🔍 Qidiruv',
    cart: '🛒 Savat',
    orders: '📦 Mening buyurtmalarim',
    profile: '👤 Profil',
    about: 'ℹ️ Biz haqimizda',
    back: '⬅️ Orqaga',
    chooseCategory: '🏪 Toifani tanlang:',
    emptyCategories: '📭 Toifalar hozircha mavjud emas.',
    error: '⚠️ Xatolik yuz berdi.'
  }
};

export function getTranslation(session: UserSession, key: string): string {
  return translations[session.language][key] || key;
}