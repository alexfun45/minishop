import type { Optional } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import type { StringValidation } from 'zod/v3';

interface AiChatAttributes {
  id: number;
  user_id: string;
  user_message: string;
  ai_response: string;
  intent: string;
  is_cached: boolean;
  products_found?: string;
  created_at?: Date;
}

interface AiDocumentCreationAttributes extends Optional<AiChatAttributes, 'id' | 'user_id'> {}

class AiChatLogs extends Model<AiChatAttributes, AiDocumentCreationAttributes> implements AiChatAttributes {
  declare id: number;
  declare user_id: string;
  declare user_message: string;
  declare is_cached: boolean;
  declare ai_response: string;
  declare intent: 'processing' | 'indexed' | 'error';
  declare products_found: string;
  declare readonly created_at: Date;
}

AiChatLogs.init(
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
    user_message: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    is_cached: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    ai_response: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    intent: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'processing',
    },
    products_found: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'aichatlogs',
    timestamps: true,
    underscored: true,
  }
);

export { AiChatLogs };