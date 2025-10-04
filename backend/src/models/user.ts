// models/User.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface UserAttributes {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  language: string;
  phone: string | null;
  bonus_points: number;
  is_active: boolean;
  //created_at: Date;
  //updated_at: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 
  'id' | 'username' | 'last_name' | 'phone' | 'bonus_points' | 'is_active'
> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare telegram_id: number;
  declare username: string | null;
  declare first_name: string;
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
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  first_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  language: {
    type: DataTypes.ENUM('ru', 'tj', 'uz'),
    defaultValue: 'ru',
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
  },
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

export { User };

/*import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  telegram_id: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  first_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  language: {
    type: DataTypes.ENUM('ru', 'tj', 'uz'),
    defaultValue: 'ru',
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
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});
*/