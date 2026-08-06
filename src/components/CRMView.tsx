import React, { useState, useEffect } from 'react';
import { Trash2, TrendingUp, Users, CheckCircle, PlusCircle, X, Phone, Mail, Building2, Tag, FileText, Globe } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone?: string;
  source?: string;
  notes?: string;
  status: string;
}

const SOURCES = ['Site', 'Indicação', 'Instagram', 'LinkedIn', 'Google Ads', 'Cold Outreach', 'Evento', 'Outro'];
const STATUSES = ['Lead', 'Contato Feito', 'Proposta Enviada', 'Negociação', 'Fechado', 'Perdido'];

const statusStyle = (status: string) => {
  switch (status) {
    case 'Fechado': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
    case 'Negociação': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800';
    case 'Proposta Enviada': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-300 dark:border-blue-800';
    case 'Contato Feito': return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-300 dark:border-purple-800';
    case 'Perdido': return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-300 dark:border-rose-800';
    default: return 'th-surface2 th-muted border-th-border';
  }
};

const emptyForm = { name: '', company: '', email: '', phone: '', source: 'Site', notes: '', status: 'Lead' };

const CRMView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/crm/clients');
      setClients(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('http://localhost:3001/api/crm/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setClients(prev => [...prev, data]);
      setForm(emptyForm);
      setShowPanel(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`http://localhost:3001/api/crm/clients/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    if (selectedClient?.id === id) setSelectedClient(prev => prev ? { ...prev, status } : null);
  };

  const deleteClient = async (id: number) => {
    if (!confirm("Excluir este lead permanentemente?")) return;
    await fetch(`http://localhost:3001/api/crm/clients/${id}`, { method: 'DELETE' });
    setClients(prev => prev.filter(c => c.id !== id));
    if (selectedClient?.id === id) setSelectedClient(null);
  };

  // Metrics
  const total = clients.length;
  const leads = clients.filter(c => c.status === 'Lead').length;
  const inProgress = clients.filter(c => ['Contato Feito', 'Proposta Enviada', 'Negociação'].includes(c.status)).length;
  const closed = clients.filter(c => c.status === 'Fechado').length;
  const convRate = total > 0 ? Math.round((closed / total) * 100) : 0;

  return (
    <div className="flex flex-1 overflow-hidden h-full">

      {/* ─── Main Area ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b th-border">
          <h3 className="text-lg font-bold th-text">CRM — Pipeline de Vendas</h3>
          <button
            onClick={() => { setShowPanel(true); setSelectedClient(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors"
          >
            <PlusCircle size={16} /> Novo Lead
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-5 gap-3 px-6 py-4">
          {[
            { label: 'Total', value: total, color: 'th-text' },
            { label: 'Novos Leads', value: leads, color: 'text-blue-500' },
            { label: 'Em Progresso', value: inProgress, color: 'text-amber-500' },
            { label: 'Fechados', value: closed, color: 'text-emerald-500' },
            { label: 'Conversão', value: `${convRate}%`, color: 'text-primary' },
          ].map((m, i) => (
            <div key={i} className="th-card px-4 py-3">
              <div className="text-xs th-muted font-medium mb-1">{m.label}</div>
              <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="th-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b th-border th-surface2">
                  <th className="py-3 px-4 text-xs font-semibold th-muted uppercase tracking-wider">Contato</th>
                  <th className="py-3 px-4 text-xs font-semibold th-muted uppercase tracking-wider">Empresa</th>
                  <th className="py-3 px-4 text-xs font-semibold th-muted uppercase tracking-wider">Origem</th>
                  <th className="py-3 px-4 text-xs font-semibold th-muted uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold th-muted uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center th-muted">Sincronizando...</td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center th-muted">Nenhum lead no pipeline. Adicione o primeiro!</td></tr>
                ) : (
                  clients.map(client => (
                    <tr
                      key={client.id}
                      className={`border-b th-border hover:bg-primary/5 transition-colors cursor-pointer ${selectedClient?.id === client.id ? 'bg-primary/10' : ''}`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold th-text text-sm">{client.name}</div>
                        <div className="text-xs th-muted">{client.email}</div>
                      </td>
                      <td className="py-3 px-4 text-sm th-muted">{client.company || '—'}</td>
                      <td className="py-3 px-4 text-sm th-muted">{client.source || '—'}</td>
                      <td className="py-3 px-4">
                        <select
                          value={client.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateStatus(client.id, e.target.value)}
                          className={`px-2 py-1 rounded-md text-xs font-bold border outline-none cursor-pointer appearance-none ${statusStyle(client.status)}`}
                        >
                          {STATUSES.map(s => <option key={s} value={s} className="th-surface th-text">{s}</option>)}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); deleteClient(client.id); }}
                          className="th-muted hover:text-rose-500 transition-colors p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Detail Panel (right) when a client is selected ─── */}
      {selectedClient && !showPanel && (
        <div className="w-72 border-l th-border th-surface p-5 overflow-y-auto flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h4 className="font-bold th-text text-sm">Detalhes do Lead</h4>
            <button onClick={() => setSelectedClient(null)} className="th-muted hover:th-text"><X size={16} /></button>
          </div>
          <div className="space-y-4 text-sm flex-1">
            <div>
              <div className="text-xs th-muted mb-1">Nome</div>
              <div className="font-semibold th-text">{selectedClient.name}</div>
            </div>
            <div>
              <div className="text-xs th-muted mb-1">Empresa</div>
              <div className="th-text">{selectedClient.company || '—'}</div>
            </div>
            <div className="flex items-center gap-2 th-text">
              <Mail size={14} className="text-primary shrink-0" />
              <span className="truncate">{selectedClient.email}</span>
            </div>
            {selectedClient.phone && (
              <div className="flex items-center gap-2 th-text">
                <Phone size={14} className="text-primary shrink-0" />
                <span>{selectedClient.phone}</span>
              </div>
            )}
            {selectedClient.source && (
              <div className="flex items-center gap-2 th-text">
                <Globe size={14} className="text-primary shrink-0" />
                <span>{selectedClient.source}</span>
              </div>
            )}
            <div>
              <div className="text-xs th-muted mb-1">Status</div>
              <select
                value={selectedClient.status}
                onChange={e => updateStatus(selectedClient.id, e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer ${statusStyle(selectedClient.status)}`}
              >
                {STATUSES.map(s => <option key={s} value={s} className="th-surface th-text">{s}</option>)}
              </select>
            </div>
            {selectedClient.notes && (
              <div>
                <div className="text-xs th-muted mb-1 flex items-center gap-1"><FileText size={12}/> Observações</div>
                <div className="th-surface2 rounded-xl p-3 border th-border text-xs leading-relaxed th-text">{selectedClient.notes}</div>
              </div>
            )}
          </div>
          <button
            onClick={() => deleteClient(selectedClient.id)}
            className="mt-6 w-full py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-colors"
          >
            Remover Lead
          </button>
        </div>
      )}

      {/* ─── Add Lead Slide-in Panel ─── */}
      {showPanel && (
        <div className="w-80 border-l th-border th-surface p-5 overflow-y-auto flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold th-text">Capturar Novo Lead</h4>
            <button onClick={() => setShowPanel(false)} className="th-muted hover:th-text transition-colors"><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold th-muted mb-1 block">Nome Completo *</label>
              <div className="relative">
                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 th-muted pointer-events-none z-10" />
                <input
                  type="text" required placeholder="Ex: João Silva"
                  className="th-input th-input-search"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="text-xs font-semibold th-muted mb-1 block">Empresa</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 th-muted pointer-events-none z-10" />
                <input
                  type="text" placeholder="Ex: Acme Corp"
                  className="th-input th-input-search"
                  value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold th-muted mb-1 block">Email *</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 th-muted pointer-events-none z-10" />
                <input
                  type="email" required placeholder="contato@empresa.com"
                  className="th-input th-input-search"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold th-muted mb-1 block">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 th-muted pointer-events-none z-10" />
                <input
                  type="text" placeholder="(11) 99999-9999"
                  className="th-input th-input-search"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="text-xs font-semibold th-muted mb-1 block">Origem do Lead</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 th-muted pointer-events-none z-10" />
                <select
                  className="th-input th-input-search"
                  value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                >
                  {SOURCES.map(s => <option key={s} value={s} className="th-surface th-text">{s}</option>)}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold th-muted mb-1 block">Status Inicial</label>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 th-muted pointer-events-none z-10" />
                <select
                  className="th-input th-input-search"
                  value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map(s => <option key={s} value={s} className="th-surface th-text">{s}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold th-muted mb-1 block">Observações / Contexto</label>
              <textarea
                rows={3} placeholder="Interesse em sistema de gestão, budget de R$5k..."
                className="th-input resize-none"
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <button
              type="submit" disabled={saving}
              className="mt-auto w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Registrar Lead no CRM'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CRMView;
