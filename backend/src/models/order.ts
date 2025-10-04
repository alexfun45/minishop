// models/Order.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface OrderAttribute{
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  delivery_address: string;
  delivery_time: string;
  customer_name: string;
  customer_phone: string;
  payment_method: string;
  payment_status: string;
  notes: string;
  delivery_lat: string;
  delivery_lng: string;
}

interface OrderCreationAttribute extends Optional<OrderAttribute,
 'id' | 'status' | 'delivery_address' | 'delivery_time' | 'customer_phone' | 'payment_method' | 'payment_status' | 'notes' | 'delivery_lat' | 'delivery_lng'> {}

 class Order extends Model<OrderAttribute, OrderCreationAttribute> implements OrderAttribute{
  declare id: number;
  declare user_id: number;
  declare total_amount: number;
  declare status: string;
  declare delivery_address: string;
  declare delivery_time: string;
  declare customer_name: string;
  declare customer_phone: string;
  declare payment_method: string;
  declare payment_status: string;
  declare notes: string;
  declare delivery_lat: string;
  declare delivery_lng: string;
 }

 Order.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  },
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  delivery_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  customer_phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  customer_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'card', 'online'),
    defaultValue: 'cash',
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  delivery_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  delivery_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  }
 }
  , 
  {sequelize,
    tableName: 'orders',
    timestamps: true,
    underscored: true});
  
export {Order}