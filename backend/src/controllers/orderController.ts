import { orderService } from "../services/OrderService.js";
import type { Request, Response } from 'express';
import LogEvent from '../utils/LogEvents.js'
import {checkout} from '../api/YKassaPayment.js'

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

  async getBasicStats(req: Request, res: Response) {
    try{
      const stats = await orderService.getBasicStats();
      res.json({
        success: true,
        data: stats
      })
    } catch(error){
      res.status(500).json({
        success: false,
        error: 'Failed to fetch current orders info',
      });
    }
  }

  async getOrder(req: Request, res: Response){

    try{
      const orderId = parseInt(req.params?.orderId || '');
      //console.log('получаю заказ', orderId);
      const order = await orderService.findById(orderId);
      console.log('получен', order);
      res.json({
        success: true,
        data: order,
      });
    } catch(error){
      console.error('Getting user orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to getting user orders',
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
      LogEvent('update order', id.toString());
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
      }
      const currentCategory = await orderService.findById(id);
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
      let newOrder = {...req.body};
      if(newOrder.payment_method == 'online'){
        newOrder.status = 'pending_payment';
      }
      const order = await orderService.create(newOrder);
      if(order)
        LogEvent('create new order', order.id.toString());
      console.log('order', order);
      if(order && order.payment_method == 'online'){
        const payment: any = await checkout(order, order.id);
        await orderService.update(order.id, "payment_url", payment.confirmation.confirmation_url);
        return res.status(201).json({
          success: true,
          data: {
            id: order.id,
            payment_url: payment.confirmation.confirmation_url
          }
        });
      } else{
      res.json({
        success: true,
        data: order,
      });
    }
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