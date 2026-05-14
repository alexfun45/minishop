import { getTranslation } from '../types.js';
import type {BotContext} from '../types.js';
import { apiClient } from '../services/api.js';
import {showProduct, addToCart} from '../logic/products.js'

export async function ProductsHandler(ctx: BotContext, data?: string): Promise<void> {
  const { bot, chatId, session} = ctx;
  if (data && data.startsWith('product_')){
    const productId = parseInt(data.replace('product_', ''));
    await show_product(ctx, productId);
    return;
  }

  if (data && data.startsWith('add_to_cart_')) {
    const productId = parseInt(data.replace('add_to_cart_', ''));
    const product = await apiClient.getProduct(productId, session.language);
    await addToCart(ctx, product);
    return;
  }
}

async function show_product(ctx: BotContext, productId: number): Promise<void> {
  const { bot, chatId, session } = ctx;

  try {
    const product = await apiClient.getProduct(productId, session.language);
    showProduct(ctx, product);
  } catch(error){
    console.error('Products error:', error);
    await bot.sendMessage(chatId, getTranslation(session, 'error'));
  }
}
