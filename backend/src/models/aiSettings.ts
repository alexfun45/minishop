import type { Optional } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

interface AiSettingsAttributes {
  id: number;
  system_prompt: string;
  creativity_level: number;
  company_promotions: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface AiSettingsCreationAttributes extends Optional<AiSettingsAttributes, 'id' | 'company_promotions'> {}

class AiSettings extends Model<AiSettingsAttributes, AiSettingsCreationAttributes> implements AiSettingsAttributes {
  declare id: number;
  declare system_prompt: string;
  declare creativity_level: number;
  declare company_promotions: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

AiSettings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    system_prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    creativity_level: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      defaultValue: 0.3, // По умолчанию "Точные факты"
    },
    company_promotions: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
  },
  {
    sequelize,
    tableName: 'ai_settings',
    timestamps: true,
    underscored: true,
  }
);

export { AiSettings };