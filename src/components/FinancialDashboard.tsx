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
  const [simExtraMonthlySales, setSimExtraMonthlySales] = useState<number>(2); // 2 extra products per month
  const [simProductTicket, setSimProductTicket]         = useState<number>(5000); // R$ 5k product ticket

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

  // Filtered metrics calculation based on selected month
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

  // Category breakdown for filtered transactions
  const categoryMap: Record<string, number> = {};
  filteredTransactions.filter(t => t.type === 'income').forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });
  const filteredCategories = Object.entries(categoryMap).map(([category, revenue]) => ({ category, revenue }));

  // Annual Predictability Calculations (Forecast to Dec 2026)
  const realizedRevenue2026 = monthly.reduce((s, m) => s + m.revenue, 0);
  const realizedExpense2026 = monthly.reduce((s, m) => s + m.expense, 0);
  const simExtraMonthlyRevenue = simExtraMonthlySales * simProductTicket; // Extra revenue per remaining month
  const simExtraTotal2026      = simExtraMonthlyRevenue * 5; // Aug-Dec (5 remaining months)
  const totalProjectedRevenue2026 = realizedRevenue2026 + simExtraTotal2026;
  const totalProjectedProfit2026  = totalProjectedRevenue2026 - (realizedExpense2026 + (26000 * 5)); // Estimated expense Aug-Dec

  const monthlyProfitData = monthly.map(m => ({
    ...m,
    name: MONTH_SHORT[m.month] || m.month,
    lucro: m.revenue - m.expense,
    active: m.month === selectedMonth
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#111] border border-white/10 rounded-xl p-3 text-sm">
        <div className="font-bold text-white mb-2">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="text-white font-medium">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-transparent space-y-6">
      {/* Printable DRE Header (hidden in web UI, visible only in PDF / Print mode) */}
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Dashboard Financeiro & Previsibilidade 2026
            {selectedMonth !== 'all' && (
              <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full border border-primary/30">
                {ALL_MONTHS[selectedMonth]}
              </span>
            )}
          </h2>
          <p className="text-white/40 text-sm mt-1">Gestão de faturamento, simulação de metas e emissão de DRE/Relatórios</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector Filter (All 12 Months 2026) */}
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-sm">
            <Calendar size={16} className="text-primary" />
            <span className="text-white/50 text-xs font-semibold">Mês:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#111]">Ano 2026 Completo (Visão Geral)</option>
              {Object.entries(ALL_MONTHS).map(([key, label]) => (
                <option key={key} value={key} className="bg-[#111]">{label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrintDRE}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 text-sm font-semibold rounded-xl transition-colors"
            title="Imprimir Relatório DRE em PDF"
          >
            <Printer size={16} /> Relatório PDF
          </button>

          <button
            onClick={() => { resetForm(); setEditingTx(null); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-bold rounded-xl shadow-neon hover:bg-secondary transition-colors"
          >
            <PlusCircle size={16}/> Lançar Faturamento
          </button>
        </div>
      </div>

      {/* Month Filter Quick Badges (Full 12 Months 2026) */}
      <div className="flex flex-wrap items-center gap-1.5 print:hidden">
        <button
          onClick={() => setSelectedMonth('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            selectedMonth === 'all'
              ? 'bg-primary text-black border-primary shadow-neon'
              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
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
                ? 'bg-primary text-black border-primary shadow-neon'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {MONTH_SHORT[key]}
          </button>
        ))}
      </div>

      {/* Predictability Simulator Card */}
      <div className="bg-gradient-to-r from-primary/10 via-black/40 to-black/30 border border-primary/20 rounded-2xl p-6 relative overflow-hidden print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 text-primary rounded-xl">
              <Calculator size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Calculadora de Previsibilidade & Projeção Anual (2026)</h4>
              <p className="text-xs text-white/50">Simule novos contratos e veja o faturamento projetado até Dezembro/2026</p>
            </div>
          </div>
          <span className="text-xs text-green-400 font-bold px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
            Projeção 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/50 border border-white/10 rounded-xl p-4">
            <label className="text-xs font-semibold text-white/50 mb-1 block">Meta Vendas / Mês</label>
            <input
              type="number"
              min={0}
              value={simExtraMonthlySales}
              onChange={e => setSimExtraMonthlySales(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-sm text-white font-bold outline-none"
            />
          </div>

          <div className="bg-black/50 border border-white/10 rounded-xl p-4">
            <label className="text-xs font-semibold text-white/50 mb-1 block">Ticket Médio (R$)</label>
            <input
              type="number"
              value={simProductTicket}
              onChange={e => setSimProductTicket(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-sm text-white font-bold outline-none"
            />
          </div>

          <div className="bg-black/50 border border-white/10 rounded-xl p-4">
            <span className="text-xs font-semibold text-white/50 block mb-1">Projeção Faturamento 2026</span>
            <div className="text-2xl font-bold text-primary">{fmt(totalProjectedRevenue2026)}</div>
            <div className="text-xs text-primary/80 mt-1">Realizado + Meta Ago-Dez</div>
          </div>

          <div className="bg-black/50 border border-green-500/30 rounded-xl p-4 bg-green-500/5">
            <span className="text-xs font-semibold text-green-400 block mb-1">Lucro Líquido Projetado 2026</span>
            <div className="text-2xl font-bold text-green-400">{fmt(totalProjectedProfit2026)}</div>
            <div className="text-xs text-white/40 mt-1">Após custos fixos e variáveis</div>
          </div>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-4">
            <DollarSign size={20}/>
          </div>
          <div className="text-white/50 text-xs mb-1">
            {selectedMonth === 'all' ? 'Faturamento Total 2026' : `Faturamento (${MONTH_SHORT[selectedMonth]})`}
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1">{fmt(viewRevenue)}</div>
          <div className="text-xs text-primary font-medium">{viewTrend}</div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 mb-4">
            <TrendingDown size={20}/>
          </div>
          <div className="text-white/50 text-xs mb-1">
            {selectedMonth === 'all' ? 'Custos Totais 2026' : `Custos (${MONTH_SHORT[selectedMonth]})`}
          </div>
          <div className="text-2xl font-bold text-red-400 mb-1">{fmt(viewExpense)}</div>
          <div className="text-xs text-white/40">Despesas operacionais</div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
            <TrendingUp size={20}/>
          </div>
          <div className="text-white/50 text-xs mb-1">
            {selectedMonth === 'all' ? 'Lucro Líquido 2026' : `Lucro (${MONTH_SHORT[selectedMonth]})`}
          </div>
          <div className="text-2xl font-bold text-primary mb-1">{fmt(viewProfit)}</div>
          <div className="text-xs text-primary font-medium">Após todas as deduções</div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 mb-4">
            <Percent size={20}/>
          </div>
          <div className="text-white/50 text-xs mb-1">Margem de Lucro</div>
          <div className="text-2xl font-bold text-amber-400 mb-1">{viewMargin.toFixed(1)}%</div>
          <div className="text-xs text-white/40">{viewMargin > 50 ? 'Margem Saudável ✓' : 'Moderada'}</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        {/* Monthly Revenue vs Expense Chart */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary"/> Histórico de Faturamento 2026 (Jan a Dez)
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthlyProfitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="revenue" name="Receita" fill="#14b8a6" radius={[4,4,0,0]}/>
              <Bar dataKey="expense" name="Custo" fill="#ef4444" opacity={0.7} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Area Chart */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="lucro" name="Lucro Líquido" stroke="#14b8a6" strokeWidth={2} fill="url(#profitGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table with EDIT & DELETE */}
      <div className="bg-black/30 border border-white/5 rounded-2xl p-5 print:bg-white print:text-black">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-white print:text-black">
              Lançamentos & Transações {selectedMonth !== 'all' ? `— ${ALL_MONTHS[selectedMonth]}` : '2026'}
            </h3>
            <p className="text-white/40 text-xs mt-0.5 print:text-black">
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
              <tr className="border-b border-white/10">
                {['Descrição','Categoria','Mês','Tipo','Valor','Ações'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider print:text-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-white/40 text-sm">Nenhuma transação encontrada neste período.</td></tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 text-white/90 font-medium print:text-black">{t.description}</td>
                    <td className="py-2.5 px-3 text-white/50 print:text-black">{t.category}</td>
                    <td className="py-2.5 px-3 text-white/50 print:text-black">{MONTH_SHORT[t.month] || t.month} 2026</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.type === 'income' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {t.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1 print:hidden">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1 text-white/30 hover:text-primary transition-colors"
                        title="Editar Transação"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="p-1 text-white/30 hover:text-red-400 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign size={18} className="text-primary" />
                {editingTx ? 'Editar Faturamento / Transação' : 'Novo Lançamento Financeiro'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1 block">Descrição do Lançamento *</label>
                <input type="text" required placeholder="Ex: Venda Sistema OS SolutionMath" value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">Valor (R$) *</label>
                  <input type="number" required placeholder="38000" value={form.amount}
                    onChange={e => setForm({...form, amount: e.target.value})}
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"/>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">Tipo de Lançamento</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none">
                    <option value="income" className="bg-[#111]">Receita (+)</option>
                    <option value="expense" className="bg-[#111]">Despesa (-)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">Categoria</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none">
                    {['Sistemas','Sites','Apps','IA','Integrações','Automações','Infraestrutura','Pessoas','Marketing','Ferramentas'].map(c =>
                      <option key={c} value={c} className="bg-[#111]">{c}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">Mês de Competência</label>
                  <select value={form.month} onChange={e => setForm({...form, month: e.target.value})}
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none">
                    {Object.entries(ALL_MONTHS).map(([m, label]) =>
                      <option key={m} value={m} className="bg-[#111]">{label}</option>
                    )}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-primary text-black font-bold rounded-xl shadow-neon hover:bg-secondary transition-colors mt-2">
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
