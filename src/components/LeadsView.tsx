import React, { useState, useEffect } from 'react';
import {
  Users, MessageSquare, Search, Filter, Download,
  CheckCircle2, Clock, AlertCircle, Trash2, ExternalLink,
  ChevronRight, ArrowUpRight, Sparkles, RefreshCw, Check
} from 'lucide-react';

interface Lead {
  id: number;
  name: string;
  whatsapp: string;
  business_type: string;
  plan_interest: string;
  status: 'Novo' | 'Contactado' | 'Qualificado' | 'Perdido' | 'Convertido';
  whatsapp_sent: number;
  notes: string;
  utm_source: string;
  created_at: string;
}

const BUSINESS_EMOJIS: Record<string, string> = {
  'Mercado / Mercearia': '🛒',
  'Hortifruti': '🥦',
  'Pet Shop': '🐾',
  'Autopeças': '🔧',
  'Papelaria': '📚',
  'Materiais de Construção': '🏗️',
  'Distribuidora': '🚚',
  'Outro comércio': '💼',
};

const PLAN_BADGES: Record<string, string> = {
  'Start': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Growth': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Enterprise': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  'Novo': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Contactado': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Qualificado': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Convertido': 'bg-emerald-500 text-white font-bold',
  'Perdido': 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const LeadsView: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [selectedPlan, setSelectedPlan] = useState<string>('Todos');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/leads', {
        headers: {
          'x-auth-user': 'admin',
          'x-auth-role': 'admin'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateLeadStatus = async (id: number, status: string, whatsapp_sent?: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-user': 'admin',
          'x-auth-role': 'admin'
        },
        body: JSON.stringify({ status, whatsapp_sent })
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status: status as any, whatsapp_sent: whatsapp_sent ?? l.whatsapp_sent } : l));
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const deleteLead = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/leads/${id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-user': 'admin',
          'x-auth-role': 'admin'
        }
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
        if (selectedLead?.id === id) setSelectedLead(null);
      }
    } catch (err) {
      console.error('Erro ao excluir lead:', err);
    }
  };

  const getWhatsAppMessage = (lead: Lead) => {
    const emoji = BUSINESS_EMOJIS[lead.business_type] || '💼';
    const cleanNum = lead.whatsapp.replace(/\D/g, '');
    const fullNum = cleanNum.startsWith('55') ? cleanNum : `55${cleanNum}`;
    
    const text = encodeURIComponent(
      `Olá ${lead.name}! ${emoji}\n\nVi seu cadastro no Solution Math OS para o plano *${lead.plan_interest}* (${lead.business_type || 'Comércio'}).\n\nSou do time comercial e estou à disposição para agendar sua demonstração gratuita ou tirar dúvidas!\n\nPodemos conversar agora?`
    );
    
    return `https://wa.me/${fullNum}?text=${text}`;
  };

  const openWhatsApp = (lead: Lead) => {
    updateLeadStatus(lead.id, lead.status === 'Novo' ? 'Contactado' : lead.status, 1);
    window.open(getWhatsAppMessage(lead), '_blank');
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.whatsapp.includes(searchTerm) ||
                          lead.business_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'Todos' || lead.status === selectedStatus;
    const matchesPlan = selectedPlan === 'Todos' || lead.plan_interest.includes(selectedPlan);
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Nome', 'WhatsApp', 'Tipo de Negocio', 'Plano', 'Status', 'Data Cadastro'];
    const rows = filteredLeads.map(l => [
      l.id,
      `"${l.name}"`,
      `"${l.whatsapp}"`,
      `"${l.business_type}"`,
      `"${l.plan_interest}"`,
      `"${l.status}"`,
      `"${new Date(l.created_at).toLocaleString('pt-BR')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_solution_math_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpis = {
    total: leads.length,
    novos: leads.filter(l => l.status === 'Novo').length,
    contactados: leads.filter(l => l.status === 'Contactado' || l.status === 'Qualificado').length,
    convertidos: leads.filter(l => l.status === 'Convertido').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b th-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold th-text">Funil de Leads & Landing Page</h1>
          </div>
          <p className="text-sm th-muted">
            Acompanhe em tempo real quem se cadastrou na landing page e inicie conversas automáticas no WhatsApp Business.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeads}
            className="p-2.5 rounded-xl border th-border th-surface2 hover:bg-primary/10 th-muted hover:text-primary transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="th-card p-4 rounded-2xl">
          <span className="text-xs th-muted font-medium">Total de Leads</span>
          <div className="text-2xl font-bold th-text mt-1">{kpis.total}</div>
        </div>
        <div className="th-card p-4 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-500 font-medium">Novos (Aguardando)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-emerald-500 mt-1">{kpis.novos}</div>
        </div>
        <div className="th-card p-4 rounded-2xl border-l-4 border-l-blue-500">
          <span className="text-xs text-blue-500 font-medium">Em Negociação</span>
          <div className="text-2xl font-bold text-blue-500 mt-1">{kpis.contactados}</div>
        </div>
        <div className="th-card p-4 rounded-2xl border-l-4 border-l-primary">
          <span className="text-xs text-primary font-medium">Convertidos (Vendas)</span>
          <div className="text-2xl font-bold text-primary mt-1">{kpis.convertidos}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="th-card flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 th-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar por nome, WhatsApp..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="th-input text-sm w-full"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs th-muted">
            <Filter className="w-3.5 h-3.5" /> Status:
          </div>
          {['Todos', 'Novo', 'Contactado', 'Qualificado', 'Convertido', 'Perdido'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === st
                  ? 'bg-primary text-white'
                  : 'th-surface2 th-muted hover:text-primary hover:bg-primary/10 border th-border'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="th-card rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm th-text">
            <thead className="th-surface2 text-xs uppercase th-muted border-b th-border">
              <tr>
                <th className="px-6 py-4">Lead / WhatsApp</th>
                <th className="px-6 py-4">Segmento</th>
                <th className="px-6 py-4">Plano de Interesse</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data do Cadastro</th>
                <th className="px-6 py-4 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y th-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center th-muted">
                    Carregando leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center th-muted">
                    Nenhum lead encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => {
                  const emoji = BUSINESS_EMOJIS[lead.business_type] || '💼';
                  return (
                    <tr key={lead.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold th-text flex items-center gap-2">
                          {lead.name}
                          {lead.status === 'Novo' && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          )}
                        </div>
                        <div className="text-xs th-muted flex items-center gap-1 mt-0.5">
                          <MessageSquare className="w-3 h-3 text-emerald-500" />
                          {lead.whatsapp}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg th-surface2 th-muted text-xs font-medium border th-border">
                          <span>{emoji}</span>
                          {lead.business_type || 'Não informado'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${PLAN_BADGES[lead.plan_interest] || 'th-surface2 th-muted th-border'}`}>
                          {lead.plan_interest || 'Geral'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onChange={e => updateLeadStatus(lead.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer ${STATUS_COLORS[lead.status] || 'th-surface2 th-muted'}`}
                        >
                          <option value="Novo">Novo</option>
                          <option value="Contactado">Contactado</option>
                          <option value="Qualificado">Qualificado</option>
                          <option value="Convertido">Convertido (Cliente)</option>
                          <option value="Perdido">Perdido</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 text-xs th-muted">
                        {new Date(lead.created_at).toLocaleString('pt-BR')}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openWhatsApp(lead)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                            title="Iniciar conversa no WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            WhatsApp
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </button>

                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="p-1.5 rounded-lg th-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Excluir lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
