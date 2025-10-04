// services/CategoryService.ts
import { Category, Product } from '../models/index.js';

export class CategoryService {
  // Получить локализованное имя
  getName(category: any, language: string = 'ru'): string {
    const fieldMap: Record<string, string> = {
      'ru': 'name_ru',
      'tj': 'name_tj',
      'uz': 'name_uz',
    };
    const fieldName = fieldMap[language] || 'name_ru';
    return category[fieldName] || category.name_ru;
  }

  // Получить локализованное описание
  getDescription(category: any, language: string = 'ru'): string {
    const fieldMap: Record<string, string> = {
      'ru': 'description_ru',
      'tj': 'description_tj',
      'uz': 'description_uz',
    };
    const fieldName = fieldMap[language] || 'description_ru';
    return category[fieldName] || category.description_ru || '';
  }

  // Получить все активные категории
  async findAllActive(language: string = 'ru') {
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name_ru', 'ASC']],
    });

    return categories.map(async (category: any) => ({
      id: category.id,
      name: this.getName(category, language),
      description: this.getDescription(category, language),
      image_url: category.image_url,
      product_count: await this.getProductCount(category.id),
    }));
  }

  // Получить количество товаров в категории
  async getProductCount(categoryId: number) {
    return await Product.count({
      where: {
        category_id: categoryId,
        available: true,
      },
    });
  }

  // Найти категорию по ID
  async findById(categoryId: number, language: string = 'ru') {
    const category = await Category.findByPk(categoryId);
    if (!category) return null;

    return {
      ...category.toJSON(),
      name: this.getName(category, language),
      description: this.getDescription(category, language),
    };
  }

  // Создать категорию
  async create(categoryData: any) {
    return await Category.create(categoryData);
  }

  // Обновить категорию
  async update(categoryId: number, categoryData: any) {
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    return await category.update(categoryData);
  }

  // Удалить категорию (мягкое удаление)
  async delete(categoryId: number) {
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    return await category.update({ is_active: false });
  }
}

export const categoryService = new CategoryService();