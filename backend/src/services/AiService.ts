// services/aiService.ts
import * as lancedb from "@lancedb/lancedb";
import type { Request, Response } from 'express';
import { YandexGPTEmbeddings } from "@langchain/yandex";
import redis from './RedisService.js'
import path from "path";
import fs from "fs"
import {productService} from '../services/ProductService.js'
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import type {UserSession} from '../types/Common.js'
import { YandexGPT } from "@langchain/yandex/llms";
import { z } from "zod";
import { PromptTemplate } from '@langchain/core/prompts';
import multer from 'multer';
import { removeBackground } from '@imgly/background-removal-node';
import axios from 'axios';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AITUNNEL_API_KEY,
  baseURL: "https://api.aitunnel.ru/v1/",
});

if (!process.env.YC_API_KEY || !process.env.YC_FOLDER_ID) {
  throw new Error("Missing Yandex API configuration in environment variables");
}

const responseSchema = z.object({
  intent: z.enum(["search", "add_to_cart", "confirm", "cancel", "greeting", "view_cart"])
    .describe("Классификация намерения..."),
  productId: z.string().nullable().optional()
    .describe("Артикул товара из прайса (только цифры/ID) или null, если не применимо"),
  quantity: z.number().nullable().optional().default(1)
    .describe("Количество товара, которое упомянул пользователь или null, если не применимо"),
  text: z.string()
    .describe("Твой вежливый ответ пользователю на русском языке")
});

// 1. Создаем парсер на основе твоей Zod-схемы
const parser = StructuredOutputParser.fromZodSchema(responseSchema);

const model = new YandexGPT({
  model: "yandexgpt-lite",
  temperature: 0.2
});

const template = PromptTemplate.fromTemplate(`
Вы — умный ИИ-продавец в чате интернет-магазина. 
Ваша задача — внимательно изучить товары в Контексте и ответить на вопрос пользователя.

КРИТИЧЕСКИЕ ПРАВИЛА:
1. Если пользователь ищет продукт с отрицанием или определенным свойством (например: "без сахара", "без лактозы", "постный"), вы обязаны проверить как состав (ингредиенты), так и строку "Особенности".
2. Если в поле "Особенности" ЯВНО написано "без сахара", этот товар ИДЕАЛЬНО подходит под запрос "без сахара". Внимательно посмотри на товар "Улитка слоеная сырная" — у неё в Особенностях это написано!
3. Если пользователь указывает условие цены, то ищи соответствие в строчке цена
4. Ответ оборачивайте строго в формат JSON, указанный ниже.

Если подходящего товара нет, можешь предложить наиболее близкий аналог но только из существующих позиций в контексте, указав что по данным критериям среди текущих позиций ты найти не смог, но можешь предложить наиболее подходящий вариант. 
Если похожих аналогов нет, то скажи что по заданному запросу ничего не можешь найти.
Если пользователь подтверждает добавление товара, но не называет артикул заново, используй артикул из предыдущего сообщения AI в истории диалога и овтеть что товар добавлен в корзину

Контекст Прайса: {context}

История последних сообщений:
{chat_history}

Текущий запрос пользователя: {question}

{format_instructions}
`);

const embeddings = new YandexGPTEmbeddings({
  apiKey: process.env.YC_API_KEY, 
  folderID: process.env.YC_FOLDER_ID,
  model: "text-search-doc",
});

const DB_PATH = path.join(process.cwd(), "data", "lancedb");
const TABLE_NAME = "products_vectors";

export class AiService {
  private static dbInstance: lancedb.Connection | null = null;

  // Подключение к БД (Singleton)
  private static async getDb() {
    if (!this.dbInstance) {
      // Создаем папку, если её нет
      if (!fs.existsSync(DB_PATH)) {
        fs.mkdirSync(DB_PATH, { recursive: true });
      }
      this.dbInstance = await lancedb.connect(DB_PATH);
    }
    return this.dbInstance;
  }

  /**
   * Шаг А: Создаем понятный для ИИ текстовый текст из всех полей товара.
   * Важно объединить языки, чтобы ассистент понимал запросы на любом из них.
   */
  private static createProductContext(product: any): string {
    return `
      артикул: ${product.id}
      Название (RU): ${product.name_ru || ''}
      Описание: ${product.description_ru || ''}
      Ингредиенты: ${product.ingredients_ru || ''}
      Цена: ${product.price} руб
      Категория ID: ${product.category_id}
    `.trim().replace(/\s+/g, ' '); // убираем лишние пробелы
  }


  public static async indexProduct(product: any) {
    try {
      const db = await this.getDb();
      const contextText = this.createProductContext(product);
      //const vector = await this.generateEmbedding(contextText);
      const vectors = await embeddings.embedDocuments([contextText]);
      const vector = vectors[0];

      const record = {
        id: product.id.toString(), // LanceDB любит строковые ID
        vector: vector,
        text: contextText,
        productId: product.id,
        price: product.price,
        image_url: product.image_url || ""
      };

      // Проверяем, существует ли таблица
      const tableNames = await db.tableNames();
      
      if (!tableNames.includes(TABLE_NAME)) {
        // Если таблицы нет — создаем её с первой записью
        await db.createTable(TABLE_NAME, [record]);
        console.log(`[LanceDB] Таблица ${TABLE_NAME} успешно создана.`);
      } else {
        // Если таблица есть — открываем её
        const table = await db.openTable(TABLE_NAME);
        
        // Чтобы избежать дубликатов при обновлении товара, используем merge (upsert)
        // Если id совпадет — запись обновится, если нет — добавится новая
        await table.mergeInsert("id") // сравниваем приходящие записи по полю "id"
        .whenMatchedUpdateAll()     // если id уже есть — полностью обновляем поля записи
        .whenNotMatchedInsertAll()  // если id нет — создаем новую строчку
        .execute([record]);
        console.log(`[LanceDB] Товар ID ${product.id} успешно проиндексирован.`);
      }
    } catch (error) {
      console.error(`[LanceDB] Ошибка индексации товара ${product.id}:`, error);
    }
  }

  /**
   * Шаг Г: Удаление товара из векторной базы (если товар удалили из админки)
   */
  public static async deleteProduct(productId: number) {
    try {
      const db = await this.getDb();
      const tableNames = await db.tableNames();
      
      if (tableNames.includes(TABLE_NAME)) {
        const table = await db.openTable(TABLE_NAME);
        await table.delete(`id = "${productId}"`);
        console.log(`[LanceDB] Товар ID ${productId} удален из векторной базы.`);
      }
    } catch (error) {
      console.error(`[LanceDB] Ошибка удаления товара ${productId}:`, error);
    }
  }

  public static async searchProducts(query: string, limit: number = 3) {
    try {
      const db = await this.getDb();
      const tableNames = await db.tableNames();
      
      if (!tableNames.includes(TABLE_NAME)) return [];

      // Для поиска используем embedQuery — он принимает чистую строку
      const queryVector = await embeddings.embedQuery(query);

      const table = await db.openTable(TABLE_NAME);
      const results = await table
        .search(queryVector)
        .limit(limit)
        .toArray();

      return results;
    } catch (error) {
      console.error("[LanceDB] Ошибка поиска:", error);
      return [];
    }
  }

  getChatHistoryString(userSession: UserSession){
    if (!userSession) return "История пуста.";
    // Берем последние 6 реплик, чтобы не раздувать контекст
    return userSession.chat.slice(-6).join("\n");
  };


  handleUserMessage = async (req: Request, res: Response) => {
    const postdata = req.body;

    const userId = postdata.userId;
    const userQuery = postdata.message;
    // (Логика сессий Redis остается без изменений)
    const sessionData = await redis.get(`session:${userId}`);
    const session = sessionData ? JSON.parse(sessionData) : { cart: [], chat: [], pendingItem: null, lastViewedProductId: null };
    
    const context = await AiService.searchProducts(userQuery);
    console.log('search', context);

    const chatHistory = this.getChatHistoryString(session);

    const formattedContext = Array.isArray(context)
      ? context.map(item => item.text).join('\n\n---\n\n')
      : '';
    console.log('formattedContext', formattedContext);
    // Формируем промпт, подмешивая инструкции от парсера
    const prompt = await template.invoke({
      context: formattedContext,
      chat_history: chatHistory,
      question: userQuery,
      format_instructions: parser.getFormatInstructions(),
    });

    try {
      // Отправляем запрос в Яндекс
      const aiResRaw = await model.invoke(prompt);
      console.log('aiResRaw', aiResRaw);
      // Парсим ответ Яндекса в JS-объект, валидируя через Zod
      const aiRes = await parser.parse(aiResRaw.toString());
      
      session.chat.push(`Human: ${userQuery}`, `AI: ${aiRes.text}`);
      
      const intentResult = await this.handleIntent(session, aiRes);

      await redis.set(`session:${userId}`, JSON.stringify(session));
      // Дальше твоя логика работает как раньше
      res.json({
        success: true,
        data: {
          ...aiRes,
          text: intentResult?.message || aiRes.text
        },
      });
      //return this.handleIntent(session, aiRes);
      
    } catch (error) {
      console.error("Ошибка парсинга или вызова модели:", error);
      return { message: "Извините, произошла ошибка при обработке запроса." };
    }
  }

  async handleIntent(session: UserSession, aiRes: any) {
    const { intent, productId, quantity, text } = aiRes;
    // Если бот что-то нашел, запоминаем это "на всякий случай"
    if (productId) {
      session.lastViewedProductId = productId;
    }
    switch (intent) {
      case 'add_to_cart':
        // Запоминаем, что пользователь ХОЧЕТ добавить, но ждем подтверждения
        const productInfo = await productService.findById(productId);
        if(productInfo!==null){
        session.pendingAction = { type: 'ADD', productId, name: productInfo.name_ru, price: productInfo.price, quantity: quantity || 1 };
        session.cart.push(session.pendingAction);
        session.pendingAction = null;
        return { message: text };
        }

      case 'confirm':
        if (session.pendingAction?.type === 'ADD') {
          const item = session.pendingAction;
          session.cart.push(item); // Добавляем в реальную корзину
          session.pendingAction = null;
          return { message: "✅ Добавлено в расчет! " + text };
        }
        return { message: text };

      case 'cancel':
        session.pendingAction = null;
        return { message: "Хорошо, отменил. " + text };

      case 'view_cart':
          if (!session.cart || session.cart.length === 0) {
            return { message: "Ваша корзина пока пуста. Найти что-нибудь?" };
          }
        
          let totalSum = 0;
          // Формируем текстовый список
          const cartLines = session.cart.map((item, index) => {
            const itemTotal = item.price * item.quantity;
            totalSum += itemTotal;
            return `${index + 1}. ${item.name} — ${item.quantity} шт. x ${item.price} руб. = ${itemTotal} руб.`;
          });
        
          const report = `🛒 **Ваш текущий расчет:**\n\n${cartLines.join('\n')}\n\n**Итого: ${totalSum} руб.**\n\nСформировать КП в PDF или добавим что-то еще?`;
          
          return { message: report };

      case 'search':
      default:
        return { message: text };
    }
  }

  private async waitForYandexArtResult(operationId: any) {
    const checkUrl = `https://llm.api.cloud.yandex.net/operations/${operationId}`;
    
    for (let i = 0; i < 30; i++) { // Проверяем 30 раз с паузой
      const response = await axios.get(checkUrl, {
        headers: { Authorization: `Api-Key ${process.env.YC_API_KEY}` }
      });
      
      if (response.data.done) {
        if (response.data.response?.image) {
          return response.data.response.image; // Возвращает base64
        }
        throw new Error('YandexART не вернул изображение');
      }
      await new Promise(res => setTimeout(res, 2000)); // Ждем 2 секунды
    }
    throw new Error('Таймаут генерации YandexART');
  }

  public async downloadProductCard(imageUrl: string, outputFileName: string): Promise<string> {
    try {
      // 1. Делаем запрос к серверу агрегатора
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Не удалось скачать изображение: ${response.statusText} (код: ${response.status})`);
      }
  
      // 2. Получаем бинарные данные в виде ArrayBuffer и оборачиваем в NodeJS Buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
  
      // 3. Определяем путь для сохранения (например, в папку public/uploads)
      const uploadDir = path.join(process.cwd(), 'uploads', 'products');
      
      // На всякий случай проверяем/создаем папку, если её нет
      //fs.mkdirSync(uploadDir);
      
      const finalPath = path.join(uploadDir, outputFileName);
  
      // 4. Записываем файл на диск
      fs.writeFileSync(finalPath, buffer);
      
      console.log(`[Storage] Файл успешно сохранен: ${finalPath}`);
      
      // Возвращаем локальный путь или относительный URL для базы данных
      return `/uploads/products/${outputFileName}`;
  
    } catch (error) {
      console.error('[Storage Error] Ошибка при сохранении картинки на сервер:', error);
      throw error;
    }
  }

  public async generateCard(req: Request, res: Response){

    try{
      const prompt = req.body.prompt;
      if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });

      const tempFilePath = req.file.path;

      // --- Шаг 1. Удаляем фон с исходного фото товара ---
      console.log('[AI Pipeline] Удаляем фон...');
      const imageBlob = await removeBackground(tempFilePath);
      const arrayBuffer = await imageBlob.arrayBuffer();
      const transparentBuffer = Buffer.from(arrayBuffer);
      //const transparentBuffer = Buffer.from(await transparentBlob.arrayBuffer());

      const finalPngBuffer = await sharp(transparentBuffer)
      .resize({
        width: 1024,
        height: 1024,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Гарантируем прозрачный фон вокруг товара
      })
      .png()
      .toBuffer();
    
      const imageFile = await OpenAI.toFile(finalPngBuffer, "product_transparent.png", {
        type: "image/png",
      });

      const response = await client.images.edit({
        // ВАЖНО: Проверь в поддержке или документации AITunnel, 
        // можно ли сюда вместо "gpt-image-1" подставить "flux.2-pro".
        // Если Flux.2 поддерживает этот эндпоинт — качество теней будет максимальным.
        model: "flux.2-klein-4b", 
        
        image: imageFile,
        
        // Описываем финальную желаемую сцену БОЛЕЕ детально
        prompt: `Professional product photography. ${prompt}, highly detailed, photorealistic, 4k, realistic shadows under the object, commercial lighting`,
        n: 1,
        size: "1024x1024",
      });
      if(response.data){
        const finalImageUrl = response?.data[0]?.url;
        const outputFileName = `banner_${Date.now()}.jpg`;
        let publicUrl = "";
        if(finalImageUrl !== undefined){
          publicUrl = await this.downloadProductCard(finalImageUrl, outputFileName);
        }
        else{
          publicUrl = "";
        }
        res.json({
          success: true,
          imageUrl: publicUrl 
        });
    }
    } catch (error) {
      console.error('Ошибка пайплайна генерации:', error);
      res.status(500).json({ error: 'Не удалось сгенерировать баннер' });
    }
  }

}