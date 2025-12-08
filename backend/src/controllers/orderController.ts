import { orderService } from "../services/OrderService.ts";
import type { Request, Response } from 'express';

class OrderController {

  async getAllOrders(req: Request, res: Response){
    try{  
      const orders = orderService.getOrders();
    }catch(error){  
      console.error('Get all orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders',
      });
    }
  }

  async getUserOrders(req: Request, res: Response){
    try{
      const userId = parseInt(req.params?.userId || '');
      const orders = await orderService.findByUserId(userId);
      console.log('orders', orders);
      res.json({
        success: true,
        data: orders,
      });
    } catch(error){
      console.error('Getting user orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to getting user orders',
      });
    }
  }

  async createOrder(req: Request, res: Response){
    try{
      console.log('create order', req.body);
      const data = await orderService.create(req.body);
      res.json({
        success: true,
        data: data,
      });
    } catch(error){
      console.error('save order error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save order',
      });
    }
  }

}

export const orderController = new OrderController();