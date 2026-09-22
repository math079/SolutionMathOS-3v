import React from 'react';
import { CompanyStructure } from '../data/structure';
import { WindowState } from './OSShell';
import { Cpu, Briefcase, Wallet, LineChart, Code, CheckSquare, Layers } from 'lucide-react';

interface TaskbarProps {
  companyData: CompanyStructure;
  windows: WindowState[];
  activeWindowId: string | null;
  onOpenDepartment: (deptId: string) => void;
  onFocusWindow: (windowId: string) => void;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Cpu': return <Cpu size={22} />;
    case 'Briefcase': return <Briefcase size={22} />;
    case 'Wallet': return <Wallet size={22} />;
    case 'LineChart': return <LineChart size={22} />;
    case 'Code': return <Code size={22} />;
    case 'CheckSquare': return <CheckSquare size={22} />;
    default: return <Layers size={22} />;
  }
};

const Taskbar: React.FC<TaskbarProps> = ({ 
  companyData, 
  windows, 
  activeWindowId, 
  onOpenDepartment, 
  onFocusWindow 
}) => {
  
  return (
    <div className="fixed bottom-0 md:bottom-6 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-auto h-16 th-surface border-t md:border th-border shadow-2xl md:rounded-2xl flex items-center justify-around md:justify-center px-2 md:px-4 z-40 backdrop-blur-lg bg-surface/95">
      
      {/* Start Button / System Menu */}
      <div className="hidden md:flex items-center space-x-2 mr-4">
        <button className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md hover:bg-primary/90 transition-all hover:scale-105">
          <Layers size={22} />
        </button>
        <div className="h-8 w-[1px] th-border mx-2"></div>
      </div>

      {/* Pinned Apps (Departments) */}
      <div className="flex items-center space-x-3">
        {companyData.departments.map(dept => {
          const isOpen = windows.some(w => w.departmentId === dept.id);
          const activeWindow = windows.find(w => w.departmentId === dept.id);
          const isActive = activeWindowId === activeWindow?.id;

          return (
            <button
              key={dept.id}
              onClick={() => isOpen && activeWindow ? onFocusWindow(activeWindow.id) : onOpenDepartment(dept.id)}
              className={`relative group flex items-center justify-center h-12 w-12 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-primary/20 text-primary border border-primary/30 shadow-inner' 
                  : 'th-muted hover:bg-primary/10 hover:text-primary'
              }`}
              title={dept.name}
            >
              <div className={isActive || isOpen ? 'transform scale-110 transition-transform drop-shadow-[0_0_5px_rgba(20,184,166,0.5)]' : 'transition-transform group-hover:scale-110'}>
                {getIcon(dept.icon)}
              </div>
              
              {/* Indicator dot if open */}
              {isOpen && (
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isActive ? 'bg-primary shadow-[0_0_8px_rgba(20,184,166,1)]' : 'bg-primary/40'}`}></div>
              )}
              
              {/* Tooltip */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity th-surface border th-border th-text px-3 py-1.5 rounded-lg text-xs font-medium pointer-events-none whitespace-nowrap shadow-lg">
                {dept.name}
                {/* Tooltip Arrow */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 th-surface border-b border-r th-border rotate-45"></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Taskbar;
