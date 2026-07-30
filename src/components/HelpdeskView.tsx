import React, { useState, useEffect } from 'react';
import {
  LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle,
  User, Send, Filter, Search, ChevronRight, Tag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Ticket {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  user_name: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
}

interface TicketReply {
  id: number;
  ticket_id: number;
  author: string;
  role: string;
  message: string;
  created_at: string;
}

export const HelpdeskView: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Novo Chamado
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Geral');
  const [newPriority, setNewPriority] = useState('Média');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/tickets');
      if (res.ok) setTickets(await res.json());
    } catch (err) {
      console.error('Erro ao buscar chamados', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (ticketId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${ticketId}/replies`);
      if (res.ok) setReplies(await res.json());
    } catch (err) {
      console.error('Erro ao buscar respostas', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSelectTicket = (t: Ticket) => {
    setSelectedTicket(t);
    fetchReplies(t.id);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('http://localhost:3001/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          priority: newPriority,
          user_name: user?.name || 'Cliente',
        }),
      });

      if (res.ok) {
        setShowNewModal(false);
        setNewTitle('');
        setNewDescription('');
        fetchTickets();
      }
    } catch (err) {
      console.error('Erro ao criar ticket', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${selectedTicket.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: user?.name || 'Atendente',
          role: user?.role || 'funcionario',
          message: replyText,
        }),
      });

      if (res.ok) {
        setReplyText('');
        fetchReplies(selectedTicket.id);
        fetchTickets();
      }
    } catch (err) {
      console.error('Erro ao enviar resposta', err);
    }
  };

  const handleUpdateStatus = async (ticketId: number, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar status', err);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'Urgente':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">Urgente</span>;
      case 'Alta':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Alta</span>;
      case 'Média':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Média</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">Baixa</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolvido':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Resolvido</span>;
      case 'Em Atendimento':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Em Atendimento</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Aberto</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/60 p-6 rounded-2xl border border-gray-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Central de Suporte & Helpdesk</h1>
            <p className="text-xs text-gray-400">Gestão de chamados internos, dúvidas de clientes e suporte técnico.</p>
          </div>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Abrir Novo Chamado
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar chamados..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'Aberto', label: 'Abertos' },
            { id: 'Em Atendimento', label: 'Em Atendimento' },
            { id: 'Resolvido', label: 'Resolvidos' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === s.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-gray-800/80 text-gray-400 hover:text-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tickets List */}
        <div className={`space-y-3 ${selectedTicket ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          {loading ? (
            <div className="text-center py-12 text-gray-500 text-sm">Carregando chamados...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm bg-gray-900/40 rounded-2xl border border-gray-800">
              Nenhum chamado encontrado.
            </div>
          ) : (
            filteredTickets.map(t => (
              <div
                key={t.id}
                onClick={() => handleSelectTicket(t)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedTicket?.id === t.id
                    ? 'bg-gray-800/80 border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-mono text-blue-400 font-bold">#{t.id}</span>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(t.priority)}
                    {getStatusBadge(t.status)}
                  </div>
                </div>

                <h3 className="font-bold text-gray-200 text-sm mb-1 leading-snug line-clamp-1">{t.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{t.description || 'Sem descrição.'}</p>

                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800/60 pt-2.5">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <User className="w-3.5 h-3.5" />
                    {t.user_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-blue-400" />
                    {t.category}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Ticket Thread */}
        {selectedTicket && (
          <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between h-[650px]">
            {/* Thread Header */}
            <div>
              <div className="flex items-start justify-between gap-4 border-b border-gray-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-blue-400 font-bold">Chamado #{selectedTicket.id}</span>
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                  <h2 className="text-lg font-bold text-white leading-tight">{selectedTicket.title}</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Aberto por <strong>{selectedTicket.user_name}</strong> • Categoria: <strong>{selectedTicket.category}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status !== 'Resolvido' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolvido')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                    >
                      Marcar Resolvido
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-400 hover:text-gray-200 text-xs px-2 py-1"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-950/80 p-4 rounded-xl border border-gray-800 text-xs text-gray-300 mb-4">
                <span className="text-gray-500 font-bold block mb-1">Descrição Inicial:</span>
                {selectedTicket.description}
              </div>

              {/* Replies list */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
                {replies.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-500 italic">Nenhuma resposta gravada ainda.</div>
                ) : (
                  replies.map(r => (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-xl border text-xs ${
                        r.role === 'admin' || r.role === 'gerente'
                          ? 'bg-blue-950/30 border-blue-800/40 text-blue-100 ml-4'
                          : 'bg-gray-800/50 border-gray-700 text-gray-200 mr-4'
                      }`}
                    >
                      <div className="flex justify-between text-[11px] text-gray-400 font-medium mb-1">
                        <span className="font-bold text-blue-400">{r.author} ({r.role})</span>
                        <span>{new Date(r.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="leading-relaxed">{r.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="mt-4 pt-4 border-t border-gray-800 flex gap-2">
              <input
                type="text"
                placeholder="Escreva uma resposta para o chamado..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                Responder
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Modal Novo Chamado */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Abrir Novo Chamado de Suporte</h2>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Título do problema</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Erro ao emitir comprovante no PDV"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-200 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-200 outline-none"
                  >
                    <option>Geral</option>
                    <option>Fiscal</option>
                    <option>Estoque</option>
                    <option>Financeiro</option>
                    <option>Desempenho</option>
                    <option>Acessos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Prioridade</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-200 outline-none"
                  >
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                    <option>Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Descrição detalhada</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o que aconteceu..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-200 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                >
                  Criar Chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
