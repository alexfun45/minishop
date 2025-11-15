import express from 'express'
import productRouter from './products.ts'
import { productController } from '../controllers/productController.ts';
import {categoryController} from '../controllers/categoryController.ts'
import {orderController} from '../controllers/orderController.ts'

import path from 'path';
import { fileURLToPath } from 'url';

// Эмуляция __dirname для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

//router.use('/uploads', express.static('uploads')) ;
//router.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//router.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
//console.log('router', path.join(process.cwd(), 'uploads'));
//router.use('/products', productRouter);
router.use('/product/:id', productController.getById);
router.use('/products/:catId/:lang', productController.getByCategory);
router.use('/categories/:lang', categoryController.getCategories);

router.use('/orders/create', orderController.createOrder);
router.use('/orders/', orderController.getUserOrders);
export default router;
