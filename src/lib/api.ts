const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // 初始化时从 localStorage 获取 token
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        throw new Error(errorData.error || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{
      user: any;
      token: string;
      message: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(response.token);
    return response;
  }

  async register(email: string, username: string, password: string) {
    const response = await this.request<{
      user: any;
      token: string;
      message: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
    
    this.setToken(response.token);
    return response;
  }

  async verifyToken() {
    return this.request<{ user: any }>('/auth/verify');
  }

  async refreshToken() {
    const response = await this.request<{ token: string }>('/auth/refresh', {
      method: 'POST',
    });
    
    this.setToken(response.token);
    return response;
  }

  logout() {
    this.setToken(null);
  }

  // Image endpoints
  async getImages(params: {
    page?: number;
    limit?: number;
    search?: string;
    tag?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    const query = searchParams.toString();
    return this.request<{
      images: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/images${query ? `?${query}` : ''}`);
  }

  async getImage(id: string) {
    return this.request<any>(`/images/${id}`);
  }

  async uploadImage(formData: FormData) {
    const url = `${this.baseURL}/images/upload`;
    const headers: HeadersInit = {};

    if (this.token) {
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(errorData.error || 'Upload failed');
    }

    return await response.json();
  }

  async updateImage(id: string, data: {
    title?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
  }) {
    return this.request<{ message: string; image: any }>(`/images/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteImage(id: string) {
    return this.request<{ message: string }>(`/images/${id}`, {
      method: 'DELETE',
    });
  }

  async getTags() {
    return this.request<{ tags: any[] }>('/images/tags/all');
  }

  // User endpoints
  async getProfile() {
    return this.request<{ user: any }>('/users/profile');
  }

  async updateProfile(data: { username: string; email: string; bio?: string }) {
    return this.request<{ message: string; user: any }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request<{ message: string }>('/users/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserStats() {
    return this.request<{
      totalImages: number;
      storageUsed: string;
      storageLimit: string;
      storagePercentage: number;
      recentUploads: number;
      recentStorage: number;
    }>('/users/stats');
  }

  // Admin endpoints
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    const query = searchParams.toString();
    return this.request<{
      users: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/users/admin/users${query ? `?${query}` : ''}`);
  }

  async updateUserRole(userId: string, role: string) {
    return this.request<{ message: string; user: any }>(`/users/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async updateUserStatus(userId: string, status: string) {
    return this.request<{ message: string; user: any }>(`/users/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteUser(userId: string) {
    return this.request<{ message: string }>(`/users/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getAdminStats() {
    return this.request<{
      totalUsers: number;
      activeUsers: number;
      totalImages: number;
      totalStorage: string;
      recentUsers: any[];
      recentImages: any[];
    }>('/users/admin/stats');
  }

  async getAllImages(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    const query = searchParams.toString();
    return this.request<{
      images: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/images/admin${query ? `?${query}` : ''}`);
  }

  async deleteImageAdmin(imageId: string) {
    return this.request<{ message: string }>(`/images/admin/${imageId}`, {
      method: 'DELETE',
    });
  }

  async hideImage(imageId: string) {
    return this.request<{ message: string; image: any }>(`/images/${imageId}/hide`, {
      method: 'PUT',
    });
  }

  // System Settings endpoints
  async getPublicSettings() {
    return this.request<{
      allowUserRegistration: boolean;
      siteName: string;
      siteDescription: string;
    }>('/settings/public');
  }

  async getSystemSettings() {
    return this.request<Record<string, any>>('/settings');
  }

  async updateSystemSettings(settings: Record<string, any>) {
    return this.request<{ message: string }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getSystemSetting(key: string) {
    return this.request<Record<string, any>>(`/settings/${key}`);
  }

  async initSystemSettings() {
    return this.request<{ message: string }>('/settings/init', {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;