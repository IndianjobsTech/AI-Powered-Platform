import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/apiResponse';
import { prisma } from '../config/prisma';

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const thisWeekStart = new Date(todayStart);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalMessages,
      todayMessages,
      totalLeads,
      newLeadsThisMonth,
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      activeWorkflows,
    ] = await Promise.all([
      prisma.whatsAppMessage.count({ where: { businessId } }),
      prisma.whatsAppMessage.count({
        where: { businessId, createdAt: { gte: todayStart } },
      }),
      prisma.lead.count({ where: { businessId } }),
      prisma.lead.count({
        where: { businessId, createdAt: { gte: thisMonthStart } },
      }),
      prisma.appointment.count({ where: { businessId } }),
      prisma.appointment.count({
        where: { businessId, date: { gte: todayStart }, status: { not: 'CANCELLED' } },
      }),
      prisma.appointment.findMany({
        where: {
          businessId,
          date: { gte: todayStart },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        orderBy: { date: 'asc' },
        take: 5,
        select: { id: true, customerName: true, title: true, date: true, status: true },
      }),
      prisma.workflow.count({ where: { businessId, isActive: true } }),
    ]);

    sendSuccess(res, {
      data: {
        overview: {
          totalMessages,
          todayMessages,
          totalLeads,
          newLeadsThisMonth,
          totalAppointments,
          todayAppointments,
          activeWorkflows,
        },
        upcomingAppointments,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMessageAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const days = parseInt(String(req.query.days || '30'), 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const messagesByDay = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        direction
      FROM whatsapp_messages
      WHERE business_id = ${businessId}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at), direction
      ORDER BY date ASC
    `;

    const totalInbound = await prisma.whatsAppMessage.count({
      where: { businessId, direction: 'INBOUND', createdAt: { gte: startDate } },
    });

    const autoResponded = await prisma.whatsAppMessage.count({
      where: { businessId, direction: 'OUTBOUND', isAiGenerated: true, createdAt: { gte: startDate } },
    });

    sendSuccess(res, {
      data: {
        messagesByDay,
        responseRate: totalInbound > 0 ? Math.round((autoResponded / totalInbound) * 100) : 0,
        totalInbound,
        autoResponded,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const days = parseInt(String(req.query.days || '30'), 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      where: { businessId, createdAt: { gte: startDate } },
      _count: true,
    });

    const leadsByDay = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM leads
      WHERE business_id = ${businessId}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const totalLeads = (leadsByStatus as any[]).reduce((sum: number, s: any) => sum + s._count, 0);
    const converted = (leadsByStatus as any[]).find((s: any) => s.status === 'CONVERTED');
    const conversionRate = totalLeads > 0 ? Math.round(((converted?._count || 0) / totalLeads) * 100) : 0;

    sendSuccess(res, {
      data: {
        leadsByStatus,
        leadsByDay,
        conversionRate,
        totalLeads,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const days = parseInt(String(req.query.days || '30'), 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const appointmentsByDay = await prisma.$queryRaw`
      SELECT 
        DATE(date) as date,
        COUNT(*) as count,
        status
      FROM appointments
      WHERE business_id = ${businessId}
        AND created_at >= ${startDate}
      GROUP BY DATE(date), status
      ORDER BY date ASC
    `;

    const [total, completed, cancelled, noShow] = await Promise.all([
      prisma.appointment.count({ where: { businessId, createdAt: { gte: startDate } } }),
      prisma.appointment.count({ where: { businessId, status: 'COMPLETED', createdAt: { gte: startDate } } }),
      prisma.appointment.count({ where: { businessId, status: 'CANCELLED', createdAt: { gte: startDate } } }),
      prisma.appointment.count({ where: { businessId, status: 'NO_SHOW', createdAt: { gte: startDate } } }),
    ]);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    sendSuccess(res, {
      data: {
        appointmentsByDay,
        total,
        completed,
        cancelled,
        noShow,
        completionRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const trackEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const { event, properties } = req.body;

    await prisma.analyticsEvent.create({
      data: { businessId, event, properties },
    });

    sendSuccess(res, { message: 'Event tracked' });
  } catch (error) {
    next(error);
  }
};
