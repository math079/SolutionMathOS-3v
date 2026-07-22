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
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-16 bg-[#111]/70 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-2xl flex items-center px-4 z-50">
      
      {/* Start Button / System Menu */}
      <div className="flex items-center space-x-2 mr-4">
        <button className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-[#111] shadow-[0_0_15px_rgba(20,184,166,0.5)] hover:bg-secondary transition-all hover:scale-105">
          <Layers size={24} />
        </button>
        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
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
                  : 'text-white/50 hover:bg-white/10 hover:text-primary'
              }`}
              title={dept.name}
            >
              <div className={isActive || isOpen ? 'transform scale-110 transition-transform drop-shadow-[0_0_5px_rgba(20,184,166,0.5)]' : 'transition-transform group-hover:scale-110'}>
                {getIcon(dept.icon)}
              </div>
              
              {/* Indicator dot if open */}
              {isOpen && (
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isActive ? 'bg-primary shadow-[0_0_8px_rgba(20,184,166,1)]' : 'bg-white/40'}`}></div>
              )}
              
              {/* Tooltip */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a1a1a] border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-medium pointer-events-none whitespace-nowrap shadow-lg">
                {dept.name}
                {/* Tooltip Arrow */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a1a] border-b border-r border-white/10 rotate-45"></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Taskbar;
