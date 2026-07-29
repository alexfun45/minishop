import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface ChatSession {
  user_id: string;
  total_messages: number;
  last_activity: string;
}

interface ChatLog {
  id: number;
  user_message: string;
  ai_response: string;
  intent: string;
  created_at: string;
}

export const AiLogsAdmin: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Загрузка списка пользователей
  useEffect(() => {

    apiClient.get('/ai/sessions')
      .then(res => res.json())
      .then(res => res.success && setSessions(res.data));
  }, []);

  // Загрузка истории конкретного пользователя при клике
  const handleSelectUser = async (userId: string) => {
    setSelectedUserId(userId);
    setLoading(true);
    try {
      const res = await apiClient.get(`/ai/history/${userId}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* ЛЕВАЯ КОЛОНКА: Список сессий/пользователей */}
      <div className="bg-stone-900 border border-white/10 rounded-2xl p-4">
        <h2 className="text-lg font-bold text-white mb-4">Диалоги с ИИ</h2>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {sessions.map((session) => (
            <button
              key={session.user_id}
              onClick={() => handleSelectUser(session.user_id)}
              className={`w-full text-left p-3 rounded-xl transition-all border ${
                selectedUserId === session.user_id
                  ? 'bg-amber-600/20 border-amber-500/50 text-white'
                  : 'bg-white/5 border-transparent hover:bg-white/10 text-stone-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-xs font-bold text-amber-400">
                  ID: {session.user_id}
                </span>
                <span className="text-[10px] text-stone-500">
                  {new Date(session.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-xs text-stone-400">
                Сообщений: {session.total_messages}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ПРАВАЯ КОЛОНКА: Окно просмотра диалога */}
      <div className="md:col-span-2 bg-stone-900 border border-white/10 rounded-2xl p-4 flex flex-col h-[650px]">
        {selectedUserId ? (
          <>
            <div className="pb-3 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">
                  История пользователя: <span className="text-amber-500">{selectedUserId}</span>
                </h3>
              </div>
              <span className="text-xs text-stone-400">
                Записей: {history.length}
              </span>
            </div>

            {/* Область сообщений */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
              {loading ? (
                <div className="text-center text-stone-500 py-10">Загрузка истории...</div>
              ) : (
                history.map((log) => (
                  <div key={log.id} className="space-y-2 border-b border-white/5 pb-3">
                    
                    {/* Сообщение пользователя */}
                    <div className="flex justify-end">
                      <div className="bg-amber-600/20 text-amber-200 border border-amber-500/30 text-xs p-3 rounded-2xl max-w-[80%]">
                        <div className="text-[9px] text-amber-400/60 mb-1 font-mono">
                          Пользователь • {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                        {log.user_message}
                      </div>
                    </div>

                    {/* Ответ ИИ */}
                    <div className="flex justify-start">
                      <div className="bg-white/5 text-stone-200 border border-white/10 text-xs p-3 rounded-2xl max-w-[85%] space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] text-stone-400 font-mono">🤖 ИИ Ответ</span>
                          {log.intent && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                              intent: {log.intent}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap">{log.ai_response}</p>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-500">
            <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Выберите диалог слева для просмотра истории
          </div>
        )}
      </div>

    </div>
  );
};