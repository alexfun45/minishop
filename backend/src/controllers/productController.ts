import {productService} from '../services/ProductService.ts'
import { Request, Response } from 'express';


class ProductController{

  // Получить все товары категории
  async getByCategory(req: Request, res: Response) {
    try {
      const categoryId = parseInt(req.params.categoryId || '');
      const language = (req.query.lang as string) || 'ru';

      const products = await productService.findByCategory(categoryId, language);

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error('Get products by category error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products',
      });
    }
  }

  // Получить товар по ID
  async getById(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params?.id || '');
      const language = (req.query.lang as string) || 'ru';

      const product = await productService.findById(productId, language);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product',
      });
    }
  }

   // Поиск товаров
   async search(req: Request, res: Response) {
    try {
      const query = req.query.q as string;
      const language = (req.query.lang as string) || 'ru';

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
      }

      const products = await productService.search(query, language);

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({
        success: false,
        error: 'Search failed',
      });
    }
  }

  // Создать товар
  async create(req: Request, res: Response) {
    try {
      const productData = req.body;

      const product = await productService.create(productData);

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create product',
      });
    }
  }

  // Обновить товар
  async update(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params?.id || '');
      const productData = req.body;

      const product = await productService.update(productId, productData);

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update product',
      });
    }
  }
  

}

export const productController = new ProductController();