import { orderService } from "../services/OrderService.js";
import type { Request, Response } from 'express';

class StatsController {

  async getAdvancedStats(req: Request, res: Response){
    try{  
      const stats = await orderService.getAdvancedStats();
      res.json({
        success: true,
        data: stats
      });
    }catch(error){  
      console.error('Get all orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders',
      });
    }
  }
}

export const statsController = new StatsController();