import { Router } from 'express'
import {productController} from '../controllers/productController.ts'
import { uploadProduct } from '../middleware/uploadProduct.ts';

const productRouter = Router();

//productRouter.get('/category/:categoryId', productController.getByCategory);
productRouter.get('/products', productController.getAllProducts);
productRouter.get('/products/:catId', productController.getByCategory);
productRouter.post('/products/create',uploadProduct.single('image'), productController.create);
productRouter.get('/product/:id', productController.getById);
productRouter.post('/product/update/:id', uploadProduct.single('image'), productController.update);
/*productRouter.get("/", async (request, response) => {
  const products = await productController.getProducts();
  response.json({data: products});
});
*/

export default productRouter