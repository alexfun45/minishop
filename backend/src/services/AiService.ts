// services/aiService.ts
import * as lancedb from "@lancedb/lancedb";
import { YandexGPTEmbeddings } from "@langchain/yandex";
import path from "path";
import fs from "fs";

if (!process.env.YANDEX_API_KEY || !process.env.YANDEX_FOLDER_ID) {
  throw new Error("Missing Yandex API configuration in environment variables");
}

const embeddings = new YandexGPTEmbeddings({
  apiKey: process.env.YANDEX_API_KEY, 
  folderID: process.env.YANDEX_FOLDER_ID,
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
      Название (RU): ${product.name_ru || ''}
      Название (TJ): ${product.name_tj || ''}
      Название (UZ): ${product.name_uz || ''}
      Описание: ${product.description_ru || ''}
      Ингредиенты: ${product.ingredients_ru || ''}
      Цена: ${product.price} TJS
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

}