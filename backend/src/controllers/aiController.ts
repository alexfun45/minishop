import type { Request, Response } from 'express';
import { AiService } from '../services/AiService.js';

class AiController{

  async getAiSettings(req: Request, res: Response){
    try{
      const settings = await AiService.getAiSettings();
      const docs = await AiService.getAiDocuments();
      if(settings){
        res.json({
          success: true,
          data: {
            settings,
            docs
          }
        })
      }
      else{
        res.json({
          success: true,
          data: []
        })
      }
    } catch(error){
      res.status(500).json({
        succuess: false,
        error: error
      })
    }
  }

  async saveAiSettings(req: Request, res: Response){
    try{
      const data = req.body;
      await AiService.saveAiSettigns(data);
      res.json({
        success: true,
        data: []
      })
    } catch(error){
      res.status(500).json({
        succuess: false,
        error: error
      })
    }
  }

  async saveDocument(req: Request, res: Response){
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
      }

      // Передаем файл в сервис. Сервис сразу вернет созданную в Postgres запись
      const aiDoc = await AiService.registerAndProcessDocument(req.file);

      // Моментально отвечаем фронтенду, чтобы админка показала статус "Загрузка..."
      return res.status(200).json({
        success: true,
        data: aiDoc
      });
    } catch (error) {
      console.error('Ошибка в aiController.saveDocument:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера при загрузке' });
    }
  }

  async deleteDocument(req: Request, res: Response) {
    try{
      const docId = req.params?.docId || null;
      console.log(`Удаляю документ ${docId}`);
      await AiService.deleteDocument(docId);
    } catch (error) {
      console.error('Ошибка в aiController.deleteDocument:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера при загрузке' });
    }
  }

}

export const aiController = new AiController();
