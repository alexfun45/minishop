import express from 'express'
import productRouter from './products.ts'

const router = express.Router();

router.use('/products', productRouter);

export default router;
