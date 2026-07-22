import React, { useState } from 'react';
import { Department } from '../data/structure';
import { WindowState } from './OSShell';
import { ChevronRight, Settings, Key, Link as LinkIcon, Users, Target, X, Maximize2, Minus } from 'lucide-react';
import CRMView from './CRMView';
import TasksView from './TasksView';
import HRView from './HRView';
import ProductsView from './ProductsView';
import AgendaCalendarView from './AgendaCalendarView';

interface DepartmentWindowProps {
  department: Department;
  windowState: WindowState;
  isActive: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
}

const DepartmentWindow: React.FC<DepartmentWindowProps> = ({
  department,
  windowState,
  isActive,
  onClose,
  onMinimize,
  onFocus
}) => {
  const [activeSectorId, setActiveSectorId] = useState<string>(department.sectors[0]?.id || '');
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const activeSector = department.sectors.find(s => s.id === activeSectorId);
  const activeProcess = activeSector?.processes.find(p => p.id === activeProcessId);

  return (
    <div
      onClick={onFocus}
      className={`absolute transition-all duration-200 ease-out flex flex-col ${
        isMaximized ? 'inset-4' : 'top-10 left-10 w-[1000px] h-[650px]'
      } ${
        isActive ? 'shadow-[0_0_50px_-15px_rgba(20,184,166,0.3)] border-primary/50' : 'shadow-2xl border-white/10 opacity-95'
      } bg-[#0f0f13]/95 backdrop-blur-2xl rounded-2xl overflow-hidden border`}
      style={{ zIndex: windowState.zIndex }}
    >
      {/* Window Header */}
      <div 
        className={`h-12 flex items-center justify-between px-4 select-none ${isActive ? 'bg-white/5' : 'bg-transparent'} border-b border-white/10`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 cursor-pointer shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-colors flex items-center justify-center group" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X size={8} className="text-black opacity-0 group-hover:opacity-100" />
          </div>
          <div className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-400 cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-colors flex items-center justify-center group" onClick={(e) => { e.stopPropagation(); onMinimize(); }}>
            <Minus size={8} className="text-black opacity-0 group-hover:opacity-100" />
          </div>
          <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 cursor-pointer shadow-[0_0_8px_rgba(34,197,94,0.5)] transition-colors flex items-center justify-center group" onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }}>
            <Maximize2 size={8} className="text-black opacity-0 group-hover:opacity-100" />
          </div>
          <span className="ml-4 font-medium text-white/80 tracking-wide text-sm">{department.name}</span>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar - Sectors */}
        <div className="w-64 bg-black/20 border-r border-white/10 p-4 overflow-y-auto">
          <h4 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-4">Setores</h4>
          <div className="space-y-1">
            {department.sectors.map(sector => (
              <button
                key={sector.id}
                onClick={() => {
                  setActiveSectorId(sector.id);
                  setActiveProcessId(null);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeSectorId === sector.id 
                    ? 'bg-primary/20 text-primary font-medium border border-primary/30 shadow-[0_0_15px_rgba(20,184,166,0.15)]' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {sector.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-transparent overflow-hidden relative">
          {!activeProcess ? (
            /* Sector Overview */
            <div className="p-8 overflow-y-auto h-full">
              <h2 className="text-3xl font-bold text-white mb-2">{activeSector?.name}</h2>
              <p className="text-textMuted mb-8">{activeSector?.description}</p>
              
              <h3 className="text-lg font-semibold text-white/90 mb-4">Processos Mapeados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSector?.processes.map(proc => (
                  <div 
                    key={proc.id}
                    onClick={() => setActiveProcessId(proc.id)}
                    className="glass-card p-5 cursor-pointer group border border-white/5 hover:border-primary/30 hover:shadow-neon transition-all"
                  >
                    <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors mb-2">
                      {proc.name}
                    </h4>
                    <p className="text-sm text-textMuted mb-4 line-clamp-2">{proc.objective}</p>
                    <div className="flex flex-wrap gap-2">
                      {proc.owners.slice(0, 2).map((owner, i) => (
                        <span key={i} className="px-2 py-1 bg-white/5 rounded-md text-xs font-medium text-white/60">
                          {owner}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeProcess.type === 'crm' ? (
            <CRMView />
          ) : activeProcess.type === 'tasks' ? (
            <TasksView />
          ) : activeProcess.type === 'hr' ? (
            <HRView />
          ) : activeProcess.type === 'products' ? (
            <ProductsView />
          ) : activeProcess.type === 'agenda' ? (
            <AgendaCalendarView />
          ) : (
            /* Process Detail View */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Process Header */}
              <div className="p-6 border-b border-white/10 bg-black/20">
                <button 
                  onClick={() => setActiveProcessId(null)}
                  className="text-primary hover:text-secondary font-medium text-sm flex items-center mb-4 transition-colors"
                >
                  <ChevronRight className="rotate-180 mr-1" size={16} /> Voltar para Setor
                </button>
                <h2 className="text-2xl font-bold text-white mb-2">{activeProcess.name}</h2>
                <p className="text-textMuted">{activeProcess.objective}</p>
              </div>

              {/* Process Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-transparent">
                
                {/* Owners & KPIs */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3 flex items-center">
                      <Users size={16} className="mr-2" /> Responsáveis
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeProcess.owners.map((owner, i) => (
                        <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary font-medium rounded-lg text-sm border border-primary/20">
                          {owner}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3 flex items-center">
                      <Target size={16} className="mr-2" /> KPIs
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeProcess.kpis.map((kpi, i) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 font-medium rounded-lg text-sm border border-blue-500/20">
                          {kpi}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-white/10 w-full"></div>

                {/* Workflow */}
                <div>
                  <h4 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-4">Fluxo Base</h4>
                  <div className="p-5 bg-black/30 rounded-2xl border border-white/5">
                    {activeProcess.flows.map((flow, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2 text-sm text-white/80 font-medium">
                        {flow.split('->').map((step, i, arr) => (
                          <React.Fragment key={i}>
                            <span className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 shadow-sm">{step.trim()}</span>
                            {i < arr.length - 1 && <ChevronRight size={16} className="text-white/20" />}
                          </React.Fragment>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid for IO, Docs, Tools */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Inputs & Outputs */}
                  <div className="space-y-4">
                    <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                      <h5 className="font-bold text-white/90 mb-3">Entradas</h5>
                      <ul className="list-disc list-inside text-sm text-textMuted space-y-1">
                        {activeProcess.inputs.map((input, i) => <li key={i}>{input}</li>)}
                      </ul>
                    </div>
                    <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                      <h5 className="font-bold text-white/90 mb-3">Saídas</h5>
                      <ul className="list-disc list-inside text-sm text-textMuted space-y-1">
                        {activeProcess.outputs.map((output, i) => <li key={i}>{output}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* Tools & Automations */}
                  <div className="space-y-4">
                    <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                      <h5 className="font-bold text-white/90 mb-3 flex items-center">
                        <Settings size={16} className="mr-2 text-white/40" /> Ferramentas e Integrações
                      </h5>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {activeProcess.tools.map((tool, i) => (
                          <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-medium text-white/70">{tool}</span>
                        ))}
                      </div>
                      <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                        {activeProcess.integrations.map((int, i) => (
                          <div key={i} className="text-xs font-medium text-primary flex items-center">
                            <LinkIcon size={12} className="mr-2" /> {int}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 bg-primary/10 rounded-2xl border border-primary/20">
                      <h5 className="font-bold text-primary mb-3 flex items-center">
                        <Key size={16} className="mr-2" /> Automações
                      </h5>
                      <ul className="list-disc list-inside text-sm text-primary/80 space-y-1 font-medium">
                        {activeProcess.automations.map((auto, i) => <li key={i}>{auto}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentWindow;
