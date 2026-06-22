import type { Request, Response } from 'express';
import { AiService } from '../services/AiService.js';

class AiController{

  async getAiSettings(req: Request, res: Response){
    try{
      const settings = await AiService.getAiSettings();
      if(settings){
        res.json({
          success: true,
          data: settings
        })
      }
      else{
        res.json({
          success: true,
          data: []
        })
      }
    } catch(error){
      res.status(500).json({
        succuess: false,
        error: error
      })
    }
  }

  async saveAiSettings(req: Request, res: Response){
    try{
      
    } catch(error){
      res.status(500).json({
        succuess: false,
        error: error
      })
    }
  }

}

export const aiController = new AiController();
