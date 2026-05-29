/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getToken(): Promise<string | null> {
    const { auth } = await import('./firebase');
    const user = auth.currentUser;
    if (user) {
      return user.getIdToken();
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'An error occurred',
        response.status,
        data.code
      );
    }

    return data;
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Convenience methods for business endpoints
  async getBusinesses() {
    return this.get<any[]>('/businesses');
  }

  async getBusiness(id: string) {
    return this.get<any>(`/businesses/${id}`);
  }

  async createBusiness(data: any) {
    return this.post<any>('/businesses', data);
  }

  async updateBusiness(id: string, data: any) {
    return this.put<any>(`/businesses/${id}`, data);
  }

  async getMessages(businessId: string, params?: Record<string, string>) {
    return this.get<any[]>(`/businesses/${businessId}/whatsapp/messages`, params);
  }

  async getConversations(businessId: string, params?: Record<string, string>) {
    return this.get<any[]>(`/businesses/${businessId}/whatsapp/conversations`, params);
  }

  async sendMessage(businessId: string, data: { to: string; text: string }) {
    return this.post<any>(`/businesses/${businessId}/whatsapp/send`, data);
  }

  async getLeads(businessId: string, params?: Record<string, string>) {
    return this.get<any[]>(`/businesses/${businessId}/leads`, params);
  }

  async getLeadStats(businessId: string) {
    return this.get<any>(`/businesses/${businessId}/leads/stats`);
  }

  async getAppointments(businessId: string, params?: Record<string, string>) {
    return this.get<any[]>(`/businesses/${businessId}/appointments`, params);
  }

  async getDashboardStats(businessId: string) {
    return this.get<any>(`/businesses/${businessId}/analytics/dashboard`);
  }

  async getPlans() {
    return this.get<any[]>('/plans');
  }

  async createSubscription(businessId: string, planId: string) {
    return this.post<any>(`/businesses/${businessId}/subscription`, { planId });
  }

  async getAiSettings(businessId: string) {
    return this.get<any>(`/businesses/${businessId}/ai-settings`);
  }

  async updateAiSettings(businessId: string, data: any) {
    return this.put<any>(`/businesses/${businessId}/ai-settings`, data);
  }

  async getFaqs(businessId: string) {
    return this.get<any[]>(`/businesses/${businessId}/faqs`);
  }

  async createFaq(businessId: string, data: any) {
    return this.post<any>(`/businesses/${businessId}/faqs`, data);
  }
}

export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const api = new ApiClient(API_BASE_URL);
