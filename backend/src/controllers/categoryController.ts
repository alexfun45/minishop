import { Request, Response } from 'express';
import {categoryService} from '../services/CategoryService.ts'

class categoryController{

  public static getCategories = async (req: Request, res: Response) => {
    try {
      const language = req.query.lang as string || 'ru';
      const categories = await categoryService.findAllActive(language);
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении категорий'
      });
    }
  };

  public static getCategoryProducts = async (req: Request, res: Response) => {
    
  };
}