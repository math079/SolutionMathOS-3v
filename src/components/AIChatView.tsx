import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Loader2, RotateCcw, ChevronDown, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

const QUICK_PROMPTS = [
  'Qual é o resultado financeiro do mês?',
  'Quantos chamados de suporte estão abertos?',
  'Como cadastro um novo produto no estoque?',
  'Como funciona o PDV?',
  'Quais produtos estão com estoque crítico?',
  'Como adicionar um novo cliente no CRM?',
];

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold text-white mt-4 mb-2">$1</h2>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal text-gray-300">$1</li>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-blue-300 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export const AIChatView: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá, **${user?.name || 'usuário'}**! 👋\n\nSou a **Solution Math AI**, sua assistente integrada ao sistema. Posso te ajudar com:\n\n- Informações sobre financeiro, estoque e vendas em tempo real\n- Como usar qualquer módulo do sistema\n- Análises e resumos executivos\n- Fluxos operacionais e boas práticas\n\nComo posso te ajudar agora?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    setInput('');

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setLoading(true);

    // Build history for the API (excluding welcome and loading messages)
    const history = messages
      .filter(m => !m.loading && m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: messageText });

    try {
      const res = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-user': user?.username || 'user',
          'x-auth-role': user?.role || 'client',
        },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Não foi possível gerar uma resposta no momento. Tente novamente.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Não consegui me conectar ao servidor de IA no momento. Verifique se o backend está rodando e tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Olá, **${user?.name || 'usuário'}**! 👋\n\nSou a **Solution Math AI**, sua assistente integrada ao sistema. Como posso te ajudar agora?`,
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-56px)] bg-gray-950 overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Solution Math AI</h2>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/20">v2.0</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Online · Google Gemini Flash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 rounded-lg border border-gray-700 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Conversa segura & privada</span>
          </div>
          <button
            onClick={clearChat}
            title="Limpar conversa"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

            {/* Avatar */}
            {msg.role === 'assistant' ? (
              <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-600/20">
                <Bot className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="shrink-0 w-8 h-8 rounded-xl bg-gray-700 border border-gray-600 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-300" />
              </div>
            )}

            {/* Bubble */}
            <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-blue-600/20'
                    : 'bg-gray-800 text-gray-200 border border-gray-700/50 rounded-tl-sm'
                }`}
              >
                {msg.loading ? (
                  <div className="flex items-center gap-2 text-gray-400 py-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Pensando...</span>
                  </div>
                ) : (
                  <div
                    className="prose prose-invert max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                  />
                )}
              </div>
              <span className="text-[10px] text-gray-500 px-1">
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Prompts (shown when only welcome message) ── */}
      {messages.length === 1 && (
        <div className="shrink-0 px-4 pb-3">
          <p className="text-[11px] text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Sugestões rápidas
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-left text-xs px-3 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500/40 rounded-xl text-gray-300 hover:text-white transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="shrink-0 px-4 py-4 bg-gray-900 border-t border-gray-800">
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-2.5 focus-within:border-blue-500/60 transition-colors shadow-inner">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Pergunte algo ao Solution Math AI..."
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
            autoFocus
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-md shadow-blue-600/20 disabled:shadow-none"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-600 text-center mt-2">
          A IA pode cometer erros. Valide informações críticas diretamente no sistema.
        </p>
      </div>
    </div>
  );
};
