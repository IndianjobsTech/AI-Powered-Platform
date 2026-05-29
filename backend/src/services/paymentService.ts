import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env';

interface PlanConfig {
  id: string;
  name: string;
  amount: number; // in INR
  interval: 'monthly' | 'yearly';
  messagesPerDay: number;
  leadsPerMonth: number;
  staffAccounts: number;
  features: string[];
}

export const PLANS: Record<string, PlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    amount: 499,
    interval: 'monthly',
    messagesPerDay: 100,
    leadsPerMonth: 50,
    staffAccounts: 1,
    features: [
      'AI auto-replies',
      'Basic analytics',
      'WhatsApp integration',
      'FAQ management',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    amount: 999,
    interval: 'monthly',
    messagesPerDay: 500,
    leadsPerMonth: 200,
    staffAccounts: 3,
    features: [
      'Everything in Starter',
      'Advanced analytics',
      'Lead scoring',
      'Appointment booking',
      'Multi-language support',
      'Payment reminders',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    amount: 2499,
    interval: 'monthly',
    messagesPerDay: 2000,
    leadsPerMonth: 1000,
    staffAccounts: 10,
    features: [
      'Everything in Growth',
      'Unlimited messages',
      'Custom workflows',
      'Dedicated support',
      'Custom AI training',
      'API access',
      'CRM integration',
    ],
  },
};

export class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: env.RAZORPAY.keyId,
      key_secret: env.RAZORPAY.keySecret,
    });
  }

  async createSubscription(
    planId: string,
    customerEmail: string,
    customerPhone: string
  ) {
    const plan = PLANS[planId];
    if (!plan) throw new Error('Invalid plan');

    try {
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: plan.interval === 'yearly' ? 12 : 12,
        notes: {
          plan_name: plan.name,
          email: customerEmail,
          phone: customerPhone,
        },
      });

      return subscription;
    } catch (error: any) {
      console.error('[Payment] Create subscription error:', error.message);
      throw new Error('Failed to create subscription');
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await this.razorpay.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error: any) {
      console.error('[Payment] Cancel subscription error:', error.message);
      throw new Error('Failed to cancel subscription');
    }
  }

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return expectedSignature === signature;
  }

  async getSubscription(subscriptionId: string) {
    try {
      const subscription = await this.razorpay.subscriptions.fetch(subscriptionId);
      return subscription;
    } catch (error: any) {
      console.error('[Payment] Fetch subscription error:', error.message);
      throw new Error('Failed to fetch subscription');
    }
  }

  async getAllPlans() {
    return Object.entries(PLANS).map(([_id, plan]) => ({
      id: plan.id,
      name: plan.name,
      amount: plan.amount,
      interval: plan.interval,
      messagesPerDay: plan.messagesPerDay,
      leadsPerMonth: plan.leadsPerMonth,
      staffAccounts: plan.staffAccounts,
      features: plan.features,
    }));
  }

  async createOrder(amount: number, currency: string = 'INR') {
    try {
      const order = await this.razorpay.orders.create({
        amount: Math.round(amount * 100), // Razorpay expects paise
        currency,
        receipt: `receipt_${Date.now()}`,
      });
      return order;
    } catch (error: any) {
      console.error('[Payment] Create order error:', error.message);
      throw new Error('Failed to create order');
    }
  }
}

export const paymentService = new PaymentService();
