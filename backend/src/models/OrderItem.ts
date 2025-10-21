import type {Optional } from 'sequelize';
import {DataTypes, Model} from 'sequelize'
import sequelize from '../config/database.ts';

interface OrderItemAttribute{
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
  product_image: string;
}

interface OrderItemCreationAttribute extends Optional<OrderItemAttribute,
 'id' | 'quantity' | 'price' | 'product_name' | 'product_image'> {}

 class OrderItem extends Model<OrderItemAttribute, OrderItemCreationAttribute> implements OrderItemAttribute{
  declare id: number;
  declare order_id: number;
  declare product_id: number;
  declare quantity: number;
  declare price: number;
  declare product_name: string;
  declare product_image: string;
 }

 OrderItem.init({
  id: {
  type: DataTypes.INTEGER,
  primaryKey: true,
  autoIncrement: true,
},
order_id: {
  type: DataTypes.INTEGER,
  allowNull: false,
},
product_id: {
  type: DataTypes.INTEGER,
  allowNull: false,
},
quantity: {
  type: DataTypes.INTEGER,
  allowNull: false,
  defaultValue: 1,
  validate: {
    min: 1,
  },
},
price: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
  validate: {
    min: 0,
  },
},
product_name: {
  type: DataTypes.STRING(255),
  allowNull: false,
},
product_image: {
  type: DataTypes.STRING(500),
  allowNull: true,
}
}, {
  sequelize,
  tableName: 'order_items',
  timestamps: true,
  underscored: true
});

export {OrderItem}

/*
export const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
    },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  product_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'order_items',
  timestamps: true,
  underscored: true,
});
*/