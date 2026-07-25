import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Package, ClipboardList, Warehouse, ChevronLeft } from 'lucide-react';
import StoreDashboard from './StoreDashboard';
import StorePDV from './StorePDV';
import StoreProducts from './StoreProducts';
import StoreOrders from './StoreOrders';
import StoreInventory from './StoreInventory';

type StoreView = 'dashboard' | 'pdv' | 'products' | 'orders' | 'inventory';

const NAV = [
  { id: 'dashboard' as StoreView, label: 'Dashboard',  Icon: LayoutDashboard },
  { id: 'pdv'       as StoreView, label: 'PDV',         Icon: ShoppingCart },
  { id: 'products'  as StoreView, label: 'Produtos',    Icon: Package },
  { id: 'orders'    as StoreView, label: 'Pedidos',     Icon: ClipboardList },
  { id: 'inventory' as StoreView, label: 'Estoque',     Icon: Warehouse },
];

interface StoreShellProps { onBack: () => void; }

const StoreShell: React.FC<StoreShellProps> = ({ onBack }) => {
  const [view, setView] = useState<StoreView>('dashboard');

  const VIEWS: Record<StoreView, React.ReactNode> = {
    dashboard: <StoreDashboard />,
    pdv:       <StorePDV />,
    products:  <StoreProducts />,
    orders:    <StoreOrders />,
    inventory: <StoreInventory />,
  };

  return (
    <div className="flex h-full">
      {/* Mini Sidebar */}
      <div className="w-44 flex-shrink-0 th-sidebar flex flex-col py-3 gap-0.5">
        <button onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 mb-2 text-xs th-muted hover:text-primary transition-colors">
          <ChevronLeft size={14} /> Voltar ao OS
        </button>
        <div className="px-3 mb-1">
          <p className="text-xs font-bold text-primary tracking-widest uppercase">Lojas</p>
        </div>
        {NAV.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setView(id)}
            className={`flex items-center gap-2.5 mx-2 px-3 py-2 rounded-xl text-sm transition-all ${
              view === id ? 'nav-active font-semibold' : 'th-muted hover:text-primary hover:bg-primary/5'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {VIEWS[view]}
      </div>
    </div>
  );
};

export default StoreShell;
