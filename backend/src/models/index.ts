// models/index.ts
import { User } from './user.ts';
import { Product } from './product.ts';
import { Category } from './category.ts';
import { Order } from './order.ts';
import { OrderItem } from './OrderItem.ts';
import {Event} from './events.ts'

// Импортируем ассоциации
import './associations.ts';

export {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  Event
}