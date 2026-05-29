'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Bot,
  Settings2,
  MessageSquare,
  Loader2,
  Save,
  Plus,
  Trash2,
  Smartphone,
} from 'lucide-react';

export default function SettingsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [business, setBusiness] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiSettings, setAiSettings] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [activeTab, setActiveTab] = useState('ai');

  const loadData = async () => {
    try {
      const bizRes = await api.getBusinesses();
      const biz = bizRes.data?.[0];
      if (biz) {
        setBusinessId(biz.id);
        setBusiness(biz);
        
        const [aiRes, faqsRes] = await Promise.all([
          api.getAiSettings(biz.id).catch(() => ({ data: null })),
          api.getFaqs(biz.id).catch(() => ({ data: [] })),
        ]);
        setAiSettings(aiRes.data);
        setFaqs(faqsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveAiSettings = async () => {
    if (!businessId || !aiSettings) return;
    setSaving(true);
    try {
      await api.updateAiSettings(businessId, aiSettings);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const addFaq = async () => {
    if (!businessId || !newFaq.question || !newFaq.answer) return;
    try {
      await api.createFaq(businessId, newFaq);
      setNewFaq({ question: '', answer: '' });
      const faqsRes = await api.getFaqs(businessId);
      setFaqs(faqsRes.data || []);
    } catch (err) {
      console.error('Failed to add FAQ:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'ai', label: 'AI Settings', icon: Bot },
    { id: 'business', label: 'Business', icon: Settings2 },
    { id: 'faqs', label: 'FAQs', icon: MessageSquare },
    { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your AI automation</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI Settings Tab */}
      {activeTab === 'ai' && aiSettings && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">AI Response Settings</h2>
            <Button onClick={saveAiSettings} loading={saving} size="sm">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tone</label>
              <select
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
                value={aiSettings.tone}
                onChange={(e) => setAiSettings({ ...aiSettings, tone: e.target.value })}
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
              <select
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
                value={aiSettings.language}
                onChange={(e) => setAiSettings({ ...aiSettings, language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="hi-en">Hinglish</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Temperature ({aiSettings.temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={aiSettings.temperature}
                onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Response Length</label>
              <input
                type="number"
                value={aiSettings.maxResponseLength}
                onChange={(e) => setAiSettings({ ...aiSettings, maxResponseLength: parseInt(e.target.value) })}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Welcome Message</label>
            <textarea
              value={aiSettings.welcomeMessage || ''}
              onChange={(e) => setAiSettings({ ...aiSettings, welcomeMessage: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Message when customer first messages..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom AI Instructions</label>
            <textarea
              value={aiSettings.customPrompt || ''}
              onChange={(e) => setAiSettings({ ...aiSettings, customPrompt: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Additional instructions for the AI..."
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'autoReplyEnabled', label: 'Auto Reply' },
              { key: 'businessHoursOnly', label: 'Business Hours Only' },
              { key: 'leadCaptureEnabled', label: 'Lead Capture' },
              { key: 'appointmentEnabled', label: 'Appointments' },
              { key: 'faqEnabled', label: 'FAQ Auto-Reply' },
            ].map((toggle) => (
              <label key={toggle.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  checked={(aiSettings as any)[toggle.key] ?? false}
                  onChange={(e) => setAiSettings({ ...aiSettings, [toggle.key]: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{toggle.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Business Tab */}
      {activeTab === 'business' && business && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Business Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Business Name" value={business.name} readOnly />
            <Input label="Phone" value={business.phone} readOnly />
            <Input label="Email" value={business.email || ''} readOnly />
            <Input label="City" value={business.city || ''} readOnly />
          </div>
        </div>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add FAQ</h2>
            <div className="space-y-3">
              <Input
                label="Question"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                placeholder="e.g., What are your business hours?"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Answer</label>
                <textarea
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Detailed answer..."
                />
              </div>
              <Button onClick={addFaq} size="sm">
                <Plus className="h-4 w-4" />
                Add FAQ
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 divide-y">
            {faqs.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (faq: any) => (
              <div key={faq.id} className="p-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{faq.question}</p>
                  <p className="text-sm text-gray-500 mt-1">{faq.answer}</p>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {faqs.length === 0 && (
              <div className="p-6 text-center text-gray-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No FAQs yet. Add your first one above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Tab */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">WhatsApp Integration</h2>
          <div className="space-y-4">
            <Input
              label="WhatsApp Business Number"
              value={business?.whatsappNumber || ''}
              placeholder="+91 9876543210"
              readOnly={!businessId}
            />
            <p className="text-sm text-gray-500">
              Connect your WhatsApp Business number to start automating customer conversations.
              You&apos;ll need a Meta Business account and WhatsApp Business API access.
            </p>
            <Button variant="outline">
              <Smartphone className="h-4 w-4" />
              Connect WhatsApp
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
