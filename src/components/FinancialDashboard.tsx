import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Percent, Target, Zap,
  PlusCircle, X, Calendar, Edit3, Trash2, Printer, Calculator
} from 'lucide-react';

const COLORS = ['#14b8a6','#2dd4bf','#0d9488','#5eead4','#99f6e4','#f59e0b','#ef4444','#8b5cf6'];

const ALL_MONTHS: Record<string, string> = {
  '2026-01': 'Janeiro 2026', '2026-02': 'Fevereiro 2026', '2026-03': 'Março 2026',
  '2026-04': 'Abril 2026',   '2026-05': 'Maio 2026',      '2026-06': 'Junho 2026',
  '2026-07': 'Julho 2026',   '2026-08': 'Agosto 2026',    '2026-09': 'Setembro 2026',
  '2026-10': 'Outubro 2026',  '2026-11': 'Novembro 2026',  '2026-12': 'Dezembro 2026'
};

const MONTH_SHORT: Record<string, string> = {
  '2026-01': 'Jan', '2026-02': 'Fev', '2026-03': 'Mar', '2026-04': 'Abr',
  '2026-05': 'Mai', '2026-06': 'Jun', '2026-07': 'Jul', '2026-08': 'Ago',
  '2026-09': 'Set', '2026-10': 'Out', '2026-11': 'Nov', '2026-12': 'Dez'
};

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

interface MonthRow { month: string; revenue: number; expense: number; }
interface CatRow  { category: string; revenue: number; }
interface Summary  { total_revenue: number; total_expense: number; net_profit: number; }
interface Transaction { id: number; description: string; amount: number; type: string; category: string; month: string; }

const FinancialDashboard: React.FC = () => {
  const [summary, setSummary]           = useState<Summary | null>(null);
  const [monthly, setMonthly]           = useState<MonthRow[]>([]);
  const [byCategory, setByCategory]     = useState<CatRow[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [showAddModal, setShowAddModal]   = useState(false);
  const [editingTx, setEditingTx]       = useState<Transaction | null>(null);

  // Predictability Simulation Additions
  const [simExtraMonthlySales, setSimExtraMonthlySales] = useState<number>(2);
  const [simProductTicket, setSimProductTicket]         = useState<number>(5000);

  const [form, setForm] = useState({
    description: '', amount: '', type: 'income',
    category: 'Sistemas', month: '2026-07'
  });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [s, m, c, t] = await Promise.all([
        fetch('http://localhost:3001/api/finance/summary').then(r => r.json()),
        fetch('http://localhost:3001/api/finance/monthly').then(r => r.json()),
        fetch('http://localhost:3001/api/finance/by-category').then(r => r.json()),
        fetch('http://localhost:3001/api/finance/transactions').then(r => r.json()),
      ]);
      setSummary(s); setMonthly(m); setByCategory(c); setTransactions(t);
    } catch (e) { console.error("Erro ao carregar dados financeiros:", e); }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTx) {
        await fetch(`http://localhost:3001/api/finance/transactions/${editingTx.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
        });
      } else {
        await fetch('http://localhost:3001/api/finance/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
        });
      }
      setShowAddModal(false);
      setEditingTx(null);
      resetForm();
      loadAll();
    } catch (e) { console.error("Erro ao salvar transação:", e); }
  };

  const deleteTransaction = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta transação financeira?")) return;
    try {
      await fetch(`http://localhost:3001/api/finance/transactions/${id}`, { method: 'DELETE' });
      loadAll();
    } catch (e) { console.error("Erro ao deletar transação:", e); }
  };

  const openEditModal = (t: Transaction) => {
    setEditingTx(t);
    setForm({
      description: t.description,
      amount: String(t.amount),
      type: t.type,
      category: t.category || 'Sistemas',
      month: t.month || '2026-07'
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setForm({ description: '', amount: '', type: 'income', category: 'Sistemas', month: '2026-07' });
  };

  const handlePrintDRE = () => {
    window.print();
  };

  const filteredTransactions = selectedMonth === 'all'
    ? transactions
    : transactions.filter(t => t.month === selectedMonth);

  const activeMonthData = monthly.find(m => m.month === selectedMonth);

  let viewRevenue = 0;
  let viewExpense = 0;
  let viewProfit  = 0;
  let viewTrend   = '';

  if (selectedMonth === 'all') {
    viewRevenue = summary?.total_revenue || 0;
    viewExpense = summary?.total_expense || 0;
    viewProfit  = summary?.net_profit || 0;
    viewTrend   = 'Visão Acumulada Anual (2026)';
  } else {
    viewRevenue = activeMonthData?.revenue || 0;
    viewExpense = activeMonthData?.expense || 0;
    viewProfit  = viewRevenue - viewExpense;

    const allKeys = Object.keys(ALL_MONTHS);
    const currIdx = allKeys.indexOf(selectedMonth);
    if (currIdx > 0) {
      const prevKey = allKeys[currIdx - 1];
      const prevData = monthly.find(m => m.month === prevKey);
      if (prevData && prevData.revenue > 0) {
        const diffPercent = ((viewRevenue - prevData.revenue) / prevData.revenue) * 100;
        viewTrend = `${diffPercent >= 0 ? '+' : ''}${diffPercent.toFixed(1)}% vs ${MONTH_SHORT[prevKey]}`;
      } else {
        viewTrend = 'Mês Selecionado';
      }
    } else {
      viewTrend = 'Início de 2026';
    }
  }

  const viewMargin = viewRevenue > 0 ? (viewProfit / viewRevenue) * 100 : 0;

  // Annual Predictability Calculations
  const realizedRevenue2026 = monthly.reduce((s, m) => s + m.revenue, 0);
  const realizedExpense2026 = monthly.reduce((s, m) => s + m.expense, 0);
  const simExtraMonthlyRevenue = simExtraMonthlySales * simProductTicket;
  const simExtraTotal2026      = simExtraMonthlyRevenue * 5;
  const totalProjectedRevenue2026 = realizedRevenue2026 + simExtraTotal2026;
  const totalProjectedProfit2026  = totalProjectedRevenue2026 - (realizedExpense2026 + (26000 * 5));

  const monthlyProfitData = monthly.map(m => ({
    ...m,
    name: MONTH_SHORT[m.month] || m.month,
    lucro: m.revenue - m.expense,
    active: m.month === selectedMonth
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="th-surface border th-border rounded-xl p-3 text-sm shadow-xl">
        <div className="font-bold th-text mb-2">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="th-text font-semibold">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-transparent space-y-6">
      {/* Printable DRE Header */}
      <div className="hidden print:block text-black p-4 space-y-4">
        <h1 className="text-2xl font-bold border-b pb-2">SOLUTION MATH — DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE 2026)</h1>
        <p className="text-sm">Relatório gerado em 22/07/2026 | Período: {selectedMonth === 'all' ? 'Ano 2026 Completo' : ALL_MONTHS[selectedMonth]}</p>
        <div className="grid grid-cols-3 gap-4 border p-4">
          <div><strong>Faturamento Total:</strong> {fmt(viewRevenue)}</div>
          <div><strong>Custos Operacionais:</strong> {fmt(viewExpense)}</div>
          <div><strong>Lucro Líquido:</strong> {fmt(viewProfit)} ({viewMargin.toFixed(1)}%)</div>
        </div>
      </div>

      {/* Screen Web Interface Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b th-border pb-5 print:hidden">
        <div>
          <h2 className="text-2xl font-bold th-text flex items-center gap-2">
            Dashboard Financeiro & Previsibilidade 2026
            {selectedMonth !== 'all' && (
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                {ALL_MONTHS[selectedMonth]}
              </span>
            )}
          </h2>
          <p className="th-muted text-sm mt-1">Gestão de faturamento, simulação de metas e emissão de DRE/Relatórios</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector Filter */}
          <div className="flex items-center gap-2 th-surface2 border th-border px-3 py-2 rounded-xl text-sm">
            <Calendar size={16} className="text-primary" />
            <span className="th-muted text-xs font-semibold">Mês:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent th-text font-bold outline-none cursor-pointer"
            >
              <option value="all" className="th-surface th-text">Ano 2026 Completo (Visão Geral)</option>
              {Object.entries(ALL_MONTHS).map(([key, label]) => (
                <option key={key} value={key} className="th-surface th-text">{label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrintDRE}
            className="flex items-center gap-2 px-3 py-2 th-surface2 border th-border th-text hover:bg-primary/10 text-sm font-semibold rounded-xl transition-colors"
            title="Imprimir Relatório DRE em PDF"
          >
            <Printer size={16} /> Relatório PDF
          </button>

          <button
            onClick={() => { resetForm(); setEditingTx(null); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors"
          >
            <PlusCircle size={16}/> Lançar Faturamento
          </button>
        </div>
      </div>

      {/* Month Filter Quick Badges */}
      <div className="flex flex-wrap items-center gap-1.5 print:hidden">
        <button
          onClick={() => setSelectedMonth('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            selectedMonth === 'all'
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'th-surface2 th-muted border-th-border hover:text-primary'
          }`}
        >
          Ano 2026
        </button>
        {Object.entries(ALL_MONTHS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedMonth(key)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              selectedMonth === key
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'th-surface2 th-muted border-th-border hover:text-primary'
            }`}
          >
            {MONTH_SHORT[key]}
          </button>
        ))}
      </div>

      {/* Predictability Simulator Card */}
      <div className="th-card p-6 border-l-4 border-l-primary relative overflow-hidden print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Calculator size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold th-text">Calculadora de Previsibilidade & Projeção Anual (2026)</h4>
              <p className="text-xs th-muted">Simule novos contratos e veja o faturamento projetado até Dezembro/2026</p>
            </div>
          </div>
          <span className="text-xs text-emerald-600 font-bold px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-full">
            Projeção 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="th-surface2 border th-border rounded-xl p-4">
            <label className="text-xs font-semibold th-muted mb-1 block">Meta Vendas / Mês</label>
            <input
              type="number"
              min={0}
              value={simExtraMonthlySales}
              onChange={e => setSimExtraMonthlySales(Math.max(0, parseInt(e.target.value) || 0))}
              className="th-input text-sm font-bold"
            />
          </div>

          <div className="th-surface2 border th-border rounded-xl p-4">
            <label className="text-xs font-semibold th-muted mb-1 block">Ticket Médio (R$)</label>
            <input
              type="number"
              value={simProductTicket}
              onChange={e => setSimProductTicket(parseFloat(e.target.value) || 0)}
              className="th-input text-sm font-bold"
            />
          </div>

          <div className="th-surface2 border th-border rounded-xl p-4">
            <span className="text-xs font-semibold th-muted block mb-1">Projeção Faturamento 2026</span>
            <div className="text-2xl font-bold text-primary">{fmt(totalProjectedRevenue2026)}</div>
            <div className="text-xs text-primary/80 mt-1">Realizado + Meta Ago-Dez</div>
          </div>

          <div className="th-surface2 border border-emerald-300 dark:border-emerald-800 rounded-xl p-4 bg-emerald-50 dark:bg-emerald-950/20">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">Lucro Líquido Projetado 2026</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalProjectedProfit2026)}</div>
            <div className="text-xs th-muted mt-1">Após custos fixos e variáveis</div>
          </div>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="th-card p-5">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
            <DollarSign size={20}/>
          </div>
          <div className="th-muted text-xs mb-1">
            {selectedMonth === 'all' ? 'Faturamento Total 2026' : `Faturamento (${MONTH_SHORT[selectedMonth]})`}
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{fmt(viewRevenue)}</div>
          <div className="text-xs text-primary font-medium">{viewTrend}</div>
        </div>

        <div className="th-card p-5">
          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-950/40 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
            <TrendingDown size={20}/>
          </div>
          <div className="th-muted text-xs mb-1">
            {selectedMonth === 'all' ? 'Custos Totais 2026' : `Custos (${MONTH_SHORT[selectedMonth]})`}
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-1">{fmt(viewExpense)}</div>
          <div className="text-xs th-muted">Despesas operacionais</div>
        </div>

        <div className="th-card p-5">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
            <TrendingUp size={20}/>
          </div>
          <div className="th-muted text-xs mb-1">
            {selectedMonth === 'all' ? 'Lucro Líquido 2026' : `Lucro (${MONTH_SHORT[selectedMonth]})`}
          </div>
          <div className="text-2xl font-bold text-primary mb-1">{fmt(viewProfit)}</div>
          <div className="text-xs text-primary font-medium">Após todas as deduções</div>
        </div>

        <div className="th-card p-5">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
            <Percent size={20}/>
          </div>
          <div className="th-muted text-xs mb-1">Margem de Lucro</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">{viewMargin.toFixed(1)}%</div>
          <div className="text-xs th-muted">{viewMargin > 50 ? 'Margem Saudável ✓' : 'Moderada'}</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        {/* Monthly Revenue vs Expense Chart */}
        <div className="th-card p-5">
          <h3 className="font-bold th-text mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary"/> Histórico de Faturamento 2026 (Jan a Dez)
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthlyProfitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/>
              <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="revenue" name="Receita" fill="#14b8a6" radius={[4,4,0,0]}/>
              <Bar dataKey="expense" name="Custo" fill="#ef4444" opacity={0.7} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Area Chart */}
        <div className="th-card p-5">
          <h3 className="font-bold th-text mb-4 flex items-center gap-2">
            <Target size={16} className="text-primary"/> Evolução do Lucro Anual
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={monthlyProfitData}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/>
              <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="lucro" name="Lucro Líquido" stroke="#14b8a6" strokeWidth={2} fill="url(#profitGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table with EDIT & DELETE */}
      <div className="th-card p-5 print:bg-white print:text-black">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold th-text print:text-black">
              Lançamentos & Transações {selectedMonth !== 'all' ? `— ${ALL_MONTHS[selectedMonth]}` : '2026'}
            </h3>
            <p className="th-muted text-xs mt-0.5 print:text-black">
              {filteredTransactions.length} lançamentos registrados {selectedMonth !== 'all' && `em ${ALL_MONTHS[selectedMonth]}`}
            </p>
          </div>
          {selectedMonth !== 'all' && (
            <button
              onClick={() => setSelectedMonth('all')}
              className="text-xs text-primary hover:underline font-semibold print:hidden"
            >
              Ver todas as transações de 2026
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b th-border th-surface2">
                {['Descrição','Categoria','Mês','Tipo','Valor','Ações'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider print:text-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center th-muted text-sm">Nenhuma transação encontrada neste período.</td></tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="border-b th-border hover:bg-primary/5 transition-colors">
                    <td className="py-2.5 px-3 th-text font-medium print:text-black">{t.description}</td>
                    <td className="py-2.5 px-3 th-muted print:text-black">{t.category}</td>
                    <td className="py-2.5 px-3 th-muted print:text-black">{MONTH_SHORT[t.month] || t.month} 2026</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-300 dark:border-rose-800'}`}>
                        {t.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1 print:hidden">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1 th-muted hover:text-primary transition-colors"
                        title="Editar Transação"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="p-1 th-muted hover:text-rose-500 transition-colors"
                        title="Excluir Transação"
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

      {/* Add / Edit Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 print:hidden">
          <div className="th-card border th-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b th-border pb-3">
              <h3 className="text-lg font-bold th-text flex items-center gap-2">
                <DollarSign size={18} className="text-primary" />
                {editingTx ? 'Editar Faturamento / Transação' : 'Novo Lançamento Financeiro'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="th-muted hover:text-rose-500 transition-colors"><X size={18}/></button>
            </div>
            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Descrição do Lançamento *</label>
                <input type="text" required placeholder="Ex: Venda Sistema OS SolutionMath" value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="th-input"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Valor (R$) *</label>
                  <input type="number" required placeholder="38000" value={form.amount}
                    onChange={e => setForm({...form, amount: e.target.value})}
                    className="th-input"/>
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Tipo de Lançamento</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="th-input">
                    <option value="income" className="th-surface th-text">Receita (+)</option>
                    <option value="expense" className="th-surface th-text">Despesa (-)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Categoria</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="th-input">
                    {['Sistemas','Sites','Apps','IA','Integrações','Automações','Infraestrutura','Pessoas','Marketing','Ferramentas'].map(c =>
                      <option key={c} value={c} className="th-surface th-text">{c}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Mês de Competência</label>
                  <select value={form.month} onChange={e => setForm({...form, month: e.target.value})}
                    className="th-input">
                    {Object.entries(ALL_MONTHS).map(([m, label]) =>
                      <option key={m} value={m} className="th-surface th-text">{label}</option>
                    )}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors mt-2">
                {editingTx ? 'Atualizar Faturamento' : 'Salvar Transação'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;
