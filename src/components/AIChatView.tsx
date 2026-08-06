import React, { useState, useRef, useEffect } from 'react';
import {
  X, Send, Loader2, RotateCcw, Sparkles, User, ChevronDown,
  Maximize2, Minimize2, MessageSquare, BarChart3, TrendingUp,
  Settings, HeadphoneOff, Headphones, ShieldCheck, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

const CATEGORY_PROMPTS = [
  { icon: <MessageSquare className="w-3.5 h-3.5 text-purple-400" />, label: 'Respostas', prompt: 'Como funciona o sistema Solution Math OS?' },
  { icon: <BarChart3 className="w-3.5 h-3.5 text-blue-400" />, label: 'Análises', prompt: 'Qual é a análise financeira do mês atual?' },
  { icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />, label: 'Estratégias', prompt: 'Quais estratégias posso usar para aumentar as vendas?' },
  { icon: <Settings className="w-3.5 h-3.5 text-amber-400" />, label: 'Automação', prompt: 'Como posso automatizar o fluxo de cobrança?' },
  { icon: <Headphones className="w-3.5 h-3.5 text-pink-400" />, label: 'Suporte', prompt: 'Quais são os chamados de suporte abertos?' },
];

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<div class="text-sm font-bold text-white mt-3 mb-1">$1</div>')
    .replace(/^## (.*$)/gm, '<div class="text-base font-bold text-white mt-4 mb-2">$1</div>')
    .replace(/^- (.*$)/gm, '<div class="flex gap-2 items-start mt-1"><span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></span><span>$1</span></div>')
    .replace(/^\d+\. (.*$)/gm, '<div class="flex gap-2 items-start mt-1 text-gray-300"><span>$1</span></div>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\n\n/g, '<div class="mt-2"></div>')
    .replace(/\n/g, '<br/>');
}

// ── Lyra Avatar Image ────────────────────────────────────────────────────────
export const LyraAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; pulse?: boolean }> = ({ size = 'md', pulse = false }) => {
  const dims = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  return (
    <div className={`relative shrink-0 ${dims[size]}`}>
      <img
        src="/lyra-avatar.jpg"
        alt="Lyra AI"
        className={`${dims[size]} rounded-2xl object-cover border border-purple-500/40 shadow-lg shadow-purple-500/25 ${pulse ? 'animate-pulse ring-2 ring-purple-500' : ''}`}
      />
      {!pulse && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-gray-950" />
      )}
    </div>
  );
};

// ── Floating Chat Component ───────────────────────────────────────────────────
interface LyraChatProps {
  onClose: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  currentModule?: string;
}

export const LyraChat: React.FC<LyraChatProps> = ({ onClose, expanded, onToggleExpand, currentModule }) => {
  const { user } = useAuth();
  const userId = user?.username || 'user';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá! Sou a **Lyra**, sua assistente oficial do **Solution Math OS**.\n\nComo posso ajudar você hoje?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load persistent conversation history from SQLite on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/ai/history/${userId}`);
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const loadedMsgs: Message[] = rows.map((r: any, idx: number) => ({
              id: `hist-${idx}-${Date.now()}`,
              role: r.role,
              content: r.content,
              timestamp: new Date(r.created_at || Date.now())
            }));
            setMessages([
              {
                id: 'welcome',
                role: 'assistant',
                content: `Olá! Sou a **Lyra**, sua assistente oficial. (Memória ativada - histórico carregado)`,
                timestamp: new Date(),
              },
              ...loadedMsgs
            ]);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar memória da Lyra:', err);
      }
    };
    loadHistory();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: msg, timestamp: new Date() };
    const loadingMsg: Message = { id: `l-${Date.now()}`, role: 'assistant', content: '', timestamp: new Date(), loading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    const history = messages
      .filter(m => !m.loading && m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: msg });

    if (currentModule) {
      history[history.length - 1].content = `[Contexto: tela "${currentModule}"]\n\n${msg}`;
    }

    try {
      const res = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-user': user?.username || 'user',
          'x-auth-role': user?.role || 'client',
        },
        body: JSON.stringify({ messages: history, userId }),
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
        content: 'Não consegui me conectar ao servidor. Tente novamente em instantes.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev.slice(0, -1), errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearChat = async () => {
    try {
      await fetch(`http://localhost:3001/api/ai/history/${userId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Erro ao limpar memória:', e);
    }
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Memória limpa! Nova conversa iniciada. Como posso ajudar você hoje?`,
      timestamp: new Date(),
    }]);
  };

  return (
    <div
      className={`flex flex-col rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/60 border border-purple-500/20 transition-all duration-300 ${
        expanded ? 'w-[520px] h-[680px]' : 'w-[390px] h-[580px]'
      }`}
      style={{ background: 'linear-gradient(150deg, #0a0614 0%, #120924 50%, #080312 100%)' }}
    >
      {/* Header */}
      <div
        className="shrink-0 px-4 py-3.5 flex items-center justify-between"
        style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.18) 0%, rgba(126,34,206,0.1) 100%)', borderBottom: '1px solid rgba(168,85,247,0.25)' }}
      >
        <div className="flex items-center gap-3">
          <LyraAvatar size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">Lyra</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">IA Assistente</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400 font-medium">ONLINE · 98% Eficiência</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={clearChat} title="Limpar conversa" className="p-1.5 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggleExpand} title={expanded ? 'Reduzir' : 'Expandir'} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors">
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'assistant' ? (
              <LyraAvatar size="sm" pulse={msg.loading} />
            ) : (
              <div className="shrink-0 w-7 h-7 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-gray-300" />
              </div>
            )}

            <div className={`max-w-[84%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-600/20 rounded-br-sm'
                    : 'bg-white/5 text-gray-200 border border-purple-500/15 rounded-bl-sm backdrop-blur-sm'
                }`}
              >
                {msg.loading ? (
                  <div className="flex items-center gap-2 py-0.5">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    <span className="text-xs text-purple-300 font-medium">Lyra processando...</span>
                  </div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
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

      {/* Action Pills */}
      {messages.length === 1 && (
        <div className="shrink-0 px-3 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_PROMPTS.map((cat, i) => (
              <button
                key={i}
                onClick={() => sendMessage(cat.prompt)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/4 hover:bg-purple-500/20 border border-purple-500/20 text-xs text-gray-300 hover:text-white transition-all"
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 p-3 bg-black/40 border-t border-purple-500/15">
        <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 bg-white/5 border border-purple-500/20 focus-within:border-purple-500/60 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
            disabled={loading}
            placeholder="Como posso ajudar você hoje?"
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
            autoFocus
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-md shadow-purple-500/30"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Floating Button ───────────────────────────────────────────────────────────
interface LyraFloatingButtonProps {
  currentModule?: string;
}

export const LyraFloatingButton: React.FC<LyraFloatingButtonProps> = ({ currentModule }) => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
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

      <button
        onClick={() => setOpen(o => !o)}
        className="relative group w-14 h-14 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border border-purple-500/40"
        style={{
          boxShadow: '0 0 25px rgba(168,85,247,0.4)',
        }}
        title={open ? 'Fechar Lyra' : 'Lyra — IA Assistente Solution Math'}
      >
        <img
          src="/lyra-avatar.jpg"
          alt="Lyra AI"
          className="w-full h-full object-cover"
        />
        {!open && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-gray-950 animate-pulse" />
        )}
      </button>
    </div>
  );
};

// ── Embedded Full Page View (HUB Visual com Painel Oficial) ──────────────────
export const AIChatView: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.username || 'user';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá! Sou a **Lyra**, sua assistente oficial do **Solution Math OS**.\n\nComo posso ajudar você hoje?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load persistent conversation history from SQLite on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/ai/history/${userId}`);
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const loadedMsgs: Message[] = rows.map((r: any, idx: number) => ({
              id: `hist-full-${idx}-${Date.now()}`,
              role: r.role,
              content: r.content,
              timestamp: new Date(r.created_at || Date.now())
            }));
            setMessages([
              {
                id: 'welcome',
                role: 'assistant',
                content: `Olá! Sou a **Lyra**, sua assistente oficial. (Memória ativada - histórico carregado)`,
                timestamp: new Date(),
              },
              ...loadedMsgs
            ]);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar memória da Lyra:', err);
      }
    };
    loadHistory();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');

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
        body: JSON.stringify({ messages: history, userId }),
      });

      const data = await res.json();
      setMessages(prev => [...prev.slice(0, -1), {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Não foi possível gerar resposta.',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: 'Não consegui me conectar ao servidor de IA.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden" style={{ background: '#090514' }}>

      {/* Left Chat Area */}
      <div className="flex-1 flex flex-col h-full border-r border-purple-500/15">
        {/* Header */}
        <div className="p-5 border-b border-purple-500/15 bg-purple-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LyraAvatar size="lg" />
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                Lyra
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">IA Assistente</span>
              </h1>
              <p className="text-xs text-purple-300/70">Solution Math OS Official AI</p>
            </div>
          </div>

          <button
            onClick={() => setMessages([{ id: 'welcome', role: 'assistant', content: 'Conversa reiniciada!', timestamp: new Date() }])}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 border border-purple-500/20"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nova Conversa
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.role === 'assistant' ? (
                <LyraAvatar size="md" pulse={msg.loading} />
              ) : (
                <div className="w-9 h-9 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
              )}

              <div className={`max-w-[78%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-600/20 rounded-br-sm'
                      : 'bg-white/5 text-gray-200 border border-purple-500/15 rounded-bl-sm backdrop-blur-sm'
                  }`}
                >
                  {msg.loading ? (
                    <div className="flex items-center gap-2 py-0.5">
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                      <span className="text-xs text-purple-300 font-medium">Lyra processando...</span>
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
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

        {/* Action Pills */}
        <div className="px-6 py-2 border-t border-purple-500/10">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_PROMPTS.map((cat, i) => (
              <button
                key={i}
                onClick={() => sendMessage(cat.prompt)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-xs text-purple-200 transition-all"
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-6 bg-black/40 border-t border-purple-500/15">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-white/5 border border-purple-500/20 focus-within:border-purple-500/60 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              disabled={loading}
              placeholder="Como posso ajudar você hoje?"
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-purple-500/30"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Enviar</span><Send className="w-3.5 h-3.5" /></>}
            </button>
          </div>
        </div>
      </div>

      {/* Right HUD Panel (Reflecting official user image) */}
      <div className="w-full lg:w-[420px] bg-black/60 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
        <div>
          {/* Header titles */}
          <div className="mb-4">
            <h2 className="text-xs font-bold tracking-widest text-purple-400 uppercase">SOLUTION MATH</h2>
            <h3 className="text-lg font-black text-white tracking-wide">IA ASSISTENTE</h3>
          </div>

          {/* Official Lyra Image Card */}
          <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-950/80 mb-6 group">
            <img src="/lyra-avatar.jpg" alt="Lyra Visual Official" className="w-full h-80 object-cover object-top transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-xs font-bold text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-500/30">Lyra v2.0</span>
              <p className="text-white text-sm font-semibold mt-1.5">"Olá! Como posso ajudar você hoje?"</p>
            </div>
          </div>

          {/* Status & Efficiency Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-purple-500/15">
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">STATUS</span>
              <span className="inline-flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-purple-500/15">
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">EFICIÊNCIA</span>
              <span className="text-purple-300 font-black text-lg">98%</span>
            </div>
          </div>

          {/* Objective Box */}
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20">
            <span className="text-[10px] text-purple-400 font-bold tracking-wider uppercase block mb-1">OBJETIVO</span>
            <p className="text-sm font-semibold text-white">Simplificar. Otimizar. Evoluir.</p>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-purple-500/15 text-center">
          <p className="text-xs text-gray-500">Solution Math OS © 2026</p>
        </div>
      </div>

    </div>
  );
};
