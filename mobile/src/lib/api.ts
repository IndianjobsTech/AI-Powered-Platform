import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // Business
  getBusinesses: () => apiClient.get('/businesses'),
  createBusiness: (data: any) => apiClient.post('/businesses', data),
  getBusiness: (id: string) => apiClient.get(`/businesses/${id}`),
  updateBusiness: (id: string, data: any) => apiClient.put(`/businesses/${id}`, data),

  // WhatsApp
  getConversations: (businessId: string) =>
    apiClient.get(`/businesses/${businessId}/whatsapp/conversations`),
  getMessages: (businessId: string, params?: any) =>
    apiClient.get(`/businesses/${businessId}/whatsapp/messages`, { params }),
  sendMessage: (businessId: string, data: { to: string; text: string }) =>
    apiClient.post(`/businesses/${businessId}/whatsapp/send`, data),

  // Leads
  getLeads: (businessId: string, params?: any) =>
    apiClient.get(`/businesses/${businessId}/leads`, { params }),
  getLeadStats: (businessId: string) =>
    apiClient.get(`/businesses/${businessId}/leads/stats`),
  updateLead: (businessId: string, id: string, data: any) =>
    apiClient.put(`/businesses/${businessId}/leads/${id}`, data),

  // Appointments
  getAppointments: (businessId: string, params?: any) =>
    apiClient.get(`/businesses/${businessId}/appointments`, { params }),

  // Analytics
  getDashboardStats: (businessId: string) =>
    apiClient.get(`/businesses/${businessId}/analytics/dashboard`),

  // AI Settings
  getAiSettings: (businessId: string) =>
    apiClient.get(`/businesses/${businessId}/ai-settings`),
  updateAiSettings: (businessId: string, data: any) =>
    apiClient.put(`/businesses/${businessId}/ai-settings`, data),

  // FAQs
  getFaqs: (businessId: string) =>
    apiClient.get(`/businesses/${businessId}/faqs`),
  createFaq: (businessId: string, data: any) =>
    apiClient.post(`/businesses/${businessId}/faqs`, data),

  // Subscription
  getPlans: () => apiClient.get('/plans'),
  getSubscription: (businessId: string) =>
    apiClient.get(`/businesses/${businessId}/subscription`),
};

export default api;
