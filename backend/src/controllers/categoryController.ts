import type { Request, Response } from 'express';
import {categoryService} from '../services/CategoryService.ts'

class CategoryController{

  public getCategories = async (req: Request, res: Response) => {
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

  public create = async (req: Request, res: Response) => {
    try{
      const catData = req.body;
      const category = await categoryService.create(catData);

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch(error){
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create product',
      });
    }
  }

  public static getCategoryProducts = async (req: Request, res: Response) => {
    
  };
}

export const categoryController = new CategoryController();