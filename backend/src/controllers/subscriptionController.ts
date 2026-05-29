import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/apiResponse';
import { AppError, NotFoundError } from '../middleware/errorHandler';
import { paymentService, PLANS } from '../services/paymentService';
import { prisma } from '../config/prisma';

export const getPlans = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const plans = await paymentService.getAllPlans();
    sendSuccess(res, { data: plans });
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
    });
    if (!subscription) throw new NotFoundError('Subscription');
    sendSuccess(res, { data: subscription });
  } catch (error) {
    next(error);
  }
};

export const createSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const { planId } = req.body;

    if (!PLANS[planId]) throw new AppError('Invalid plan', 400);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.userId! },
    });
    if (!user) throw new NotFoundError('User');

    const razorpaySubscription = await paymentService.createSubscription(
      planId,
      user.email,
      user.phone || ''
    ) as unknown as Record<string, unknown>;

    const now = Date.now();
    const currentStart = (razorpaySubscription.current_start as number) ?? Math.floor(now / 1000);
    const currentEnd = (razorpaySubscription.current_end as number) ?? Math.floor(now / 1000) + 2592000;

    const subscription = await prisma.subscription.upsert({
      where: { businessId },
      update: {
        razorpaySubscriptionId: razorpaySubscription.id as string,
        planId,
        planName: PLANS[planId].name,
        status: 'ACTIVE',
        amount: PLANS[planId].amount,
        currentPeriodStart: new Date(currentStart * 1000),
        currentPeriodEnd: new Date(currentEnd * 1000),
      },
      create: {
        userId: user.id,
        businessId,
        razorpaySubscriptionId: razorpaySubscription.id as string,
        planId,
        planName: PLANS[planId].name,
        status: 'ACTIVE',
        amount: PLANS[planId].amount,
        currentPeriodStart: new Date(currentStart * 1000),
        currentPeriodEnd: new Date(currentEnd * 1000),
      },
    });

    sendSuccess(res, {
      data: {
        subscription,
        razorpaySubscriptionId: razorpaySubscription.id as string,
        shortUrl: razorpaySubscription.short_url as string,
      },
      message: 'Subscription created',
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };

    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
    });
    if (!subscription) throw new NotFoundError('Subscription');

    if (subscription.razorpaySubscriptionId) {
      await paymentService.cancelSubscription(subscription.razorpaySubscriptionId);
    }

    await prisma.subscription.update({
      where: { businessId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    sendSuccess(res, { message: 'Subscription cancelled' });
  } catch (error) {
    next(error);
  }
};

export const handleRazorpayWebhook = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const event = req.body.event;
    const subscriptionId = req.body.payload?.subscription?.entity?.id;

    if (!subscriptionId) {
      res.sendStatus(200);
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: { razorpaySubscriptionId: subscriptionId },
    });

    if (!subscription) {
      res.sendStatus(200);
      return;
    }

    switch (event) {
      case 'subscription.activated':
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'ACTIVE' },
        });
        break;
      case 'subscription.completed':
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' },
        });
        break;
      case 'subscription.pending':
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'PAUSED' },
        });
        break;
      case 'subscription.halted':
      case 'subscription.cancelled':
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
        break;
      default:
        break;
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Razorpay Webhook] Error:', error);
    res.sendStatus(200);
  }
};

export const createPaymentOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    if (!amount || amount < 1) throw new AppError('Invalid amount', 400);

    const order = await paymentService.createOrder(amount, currency);
    sendSuccess(res, { data: order });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const isValid = await paymentService.verifyPayment(orderId, paymentId, signature);

    if (!isValid) throw new AppError('Payment verification failed', 400);

    sendSuccess(res, { data: { verified: true }, message: 'Payment verified' });
  } catch (error) {
    next(error);
  }
};
