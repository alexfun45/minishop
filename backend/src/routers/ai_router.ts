import express from 'express'
import {AiService} from '../services/AiService.js'
import {aiController} from '../controllers/aiController.js'
import { Sequelize } from 'sequelize';
import { AiChatLogs } from '../models/index.js';
import multer from 'multer';
import type { Request, Response } from 'express';
import path from 'path';

const aiService = new AiService();
const aiRouter = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/temp',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Достаем расширение оригинального файла (например, .jpg)
    const ext = path.extname(file.originalname); 
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });
const upload_documents = multer({ 
  dest: 'uploads/documents',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Поддерживаются только файлы формата PDF!'));
    }
  }
});

aiRouter.post('/ai/generate-banner', upload.single('image'), (req, res) => {
  aiService.generateCard(req, res)
})

aiRouter.post('/ai/fill-product', async (req, res) => {
  try {
    const { prompt } = req.body;
    const fields = await aiService.fillProductFields(prompt);
    res.json({ success: true, data: fields });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка генерации полей' });
  }
});

aiRouter.post('/ai/generate-description', async (req, res) => {
  try{
    const { name, ingredients } = req.body;
    const description = await aiService.genDescription(name, ingredients);
    res.json({ success: true, data: description });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка генерации' });
  }
});

aiRouter.get('/ai/ai-settings', aiController.getAiSettings);

aiRouter.post('/ai/save-ai-settings', aiController.saveAiSettings);

aiRouter.post('/ai/documents', upload_documents.single('file'), aiController.saveDocument);

aiRouter.get(`/ai/documents/:docId`, aiController.deleteDocument);

aiRouter.get('/ai/sessions', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const sessions = await AiChatLogs.findAll({
      attributes: [
        'user_id',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalMessages'],
        [Sequelize.fn('MAX', Sequelize.col('created_at')), 'lastActivity'],
      ],
      group: ['user_id'],
      order: [[Sequelize.col('lastActivity'), 'DESC']],
      limit,
      offset,
      raw: true,
    });

    return res.json({ success: true, data: sessions });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Ошибка получения списка сессий 1' });
  }
});

aiRouter.get('/ai/history/:userId', async (req: Request, res: Response) => {
  try {
    const user_id = req.params?.userId || '0';

    const messages = await AiChatLogs.findAll({
      where: { user_id },
      order: [['created_at', 'ASC']],
    });

    return res.json({ success: true, data: messages });
  } catch (error: any) {
    console.error('[Admin AI History Error]:', error);
    return res.status(500).json({ success: false, error: 'Ошибка получения истории диалога' });
  }
});

export default aiRouter