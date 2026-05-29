import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import { ValidationError } from './errorHandler';

export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const details = errors.array().map((err) => ({
      field: (err as any).path || (err as any).param,
      message: err.msg,
    }));

    next(new ValidationError('Validation failed', details));
  };
};

export const commonValidations = {
  email: body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),

  phone: body('phone')
    .matches(/^\+?[\d\s-]{10,15}$/)
    .withMessage('Valid phone number required'),

  businessName: body('businessName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be 2-100 characters'),

  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be 1-100'),
  ],

  id: param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Valid ID is required'),
};
