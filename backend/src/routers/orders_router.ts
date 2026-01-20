import { Router } from 'express'
import {orderController} from '../controllers/orderController.ts'

const orderRouter = Router();

orderRouter.get('/orders', orderController.getAllOrders);
//categoryRouter.post('/categories/delete/:id', orderController.delete);
orderRouter.post('/orders/update/:id', orderController.update);

export default orderRouter;
