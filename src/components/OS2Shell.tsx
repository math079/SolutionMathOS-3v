import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, DollarSign, Kanban, Users, ClipboardList,
  Building2, Package, Calendar as CalendarIcon, Settings,
  ChevronLeft, Bell, Search, LogOut, ShoppingBag, ShieldCheck,
  FileSpreadsheet, LifeBuoy, Bot, Zap, Filter, BadgeDollarSign,
  Target, Edit3, X, Check
} from 'lucide-react';
import FinancialDashboard from './FinancialDashboard';
import CRMKanban from './CRMKanban';
import CRMView from './CRMView';
import TasksView from './TasksView';
import HRView from './HRView';
import ProductsView from './ProductsView';
import AgendaCalendarView from './AgendaCalendarView';
import StoreShell from './StoreShell';
import ThemeToggle from './ThemeToggle';
import { AuditLogsView } from './AuditLogsView';
import { ReportsView } from './ReportsView';
import { HelpdeskView } from './HelpdeskView';
import { AIChatView, LyraFloatingButton } from './AIChatView';
import { WorkflowsView } from './WorkflowsView';
import { LeadsView } from './LeadsView';
import { SalesDashboardView } from './SalesDashboardView';
import { useAuth } from '../contexts/AuthContext';

interface OS2ShellProps {
  onExitOS2: () => void;
  onLogout?: () => void;
}

type OS2View = 'home' | 'sales' | 'finance' | 'products' | 'crm-kanban' | 'crm-leads' | 'funnel-leads' | 'store' | 'agenda' | 'tasks' | 'hr' | 'reports' | 'helpdesk' | 'audit' | 'ai-chat' | 'workflows';

interface NavItem {
  id: OS2View;
  label: string;
  icon: React.ReactNode;
  group: string;
  minPlan?: 'start' | 'growth' | 'enterprise';
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',        label: 'Visão Geral',        icon: <LayoutDashboard size={18}/>, group: 'Principal', minPlan: 'start' },
  { id: 'sales',       label: 'Painel de Vendas',   icon: <BadgeDollarSign size={18}/>, group: 'Comercial', minPlan: 'start' },
  { id: 'finance',     label: 'Financeiro 2026',    icon: <DollarSign size={18}/>,      group: 'Principal', minPlan: 'start' },
  { id: 'products',    label: 'Produtos & Ticket', icon: <Package size={18}/>,         group: 'Principal', minPlan: 'start' },
  { id: 'store',       label: 'Lojas / Varejo',     icon: <ShoppingBag size={18}/>,     group: 'Comercial', minPlan: 'growth' },
  { id: 'crm-kanban',  label: 'Pipeline Deals',      icon: <Kanban size={18}/>,          group: 'Comercial', minPlan: 'start' },
  { id: 'crm-leads',   label: 'Leads & Contatos',    icon: <Users size={18}/>,           group: 'Comercial', minPlan: 'start' },
  { id: 'funnel-leads',label: 'Leads Landing Page',  icon: <Filter size={18}/>,          group: 'Comercial', minPlan: 'enterprise', adminOnly: true },
  { id: 'agenda',      label: 'Agenda de Operações', icon: <CalendarIcon size={18}/>,   group: 'Operações', minPlan: 'start' },
  { id: 'tasks',       label: 'Tarefas (OS)',        icon: <ClipboardList size={18}/>,   group: 'Operações', minPlan: 'start' },
  { id: 'hr',          label: 'Equipe (RH)',         icon: <Building2 size={18}/>,        group: 'Operações', minPlan: 'start' },
  { id: 'reports',     label: 'Relatórios PDF',     icon: <FileSpreadsheet size={18}/>, group: 'Gestão', minPlan: 'growth' },
  { id: 'workflows',   label: 'Workflows & Automações', icon: <Zap size={18}/>,        group: 'Gestão', minPlan: 'growth' },
  { id: 'helpdesk',    label: 'Suporte & Helpdesk',  icon: <LifeBuoy size={18}/>,        group: 'Gestão', minPlan: 'start' },
  { id: 'audit',       label: 'Logs de Segurança',   icon: <ShieldCheck size={18}/>,     group: 'Gestão', minPlan: 'enterprise', adminOnly: true },
  { id: 'ai-chat',     label: 'IA Assistente',        icon: <Bot size={18}/>,             group: 'Gestão', minPlan: 'start' },
];

const MONTH_NAMES_PT: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
};

const OS2Home: React.FC<{ onNavigate: (view: OS2View) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const canAccessStore = user?.role === 'admin' || user?.plan === 'growth' || user?.plan === 'enterprise';

  const [loading, setLoading] = useState(true);
  const [financialSummary, setFinancialSummary] = useState<{ total_revenue: number; total_expense: number; net_profit: number } | null>(null);
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; revenue: number; expense: number }>>([]);
  const [dealsData, setDealsData] = useState<Array<{ id: number; value: number; stage: string }>>([]);
  const [teamCount, setTeamCount] = useState<number>(4);
  const [avgTicket, setAvgTicket] = useState<number>(5000);

  // Data atual real do sistema
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthKey = `${currentYear}-${currentMonthNum}`;
  const currentMonthName = MONTH_NAMES_PT[currentMonthNum] || 'Mês Atual';
  const currentDateFormatted = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const [annualTarget, setAnnualTarget] = useState<number>(500000);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(45000);
  const [showTargetModalHome, setShowTargetModalHome] = useState<boolean>(false);
  const [targetFormHome, setTargetFormHome] = useState({ annual: '500000', monthly: '45000' });
  const [savingTargetHome, setSavingTargetHome] = useState<boolean>(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, monthRes, dealsRes, usersRes, prodRes, targetRes] = await Promise.all([
          fetch('http://localhost:3001/api/finance/summary').then(r => r.ok ? r.json() : null),
          fetch('http://localhost:3001/api/finance/monthly').then(r => r.ok ? r.json() : []),
          fetch('http://localhost:3001/api/deals').then(r => r.ok ? r.json() : []),
          fetch('http://localhost:3001/api/users').then(r => r.ok ? r.json() : []),
          fetch('http://localhost:3001/api/products').then(r => r.ok ? r.json() : []),
          fetch('http://localhost:3001/api/settings/target').then(r => r.ok ? r.json() : null),
        ]);

        if (sumRes) setFinancialSummary(sumRes);
        if (monthRes) setMonthlyData(monthRes);
        if (dealsRes) setDealsData(dealsRes);
        if (usersRes && Array.isArray(usersRes)) setTeamCount(usersRes.length);
        if (prodRes && Array.isArray(prodRes) && prodRes.length > 0) {
          const avg = prodRes.reduce((acc: number, p: any) => acc + (p.ticket_price || 0), 0) / prodRes.length;
          setAvgTicket(Math.round(avg));
        }
        if (targetRes) {
          if (targetRes.annual_target) {
            setAnnualTarget(targetRes.annual_target);
            setTargetFormHome(prev => ({ ...prev, annual: String(targetRes.annual_target) }));
          }
          if (targetRes.monthly_target) {
            setMonthlyTarget(targetRes.monthly_target);
            setTargetFormHome(prev => ({ ...prev, monthly: String(targetRes.monthly_target) }));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSaveTargetHome = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTargetHome(true);
    try {
      const res = await fetch('http://localhost:3001/api/settings/target', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annual_target: parseFloat(targetFormHome.annual) || 500000,
          monthly_target: parseFloat(targetFormHome.monthly) || 45000
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.annual_target) setAnnualTarget(data.annual_target);
        if (data.monthly_target) setMonthlyTarget(data.monthly_target);
        setShowTargetModalHome(false);
      }
    } catch (e) {
      console.error('Erro ao atualizar meta:', e);
    } finally {
      setSavingTargetHome(false);
    }
  };

  // Faturamento real acumulado até o mês atual
  const realizedRevenue = financialSummary?.total_revenue || 150000;
  
  // Receita do mês atual
  const currentMonthRow = monthlyData.find(m => m.month === currentMonthKey);
  const currentMonthRevenue = currentMonthRow ? currentMonthRow.revenue : 30000;

  // Comparação com mês anterior
  const prevMonthNum = String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0');
  const prevYear = now.getMonth() === 0 ? currentYear - 1 : currentYear;
  const prevMonthKey = `${prevYear}-${prevMonthNum}`;
  const prevMonthRow = monthlyData.find(m => m.month === prevMonthKey);
  let growthVsPrev = '+15%';
  if (prevMonthRow && prevMonthRow.revenue > 0) {
    const diff = ((currentMonthRevenue - prevMonthRow.revenue) / prevMonthRow.revenue) * 100;
    growthVsPrev = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs mês ant.`;
  }

  // Pipeline Deals ativos (não perdidos e não ganhos ainda)
  const activeDeals = dealsData.filter(d => d.stage !== 'Perdido' && d.stage !== 'Ganho');
  const pipelineTotal = activeDeals.reduce((s, d) => s + (d.value || 0), 0) || 205500;
  const pipelineCount = activeDeals.length || 6;

  // Cálculo matemático da Projeção 2026 com base na meta dinâmica
  const remainingMonths = Math.max(0, 12 - (now.getMonth() + 1));
  const runRateMonthlyAvg = realizedRevenue / (now.getMonth() + 1);
  const projectedExtra = remainingMonths * (currentMonthRevenue * 1.15); 
  const projectedTotal = Math.round(realizedRevenue + projectedExtra);

  const fmtCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold th-text">Bem-vindo ao Solution Math OS 3.0</h2>
          <p className="th-muted mt-1">
            Plataforma Empresarial Integrada • Dados atualizados em <span className="text-primary font-semibold">{currentDateFormatted}</span>
          </p>
        </div>
        {canAccessStore && (
          <button onClick={() => onNavigate('store')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-primary/90 transition-all active:scale-95">
            <ShoppingBag size={18} /> Acessar Módulo Lojas & PDV
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          {
            label: `Faturamento Atual (${currentMonthName}/${currentYear})`,
            value: fmtCurrency(currentMonthRevenue),
            sub: growthVsPrev,
            color: 'text-emerald-500',
            editable: false
          },
          {
            label: 'Pipeline Deals (Comercial)',
            value: fmtCurrency(pipelineTotal),
            sub: `${pipelineCount} negócios em negociação`,
            color: 'text-primary',
            editable: false
          },
          {
            label: `Meta Anual (${currentYear})`,
            value: fmtCurrency(annualTarget),
            sub: `Realizado: ${fmtCurrency(realizedRevenue)} (${((realizedRevenue / (annualTarget || 1)) * 100).toFixed(1)}%)`,
            color: 'text-amber-500',
            editable: true
          },
          {
            label: 'Vendas Loja / PDV Hoje',
            value: 'PDV Ativo',
            sub: 'Estoque & auto-financeiro online',
            color: 'text-blue-500',
            editable: false
          },
          {
            label: 'Equipe Ativa (RH)',
            value: String(teamCount),
            sub: 'Membros operacionais',
            color: 'text-violet-500',
            editable: false
          },
          {
            label: 'Ticket Médio de Catálogo',
            value: fmtCurrency(avgTicket),
            sub: 'Margem média calculada',
            color: 'text-primary',
            editable: false
          },
        ].map((kpi, i) => (
          <div key={i} className="th-card p-6 relative group">
            <div className="flex items-center justify-between mb-2">
              <div className="th-muted text-sm font-medium">{kpi.label}</div>
              {kpi.editable && (
                <button
                  onClick={() => setShowTargetModalHome(true)}
                  className="p-1 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors"
                  title="Configurar Meta Anual e Mensal da Empresa"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </div>
            <div className={`text-3xl font-bold ${kpi.color} mb-1`}>{kpi.value}</div>
            <div className="th-muted text-xs">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 th-card p-6 border-l-4 border-l-primary">
        <h3 className="text-primary font-bold mb-3 flex items-center gap-2">
          <DollarSign size={18}/> Resumo Executivo & Previsibilidade — {currentMonthName} {currentYear}
        </h3>
        <p className="th-text text-sm leading-relaxed">
          Até o momento, a Solution Math atingiu o acumulado de <strong className="th-text font-bold">{fmtCurrency(realizedRevenue)}</strong> em {currentYear},
          com <strong className="th-text font-bold">{fmtCurrency(currentMonthRevenue)}</strong> faturados em {currentMonthName}.
          Para atingir a meta anual de <strong className="text-amber-500 font-bold">{fmtCurrency(annualTarget)}</strong>,
          restam <strong className="text-primary font-semibold">{fmtCurrency(Math.max(0, annualTarget - realizedRevenue))}</strong> distribuídos nos {remainingMonths} meses restantes do ano.
          O pipeline comercial ativo conta com <strong className="text-primary font-semibold">{fmtCurrency(pipelineTotal)}</strong> em negociações abertas para apoiar o atingimento do objetivo.
        </p>
      </div>

      {/* Modal de Configuração de Metas na Visão Geral */}
      {showTargetModalHome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="th-card border th-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b th-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold th-text">Configurar Metas da Empresa</h3>
                  <p className="text-xs th-muted">Atualiza os objetivos em toda a plataforma</p>
                </div>
              </div>
              <button onClick={() => setShowTargetModalHome(false)} className="th-muted hover:text-rose-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTargetHome} className="space-y-4">
              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Meta Anual de Faturamento (R$) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold th-muted">R$</span>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={targetFormHome.annual}
                    onChange={e => setTargetFormHome({ ...targetFormHome, annual: e.target.value })}
                    className="th-input pl-9 text-base font-bold text-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Meta Mensal de Faturamento (R$) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold th-muted">R$</span>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={targetFormHome.monthly}
                    onChange={e => setTargetFormHome({ ...targetFormHome, monthly: e.target.value })}
                    className="th-input pl-9 text-base font-bold text-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTargetModalHome(false)}
                  className="px-4 py-2 rounded-xl th-surface2 border th-border th-muted hover:th-text text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTargetHome}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md transition-colors disabled:opacity-50"
                >
                  {savingTargetHome ? 'Salvando...' : 'Salvar Metas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const OS2Shell: React.FC<OS2ShellProps> = ({ onExitOS2, onLogout }) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<OS2View>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState<number>(0);

  useEffect(() => {
    if (user?.role === 'admin') {
      const checkLeads = async () => {
        try {
          const res = await fetch('http://localhost:3001/api/leads/count-new', {
            headers: {
              'x-auth-user': 'admin',
              'x-auth-role': 'admin'
            }
          });
          if (res.ok) {
            const data = await res.json();
            setNewLeadsCount(data.count || 0);
          }
        } catch (err) {
          // ignore
        }
      };
      checkLeads();
      const interval = setInterval(checkLeads, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const userPlan = user?.plan || 'start';
  const isMasterAdmin = user?.role === 'admin';

  const PLAN_LEVELS: Record<string, number> = {
    start: 1,
    growth: 2,
    enterprise: 3,
  };

  const navItemsFiltered = NAV_ITEMS.filter(item => {
    // Regra 1: adminOnly exige ser o Master Admin (role === 'admin')
    if (item.adminOnly && !isMasterAdmin) return false;

    // Regra 2: Filtrar pelo plano do usuário (start: nível 1, growth: nível 2, enterprise: nível 3)
    const requiredLevel = PLAN_LEVELS[item.minPlan || 'start'] || 1;
    const userLevel = isMasterAdmin ? 3 : (PLAN_LEVELS[userPlan] || 1);

    return userLevel >= requiredLevel;
  });

  const groups = Array.from(new Set(navItemsFiltered.map(n => n.group)));

  const renderContent = () => {
    switch (activeView) {
      case 'home':         return <OS2Home onNavigate={setActiveView} />;
      case 'sales':        return <SalesDashboardView/>;
      case 'finance':      return <FinancialDashboard/>;
      case 'products':     return <ProductsView/>;
      case 'store':        return <StoreShell onBack={() => setActiveView('home')} />;
      case 'crm-kanban':   return <CRMKanban/>;
      case 'crm-leads':    return <CRMView/>;
      case 'funnel-leads': return <LeadsView/>;
      case 'agenda':       return <AgendaCalendarView/>;
      case 'tasks':        return <TasksView/>;
      case 'hr':           return <HRView/>;
      case 'reports':      return <ReportsView/>;
      case 'workflows':    return <WorkflowsView onOpenLyra={() => setActiveView('ai-chat')} />;
      case 'helpdesk':     return <HelpdeskView/>;
      case 'audit':        return <AuditLogsView/>;
      case 'ai-chat':      return <AIChatView/>;
      default:             return <OS2Home onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col th-bg th-text overflow-hidden">

      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-4 th-topbar shrink-0 z-20 print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-primary/10 th-muted hover:th-text transition-colors">
            <ChevronLeft size={18} className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}/>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Solution Math Logo" className="w-8 h-8 rounded-full object-cover border border-primary/30 shadow-sm" />
            <span className="font-bold th-text text-sm">Solution Math</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">OS 3.0 Enterprise</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 th-muted pointer-events-none z-10"/>
            <input placeholder="Buscar módulo, produto, loja ou deal..."
              className="th-input th-input-search text-sm"/>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          <button className="p-2 rounded-lg hover:bg-primary/10 th-muted hover:th-text transition-colors relative">
            <Bell size={18}/>
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></div>
          </button>
          <button onClick={onExitOS2}
            className="flex items-center gap-2 px-3 py-1.5 text-xs th-muted hover:th-text border th-border rounded-xl transition-colors">
            <ChevronLeft size={14}/> OS 1
          </button>
          {onLogout && (
            <button onClick={onLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl transition-colors hover:bg-red-500/10">
              <LogOut size={14}/> Sair
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-14' : 'w-56'} transition-all duration-300 th-sidebar flex flex-col shrink-0 overflow-y-auto z-10 print:hidden`}>
          <nav className="flex-1 p-3 space-y-4 pt-4">
            {groups.map(group => (
              <div key={group}>
                {!sidebarCollapsed && (
                  <div className="text-xs font-bold th-muted uppercase tracking-wider px-3 mb-2 opacity-60">{group}</div>
                )}
                <div className="space-y-1">
                  {navItemsFiltered.filter(n => n.group === group).map(item => (
                    <button key={item.id} onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                        activeView === item.id ? 'nav-active font-semibold' : 'th-muted hover:bg-primary/5 hover:text-primary'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <span className="shrink-0">{item.icon}</span>
                        {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                      </div>

                      {!sidebarCollapsed && item.id === 'funnel-leads' && newLeadsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                          {newLeadsCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Settings */}
          <div className="p-3 border-t th-border">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm th-muted hover:bg-primary/5 hover:text-primary transition-all">
              <Settings size={18} className="shrink-0"/>
              {!sidebarCollapsed && <span>Configurações</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto th-bg relative">
          {renderContent()}
          {activeView !== 'ai-chat' && <LyraFloatingButton currentModule={activeView} />}
        </div>
      </div>
    </div>
  );
};

export default OS2Shell;
