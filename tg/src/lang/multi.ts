import type {textMap} from '../types.js'

export function getCartTitleText(language: string): string {
  const texts:textMap = {
    ru: 'Ваша корзина',
    tj: 'Аробаи шумо',
    uz: 'Sizning savatingiz'
  };
  return texts[language] || texts.ru;
}

export function getTotalText(language: string): string {
  const texts:textMap  = {
    ru: 'Итого',
    tj: 'Ҳамагӣ',
    uz: 'Jami'
  };
  return texts[language] || texts.ru;
}

export function getDecreaseText(language: string): string {
  const texts:textMap  = {
    ru: 'Уменьшить',
    tj: 'Кам кардан',
    uz: 'Kamaytirish'
  };
  return texts[language] || texts.ru;
}

export function getIncreaseText(language: string): string {
  const texts:textMap  = {
    ru: 'Увеличить',
    tj: 'Зиёд кардан',
    uz: 'Oshirish'
  };
  return texts[language] || texts.ru;
}

export function getRemoveText(language: string): string {
  const texts:textMap  = {
    ru: 'Удалить',
    tj: 'Ҳазф кардан',
    uz: 'Oʻchirish'
  };
  return texts[language] || texts.ru;
}

export function getClearCartText(language: string): string {
  const texts:textMap  = {
    ru: 'Очистить корзину',
    tj: 'Аробаро тоза кардан',
    uz: 'Savatni tozalash'
  };
  return texts[language] || texts.ru;
}

export function getCheckoutText(language: string): string {
  const texts:textMap  = {
    ru: 'Оформить заказ',
    tj: 'Фармоиш содир кардан',
    uz: 'Buyurtma berish'
  };
  return texts[language] || texts.ru;
}

export function getContinueShoppingText(language: string): string {
  const texts:textMap  = {
    ru: 'Продолжить покупки',
    tj: 'Харид давом додан',
    uz: 'Xaridni davom ettirish'
  };
  return texts[language] || texts.ru;
}

export function getItemRemovedText(language: string): string {
  const texts:textMap  = {
    ru: 'Товар удален из корзины',
    tj: 'Маҳсулот аз ароба ҳазф шуд',
    uz: 'Mahsulot savatdan olib tashlandi'
  };
  return texts[language] || texts.ru;
}

export function getEmptyCartText(language: string): string {
  const texts:textMap  = {
    ru: 'Корзина пуста',
    tj: 'Ароба холӣ аст',
    uz: 'Savat boʻsh'
  };
  return texts[language] || texts.ru;
}

export function getSendPhoneText(language: string): string {
  const texts:textMap  = {
    ru: 'Отправить номер телефона',
    tj: 'Рақами телефонро фиристед',
    uz: 'Telefon raqamini yuborish'
  };
  return texts[language] || texts.ru;
}

export function getCancelOrderText(language: string): string {
  const texts:textMap  = {
    ru: 'Отменить заказ',
    tj: 'Фармоишро бекор кардан',
    uz: 'Buyurtmani bekor qilish'
  };
  return texts[language] || texts.ru;
}

export function getConfirmOrderText(language: string): string {
  const texts:textMap = {
    ru: 'Подтвердить заказ',
    tj: 'Фармоишро тасдиқ кардан',
    uz: 'Buyurtmani tasdiqlash'
  };
  return texts[language] || texts.ru;
}

// Функция для текста "О нас"
export function getAboutText(language: string): string {
  const texts:textMap = {
    'ru': 'Мы - лучшая пекарня в городе! 🥖\nДоставка свежей выпечки ежедневно.',
    'tj': 'Мо - беҳтарин нонвойхона дар шаҳр! 🥖\nРасонидани кандиҳои тоза ҳар рӯз.',
    'uz': 'Biz shahardagi eng yaxshi nonvoyxona! 🥖\nHar kuni yangi pishiriqlarni yetkazib beramiz.'
  };
  return (texts.hasOwnProperty(language)) ? texts[language] : texts['ru'];
}

export function getOrderConfirmationText(language: string): string {
  const texts:textMap = {
    ru: 'Подтверждение заказа',
    tj: 'Тасдиқ кардани фармоиш',
    uz: 'Buyurtmani tasdiqlash'
  };
  return texts[language] || texts.ru;
}

export function getCustomerNameText(language: string): string {
  const texts:textMap = {
    ru: 'Имя',
    tj: 'Ном',
    uz: 'Ism'
  };
  return texts[language] || texts.ru;
}

export function getOrderText(language: string): string {
  const texts:textMap = {
    ru: 'Заказ',
    tj: 'Фармоиш',
    uz: 'Buyurtma'
  };
  return texts[language] || texts.ru;
}

export function getOrderAccessDeniedText(language: string): string {
  const texts:textMap = {
    ru: '❌ У вас нет доступа к этому заказу',
    tj: '❌ Шумо ба ин фармоиш дастрасӣ надоред',
    uz: '❌ Sizda ushbu buyurtmaga kirish huquqi yo\'q'
  };
  return texts[language] || texts.ru;
}

export function getCashPaymentText(language: string): string {
  const texts:textMap = {
    ru: 'Наличными при получении',
    tj: 'Пуллакӣ дар вақти гирифтан',
    uz: 'Olib ketish paytida naqd pul'
  };
  return texts[language] || texts.ru;
}

export function getCardPaymentText(language: string): string {
  const texts:textMap = {
    ru: 'Картой при получении',
    tj: 'Кортӣ дар вақти гирифтан',
    uz: 'Olib ketish paytida karta'
  };
  return texts[language] || texts.ru;
}

export function getBackToCartText(language: string): string {
  const texts:textMap = {
    ru: 'Назад к корзине',
    tj: 'Ба ароба бозгашт',
    uz: 'Savatga qaytish'
  };
  return texts[language] || texts.ru;
}


export function getOnlinePaymentText(language: string): string {
  const texts:textMap = {
    ru: 'Онлайн оплата',
    tj: 'Пардохти онлайн',
    uz: 'Onlayn to\'lov'
  };
  return texts[language] || texts.ru;
}


export function getNewOrderText(language: string): string {
  const texts:textMap = {
    ru: 'Новый заказ',
    tj: 'Фармоиши нав',
    uz: 'Yangi buyurtma'
  };
  return texts[language] || texts.ru;
}

export function getCustomerText(language: string): string {
  const texts:textMap  = {
    ru: 'Клиент',
    tj: 'Мизоҷ',
    uz: 'Mijoz'
  };
  return texts[language] || texts.ru;
}

export function getPhoneText(language: string): string {
  const texts:textMap = {
    ru: 'Телефон',
    tj: 'Телефон',
    uz: 'Telefon'
  };
  return texts[language] || texts.ru;
}

export function getAddressText(language: string): string {
  const texts:textMap = {
    ru: 'Адрес',
    tj: 'Суроға',
    uz: 'Manzil'
  };
  return texts[language] || texts.ru;
}

export function getOrderContentsText(language: string): string {
  const texts:textMap = {
    ru: 'Состав заказа',
    tj: 'Таркиби фармоиш',
    uz: 'Buyurtma tarkibi'
  };
  return texts[language] || texts.ru;
}


export function getBackText(language: string): string {
  const texts:textMap = {
    ru: 'Назад',
    tj: 'Бозгашт',
    uz: 'Orqaga'
  };
  return texts[language] || texts.ru;
}

export function getStartShoppingText(language: string): string {
  const texts:textMap = {
    ru: 'Начать покупки',
    tj: 'Харид оғоз кардан',
    uz: 'Xaridni boshlash'
  };
  return texts[language] || texts.ru;
}

export function getMainMenuText(language: string): string {
  const texts:textMap = {
    ru: 'Главное меню',
    tj: 'Менюи асосӣ',
    uz: 'Asosiy menyu'
  };
  return texts[language] || texts.ru;
}

export function getOrderHistoryText(language: string): string {
  const texts:textMap = {
    ru: 'История заказов',
    tj: 'Таърихи фармоишҳо',
    uz: 'Buyurtmalar tarixi'
  };
  return texts[language] || texts.ru;
}

export function getRefreshText(language: string): string {
  const texts:textMap = {
    ru: 'Обновить',
    tj: 'Нав кардан',
    uz: 'Yangilash'
  };
  return texts[language] || texts.ru;
}

export function getOrderDetailsText(language: string): string {
  const texts:textMap = {
    ru: 'Детали заказа',
    tj: 'Тафсилоти фармоиш',
    uz: 'Buyurtma tafsilotlari'
  };
  return texts[language] || texts.ru;
}

export function getDateText(language: string): string {
  const texts:textMap = {
    ru: 'Дата',
    tj: 'Сана',
    uz: 'Sana'
  };
  return texts[language] || texts.ru;
}

export function getAddToCartText(language: string): string {
  const texts: textMap = {
    ru: 'Добавить в корзину',
    tj: 'Ба ароба илова кунед',
    uz: 'Savatga qo‘shish'
  };
  return texts[language] || texts.ru;
}

export function getTotalAmountText(language: string): string {
  const texts:textMap = {
    ru: 'Общая сумма',
    tj: 'Маблағи умумӣ',
    uz: 'Umumiy summa'
  };
  return texts[language] || texts.ru;
}

export function getStatusText(language: string): string {
  const texts:textMap = {
    ru: 'Статус',
    tj: 'Ҳолат',
    uz: 'Holat'
  };
  return texts[language] || texts.ru;
}

export function getOrderItemsText(language: string): string {
  const texts:textMap = {
    ru: 'Состав заказа',
    tj: 'Таркиби фармоиш',
    uz: 'Buyurtma tarkibi'
  };
  return texts[language] || texts.ru;
}

export function getNoItemsText(language: string): string {
  const texts:textMap = {
    ru: 'Товары не найдены',
    tj: 'Маҳсулотҳо ёфт нашуд',
    uz: 'Mahsulotlar topilmadi'
  };
  return texts[language] || texts.ru;
}

export function getBackToOrdersText(language: string): string {
  const texts:textMap = {
    ru: 'К заказам',
    tj: 'Ба фармоишҳо',
    uz: 'Buyurtmalarga'
  };
  return texts[language] || texts.ru;
}

export function getOrderNotFoundText(language: string): string {
  const texts:textMap = {
    ru: '❌ Заказ не найден',
    tj: '❌ Фармоиш ёфт нашуд',
    uz: '❌ Buyurtma topilmadi'
  };
  return texts[language] || texts.ru;
}

export function getOrderStatusText(status: string, language: string): string {
  const statusTexts: { [key: string]: { [key: string]: string } } = {
    new: {
      ru: '🆕 Новый',
      tj: '🆕 Нав',
      uz: '🆕 Yangi'
    },
    pending: {
      ru: '🔄 В обработке',
      tj: '🔄 Дар раванди кор',
      uz: '🔄 Qayta ishlashda'
    },
    confirmed: {
      ru: '✅ Подтвержден',
      tj: '✅ Тасдиқ шуд',
      uz: '✅ Tasdiqlandi'
    },
    cooking: {
      ru: '👨‍🍳 Готовится',
      tj: '👨‍🍳 Омода мешавад',
      uz: '👨‍🍳 Tayyorlanmoqda'
    },
    ready: {
      ru: '📦 Готов',
      tj: '📦 Омода аст',
      uz: '📦 Tayyor'
    },
    delivering: {
      ru: '🚚 Доставляется',
      tj: '🚚 Расона мешавад',
      uz: '🚚 Yetkazilmoqda'
    },
    delivered: {
      ru: '🎉 Доставлен',
      tj: '🎉 Расид',
      uz: '🎉 Yetkazib berildi'
    },
    cancelled: {
      ru: '❌ Отменен',
      tj: '❌ Бекор шуд',
      uz: '❌ Bekor qilindi'
    }
  };

  const defaultStatus: any = {
    ru: '❓ Неизвестен',
    tj: '❓ Номаълум',
    uz: '❓ Nomaʼlum'
  };

  return statusTexts[status]?.[language] || defaultStatus[language] || defaultStatus.ru;
}

export function getProductNotFoundText(language: string): string {
  const texts: textMap = {
    ru: '❌ Товар не найден',
    tj: '❌ Маҳсулот ёфт нашуд',
    uz: '❌ Mahsulot topilmadi'
  };
  return texts[language] || texts.ru;
}

export function getPriceText(language: string): string {
  const texts: textMap = {
    ru: 'Цена',
    tj: 'Нарх',
    uz: 'Narx'
  };
  return texts[language] || texts.ru;
}

export function getOldPriceText(language: string): string {
  
  const texts: textMap = {
    ru: 'Старая цена',
    tj: 'Нархи кӯҳна',
    uz: 'Eski narx'
  };
  return texts[language] || texts.ru;
}

export function getWeightText(language: string): string {
  const texts: textMap = {
    ru: 'Вес',
    tj: 'Вазн',
    uz: 'Vazn'
  };
  return texts[language] || texts.ru;
}

export function getNotAvailableText(language: string): string {
  const texts: textMap = {
    ru: '❌ Товар временно недоступен',
    tj: '❌ Маҳсулот ҳоло дастрас нест',
    uz: '❌ Mahsulot hozircha mavjud emas'
  };
  return texts[language] || texts.ru;
}

export function getMoreProductsText(language: string): string {
  const texts: textMap = {
    ru: 'Еще товары',
    tj: 'Маҳсулоти дигар',
    uz: 'Boshqa mahsulotlar'
  };
  return texts[language] || texts.ru;
}

export function getAddedToCartText(language: string): string {
  const texts: textMap = {
    ru: 'добавлен в корзину!',
    tj: 'ба ароба илова шуд!',
    uz: 'savatga qo‘shildi!'
  };
  return texts[language] || texts.ru;
}

