import React from 'react';
import { CompanyStructure } from '../data/structure';
import { Users, DollarSign, Activity, Target, Zap, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface CEODashboardProps {
  companyData: CompanyStructure;
  onOpenDepartment: (deptId: string) => void;
  onEnterOS2: () => void;
  onLogout?: () => void;
}


const CEODashboard: React.FC<CEODashboardProps> = ({ companyData, onOpenDepartment, onEnterOS2, onLogout }) => {
  return (
    <div className="w-full max-w-7xl mx-auto pb-20 mt-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold th-text mb-2 tracking-tight">Solution Math OS</h1>
          <p className="th-muted text-lg font-light">Visão Executiva & Controle Operacional</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-xl transition-all hover:bg-red-500/10"
            >
              <LogOut size={14}/> Sair
            </button>
          )}
          <button
            onClick={onEnterOS2}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all hover:scale-105 text-sm"
          >
            <Zap size={16}/> Entrar no OS 3.0 Enterprise
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Projetos Ativos', value: '12', icon: <Activity className="text-primary" />, trend: '+2 esse mês' },
          { label: 'Receita (MRR)', value: 'R$ 84.500', icon: <DollarSign className="text-primary" />, trend: '+15% vs último mês' },
          { label: 'Time & Freelancers', value: '28', icon: <Users className="text-primary" />, trend: '3 posições abertas' },
          { label: 'Satisfação (NPS)', value: '89', icon: <Target className="text-primary" />, trend: 'Zona de Excelência' },
        ].map((stat, i) => (
          <div key={i} className="th-card p-6 flex flex-col group relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 rounded-xl th-surface2 border th-border group-hover:border-primary/30 transition-colors shadow-sm">{stat.icon}</div>
            </div>
            <h3 className="th-muted text-sm font-medium mb-1 relative z-10">{stat.label}</h3>
            <p className="text-3xl font-bold th-text mb-2 relative z-10">{stat.value}</p>
            <p className="text-xs text-primary font-medium relative z-10">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Departments Grid */}
      <h2 className="text-2xl font-bold th-text mb-6">Módulos do Sistema</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companyData.departments.map(dept => (
          <div 
            key={dept.id}
            onClick={() => onOpenDepartment(dept.id)}
            className="th-card p-6 cursor-pointer group relative overflow-hidden flex flex-col h-full hover:border-primary/40 hover:shadow-lg transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <h3 className="text-xl font-bold th-text mb-2 relative z-10">{dept.name}</h3>
            <p className="text-sm th-muted mb-6 relative z-10 flex-grow">{dept.description}</p>
            
            <div className="space-y-2 relative z-10">
              <p className="text-xs font-bold th-muted uppercase tracking-wider">Setores</p>
              {dept.sectors.map(sector => (
                <div key={sector.id} className="text-sm th-text flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 group-hover:bg-primary mr-2 shadow-[0_0_5px_rgba(20,184,166,0.5)]"></div>
                  {sector.name}
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end relative z-10">
              <span className="text-sm font-semibold text-primary group-hover:text-primary transition-colors flex items-center">
                Acessar Módulo <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CEODashboard;
