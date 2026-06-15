import { apiClient } from "./api";

export class AnalyticsService {
  private static getUserId(): string {
    // Берем ID пользователя из Telegram WebApp initData или создаем временный UUID для сайта
    if ((window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return (window as any).Telegram.WebApp.initDataUnsafe.user.id.toString();
    }
    
    let localId = localStorage.getItem('analytics_user_id');
    if (!localId) {
      localId = 'crypto_user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('analytics_user_id', localId);
    }
    return localId;
  }

  public static async track(eventName: string, properties?: Record<string, any>) {
    try {
      const payload = {
        userId: this.getUserId(),
        eventName,
        properties,
        pageUrl: window.location.pathname + window.location.search,
      };

      apiClient.track(payload);
    } catch (e) {
      console.error(e);
    }
  }
}