// models/associations.ts
import { User } from './user.ts';
import { Product } from './product.ts';
import { Category } from './category.ts';
import { Order } from './order.ts';
import { OrderItem } from './OrderItem.ts';

// User ↔ Order (One-to-Many)
User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders',
  onDelete: 'CASCADE',
});

Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Category ↔ Product (One-to-Many)
Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products',
  onDelete: 'CASCADE',
});

Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category',
});

// Order ↔ OrderItem (One-to-Many)
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'order_items',
  onDelete: 'CASCADE',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

// Product ↔ OrderItem (One-to-Many)
Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  as: 'order_items',
});

OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

// Order ↔ Product (Many-to-Many через OrderItem)
Order.belongsToMany(Product, {
  through: OrderItem,
  foreignKey: 'order_id',
  otherKey: 'product_id',
  as: 'products',
});

Product.belongsToMany(Order, {
  through: OrderItem,
  foreignKey: 'product_id',
  otherKey: 'order_id',
  as: 'orders',
});

console.log('✅ All model associations established');