import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, Target, Zap, PlusCircle, X, Calendar, Filter } from 'lucide-react';

const COLORS = ['#14b8a6','#2dd4bf','#0d9488','#5eead4','#99f6e4','#f59e0b','#ef4444','#8b5cf6'];
const MONTH_LABELS: Record<string, string> = {
  '2026-02': 'Fevereiro 2026', '2026-03': 'Março 2026', '2026-04': 'Abril 2026',
  '2026-05': 'Maio 2026', '2026-06': 'Junho 2026', '2026-07': 'Julho 2026'
};
const MONTH_SHORT: Record<string, string> = {
  '2026-02': 'Fev', '2026-03': 'Mar', '2026-04': 'Abr',
  '2026-05': 'Mai', '2026-06': 'Jun', '2026-07': 'Jul'
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
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or '2025-07', etc.
  const [showAdd, setShowAdd]           = useState(false);
  const [form, setForm]                 = useState({ description: '', amount: '', type: 'income', category: 'Sistemas', month: '2026-07' });

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:3001/api/finance/transactions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
    });
    setShowAdd(false);
    setForm({ description: '', amount: '', type: 'income', category: 'Sistemas', month: '2025-07' });
    loadAll();
  };

  // Filtered metrics calculation based on selected month
  const filteredTransactions = selectedMonth === 'all'
    ? transactions
    : transactions.filter(t => t.month === selectedMonth);

  const activeMonthData = monthly.find(m => m.month === selectedMonth);

  // Stats for the active view
  let viewRevenue = 0;
  let viewExpense = 0;
  let viewProfit  = 0;
  let viewTrend   = '';

  if (selectedMonth === 'all') {
    viewRevenue = summary?.total_revenue || 0;
    viewExpense = summary?.total_expense || 0;
    viewProfit  = summary?.net_profit || 0;
    viewTrend   = 'Visão Acumulada (6 meses)';
  } else {
    viewRevenue = activeMonthData?.revenue || 0;
    viewExpense = activeMonthData?.expense || 0;
    viewProfit  = viewRevenue - viewExpense;

    // Compare with previous month
    const allMonths = Object.keys(MONTH_LABELS);
    const currIdx = allMonths.indexOf(selectedMonth);
    if (currIdx > 0) {
      const prevMonthKey = allMonths[currIdx - 1];
      const prevData = monthly.find(m => m.month === prevMonthKey);
      if (prevData && prevData.revenue > 0) {
        const diffPercent = ((viewRevenue - prevData.revenue) / prevData.revenue) * 100;
        viewTrend = `${diffPercent >= 0 ? '+' : ''}${diffPercent.toFixed(1)}% vs ${MONTH_SHORT[prevMonthKey]}`;
      } else {
        viewTrend = 'Mês selecionado';
      }
    } else {
      viewTrend = 'Início do Período';
    }
  }

  const viewMargin = viewRevenue > 0 ? (viewProfit / viewRevenue) * 100 : 0;

  // Category breakdown filtered for active transactions
  const categoryMap: Record<string, number> = {};
  filteredTransactions.filter(t => t.type === 'income').forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });
  const filteredCategories = Object.entries(categoryMap).map(([category, revenue]) => ({ category, revenue }));

  // Charts Data
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
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Dashboard Financeiro
            {selectedMonth !== 'all' && (
              <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full border border-primary/30">
                {MONTH_LABELS[selectedMonth]}
              </span>
            )}
          </h2>
          <p className="text-white/40 text-sm mt-1">Análise estratégica de receita, custos e projeções de faturamento</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector Filter */}
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-sm">
            <Calendar size={16} className="text-primary" />
            <span className="text-white/60 text-xs font-semibold">Período:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#111]">Todos os Meses (Visão Geral)</option>
              {Object.entries(MONTH_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="bg-[#111]">{label}</option>
              ))}
            </select>
          </div>

          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-bold rounded-xl shadow-neon hover:bg-secondary transition-colors">
            <PlusCircle size={16}/> Nova Transação
          </button>
        </div>
      </div>

      {/* Month Filter Badges Quick Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedMonth('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            selectedMonth === 'all'
              ? 'bg-primary text-black border-primary shadow-neon'
              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          Todos
        </button>
        {Object.entries(MONTH_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedMonth(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              selectedMonth === key
                ? 'bg-primary text-black border-primary shadow-neon'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {MONTH_SHORT[key]}
          </button>
        ))}
      </div>

      {/* Dynamic KPI Cards (Adapts to selected Month Filter) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-black/30 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-4">
            <DollarSign size={20}/>
          </div>
          <div className="text-white/50 text-xs mb-1">
            {selectedMonth === 'all' ? 'Faturamento Acumulado' : `Faturamento (${MONTH_SHORT[selectedMonth]})`}
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1">{fmt(viewRevenue)}</div>
          <div className="text-xs text-primary font-medium">{viewTrend}</div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 mb-4">
            <TrendingDown size={20}/>
          </div>
          <div className="text-white/50 text-xs mb-1">
            {selectedMonth === 'all' ? 'Custo Acumulado' : `Custos (${MONTH_SHORT[selectedMonth]})`}
          </div>
          <div className="text-2xl font-bold text-red-400 mb-1">{fmt(viewExpense)}</div>
          <div className="text-xs text-white/40">Custos Operacionais</div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
            <TrendingUp size={20}/>
          </div>
          <div className="text-white/50 text-xs mb-1">
            {selectedMonth === 'all' ? 'Lucro Acumulado' : `Lucro Líquido (${MONTH_SHORT[selectedMonth]})`}
          </div>
          <div className="text-2xl font-bold text-primary mb-1">{fmt(viewProfit)}</div>
          <div className="text-xs text-primary font-medium">Após deduções de despesas</div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 mb-4">
            <Percent size={20}/>
          </div>
          <div className="text-white/50 text-xs mb-1">Margem de Lucro</div>
          <div className="text-2xl font-bold text-amber-400 mb-1">{viewMargin.toFixed(1)}%</div>
          <div className="text-xs text-white/40">{viewMargin > 50 ? 'Margem Saudável ✓' : 'Moderada'}</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue vs Expense Chart */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-primary"/> Histórico de Faturamento por Mês
            </h3>
            <span className="text-xs text-white/40">Clique nas barras para detalhar</span>
          </div>
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
            <Target size={16} className="text-primary"/> Evolução da Lucratividade
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

      {/* Charts Row 2 & Investment Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-2">Composição da Receita</h3>
          <p className="text-white/40 text-xs mb-4">
            {selectedMonth === 'all' ? 'Fontes de renda no acumulado' : `Categorias em ${MONTH_SHORT[selectedMonth]}`}
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={filteredCategories.length > 0 ? filteredCategories : byCategory} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                {(filteredCategories.length > 0 ? filteredCategories : byCategory).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2 max-h-36 overflow-y-auto">
            {(filteredCategories.length > 0 ? filteredCategories : byCategory).map((c, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }}></div>
                  <span className="text-white/70 truncate">{c.category}</span>
                </div>
                <span className="text-white font-medium">{fmt(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Analysis */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-5 flex flex-col">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Zap size={16} className="text-primary"/> Análise do Faturamento de Julho
          </h3>
          <div className="space-y-3 flex-1 text-xs">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
              <div className="font-bold text-primary mb-1"> Como foi alcançado R$ 84.500?</div>
              <div className="text-white/80 leading-relaxed">
                Julho/2025 registrou o maior faturamento do ano impulsionado pelo fechamento do <strong>Sistema OS SolutionMath (R$ 38k)</strong>, a venda do <strong>Pack de 3 Landing Pages (R$ 14,5k)</strong>, e contratos de <strong>IA & Integrações (R$ 32k)</strong>.
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="font-bold text-amber-400 mb-1"> Margem Operacional</div>
              <div className="text-white/70 leading-relaxed">
                Os custos de Julho somaram R$ 28.000 (Salários + Servidores + Ferramentas), resultando em um lucro líquido de <strong>R$ 56.500 (66,8% de margem)</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* Investment AI Recommendation */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 flex flex-col">
          <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
            <Zap size={16}/> Inteligência de Investimento
          </h3>
          <div className="space-y-3 flex-1">
            <div className="bg-black/40 rounded-xl p-3 border border-white/5">
              <div className="text-xs text-green-400 font-bold mb-1">🚀 Maior Retorno (ROI)</div>
              <div className="text-white/80 text-xs leading-relaxed">
                Desenvolvimento de <strong>Sistemas Customizados</strong> e <strong>Agentes de IA</strong> entregam mais de 70% de margem. Investir em marketing direto nestas 2 verticais trará maior retorno por R$ investido.
              </div>
            </div>
            <div className="bg-black/40 rounded-xl p-3 border border-white/5">
              <div className="text-xs text-amber-400 font-bold mb-1">💡 Onde Alocar Capital</div>
              <div className="text-white/80 text-xs leading-relaxed">
                Aumentar o investimento em <strong>Tráfego Pago (Google Ads / LinkedIn)</strong> focado em B2B para captar mais projetos de sistemas acima de R$ 30k.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table (Filtered by selected Month) */}
      <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-white">
              Transações {selectedMonth !== 'all' ? `— ${MONTH_LABELS[selectedMonth]}` : 'Recentes'}
            </h3>
            <p className="text-white/40 text-xs mt-0.5">
              {filteredTransactions.length} registros encontrados {selectedMonth !== 'all' && `em ${MONTH_LABELS[selectedMonth]}`}
            </p>
          </div>
          {selectedMonth !== 'all' && (
            <button
              onClick={() => setSelectedMonth('all')}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Ver todas as transações de todos os meses
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Descrição','Categoria','Mês','Tipo','Valor'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-white/40 text-sm">Nenhuma transação encontrada neste período.</td></tr>
              ) : (
                filteredTransactions.slice(0, 15).map(t => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 text-white/90 font-medium">{t.description}</td>
                    <td className="py-2.5 px-3 text-white/50">{t.category}</td>
                    <td className="py-2.5 px-3 text-white/50">{MONTH_SHORT[t.month] || t.month} 2026</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.type === 'income' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {t.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white">Nova Transação Financeira</h3>
              <button onClick={() => setShowAdd(false)} className="text-white/40 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <input type="text" required placeholder="Descrição (ex: Venda Sistema E-commerce)" value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"/>
              <div className="flex gap-3">
                <input type="number" required placeholder="Valor (R$)" value={form.amount}
                  onChange={e => setForm({...form, amount: e.target.value})}
                  className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"/>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none">
                  <option value="income" className="bg-[#111]">Receita (+)</option>
                  <option value="expense" className="bg-[#111]">Despesa (-)</option>
                </select>
              </div>
              <div className="flex gap-3">
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none">
                  {['Sistemas','Sites','Apps','IA','Integrações','Automações','Infraestrutura','Pessoas','Marketing','Ferramentas'].map(c =>
                    <option key={c} value={c} className="bg-[#111]">{c}</option>
                  )}
                </select>
                <select value={form.month} onChange={e => setForm({...form, month: e.target.value})}
                  className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none">
                  {Object.entries(MONTH_LABELS).map(([m, label]) =>
                    <option key={m} value={m} className="bg-[#111]">{label}</option>
                  )}
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-primary text-black font-bold rounded-xl shadow-neon hover:bg-secondary transition-colors">
                Salvar Transação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;
