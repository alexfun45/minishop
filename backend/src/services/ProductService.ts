// services/ProductService.ts
import { Product, Category } from '../models/index.ts';
import {categoryService} from './CategoryService.ts'
import { Op } from 'sequelize';

export class ProductService {
  // Получить локализованное имя
  getName(product: any, language: string = 'ru'): string {
    const fieldMap: Record<string, string> = {
      'ru': 'name_ru',
      'tj': 'name_tj',
      'uz': 'name_uz',
    };
    const fieldName = fieldMap[language] || 'name_ru';
    return product[fieldName] || product.name_ru;
  }

  // Получить локализованное описание
  getDescription(product: any, language: string = 'ru'): string {
    const fieldMap: Record<string, string> = {
      'ru': 'description_ru',
      'tj': 'description_tj',
      'uz': 'description_uz',
    };
    const fieldName = fieldMap[language] || 'description_ru';
    return product[fieldName] || product.description_ru || '';
  }

  async findAll(){
    const products = await Product.findAll();
    return products;
  }

  // Получить товары по категории
  async findByCategory(categoryId: number, language: string = 'ru') {
    //const products = await Product.findAll();
    const products = await Product.findAll({
      where: {
        category_id: categoryId,
        available: true,
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name_ru', 'name_tj', 'name_uz'],
      }],
      order: [['name_ru', 'ASC']],
    });
    console.log('products', products);
    return products;

    return products.map((product: any) => ({
      id: product.id,
      name: this.getName(product, language),
      description: this.getDescription(product, language),
      price: product.price,
      //old_price: product.old_price,
      image_url: product.image_url,
      //weight: product.weight,
      category: product.category ? {
        id: product.category.id,
        name: categoryService.getName(product.category, language),
      } : null,
    }));
  }

  // Найти товар по ID
  async findById(productId: number, language: string = 'ru') {
    const product = await Product.findByPk(productId, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name_ru', 'name_tj', 'name_uz'],
      }],
    });

    if (!product) return null;

    return {
      ...product.toJSON(),
      name: this.getName(product, language),
      description: this.getDescription(product, language),
      category: product.category_id ? {
        id: product.category_id,
        name: categoryService.getName(product.category_id, language),
      } : null,
    };
  }

  // Поиск товаров
  async search(query: string, language: string = 'ru') {
    const products = await Product.findAll({
      where: {
        available: true,
        [Op.or]: [
          { name_ru: { [Op.iLike]: `%${query}%` } },
          { name_tj: { [Op.iLike]: `%${query}%` } },
          { name_uz: { [Op.iLike]: `%${query}%` } },
          { description_ru: { [Op.iLike]: `%${query}%` } },
        ],
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name_ru', 'name_tj', 'name_uz'],
      }],
      limit: 50,
    });

    return products.map((product: any) => ({
      id: product.id,
      name: this.getName(product, language),
      description: this.getDescription(product, language),
      price: product.price,
      image_url: product.image_url,
      category: product.category ? {
        id: product.category.id,
        name: categoryService.getName(product.category, language),
      } : null,
    }));
  }

  // Создать товар
  async create(productData: any) {
    return await Product.create(productData);
  }

  // Обновить товар
  async update(productId: number, productData: any) {
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await product.update(productData);
  }

  // Удалить товар
  async delete(productId: number) {
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await product.update({ available: false });
  }
}

export const productService = new ProductService();