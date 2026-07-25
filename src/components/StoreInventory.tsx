import React, { useEffect, useState } from 'react';
import { Warehouse, Plus, X, TrendingDown, TrendingUp, Minus } from 'lucide-react';

const API = 'http://localhost:3001';

interface Product { id: number; name: string; sku: string; stock_qty: number; stock_min: number; sell_price: number; }
interface Move { id: number; product_name: string; type: string; qty: number; reason: string; created_at: string; order_id?: number; }

const TYPE_STYLE: Record<string, { label: string; color: string; Icon: any }> = {
  'in':     { label: 'Entrada',  color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400', Icon: TrendingUp },
  'out':    { label: 'Saída',    color: 'text-rose-600 bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400',             Icon: TrendingDown },
  'adjust': { label: 'Ajuste',   color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400',             Icon: Minus },
};

const StoreInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [moves, setMoves] = useState<Move[]>([]);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjForm, setAdjForm] = useState({ product_id: '', qty: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch(`${API}/api/store/products`).then(r => r.json()).then(setProducts);
    fetch(`${API}/api/store/stock/moves`).then(r => r.json()).then(setMoves);
  };
  useEffect(() => { load(); }, []);

  const adjust = async () => {
    if (!adjForm.product_id || !adjForm.qty) return;
    setSaving(true);
    await fetch(`${API}/api/store/stock/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: parseInt(adjForm.product_id), qty: parseInt(adjForm.qty), reason: adjForm.reason }),
    });
    setSaving(false);
    setShowAdjust(false);
    setAdjForm({ product_id: '', qty: '', reason: '' });
    load();
  };

  const lowStock = products.filter(p => p.stock_qty <= p.stock_min);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold th-text flex items-center gap-2">
            <Warehouse size={24} className="text-primary" /> Estoque
          </h1>
          <p className="text-sm th-muted mt-0.5">{products.length} produtos · {lowStock.length} alertas de reposição</p>
        </div>
        <button onClick={() => setShowAdjust(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
          <Plus size={16} /> Ajustar Estoque
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Products stock status */}
        <div className="th-card overflow-hidden">
          <div className="px-5 py-3 border-b th-border">
            <h2 className="font-semibold th-text text-sm">Posição de Estoque</h2>
          </div>
          <div className="overflow-y-auto max-h-72">
            <table className="w-full text-sm">
              <thead className="th-surface2">
                <tr>
                  {['Produto', 'Atual', 'Mínimo', 'Status'].map(h => (
                    <th key={h} className="text-xs font-semibold th-muted text-left px-4 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const pct = p.stock_min > 0 ? Math.min(100, (p.stock_qty / (p.stock_min * 3)) * 100) : 100;
                  const isLow = p.stock_qty <= p.stock_min;
                  return (
                    <tr key={p.id} className="border-b th-border hover:bg-primary/3 transition-colors">
                      <td className="px-4 py-2.5">
                        <p className="font-medium th-text text-xs">{p.name}</p>
                        <p className="text-xs th-muted">{p.sku}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`font-bold text-sm ${isLow ? 'text-rose-500' : 'th-text'}`}>{p.stock_qty}</span>
                      </td>
                      <td className="px-4 py-2.5 th-muted text-xs">{p.stock_min}</td>
                      <td className="px-4 py-2.5 w-24">
                        <div className="w-full h-1.5 rounded-full bg-surface2 th-surface2">
                          <div
                            className={`h-1.5 rounded-full transition-all ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-xs mt-0.5 block ${isLow ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {isLow ? '⚠ Baixo' : '✓ Ok'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent moves */}
        <div className="th-card overflow-hidden">
          <div className="px-5 py-3 border-b th-border">
            <h2 className="font-semibold th-text text-sm">Movimentações Recentes</h2>
          </div>
          <div className="divide-y th-border max-h-72 overflow-y-auto">
            {moves.length === 0 ? (
              <div className="py-10 text-center th-muted text-sm">Nenhuma movimentação registrada</div>
            ) : moves.map(m => {
              const t = TYPE_STYLE[m.type] || TYPE_STYLE['adjust'];
              return (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${t.color}`}>
                    <t.Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium th-text truncate">{m.product_name}</p>
                    <p className="text-xs th-muted">{m.reason}{m.order_id ? ` · Pedido #${m.order_id}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${m.type === 'out' ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {m.type === 'out' ? '-' : '+'}{m.qty}
                    </span>
                    <p className="text-xs th-muted">
                      {new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Adjust Modal */}
      {showAdjust && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="th-card w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b th-border">
              <h2 className="font-bold th-text">Ajustar Estoque</h2>
              <button onClick={() => setShowAdjust(false)} className="th-muted hover:text-rose-500"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs th-muted font-medium mb-1">Produto</label>
                <select className="th-input" value={adjForm.product_id} onChange={e => setAdjForm(f => ({ ...f, product_id: e.target.value }))}>
                  <option value="">Selecionar produto...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (atual: {p.stock_qty})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs th-muted font-medium mb-1">Quantidade (+ para entrada, - para saída)</label>
                <input type="number" className="th-input" value={adjForm.qty}
                  onChange={e => setAdjForm(f => ({ ...f, qty: e.target.value }))}
                  placeholder="Ex: +20 ou -5" />
              </div>
              <div>
                <label className="block text-xs th-muted font-medium mb-1">Motivo</label>
                <input className="th-input" value={adjForm.reason}
                  onChange={e => setAdjForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Ex: Reposição de fornecedor, Avaria, Inventário..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t th-border">
              <button onClick={() => setShowAdjust(false)} className="px-4 py-2 text-sm th-muted hover:th-text transition-colors">Cancelar</button>
              <button onClick={adjust} disabled={saving || !adjForm.product_id || !adjForm.qty}
                className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all">
                {saving ? 'Salvando...' : 'Confirmar Ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreInventory;
