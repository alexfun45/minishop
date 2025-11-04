// controllers/categoryController.ts
import type { Request, Response } from 'express';
import { CategoryService, categoryService } from '../services/CategoryService.ts';
import fs from 'fs';
import path from 'path';

class CategoryController {
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
    try {      
      const newData: any = {
        name_ru: req.body.name_ru,
        name_tj: req.body.name_tj,
        name_uz: req.body.name_uz,
        description_ru: req.body.description_ru,
        description_tj: req.body.description_tj,
        description_uz: req.body.description_uz,
        sort_order: parseInt(req.body.sort_order) || 0,
        is_active: req.body.is_active === 'true',
        //image_url: req.file ? `/uploads/categories/${req.file.filename}` : req.body.image_url || null
      };

      // Если загружено новое изображение
      if (req.file) {
        newData.image_url = `http://localhost:3001/uploads/categories/${req.file.filename}`;
        console.log('New image URL:', newData.image_url);
      } else if (req.body.image_url !== undefined) {
        // Если указан URL изображения (может быть пустой строкой)
        newData.image_url = req.body.image_url || null;
      }

      console.log('Creating category with data:', newData);
      const category = await categoryService.create(newData);
      
      console.log('Category created successfully:', category);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      console.error('Create category error:', error);
      if (req.file) {
        console.log('Deleting uploaded file due to error:', req.file.path);
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        error: 'Failed to create category',
      });
    }
  }

  public update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params?.id || '');
      console.log('Update category - id:', id);
      console.log('Update category - body:', req.body);
      console.log('Update category - file:', req.file);

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category ID'
        });
      }

      // Получаем текущую категорию чтобы удалить старое изображение если нужно
      const currentCategory = await categoryService.findById(id);
      console.log('Current category:', currentCategory);

      if (!currentCategory) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      const updateData: any = {
        name_ru: req.body.name_ru,
        name_tj: req.body.name_tj,
        name_uz: req.body.name_uz,
        description_ru: req.body.description_ru,
        description_tj: req.body.description_tj,
        description_uz: req.body.description_uz,
        sort_order: parseInt(req.body.sort_order) || 0,
        is_active: req.body.is_active === 'true',
      };

      // Если загружено новое изображение
      if (req.file) {
        updateData.image_url = `http://localhost:3001/uploads/categories/${req.file.filename}`;
        console.log('New image URL:', updateData.image_url);
        
        // Удаляем старое изображение если оно было и это локальный файл
        if (currentCategory.image_url && 
            !currentCategory.image_url.startsWith('http') &&
            currentCategory.image_url.startsWith('/uploads/')) {
          
          const oldImagePath = path.join(process.cwd(), currentCategory.image_url);
          console.log('Attempting to delete old image:', oldImagePath);
          
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('Old image deleted successfully');
          } else {
            console.log('Old image not found at path:', oldImagePath);
          }
        }
      } else if (req.body.image_url !== undefined) {
        // Если указан URL изображения (может быть пустой строкой)
        updateData.image_url = req.body.image_url || null;
      }
      // Если image_url не передан, оставляем текущее значение

      console.log('Updating category with data:', updateData);
      const category = await categoryService.update(id, updateData);

      //console.log('Category updated successfully:', category);
      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      console.error('Update category error:', error);
      
      // Если есть загруженный файл и произошла ошибка - удаляем его
      if (req.file) {
        console.log('Deleting uploaded file due to error:', req.file.path);
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to update category',
      });
    }
  }

  public delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params?.id || '');
      if(id){
        await categoryService.delete(id);
        res.json({
          success: true,
          data: id,
        });
      }
    } catch(error){
      res.status(500).json({
        success: false,
        error: 'Failed to delete category',
      });
    }
  }

  public static getCategoryProducts = async (req: Request, res: Response) => {
    // Ваша реализация
  };
}

export const categoryController = new CategoryController();