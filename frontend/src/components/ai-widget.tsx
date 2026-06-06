import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { apiClient } from '../services/api'; // Убедитесь, что путь корректный


export default function AiWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Добро пожаловать. Я ваш личный сомелье по выпечке. Подсказать идеальный десерт?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [userId, setUserId] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const LOCAL_STORAGE_KEY = 'bakery_ai_user_id';
    let storedId = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (!storedId) {
      // Генерируем стандартный UUID v4 через встроенный браузерный Crypto API
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        storedId = crypto.randomUUID();
      } else {
        // Запасной вариант (fallback) на случай старых браузеров
        storedId = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, storedId);
    }

    setUserId(storedId);
  }, []); 

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await apiClient.sendAi(userId, userText);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: response?.text || 'Прошу прощения, задумался о пропорциях кардамона. Повторите, пожалуйста.' 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: 'Связь с кухней временно прервалась. Попробуйте еще раз чуть позже.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)} 
          className="bg-gradient-to-br from-stone-800 to-stone-950 border border-white/10 text-white p-4 pr-6 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(217,119,6,0.3)] transition-all duration-500 hover:-translate-y-1 flex items-center gap-3 group backdrop-blur-xl"
        >
          <div className="bg-amber-500/20 p-2 rounded-full group-hover:scale-110 transition-transform">
            <MessageCircle className="w-5 h-5 text-amber-400" />
          </div>
          <span className="font-semibold text-sm tracking-wide">Ваш Сомелье</span>
        </button>
      ) : (
        <div className="bg-stone-950/90 w-[380px] sm:w-[420px] h-[560px] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-white/10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 backdrop-blur-2xl">
          
          {/* Шапка чата */}
          <div className="bg-transparent border-b border-white/10 px-6 py-5 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center shadow-lg shadow-amber-900/50">
                <Sparkles className="w-5 h-5 text-stone-950" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-white tracking-wide">Нейро-сомелье</h4>
                <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1.5 uppercase tracking-wider mt-0.5">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(251,191,36,1)]" />
                  На связи
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full relative z-10 border border-white/5">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* История сообщений */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-transparent no-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-xl backdrop-blur-md ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-stone-950 rounded-tr-sm font-medium' 
                    : 'bg-white/10 text-stone-200 border border-white/10 rounded-tl-sm leading-relaxed font-light'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 items-center text-stone-400 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 w-max rounded-tl-sm shadow-xl backdrop-blur-md">
                <span className="w-1.5 h-1.5 bg-amber-500/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-500/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-500/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Форма ввода */}
          <form onSubmit={handleSendMessage} className="p-4 bg-stone-900/50 border-t border-white/10 flex gap-3 backdrop-blur-md">
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ваше пожелание..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all font-light"
            />
            <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-stone-950 px-5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(217,119,6,0.2)] hover:shadow-[0_0_20px_rgba(217,119,6,0.4)]">
              Ок
            </button>
          </form>
        </div>
      )}
    </div>
  );
}