import React, { useEffect, useState } from 'react';
import { ClipboardList, Eye, X, ChevronDown } from 'lucide-react';

const API = 'http://localhost:3001';
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface Order {
  id: number; client_name?: string; status: string; total: number;
  discount: number; payment_method: string; created_at: string; item_count: number;
}
interface OrderItem {
  id: number; product_name: string; sku: string; qty: number; unit_price: number; total: number;
}

const STATUS_COLORS: Record<string, string> = {
  'Pago': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  'Pendente': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
  'Cancelado': 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
};

const StoreOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const load = () => fetch(`${API}/api/store/orders`).then(r => r.json()).then(setOrders);
  useEffect(() => { load(); }, []);

  const openOrder = async (o: Order) => {
    setSelected(o);
    const r = await fetch(`${API}/api/store/orders/${o.id}/items`);
    setItems(await r.json());
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`${API}/api/store/orders/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    load();
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const filtered = orders.filter(o => {
    const matchSearch = !filter || o.client_name?.toLowerCase().includes(filter.toLowerCase()) || String(o.id).includes(filter);
    const matchStatus = statusFilter === 'Todos' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const dayTotal = filtered.filter(o => {
    const today = new Date().toISOString().split('T')[0];
    return o.created_at?.startsWith(today) && o.status !== 'Cancelado';
  }).reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold th-text flex items-center gap-2">
            <ClipboardList size={24} className="text-primary" /> Pedidos
          </h1>
          <p className="text-sm th-muted mt-0.5">{orders.length} pedido{orders.length !== 1 ? 's' : ''} no histórico</p>
        </div>
        <div className="text-right">
          <p className="text-xs th-muted">Vendas hoje (filtrado)</p>
          <p className="text-xl font-bold text-primary">{fmt(dayTotal)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input className="th-input max-w-xs" placeholder="Buscar pedido ou cliente..." value={filter} onChange={e => setFilter(e.target.value)} />
        <div className="flex gap-1.5">
          {['Todos', 'Pago', 'Pendente', 'Cancelado'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-primary text-white' : 'th-surface2 th-muted hover:text-primary'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="th-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="th-surface2 border-b th-border">
              {['#', 'Data', 'Cliente', 'Itens', 'Desconto', 'Total', 'Pagamento', 'Status', 'Ações'].map(h => (
                <th key={h} className="text-xs font-semibold th-muted text-left px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 th-muted">
                  <ClipboardList size={32} className="mx-auto mb-2 opacity-20" />
                  Nenhum pedido encontrado
                </td>
              </tr>
            ) : filtered.map(o => (
              <tr key={o.id} className="border-b th-border hover:bg-primary/3 transition-colors group">
                <td className="px-4 py-3 font-mono text-xs th-muted">#{String(o.id).padStart(4, '0')}</td>
                <td className="px-4 py-3 th-muted text-xs whitespace-nowrap">{fmtDate(o.created_at)}</td>
                <td className="px-4 py-3 th-text">{o.client_name || 'Consumidor Final'}</td>
                <td className="px-4 py-3 text-center th-muted">{o.item_count}</td>
                <td className="px-4 py-3 th-muted">{o.discount > 0 ? fmt(o.discount) : '—'}</td>
                <td className="px-4 py-3 font-bold text-primary">{fmt(o.total)}</td>
                <td className="px-4 py-3 th-muted">{o.payment_method}</td>
                <td className="px-4 py-3">
                  <div className="relative group/status">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer flex items-center gap-1 w-fit ${STATUS_COLORS[o.status] || ''}`}>
                      {o.status} <ChevronDown size={10} />
                    </span>
                    <div className="absolute left-0 top-full mt-1 z-10 th-card shadow-xl rounded-xl overflow-hidden hidden group-hover/status:block min-w-[120px] border th-border">
                      {['Pago', 'Pendente', 'Cancelado'].map(s => (
                        <button key={s} onClick={() => updateStatus(o.id, s)}
                          className={`block w-full text-left px-3 py-2 text-xs hover:bg-primary/5 transition-colors ${o.status === s ? 'font-bold text-primary' : 'th-text'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openOrder(o)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-primary/10 text-primary">
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end p-4">
          <div className="th-card w-full max-w-sm h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b th-border">
              <div>
                <h2 className="font-bold th-text">Pedido #{String(selected.id).padStart(4, '0')}</h2>
                <p className="text-xs th-muted">{fmtDate(selected.created_at)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="th-muted hover:text-rose-500 transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="th-surface2 rounded-lg p-3">
                  <p className="text-xs th-muted mb-0.5">Cliente</p>
                  <p className="font-medium th-text">{selected.client_name || 'Consumidor Final'}</p>
                </div>
                <div className="th-surface2 rounded-lg p-3">
                  <p className="text-xs th-muted mb-0.5">Pagamento</p>
                  <p className="font-medium th-text">{selected.payment_method}</p>
                </div>
              </div>
              <div>
                <p className="text-xs th-muted font-semibold mb-2">ITENS</p>
                <div className="space-y-2">
                  {items.map(i => (
                    <div key={i.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium th-text">{i.product_name}</p>
                        <p className="text-xs th-muted">{i.qty} × {fmt(i.unit_price)}</p>
                      </div>
                      <span className="font-bold th-text">{fmt(i.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t th-border pt-3 space-y-1 text-sm">
                {selected.discount > 0 && (
                  <div className="flex justify-between th-muted"><span>Desconto</span><span>- {fmt(selected.discount)}</span></div>
                )}
                <div className="flex justify-between font-bold text-base th-text">
                  <span>Total</span><span className="text-primary">{fmt(selected.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreOrders;
