import {productService} from '../services/ProductService.ts'
import type { Request, Response } from 'express';


class ProductController{

  async getAllProducts(req: Request, res: Response){
    try{
      const products = await productService.findAll();
      res.json({
        success: true,
        data: products,
      });
    } catch(error){
      console.error('Get all products error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products',
      });
    }
  }

  // Получить все товары категории
  async getByCategory(req: Request, res: Response) {
    try {
      const categoryId = parseInt(req.params.catId || '');
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
      console.log('req.body', req.body);
      const newProduct: any = {
        name_ru: req.body.name_ru,
        name_tj: req.body.name_tj,
        name_uz: req.body.name_uz,
        description_ru: req.body.description_ru,
        description_tj: req.body.description_tj,
        description_uz: req.body.description_uz,
        price: req.body.price,
        old_price: req.body.old_price,
        category_id: req.body.category_id,
        weight: req.body.weight,
        ingredients_ru: req.body.ingredients_ru,
        ingredients_tj: req.body.ingredients_tj,
        ingredients_uz: req.body.ingredients_uz,
        available: req.body.is_active === 'true',
      }
      console.log('productData', newProduct);
      if (req.file) {
        newProduct.image_url = `http://localhost:3001/uploads/products/${req.file.filename}`;
        console.log('New image URL:', productData.image_url);
      } else if (req.body.image_url !== undefined) {
        // Если указан URL изображения (может быть пустой строкой)
        newProduct.image_url = req.body.image_url || null;
      }
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