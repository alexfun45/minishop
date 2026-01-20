import type {Optional } from 'sequelize';
import {DataTypes, Model} from 'sequelize'
import sequelize from '../config/database.ts';

interface UserAttributes {
  id: number;
  telegram_id: number;
  role: 'user' | 'admin' | 'manager';
  username: string | null;
  password: string | null;
  first_name: string | null;
  last_name: string | null;
  language: string;
  phone: string | null;
  bonus_points: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 
  'id' | 'username' | 'telegram_id' | 'first_name' | 'language' | 'last_name' | 'phone' | 'bonus_points' | 'is_active' | 'password'
> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare telegram_id: number;
  declare password: string;
  declare role: 'user' | 'admin' | 'manager';
  declare username: string | null;
  declare first_name: string | null;
  declare last_name: string | null;
  declare language: string;
  declare phone: string | null;
  declare bonus_points: number;
  declare is_active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  telegram_id: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: true,
  },
  password:{
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'manager'),
    defaultValue: 'user',
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  first_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  last_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  language: {
    type: DataTypes.ENUM('ru', 'tj', 'uz'),
    defaultValue: 'ru',
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  bonus_points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at', // Маппинг на underscored
  updatedAt: 'updated_at',
});

export { User };