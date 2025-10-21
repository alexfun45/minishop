import express from 'express';
import { requireAdmin } from '../middleware/adminAuth.ts';
import { productController } from '../controllers/productController.ts';
import { categoryController } from '../controllers/categoryController.ts';
import AuthRoute from './auth.ts'
const router = express.Router();

// Все роуты требуют админских прав
//router.use(requireAdmin)

router.use(AuthRoute);

// Продукты
router.get('/products', productController.getAllProducts);
router.get('/products/:catId', productController.getByCategory);
router.post('/products/create', productController.create);
router.put('/products/:id', productController.update);

router.get('/categories', categoryController.getCategories);
router.post('/categories/create', categoryController.create);
//router.delete('/products/:id', productController.delete);

export default router