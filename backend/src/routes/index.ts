import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { generalLimiter, whatsappLimiter, apiLimiter } from '../middleware/rateLimiter';

import * as businessController from '../controllers/businessController';
import * as whatsappController from '../controllers/whatsappController';
import * as leadsController from '../controllers/leadsController';
import * as appointmentsController from '../controllers/appointmentsController';
import * as analyticsController from '../controllers/analyticsController';
import * as subscriptionController from '../controllers/subscriptionController';
import { validate } from '../middleware/validate';
import { body } from 'express-validator';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Freebuff API is running', timestamp: new Date().toISOString() });
});

// ========== BUSINESS ROUTES ==========
router.post(
  '/businesses',
  authenticate,
  apiLimiter,
  validate([
    body('name').trim().notEmpty().withMessage('Business name is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
  ]),
  businessController.createBusiness
);

router.get('/businesses', authenticate, apiLimiter, businessController.getBusinesses);
router.get('/businesses/:id', authenticate, apiLimiter, businessController.getBusiness);
router.put('/businesses/:id', authenticate, apiLimiter, businessController.updateBusiness);
router.delete('/businesses/:id', authenticate, requireRole('SUPER_ADMIN'), businessController.deleteBusiness);

// AI Settings
router.get('/businesses/:businessId/ai-settings', authenticate, apiLimiter, businessController.getAiSettings);
router.put('/businesses/:businessId/ai-settings', authenticate, apiLimiter, businessController.updateAiSettings);

// FAQs
router.get('/businesses/:businessId/faqs', authenticate, apiLimiter, businessController.manageFaqs.list);
router.post(
  '/businesses/:businessId/faqs',
  authenticate,
  apiLimiter,
  validate([body('question').notEmpty(), body('answer').notEmpty()]),
  businessController.manageFaqs.create
);
router.put('/businesses/:businessId/faqs/:id', authenticate, apiLimiter, businessController.manageFaqs.update);
router.delete('/businesses/:businessId/faqs/:id', authenticate, apiLimiter, businessController.manageFaqs.delete);

// ========== WHATSAPP ROUTES ==========
router.post('/businesses/:businessId/whatsapp/send', authenticate, whatsappLimiter, whatsappController.sendMessage);
router.get('/businesses/:businessId/whatsapp/messages', authenticate, apiLimiter, whatsappController.getMessages);
router.get('/businesses/:businessId/whatsapp/conversations', authenticate, apiLimiter, whatsappController.getConversations);

// WhatsApp Webhook (no auth - called by Meta)
router.get('/whatsapp/webhook', whatsappController.handleWebhook);
router.post('/whatsapp/webhook', whatsappLimiter, whatsappController.handleWebhook);

// ========== LEADS ROUTES ==========
router.get('/businesses/:businessId/leads', authenticate, apiLimiter, leadsController.getLeads);
router.get('/businesses/:businessId/leads/stats', authenticate, apiLimiter, leadsController.getLeadStats);
router.get('/businesses/:businessId/leads/:id', authenticate, apiLimiter, leadsController.getLead);
router.post(
  '/businesses/:businessId/leads',
  authenticate,
  apiLimiter,
  validate([body('phone').notEmpty().withMessage('Phone is required')]),
  leadsController.createLead
);
router.put('/businesses/:businessId/leads/:id', authenticate, apiLimiter, leadsController.updateLead);
router.delete('/businesses/:businessId/leads/:id', authenticate, apiLimiter, leadsController.deleteLead);
router.post('/businesses/:businessId/leads/:id/score', authenticate, apiLimiter, leadsController.scoreLead);

// ========== APPOINTMENT ROUTES ==========
router.get('/businesses/:businessId/appointments', authenticate, apiLimiter, appointmentsController.getAppointments);
router.get('/businesses/:businessId/appointments/today', authenticate, apiLimiter, appointmentsController.getTodayAppointments);
router.get('/businesses/:businessId/appointments/:id', authenticate, apiLimiter, appointmentsController.getAppointment);
router.post(
  '/businesses/:businessId/appointments',
  authenticate,
  apiLimiter,
  validate([
    body('customerName').notEmpty().withMessage('Customer name is required'),
    body('customerPhone').notEmpty().withMessage('Phone is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
  ]),
  appointmentsController.createAppointment
);
router.put('/businesses/:businessId/appointments/:id', authenticate, apiLimiter, appointmentsController.updateAppointment);
router.delete('/businesses/:businessId/appointments/:id', authenticate, apiLimiter, appointmentsController.deleteAppointment);

// ========== ANALYTICS ROUTES ==========
router.get('/businesses/:businessId/analytics/dashboard', authenticate, apiLimiter, analyticsController.getDashboardStats);
router.get('/businesses/:businessId/analytics/messages', authenticate, apiLimiter, analyticsController.getMessageAnalytics);
router.get('/businesses/:businessId/analytics/leads', authenticate, apiLimiter, analyticsController.getLeadAnalytics);
router.get('/businesses/:businessId/analytics/appointments', authenticate, apiLimiter, analyticsController.getAppointmentAnalytics);
router.post('/businesses/:businessId/analytics/track', authenticate, apiLimiter, analyticsController.trackEvent);

// ========== SUBSCRIPTION ROUTES ==========
router.get('/plans', generalLimiter, subscriptionController.getPlans);
router.get('/businesses/:businessId/subscription', authenticate, apiLimiter, subscriptionController.getSubscription);
router.post('/businesses/:businessId/subscription', authenticate, apiLimiter, subscriptionController.createSubscription);
router.post('/businesses/:businessId/subscription/cancel', authenticate, apiLimiter, subscriptionController.cancelSubscription);
router.post('/subscription/webhook/razorpay', subscriptionController.handleRazorpayWebhook);
router.post('/payment/create-order', authenticate, apiLimiter, subscriptionController.createPaymentOrder);
router.post('/payment/verify', authenticate, apiLimiter, subscriptionController.verifyPayment);

export default router;
