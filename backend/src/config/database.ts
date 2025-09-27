import { Sequelize } from 'sequelize'
//import 'dotenv/config'
import { config } from 'dotenv';
config(); // Явно вызываем конфигурацию
const sequelize = new Sequelize(process.env.DATABASE_URL || '', {
  dialect: 'postgres',
  logging: false, // чтобы видеть sql запросы,

  dialectOptions: {
    client_encoding: 'utf8'
  }
});

export default sequelize;