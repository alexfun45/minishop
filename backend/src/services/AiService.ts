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

if (!process.env.YC_API_KEY || !process.env.YC_FOLDER_ID) {
  throw new Error("Missing Yandex API configuration in environment variables");
}

const responseSchema = z.object({
  intent: z.enum(["search", "add_to_cart", "confirm", "cancel", "greeting", "view_cart"])
    .describe("Классификация намерения..."),
  productId: z.string().optional()
    .describe("Артикул товара из прайса (только цифры/ID)"),
  quantity: z.number().optional().default(1)
    .describe("Количество товара, которое упомянул пользователь"),
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
Ты — ядро системы «Умный Склад». Ответь вежливо, используя данные из контекста. 
Твоя задача: анализировать запрос и возвращать данные строго по схеме.

Если пользователь ищет подходящий товар назови название подходящего товара, его стоимость и артикул товара. Спроси: Добавить в корзину? 
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
    // Формируем промпт, подмешивая инструкции от парсера
    const prompt = await template.invoke({
      context: context, // Твоя переменная с прайсом
      chat_history: chatHistory,
      question: userQuery,
      format_instructions: parser.getFormatInstructions(), // Парсер сам объяснит Яндексу, как выглядит схема
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

}