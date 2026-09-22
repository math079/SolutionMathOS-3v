import React, { useState, useEffect } from 'react';
import {
  BadgeDollarSign, PlusCircle, Globe, CheckCircle2, TrendingUp,
  CreditCard, Calendar, Filter, Trash2, Copy, Check, Terminal,
  ExternalLink, Zap, ArrowUpRight, DollarSign, Clock, ShieldCheck,
  Search, RefreshCw, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface Sale {
  id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  product_name: string;
  amount: number;
  payment_method: string;
  channel: string;
  status: string;
  notes?: string;
  month: string;
  external_id?: string;
  created_at: string;
}

interface SalesStats {
  totalRevenue: number;
  totalCount: number;
  avgTicket: number;
  monthRevenue: number;
  monthCount: number;
  byChannel: Array<{ channel: string; count: number; total: number }>;
  byPaymentMethod: Array<{ payment_method: string; count: number; total: number }>;
  monthlyTimeline: Array<{ month: string; count: number; total: number }>;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

const fmt = (v: number) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtShort = (v: number) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

export const SalesDashboardView: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Filtros
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modais
  const [showManualModal, setShowManualModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);

  // Form Manual
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    product_name: 'Solution Math OS - Licença Anual',
    amount: '15000',
    payment_method: 'PIX',
    notes: '',
    sync_finance: true
  });

  const webhookUrl = 'http://localhost:3001/api/sales/webhook';

  const webhookExamplePayload = `{
  "customer_name": "Nome do Cliente",
  "customer_email": "cliente@email.com",
  "customer_phone": "(11) 99999-8888",
  "product_name": "Solution Math OS - Growth",
  "amount": 3470.00,
  "payment_method": "Cartão de Crédito",
  "order_id": "PEDIDO-10023"
}`;

  useEffect(() => {
    loadSalesData();
  }, [filterMonth, filterChannel]);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filterMonth !== 'all') queryParams.append('month', filterMonth);
      if (filterChannel !== 'all') queryParams.append('channel', filterChannel);

      const [salesRes, statsRes] = await Promise.all([
        fetch(`http://localhost:3001/api/sales?${queryParams.toString()}`).then(r => r.json()),
        fetch('http://localhost:3001/api/sales/stats').then(r => r.json())
      ]);

      setSales(Array.isArray(salesRes) ? salesRes : []);
      setStats(statsRes);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount) || 0
        })
      });

      if (res.ok) {
        setShowManualModal(false);
        setForm({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          product_name: 'Solution Math OS - Licença Anual',
          amount: '15000',
          payment_method: 'PIX',
          notes: '',
          sync_finance: true
        });
        loadSalesData();
      }
    } catch (err) {
      console.error('Erro ao registrar venda:', err);
    }
  };

  const handleDeleteSale = async (id: number) => {
    if (!confirm('Deseja realmente excluir este registro de venda?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/sales/${id}`, { method: 'DELETE' });
      if (res.ok) loadSalesData();
    } catch (err) {
      console.error('Erro ao excluir venda:', err);
    }
  };

  const handleTestWebhook = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/sales/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Cliente Teste Webhook',
          customer_email: 'teste@webhook.com',
          customer_phone: '(11) 98888-7777',
          product_name: 'Licença Solution Math OS (Simulação)',
          amount: 2990.00,
          payment_method: 'PIX Automático',
          order_id: 'TEST-' + Math.floor(1000 + Math.random() * 9000)
        })
      });

      if (res.ok) {
        alert('Venda simulada enviada com sucesso pelo Webhook!');
        setShowWebhookModal(false);
        loadSalesData();
      }
    } catch (err) {
      alert('Erro ao enviar teste de webhook.');
    }
  };

  const copyToClipboard = (text: string, type: 'url' | 'payload') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  const filteredSales = sales.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.customer_name?.toLowerCase().includes(term) ||
      s.product_name?.toLowerCase().includes(term) ||
      s.external_id?.toLowerCase().includes(term) ||
      s.customer_email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b th-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <BadgeDollarSign size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold th-text flex items-center gap-2">
                Painel Central de Vendas
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Ao Vivo
                </span>
              </h2>
              <p className="th-muted text-sm mt-0.5">
                Monitoramento exclusivo de vendas com entrada manual e webhook direto para o seu site ou checkout
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowWebhookModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl th-surface2 border th-border th-text hover:border-primary/50 text-sm font-semibold transition-all hover:scale-[1.02]"
          >
            <Globe size={16} className="text-primary" />
            Integrar Webhook do Site
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <PlusCircle size={16} />
            Lançar Venda Manual
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="th-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-3">
            <span className="th-muted text-xs font-bold uppercase tracking-wider">Faturamento Total em Vendas</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-emerald-500 mb-1 truncate">
            {fmt(stats?.totalRevenue || 0)}
          </div>
          <div className="text-xs th-muted flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>{stats?.totalCount || 0} transações confirmadas</span>
          </div>
        </div>

        <div className="th-card p-5 border-l-4 border-l-primary">
          <div className="flex items-center justify-between mb-3">
            <span className="th-muted text-xs font-bold uppercase tracking-wider">Vendas Mês Atual (Setembro)</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-primary mb-1 truncate">
            {fmt(stats?.monthRevenue || 0)}
          </div>
          <div className="text-xs th-muted">
            {stats?.monthCount || 0} vendas realizadas em Setembro/2026
          </div>
        </div>

        <div className="th-card p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-3">
            <span className="th-muted text-xs font-bold uppercase tracking-wider">Ticket Médio por Venda</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-purple-500 mb-1 truncate">
            {fmt(stats?.avgTicket || 0)}
          </div>
          <div className="text-xs th-muted">Média por cliente faturado</div>
        </div>

        <div className="th-card p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-3">
            <span className="th-muted text-xs font-bold uppercase tracking-wider">Canal Site & Automações</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Zap size={18} />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-blue-500 mb-1 truncate">
            {stats?.byChannel.find(c => c.channel.includes('Site'))?.count || 0} vendas
          </div>
          <div className="text-xs th-muted">
            Total online: {fmt(stats?.byChannel.find(c => c.channel.includes('Site'))?.total || 0)}
          </div>
        </div>
      </div>

      {/* Gráficos Resumidos de Vendas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Histórico Mensal */}
        <div className="lg:col-span-2 th-card p-5">
          <h3 className="font-bold th-text text-base mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            Curva de Faturamento de Vendas (2026)
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.monthlyTimeline || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="th-surface p-3 rounded-xl border th-border shadow-xl text-xs">
                        <p className="font-bold th-text mb-1">{d.month}</p>
                        <p className="text-emerald-500 font-semibold">Total: {fmt(d.total)}</p>
                        <p className="th-muted">{d.count} vendas</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição por Canal e Pagamento */}
        <div className="th-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold th-text text-base mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              Canais & Formas de Pagamento
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold th-muted block mb-2">Origem da Venda:</span>
                <div className="space-y-2">
                  {stats?.byChannel.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl th-surface2 border th-border text-xs">
                      <span className="font-medium th-text flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${c.channel.includes('Site') ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                        {c.channel}
                      </span>
                      <div className="text-right">
                        <span className="font-bold th-text block">{fmtShort(c.total)}</span>
                        <span className="text-[10px] th-muted">{c.count} vendas</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold th-muted block mb-2">Método de Pagamento:</span>
                <div className="grid grid-cols-2 gap-2">
                  {stats?.byPaymentMethod.map((p, i) => (
                    <div key={i} className="p-2.5 rounded-xl th-surface2 border th-border text-xs">
                      <span className="text-[11px] th-muted block">{p.payment_method}</span>
                      <span className="font-bold th-text block text-sm mt-0.5">{fmtShort(p.total)}</span>
                      <span className="text-[10px] text-emerald-500 font-semibold">{p.count} un.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="th-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold th-text">Histórico & Extrato de Vendas</h3>
            <p className="text-xs th-muted mt-0.5">{filteredSales.length} transações encontradas</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Campo de Busca */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 th-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar cliente, produto ou código..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="th-input pl-8 py-1.5 text-xs w-64"
              />
            </div>

            {/* Filtro Canal */}
            <select
              value={filterChannel}
              onChange={e => setFilterChannel(e.target.value)}
              className="th-input text-xs py-1.5 font-medium"
            >
              <option value="all">Todos os Canais</option>
              <option value="Manual">Manual</option>
              <option value="Site / Webhook">Site / Webhook</option>
            </select>

            <button
              onClick={loadSalesData}
              className="p-2 rounded-xl th-surface2 border th-border th-muted hover:th-text transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b th-border th-surface2">
                <th className="py-3 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider hidden sm:table-cell">Código</th>
                <th className="py-3 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider">Cliente</th>
                <th className="py-3 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider hidden sm:table-cell">Produto / Serviço</th>
                <th className="py-3 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider">Canal</th>
                <th className="py-3 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider hidden sm:table-cell">Pagamento</th>
                <th className="py-3 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="py-3 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider">Valor</th>
                <th className="py-3 px-3 text-right text-xs font-semibold th-muted uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y th-border">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center th-muted text-sm">
                    Nenhuma venda encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-primary/5 transition-colors">
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <span className="font-mono text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/5 font-semibold text-primary">
                        {sale.external_id || `#${sale.id}`}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium th-text">{sale.customer_name}</div>
                      <div className="text-[11px] th-muted">{sale.customer_email || sale.customer_phone || 'Sem contato'}</div>
                    </td>
                    <td className="py-3 px-3 font-medium th-text hidden sm:table-cell">
                      {sale.product_name}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        sale.channel.includes('Site')
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {sale.channel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs th-muted font-medium hidden sm:table-cell">
                      {sale.payment_method}
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-500">
                      {fmt(sale.amount)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        className="p-1.5 rounded-lg th-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Excluir Registro"
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

      {/* Modal: Lançamento Manual de Venda */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="th-card border th-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b th-border pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle size={20} className="text-emerald-500" />
                <h3 className="text-lg font-bold th-text">Lançar Nova Venda Manual</h3>
              </div>
              <button onClick={() => setShowManualModal(false)} className="th-muted hover:text-rose-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-4">
              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Nome do Cliente / Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Comercial Alvorada Ltda"
                  value={form.customer_name}
                  onChange={e => setForm({ ...form, customer_name: e.target.value })}
                  className="th-input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">E-mail (opcional)</label>
                  <input
                    type="email"
                    placeholder="contato@empresa.com"
                    value={form.customer_email}
                    onChange={e => setForm({ ...form, customer_email: e.target.value })}
                    className="th-input text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={form.customer_phone}
                    onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                    className="th-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Produto / Plano Vendido *</label>
                  <input
                    type="text"
                    required
                    placeholder="Solution Math OS - Licença Anual"
                    value={form.product_name}
                    onChange={e => setForm({ ...form, product_name: e.target.value })}
                    className="th-input text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Valor da Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="15000.00"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="th-input text-sm font-bold text-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Método de Pagamento</label>
                <select
                  value={form.payment_method}
                  onChange={e => setForm({ ...form, payment_method: e.target.value })}
                  className="th-input text-sm"
                >
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Boleto Bancário">Boleto Bancário</option>
                  <option value="Transferência">Transferência Bancária</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Observações do Negócio</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes do contrato, parcelamento ou termos acordados..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="th-input text-sm"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl th-surface2 border th-border">
                <input
                  type="checkbox"
                  id="syncFinance"
                  checked={form.sync_finance}
                  onChange={e => setForm({ ...form, sync_finance: e.target.checked })}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <label htmlFor="syncFinance" className="text-xs th-text cursor-pointer select-none">
                  Integrar automaticamente esta venda no <strong>Fluxo de Caixa / Financeiro</strong>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl th-surface2 border th-border th-muted hover:th-text text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-md transition-colors"
                >
                  Confirmar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Instruções de Webhook & Automação do Site */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="th-card border th-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 border-b th-border pb-3">
              <div className="flex items-center gap-2">
                <Globe size={20} className="text-primary" />
                <h3 className="text-lg font-bold th-text">Como Integrar Vendas do seu Site (Webhook)</h3>
              </div>
              <button onClick={() => setShowWebhookModal(false)} className="th-muted hover:text-rose-500">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <p className="th-muted text-xs leading-relaxed">
                Toda vez que uma venda for concluída no seu site, checkout (Stripe, Mercado Pago, Hotmart, Kiwify, etc.) ou formulário, você pode disparar um <strong>POST HTTP</strong> para a URL abaixo. A venda aparecerá neste dashboard instantaneamente e alimentará as métricas!
              </p>

              {/* URL do Webhook */}
              <div>
                <label className="text-xs font-bold th-text block mb-1">URL do Endpoint de Vendas (Webhook):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="th-input font-mono text-xs flex-1 bg-black/5 dark:bg-white/5 font-semibold text-primary"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
                  >
                    {copiedWebhook ? <Check size={14} /> : <Copy size={14} />}
                    {copiedWebhook ? 'Copiado!' : 'Copiar URL'}
                  </button>
                </div>
              </div>

              {/* JSON de Exemplo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold th-text">Exemplo do Formato JSON aceito:</label>
                  <button
                    onClick={() => copyToClipboard(webhookExamplePayload, 'payload')}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    {copiedPayload ? <Check size={12} /> : <Copy size={12} />}
                    {copiedPayload ? 'JSON Copiado!' : 'Copiar JSON'}
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
                  {webhookExamplePayload}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Integração Automática com o Caixa
                </div>
                <p className="th-muted">
                  As vendas recebidas via Webhook recebem o selo <span className="font-bold text-blue-500">Site / Webhook</span> e são sincronizadas automaticamente com o módulo <strong>Financeiro 2026</strong>.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t th-border">
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  <Zap size={14} />
                  Disparar Venda de Teste Agora
                </button>

                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 rounded-xl th-surface2 border th-border th-muted hover:th-text text-xs font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
