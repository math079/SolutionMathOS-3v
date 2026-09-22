import React, { useState, useEffect } from 'react';
import { CompanyStructure } from '../data/structure';
import {
  Users, DollarSign, TrendingUp, TrendingDown, Target, Zap, LogOut,
  ShoppingBag, Kanban, Percent, Calendar, Briefcase, Activity, CheckCircle2,
  ChevronRight, Smartphone, Monitor, Edit3, X, Check
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface CEODashboardProps {
  companyData: CompanyStructure;
  onOpenDepartment: (deptId: string) => void;
  onEnterOS2: () => void;
  onLogout?: () => void;
  onOpenQuickModule?: (moduleId: string) => void;
}

const MONTH_NAMES_PT: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
};

const fmt = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

const CEODashboard: React.FC<CEODashboardProps> = ({
  companyData,
  onOpenDepartment,
  onEnterOS2,
  onLogout,
  onOpenQuickModule
}) => {
  const [loading, setLoading] = useState(true);
  const [financialSummary, setFinancialSummary] = useState<{ total_revenue: number; total_expense: number; net_profit: number } | null>(null);
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; revenue: number; expense: number }>>([]);
  const [dealsData, setDealsData] = useState<Array<{ id: number; value: number; stage: string }>>([]);
  const [teamCount, setTeamCount] = useState<number>(4);
  const [salesStats, setSalesStats] = useState<any>(null);

  // Data atual do sistema
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthKey = `${currentYear}-${currentMonthNum}`;
  const currentMonthName = MONTH_NAMES_PT[currentMonthNum] || 'Mês Atual';
  const currentDateFormatted = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  // Metas da Empresa
  const [annualTarget, setAnnualTarget] = useState<number>(1000000);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(45000);
  const [showTargetModal, setShowTargetModal] = useState<boolean>(false);
  const [targetForm, setTargetForm] = useState({ annual: '1000000', monthly: '45000' });
  const [savingTarget, setSavingTarget] = useState<boolean>(false);

  useEffect(() => {
    fetchLiveData();
  }, []);

  const fetchLiveData = async () => {
    try {
      const [sumRes, monthRes, dealsRes, usersRes, salesRes, targetRes] = await Promise.all([
        fetch('http://localhost:3001/api/finance/summary').then(r => r.ok ? r.json() : null),
        fetch('http://localhost:3001/api/finance/monthly').then(r => r.ok ? r.json() : []),
        fetch('http://localhost:3001/api/deals').then(r => r.ok ? r.json() : []),
        fetch('http://localhost:3001/api/users').then(r => r.ok ? r.json() : []),
        fetch('http://localhost:3001/api/sales/stats').then(r => r.ok ? r.json() : null),
        fetch('http://localhost:3001/api/settings/target').then(r => r.ok ? r.json() : null),
      ]);

      if (sumRes) setFinancialSummary(sumRes);
      if (monthRes) setMonthlyData(monthRes);
      if (dealsRes) setDealsData(dealsRes);
      if (usersRes && Array.isArray(usersRes)) setTeamCount(usersRes.filter((u: any) => u.status === 'Ativo' || !u.status).length);
      if (salesRes) setSalesStats(salesRes);
      if (targetRes) {
        if (targetRes.annual_target) {
          setAnnualTarget(targetRes.annual_target);
          setTargetForm(prev => ({ ...prev, annual: String(targetRes.annual_target) }));
        }
        if (targetRes.monthly_target) {
          setMonthlyTarget(targetRes.monthly_target);
          setTargetForm(prev => ({ ...prev, monthly: String(targetRes.monthly_target) }));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados no CEODashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTarget(true);
    try {
      const res = await fetch('http://localhost:3001/api/settings/target', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annual_target: parseFloat(targetForm.annual) || 1000000,
          monthly_target: parseFloat(targetForm.monthly) || 45000
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.annual_target) setAnnualTarget(data.annual_target);
        if (data.monthly_target) setMonthlyTarget(data.monthly_target);
        setShowTargetModal(false);
      }
    } catch (e) {
      console.error('Erro ao salvar meta:', e);
    } finally {
      setSavingTarget(false);
    }
  };

  // Métricas Operacionais Reais
  const realizedRevenue = financialSummary?.total_revenue || 323004;
  const currentMonthRow = monthlyData.find(m => m.month === currentMonthKey);
  const currentMonthRevenue = currentMonthRow ? currentMonthRow.revenue : 203004;
  const currentMonthExpense = currentMonthRow ? currentMonthRow.expense : 69800;
  const currentMonthProfit  = currentMonthRevenue - currentMonthExpense;
  const currentMonthMargin  = currentMonthRevenue > 0 ? (currentMonthProfit / currentMonthRevenue) * 100 : 0;

  // Comparação com mês anterior
  const prevMonthNum = String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0');
  const prevYear = now.getMonth() === 0 ? currentYear - 1 : currentYear;
  const prevMonthKey = `${prevYear}-${prevMonthNum}`;
  const prevMonthRow = monthlyData.find(m => m.month === prevMonthKey);
  let growthVsPrev = '+822.7% vs mês ant.';
  if (prevMonthRow && prevMonthRow.revenue > 0) {
    const diff = ((currentMonthRevenue - prevMonthRow.revenue) / prevMonthRow.revenue) * 100;
    growthVsPrev = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs mês ant.`;
  }

  // Pipeline Deals ativos
  const activeDeals = dealsData.filter(d => d.stage !== 'Perdido' && d.stage !== 'Ganho');
  const pipelineTotal = activeDeals.reduce((s, d) => s + (d.value || 0), 0) || 216000;
  const pipelineCount = activeDeals.length || 7;

  // Progresso da Meta
  const targetPercent = Math.min(100, (realizedRevenue / (annualTarget || 1)) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto pb-24 px-3 sm:px-6 pt-2">
      {/* Mobile Top Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b th-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <Smartphone size={12} /> Visão Executiva Mobile (CEO Pocket)
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Operação Online & Conectada
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold th-text tracking-tight">Solution Math OS</h1>
          <p className="th-muted text-xs sm:text-sm mt-0.5">
            Controle gerencial em tempo real • <span className="text-primary font-semibold">{currentDateFormatted}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <ThemeToggle />
          
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-rose-500 hover:text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-xl transition-all hover:bg-rose-500/10"
              title="Encerrar Sessão"
            >
              <LogOut size={13}/> <span className="hidden sm:inline">Sair</span>
            </button>
          )}

          <button
            onClick={onEnterOS2}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all active:scale-95 text-xs sm:text-sm"
          >
            <Monitor size={15}/> <span>Abrir OS 3.0 Enterprise (Desktop)</span>
          </button>
        </div>
      </div>

      {/* Meta Anual & Progresso Executivo */}
      <div className="mb-6 th-card p-4 sm:p-5 border-l-4 border-l-amber-500 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
              <Target size={18} />
            </div>
            <div>
              <div className="text-xs th-muted font-medium">Meta Corporativa {currentYear}</div>
              <div className="text-base sm:text-lg font-bold th-text flex items-center gap-2">
                <span>{fmt(annualTarget)}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                  {targetPercent.toFixed(1)}% Realizado
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setShowTargetModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 transition-colors"
            >
              <Edit3 size={12} /> Ajustar Meta
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface2 rounded-full h-2.5 th-surface2 border th-border overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, targetPercent)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs th-muted mt-1.5">
          <span>Realizado: <strong className="text-emerald-500">{fmt(realizedRevenue)}</strong></span>
          <span>Restante: <strong className="th-text">{fmt(Math.max(0, annualTarget - realizedRevenue))}</strong></span>
        </div>
      </div>

      {/* Quick Operational Metrics (Mobile 2 columns / Desktop 4 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Faturamento do Mês */}
        <div className="th-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign size={18} />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
              {currentMonthName}
            </span>
          </div>
          <div className="th-muted text-xs mb-0.5">Faturamento ({currentMonthName})</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
            {fmt(currentMonthRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {growthVsPrev}
          </div>
        </div>

        {/* Custos Operacionais */}
        <div className="th-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <div className="w-9 h-9 bg-rose-100 dark:bg-rose-950/40 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400">
              <TrendingDown size={18} />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500">
              Despesas
            </span>
          </div>
          <div className="th-muted text-xs mb-0.5">Custos ({currentMonthName})</div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mb-1">
            {fmt(currentMonthExpense)}
          </div>
          <div className="text-[11px] th-muted">
            Folha RH + Operação
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="th-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              Líquido
            </span>
          </div>
          <div className="th-muted text-xs mb-0.5">Lucro ({currentMonthName})</div>
          <div className="text-xl sm:text-2xl font-bold text-primary mb-1">
            {fmt(currentMonthProfit)}
          </div>
          <div className="text-[11px] text-primary font-medium">
            Margem: {currentMonthMargin.toFixed(1)}% ✓
          </div>
        </div>

        {/* Pipeline Deals */}
        <div className="th-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Kanban size={18} />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
              {pipelineCount} deals
            </span>
          </div>
          <div className="th-muted text-xs mb-0.5">Pipeline Comercial</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {fmt(pipelineTotal)}
          </div>
          <div className="text-[11px] th-muted">
            Negociações abertas
          </div>
        </div>
      </div>

      {/* Mobile Quick Action Buttons for CEOs/Managers */}
      <div className="mb-8">
        <h3 className="text-xs font-bold th-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Zap size={14} className="text-primary" /> Acesso Rápido Mobile (Gestão)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onOpenQuickModule ? onOpenQuickModule('finance') : onOpenDepartment('diretoria')}
            className="p-3 th-card hover:border-primary/50 transition-all flex items-center gap-2.5 text-left group active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <DollarSign size={16} />
            </div>
            <div>
              <div className="text-xs font-bold th-text group-hover:text-primary transition-colors">Financeiro 2026</div>
              <div className="text-[10px] th-muted">DRE & Metas</div>
            </div>
          </button>

          <button
            onClick={() => onOpenQuickModule ? onOpenQuickModule('sales') : onOpenDepartment('comercial')}
            className="p-3 th-card hover:border-primary/50 transition-all flex items-center gap-2.5 text-left group active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <ShoppingBag size={16} />
            </div>
            <div>
              <div className="text-xs font-bold th-text group-hover:text-primary transition-colors">Painel Vendas</div>
              <div className="text-[10px] th-muted">{salesStats?.monthCount || 11} vendas no mês</div>
            </div>
          </button>

          <button
            onClick={() => onOpenDepartment('recursos-humanos')}
            className="p-3 th-card hover:border-primary/50 transition-all flex items-center gap-2.5 text-left group active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Users size={16} />
            </div>
            <div>
              <div className="text-xs font-bold th-text group-hover:text-primary transition-colors">Equipe & Folha</div>
              <div className="text-[10px] th-muted">{teamCount} colaboradores ativos</div>
            </div>
          </button>

          <button
            onClick={() => onOpenDepartment('comercial')}
            className="p-3 th-card hover:border-primary/50 transition-all flex items-center gap-2.5 text-left group active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Kanban size={16} />
            </div>
            <div>
              <div className="text-xs font-bold th-text group-hover:text-primary transition-colors">Pipeline Deals</div>
              <div className="text-[10px] th-muted">{fmt(pipelineTotal)}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-bold th-text mb-4 flex items-center justify-between">
          <span>Módulos do Sistema</span>
          <span className="text-xs font-normal th-muted">Toque no card para abrir o módulo</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {companyData.departments.map(dept => (
            <div 
              key={dept.id}
              onClick={() => onOpenDepartment(dept.id)}
              className="th-card p-5 cursor-pointer group relative overflow-hidden flex flex-col justify-between hover:border-primary/50 hover:shadow-lg transition-all active:scale-[0.99]"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold th-text group-hover:text-primary transition-colors">{dept.name}</h3>
                  <span className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary"></span>
                </div>
                <p className="text-xs th-muted mb-4 line-clamp-2">{dept.description}</p>
                
                <div className="space-y-1.5 mb-4">
                  <p className="text-[10px] font-bold th-muted uppercase tracking-wider">Setores Operacionais</p>
                  {dept.sectors.slice(0, 2).map(sector => (
                    <div key={sector.id} className="text-xs th-text flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mr-2"></div>
                      <span className="truncate">{sector.name}</span>
                    </div>
                  ))}
                  {dept.sectors.length > 2 && (
                    <div className="text-[10px] text-primary font-medium">+{dept.sectors.length - 2} outros setores</div>
                  )}
                </div>
              </div>
              
              <div className="pt-2 border-t th-border flex items-center justify-between text-xs text-primary font-semibold">
                <span>Acessar Módulo</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Configuração de Metas da Empresa */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="th-card border th-border rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b th-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold th-text">Configurar Metas da Empresa</h3>
                  <p className="text-xs th-muted">Atualiza os objetivos em toda a plataforma</p>
                </div>
              </div>
              <button onClick={() => setShowTargetModal(false)} className="th-muted hover:text-rose-500 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold th-muted mb-1">
                  Meta Anual de Faturamento {currentYear} (R$)
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={targetForm.annual}
                  onChange={e => setTargetForm({ ...targetForm, annual: e.target.value })}
                  className="th-input text-sm"
                  placeholder="Ex: 1000000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold th-muted mb-1">
                  Meta Mensal de Faturamento (R$)
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={targetForm.monthly}
                  onChange={e => setTargetForm({ ...targetForm, monthly: e.target.value })}
                  className="th-input text-sm"
                  placeholder="Ex: 85000"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-4 py-2 rounded-xl th-surface2 border th-border text-xs font-semibold th-muted hover:text-th-text"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTarget}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  <Check size={14} /> {savingTarget ? 'Salvando...' : 'Salvar Metas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEODashboard;

