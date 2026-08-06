import React, { useEffect, useState } from 'react';
import { Package, Plus, Pencil, Trash2, Search, X, Save } from 'lucide-react';

const API = 'http://localhost:3001';
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

interface Product {
  id: number; name: string; sku: string; category: string;
  cost_price: number; sell_price: number; stock_qty: number; stock_min: number;
}

const CATEGORIES = ['Geral', 'Vestuário', 'Calçados', 'Acessórios', 'Eletrônicos', 'Alimentos', 'Serviços'];

const EMPTY: Omit<Product, 'id'> = {
  name: '', sku: '', category: 'Geral',
  cost_price: 0, sell_price: 0, stock_qty: 0, stock_min: 5,
};

const StoreProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch(`${API}/api/store/products`).then(r => r.json()).then(setProducts);

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.sku?.toLowerCase().includes(query.toLowerCase()) ||
    p.category?.toLowerCase().includes(query.toLowerCase())
  );

  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowForm(true); };
  const openEdit = (p: Product) => {
    setForm({ name: p.name, sku: p.sku, category: p.category, cost_price: p.cost_price, sell_price: p.sell_price, stock_qty: p.stock_qty, stock_min: p.stock_min });
    setEditId(p.id); setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.sell_price) return;
    setSaving(true);
    try {
      const url = editId ? `${API}/api/store/products/${editId}` : `${API}/api/store/products`;
      const method = editId ? 'PUT' : 'POST';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setShowForm(false); setEditId(null); setForm(EMPTY); load();
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Remover produto?')) return;
    await fetch(`${API}/api/store/products/${id}`, { method: 'DELETE' });
    load();
  };

  const margin = (p: Product) => p.sell_price > 0 ? ((p.sell_price - p.cost_price) / p.sell_price * 100).toFixed(0) : '—';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold th-text flex items-center gap-2">
            <Package size={24} className="text-primary" /> Produtos
          </h1>
          <p className="text-sm th-muted mt-0.5">{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 th-muted pointer-events-none z-10" />
        <input className="th-input th-input-search" placeholder="Buscar nome, SKU, categoria..." value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {/* Table */}
      <div className="th-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="th-surface2 border-b th-border">
                {['Produto', 'SKU', 'Categoria', 'Custo', 'Preço', 'Margem', 'Estoque', 'Mín.', 'Ações'].map(h => (
                  <th key={h} className="text-xs font-semibold th-muted text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 th-muted">
                    <Package size={32} className="mx-auto mb-2 opacity-20" />
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b th-border hover:bg-primary/3 transition-colors group">
                  <td className="px-4 py-3 font-medium th-text">{p.name}</td>
                  <td className="px-4 py-3 th-muted font-mono text-xs">{p.sku || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">{p.category}</span>
                  </td>
                  <td className="px-4 py-3 th-muted">{fmt(p.cost_price)}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{fmt(p.sell_price)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${parseInt(margin(p)) >= 40 ? 'text-emerald-600' : parseInt(margin(p)) >= 20 ? 'text-yellow-600' : 'text-rose-600'}`}>
                      {margin(p)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${p.stock_qty <= p.stock_min ? 'text-rose-500' : 'th-text'}`}>
                      {p.stock_qty}
                    </span>
                    {p.stock_qty <= p.stock_min && <span className="text-xs text-rose-400 ml-1">⚠</span>}
                  </td>
                  <td className="px-4 py-3 th-muted">{p.stock_min}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="th-card w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b th-border">
              <h2 className="font-bold th-text">{editId ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setShowForm(false)} className="th-muted hover:text-rose-500 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs th-muted font-medium mb-1">Nome do Produto *</label>
                <input className="th-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Camiseta Premium" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs th-muted font-medium mb-1">SKU</label>
                  <input className="th-input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Ex: CAM-001" />
                </div>
                <div>
                  <label className="block text-xs th-muted font-medium mb-1">Categoria</label>
                  <select className="th-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs th-muted font-medium mb-1">Preço de Custo (R$)</label>
                  <input type="number" min="0" step="0.01" className="th-input" value={form.cost_price || ''} onChange={e => setForm(f => ({ ...f, cost_price: parseFloat(e.target.value) || 0 }))} placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-xs th-muted font-medium mb-1">Preço de Venda (R$) *</label>
                  <input type="number" min="0" step="0.01" className="th-input" value={form.sell_price || ''} onChange={e => setForm(f => ({ ...f, sell_price: parseFloat(e.target.value) || 0 }))} placeholder="0,00" />
                </div>
              </div>
              {form.sell_price > 0 && form.cost_price > 0 && (
                <div className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-sm text-emerald-700 dark:text-emerald-400">
                  💰 Margem: <strong>{((form.sell_price - form.cost_price) / form.sell_price * 100).toFixed(1)}%</strong>
                  {' '} · Lucro por unidade: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(form.sell_price - form.cost_price)}</strong>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs th-muted font-medium mb-1">Estoque Inicial</label>
                  <input type="number" min="0" className="th-input" value={form.stock_qty || ''} onChange={e => setForm(f => ({ ...f, stock_qty: parseInt(e.target.value) || 0 }))} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs th-muted font-medium mb-1">Estoque Mínimo (alerta)</label>
                  <input type="number" min="0" className="th-input" value={form.stock_min || ''} onChange={e => setForm(f => ({ ...f, stock_min: parseInt(e.target.value) || 5 }))} placeholder="5" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t th-border">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm th-muted hover:th-text transition-colors">Cancelar</button>
              <button onClick={save} disabled={saving || !form.name || !form.sell_price}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all">
                <Save size={14} /> {saving ? 'Salvando...' : editId ? 'Salvar' : 'Criar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreProducts;
