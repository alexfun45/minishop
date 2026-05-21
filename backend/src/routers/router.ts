import express from 'express'
import { productController } from '../controllers/productController.js';
import {categoryController} from '../controllers/categoryController.js'
import {orderController} from '../controllers/orderController.js'
import { getPayment } from '../controllers/payments.js';
import {AiService} from '../services/AiService.js'
import path from 'path';
import { fileURLToPath } from 'url';

// Эмуляция __dirname для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const aiService = new AiService();

router.get('/product/search/:q/:lang', productController.search);
router.get('/product/:id', productController.getById);
router.use('/products/:catId/:lang', productController.getByCategory);
router.use('/categories/:lang', categoryController.getCategories);


router.use('/orders/create', orderController.createOrder);
router.use('/orders/:userId', orderController.getUserOrders);
router.use('/order/:orderId', orderController.getOrder);

router.post('/ai/', aiService.handleUserMessage);

router.use('/payment/webhook', getPayment);
export default router;
