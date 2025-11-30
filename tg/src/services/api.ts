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
      console.log('🟡 API Client: Sending order to backend');
      console.log('🟡 Order data:', JSON.stringify(orderData, null, 2));
      const response = await axios.post(`${this.baseURL}/api/orders/create`, orderData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      console.log('🟢 API Client: Order created successfully');
      console.log('🟢 Response status:', response.status);
      console.log('🟢 Response data:', response.data);
  
      return response.data;
    } catch (error) {
      console.error('🔴 API Client: Create order error');
      console.error('Create order error:', error);
      if (axios.isAxiosError(error)) {
        console.error('🔴 Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      } else {
        console.error('🔴 Unknown error:', error);
      }
      throw error;
    }
  }

  async getUserOrders(userId: number) {
    try {
      const response = await axios.get(`${this.baseURL}/api/orders?user_id=${userId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Get user orders error:', error);
      return [];
    }
  }

  async getOrderById(orderId: number) {
    try {
      const response = await axios.get(`${this.baseURL}/api/orders/${orderId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Get order by id error:', error);
      return null;
    }
  }
}

export const apiClient = new ApiClient();