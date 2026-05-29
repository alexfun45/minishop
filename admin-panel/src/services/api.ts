// services/api.ts
//const API_BASE = 'http://localhost:3001/admin';
//const API_BASE = `http://${window.location.hostname}:3001/admin`;

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${import.meta.env.VITE_API_BASE}${endpoint}`;

    const headers: HeadersInit = {
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      headers: {
        ...headers,
        ...options.headers,
      },
      ...options,
    };

    console.log('API Request:', {
      url,
      method: config.method,
      bodyType: options.body instanceof FormData ? 'FormData' : 'JSON',
      hasFile: options.body instanceof FormData ? 'Yes' : 'No'
    });

    const response = await fetch(url, config);
    
    if (!response.ok) {
      let serverErrorData;
      try {
        // Пытаемся прочитать JSON с ошибкой, который прислал бэкенд
        serverErrorData = await response.json();
      } catch (e) {
        // Если бэк вернул ошибку не в формате JSON
        serverErrorData = null;
      }
    
      // Создаем объект ошибки
      const error: any = new Error(`API error: ${response.status}`);
      // Кладим внутрь данные от сервера, чтобы их можно было прочитать на фронте
      error.responseData = serverErrorData; 
      error.status = response.status;
    
      throw error;
    }

    return response.json();
  }

  async get(endpoint: string) {
    return this.request(endpoint);
  }

  async post(endpoint: string, data?: any | null, options?: any | null) {
   
    const body = (data) ? (data instanceof FormData ? data : JSON.stringify(data)) : "";
   
    return await this.request(endpoint, {
      method: 'POST',
      body: body,
      ...options
    });
  }

  async put(endpoint: string, data: any | undefined = null, options: RequestInit = {}) {
    //const body = data instanceof FormData ? data : JSON.stringify(data);
    const body = (data) ? (data instanceof FormData ? data : JSON.stringify(data)) : "";
    return this.request(endpoint, {
      method: 'PUT',
      body: body,
      ...options
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();