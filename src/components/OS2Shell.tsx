import React, { useState } from 'react';
import {
  LayoutDashboard, DollarSign, Kanban, Users, ClipboardList,
  Building2, Package, Calendar as CalendarIcon, Settings,
  ChevronLeft, Bell, Search, LogOut, ShoppingBag, ShieldCheck,
  FileSpreadsheet, LifeBuoy, Bot, Zap
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

interface OS2ShellProps {
  onExitOS2: () => void;
  onLogout?: () => void;
}

type OS2View = 'home' | 'finance' | 'products' | 'crm-kanban' | 'crm-leads' | 'store' | 'agenda' | 'tasks' | 'hr' | 'reports' | 'helpdesk' | 'audit' | 'ai-chat' | 'workflows';

interface NavItem {
  id: OS2View;
  label: string;
  icon: React.ReactNode;
  group: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',        label: 'Visão Geral',        icon: <LayoutDashboard size={18}/>, group: 'Principal' },
  { id: 'finance',     label: 'Financeiro 2026',    icon: <DollarSign size={18}/>,      group: 'Principal' },
  { id: 'products',    label: 'Produtos & Ticket', icon: <Package size={18}/>,         group: 'Principal' },
  { id: 'store',       label: 'Lojas / Varejo',     icon: <ShoppingBag size={18}/>,     group: 'Comercial' },
  { id: 'crm-kanban',  label: 'Pipeline Deals',      icon: <Kanban size={18}/>,          group: 'Comercial' },
  { id: 'crm-leads',   label: 'Leads & Contatos',    icon: <Users size={18}/>,           group: 'Comercial' },
  { id: 'agenda',      label: 'Agenda de Operações', icon: <CalendarIcon size={18}/>,   group: 'Operações' },
  { id: 'tasks',       label: 'Tarefas (OS)',        icon: <ClipboardList size={18}/>,   group: 'Operações' },
  { id: 'hr',          label: 'Equipe (RH)',         icon: <Building2 size={18}/>,        group: 'Operações' },
  { id: 'reports',     label: 'Relatórios PDF',     icon: <FileSpreadsheet size={18}/>, group: 'Gestão' },
  { id: 'workflows',   label: 'Workflows & Automações', icon: <Zap size={18}/>,        group: 'Gestão' },
  { id: 'helpdesk',    label: 'Suporte & Helpdesk',  icon: <LifeBuoy size={18}/>,        group: 'Gestão' },
  { id: 'audit',       label: 'Logs de Segurança',   icon: <ShieldCheck size={18}/>,     group: 'Gestão' },
  { id: 'ai-chat',     label: 'IA Assistente',        icon: <Bot size={18}/>,             group: 'Gestão' },
];

const OS2Home: React.FC<{ onNavigate: (view: OS2View) => void }> = ({ onNavigate }) => (
  <div className="flex-1 p-8 overflow-y-auto">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-3xl font-bold th-text">Bem-vindo ao Solution Math OS 3.0</h2>
        <p className="th-muted mt-1">Plataforma Empresarial Integrada com Módulo Lojas & PDV (2026)</p>
      </div>
      <button onClick={() => onNavigate('store')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-primary/90 transition-all active:scale-95">
        <ShoppingBag size={18} /> Acessar Módulo Lojas & PDV
      </button>
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

const OS2Shell: React.FC<OS2ShellProps> = ({ onExitOS2, onLogout }) => {
  const [activeView, setActiveView] = useState<OS2View>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const groups = Array.from(new Set(NAV_ITEMS.map(n => n.group)));

  const renderContent = () => {
    switch (activeView) {
      case 'home':       return <OS2Home onNavigate={setActiveView} />;
      case 'finance':    return <FinancialDashboard/>;
      case 'products':   return <ProductsView/>;
      case 'store':      return <StoreShell onBack={() => setActiveView('home')} />;
      case 'crm-kanban': return <CRMKanban/>;
      case 'crm-leads':  return <CRMView/>;
      case 'agenda':     return <AgendaCalendarView/>;
      case 'tasks':      return <TasksView/>;
      case 'hr':         return <HRView/>;
      case 'reports':    return <ReportsView/>;
      case 'workflows':  return <WorkflowsView onOpenLyra={() => setActiveView('ai-chat')} />;
      case 'helpdesk':   return <HelpdeskView/>;
      case 'audit':      return <AuditLogsView/>;
      case 'ai-chat':    return <AIChatView/>;
      default:           return <OS2Home onNavigate={setActiveView} />;
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
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-black text-xs">SM</div>
            <span className="font-bold th-text text-sm">Solution Math</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">OS 3.0 Enterprise</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 th-muted"/>
            <input placeholder="Buscar módulo, produto, loja ou deal..."
              className="th-input pl-8 text-sm"/>
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
                  {NAV_ITEMS.filter(n => n.group === group).map(item => (
                    <button key={item.id} onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        activeView === item.id ? 'nav-active font-semibold' : 'th-muted hover:bg-primary/5 hover:text-primary'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
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
        <div className="flex-1 flex flex-col overflow-hidden th-bg relative">
          {renderContent()}
          {activeView !== 'ai-chat' && <LyraFloatingButton currentModule={activeView} />}
        </div>
      </div>
    </div>
  );
};

export default OS2Shell;
