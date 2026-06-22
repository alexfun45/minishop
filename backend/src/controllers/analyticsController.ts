import type { Request, Response } from 'express';
import { AnalyticsEvent } from '../models/analytics.js';

export class AnalyticsController {
  public static track = async (req: Request, res: Response) => {
    try {
      const { userId, eventName, properties, pageUrl } = req.body;
      const userAgent = req.headers['user-agent'] || '';

      // Простой и быстрый парсинг операционной системы из заголовков
      let os = 'Unknown';
      if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';
      else if (/Android/i.test(userAgent)) os = 'Android';
      else if (/Windows/i.test(userAgent)) os = 'Windows';
      else if (/Macintosh/i.test(userAgent)) os = 'MacOS';

      // Сохраняем событие в Postgres через Sequelize
      await AnalyticsEvent.create({
        user_id: userId.toString(),
        event_name: eventName,
        properties: properties || {},
        page_url: pageUrl || '',
        os: os
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Analytics Error] Ошибка сохранения события:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };
}
