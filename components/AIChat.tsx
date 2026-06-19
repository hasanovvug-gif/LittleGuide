import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage, UserState } from '../types';
import { chatWithPediatrician } from '../services/geminiService';
import { useTranslation } from 'react-i18next';

interface AIChatProps {
    userState: UserState;
}

export const AIChat: React.FC<AIChatProps> = ({ userState }) => {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const quickPrompts = i18n.language === 'en'
    ? [
        'Baby naps badly during the day. What should I try?',
        'What can help with evening fussiness?',
        'Give me a 10-minute developmental game idea',
      ]
    : i18n.language === 'uk'
      ? [
          'Малюк погано спить вдень. Що спробувати?',
          'Що робити, якщо ввечері багато капризів?',
          'Дай ідею гри на 10 хвилин для розвитку',
        ]
      : [
          'Ребёнок плохо спит днём. Что попробовать?',
          'Что делать, если малыш капризничает вечером?',
          'Идея игры на 10 минут для развития',
        ];
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: t('ai_greeting', { parentName: userState.parentName, childName: userState.childName }),
      timestamp: new Date()
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Calculate age
    const birthDate = new Date(userState.childBirthDate);
    const today = new Date();
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
    months -= birthDate.getMonth();
    months += today.getMonth();
    if (today.getDate() < birthDate.getDate()) months--;
    const ageMonths = Math.max(0, months);

    // Convert internal message format to history format for Gemini
    const history = messages.map(m => ({ role: m.role, text: m.text }));
    
    const responseText = await chatWithPediatrician(
        input, 
        history, 
        { parentName: userState.parentName, childName: userState.childName, ageMonths, language: i18n.language }
    );

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText || t('ai_error'),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex min-h-[calc(100dvh-168px)] flex-col">
        <div className="sticky top-0 z-10 border-b border-white/60 bg-white/65 px-5 py-4 shadow-sm backdrop-blur-md sm:px-6">
             <h2 className="flex items-center gap-3 text-xl font-extrabold text-warm-900">
                <div className="rounded-2xl bg-gradient-to-tr from-primary-200 to-primary-100 p-2.5">
                    <Sparkles size={18} className="text-primary-700" />
                </div>
                {t('wise_friend')}
            </h2>
            <p className="mt-1 pl-12 text-sm text-warm-500">{t('always_on_your_side')}</p>
        </div>

      <div className="px-5 pt-4 sm:px-6">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleQuickPrompt(prompt)}
              className="shrink-0 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-left text-xs font-bold text-warm-700 shadow-sm backdrop-blur-md transition-colors hover:bg-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 sm:px-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`mt-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${isUser ? 'bg-warm-200' : 'bg-primary-100'}`}>
                  {isUser ? <User size={16} className="text-warm-600" /> : <Bot size={16} className="text-primary-600" />}
                </div>
                <div
                  className={`rounded-[22px] p-4 text-[15px] leading-relaxed shadow-sm backdrop-blur-md ${
                    isUser
                      ? 'rounded-br-md border border-warm-700/50 bg-warm-800/92 text-white'
                      : 'rounded-bl-md border border-white/60 bg-white/78 text-warm-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start w-full animate-pulse">
            <div className="flex gap-2 max-w-[80%]">
                 <div className="h-9 w-9 shrink-0 rounded-2xl bg-primary-100" />
                 <div className="h-12 w-24 rounded-[22px] rounded-bl-md border border-white/50 bg-white/70 p-4 backdrop-blur-md"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 border-t border-white/60 bg-white/70 px-4 pb-[calc(14px+var(--safe-bottom))] pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] backdrop-blur-md sm:px-5">
        <div className="flex items-end gap-2 rounded-[24px] border border-white/80 bg-white/65 px-3 py-3 shadow-inner transition-all focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100/50">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('write_something')}
            className="min-h-[44px] flex-1 border-none bg-transparent py-2 text-[15px] text-warm-900 outline-none placeholder:text-warm-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-warm-900 text-white transition-colors hover:bg-warm-800 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
