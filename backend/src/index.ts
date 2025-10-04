import express from 'express'
import cors from './middleware/cors.ts';
import { initializeDatabase } from './middleware/initDatabase.ts';
import routes from './routers/router.ts';
import {Request, Response, NextFunction} from 'express'

const app = express();
app.use(cors);
app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 3001;
async function startApp() {
  // Инициализация БД перед запуском сервера
  await initializeDatabase();
    
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startApp().catch(console.error);