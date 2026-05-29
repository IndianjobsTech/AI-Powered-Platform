'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn, formatDateTime } from '@/lib/utils';
import {
  MessageSquare,
  Send,
  Search,
  Loader2,
  ArrowLeft,
  Bot,
  CheckCheck,
} from 'lucide-react';

interface Conversation {
  from_number: string;
  content: string;
  created_at: string;
  direction: string;
  lead_name: string | null;
  lead_status: string | null;
}

interface Message {
  id: string;
  content: string;
  fromNumber: string;
  toNumber: string;
  direction: string;
  status: string;
  isAiGenerated: boolean;
  createdAt: string;
  lead?: { name: string; phone: string };
}

export default function WhatsAppPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    try {
      const bizRes = await api.getBusinesses();
      const biz = bizRes.data?.[0];
      if (biz) {
        setBusinessId(biz.id);
        const convRes = await api.getConversations(biz.id);
        setConversations(convRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (fromNumber: string) => {
    try {
      if (!businessId) return;
      const msgRes = await api.getMessages(businessId, { fromNumber });
      setMessages(msgRes.data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (selectedPhone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMessages(selectedPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhone]);

  const handleSend = async () => {
    if (!newMessage.trim() || !businessId || !selectedPhone) return;
    setSending(true);
    try {
      await api.sendMessage(businessId, { to: selectedPhone, text: newMessage });
      setNewMessage('');
      await loadMessages(selectedPhone);
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="text-center py-20">
        <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">No WhatsApp Connected</h2>
        <p className="text-gray-500 mt-2">Set up your WhatsApp number to start messaging</p>
        <Button className="mt-4">Connect WhatsApp</Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Conversations List */}
      <div className={cn(
        'w-80 border-r border-gray-200 flex flex-col',
        selectedPhone && 'hidden lg:flex'
      )}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <div className="mt-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.from_number}
                onClick={() => setSelectedPhone(conv.from_number)}
                className={cn(
                  'w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100',
                  selectedPhone === conv.from_number && 'bg-blue-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {(conv.lead_name || conv.from_number).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.lead_name || formatPhone(conv.from_number)}
                      </p>
                      <span className="text-xs text-gray-400">{formatDateTime(conv.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.content}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        'flex-1 flex flex-col',
        !selectedPhone && 'hidden lg:flex'
      )}>
        {selectedPhone ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <button
                onClick={() => setSelectedPhone(null)}
                className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                {selectedPhone.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{formatPhone(selectedPhone)}</p>
                <p className="text-xs text-gray-500">WhatsApp • Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[70%] rounded-2xl px-4 py-2.5',
                      msg.direction === 'OUTBOUND'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div className={cn(
                      'flex items-center gap-1 mt-1',
                      msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                    )}>
                      <span className="text-[10px] opacity-70">{formatDateTime(msg.createdAt)}</span>
                      {msg.isAiGenerated && (
                        <Bot className="h-3 w-3 opacity-70" />
                      )}
                      {msg.direction === 'OUTBOUND' && (
                        <CheckCheck className="h-3 w-3 opacity-70" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 h-10 px-4 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  loading={sending}
                  size="icon"
                  className="rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  return phone;
}
