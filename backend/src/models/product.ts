import { DataTypes } from 'sequelize';
import sequelize from '../config/database.ts';

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

export const procuctService = {
  async addProduct(productObject: any): Promise<boolean> {
    await Product.create(productObject);
    return true;
  },

  // Получение всех товаров
  async getProducts(): Promise<IProduct[]> {
    const products = await Product.findAll();
    return products.map((product:any)=>({
      id: product.id,
      name_ru: product.name_ru,
      price: product.name_ru
    }));
  }
}