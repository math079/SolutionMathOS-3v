import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border th-border th-surface hover:border-primary/40 transition-all text-xs font-medium th-text shadow-sm"
      title={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
    >
      {theme === 'dark' ? (
        <>
          <Sun size={14} className="text-amber-400" />
          <span>Claro</span>
        </>
      ) : (
        <>
          <Moon size={14} className="text-indigo-600" />
          <span>Escuro</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
