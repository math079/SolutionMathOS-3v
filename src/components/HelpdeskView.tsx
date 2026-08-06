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
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Resolvido</span>;
      case 'Em Atendimento':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">Em Atendimento</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">Aberto</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 th-surface p-6 rounded-2xl border th-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold th-text">Central de Suporte & Helpdesk</h1>
            <p className="text-xs th-muted">Gestão de chamados internos, dúvidas de clientes e suporte técnico.</p>
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
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 th-muted pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar chamados..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full th-input th-input-search text-sm th-text placeholder:th-muted focus:outline-none focus:border-blue-500"
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
                  : 'th-surface2 th-muted hover:th-text border th-border'
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
            <div className="text-center py-12 th-muted text-sm">Carregando chamados...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 th-muted text-sm th-surface rounded-2xl border th-border">
              Nenhum chamado encontrado.
            </div>
          ) : (
            filteredTickets.map(t => (
              <div
                key={t.id}
                onClick={() => handleSelectTicket(t)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedTicket?.id === t.id
                    ? 'bg-blue-500/10 border-blue-500 shadow-md'
                    : 'th-surface border th-border hover:border-blue-500/40 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-mono text-blue-500 font-bold">#{t.id}</span>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(t.priority)}
                    {getStatusBadge(t.status)}
                  </div>
                </div>

                <h3 className="font-bold th-text text-sm mb-1 leading-snug line-clamp-1">{t.title}</h3>
                <p className="text-xs th-muted line-clamp-2 mb-3">{t.description || 'Sem descrição.'}</p>

                <div className="flex items-center justify-between text-xs th-muted border-t th-border pt-2.5">
                  <span className="flex items-center gap-1.5 th-muted">
                    <User className="w-3.5 h-3.5" />
                    {t.user_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-blue-500" />
                    {t.category}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Ticket Thread */}
        {selectedTicket && (
          <div className="lg:col-span-7 th-surface border th-border rounded-2xl p-6 flex flex-col justify-between h-[650px] shadow-sm">
            {/* Thread Header */}
            <div>
              <div className="flex items-start justify-between gap-4 border-b th-border pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-blue-500 font-bold">Chamado #{selectedTicket.id}</span>
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                  <h2 className="text-lg font-bold th-text leading-tight">{selectedTicket.title}</h2>
                  <p className="text-xs th-muted mt-1">
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
                    className="th-muted hover:th-text text-xs px-2 py-1"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="th-surface2 p-4 rounded-xl border th-border text-xs th-text mb-4">
                <span className="th-muted font-bold block mb-1">Descrição Inicial:</span>
                {selectedTicket.description}
              </div>

              {/* Replies list */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
                {replies.length === 0 ? (
                  <div className="text-center py-6 text-xs th-muted italic">Nenhuma resposta gravada ainda.</div>
                ) : (
                  replies.map(r => (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-xl border text-xs ${
                        r.role === 'admin' || r.role === 'gerente'
                          ? 'bg-blue-500/10 border-blue-500/30 th-text ml-4'
                          : 'th-surface2 border th-border th-text mr-4'
                      }`}
                    >
                      <div className="flex justify-between text-[11px] th-muted font-medium mb-1">
                        <span className="font-bold text-blue-500">{r.author} ({r.role})</span>
                        <span>{new Date(r.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="leading-relaxed">{r.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="mt-4 pt-4 border-t th-border flex gap-2">
              <input
                type="text"
                placeholder="Escreva uma resposta para o chamado..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="flex-1 px-4 py-2.5 th-input text-sm th-text placeholder:th-muted"
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
          <div className="th-surface border th-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold th-text">Abrir Novo Chamado de Suporte</h2>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-medium th-muted mb-1">Título do problema</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Erro ao emitir comprovante no PDV"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 th-input text-sm th-text placeholder:th-muted"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium th-muted mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 th-input text-xs th-text"
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
                  <label className="block text-xs font-medium th-muted mb-1">Prioridade</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 th-input text-xs th-text"
                  >
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                    <option>Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium th-muted mb-1">Descrição detalhada</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o que aconteceu..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 th-input text-sm th-text placeholder:th-muted"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold th-muted hover:th-text"
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
