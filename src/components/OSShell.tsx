import React, { useState } from 'react';
import { CompanyStructure, Department } from '../data/structure';
import Taskbar from './Taskbar';
import CEODashboard from './CEODashboard';
import DepartmentWindow from './DepartmentWindow';

interface OSShellProps {
  companyData: CompanyStructure;
  onEnterOS2: () => void;
}

export interface WindowState {
  id: string;
  departmentId: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
}

const OSShell: React.FC<OSShellProps> = ({ companyData, onEnterOS2 }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [highestZIndex, setHighestZIndex] = useState(10);

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
    <div className="h-screen w-screen overflow-hidden relative bg-[#0a0a0a] text-white font-sans">
      
      {/* Sci-fi abstract background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-40 -translate-y-1/2 translate-x-1/3 pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px] opacity-40 translate-y-1/3 -translate-x-1/4 pointer-events-none z-0"></div>

      {/* Main Desktop Area */}
      <div className="relative z-10 h-[calc(100vh-5rem)] w-full p-4 overflow-hidden">
        
        {/* Desktop Background Content */}
        <div className="absolute inset-0 p-8 pt-4 overflow-auto">
          <CEODashboard companyData={companyData} onOpenDepartment={openDepartment} onEnterOS2={onEnterOS2} />
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
      </div>

      {/* Taskbar */}
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
