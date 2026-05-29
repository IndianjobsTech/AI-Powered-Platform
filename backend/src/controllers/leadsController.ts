import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, paginateResponse } from '../utils/apiResponse';
import { NotFoundError } from '../middleware/errorHandler';
import { aiService } from '../services/aiService';
import { prisma } from '../config/prisma';

export const getLeads = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '20'), 10);
    const status = req.query.status as string | undefined;
    const source = req.query.source as string | undefined;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const where: Record<string, unknown> = { businessId };
    if (status) where.status = status;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { messages: true, appointments: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    paginateResponse(res, leads, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'desc' as const }, take: 50 },
        appointments: { orderBy: { date: 'desc' as const }, take: 10 },
      },
    });
    if (!lead) throw new NotFoundError('Lead');
    sendSuccess(res, { data: lead });
  } catch (error) {
    next(error);
  }
};

export const createLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const { name, phone, email, source, notes, customFields } = req.body;

    const existing = await prisma.lead.findFirst({
      where: { businessId, phone: { contains: phone.slice(-10) } },
    });
    if (existing) {
      sendSuccess(res, { data: existing, message: 'Lead already exists' });
      return;
    }

    const lead = await prisma.lead.create({
      data: { businessId, name, phone, email, source, notes, customFields },
    });

    await prisma.analyticsEvent.create({
      data: { businessId, event: 'lead_captured', properties: { leadId: lead.id, source } },
    });

    sendCreated(res, lead, 'Lead created');
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    const { name, email, status, score, notes, customFields } = req.body;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(status !== undefined && { status }),
        ...(score !== undefined && { score }),
        ...(notes !== undefined && { notes }),
        ...(customFields !== undefined && { customFields }),
        ...(status === 'CONVERTED' ? { convertedAt: new Date() } : {}),
      },
    });

    if (status === 'CONVERTED') {
      await prisma.analyticsEvent.create({
        data: { businessId: lead.businessId, event: 'lead_converted', properties: { leadId: id } },
      });
    }

    sendSuccess(res, { data: lead, message: 'Lead updated' });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.lead.delete({ where: { id } });
    sendSuccess(res, { message: 'Lead deleted' });
  } catch (error) {
    next(error);
  }
};

export const scoreLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!lead) throw new NotFoundError('Lead');

    const leadWithMessages = lead as unknown as { messages: Array<{ direction: string; content: string }> };
    const conversation = leadWithMessages.messages
      .map((m: { direction: string; content: string }) => `${m.direction === 'INBOUND' ? 'Customer' : 'Business'}: ${m.content}`)
      .join('\n');

    const score = await aiService.generateLeadScore(conversation, lead.phone);

    await prisma.lead.update({ where: { id }, data: { score } });

    sendSuccess(res, { data: { score }, message: 'Lead scored' });
  } catch (error) {
    next(error);
  }
};

export const getLeadStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };

    const [total, byStatus, bySource] = await Promise.all([
      prisma.lead.count({ where: { businessId } }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { businessId },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ['source'],
        where: { businessId },
        _count: true,
      }),
    ]);

    sendSuccess(res, {
      data: {
        total,
        byStatus: byStatus.reduce((acc: Record<string, number>, s) => {
          acc[s.status] = s._count;
          return acc;
        }, {} as Record<string, number>),
        bySource: bySource.reduce((acc: Record<string, number>, s) => {
          acc[s.source || 'unknown'] = s._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    next(error);
  }
};
