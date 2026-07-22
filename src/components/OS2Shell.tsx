import React, { useState } from 'react';
import {
  LayoutDashboard, DollarSign, Kanban, Users, ClipboardList,
  Building2, Settings, ChevronLeft, Bell, Search, LogOut
} from 'lucide-react';
import FinancialDashboard from './FinancialDashboard';
import CRMKanban from './CRMKanban';
import CRMView from './CRMView';
import TasksView from './TasksView';
import HRView from './HRView';

interface OS2ShellProps {
  onExitOS2: () => void;
}

type OS2View = 'home' | 'finance' | 'crm-kanban' | 'crm-leads' | 'tasks' | 'hr';

interface NavItem {
  id: OS2View;
  label: string;
  icon: React.ReactNode;
  group: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',        label: 'Visão Geral',    icon: <LayoutDashboard size={18}/>, group: 'Principal' },
  { id: 'finance',     label: 'Financeiro',      icon: <DollarSign size={18}/>,      group: 'Principal' },
  { id: 'crm-kanban',  label: 'Pipeline Deals',  icon: <Kanban size={18}/>,          group: 'Comercial' },
  { id: 'crm-leads',   label: 'Leads & Contatos',icon: <Users size={18}/>,           group: 'Comercial' },
  { id: 'tasks',       label: 'Tarefas (OS)',    icon: <ClipboardList size={18}/>,   group: 'Operações' },
  { id: 'hr',          label: 'Equipe (RH)',     icon: <Building2 size={18}/>,        group: 'Operações' },
];

const OS2Home: React.FC = () => (
  <div className="flex-1 p-8 overflow-y-auto">
    <h2 className="text-3xl font-bold text-white mb-1">Bem-vindo ao OS 2.0</h2>
    <p className="text-white/40 mb-8">Plataforma Empresarial Avançada — Solution Math</p>
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
      {[
        { label: 'MRR Atual', value: 'R$ 84.500', sub: '+15% vs mês ant.', color: 'text-green-400' },
        { label: 'Pipeline Total', value: 'R$ 251.000', sub: '8 deals ativos', color: 'text-primary' },
        { label: 'Taxa de Conversão', value: '62%', sub: 'Acima da média', color: 'text-amber-400' },
        { label: 'Projetos Ativos', value: '12', sub: '3 em entrega final', color: 'text-blue-400' },
        { label: 'Equipe', value: '4', sub: 'Membros cadastrados', color: 'text-purple-400' },
        { label: 'NPS Score', value: '89', sub: 'Zona de Excelência', color: 'text-primary' },
      ].map((kpi, i) => (
        <div key={i} className="bg-black/30 border border-white/5 rounded-2xl p-6 hover:border-primary/20 transition-colors">
          <div className="text-white/40 text-sm mb-2">{kpi.label}</div>
          <div className={`text-3xl font-bold ${kpi.color} mb-1`}>{kpi.value}</div>
          <div className="text-white/30 text-xs">{kpi.sub}</div>
        </div>
      ))}
    </div>
    <div className="mt-8 bg-primary/10 border border-primary/20 rounded-2xl p-6">
      <h3 className="text-primary font-bold mb-3 flex items-center gap-2">
        <DollarSign size={18}/> Resumo Executivo — Julho 2026
      </h3>
      <p className="text-white/70 text-sm leading-relaxed">
        A Solution Math encerrou o mês com faturamento de <strong className="text-white">R$ 84.500</strong>, 
        sendo a maior contribuição do segmento de <strong className="text-primary">Sistemas Customizados (R$ 38.000)</strong>. 
        O canal de IA & Agentes cresceu 40% em relação ao mês anterior, sugerindo forte potencial de expansão nessa vertical. 
        Recomenda-se ampliar a capacidade de entrega em IA para atender a demanda crescente e aumentar o ticket médio dos projetos.
      </p>
    </div>
  </div>
);

const OS2Shell: React.FC<OS2ShellProps> = ({ onExitOS2 }) => {
  const [activeView, setActiveView] = useState<OS2View>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const groups = Array.from(new Set(NAV_ITEMS.map(n => n.group)));

  const renderContent = () => {
    switch (activeView) {
      case 'home':       return <OS2Home/>;
      case 'finance':    return <FinancialDashboard/>;
      case 'crm-kanban': return <CRMKanban/>;
      case 'crm-leads':  return <CRMView/>;
      case 'tasks':      return <TasksView/>;
      case 'hr':         return <HRView/>;
      default:           return <OS2Home/>;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#080810] text-white overflow-hidden">

      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 bg-black/40 backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <ChevronLeft size={18} className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}/>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-black font-black text-xs">SM</div>
            <span className="font-bold text-white text-sm">Solution Math</span>
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded-full border border-primary/30">OS 2.0</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
            <input placeholder="Buscar módulo, cliente, deal..." 
              className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"/>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors relative">
            <Bell size={18}/>
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></div>
          </button>
          <button onClick={onExitOS2}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors">
            <LogOut size={14}/> Voltar ao OS 1
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-14' : 'w-56'} transition-all duration-300 border-r border-white/10 bg-black/30 flex flex-col shrink-0 overflow-y-auto z-10`}>
          <nav className="flex-1 p-3 space-y-4 pt-4">
            {groups.map(group => (
              <div key={group}>
                {!sidebarCollapsed && (
                  <div className="text-xs font-bold text-white/20 uppercase tracking-wider px-3 mb-2">{group}</div>
                )}
                <div className="space-y-1">
                  {NAV_ITEMS.filter(n => n.group === group).map(item => (
                    <button key={item.id} onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        activeView === item.id
                          ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(20,184,166,0.1)]'
                          : 'text-white/50 hover:bg-white/5 hover:text-white'
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
          <div className="p-3 border-t border-white/10">
            <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:bg-white/5 hover:text-white transition-all`}>
              <Settings size={18} className="shrink-0"/>
              {!sidebarCollapsed && <span>Configurações</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#080810] relative">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-30 pointer-events-none"></div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default OS2Shell;
