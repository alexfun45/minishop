import express from 'express'
import cors from './middleware/cors.ts';
import { initializeDatabase } from './middleware/initDatabase.ts';
import routes from './routers/router.ts';
import adminRoutes from './routers/admin.ts'

const app = express();
app.use(cors);
app.use(express.json());
app.use('/api', routes);
app.use('/admin', adminRoutes);
app.use('/uploads', express.static('uploads'));
const PORT = process.env.PORT || 3001;
async function startApp() {
  // Инициализация БД перед запуском сервера
  await initializeDatabase();
    
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startApp().catch(console.error);