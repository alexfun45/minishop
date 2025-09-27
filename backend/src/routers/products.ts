import { Router } from 'express'
import productController from '../controllers/productController.ts'

const productRouter = Router();

productRouter.get("/", async (request, response) => {
  const products = await productController.getProducts();
  response.json({data: products});
});

export default productRouter