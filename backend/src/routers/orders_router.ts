import { Router } from 'express'
import {orderController} from '../controllers/orderController.js'

const orderRouter = Router();

orderRouter.get('/orders', orderController.getAllOrders);
orderRouter.get('/get_basic_stats', orderController.getBasicStats);
//categoryRouter.post('/categories/delete/:id', orderController.delete);

orderRouter.put('/order/update/:id', orderController.update);
orderRouter.get('/orders/:orderId', orderController.getOrder);
orderRouter.get('/order/delete/:id', orderController.delete);

export default orderRouter;
