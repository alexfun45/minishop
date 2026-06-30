import {productService} from '../services/ProductService.js'
import type { Request, Response } from 'express';
import { fileURLToPath } from 'url';
import LogEvent from '../utils/LogEvents.js'
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';
import { AiService } from '../services/AiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  async getActiveByCategory(req: Request, res: Response) {

    try {
      const categoryId = parseInt(req.params.catId || '');
      const language = (req.query.lang as string) || 'ru';

      const products = await productService.findByCategory(categoryId, language, true);

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      //console.error('Get products by category error:', error);
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
      //console.error('Get products by category error:', error);
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
      //const query = req.query.q as string;
      const query = req.params?.q || '';
      const language = (req.query.lang as string) || 'ru';

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
      }

      const products = await productService.search(query.toLowerCase(), language);

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

  async save_imagefile(file: any){
        const fileBuffer = file.buffer;
        //const tempFilePath = file.path; // Путь к временному файлу, который сохранил multer
        
        // Имя для нового оптимизированного файла
        const targetFilename = `prod-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const targetDir = path.join(process.cwd(), 'uploads', 'products');
        const finalOutputPath = path.join(targetDir, targetFilename);
        
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        try {
          // 1. Получаем метаданные изображения для валидации размеров
          const metadata = await sharp(fileBuffer).metadata();
          
          const minWidth = 600;
          const minHeight = 600;
  
          if (!metadata.width || !metadata.height || metadata.width < minWidth || metadata.height < minHeight) {
            // Если картинка слишком маленькая, удаляем временный файл и возвращаем ошибку
            //fs.unlinkSync(tempFilePath);
            console.log('Изображение слишком маленькое');
            throw `Изображение слишком маленькое. Минимальное разрешение: ${minWidth}x${minHeight}px.`;
            /*return res.status(400).json({
              success: false,
              error: `Изображение слишком маленькое. Минимальное разрешение: ${minWidth}x${minHeight}px.`
            });*/
          }
  
          // 2. Обрезаем картинку по центру (умный кроп), ресайзим до 800x800 и переводим в webp
          await sharp(fileBuffer)
            .resize(800, 800, {
              fit: 'cover',        // Заполнить квадрат 800x800, излишки обрезать
              position: 'center'   // Центрировать обрезку
            })
            .webp({ quality: 80 }) // Конвертируем в WebP с качеством 80% (визуально неотличимо от 100%)
            .toFile(finalOutputPath);
            console.log('targetFilename', targetFilename);
            return targetFilename;
          } catch(error){
            //if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            throw error;
          }
  }

  // Создать товар
  async create(req: Request, res: Response) {
    try {
      const productData = req.body;
      const newProduct: any = {
        name_ru: req.body.name_ru,
        name_tj: req.body.name_tj,
        name_uz: req.body.name_uz,
        description_ru: req.body.description_ru,
        description_tj: req.body.description_tj,
        description_uz: req.body.description_uz,
        price: parseInt(req.body.price),
        old_price: req.body.old_price,
        category_id: parseInt(req.body.category_id),
        weight: parseInt(req.body.weight),
        ingredients_ru: req.body.ingredients_ru,
        ingredients_tj: req.body.ingredients_tj,
        ingredients_uz: req.body.ingredients_uz,
        available: req.body.is_active === 'true',
      }
     
      if (req.file) {
        try {
          const targetFilename = await this.save_imagefile(req.file);
          // Сохраняем путь к уже обработанному webp-файлу
          newProduct.image_url = `${process.env.SAVEDIR_PATH}/uploads/products/${targetFilename}`;
  
        } catch (error) {
          throw error;
        }
  
      } else if (req.body.image_url !== undefined) {
        newProduct.image_url = req.body.image_url || null;
      }
      const product = await productService.create(newProduct); 
      await AiService.indexProduct(product).catch(err => {
        console.error("Фоновая индексация ИИ дала сбой:", err);
     });
      LogEvent('create new product', product.id.toString());
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

  // Удалить товар
  async delete(req: Request, res: Response) {
    try{
      const productId = parseInt(req.params?.id || '');
      LogEvent('delete product', productId.toString());
      if(productId){
        await productService.delete(productId);
        await AiService.deleteProduct(productId);
        res.json({
          success: true,
          data: productId,
        });
      }
    } catch(error){
      console.error('Delete product error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete product',
      });
    }
  }

  // Обновить товар
  async update(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params?.id || '');
      const productData = req.body;
      if (req.file) {
        const targetFilename = await this.save_imagefile(req.file);
        productData.image_url = `${process.env.SAVEDIR_PATH}/uploads/products/${targetFilename}`;
        //productData.image_url = `${process.env.BASE_PATH}/uploads/products/${req.file.filename}`;
      } else if (req.body.image_url !== undefined) {
        // Если указан URL изображения (может быть пустой строкой)
        productData.image_url = req.body.image_url || null;
      }
      const product = await productService.update(productId, productData);
      await AiService.indexProduct(product).catch(err => {
        console.error("Фоновая индексация ИИ дала сбой:", err);
     });
      LogEvent('update product', productId.toString());
      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        error: error,
      });
    }
  }
  

}

export const productController = new ProductController();