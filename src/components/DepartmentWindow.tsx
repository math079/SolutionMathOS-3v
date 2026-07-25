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
        isActive ? 'shadow-2xl border-primary/50' : 'shadow-lg th-border opacity-95'
      } th-surface rounded-2xl overflow-hidden border`}
      style={{ zIndex: windowState.zIndex }}
    >
      {/* Window Header */}
      <div 
        className={`h-12 flex items-center justify-between px-4 select-none ${isActive ? 'th-surface2' : 'bg-transparent'} border-b th-border`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 cursor-pointer transition-colors flex items-center justify-center group" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X size={8} className="text-black opacity-0 group-hover:opacity-100" />
          </div>
          <div className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-400 cursor-pointer transition-colors flex items-center justify-center group" onClick={(e) => { e.stopPropagation(); onMinimize(); }}>
            <Minus size={8} className="text-black opacity-0 group-hover:opacity-100" />
          </div>
          <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 cursor-pointer transition-colors flex items-center justify-center group" onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }}>
            <Maximize2 size={8} className="text-black opacity-0 group-hover:opacity-100" />
          </div>
          <span className="ml-4 font-semibold th-text tracking-wide text-sm">{department.name}</span>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar - Sectors */}
        <div className="w-64 th-surface2 border-r th-border p-4 overflow-y-auto">
          <h4 className="text-xs font-bold th-muted uppercase tracking-wider mb-4">Setores</h4>
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
                    ? 'bg-primary/20 text-primary font-semibold border border-primary/30' 
                    : 'th-muted hover:bg-primary/5 hover:text-primary'
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
              <h2 className="text-3xl font-bold th-text mb-2">{activeSector?.name}</h2>
              <p className="th-muted mb-8">{activeSector?.description}</p>
              
              <h3 className="text-lg font-semibold th-text mb-4">Processos Mapeados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSector?.processes.map(proc => (
                  <div 
                    key={proc.id}
                    onClick={() => setActiveProcessId(proc.id)}
                    className="th-card p-5 cursor-pointer group hover:border-primary/40 hover:shadow-md transition-all"
                  >
                    <h4 className="text-lg font-bold th-text group-hover:text-primary transition-colors mb-2">
                      {proc.name}
                    </h4>
                    <p className="text-sm th-muted mb-4 line-clamp-2">{proc.objective}</p>
                    <div className="flex flex-wrap gap-2">
                      {proc.owners.slice(0, 2).map((owner, i) => (
                        <span key={i} className="px-2 py-1 th-surface2 rounded-md text-xs font-medium th-muted">
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
              <div className="p-6 border-b th-border th-surface2">
                <button 
                  onClick={() => setActiveProcessId(null)}
                  className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center mb-4 transition-colors"
                >
                  <ChevronRight className="rotate-180 mr-1" size={16} /> Voltar para Setor
                </button>
                <h2 className="text-2xl font-bold th-text mb-2">{activeProcess.name}</h2>
                <p className="th-muted">{activeProcess.objective}</p>
              </div>

              {/* Process Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-transparent">
                
                {/* Owners & KPIs */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold th-muted uppercase tracking-wider mb-3 flex items-center">
                      <Users size={16} className="mr-2 text-primary" /> Responsáveis
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeProcess.owners.map((owner, i) => (
                        <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary font-semibold rounded-lg text-sm border border-primary/20">
                          {owner}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold th-muted uppercase tracking-wider mb-3 flex items-center">
                      <Target size={16} className="mr-2 text-blue-500" /> KPIs
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeProcess.kpis.map((kpi, i) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-500/10 text-blue-500 font-semibold rounded-lg text-sm border border-blue-500/20">
                          {kpi}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-[1px] th-border w-full"></div>

                {/* Workflow */}
                <div>
                  <h4 className="text-xs font-bold th-muted uppercase tracking-wider mb-4">Fluxo Base</h4>
                  <div className="p-5 th-surface2 rounded-2xl border th-border">
                    {activeProcess.flows.map((flow, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2 text-sm th-text font-medium">
                        {flow.split('->').map((step, i, arr) => (
                          <React.Fragment key={i}>
                            <span className="px-4 py-2 th-surface rounded-xl border th-border shadow-sm">{step.trim()}</span>
                            {i < arr.length - 1 && <ChevronRight size={16} className="th-muted" />}
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
                    <div className="p-5 th-surface2 rounded-2xl border th-border">
                      <h5 className="font-bold th-text mb-3">Entradas</h5>
                      <ul className="list-disc list-inside text-sm th-muted space-y-1">
                        {activeProcess.inputs.map((input, i) => <li key={i}>{input}</li>)}
                      </ul>
                    </div>
                    <div className="p-5 th-surface2 rounded-2xl border th-border">
                      <h5 className="font-bold th-text mb-3">Saídas</h5>
                      <ul className="list-disc list-inside text-sm th-muted space-y-1">
                        {activeProcess.outputs.map((output, i) => <li key={i}>{output}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* Tools & Automations */}
                  <div className="space-y-4">
                    <div className="p-5 th-surface2 rounded-2xl border th-border">
                      <h5 className="font-bold th-text mb-3 flex items-center">
                        <Settings size={16} className="mr-2 th-muted" /> Ferramentas e Integrações
                      </h5>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {activeProcess.tools.map((tool, i) => (
                          <span key={i} className="px-2 py-1 th-surface border th-border rounded-md text-xs font-medium th-muted">{tool}</span>
                        ))}
                      </div>
                      <div className="space-y-2 mt-4 pt-4 border-t th-border">
                        {activeProcess.integrations.map((int, i) => (
                          <div key={i} className="text-xs font-semibold text-primary flex items-center">
                            <LinkIcon size={12} className="mr-2" /> {int}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 bg-primary/10 rounded-2xl border border-primary/20">
                      <h5 className="font-bold text-primary mb-3 flex items-center">
                        <Key size={16} className="mr-2" /> Automações
                      </h5>
                      <ul className="list-disc list-inside text-sm text-primary space-y-1 font-medium">
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
