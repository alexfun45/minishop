import { Sequelize } from 'sequelize'
//import 'dotenv/config'
import { config } from 'dotenv';
config(); // Явно вызываем конфигурацию
const dbUrl = process.env.DATABASE_URL || '';
/*const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false, // чтобы видеть sql запросы,

  dialectOptions: {
    client_encoding: 'utf8'
  }
});*/
const sequelize = new Sequelize(
  'shop',           // database
  'alexfun',        // username
  'a5n6b9',         // password
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false, // для отладки
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Кодировка устанавливается через параметр подключения
    dialectOptions: {
      client_encoding: 'utf8'
    }
  }
);

export default sequelize;