import { orderService } from "../services/OrderService.ts";
import type { Request, Response } from 'express';
import LogEvent from '../utils/LogEvents.ts'

class OrderController {

  async getAllOrders(req: Request, res: Response){
    try{  
      const orders = await orderService.getOrders();
      res.json({
        success: true,
        data: orders
      });
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

  async update(req: Request, res: Response){
    try{
      const id = parseInt(req.params?.id || '');
      console.log('Update category - id:', id);
      console.log('Update category - body:', req.body);
      LogEvent('update order', id.toString());
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
      }
      const currentCategory = await orderService.findById(id);
      console.log('req.body', req.body);
      const updatedStatus = req.body.status;
      const Order = await orderService.updateStatus(id, updatedStatus);

      res.json({
        success: true,
        data: Order,
      });
    } catch(error){
      console.error('update order error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update order',
      });
    }
  }

  async createOrder(req: Request, res: Response){
    try{
      const data = await orderService.create(req.body);
      if(data)
        LogEvent('create new order', data.id.toString());
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