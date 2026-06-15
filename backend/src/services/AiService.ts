import * as lancedb from "@lancedb/lancedb";
import type { Request, Response } from 'express';
import { YandexGPTEmbeddings } from "@langchain/yandex";
import { OpenAIEmbeddings } from "@langchain/openai";
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
import axios from "axios";

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
  productIds: z.array(z.string()).nullable().optional()
  .describe("Массив артикулов товаров (только цифры/ID), которые подходят под запрос пользователя и упомянуты в ответе text. Если ничего не найдено или не применимо — пустой массив или null"),
  quantity: z.number().nullable().optional().default(1)
    .describe("Количество товара, которое упомянул пользователь или null, если не применимо"),
  text: z.string()
    .describe("Твой вежливый ответ пользователю на русском языке")
});

// 1. Создаем парсер на основе твоей Zod-схемы
const parser = StructuredOutputParser.fromZodSchema(responseSchema);

const model = new ChatOpenAI({
  apiKey: process.env.AITUNNEL_API_KEY,
  configuration: {
    baseURL: "https://api.aitunnel.ru/v1/",
  },
  model: "gemini-2.5-flash-lite",
  temperature: 0,
});

const template = PromptTemplate.fromTemplate(`
Вы — умный ИИ-продавец в чате интернет-магазина. Отвечай строго по заданнму контексту ничего не придумывая
Ваша задача — внимательно изучить товары в Контексте и ответить на вопрос пользователя.
Прежде чем отвечать, просканируй список товаров. Если товара, который ищет пользователь нет в спсике товаров, вежливо сообщи что такого товара нет.

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

/*const embeddings = new YandexGPTEmbeddings({
  apiKey: process.env.YC_API_KEY, 
  folderID: process.env.YC_FOLDER_ID,
  model: "text-search-doc",
});*/

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.AITUNNEL_API_KEY,
  model: "gemini-embedding-001",
  configuration: {
    baseURL: "https://api.aitunnel.ru/v1/"
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
      //const vectors = await embeddings.embedDocuments([contextText]);
      let embedding: number[] = [];
      const response  = await client.embeddings.create({
        model: 'gemini-embedding-001',
        input: contextText
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
    let productsForFrontend: any[] = [];
    const userId = postdata.userId;
    const userQuery = postdata.message;
    const directIntent = postdata.payload?.directIntent; 
    const directProductId = postdata.payload?.productId;
    
    console.log('postdata', postdata);

    const sessionData = await redis.get(`session:${userId}`);
    const session = sessionData ? JSON.parse(sessionData) : { cart: [], chat: [], pendingItem: null, lastViewedProductId: null };
    
    if (directIntent === 'add_to_cart' && directProductId) {
      // Формируем фейковый ответ ИИ-структуризатора, имитируя, что сеть сама всё поняла
      const fakeAiRes = {
        intent: 'add_to_cart',
        productId: directProductId,
        quantity: 1,
        text: `Конечно! Добавляю в корзину.`
      };
  
      // Вызываем вашу стандартную бизнес-логику добавления
      const intentResult = await this.handleIntent(session, fakeAiRes);
      
      // Сохраняем лог в историю чата
      session.chat.push(`Human: ${userQuery}`, `AI: ${intentResult?.message || fakeAiRes.text}`);
      await redis.set(`session:${userId}`, JSON.stringify(session));
  
      // Вытягиваем инфо о товаре, чтобы вернуть карточку обратно на фронтенд
      const productInfo = await productService.findById(directProductId);
  
      return res.json({
        success: true,
        data: {
          intent: 'add_to_cart',
          text: intentResult?.message || fakeAiRes.text,
          products: productInfo ? [productInfo] : []
        },
      });
    }

    const context = await AiService.searchProducts(userQuery);
    //console.log('search', context);

    const chatHistory = this.getChatHistoryString(session);
    //console.log('chatHistory', chatHistory);
    const formattedContext = Array.isArray(context)
      ? context.map(item => ('text:'+item.text+' productId:' + item.id)).join('\n\n---\n\n')
      : '';
    //console.log('formattedContext', formattedContext);
    // Формируем промпт, подмешивая инструкции от парсера
    const prompt = await template.invoke({
      context: formattedContext,
      chat_history: chatHistory,
      question: userQuery,
      format_instructions: parser.getFormatInstructions(),
    });

    try {
      
      const aiResRaw = await model.invoke(prompt);
      console.log('aiResRaw', aiResRaw);
      // Парсим ответ Яндекса в JS-объект, валидируя через Zod
      const textContent = typeof aiResRaw.text === 'string' 
        ? aiResRaw.text 
        : JSON.stringify(aiResRaw.content);

      const aiRes = await parser.parse(textContent);
      


      session.chat.push(`Human: ${userQuery}`, `AI: ${aiRes.text}`);
      
      const intentResult = await this.handleIntent(session, aiRes);

      if (aiRes.productIds && aiRes.productIds.length > 0) {
        for (const idStr of aiRes.productIds) {
          const pInfo = await productService.findById(parseInt(idStr));
          if (pInfo) {
            productsForFrontend.push({
              id: pInfo.id,
              name_ru: pInfo.name_ru,
              price: pInfo.price,
              image_url: pInfo.image_url,
              description_ru: pInfo.description_ru
            });
          }
        }
      } else if (aiRes.intent === 'search' && Array.isArray(context)) {
        // Если это был поиск, но модель не выбрала один конкретный ID, 
        // выкатим топ-2 товара из векторного поиска LanceDB, которые мы передавали в контекст
        // Предполагается, что в LanceDB лежат нужные поля или мы добираем их через productService
        for (const item of context.slice(0, 2)) {
          const pInfo = await productService.findById(item.productId);
          if (pInfo) {
            productsForFrontend.push({
              id: pInfo.id,
              name_ru: pInfo.name_ru,
              price: pInfo.price,
              image_url: pInfo.image_url,
              description_ru: pInfo.description_ru
            });
          }
        }
      }

      await redis.set(`session:${userId}`, JSON.stringify(session));
      // Дальше твоя логика работает как раньше
      res.json({
        success: true,
        data: {
          ...aiRes,
          text: intentResult?.message || aiRes.text,
          products: productsForFrontend
        },
      });
      //return this.handleIntent(session, aiRes);
      
    } catch (error) {
      console.error("Ошибка парсинга или вызова модели:", error);
      return { message: "Извините, произошла ошибка при обработке запроса." };
    }
  }

  async handleIntent(session: UserSession, aiRes: any) {
    const { intent, productIds, quantity, text } = aiRes;
   
    const firstProductId = productIds && productIds.length > 0 ? productIds[0] : null;

    if (firstProductId) {
      session.lastViewedProductId = firstProductId;
    }

    switch (intent) {
      case 'add_to_cart':
        // Запоминаем, что пользователь ХОЧЕТ добавить, но ждем подтверждения
        if (!firstProductId) {
          return { message: "Уточните, пожалуйста, какой именно товар вы хотите добавить?" };
        }
        const productInfo = await productService.findById(parseInt(firstProductId));

        if (productInfo === null) {
          return { message: "К сожалению, этот товар сейчас недоступен для заказа." };
        }

        session.pendingAction = { 
          type: 'ADD', 
          productId: firstProductId, 
          name: productInfo.name_ru, 
          price: productInfo.price, 
          quantity: quantity || 1 
        };
        session.cart.push(session.pendingAction);
        session.pendingAction = null;
        return { message: text };
        
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

  public async genDescription(name: string, ingredients: string) {
    const ingrd = (ingredients) ? ingredients : '';
    const completion: any = await client.chat.completions.create({
      model: 'gemini-2.5-flash-lite',
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
      model: 'gemini-2.5-flash-lite',
      messages: [
        { role: "system", content: "Ты — помощник для заполнения карточек товаров. Верни результат строго в JSON формате с ключами: name_ru, price, weight, ingredients_ru, description_ru." },
        { role: "user", content: `Заполни данные товара на основе: ${prompt}` }
      ],
      response_format: { type: "json_object" }
    });
    
    //return JSON.parse(completion.choices[0].message.content);
    if(completion.choices[0]){
      return JSON.parse(completion.choices[0].message.content);
    }
    else{
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
      } else if (imageUrl) {
        // Случай Б: Передан URL уже существующего фото
        console.log('[AI Pipeline] Скачиваем исходное фото по URL:', imageUrl);
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Можно вытащить расширение из URL или по дефолту поставить .jpg
        const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
        tempFilePath = path.join('uploads/temp/', `downloaded-${uniqueSuffix}${ext}`);

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
        model: "flux.2-klein-4b", 
        image: imageFile,
        prompt: `Professional product photography. ${prompt}, highly detailed, photorealistic, 4k, realistic shadows under the object, commercial lighting`,
        n: 1,
        size: "1024x1024",
      });

      if (response.data) {
        const finalImageUrl = response?.data[0]?.url;
        const outputFileName = `banner_${Date.now()}.jpg`;
        let publicUrl = "";

        if (finalImageUrl !== undefined) {
          publicUrl = await this.downloadProductCard(finalImageUrl, outputFileName);
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