import { DataTypes, Model } from 'sequelize';
import type {Optional} from 'sequelize'
import sequelize from '../config/database.ts';

// Интерфейс для атрибутов категории
interface CategoryAttributes {
  id: number;
  name_ru: string;
  name_tj?: string;
  name_uz?: string;
  description_ru?: string;
  description_tj?: string;
  description_uz?: string;
  image_url?: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductCreationAttribute extends Optional<CategoryAttributes,
  'id' | 'name_ru' | 'name_tj' | 'name_uz' | 'description_ru' | 'description_tj' | 'description_uz' | 'image_url' | 'is_active' | 'createdAt' | 'updatedAt'>{};

  class Category extends Model<CategoryAttributes, ProductCreationAttribute> implements CategoryAttributes {
    declare id: number;
    declare name_ru: string;
    declare name_tj: string;
    declare name_uz: string;
    declare description_ru: string;
    declare description_tj: string;
    declare description_uz: string;
    declare image_url: string;
    declare is_active: boolean;
    declare createdAt: Date;
    declare updatedAt: Date;
  }

Category.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name_ru: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  name_tj: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  name_uz: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  description_ru: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  description_tj: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  description_uz: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  createdAt:{
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'categories',
  timestamps: true,
  underscored: true,
})

export {Category}
/*
export const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name_ru: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  name_tj: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  name_uz: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  description_ru: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  description_tj: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  description_uz: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
});
*/

// Отдельные функции для работы с моделью
/*export const categoryService = {
  // Получить локализованное имя
  getName(category: any, language: string = 'ru'): string {
    const fieldMap: Record<string, string> = {
      'ru': 'name_ru',
      'tj': 'name_tj', 
      'uz': 'name_uz'
    };
    const fieldName = fieldMap[language] || 'name_ru';
    return category[fieldName] || category.name_ru;
  },

  // Получить локализованное описание
  getDescription(category: any, language: string = 'ru'): string {
    const fieldMap: Record<string, string> = {
      'ru': 'description_ru',
      'tj': 'description_tj',
      'uz': 'description_uz'
    };
    const fieldName = fieldMap[language] || 'description_ru';
    return category[fieldName] || category.description_ru || '';
  },

  // Найти все активные категории
  async findAllActive(language: string = 'ru') {
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['name_ru', 'ASC']],
    });

 return categories.map((category: any) => ({
      id: category.id,
      name: this.getName(category, language),
      description: this.getDescription(category, language),
      image_url: category.image_url,
      is_active: category.is_active
    }));
  },

  async getCategoryProducts(categoryId: number, language = 'ru') {
    try {   
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return false;
      }
      
      const products = await Product.findAll({
        where: { category_id: categoryId, available: true },
        include: [{
          association: 'category',
          attributes: ['id', 'name_ru', 'name_tj', 'name_uz']
        }]
      });
      
      const result = products.map((product: any) => ({
        id: product.id,
        name: productService.getName(product, language),
        price: product.price,
        category: categoryService.getName(product.category, language)
      }));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
};
*/