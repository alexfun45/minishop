import type {textMap} from '../types'

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