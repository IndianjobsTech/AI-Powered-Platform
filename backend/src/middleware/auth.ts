import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  businessId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
      });
    }

    const decodedToken = await firebaseAuth.verifyIdToken(token);

    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    req.userRole = decodedToken.role || 'business_owner';

    return next();
  } catch (error: any) {
    console.error('[Auth] Token verification failed:', error.message);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please refresh your session.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
    });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }
    return next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        req.userId = decodedToken.uid;
        req.userEmail = decodedToken.email;
      }
    }
  } catch {
    // Ignore auth errors for optional auth
  }
  return next();
};
