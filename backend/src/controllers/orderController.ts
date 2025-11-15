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
    
  }

  async createOrder(req: Request, res: Response){
    try{
      await orderService.create(req.body);
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