import * as lancedb from "@lancedb/lancedb";
import type { Request, Response } from 'express';
import { OpenAIEmbeddings } from "@langchain/openai";
import { orderService } from "../services/OrderService.js";
import redis from './RedisService.js'
import path from "path";
import fs from "fs"
import {productService} from '../services/ProductService.js'
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import type {UserSession} from '../types/Common.js'
import { z } from "zod";
import { PromptTemplate } from '@langchain/core/prompts';
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import OpenAI from "openai";
import { ChatOpenAI } from "@langchain/openai";
import { AiSettings } from "../models/aiSettings.js";
import { AiDocument } from '../models/aiDocument.js';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import axios from "axios";
import type { Embedding } from "openai/resources";
import {AICacheService} from './AICacheService.js'
import {AiChatLogs} from '../models/index.js'


const client = new OpenAI({
  apiKey: process.env.AITUNNEL_API_KEY,
  baseURL: "https://routerai.ru/api/v1",
});

if (!process.env.YC_API_KEY || !process.env.YC_FOLDER_ID) {
  throw new Error("Missing Yandex API configuration in environment variables");
}

AICacheService.initIndex();

const user_intents = ["add_to_cart", "view_cart", "order", "greeting"];

const responseSchema = z.object({
  reasoning: z.string().describe("Короткое рассуждение: 1) Какой ТИП блюда ищет клиент (только десерт, только хлеб, сытный перекус или что угодно)? 2) Какие диетические ограничения? 3) Какие товары из контекста подходят под ОБА условия одновременно?"),
  intent: z.enum([
    "search", 
    "add_to_cart", 
    "confirm", 
    "cancel", 
    "greeting", 
    "view_cart", 
    "order", 
    "order_status" // <--- Добавили новый интент
  ]).describe("Классификация намерения: search — поиск товаров, view_cart - посмотреть список товаров добавленных в корзину, add_to_cart — добавить в корзину, order — оформить заказ, order_status — узнать статус текущего или ранее оформленного заказа, и т.д."),
  productIds: z.array(z.string()).nullable().optional()
  .describe("Массив артикулов товаров (только цифры/ID), которые подходят под запрос пользователя и упомянуты в ответе text. Если ничего не найдено или не применимо — пустой массив или null"),
  quantity: z.number().nullable().optional().default(1)
    .describe("Количество товара, которое упомянул пользователь или null, если не применимо"),

  customerName: z.string().nullable().optional().describe("Имя пользователя, если он его назвал"),
  phone: z.string().nullable().optional().describe("Номер телефона, если пользователь его указал"),
  address: z.string().nullable().optional().describe("Адрес доставки, если пользователь его указал"),
  orderId: z.string().nullable().optional().describe("Номер заказа, если пользователь его указал"),
  deliveryType: z.enum(["delivery", "pickup"]).nullable().optional().describe("Способ получения: доставка или самовывоз"),

  text: z.string()
    .describe("Твой вежливый ответ пользователю на русском языке")
});

// 1. Создаем парсер на основе твоей Zod-схемы
const parser = StructuredOutputParser.fromZodSchema(responseSchema);

const model = new ChatOpenAI({
  apiKey: process.env.AITUNNEL_API_KEY,
  configuration: {
    baseURL: "https://routerai.ru/api/v1",
  },
  model: "google/gemini-2.5-flash-lite",
  temperature: 0,
});

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.AITUNNEL_API_KEY,
  model: "google/gemini-embedding-001",
  configuration: {
    baseURL: "https://routerai.ru/api/v1"
  }
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
  private static createProductContext(product: any, dietaryTags: string = ''): string {
    return `
      Артикул (ID): ${product.id}
      Название: ${product.name_ru || ''}
      Описание: ${product.description_ru || ''}
      Ингредиенты (Состав): ${product.ingredients_ru || 'Состав не указан'}
      Особенности: ${product.features_ru || product.features || 'Нет'}
      Диетический профиль и здоровье: ${dietaryTags}
      Вес: ${product.weight || 'не указан'}
      Цена: ${product.price} руб
    `.trim().replace(/\s+/g, ' ');
  }

  public static async getAiSettings(){
    const settings = await AiSettings.findAll();
    return settings[0];
  }

  public static async getAiDocuments(){
    const documents = await AiDocument.findAll();
    return documents;
  }

  public static async saveAiSettigns(settings: any){
    const count = await AiSettings.count();
    if(count>0){
      const ai_settings = await AiSettings.findOne();
      if(ai_settings)
        await ai_settings.update(settings);
    }
    else{
      await AiSettings.create(settings);
    }
    return settings;
  }

  // Сохранение документа в 
  public static async registerAndProcessDocument(file: Express.Multer.File){
    
    const aiDoc = await AiDocument.create({
      file_name: file.originalname,
      file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      storage_path: file.path,
      status: 'processing'
    });

    AiService.processRAG(aiDoc.id, file.path, file.originalname)
      .catch(err => console.error(`Критическая ошибка фонового RAG для ${aiDoc.id}:`, err));

  }

  public static async processRAG(docId: string, filePath: string, fileName: string) {

    try {
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const splittedDocs = await splitter.splitDocuments(docs)

      // 2. Собираем все тексты чанков в один плоский массив для API aitunnel
      const textInputs = splittedDocs.map(doc => doc.pageContent);

      console.log(`[RAG] Отправляем пакет из ${textInputs.length} чанков в aitunnel...`);

      const embeddingResponse = await client.embeddings.create({
        model: "google/gemini-embedding-001",
        input: textInputs,
      });

      // API возвращает массив объектов, где в поле `embedding` лежат наши 1536 чисел
      let embeddings: Embedding[] = [];
      
      if(embeddingResponse?.data)
        embeddings = embeddingResponse.data;

      const db = await this.getDb();

      const existingTables = await db.tableNames();
      let table;

      const recordsToInsert = splittedDocs.map((doc, index) => {
        return {
          vector: (embeddings as any)[index].embedding, // Берем соответствующий вектор из ответа API
          text: doc.pageContent,
          document_id: docId,
          file_name: fileName,
          page_number: doc.metadata.loc?.pageNumber || 1
        };
      });

      if (!existingTables.includes('knowledge_chunks')) {
        console.log(`[LanceDB] Таблица "knowledge_chunks" не найдена. Создаем новую...`);
        
        if(embeddings[0] !== undefined){
          table = await db.createTable('knowledge_chunks', [
            {
              vector: embeddings[0].embedding, // Первому элементу задаем реальный вектор, чтобы база поняла размерность (1536)
              text: (splittedDocs as any)[0].pageContent,
              document_id: docId,
              file_name: fileName,
              page_number: (splittedDocs as any)[0].metadata.loc?.pageNumber || 1
            }
          ]);
        }
        
        // Так как первый элемент мы уже добавили при создании таблицы, 
        // для последующей пакетной вставки `.add()` мы его убираем, чтобы не дублировать
        recordsToInsert.shift(); 
      } else {
        // Если таблица уже есть, просто открываем её
        table = await db.openTable('knowledge_chunks');
      }

      if (recordsToInsert.length > 0) {
        await (table as any).add(recordsToInsert);
      }

      await AiDocument.update({ status: 'indexed' }, { where: { id: docId } });
        console.log(`[RAG] Успех! Документ "${fileName}" векторизован пакетным методом.`);
    } catch (error) {
      console.error(`[RAG Ошибка] Пакетная векторизация провалилась для ${docId}:`, error);
      await AiDocument.update({ status: 'error' }, { where: { id: docId } });
    }
  }

  public static async deleteDocument(docId: string | null): Promise<void> {
    // 1. Ищем документ в PostgreSQL, чтобы узнать путь к файлу
    const doc = await AiDocument.findByPk(docId || 0);
    if (!doc) {
      throw new Error('Документ не найден в базе данных');
    }

    // 2. Очищаем векторы в LanceDB
    try {
      const db = await this.getDb();
      const existingTables = await db.tableNames();
      
      if (existingTables.includes('knowledge_chunks')) {
        const table = await db.openTable('knowledge_chunks');
        
        // Удаляем из LanceDB все записи по строговому совпадению document_id
        // Внимание: LanceDB поддерживает SQL-подобный синтаксис в методе delete
        await table.delete(`document_id = '${docId}'`);
        console.log(`[LanceDB] Векторы для документа ${docId} успешно удалены.`);
      }
    } catch (error) {
      console.error(`[LanceDB Ошибка] Не удалось удалить векторы для ${docId}:`, error);
      // Не прерываем процесс, даже если в LanceDB векторов не нашлось
    }

    // 3. Удаляем физический файл с диска сервера
    if (doc.storage_path && fs.existsSync(doc.storage_path)) {
      try {
        fs.unlinkSync(doc.storage_path);
        console.log(`[Файловая система] Файл удален: ${doc.storage_path}`);
      } catch (error) {
        console.error(`[Ошибка диска] Не удалось стереть файл ${doc.storage_path}:`, error);
      }
    }

    await doc.destroy();
    console.log(`[PostgreSQL] Запись ${docId} успешно удалена из базы.`);
  }

  public static async indexProduct(product: any) {
    try {
      const db = await this.getDb();
      
      // 1. Генерируем медицинские/диетические теги с помощью ИИ
      const dietaryTags = await this.generateDietaryTags(product);
      
      // 2. Собираем богатый контекст
      const contextText = this.createProductContext(product, dietaryTags);
      
      let embedding: number[] = [];
      const response = await client.embeddings.create({
        model: 'google/gemini-embedding-001',
        input: contextText,
        encoding_format: 'float'
      });
      
      if (response?.data?.[0]) {
        embedding = response.data[0].embedding;
      }

      const record = {
        id: product.id.toString(),
        vector: embedding,
        text: contextText,
        productId: product.id,
        price: Number(product.price),
        available: Boolean(product.available),
        image_url: product.image_url || ""
      };

      const tableNames = await db.tableNames();
      if (!tableNames.includes(TABLE_NAME)) {
        await db.createTable(TABLE_NAME, [record]);
        console.log(`[LanceDB] Таблица ${TABLE_NAME} успешно создана.`);
      } else {
        const table = await db.openTable(TABLE_NAME);
        await table.mergeInsert("id")
          .whenMatchedUpdateAll()
          .whenNotMatchedInsertAll()
          .execute([record]);
        console.log(`[LanceDB] Товар ID ${product.id} успешно проиндексирован с диет-тегами.`);
      }
    } catch (error) {
      console.error(`[LanceDB] Ошибка индексации товара ${product.id}:`, error);
    }
  }

  public static async indexProduct2(product: any) {
    try {
      const db = await this.getDb();
      const contextText = this.createProductContext(product);
      //const vector = await this.generateEmbedding(contextText);
      //const vectors = await embeddings.embedDocuments([contextText]);
      let embedding: number[] = [];
      const response  = await client.embeddings.create({
        model: 'google/gemini-embedding-001',
        input: contextText,
        encoding_format: 'float'
      });
      if(response?.data[0])
        embedding = response?.data[0].embedding;
      //const vector = vectors[0];

      const record = {
        id: product.id.toString(), // LanceDB любит строковые ID
        vector: embedding,
        text: contextText,
        productId: product.id,
        price: product.price,
        available: Boolean(product.available),
        image_url: product.image_url || ""
      };

      // Проверяем, существует ли таблица
      const tableNames = await db.tableNames();
      
      if (!tableNames.includes(TABLE_NAME)) {
        await db.createTable(TABLE_NAME, [record]);
        console.log(`[LanceDB] Таблица ${TABLE_NAME} успешно создана.`);
      } else {
        const table = await db.openTable(TABLE_NAME);
        
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

  private static async generateDietaryTags(product: any): Promise<string> {
    try {
      const completion = await client.chat.completions.create({
        model: 'google/gemini-2.5-flash-lite',
        temperature: 0,
        messages: [
          { 
            role: "system", 
            content: `Ты — диетолог-технолог пекарни. Проанализируй название, состав и описание продукта. 
            Выпиши через запятую характеристики по 4 пунктам:
            1. Тип продукта (выбери ровно одно: Десерт и сладкое к чаю / Хлеб и багеты / Сытная несладкая выпечка и пироги / Напиток).
            2. Подходит ли диабетикам (есть ли сахар/сироп/мед или это продукт без сахара / на сахарозаменителе / с низким ГИ).
            3. Влияние на ЖКТ (легко усваивается, диетическое, бездрожжевое ИЛИ тяжелая сдоба, жареное, острое).
            4. Особенности (без лактозы, без глютена, постный/веганский).
            Формат ответа: только строка с ключевыми словами через запятую, без вводных слов.` 
          },
          { 
            role: "user", 
            content: `Товар: ${product.name_ru}. Состав: ${product.ingredients_ru || 'не указан'}. Описание: ${product.description_ru || ''}. Особенности: ${product.features_ru || product.features || ''}` 
          }
        ]
      });
      return completion.choices[0]?.message?.content || '';
    } catch (e) {
      console.error("[DietaryTags Error] Не удалось сгенерировать теги:", e);
      return '';
    }
  }

  public static async searchProducts(query: string, limit: number = 3) {
    try {
      const db = await this.getDb();
      const tableNames = await db.tableNames();
      
      if (!tableNames.includes(TABLE_NAME)) return [];

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
  
  clearHistory = async (userId: string) => {
    await redis.unlink(`session:${userId}`);
  }

  clearCart = async (userId: string) => {
    try {
      const sessionKey = `session:${userId}`;
      const sessionData = await redis.get(sessionKey);

      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.cart = [];
        
        // Если пользователь был в середине оформления заказа через бота — сбрасываем FSM
        if (session.pendingAction?.type === 'ORDER') {
          session.pendingAction = null;
        }

        await redis.set(sessionKey, JSON.stringify(session));
      }
      return true;
    } catch (error) {
      console.error('[AiService] Ошибка очистки корзины в Redis:', error);
      return false;
      //return res.status(500).json({ success: false, error: 'Не удалось очистить корзину' });
    }
  }

  handleUserMessage = async (req: Request, res: Response) => {
    const postdata: any = req.body;
    let productsForFrontend: any[] = [];
    const userId = postdata.userId;
    const userQuery = postdata.message;
    const directIntent = postdata.payload?.directIntent; 
    const directProductId = postdata.payload?.productId;
    let isFromCache = false;
    /*if (!userQuery || typeof userQuery !== 'string' || userQuery.trim() === '') {
      console.error('[AiService] Получен пустой или некорректный текст вопроса:', userQuery);
      return 'Извините, я не смог распознать ваш вопрос.';
    }*/

    const sessionData = await redis.get(`session:${userId}`);
    const session = sessionData ? JSON.parse(sessionData) : { cart: [], chat: [], pendingItem: null, lastViewedProductId: null };
    
    //const userMessageVector: number[] = await embeddings.embedQuery(userQuery);
    console.log('session', session);
    if (session.pendingAction?.type === 'ORDER') {
       const cleanVoiceQuery = userQuery
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .trim();
      
      const cancelWords = ['отмен', 'стоп', 'передумал', 'не надо', 'выход', 'прекрат', 'сброс', 'назад'];
      const isCancel = cancelWords.some(word => cleanVoiceQuery.includes(word));
      // Возможность отменить оформление
       if (isCancel) {
        session.pendingAction = null;
        await redis.set(`session:${userId}`, JSON.stringify(session));
        return res.json({
          success: true,
          data: {
            intent: 'cancel',
            text: 'Оформление заказа отменено. Чем еще я могу вам помочь?',
            products: []
          }
        });
      }
      
      try {
      // Передаем сообщение напрямую в логику шагов оформления
      const intentResult = await this.handleIntent(session, { intent: 'order' }, userQuery, userId);
      
      session.chat.push(`Human: ${userQuery}`, `AI: ${intentResult?.message}`);
      await redis.set(`session:${userId}`, JSON.stringify(session));
  
      return res.json({
        success: true,
        data: {
          intent: 'order',
          text: intentResult.message,
          clearCart: intentResult?.clearCart || false,
          products: []
        }
      });
    } catch (orderErr) {
        console.error('[Order FSM Error] Сбой при оформлении заказа:', orderErr);
        // Сбрасываем зависший шаг, чтобы пользователь не попал в бесконечный цикл!
        session.pendingAction = null;
        await redis.set(`session:${userId}`, JSON.stringify(session));
        
        return res.json({
          success: true,
          data: {
            intent: 'cancel',
            text: 'Произошла техническая ошибка при сохранении заказа. Я сбросил процесс оформления — пожалуйста, попробуйте оформить заказ еще раз или очистите корзину.',
            products: []
          }
        });
      }
    }

    const embeddingResponse = await client.embeddings.create({
      model: "google/gemini-embedding-001",
      input: userQuery,
      encoding_format: "float"
    });

    const queryVector = embeddingResponse?.data && embeddingResponse.data[0] 
      ? embeddingResponse.data[0].embedding 
      : [];
    
    const userMessageVector: number[] = queryVector;

    // Блок быстрого добавления в корзину
    //if (directIntent === 'add_to_cart' && directProductId) {
    /*if(user_intents.includes(directIntent)){
      const fakeAiRes = {
        intent: directIntent,
        productIds: [directProductId.toString()],
        quantity: 1,
        text: `Конечно! Добавляю в корзину.`
      };
      const intentResult = await this.handleIntent(session, fakeAiRes, userQuery);
      session.chat.push(`Human: ${userQuery}`, `AI: ${intentResult?.message || fakeAiRes.text}`);
      await redis.set(`session:${userId}`, JSON.stringify(session));
      const productInfo = await productService.findById(directProductId);
      return res.json({
        success: true,
        data: {
          intent: 'add_to_cart',
          text: intentResult?.message || fakeAiRes.text,
          clearCart: intentResult?.clearCart || false,
          products: []
          //products: productInfo ? [productInfo] : []
        },
      });
    }*/

    /*const cachedAnswerRaw = await AICacheService.get(userMessageVector, 0.25);

    if (cachedAnswerRaw) {
      try {
        // Парсим сохраненный JSON-объект кэша
        const cachedData = JSON.parse(cachedAnswerRaw);
        isFromCache = true;
        // Добавляем запись в историю чата в сессии
        session.chat.push(`Human: ${userQuery}`, `AI: ${cachedData.text}`);
        await redis.set(`session:${userId}`, JSON.stringify(session));

        // Вытаскиваем товары из базы данных, если в кэше сохранены productIds
        if (cachedData.productIds && cachedData.productIds.length > 0) {
          for (const idStr of cachedData.productIds) {
            const pInfo = await productService.findById(parseInt(idStr));
            if (pInfo) {
              productsForFrontend.push(AiService.mapProductToFrontend(pInfo));
            }
          }
        }

        console.log(`[AICache] Возвращаем полноценный кэшированный ответ с ${productsForFrontend.length} товарами.`);
        const cachedProductIds = productsForFrontend.map(p => p.id.toString()) || [];

        AiChatLogs.create({
          user_id: userId,
          user_message: userQuery,
          ai_response: cachedData.text,
          intent: 'search',
          products_found: JSON.stringify(cachedProductIds),
          is_cached: isFromCache,
          created_at: new Date()
        });
        return res.json({
          success: true,
          data: {
            intent: cachedData.intent,
            text: cachedData.text,
            products: productsForFrontend
          },
        });

      } catch (parseErr) {
        console.error('[AICache] Ошибка парсинга кэшированного ответа:', parseErr);
        // Если кэш старый или поврежден, код провалится дальше к обычному выполнению LLM
      }
    }*/

    
    // === ШАГ 1: Извлекаем динамические настройки из Postgres ===
    const aiSettings = await AiService.getAiSettings();
    const systemPromptBase = aiSettings?.system_prompt || "Вы — умный ИИ-консультант и нутрициолог в интернет-магазине пекарни.";
    const companyPromotions = aiSettings?.company_promotions || "Специальных акций на данный момент нет.";
    
    // Мапим уровень креативности (например, от 0 до 1, если в базе храните число или строку)
    const currentTemperature = aiSettings?.creativity_level !== undefined 
      ? Number(aiSettings.creativity_level) 
      : 0;

    // Инициализируем модель с температурой из настроек базы данных
    const dynamicModel = new ChatOpenAI({
      apiKey: process.env.AITUNNEL_API_KEY,
      configuration: { baseURL: "https://routerai.ru/api/v1" },
      model: "google/gemini-2.5-flash-lite",
      temperature: currentTemperature,
    });

    // === ШАГ 2: Параллельный векторный поиск (Товары + Документы RAG) ===
    let expandedQuery = userQuery;
    const lowerQ = userQuery.toLowerCase();
    if (lowerQ.includes('диабет') || lowerQ.includes('сахар') || lowerQ.includes('гликемич')) {
      expandedQuery += " без сахара диетический диабетикам низкий гликемический индекс сахарозаменитель";
    }
    if (lowerQ.includes('желуд') || lowerQ.includes('кишечн') || lowerQ.includes('жкт') || lowerQ.includes('гастрит') || lowerQ.includes('изжог')) {
      expandedQuery += " легко усваивается бездрожжевой на закваске диетический не жареный без маргарина клетчатка ЖКТ";
    }

    let productContext = "";
    let documentContext = "";
    let rawProductResults: any[] = [];

    try {

      const embeddingResponse = await client.embeddings.create({
        model: "google/gemini-embedding-001",
        input: userQuery,
        encoding_format: "float"
      });

      //const queryVector = embeddingResponse?.data && embeddingResponse.data[0] 
      //  ? embeddingResponse.data[0].embedding 
      //  : null;

      

      if (!queryVector) {
        console.error(`[AiService] Не удалось получить эмбеддинг для запроса: "${userQuery}". Ответ API:`, JSON.stringify(embeddingResponse));
      }
      else{
        // А. Поиск по товарам
          const db = await AiService.getDb();
          const tableNames = await db.tableNames();
          if (tableNames.includes(TABLE_NAME)) {
            const prodTable = await db.openTable(TABLE_NAME);
            rawProductResults = await prodTable
            .search(queryVector)
            .where('available = true')
            .limit(20) 
            .toArray();

            productContext = rawProductResults.map(item => item.text).join('\n---\n');
        }

        // Б. Поиск по загруженным PDF документам (knowledge_chunks)
        if (tableNames.includes('knowledge_chunks')) {
          const docTable = await db.openTable('knowledge_chunks');
          const rawDocResults = await docTable.search(queryVector).limit(3).toArray();
          documentContext = rawDocResults.map(item => `[Документ: ${item.file_name}, Стр. ${item.page_number}]: ${item.text}`).join('\n\n');
        }
    }
    } catch (vectorError) {
      console.error("[LanceDB] Ошибка параллельного поиска контекста:", vectorError);
    }

    // === ШАГ 3: Динамическое построение Промпта ===
    const chatHistory = this.getChatHistoryString(session);

    // Конструируем гибкий шаблон, внедряя настройки из базы данных прямо в системную часть

    const dynamicTemplate = PromptTemplate.fromTemplate(`
      ${systemPromptBase}

      Актуальные акции:
      ${companyPromotions}

      КРИТИЧЕСКИЕ ПРАВИЛА КОНСУЛЬТАЦИИ И ПОДБОРА ЕДЫ:
      1. Отвечай СТРОГО на основе переданного ниже "Контекста доступных товаров" и "Документов". Ничего не придумывай от себя.
      2. ПРАВИЛО ПЕРЕСЕЧЕНИЯ КРИТЕРИЕВ (КАТЕГОРИЯ + ДИЕТА):
   - Всегда проверяй, совпадает ли ТИП продукта с тем, что просит пользователь!
   - Если пользователь просит **ДЕСЕРТ, сладкое или что-то к чаю** (например: "десерт для диабетика") — предлагай ТОЛЬКО сладкие изделия/десерты без сахара (зефир, маффины на сахарозаменителе, ягодные/творожные десерты без сахара). **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО** предлагать обычный хлеб, багеты или сытные пироги (с мясом/капустой/сыром) под видом десерта, даже если они не содержат сахара!
   - Если пользователь просит **ХЛЕБ** — предлагай только хлеб.
   - Если пользователь просит **сытно поесть / перекусить** — предлагай несладкую выпечку, пироги, улитки, киши.
   - Предлагать все категории сразу можно ТОЛЬКО если запрос общий (например: "что у вас вообще можно при диабете?").
      3. АНАЛИЗ СОСТАВА И ЗДОРОВЬЯ:
      - Для ДИАБЕТИКОВ (или "без сахара"): проверяй "Ингредиенты", "Особенности" и "Диетический профиль". Исключай всё, где есть обычный сахар, сироп, мед, сгущенка, сладкий джем.
      - Для ПРОБЛЕМ С ЖКТ (желудок, кишечник, гастрит): исключай жареное, острое, жирный крем, тяжелую сдобу, кислые ягоды. Рекомендуй легкие позиции в рамках запрошенной категории.
      4. ПРАВИЛО ЗАПОЛНЕНИЯ productIds:
        - В массив productIds добавляй ТОЛЬКО те артикулы (ID), которые реально подошли под критерии пользователя и которые ты порекомендовал в тексте ответа.
        - Если подходящих товаров НЕТ — обязательно верни пустой массив productIds: [] и вежливо напиши в text, что по таким строгим диетическим критериям сейчас ничего нет.
      5. РАБОТА С КОРЗИНОЙ:
        - Если пользователь просит добавить товар или подтверждает покупку ("давай", "добавь", "беру"), но не называет артикул, возьми ID товара из предыдущих реплик в "Истории последних сообщений" и установи intent = "add_to_cart".

      Дополнительный контекст из документов компании:
      {document_context}

      Контекст доступных товаров (Прайс и составы):
      {product_context}

      История последних сообщений:
      {chat_history}

      Текущий запрос пользователя: {question}

      {format_instructions}
      `);


      const prompt = await dynamicTemplate.invoke({
        document_context: documentContext || "Дополнительные документы не найдены.",
        product_context: productContext || "Товары в базе не найдены.",
        chat_history: chatHistory,
        question: userQuery,
        format_instructions: parser.getFormatInstructions(),
      });

    // === ШАГ 4: Запрос к LLM и формирование ответа ===
    let aiResRaw;

    try {
      aiResRaw = await dynamicModel.invoke(prompt);
    } catch (llmError: any) {
      console.error("[AI Model Error] Сбой при вызове модели:", llmError?.message || llmError);
      
      // Возвращаем пользователю безопасный ответ, чтобы чат не ломался
      return res.json({
        success: true,
        data: {
          intent: 'search',
          text: 'Хм, я немного запутался в формулировке или запрос получился слишком сложным. Пожалуйста, уточните, что именно вы имеете в виду?',
          products: []
        },
      });
    }

   try {
      const textContent = typeof aiResRaw.text === 'string' 
        ? aiResRaw.text 
        : JSON.stringify(aiResRaw.content);
    
      const aiRes = await parser.parse(textContent);
      console.log('отправка сообщения LLM...');
      session.chat.push(`Human: ${userQuery}`, `AI: ${aiRes.text}`);
      const intentResult = await this.handleIntent(session, aiRes, userQuery, userId);

      console.log('ответ ИИ:', aiRes);
      // --- НАЧАЛО ИСПРАВЛЕНИЯ ЛОГИКИ ПОДБОРА КАРТОЧЕК ---
      const itemQty = aiRes.quantity || 1;
      
      // Вариант 1: Модель сама явно вернула массив подходящих ID товаров
      /*if (aiRes.productIds && aiRes.productIds.length > 0 && aiRes.intent!='view_cart') {
        console.log('Модель сама явно вернула массив подходящих', aiRes.productIds);
        for (const idStr of aiRes.productIds) {
          const pInfo:any = await productService.findById(parseInt(idStr));
          if (pInfo) productsForFrontend.push(AiService.mapProductToFrontend(pInfo, itemQty));
        }
      } 
      // Вариант 2: Модель считает, что это поиск ТОВАРОВ (intent === 'search'), 
      // но не заполнила productIds. И при этом в контексте документов НЕТ данных.
      else if (aiRes.intent === 'search' && rawProductResults.length > 0 && !documentContext) {
        // Привязываем товары из векторного поиска только если запрос явно товарный
        for (const item of rawProductResults.slice(0, 10)) {
          const targetId = item.productId || item.id;
          if (!targetId) continue;
          const pInfo = await productService.findById(parseInt(targetId));
          if (pInfo) productsForFrontend.push(AiService.mapProductToFrontend(pInfo));
        }
      }

      if (aiRes.intent === 'search' && productsForFrontend.length > 0) {
        session.lastViewedProductId = productsForFrontend.map(p => p.id.toString());
      }*/

      if (aiRes.productIds && aiRes.productIds.length > 0 && aiRes.intent !== 'view_cart') {
        console.log('ИИ отобрал подходящие товары по критериям:', aiRes.productIds);
        for (const idStr of aiRes.productIds) {
          const cleanId = parseInt(idStr.replace(/\D/g, ''), 10); // Защита, если ИИ вернул "id:15" вместо "15"
          if (isNaN(cleanId)) continue;
          
          const pInfo: any = await productService.findById(cleanId);
          if (pInfo) {
            productsForFrontend.push(AiService.mapProductToFrontend(pInfo, itemQty));
          }
        }
      }

      // Запоминаем показанные товары, чтобы пользователь мог сказать "добавь их в корзину"
      if (aiRes.intent === 'search' && productsForFrontend.length > 0) {
        session.lastViewedProductId = productsForFrontend.map(p => p.id.toString());
      }

      const cachedProductIds = productsForFrontend.map(p => p.id.toString()) || [];
      
      // Сохраняем лог общения с чат-ботом
      AiChatLogs.create({
        user_id: userId,
        user_message: userQuery,
        ai_response: intentResult?.message || aiRes.text,
        intent: aiRes.intent,
        is_cached: isFromCache,
        products_found: JSON.stringify(cachedProductIds),
        created_at: new Date()
      });

      
      await redis.set(`session:${userId}`, JSON.stringify(session))
     
      return res.json({
        success: true,
        data: {
          ...aiRes,
          text: intentResult?.message || aiRes.text,
          clearCart: intentResult?.clearCart || false,
          products: productsForFrontend
        },
      });
      
    } catch (error) {
      console.error("Ошибка парсинга или вызова модели:", error);
      res.status(500).json({ success: false, error: "Ошибка при обработке запроса нейросетью." });
    }
  }

  // Небольшой хелпер для чистки кода маппинга
  private static mapProductToFrontend(pInfo: any, quantity: number = 1) {
    return {
      id: pInfo.id,
      name_ru: pInfo.name_ru,
      price: pInfo.price,
      image_url: pInfo.image_url,
      description_ru: pInfo.description_ru,
      quantity: quantity
    };
  }

  syncCart = async (userId: string, items: any) => {
    try {  
      const sessionKey = `session:${userId}`;
      const sessionData = await redis.get(sessionKey);
      const session = sessionData
        ? JSON.parse(sessionData)
        : { cart: [], chat: [], pendingAction: null, lastViewedProductId: null };
  
      // Приводим формат фронтенда к формату, который ожидает ваш FSM в handleIntent
      session.cart = items.map((item: any) => ({
        type: 'ADD',
        product_id: item.productId.toString(),
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      }));
  
      // Если корзину очистили полностью — сбрасываем незавершенный заказ
      if (session.cart.length === 0 && session.pendingAction?.type === 'ORDER') {
        session.pendingAction = null;
      }
  
      await redis.set(sessionKey, JSON.stringify(session));
      return true;
    } catch (error) {
      console.error('[AiService] Ошибка синхронизации корзины:', error);
      return false;
    }
  };

  async handleIntent(session: UserSession, aiRes: any, userQuery: string = '', userId = null) {
    const { intent, productIds, quantity, text, customerName, phone, address, deliveryType} = aiRes;
   
    const firstProductId = productIds && productIds.length > 0 ? productIds[0] : null;


    if (session.pendingAction?.type === 'ORDER') {
      const orderData = session.pendingAction;
      const cleanInput = userQuery.trim().toLowerCase();
      if(userId)
        orderData.user_id = userId;
      // --- АВТОМАТ СОСТОЯНИЙ (FSM) ДЛЯ ОФОРМЛЕНИЯ ---
      switch (orderData.step) {
        case 0: // Шаг 0: Спрашиваем способ получения (Доставка / Самовывоз)
          const lowerQuery = userQuery.toLowerCase();
          if (lowerQuery.includes('доставк')) {
            orderData.deliveryType = 'delivery';
          } else if (lowerQuery.includes('самовывоз') || lowerQuery.includes('сам')) {
            orderData.deliveryType = 'pickup';
          }

          if (!orderData.deliveryType) {
            return { message: "Уточните, пожалуйста, как вам удобнее получить заказ: **Доставка** или **Самовывоз**?" };
          }
        
        orderData.step = 1; // Переходим к следующему шагу
        return { message: "Как к вам обращаться? Напишите ваше имя." };
  
        case 1: // Шаг 1: Запрашиваем Имя и Телефон
          if (!orderData.customer_name) {
            // Защита от случайного ввода цифр вместо имени
            if (/^\+?\d[\d\s\-()]{5,}$/.test(cleanInput)) {
              return { message: "Похоже, вы ввели номер телефона. Напишите, пожалуйста, сначала ваше имя." };
            }

            const formattedName = cleanInput.charAt(0).toUpperCase() + cleanInput.slice(1).toLowerCase();
            orderData.customer_name = formattedName;
            return { message: `Приятно познакомиться, ${formattedName}! Укажите, пожалуйста, ваш номер телефона для связи.` };
          }

          // Подэтап 1.2: Имя уже есть, ждем телефон
          if (!orderData.customer_phone) {
            // Очищаем всё, кроме цифр и плюса, чтобы проверить длину номера
            const digitsOnly = cleanInput.replace(/\D/g, '');
            if (digitsOnly.length < 10) {
              return { message: "Некорректный формат номера. Укажите, пожалуйста, действующий номер телефона (минимум 10 цифр)." };
            }
            orderData.customer_phone = cleanInput;
          }

          // Оба поля заполнены — двигаемся дальше!
          if (orderData.deliveryType === 'delivery') {
            orderData.step = 2;
            return { message: "Напишите, пожалуйста, полный адрес доставки (город, улица, дом, квартира)." };
          } else {
            // Если самовывоз — адрес не нужен, сразу переходим к оформлению (шаг 3)
            orderData.step = 3;
          }
  
        case 2: // Шаг 2: Если выбрана доставка — запрашиваем адрес
          if (orderData.step === 2) {
            if (cleanInput.length < 5) {
              return { message: "Пожалуйста, укажите более подробный адрес доставки." };
            }
            orderData.delivery_address = cleanInput;
            orderData.step = 3;
          }

          if (orderData.step !== 3) {
            break;
          }
  
        case 3: // Шаг 3: Финальное подтверждение заказа
          const cartSummary = session.cart.map((i: any) => `- ${i.name} (${i.quantity} шт.)`).join('\n');
          const totalSum = session.cart.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
          
          // Очищаем pendingAction, так как заказ сформирован (или сохраняем в БД заказов)
          const finalOrder = { ...orderData, items: session.cart, total: totalSum };

          try {
            // TODO: Сохранить finalOrder в базу данных PostgreSQL через Sequelize
            const order = await orderService.create(finalOrder);
            session.pendingAction = null;
            session.cart = []; // Очищаем корзину после успешного заказа
            
            return { 
              clearCart: true,
              message: `🎉 **Заказ успешно оформлен!**\n\n` +
                      `📦 Состав заказа:\n${cartSummary}\n` +
                      `💰 Итого: ${totalSum} руб.\n` +
                      `🚚 Способ: ${orderData.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}\n` +
                      (orderData.delivery_address ? `📍 Адрес: ${orderData.delivery_address}\n` : '') +
                      `👤 Получатель: ${orderData.customer_name} (${orderData.customer_phone})\n\n` +
                      `Менеджер скоро свяжется с вами для подтверждения!` 
            };
          }  catch (err) {
            // Если БД упала — сбрасываем автомат состояний, чтобы не зациклиться!
            session.pendingAction = null;
            throw err;
          }
      }
    }

    switch (intent) {
      case 'add_to_cart':
        const queryLower = userQuery.toLowerCase();
        const isBulkAdd = queryLower.includes('все') || queryLower.includes('всё') || queryLower.includes('их') || queryLower.includes('эти');
        // Запоминаем, что пользователь ХОЧЕТ добавить, но ждем подтверждения
        const targetProductIds = (isBulkAdd || !aiRes.productIds || aiRes.productIds.length === 0)
          ? session.lastViewedProductId
          : aiRes.productIds;

        if (!targetProductIds || targetProductIds.length === 0) {
            return { message: "Уточните, пожалуйста, какой именно товар вы хотите добавить в корзину?" };
          }
        
        const qty = quantity || 1;
        const addedItemsSummary = [];
        
        const uniqueTargetIds = [...new Set(targetProductIds.map((id: any) => id.toString()))];

        for (const idStr of uniqueTargetIds) {
          const cleanId = parseInt((idStr as any).replace(/\D/g, ''), 10);
          if (isNaN(cleanId)) continue;
          const productInfo = await productService.findById(cleanId);

            if (productInfo) {
            const prodIdStr = productInfo.id;

            // Проверяем, есть ли уже такой товар в корзине сессии
            const existingCartItem = session.cart.find(
              (item: any) => item.product_id.toString() === prodIdStr
            );

            if (existingCartItem) {
              // Если товар уже в корзине — просто увеличиваем количество!
              existingCartItem.quantity = Number(existingCartItem.quantity) + qty;
            } else {
              // Если товара еще нет — добавляем новую позицию
              session.cart.push({ 
                type: 'ADD', 
                product_id: prodIdStr, 
                name: productInfo.name_ru, 
                price: Number(productInfo.price), 
                quantity: qty 
              });
            }

            addedItemsSummary.push(`${productInfo.name_ru} — ${qty} шт.`);
          }
        }
        session.pendingAction = null;
        return { 
          message: text || `✅ Успешно добавил в корзину:\n${addedItemsSummary.join('\n')}`,
          products: uniqueTargetIds
        };
      case 'order':
        if(session.cart == null || session.cart.length==0){
          return { message: "Корзина пуста. ПОжалуйста, добавьте товары в корзину" };
        }
        if(!session.pendingAction){
          session.pendingAction = { 
            type: 'ORDER', 
            product_id: 0, 
            step: 0
          };
        } 
        return { message: 'Начинаю оформление. Укажите как будете получать товар: Доставка или самовывоз?' };

        case 'order_status':
          try {
            let targetOrders = null;
  
            // Если пользователь явно указал номер заказа (например, "где 42 заказ?")
            if (aiRes.orderId) {
              const specificOrder = await orderService.findById(aiRes.orderId);
              if (specificOrder) targetOrders = [specificOrder];
            } else {
              // Иначе ищем самый свежий активный/последний заказ этого пользователя в базе
              targetOrders = await orderService.findByUserId(userId, 5);
            }
  
            if (!targetOrders || targetOrders.length === 0) {
              return { message: "Хм, я не нашел активных или недавних заказов по вашей истории. Хотите оформить новый?" };
            }
  
            // Словарь для красивого вывода статусов на русском
            const statusLabelsRu: Record<string, string> = {
              pending: 'Ожидает подтверждения ⏳',
              confirmed: 'Подтвержден ✓',
              preparing: 'Готовится на кухне 👨‍🍳',
              ready: 'Готов к выдаче / доставке 📦',
              delivered: 'Доставлен 🎉',
              cancelled: 'Отменен ❌'
            };

            let message = `📋 **Ваши последние заказы:**\n\n`;

            targetOrders.forEach((order, index) => {
              const statusText = statusLabelsRu[order.status] || order.status;
              const dateStr = new Date(order.delivery_time).toLocaleDateString('ru-RU', { 
                day: 'numeric', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
              });
  
              message += `🔹 **Заказ #${order.id}** от ${dateStr}\n` +
                         `   • Статус: **${statusText}**\n` +
                         `   • Сумма: **${order.total_amount} ₽**\n` +
                         `   • Способ: ${order.delivery_address?.includes('delivery') ? 'Самовывоз' : 'Доставка'}\n\n`;
            });
  
            message += `Если у вас есть вопросы по конкретному заказу, просто назовите его номер!`;
  
            return { message };
            
            /*const currentStatusText = statusLabelsRu[lastOrder.status] || lastOrder.status;
            const paymentText = lastOrder.status === 'payment_success' ? 'Оплачено онлайн 💳' : 'Не оплачено / Наличными 💵';
  
            return {
              message: `📋 **Информация о вашем заказе #${lastOrder.id}:**\n\n` +
                       `• Статус: **${currentStatusText}**\n` +
                       `• Сумма: **${lastOrder.total_amount} ₽**\n` +
                       `• Оплата: ${paymentText}\n` +
                       `• Способ получения: ${lastOrder.delivery_type.includes('delivery') ? 'Самовывоз' : 'Доставка'}\n\n` +
                       `Если у вас есть вопросы по заказу, наш менеджер всегда на связи!`
            };*/
          } catch (dbError) {
            console.error('[Order Status Error] Ошибка при поиске заказа в БД:', dbError);
            return { message: "К сожалению, произошла ошибка при проверке статуса заказа. Попробуйте чуть позже." };
          }

      /*case 'confirm':
        if (session.pendingAction?.type === 'ADD') {
          const item = session.pendingAction;
          session.cart.push(item); // Добавляем в реальную корзину
          session.pendingAction = null;
          return { message: "✅ Добавлено в расчет! " + text };
        }
        return { message: text };
        */

      case 'cancel':
        session.pendingAction = null;
        return { message: "Хорошо, отменил. " + text };

      case 'view_cart':
        if (!session.cart || session.cart.length === 0) {
          return { message: "Ваша корзина пока пуста. Найти что-нибудь?" };
        }
        let total = 0;
        const cartLines = session.cart.map((item, index) => {
          const itemTotal = item.price * item.quantity;
          total += itemTotal;
          return `${index + 1}. ${item.name} — ${item.quantity} шт. x ${item.price} руб. = ${itemTotal} руб.`;
        });

        const cart_report = `**Ваша текущая корзина:**\n\n${cartLines.join('\n')}\n\n**Итого: ${total} руб.**\n\n`;
          
        return { message: cart_report };

      
      case 'view_order':
          if (!session.cart || session.cart.length === 0) {
            return { message: "Ваша корзина пока пуста. Найти что-нибудь?" };
          }
        
          let totalSum = 0;
          // Формируем текстовый список
          const cartLinesOrder = session.cart.map((item, index) => {
            const itemTotal = item.price * item.quantity;
            totalSum += itemTotal;
            return `${index + 1}. ${item.name} — ${item.quantity} шт. x ${item.price} руб. = ${itemTotal} руб.`;
          });
        
          const report = `🛒 **Ваш текущий расчет:**\n\n${cartLinesOrder.join('\n')}\n\n**Итого: ${totalSum} руб.**\n\nСформировать КП в PDF или добавим что-то еще?`;
          
          return { message: report };
          
      case 'search':
      default:
        return { message: text };
    }
  }


  public async downloadProductCard(base64data: string, outputFileName: string): Promise<string> {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'products');
      
      //fs.mkdirSync(uploadDir);
      
      const finalPath = path.join(uploadDir, outputFileName);
      
      const binaryData = Buffer.from(base64data, 'base64');

      fs.writeFileSync(finalPath, binaryData);
      
      console.log(`[Storage] Файл успешно сохранен: ${finalPath}`);
      
      // Возвращаем локальный путь или относительный URL для базы данных
      return `${process.env.SAVEDIR_PATH}/uploads/products/${outputFileName}`;
  
    } catch (error) {
      console.error('[Storage Error] Ошибка при сохранении картинки на сервер:', error);
      throw error;
    }
  }

  public async genDescription(name: string, ingredients: string) {
    const ingrd = (ingredients) ? ingredients : '';
    const completion: any = await client.chat.completions.create({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { role: "system", content: "Ты — помощник для заполнения карточек товаров. Верни вкусное описание товара по его названию и ингредиентам. Напиши один вариант без вводного текста, только описание" },
        { role: "user", content: `Придумай описание на основе: ${name}, ${ingrd}` }
      ]
    });

    if(completion.choices[0]){
      return completion.choices[0].message.content;
    }
    else{
      return '';
    }
  }

  public async fillProductFields(prompt: string) {
    const completion: any = await client.chat.completions.create({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { 
          role: "system", 
          content: `Ты — технолог-нутрициолог пекарни и помощник для заполнения карточек товаров. 
Верни результат строго в JSON формате с ключами: 
- name_ru (название)
- price (только число)
- weight (вес в граммах)
- ingredients_ru (подробный реалистичный состав)
- features_ru (диетические особенности через запятую, например: "без добавленного сахара, на натуральной закваске, подходит при диете, не содержит лактозы" или "содержит сахар, глютен, сдобное тесто")
- description_ru (аппетитное описание).` 
        },
        { role: "user", content: `Заполни данные товара на основе: ${prompt}` }
      ],
      response_format: { type: "json_object" }
    });
    
    if (completion.choices?.[0]?.message?.content) {
      return JSON.parse(completion.choices[0].message.content);
    } else {
      return false;
    }
  }

  public async generateCard(req: Request, res: Response) {
    let tempFilePath: string | null = null;
    let isTempFileDownloaded = false;

    try {
      const prompt = req.body.prompt;
      const imageUrl = req.body.image_url;

      // Проверяем, что нам передали хоть какой-то источник изображения
      if (!req.file && !imageUrl) {
        return res.status(400).json({ error: 'Изображение не найдено. Загрузите файл или передайте image_url' });
      }

      // --- Шаг 0. Определяем источник файла ---
      if (req.file) {
        // Случай А: Юзер загрузил новый файл
        tempFilePath = req.file.path;
        console.log('Определяем источник файла', tempFilePath);
      } else if (imageUrl) {
        // Случай Б: Передан URL уже существующего фото
        console.log('[AI Pipeline] Скачиваем исходное фото по URL:', imageUrl);
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Можно вытащить расширение из URL или по дефолту поставить .jpg
        const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
        tempFilePath = path.join('uploads/temp/', `downloaded-${uniqueSuffix}${ext}`);
        console.log('помещаем временный файл в ', tempFilePath);
        // Скачиваем файл и сохраняем на диск
        const response = await axios({
          url: imageUrl,
          method: 'GET',
          responseType: 'stream'
        });

        await new Promise<void>((resolve, reject) => {
          const writer = fs.createWriteStream(tempFilePath!);
          response.data.pipe(writer);
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        isTempFileDownloaded = true;
      }

      if (!tempFilePath) {
        return res.status(500).json({ error: 'Ошибка инициализации файла для обработки' });
      }

      // --- Шаг 1. Удаляем фон с исходного фото товара ---
      console.log('[AI Pipeline] Удаляем фон...');
      const imageBlob = await removeBackground(tempFilePath);
      const arrayBuffer = await imageBlob.arrayBuffer();
      const transparentBuffer = Buffer.from(arrayBuffer);

      // --- Шаг 2. Ресайз и подготовка прозрачного PNG через Sharp ---
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

      // --- Шаг 3. Генерация нового окружения ---
      console.log('[AI Pipeline] Отправляем в нейросеть для генерации фона...');
      const response = await client.images.edit({
        model: "black-forest-labs/flux.2-klein-4b",
        image: imageFile,
        prompt: `Professional product photography. ${prompt}, highly detailed, photorealistic, 4k, realistic shadows under the object, commercial lighting`,
        n: 1,
        size: "1024x1024",
      });


      if (response.data) {
        const finalImageUrl = response?.data[0]?.b64_json;
        //console.log('response?.data[0]?.url', response?.data[0]?.b64_json);
        const outputFileName = `banner_${Date.now()}.jpg`;
        console.log('Файл загружен успешно по пути', outputFileName);
        let publicUrl = "";

        if (finalImageUrl !== undefined) {
          publicUrl = await this.downloadProductCard(finalImageUrl, outputFileName);
          console.log('publicUrl', publicUrl);
        }
        else{
          console.log('finalImageUrl is undefined');
        }

        res.json({
          success: true,
          imageUrl: publicUrl 
        });
      } else {
        res.status(500).json({ error: 'Нейросеть не вернула данные' });
      }

    } catch (error) {
      console.error('Ошибка пайплайна генерации:', error);
      res.status(500).json({ error: 'Не удалось сгенерировать баннер' });
    } finally {
      // --- Шаг 4. Подчищаем временные файлы, чтобы не забивать диск ---
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          console.log('[AI Pipeline] Временный файл успешно удален:', tempFilePath);
        } catch (unlinkError) {
          console.error('Не удалось удалить временный файл:', unlinkError);
        }
      }
    }
  }

}