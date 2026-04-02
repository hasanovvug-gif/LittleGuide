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

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
        <div className="px-6 py-4 bg-white/60 backdrop-blur-md sticky top-0 z-10 border-b border-white/50 shadow-sm">
             <h2 className="text-xl font-bold text-warm-900 flex items-center gap-2">
                <div className="bg-gradient-to-tr from-primary-200 to-primary-100 p-2 rounded-full">
                    <Sparkles size={18} className="text-primary-700" />
                </div>
                {t('wise_friend')}
            </h2>
            <p className="text-xs text-warm-500 mt-1 pl-11">{t('always_on_your_side')}</p>
        </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-auto ${isUser ? 'bg-warm-200' : 'bg-primary-100'}`}>
                  {isUser ? <User size={16} className="text-warm-600" /> : <Bot size={16} className="text-primary-600" />}
                </div>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm backdrop-blur-md ${
                    isUser
                      ? 'bg-warm-800/90 text-white rounded-br-none border border-warm-700/50'
                      : 'bg-white/70 text-warm-800 border border-white/50 rounded-bl-none'
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
                 <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0" />
                 <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl rounded-bl-none border border-white/50 h-12 w-24"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white/60 backdrop-blur-md border-t border-white/50 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/80 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100/50 transition-all shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('write_something')}
            className="flex-1 bg-transparent border-none outline-none text-warm-900 placeholder-warm-400 py-2"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2 bg-warm-900 rounded-xl text-white disabled:opacity-50 hover:bg-warm-800 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};