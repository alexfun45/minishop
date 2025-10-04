// services/UserService.ts
import { User } from '../models/user.ts';
import { UserAttributes } from '../types/ModelTypes.js';

export class UserService {
  // Найти или создать пользователя по Telegram ID
  async findOrCreate(telegramUser: any) {
    const [user, created] = await User.findOrCreate({
      where: { telegram_id: telegramUser.id },
      defaults: {
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        language: 'ru',
      } as any,
    });

    return { user: user as any, created };
  }

  // Обновить язык пользователя
  async updateLanguage(userId: number, language: string) {
    const user = await User.findByPk(userId) as unknown as UserAttributes;
    if (!user) {
      throw new Error('User not found');
    }

    user.language = language;
    await user.save();

    return user;
  }

  // Добавить бонусные баллы
  async addBonusPoints(userId: number, points: number) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.bonus_points += points;
    await user.save();

    return user;
  }

  // Найти пользователя по ID
  async findById(userId: number) {
    return await User.findByPk(userId);
  }

  // Найти пользователя по Telegram ID
  async findByTelegramId(telegramId: number) {
    return await User.findOne({ where: { telegram_id: telegramId } });
  }
}

export const userService = new UserService();