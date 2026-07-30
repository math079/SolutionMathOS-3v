import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, RotateCcw, Sparkles, User, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

const QUICK_PROMPTS = [
  'Qual o resultado financeiro do mês?',
  'Quais produtos estão com estoque crítico?',
  'Quantos chamados estão abertos hoje?',
  'Como cadastro um novo cliente no CRM?',
  'Mostre um resumo dos deals ativos',
  'Como funciona o PDV?',
];

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<div class="text-sm font-bold text-white mt-3 mb-1">$1</div>')
    .replace(/^## (.*$)/gm, '<div class="text-base font-bold text-white mt-4 mb-2">$1</div>')
    .replace(/^- (.*$)/gm, '<div class="flex gap-2 items-start mt-1"><span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0"></span><span>$1</span></div>')
    .replace(/^\d+\. (.*$)/gm, '<div class="flex gap-2 items-start mt-1 text-gray-300"><span>$1</span></div>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\n\n/g, '<div class="mt-2"></div>')
    .replace(/\n/g, '<br/>');
}

// ── Lyra Avatar ──────────────────────────────────────────────────────────────
const LyraAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; pulse?: boolean }> = ({ size = 'md', pulse = false }) => {
  const dims = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-12 h-12' };
  const text = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-base' };
  return (
    <div className={`relative shrink-0 ${dims[size]}`}>
      <div className={`${dims[size]} rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/30 ${pulse ? 'animate-pulse' : ''}`}>
        <span className={`font-black text-white ${text[size]}`}>L</span>
      </div>
      {!pulse && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-gray-950" />
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
interface LyraChatProps {
  onClose: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  currentModule?: string;
}

const LyraChat: React.FC<LyraChatProps> = ({ onClose, expanded, onToggleExpand, currentModule }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Oi, **${user?.name?.split(' ')[0] || 'usuário'}**! Sou a **Lyra**, sua assistente no Solution Math OS. 🚀\n\nPosso consultar dados em tempo real, explicar funcionalidades, gerar relatórios e muito mais. No que posso te ajudar agora?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setShowQuickPrompts(false);

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: msg, timestamp: new Date() };
    const loadingMsg: Message = { id: `l-${Date.now()}`, role: 'assistant', content: '', timestamp: new Date(), loading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    const history = messages
      .filter(m => !m.loading && m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: msg });

    if (currentModule) {
      history[history.length - 1].content = `[Contexto: usuário está no módulo "${currentModule}"]\n\n${msg}`;
    }

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
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Não foi possível gerar uma resposta. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev.slice(0, -1), aiMsg]);
    } catch {
      const errMsg: Message = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: 'Não consegui conectar ao servidor. Verifique se o backend está rodando e tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev.slice(0, -1), errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Conversa reiniciada! Em que posso te ajudar, **${user?.name?.split(' ')[0] || 'usuário'}**?`,
      timestamp: new Date(),
    }]);
    setShowQuickPrompts(true);
  };

  return (
    <div
      className={`flex flex-col rounded-3xl overflow-hidden shadow-2xl shadow-violet-900/30 border border-white/10 transition-all duration-300 ${
        expanded
          ? 'w-[520px] h-[680px]'
          : 'w-[380px] h-[560px]'
      }`}
      style={{ background: 'linear-gradient(145deg, #0f0a1e 0%, #110e2a 60%, #0a0f1e 100%)' }}
    >
      {/* ── Header ── */}
      <div
        className="shrink-0 px-5 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.08) 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <LyraAvatar size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">Lyra</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">Solution AI</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">Online · Gemini Flash</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={clearChat}
            title="Limpar conversa"
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleExpand}
            title={expanded ? 'Reduzir' : 'Expandir'}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Context pill ── */}
      {currentModule && (
        <div className="shrink-0 px-5 pt-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Contexto: <strong>{currentModule}</strong>
          </span>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'assistant' ? (
              msg.loading ? <LyraAvatar size="sm" pulse /> : <LyraAvatar size="sm" />
            ) : (
              <div className="shrink-0 w-7 h-7 rounded-xl bg-gray-700/80 border border-gray-600/50 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-gray-300" />
              </div>
            )}

            <div className={`max-w-[82%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-500/20 rounded-br-sm'
                    : 'bg-white/5 text-gray-200 border border-white/8 rounded-bl-sm backdrop-blur-sm'
                }`}
              >
                {msg.loading ? (
                  <div className="flex items-center gap-2.5 py-0.5">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-gray-400">Lyra está pensando...</span>
                  </div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                )}
              </div>
              <span className="text-[10px] text-gray-600 px-1">
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Prompts ── */}
      {showQuickPrompts && messages.length === 1 && (
        <div className="shrink-0 px-4 pb-2">
          <p className="text-[10px] text-gray-500 font-semibold mb-2 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-violet-400" />
            Sugestões
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-left text-[11px] px-2.5 py-2 bg-white/4 hover:bg-violet-500/15 border border-white/6 hover:border-violet-500/30 rounded-xl text-gray-400 hover:text-gray-100 transition-all leading-snug"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div
          className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 focus-within:ring-1 focus-within:ring-violet-500/50 transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
            disabled={loading}
            placeholder="Pergunte para a Lyra..."
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
            autoFocus
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-md shadow-violet-500/30"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-700 text-center mt-2">
          Lyra pode cometer erros. Valide dados críticos no sistema.
        </p>
      </div>
    </div>
  );
};

// ── Floating Trigger Button ───────────────────────────────────────────────────
interface LyraFloatingButtonProps {
  currentModule?: string;
}

export const LyraFloatingButton: React.FC<LyraFloatingButtonProps> = ({ currentModule }) => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {/* Chat Window */}
      {open && (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-200">
          <LyraChat
            onClose={() => setOpen(false)}
            expanded={expanded}
            onToggleExpand={() => setExpanded(e => !e)}
            currentModule={currentModule}
          />
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative group w-14 h-14 rounded-2xl shadow-2xl shadow-violet-900/50 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: open
            ? 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)'
            : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
          boxShadow: '0 0 0 0 rgba(139,92,246,0.4)',
          animation: open ? 'none' : 'lyra-pulse 3s ease-in-out infinite',
        }}
        title={open ? 'Fechar Lyra' : 'Abrir Lyra — Solution AI'}
      >
        {open ? (
          <ChevronDown className="w-5 h-5 text-white" />
        ) : (
          <span className="text-xl font-black text-white leading-none">L</span>
        )}

        {/* Notification dot */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-gray-950 animate-pulse" />
        )}
      </button>

      <style>{`
        @keyframes lyra-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4), 0 20px 40px rgba(139,92,246,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(139,92,246,0), 0 20px 40px rgba(139,92,246,0.3); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 99px; }
      `}</style>
    </div>
  );
};

// ── Embedded full page view (via nav item) ───────────────────────────────────
export const AIChatView: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Oi, **${user?.name?.split(' ')[0] || 'usuário'}**! Sou a **Lyra**, sua assistente no Solution Math OS. 🚀\n\nEstou conectada ao sistema e posso consultar dados em tempo real. Como posso te ajudar?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setShowQuickPrompts(false);

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: msg, timestamp: new Date() };
    const loadingMsg: Message = { id: `l-${Date.now()}`, role: 'assistant', content: '', timestamp: new Date(), loading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    const history = messages
      .filter(m => !m.loading && m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: msg });

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
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Não consegui gerar uma resposta. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev.slice(0, -1), aiMsg]);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: 'Não consegui conectar ao servidor. Verifique se o backend está rodando.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Conversa reiniciada! Em que posso te ajudar?`,
      timestamp: new Date(),
    }]);
    setShowQuickPrompts(true);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(145deg, #0f0a1e 0%, #110e2a 60%, #0a0f1e 100%)' }}>
      {/* Header */}
      <div
        className="shrink-0 px-6 py-5 flex items-center justify-between"
        style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}
      >
        <div className="flex items-center gap-4">
          <LyraAvatar size="lg" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-wide">Lyra</h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">Solution AI</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">v2.0</span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Assistente integrada ao Solution Math OS com acesso a dados em tempo real
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-white/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Nova conversa
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'assistant' ? (
              msg.loading ? <LyraAvatar size="sm" pulse /> : <LyraAvatar size="sm" />
            ) : (
              <div className="shrink-0 w-8 h-8 rounded-2xl bg-gray-700/60 border border-gray-600/40 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-300" />
              </div>
            )}

            <div className={`max-w-[76%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-500/20 rounded-br-sm'
                    : 'text-gray-200 rounded-bl-sm'
                }`}
                style={msg.role === 'assistant' ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
              >
                {msg.loading ? (
                  <div className="flex items-center gap-3 py-0.5">
                    <div className="flex gap-1.5">
                      {[0, 150, 300].map((delay, i) => (
                        <span key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">Lyra está pensando...</span>
                  </div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                )}
              </div>
              <span className="text-[11px] text-gray-600 px-1">
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {showQuickPrompts && messages.length === 1 && (
        <div className="shrink-0 px-6 pb-3">
          <p className="text-xs text-gray-500 font-semibold mb-3 flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Sugestões rápidas
          </p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-left text-xs px-3.5 py-2.5 rounded-xl text-gray-400 hover:text-gray-100 transition-all leading-snug"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 px-6 pb-6 pt-2">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 focus-within:ring-1 focus-within:ring-violet-500/40 transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <LyraAvatar size="sm" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
            disabled={loading}
            placeholder="Pergunte qualquer coisa para a Lyra..."
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
            autoFocus
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all shadow-md shadow-violet-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[11px] text-gray-700 text-center mt-2.5">
          Lyra pode cometer erros. Confirme informações críticas diretamente no sistema.
        </p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.25); border-radius: 99px; }
        @keyframes slide-in-from-bottom-4 { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-in { animation: slide-in-from-bottom-4 0.2s ease-out; }
      `}</style>
    </div>
  );
};
