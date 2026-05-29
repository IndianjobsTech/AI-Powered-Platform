import { Request } from 'express';
import { UserRole, BusinessType, LeadStatus, AppointmentStatus, MessageDirection, MessageStatus, SubscriptionStatus } from '@prisma/client';

// ========== AUTH ==========
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  businessId?: string;
}

// ========== API ==========
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  code?: string;
  details?: Array<{ field: string; message: string }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ========== BUSINESS ==========
export interface BusinessCreateInput {
  name: string;
  type: BusinessType;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  description?: string;
  website?: string;
  ownerName?: string;
  ownerPhone?: string;
}

// ========== WHATSAPP ==========
export interface WhatsAppMessagePayload {
  to: string;
  text: string;
  type?: 'text' | 'template' | 'interactive';
  preview_url?: boolean;
}

export interface WebhookPayload {
  type: 'text' | 'button_reply' | 'list_reply' | 'image' | 'status_update';
  data: any;
}

// ========== AI ==========
export interface AIResponseOptions {
  businessName: string;
  businessType: string;
  businessHours: any;
  tone: string;
  faqs: Array<{ question: string; answer: string }>;
  language: string;
  customPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  fallbackMessage?: string;
}

export interface AIResponse {
  reply: string;
  intent: string;
  shouldEscalate: boolean;
}

// ========== PAYMENT ==========
export interface PlanConfig {
  id: string;
  name: string;
  amount: number;
  interval: 'monthly' | 'yearly';
  messagesPerDay: number;
  leadsPerMonth: number;
  staffAccounts: number;
  features: string[];
}

// ========== ANALYTICS ==========
export interface DashboardStats {
  overview: {
    totalMessages: number;
    todayMessages: number;
    totalLeads: number;
    newLeadsThisMonth: number;
    totalAppointments: number;
    todayAppointments: number;
    activeWorkflows: number;
  };
  upcomingAppointments: Array<{
    id: string;
    customerName: string;
    title: string;
    date: Date;
    status: string;
  }>;
}

// Re-export Prisma enums for convenience
export { UserRole, BusinessType, LeadStatus, AppointmentStatus, MessageDirection, MessageStatus, SubscriptionStatus };
