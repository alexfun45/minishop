import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface ProductAttribute{
  id: number;
  name_ru: string | null;
  name_tj: string | null;
  name_uz: string | null;
  description_ru: string | null;
  description_tj: string | null;
  description_uz: string | null;
  price: number;
  available: boolean;
  image_url: string;
  category_id: number;
}

interface ProductCreationAttribute extends Optional<ProductAttribute,
 'id' | 'name_ru' | 'name_tj' | 'name_uz' | 'description_ru' | 'description_tj' | 'description_uz' | 'price' | 'available' | 'image_url'> {}

class Product extends Model<ProductAttribute, ProductCreationAttribute> implements ProductAttribute {
  declare id: number;
  declare name_ru: string;
  declare name_tj: string;
  declare name_uz: string;
  declare description_ru: string;
  declare description_tj: string;
  declare description_uz: string;
  declare price: number;
  declare available: boolean;
  declare image_url: string;
  declare category_id: number;
}

Product.init({
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
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description_tj: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description_uz: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  sequelize,
  tableName: 'products',
  timestamps: true,
  underscored: true,
})

export { Product }

/*
interface IProduct{
  id: number;
  name_ru: string;
  price: number;
}

export const Product = sequelize.define('Product', {
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
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description_tj: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description_uz: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
});

export const productService = {

  async addProduct(productObject: any): Promise<boolean> {
    await Product.create(productObject);
    return true;
  },

  getName(product: any, language: string = 'ru'): string {
    const fieldMap: Record<string, string> = {
      'ru': 'name_ru',
      'tj': 'name_tj',
      'uz': 'name_uz'
    };
    const fieldName = fieldMap[language] || 'name_ru';
    return product[fieldName] || product.name_ru;
  },

  getDescription(product: any, language: string = 'ru'): string {
    const fieldMap: Record<string, string> = {
      'ru': 'description_ru',
      'tj': 'description_tj',
      'uz': 'description_uz'
    };
    const fieldName = fieldMap[language] || 'description_ru';
    return product[fieldName] || product.description_ru || '';
  },

  // Получение всех товаров
  async getProducts(): Promise<IProduct[]> {
    const products = await Product.findAll();
    return products.map((product:any)=>({
      id: product.id,
      name_ru: product.name_ru,
      price: product.name_ru
    }));
  },

  async findByCategory(categoryId: number, language: string = 'ru') {
    const products = await Product.findAll({
      where: { 
        category_id: categoryId,
        available: true 
      },
      order: [['name_ru', 'ASC']],
    });

    return products.map((product: any) => ({
      id: product.id,
      name: this.getName(product, language),
      description: this.getDescription(product, language),
      price: product.price,
      image_url: product.image_url
    }));
  },

  async getProductById(productId: number, language = 'ru') {
    const nameField = `name_${language}`;
    const descField = `description_${language}`;
    
    const product = await Product.findByPk(productId, {
      attributes: [
        'id',
        [sequelize.col(nameField), 'name'],
        [sequelize.col(descField), 'description'],
        'price',
        'image_url',
        'available'
      ]
    });
    
    return product;
  }
}
*/