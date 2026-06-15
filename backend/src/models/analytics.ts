import type { Optional } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

interface AnalyticsEventAttribute {
  id: number;
  user_id: string;        // Стринга, так как тут может быть и Telegram ID, и временный UUID фронтенда
  event_name: string;     // 'page_view', 'product_view', 'add_to_cart', 'purchase' и т.д.
  properties: any;        // Объект с динамическими данными (JSONB)
  page_url: string;       // URL страницы, где произошло событие
  os: string;             // Операционная система (iOS, Android, Windows, MacOS)
  created_at?: Date;
  updated_at?: Date;
}

interface AnalyticsEventCreationAttribute extends Optional<AnalyticsEventAttribute, 'id' | 'properties' | 'os'> {}

class AnalyticsEvent extends Model<AnalyticsEventAttribute, AnalyticsEventCreationAttribute> implements AnalyticsEventAttribute {
  declare id: number;
  declare user_id: string;
  declare event_name: string;
  declare properties: any;
  declare page_url: string;
  declare os: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

AnalyticsEvent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    event_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    properties: {
      type: DataTypes.JSONB, // Премиальный выбор для Postgres, сохраняет бинарный JSON
      allowNull: true,
      defaultValue: {},
    },
    page_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    os: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Unknown',
    },
  },
  {
    sequelize,
    tableName: 'analytics_events',
    timestamps: true,
    underscored: true, // Будет автоматически мапить созданные поля в created_at и updated_at
    
    // Добавляем индексы для высокой скорости работы графиков в админке
    indexes: [
      {
        fields: ['event_name'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['created_at'], // Чтобы быстро фильтровать аналитику за "Сегодня", "7 дней", "Месяц"
      },
    ],
  }
);

export { AnalyticsEvent };