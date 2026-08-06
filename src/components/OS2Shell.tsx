import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, DollarSign, Kanban, Users, ClipboardList,
  Building2, Package, Calendar as CalendarIcon, Settings,
  ChevronLeft, Bell, Search, LogOut, ShoppingBag, ShieldCheck,
  FileSpreadsheet, LifeBuoy, Bot, Zap, Filter
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
import { useAuth } from '../contexts/AuthContext';

interface OS2ShellProps {
  onExitOS2: () => void;
  onLogout?: () => void;
}

type OS2View = 'home' | 'finance' | 'products' | 'crm-kanban' | 'crm-leads' | 'funnel-leads' | 'store' | 'agenda' | 'tasks' | 'hr' | 'reports' | 'helpdesk' | 'audit' | 'ai-chat' | 'workflows';

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

const OS2Home: React.FC<{ onNavigate: (view: OS2View) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const canAccessStore = user?.role === 'admin' || user?.plan === 'growth' || user?.plan === 'enterprise';

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold th-text">Bem-vindo ao Solution Math OS 3.0</h2>
          <p className="th-muted mt-1">Plataforma Empresarial Integrada com Módulo Lojas & PDV (2026)</p>
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
        { label: 'MRR Atual (Julho/2026)', value: 'R$ 84.500', sub: '+15% vs mês ant.', color: 'text-emerald-500' },
        { label: 'Pipeline Deals', value: 'R$ 251.000', sub: '8 deals ativos', color: 'text-primary' },
        { label: 'Projeção Faturamento 2026', value: 'R$ 680.000', sub: 'Com base nas metas', color: 'text-amber-500' },
        { label: 'Vendas Loja / PDV Hoje', value: 'PDV Ativo', sub: 'Estoque & auto-financeiro', color: 'text-blue-500' },
        { label: 'Equipe Ativa (RH)', value: '4', sub: 'Membros cadastrados', color: 'text-violet-500' },
        { label: 'Ticket Médio de Produto', value: 'R$ 5.000', sub: 'Margem de 66%', color: 'text-primary' },
      ].map((kpi, i) => (
        <div key={i} className="th-card p-6">
          <div className="th-muted text-sm mb-2 font-medium">{kpi.label}</div>
          <div className={`text-3xl font-bold ${kpi.color} mb-1`}>{kpi.value}</div>
          <div className="th-muted text-xs">{kpi.sub}</div>
        </div>
      ))}
    </div>

    <div className="mt-8 th-card p-6 border-l-4 border-l-primary">
      <h3 className="text-primary font-bold mb-3 flex items-center gap-2">
        <DollarSign size={18}/> Resumo Executivo — Julho 2026
      </h3>
      <p className="th-text text-sm leading-relaxed">
        A Solution Math encerrou o mês com faturamento de <strong className="th-text font-bold">R$ 84.500</strong>,
        sendo a maior contribuição do segmento de <strong className="text-primary">Sistemas Customizados (R$ 38.000)</strong> com ticket de R$ 5.000 e margem líquida de R$ 3.300 por produto.
        O novo módulo de <strong className="text-primary">Lojas & PDV</strong> agora integra vendas diretas e baixas de estoque diretamente no fluxo financeiro da empresa.
      </p>
    </div>
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
