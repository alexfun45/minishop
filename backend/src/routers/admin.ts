import express from 'express';
import productRouter from './products.js'
import categoryRouter from './category_router.js'
import orderRouter from './orders_router.js'
import activityRouter from './activity.js'
import Stats from './stats.js'
import AuthRoute from './auth.js'
import aiRouter from './ai_router.js'
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
router.use(activityRouter);
router.use(Stats);
router.use(aiRouter);
//router.get('/categories', categoryController.getCategories);
//router.post('/categories/create',  upload.single('image'), categoryController.create);
//router.post('/categories/update/:id', upload.single('image'), categoryController.update);
//router.delete('/products/:id', productController.delete);

export default router