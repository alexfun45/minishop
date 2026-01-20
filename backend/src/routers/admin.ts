import express from 'express';
import { requireAdmin } from '../middleware/adminAuth.ts';
import { productController } from '../controllers/productController.ts';
import { categoryController } from '../controllers/categoryController.ts';
import productRouter from './products.ts'
import categoryRouter from './category_router.ts'
import orderRouter from './orders_router.ts'
//import LogEvents from './LogEvents.ts'
import { upload } from '../middleware/upload.ts';
import AuthRoute from './auth.ts'
const router = express.Router();

// Все роуты требуют админских прав
//router.use(requireAdmin)

router.use(AuthRoute);
// Продукты
/*router.get('/products', productController.getAllProducts);
router.get('/products/:catId', productController.getByCategory);
router.post('/products/create', productController.create);
router.get('/product/:id', productController.getById);
router.post('/product/update/:id', productController.update);
*/
router.use(productRouter);
router.use(categoryRouter);
router.use(orderRouter);

//router.get('/categories', categoryController.getCategories);
//router.post('/categories/create',  upload.single('image'), categoryController.create);
//router.post('/categories/update/:id', upload.single('image'), categoryController.update);
//router.delete('/products/:id', productController.delete);

export default router