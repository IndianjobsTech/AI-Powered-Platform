import axios from 'axios';
import { env } from '../config/env';

interface WhatsAppTextMessage {
  to: string;
  text: string;
  preview_url?: boolean;
}

interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

export class WhatsAppService {
  private apiUrl: string;
  private token: string;
  private phoneNumberId: string;

  constructor() {
    this.apiUrl = env.WHATSAPP.apiUrl;
    this.token = env.WHATSAPP.apiToken;
    this.phoneNumberId = env.WHATSAPP.phoneNumberId;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async sendTextMessage({ to, text, preview_url = false }: WhatsAppTextMessage) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/\D/g, ''),
          type: 'text',
          text: { body: text, preview_url },
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('[WhatsApp] Send text error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to send message');
    }
  }

  async sendTemplateMessage({
    to,
    templateName,
    languageCode = 'en',
    components = [],
  }: WhatsAppTemplateMessage) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('[WhatsApp] Send template error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to send template');
    }
  }

  async markAsRead(messageId: string) {
    try {
      await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        { headers: this.headers }
      );
    } catch (error: any) {
      console.error('[WhatsApp] Mark read error:', error.message);
    }
  }

  async sendInteractiveButtons(to: string, text: string, buttons: Array<{ id: string; title: string }>) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/\D/g, ''),
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text },
            action: {
              buttons: buttons.slice(0, 3).map((btn) => ({
                type: 'reply',
                reply: { id: btn.id, title: btn.title.slice(0, 20) },
              })),
            },
          },
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('[WhatsApp] Send buttons error:', error.response?.data || error.message);
      throw new Error('Failed to send interactive message');
    }
  }

  async sendListMessage(
    to: string,
    header: string,
    body: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>
  ) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/\D/g, ''),
          type: 'interactive',
          interactive: {
            type: 'list',
            header: { type: 'text', text: header.slice(0, 60) },
            body: { text: body.slice(0, 1024) },
            action: {
              button: buttonText.slice(0, 20),
              sections: sections.map((s) => ({
                title: s.title.slice(0, 24),
                rows: s.rows.slice(0, 10).map((r) => ({
                  id: r.id,
                  title: r.title.slice(0, 24),
                  ...(r.description ? { description: r.description.slice(0, 72) } : {}),
                })),
              })),
            },
          },
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('[WhatsApp] Send list error:', error.response?.data || error.message);
      throw new Error('Failed to send list message');
    }
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === env.WHATSAPP.verifyToken) {
      return challenge;
    }
    return null;
  }

  parseWebhookPayload(body: any) {
    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;

      if (!value) return null;

      // Status update
      if (value.statuses) {
        return {
          type: 'status_update',
          data: value.statuses.map((s: any) => ({
            messageId: s.id,
            status: s.status,
            timestamp: s.timestamp,
          })),
        };
      }

      // Incoming message
      if (value.messages) {
        const message = value.messages[0];
        const contact = value.contacts?.[0];

        const base = {
          messageId: message.id,
          from: message.from,
          timestamp: message.timestamp,
          contactName: contact?.profile?.name || 'Unknown',
        };

        if (message.type === 'text') {
          return {
            type: 'text',
            data: { ...base, text: message.text.body },
          };
        }

        if (message.type === 'interactive') {
          const interactive = message.interactive;
          if (interactive.type === 'button_reply') {
            return {
              type: 'button_reply',
              data: {
                ...base,
                buttonId: interactive.button_reply.id,
                buttonTitle: interactive.button_reply.title,
              },
            };
          }
          if (interactive.type === 'list_reply') {
            return {
              type: 'list_reply',
              data: {
                ...base,
                listId: interactive.list_reply.id,
                listTitle: interactive.list_reply.title,
              },
            };
          }
        }

        if (message.type === 'image') {
          return {
            type: 'image',
            data: {
              ...base,
              mediaId: message.image.id,
              mediaUrl: message.image.link,
            },
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[WhatsApp] Parse webhook error:', error);
      return null;
    }
  }
}

export const whatsappService = new WhatsAppService();
