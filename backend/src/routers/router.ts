import express from 'express'
import productRouter from './products.ts'
import path from 'path';
import { fileURLToPath } from 'url';

// Эмуляция __dirname для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

//router.use('/uploads', express.static('uploads'));
//router.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//router.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
console.log('router', path.join(process.cwd(), 'uploads'));
router.use('/products', productRouter);

export default router;
