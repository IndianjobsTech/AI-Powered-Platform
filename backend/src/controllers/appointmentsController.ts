import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, paginateResponse } from '../utils/apiResponse';
import { NotFoundError } from '../middleware/errorHandler';
import { prisma } from '../config/prisma';

export const getAppointments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '20'), 10);
    const status = req.query.status as string | undefined;
    const date = req.query.date as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const search = req.query.search as string | undefined;

    const where: Record<string, unknown> = { businessId };
    if (status) where.status = status;
    if (date) {
      const dayStart = new Date(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.date = { gte: dayStart, lt: dayEnd };
    }
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { lead: { select: { id: true, name: true, phone: true } } },
      }),
      prisma.appointment.count({ where }),
    ]);

    paginateResponse(res, appointments, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { lead: true },
    });
    if (!appointment) throw new NotFoundError('Appointment');
    sendSuccess(res, { data: appointment });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const {
      leadId, customerName, customerPhone, customerEmail,
      title, description, date, duration, notes,
    } = req.body;

    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        leadId,
        customerName,
        customerPhone,
        customerEmail,
        title,
        description,
        date: new Date(date),
        duration: duration || 30,
        notes,
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        businessId,
        event: 'appointment_booked',
        properties: { appointmentId: appointment.id, leadId },
      },
    });

    sendCreated(res, appointment, 'Appointment created');
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    const {
      customerName, customerPhone, customerEmail,
      title, description, date, duration, status, notes, reminderSent,
    } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(customerName !== undefined && { customerName }),
        ...(customerPhone !== undefined && { customerPhone }),
        ...(customerEmail !== undefined && { customerEmail }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(duration !== undefined && { duration }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(reminderSent !== undefined && { reminderSent }),
      },
    });

    sendSuccess(res, { data: appointment, message: 'Appointment updated' });
  } catch (error) {
    next(error);
  }
};

export const deleteAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.appointment.delete({ where: { id } });
    sendSuccess(res, { message: 'Appointment deleted' });
  } catch (error) {
    next(error);
  }
};

export const getTodayAppointments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: today, lt: tomorrow },
      },
      orderBy: { date: 'asc' },
      include: { lead: { select: { id: true, name: true, phone: true } } },
    });

    sendSuccess(res, { data: appointments });
  } catch (error) {
    next(error);
  }
};
