import OpenAI from 'openai';
import { env } from '../config/env';

interface AIResponseOptions {
  businessName: string;
  businessType: string;
  businessHours: any;
  tone: string;
  faqs: Array<{ question: string; answer: string }>;
  language: string;
  customPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  fallbackMessage?: string;
}

export class AIService {
  private openai: OpenAI;
  private static instance: AIService;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI.apiKey,
    });
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateReply(
    incomingMessage: string,
    customerName: string,
    options: AIResponseOptions
  ): Promise<{ reply: string; intent: string; shouldEscalate: boolean }> {
    const systemPrompt = this.buildSystemPrompt(options);
    const conversationHistory = this.buildConversationHistory(incomingMessage, customerName, options);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 300,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      
      try {
        const parsed = JSON.parse(content);
        return {
          reply: parsed.reply || 'I apologize, but I could not process your request. Let me connect you with a human agent.',
          intent: parsed.intent || 'unknown',
          shouldEscalate: parsed.should_escalate || false,
        };
      } catch {
        return {
          reply: content,
          intent: 'general',
          shouldEscalate: false,
        };
      }
    } catch (error: any) {
      console.error('[AI] Generation error:', error.message);
      return {
        reply: this.getFallbackResponse(options.fallbackMessage),
        intent: 'error',
        shouldEscalate: true,
      };
    }
  }

  async generateLeadScore(conversation: string, customerPhone: string): Promise<number> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a lead scoring AI. Analyze the conversation and return a JSON with:
- score: number from 0-100 based on buying intent, urgency, and engagement
- reasoning: brief explanation

Only return valid JSON.`,
          },
          { role: 'user', content: `Conversation with customer (${customerPhone}):\n${conversation}\n\nScore this lead.` },
        ],
        temperature: 0.3,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      return Math.min(100, Math.max(0, parsed.score || 0));
    } catch {
      return 50; // Default medium score
    }
  }

  async suggestReply(message: string, context: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant helping a business owner draft replies to customer messages. 
Suggest a professional, helpful response. Keep it concise (under 200 characters). 
Return only the reply text, no JSON.`,
          },
          { role: 'user', content: `Customer message: "${message}"\nContext: ${context}\n\nSuggested reply:` },
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch {
      return '';
    }
  }

  private buildSystemPrompt(options: AIResponseOptions): string {
    const faqContext = options.faqs
      .slice(0, 10)
      .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
      .join('\n\n');

    const businessHoursInfo = options.businessHours
      ? `Business Hours: ${JSON.stringify(options.businessHours)}`
      : '';

    return `You are an AI customer support assistant for "${options.businessName}", a ${options.businessType} business.

${businessHoursInfo}

Your role:
1. Answer customer queries professionally in ${options.language === 'hi-en' ? 'Hinglish (mix of Hindi and English)' : options.language}
2. Use a ${options.tone} tone
3. Help book appointments when requested
4. Capture lead information (name, phone, requirement)
5. Answer FAQs using the provided knowledge base

${faqContext ? `Frequently Asked Questions:\n${faqContext}` : ''}

${options.customPrompt ? `Additional Instructions:\n${options.customPrompt}` : ''}

Response Format (JSON):
{
  "reply": "Your response to the customer",
  "intent": "booking|inquiry|complaint|feedback|general|lead",
  "should_escalate": false
}

Rules:
- Be helpful and concise
- If you cannot handle the query, set should_escalate to true
- For appointment bookings, set intent to "booking" and guide the customer
- For new customers, naturally collect their name and requirements
- Never share prices unless asked
- Stay in character as ${options.businessName}'s assistant`;
  }

  private buildConversationHistory(
    incomingMessage: string,
    customerName: string,
    _options: AIResponseOptions
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [
      {
        role: 'user',
        content: `Customer Name: ${customerName}\nMessage: ${incomingMessage}\n\nRespond appropriately:`,
      },
    ];
  }

  private getFallbackResponse(fallbackMessage?: string): string {
    return (
      fallbackMessage ||
      'Thank you for your message. Our team will get back to you shortly. For urgent matters, please call us directly.'
    );
  }
}

export const aiService = AIService.getInstance();
