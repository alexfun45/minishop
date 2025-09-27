import { Sequelize } from 'sequelize';
//import 'dotenv/config'
import { config } from 'dotenv';
config(); // Явно вызываем конфигурацию
const sequelize = new Sequelize(process.env.DATABASE_URL || '', {
    dialect: 'postgres',
    logging: false // чтобы видеть sql запросы
});
export default sequelize;
//# sourceMappingURL=database.js.map