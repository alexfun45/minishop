import { SCHEMA_FIELD_TYPE } from 'redis';
import redisClient from './RedisService.js'; // Твой импортированный клиент

export class AICacheService {
  private static INDEX_NAME = 'idx:semantic_ai_cache';
  private static PREFIX = 'semcache:';
  
  // Размерность вектора: 768 для Gemini (text-embedding-004), 1536 для OpenAI
  private static VECTOR_DIMENSION = 3072; 

  /**
   * Инициализация векторного индекса в Redis Stack.
   * Вызывай этот метод один раз при старте приложения (например, в app.ts).
   */
  public static async initIndex() {
    try {
      // Проверяем, существует ли уже индекс
      const indices = await redisClient.ft._list();
      if (indices.includes(this.INDEX_NAME)) {
        console.log(`[AICache] Индекс ${this.INDEX_NAME} уже существует.`);
        return;
      }

      // Создаем индекс для векторного и текстового поиска
      await redisClient.ft.create(
        this.INDEX_NAME,
        {
          // Поле для хранения оригинального вопроса (для отладки)
          'question': {
            type: SCHEMA_FIELD_TYPE.TEXT,
          },
          // Поле для хранения готового ответа Gemini
          'answer': {
            type: SCHEMA_FIELD_TYPE.TEXT,
          },
          // Векторное поле для эмбеддинга вопроса
          'question_vector': {
            type: SCHEMA_FIELD_TYPE.VECTOR,
            ALGORITHM: 'HNSW',
            TYPE: 'FLOAT32',
            DIM: this.VECTOR_DIMENSION,
            DISTANCE_METRIC: 'COSINE',        // Косинусное сходство (оптимально для текстов)
          }
        },
        {
          ON: 'HASH',
          PREFIX: this.PREFIX,
        }
      );
      console.log(`[AICache] Векторный индекс ${this.INDEX_NAME} успешно создан!`);
    } catch (error) {
      console.error('[AICache] Ошибка при создании индекса:', error);
    }
  }

  /**
   * Преобразует числовой массив (эмбеддинг) в бинарный буфер Float32 для Redis.
   */
  private static float32Buffer(vector: number[]): Buffer {
    const floatArray = new Float32Array(vector);
  return Buffer.from(floatArray.buffer, floatArray.byteOffset, floatArray.byteLength);
  }

  /**
   * Поиск ответа в кэше по вектору нового вопроса.
   * @param queryVector Массив чисел (эмбеддинг вопроса от Gemini API)
   * @param threshold Порог сходства. 0.0 - идеальное совпадение, 0.15 - очень близко по смыслу
   */
  public static async get(queryVector: number[], threshold: number = 0.15): Promise<string | null> {
    try {
      const buffer = this.float32Buffer(queryVector);

      // KNN-запрос: ищем 1 ближайшего соседа по векторному полю question_vector
      const result: any = await redisClient.ft.search(
        this.INDEX_NAME,
        '*=>[KNN 1 @question_vector $vec AS score]',
        {
          PARAMS: {
            vec: buffer,
          },
          RETURN: ['question', 'answer', 'score'],
          DIALECT: 2, // Обязательно dialect 2 для поддержки векторных запросов
        }
      );

      if (result?.total === 0) {
        return null;
      }

      const match = result.documents[0];
      const score = parseFloat(match.value.score as string);

      console.log(`[AICache] Найден похожий вопрос: "${match.value.question}" с дистанцией ${score}`);

      // Косинусная дистанция: чем ближе к 0, тем точнее совпадение по смыслу.
      if (score <= threshold) {
        console.log('[AICache] Попадание в кэш! Возвращаем сохраненный ответ.');
        return match.value.answer as string;
      }

      console.log('[AICache] Совпадение найдено, но оно слишком неточное. Идем в Gemini.');
      return null;
    } catch (error) {
      console.error('[AICache] Ошибка при поиске в кэше:', error);
      return null;
    }
  }

  /**
   * Сохранение нового вопроса и ответа в векторный кэш.
   * @param question Текст вопроса пользователя
   * @param queryVector Массив чисел (эмбеддинг вопроса)
   * @param answer Текст ответа, полученного от Gemini
   * @param ttl Время жизни кэша в секундах (по умолчанию 24 часа)
   */
  /**
   * Сохранение ответа в векторный кэш.
   * @param answerObj Объект, содержащий текст ответа, интент и ID товаров
   */
  public static async set(
    question: string,
    queryVector: number[],
    answerObj: { text: string; intent?: string; productIds?: string[] },
    ttl: number = 86400
  ): Promise<void> {
    try {
      const id = Math.random().toString(36).substring(2, 15);
      const key = `${this.PREFIX}${id}`;
      const buffer = this.float32Buffer(queryVector);

      // Сериализуем данные в JSON-строку для хранения внутри Hash
      const serializedAnswer = JSON.stringify({
        text: answerObj.text,
        intent: answerObj.intent || 'general',
        productIds: answerObj.productIds || []
      });

      await redisClient.hSet(key, {
        question: question,
        answer: serializedAnswer, // Храним структурированный JSON
        question_vector: buffer,
      });

      await redisClient.expire(key, ttl);
      console.log(`[AICache] Запрос сохранен в кэш: ${key}`);
    } catch (error) {
      console.error('[AICache] Ошибка при сохранении в кэш:', error);
    }
  }
}
