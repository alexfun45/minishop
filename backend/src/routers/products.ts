import { Router } from 'express'
import {productController} from '../controllers/productController.js'
import { uploadProduct } from '../middleware/uploadProduct.js';

const productRouter = Router();

//productRouter.get('/category/:categoryId', productController.getByCategory);
productRouter.get('/products', productController.getAllProducts);
productRouter.get('/products/:catId', productController.getByCategory);
productRouter.post('/products/create',uploadProduct.single('image'), (res, req) => { productController.create(res, req) });
productRouter.get('/product/:id', productController.getById);
productRouter.post('/product/update/:id', uploadProduct.single('image'), (res, req) => { productController.update(res, req) } );
productRouter.post('/product/delete/:id', productController.delete);
/*productRouter.get("/", async (request, response) => {
  const products = await productController.getProducts();
  response.json({data: products});
});
*/

export default productRouter