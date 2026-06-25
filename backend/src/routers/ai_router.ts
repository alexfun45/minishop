import express from 'express'
import {AiService} from '../services/AiService.js'
import {aiController} from '../controllers/aiController.js'
import multer from 'multer';
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

export default aiRouter