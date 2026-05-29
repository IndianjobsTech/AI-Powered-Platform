import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AppError, NotFoundError } from '../middleware/errorHandler';
import { prisma } from '../config/prisma';

export const createBusiness = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) throw new AppError('Unauthorized', 401);

    let user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: userId,
          email: req.userEmail || '',
          name: req.body.ownerName,
          phone: req.body.ownerPhone,
        },
      });
    }

    const { name, type, phone, email, address, city, state, pincode, description, website } = req.body;

    const business = await prisma.business.create({
      data: {
        name,
        type,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        description,
        website,
        ownerId: user.id,
      },
    });

    await prisma.aiSettings.create({
      data: { businessId: business.id },
    });

    await prisma.subscription.create({
      data: {
        userId: user.id,
        businessId: business.id,
        planId: 'free',
        planName: 'Free Trial',
        status: 'TRIAL',
      },
    });

    sendCreated(res, business, 'Business created successfully');
  } catch (error) {
    next(error);
  }
};

export const getBusinesses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) throw new AppError('Unauthorized', 401);

    const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    if (!user) throw new NotFoundError('User');

    const businesses = await prisma.business.findMany({
      where: { ownerId: user.id },
      include: {
        aiSettings: true,
        subscription: true,
        _count: {
          select: {
            messages: true,
            leads: true,
            appointments: true,
          },
        },
      },
    });

    sendSuccess(res, { data: businesses });
  } catch (error) {
    next(error);
  }
};

export const getBusiness = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        aiSettings: true,
        subscription: true,
        faqs: { where: { isActive: true }, orderBy: { priority: 'desc' } },
        _count: {
          select: {
            messages: true,
            leads: true,
            appointments: true,
            workflows: true,
          },
        },
      },
    });

    if (!business) throw new NotFoundError('Business');

    sendSuccess(res, { data: business });
  } catch (error) {
    next(error);
  }
};

export const updateBusiness = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    const {
      name, type, description, address, city, state, pincode,
      phone, email, website, logoUrl, businessHours, timezone,
      language, whatsappNumber, isActive,
    } = req.body;

    const business = await prisma.business.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(businessHours !== undefined && { businessHours }),
        ...(timezone !== undefined && { timezone }),
        ...(language !== undefined && { language }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    sendSuccess(res, { data: business, message: 'Business updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteBusiness = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.business.delete({ where: { id } });
    sendSuccess(res, { message: 'Business deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateAiSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const data = req.body;

    const aiSettings = await prisma.aiSettings.upsert({
      where: { businessId },
      update: data,
      create: { businessId, ...data },
    });

    sendSuccess(res, { data: aiSettings, message: 'AI settings updated' });
  } catch (error) {
    next(error);
  }
};

export const getAiSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const aiSettings = await prisma.aiSettings.findUnique({
      where: { businessId },
    });
    if (!aiSettings) throw new NotFoundError('AI Settings');
    sendSuccess(res, { data: aiSettings });
  } catch (error) {
    next(error);
  }
};

export const manageFaqs = {
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { businessId } = req.params as { businessId: string };
      const { question, answer, category, priority } = req.body;
      const faq = await prisma.faq.create({
        data: { businessId, question, answer, category, priority: priority || 0 },
      });
      sendCreated(res, faq, 'FAQ added');
    } catch (error) {
      next(error);
    }
  },

  list: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { businessId } = req.params as { businessId: string };
      const faqs = await prisma.faq.findMany({
        where: { businessId },
        orderBy: { priority: 'desc' },
      });
      sendSuccess(res, { data: faqs });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      const { question, answer, category, priority, isActive } = req.body;
      const faq = await prisma.faq.update({
        where: { id },
        data: { question, answer, category, priority, isActive },
      });
      sendSuccess(res, { data: faq, message: 'FAQ updated' });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      await prisma.faq.delete({ where: { id } });
      sendSuccess(res, { message: 'FAQ deleted' });
    } catch (error) {
      next(error);
    }
  },
};
