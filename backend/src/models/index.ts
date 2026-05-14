// models/index.ts
import { User } from './user.js';
import { Product } from './product.js';
import { Category } from './category.js';
import { Order } from './order.js';
import { OrderItem } from './OrderItem.js';
import {Event} from './events.js'

// Импортируем ассоциации
import './associations.js';

export {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  Event
}