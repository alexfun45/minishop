import type { Optional } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

interface AiDocumentAttributes {
  id: string; // Используем UUID строку
  file_name: string;
  file_size: string;
  storage_path: string;
  status: 'processing' | 'indexed' | 'error';
  created_at?: Date;
  updated_at?: Date;
}

interface AiDocumentCreationAttributes extends Optional<AiDocumentAttributes, 'id' | 'status'> {}

class AiDocument extends Model<AiDocumentAttributes, AiDocumentCreationAttributes> implements AiDocumentAttributes {
  declare id: string;
  declare file_name: string;
  declare file_size: string;
  declare storage_path: string;
  declare status: 'processing' | 'indexed' | 'error';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

AiDocument.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_size: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    storage_path: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('processing', 'indexed', 'error'),
      allowNull: false,
      defaultValue: 'processing',
    },
  },
  {
    sequelize,
    tableName: 'ai_documents',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['status'], // Чтобы быстро находить документы в очереди на векторизацию
      },
    ],
  }
);

export { AiDocument };