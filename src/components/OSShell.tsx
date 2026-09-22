import React, { useState } from 'react';
import { CompanyStructure, Department } from '../data/structure';
import Taskbar from './Taskbar';
import CEODashboard from './CEODashboard';
import DepartmentWindow from './DepartmentWindow';
import FinancialDashboard from './FinancialDashboard';
import { SalesDashboardView } from './SalesDashboardView';
import { ChevronLeft, X } from 'lucide-react';

interface OSShellProps {
  companyData: CompanyStructure;
  onEnterOS2: () => void;
  onLogout?: () => void;
}

export interface WindowState {
  id: string;
  departmentId: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
}

const OSShell: React.FC<OSShellProps> = ({ companyData, onEnterOS2, onLogout }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [highestZIndex, setHighestZIndex] = useState(10);
  const [quickModal, setQuickModal] = useState<'finance' | 'sales' | null>(null);

  const openDepartment = (deptId: string) => {
    const existingWindow = windows.find(w => w.departmentId === deptId);
    if (existingWindow) {
      setHighestZIndex(prev => prev + 1);
      setWindows(windows.map(w => 
        w.departmentId === deptId 
          ? { ...w, isMinimized: false, zIndex: highestZIndex + 1 } 
          : w
      ));
      setActiveWindowId(existingWindow.id);
    } else {
      const newWindowId = `win_${Date.now()}`;
      setHighestZIndex(prev => prev + 1);
      setWindows([...windows, {
        id: newWindowId,
        departmentId: deptId,
        isOpen: true,
        isMinimized: false,
        zIndex: highestZIndex + 1
      }]);
      setActiveWindowId(newWindowId);
    }
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter(w => w.id !== id));
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const minimizeWindow = (id: string) => {
    setWindows(windows.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const focusWindow = (id: string) => {
    setHighestZIndex(prev => prev + 1);
    setWindows(windows.map(w => 
      w.id === id 
        ? { ...w, isMinimized: false, zIndex: highestZIndex + 1 } 
        : w
    ));
    setActiveWindowId(id);
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative th-bg th-text font-sans flex flex-col">
      
      {/* Sci-fi abstract background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-40 -translate-y-1/2 translate-x-1/3 pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px] opacity-40 translate-y-1/3 -translate-x-1/4 pointer-events-none z-0"></div>

      {/* Main Desktop / Mobile Area */}
      <div className="relative z-10 flex-1 w-full overflow-hidden">
        
        {/* Desktop / Mobile Background Content */}
        <div className="absolute inset-0 p-2 sm:p-4 md:p-8 pt-2 md:pt-4 overflow-y-auto pb-24 md:pb-28">
          <CEODashboard
            companyData={companyData}
            onOpenDepartment={openDepartment}
            onEnterOS2={onEnterOS2}
            onLogout={onLogout}
            onOpenQuickModule={(mod) => setQuickModal(mod as any)}
          />
        </div>

        {/* Windows Rendering */}
        {windows.map(win => {
          const dept = companyData.departments.find(d => d.id === win.departmentId);
          if (!dept || win.isMinimized) return null;
          
          return (
            <DepartmentWindow
              key={win.id}
              department={dept}
              windowState={win}
              isActive={activeWindowId === win.id}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onFocus={() => focusWindow(win.id)}
            />
          );
        })}

        {/* Quick Module Fullscreen Modal for Mobile & Exec */}
        {quickModal && (
          <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
            <div className="h-12 border-b th-border th-surface2 flex items-center justify-between px-4 flex-shrink-0">
              <button
                onClick={() => setQuickModal(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <ChevronLeft size={16} /> Voltar ao Painel Executivo
              </button>
              <span className="text-xs font-semibold th-muted">
                {quickModal === 'finance' ? 'Financeiro Corporativo 2026' : 'Painel Integrado de Vendas'}
              </span>
              <button
                onClick={() => setQuickModal(null)}
                className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {quickModal === 'finance' ? <FinancialDashboard /> : <SalesDashboardView />}
            </div>
          </div>
        )}
      </div>

      {/* Taskbar / Mobile Bottom Navigation */}
      <Taskbar 
        companyData={companyData} 
        windows={windows} 
        activeWindowId={activeWindowId}
        onOpenDepartment={openDepartment}
        onFocusWindow={focusWindow}
      />
    </div>
  );
};

export default OSShell;
