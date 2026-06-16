import WebApp from '@twa-dev/sdk';

export const isTelegramApp = (): boolean => {
  return typeof window !== 'undefined' && 
         WebApp.initData !== '' && 
         WebApp.initDataUnsafe?.user !== undefined;
};

export const initTelegramApp = () => {

  if (!isTelegramApp()) return;
  // Сообщаем Telegram, что приложение полностью загрузилось
  WebApp.ready();

  // Расширяем Mini App на весь экран (опционально, но для шопа мастхэв)
  WebApp.expand();
  WebApp.setHeaderColor('#0c0a09');
  // Включаем подтверждение закрытия, если в корзине что-то есть
  WebApp.enableClosingConfirmation();

  // Можно залогировать данные пользователя для проверки в консоли (dev-режим)
  console.log('Telegram User Data:', WebApp.initDataUnsafe?.user);
};

export const getTelegramUser = () => {
  return WebApp.initDataUnsafe?.user;
};

export const closeTelegramApp = () => {
  WebApp.close();
};