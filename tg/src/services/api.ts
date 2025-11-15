// src/bot/services/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getCategories(language: string = 'ru') {
    try {
      const response = await axios.get(`${this.baseURL}/api/categories/${language}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Get categories error:', error);
      return [];
    }
  }

  async getProductsByCategory(categoryId: number, language: string = 'ru') {
    try {
      const response = await axios.get(`${this.baseURL}/api/products/${categoryId}/${language}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Get products by category error:', error);
      return [];
    }
  }

  async getProduct(productId: number, language: string = 'ru') {
    try {
      const response = await axios.get(`${this.baseURL}/api/product/${productId}?lang=${language}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Get product error:', error);
      return null;
    }
  }

  async searchProducts(query: string, language: string = 'ru') {
    try {
      const response = await axios.get(`${this.baseURL}/api/products/search?q=${encodeURIComponent(query)}&lang=${language}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Search products error:', error);
      return [];
    }
  }

  async createOrder(orderData: any) {
    try {
      const response = await axios.post(`${this.baseURL}/api/orders`, orderData);
      return response.data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();