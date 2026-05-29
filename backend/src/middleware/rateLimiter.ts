import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/**
 * Key generator that avoids IPv6 format issues with express-rate-limit v8.
 * Uses x-forwarded-for header first, falls back to a safe local identifier.
 */
const keyGenerator = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ip.trim();
  }
  // Use a connection-based identifier instead of req.ip to avoid IPv6 issues
  const remoteAddr = req.socket?.remoteAddress;
  if (remoteAddr && !remoteAddr.includes(':')) {
    return remoteAddr;
  }
  return `req-${Date.now()}`;
};

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const whatsappLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many WhatsApp requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many API requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});
