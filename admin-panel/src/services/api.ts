// services/api.ts
const API_BASE = 'http://localhost:3001/admin';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;

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
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async get(endpoint: string) {
    return this.request(endpoint);
  }

  async post(endpoint: string, data?: any | null, options?: any | null) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request(endpoint, {
      method: 'POST',
      body: body,
      ...options
    });
  }

  async put(endpoint: string, data: any, options: RequestInit = {}) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
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