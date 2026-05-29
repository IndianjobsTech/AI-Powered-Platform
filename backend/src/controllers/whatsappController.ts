import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, paginateResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { whatsappService } from '../services/whatsappService';
import { aiService } from '../services/aiService';
import { prisma } from '../config/prisma';

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const { to, text, type = 'text' } = req.body;

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new AppError('Business not found', 404);

    let result: Record<string, unknown> | undefined;
    if (type === 'text') {
      result = await whatsappService.sendTextMessage({ to, text });
    } else {
      throw new AppError('Unsupported message type', 400);
    }

    await prisma.whatsAppMessage.create({
      data: {
        businessId,
        fromNumber: business.whatsappNumber || '',
        toNumber: to,
        content: text,
        direction: 'OUTBOUND',
        status: 'SENT',
        metadata: { waMessageId: (result?.messages as Array<{ id: string }> | undefined)?.[0]?.id },
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        businessId,
        event: 'message_sent',
        properties: { type: 'manual', to },
      },
    });

    sendSuccess(res, { data: result, message: 'Message sent' });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '50'), 10);
    const fromNumber = req.query.fromNumber as string | undefined;
    const status = req.query.status as string | undefined;
    const direction = req.query.direction as string | undefined;

    const where: Record<string, unknown> = { businessId };
    if (fromNumber) where.fromNumber = fromNumber;
    if (status) where.status = status;
    if (direction) where.direction = direction;

    const [messages, total] = await Promise.all([
      prisma.whatsAppMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { lead: { select: { id: true, name: true, phone: true } } },
      }),
      prisma.whatsAppMessage.count({ where }),
    ]);

    paginateResponse(res, messages, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params as { businessId: string };
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '20'), 10);

    const conversations = await prisma.$queryRaw`
      SELECT 
        m.from_number,
        m.to_number,
        m.content,
        m.created_at,
        m.direction,
        m.status,
        l.id as lead_id,
        l.name as lead_name,
        l.status as lead_status
      FROM whatsapp_messages m
      LEFT JOIN leads l ON l.id = m.lead_id
      WHERE m.business_id = ${businessId}
      AND m.created_at IN (
        SELECT MAX(m2.created_at)
        FROM whatsapp_messages m2
        WHERE m2.business_id = ${businessId}
        GROUP BY m2.from_number
      )
      ORDER BY m.created_at DESC
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit}
    `;

    const totalResult = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT from_number) as count
      FROM whatsapp_messages
      WHERE business_id = ${businessId}
    `;
    const total = Number((totalResult as Array<{ count: bigint }>)[0]?.count || 0);

    paginateResponse(res, conversations as any[], total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    if (mode && token) {
      const result = whatsappService.verifyWebhook(mode, token, challenge);
      if (result) {
        res.status(200).send(result);
        return;
      }
      res.status(403).send('Verification failed');
      return;
    }

    const payload = whatsappService.parseWebhookPayload(req.body);
    if (!payload) {
      res.sendStatus(200);
      return;
    }

    if (payload.type === 'text' || payload.type === 'button_reply' || payload.type === 'list_reply') {
      const msgData = payload.data as Record<string, unknown>;
      if (!msgData) {
        res.sendStatus(200);
        return;
      }
      const fromNumber = msgData.from as string;

      const business = await prisma.business.findFirst({
        where: { whatsappNumber: { contains: fromNumber.slice(-10) } },
      });

      if (!business) {
        console.warn(`[Webhook] No business found for number: ${fromNumber}`);
        res.sendStatus(200);
        return;
      }

      await prisma.whatsAppMessage.create({
        data: {
          businessId: business.id,
          fromNumber,
          toNumber: business.whatsappNumber || '',
          content: (msgData.text as string) || (msgData.buttonTitle as string) || (msgData.listTitle as string) || '',
          direction: 'INBOUND',
          status: 'DELIVERED',
          metadata: { waMessageId: msgData.messageId as string | undefined },
        },
      });

      let lead = await prisma.lead.findFirst({
        where: { businessId: business.id, phone: { contains: fromNumber.slice(-10) } },
      });

      if (!lead) {
        lead = await prisma.lead.create({
          data: {
            businessId: business.id,
            phone: fromNumber,
            name: (msgData.contactName as string) || 'Unknown',
            source: 'whatsapp',
          },
        });
      }

      const aiSettings = await prisma.aiSettings.findUnique({
        where: { businessId: business.id },
      });

      const faqs = await prisma.faq.findMany({
        where: { businessId: business.id, isActive: true },
        orderBy: { priority: 'desc' },
        take: 15,
      });

      if (aiSettings?.autoReplyEnabled && msgData.text) {
        const aiReply = await aiService.generateReply(
          msgData.text as string,
          (msgData.contactName as string) || 'Customer',
          {
            businessName: business.name,
            businessType: business.type,
            businessHours: business.businessHours,
            tone: aiSettings.tone,
            faqs: faqs.map((f) => ({ question: f.question, answer: f.answer })),
            language: aiSettings.language,
            customPrompt: aiSettings.customPrompt || undefined,
            maxTokens: aiSettings.maxResponseLength,
            temperature: aiSettings.temperature,
          }
        );

        if (!aiReply.shouldEscalate) {
          await whatsappService.sendTextMessage({
            to: fromNumber,
            text: aiReply.reply,
          });

          await prisma.whatsAppMessage.create({
            data: {
              businessId: business.id,
              fromNumber: business.whatsappNumber || '',
              toNumber: fromNumber,
              content: aiReply.reply,
              direction: 'OUTBOUND',
              status: 'SENT',
              isAiGenerated: true,
              leadId: lead.id,
              metadata: { intent: aiReply.intent },
            },
          });

          if (aiReply.intent === 'booking' || aiReply.intent === 'lead') {
            await prisma.lead.update({
              where: { id: lead.id },
              data: { status: 'CONTACTED', lastContactedAt: new Date() },
            });
          }
        }
      }

      await prisma.analyticsEvent.create({
        data: {
          businessId: business.id,
          event: 'message_received',
          properties: {
            from: fromNumber,
            intent: payload.type,
            leadId: lead.id,
          },
        },
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
    res.sendStatus(200);
  }
};
