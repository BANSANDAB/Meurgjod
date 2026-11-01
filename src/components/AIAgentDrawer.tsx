import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, Check, MessageSquare, ChevronDown, ArrowRight } from 'lucide-react';
import { AIAgentService } from '../services/aiAgentService';
import { Transaction, HealthRecord, Budget, AIMessage, Account, AppSettings, Category } from '../types';

interface AIAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  healthRecords: HealthRecord[];
  budgets: Budget[];
  currentUser: string;
  geminiApiKey?: string;
  accounts?: Account[];
  settings?: AppSettings;
  categories?: Category[];
  onOpenRecord: () => void;
  onOpenHealth: () => void;
  onOpenBudget?: () => void;
  onOpenWallet?: () => void;
  onOpenSummary?: () => void;
  onOpenOCR?: () => void;
  onOpenVoice?: () => void;
  onOpenTheme?: () => void;
}

export const AIAgentDrawer: React.FC<AIAgentDrawerProps> = ({
  isOpen,
  onClose,
  transactions,
  healthRecords,
  budgets,
  currentUser,
  geminiApiKey,
  accounts = [],
  settings,
  categories = [],
  onOpenRecord,
  onOpenHealth,
  onOpenBudget,
  onOpenWallet,
  onOpenSummary,
  onOpenOCR,
  onOpenVoice,
  onOpenTheme,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      sender: 'nong-jod',
      text: `สวัสดีค่ะคุณ${currentUser}! น้องจดเมฆน้อยพร้อมช่วยดูแลทุกเรื่องในระบบเลยค่ะ ☁️💕\n\nสามารถถามน้องจดได้ทุกเรื่องนะคะ ทั้งยอดเงินคู่, ใครใช้เยอะกว่า, เช็คสลิป, สุขภาพ/BMI, จัดการกระเป๋า/บัญชี, หรืองบประมาณ ถามได้เลยค่ะ!`,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const aiReply = await AIAgentService.processChatMessage(
        text,
        transactions,
        healthRecords,
        budgets,
        currentUser,
        accounts,
        settings,
        geminiApiKey
      );
      setMessages((prev) => [...prev, aiReply]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (actionKey: string) => {
    onClose();
    switch (actionKey) {
      case 'record':
        onOpenRecord();
        break;
      case 'health':
        onOpenHealth();
        break;
      case 'budget':
        onOpenBudget?.();
        break;
      case 'wallet':
        onOpenWallet?.();
        break;
      case 'summary':
        onOpenSummary?.();
        break;
      case 'ocr':
        onOpenOCR?.();
        break;
      case 'voice':
        onOpenVoice?.();
        break;
      case 'theme':
        onOpenTheme?.();
        break;
    }
  };

  const actionStyleMap: Record<string, { icon: string; style: string }> = {
    record: { icon: '📝', style: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' },
    health: { icon: '🏃', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    budget: { icon: '🎯', style: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
    wallet: { icon: '💳', style: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    summary: { icon: '📊', style: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    ocr: { icon: '🧾', style: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' },
    voice: { icon: '🎙️', style: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
    theme: { icon: '🎨', style: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100' }
  };

  const quickPrompts = [
    'ตอนนี้เงินคู่เหลือเท่าไหร่?',
    'ใครใช้เงินเยอะกว่ากัน?',
    'สลิป / สแกนสลิปทำยังไง?',
    'สั่งด้วยเสียงทำยังไง?',
    'เช็คกระเป๋าเงินและบัญชี',
    'สุขภาพและ BMI เป็นไง?',
    'งบประมาณเป็นยังไงบ้าง?',
    'มีธีมสีอะไรให้เลือกบ้าง?'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-4 bg-navy-text/45 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-[88vh] sm:h-[640px] bg-white rounded-t-4xl sm:rounded-3xl shadow-cute-lg border border-white/80 flex flex-col overflow-hidden">
        {/* Header with Mascot */}
        <div className="p-4 bg-gradient-to-r from-sky-400 via-sky-300 to-purple-200 border-b border-sky-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white shadow-cute bg-white shrink-0">
              <img
                src="./assets/nong-jod.png"
                alt="Nong Jod AI"
                className="w-full h-full object-cover animate-bounce"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-navy-text flex items-center gap-1.5 leading-tight">
                <span>น้องจด (AI Agent)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h3>
              <p className="text-[11px] font-medium text-navy-muted leading-tight">
                ผู้ช่วยคู่รัก ดูแลเงินคู่ สุขภาพ & สลิป
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-navy-text hover:bg-white active:scale-90 transition-all shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-sky-50/70 border-b border-sky-100 flex gap-1.5 overflow-x-auto scrollbar-none">
          {quickPrompts.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-sky-100 text-[11px] font-semibold text-navy-text border border-sky-200/80 shadow-sm shrink-0 active:scale-95 transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-sky-50/30 to-white">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            const actionStyle = m.actionLink ? actionStyleMap[m.actionLink.action] : null;

            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl overflow-hidden shrink-0 border border-sky-200 shadow-sm mt-1">
                    <img src="./assets/nong-jod.png" alt="bot" className="w-full h-full object-cover" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-3.5 rounded-3xl text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-sky-500 text-white rounded-br-none font-medium'
                      : 'bg-white text-navy-text border border-sky-100 rounded-bl-none font-normal'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Context Action Button */}
                  {m.actionLink && (
                    <div className="mt-2.5 pt-2 border-t border-sky-100/80">
                      <button
                        onClick={() => handleActionClick(m.actionLink!.action)}
                        className={`w-full px-3 py-2 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-sm active:scale-95 transition-all ${
                          actionStyle?.style || 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{actionStyle?.icon || '✨'}</span>
                          <span>{m.actionLink.label}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                      </button>
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      isUser ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-2 items-center text-xs text-sky-600 font-semibold p-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
              <span>น้องจดกำลังคิด...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-sky-100 flex items-center gap-2">
          <input
            type="text"
            placeholder="ถามน้องจดได้ทุกเรื่องในระบบ..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            className="flex-1 text-xs p-3 rounded-2xl bg-sky-50/60 border border-sky-200 focus:outline-none focus:border-sky-400 text-navy-text font-medium placeholder:text-slate-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white flex items-center justify-center shadow-cute active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
