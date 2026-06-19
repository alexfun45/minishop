import sequelize from '../config/database.js';
import { Product, Category, User } from '../models/index.js'
import { createHmac } from 'node:crypto';
import { config } from 'dotenv';
config(); // Явно вызываем конфигурацию

export async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    const mode = process.env.NODE_ENV || process.env.MODE || 'production';
    const trimmedMode = mode.trim().toLowerCase();
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 MODE:', process.env.MODE);
    const syncOptions = {
      force: false,//trimmedMode === 'dev' || trimmedMode === 'development',
      alter: trimmedMode === 'dev' || trimmedMode === 'development'
    };
    console.log('🔍 Sync options:', syncOptions);
    await sequelize.query("SET client_encoding = 'UTF8'");
    await sequelize.sync(syncOptions);
    console.log('✅ Database synchronized');
    if(trimmedMode === 'dev' || trimmedMode === 'development'){
      await seedInitialData(); 
    }
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Функция для заполнения начальных данных
async function seedInitialData() {
  console.log('initial database...');
  try {
    //const { Category, Product } = await import('./models/index.js');
    //const { Product } = await import('../models/index.ts');
    // Проверяем, есть ли уже данные
    const categoryCount = await Category.count();
    if (categoryCount === 0) {
      // Создаем тестовые категории
      const bakeryCategory = await Category.create({
        name_ru: 'Выпечка',
        name_tj: 'Хобизӣ',
        name_uz: 'Nonvoylik',
        is_active: true
      });
    };
    const secret = 'gfrvwf23f';
    const passHash = createHmac('sha256', secret)
    .update('admin465')
    .digest('hex');
    console.log('create user...');
    /*const user = await User.create({
        username: 'admin',
        user_id: 1,
        role: 'admin',
        password: passHash
      });
      console.log('create user', user);*/
      
      // Создаем тестовые товары
      /*await Product.create({
        name_ru: 'White bread',
        name_tj: 'Нони сафед',
        name_uz: 'Oq non',
        price: 50.00,
        category_id: 1,
        available: true
      });
      await Product.create({
        name_ru: 'Black bread',
        name_tj: 'Ноки сафед',
        name_uz: 'Oq now',
        price: 55.00,
        category_id: 1,
        available: true
      });
      */
      console.log('✅ Initial data seeded successfully.');
    //}
  } catch (error) {
    console.error('❌ Seeding initial data failed:', error);
  }
}