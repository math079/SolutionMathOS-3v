import React, { useEffect, useState, useRef } from 'react';
import { Search, Plus, Trash2, ShoppingCart, X, CreditCard, Banknote, Smartphone, CheckCircle } from 'lucide-react';

const API = 'http://localhost:3001';
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

interface Product {
  id: number; name: string; sku: string; sell_price: number;
  cost_price: number; stock_qty: number; category: string;
}
interface CartItem extends Product { qty: number; }

const PAYMENT_METHODS = [
  { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote },
  { id: 'Crédito', label: 'Crédito', icon: CreditCard },
  { id: 'Débito', label: 'Débito', icon: CreditCard },
  { id: 'PIX', label: 'PIX', icon: Smartphone },
];

const StorePDV: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payMethod, setPayMethod] = useState('PIX');
  const [success, setSuccess] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [filteredProds, setFilteredProds] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/api/store/products`).then(r => r.json()).then(setProducts);
  }, []);

  useEffect(() => {
    if (query.trim().length < 1) { setFilteredProds([]); setShowDropdown(false); return; }
    const q = query.toLowerCase();
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    ).slice(0, 8);
    setFilteredProds(filtered);
    setShowDropdown(filtered.length > 0);
  }, [query, products]);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === p.id);
      if (existing) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...p, qty: 1 }];
    });
    setQuery(''); setShowDropdown(false);
    searchRef.current?.focus();
  };

  const changeQty = (id: number, delta: number) => {
    setCart(prev => prev.map(c => c.id === id
      ? { ...c, qty: Math.max(1, c.qty + delta) } : c
    ));
  };

  const removeItem = (id: number) => setCart(prev => prev.filter(c => c.id !== id));
  const clearCart = () => { setCart([]); setDiscount(0); };

  const subtotal = cart.reduce((s, c) => s + c.sell_price * c.qty, 0);
  const total    = Math.max(0, subtotal - discount);

  const finalizeSale = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/store/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({ product_id: c.id, qty: c.qty, unit_price: c.sell_price })),
          discount,
          payment_method: payMethod,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setSuccess(data.id);
        clearCart();
        // Refresh products to reflect stock changes
        fetch(`${API}/api/store/products`).then(r => r.json()).then(setProducts);
        setTimeout(() => setSuccess(null), 3500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Left: Product Search */}
      <div className="flex-1 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold th-text flex items-center gap-2 mb-1">
            <ShoppingCart size={24} className="text-primary" /> Ponto de Venda — PDV
          </h1>
          <p className="text-sm th-muted">Busque por nome ou SKU e adicione ao carrinho</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 th-muted" />
          <input
            ref={searchRef}
            className="th-input pl-10"
            placeholder="Buscar produto (ex: Camiseta, CAM-001)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && filteredProds.length > 0 && addToCart(filteredProds[0])}
            autoFocus
          />
          {showDropdown && (
            <div className="absolute z-30 mt-1 w-full th-card shadow-xl rounded-xl overflow-hidden border th-border">
              {filteredProds.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors border-b th-border last:border-0">
                  <div className="text-left">
                    <p className="text-sm font-medium th-text">{p.name}</p>
                    <p className="text-xs th-muted">{p.sku} · {p.category} · Estoque: {p.stock_qty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{fmt(p.sell_price)}</p>
                    {p.stock_qty <= 0 && <span className="text-xs text-rose-500">Sem estoque</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product grid (quick select) */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs th-muted mb-2 font-medium">TODOS OS PRODUTOS</p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock_qty <= 0}
                className={`th-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-95 ${p.stock_qty <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <div className="w-full h-1.5 rounded-full bg-primary/10 mb-2">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, (p.stock_qty / 50) * 100)}%` }} />
                </div>
                <p className="text-xs font-semibold th-text leading-snug line-clamp-2">{p.name}</p>
                <p className="text-xs th-muted mt-0.5">{p.stock_qty} un.</p>
                <p className="text-sm font-bold text-primary mt-1">{fmt(p.sell_price)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-3">
        <div className="th-card p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold th-text flex items-center gap-1.5">
              <ShoppingCart size={15} /> Carrinho
              {cart.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-white text-xs">{cart.length}</span>
              )}
            </h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-rose-500 hover:underline flex items-center gap-1">
                <Trash2 size={11} /> Limpar
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center th-muted text-sm">
              <ShoppingCart size={40} className="opacity-20 mb-2" />
              Carrinho vazio
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg th-surface2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium th-text truncate">{item.name}</p>
                    <p className="text-xs th-muted">{fmt(item.sell_price)} un.</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded-lg th-surface flex items-center justify-center text-sm font-bold th-text hover:text-primary border th-border">−</button>
                    <span className="w-6 text-center text-sm font-bold th-text">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, +1)} className="w-6 h-6 rounded-lg th-surface flex items-center justify-center text-sm font-bold th-text hover:text-primary border th-border">+</button>
                  </div>
                  <div className="text-right min-w-[56px]">
                    <p className="text-xs font-bold text-primary">{fmt(item.sell_price * item.qty)}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-rose-400 hover:text-rose-600 p-0.5">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="th-card p-4 space-y-3">
          {/* Payment method */}
          <div>
            <p className="text-xs th-muted mb-2 font-medium">FORMA DE PAGAMENTO</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setPayMethod(m.id)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${payMethod === m.id ? 'bg-primary text-white border-primary' : 'th-surface2 th-text border-transparent hover:border-primary/30'}`}>
                  <m.icon size={12} /> {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div>
            <p className="text-xs th-muted mb-1 font-medium">DESCONTO (R$)</p>
            <input type="number" min="0" step="0.50" value={discount || ''}
              onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
              className="th-input text-sm" placeholder="0,00" />
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm border-t th-border pt-3">
            <div className="flex justify-between th-muted">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Desconto</span><span>- {fmt(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg th-text pt-1">
              <span>Total</span><span className="text-primary">{fmt(total)}</span>
            </div>
          </div>

          {/* Finalize */}
          <button onClick={finalizeSale} disabled={cart.length === 0 || loading}
            className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all pulse-neon ${
              cart.length === 0 ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 active:scale-95'
            }`}>
            {loading ? 'Processando...' : `✓ Finalizar Venda — ${fmt(total)}`}
          </button>
        </div>

        {/* Success toast */}
        {success && (
          <div className="th-card border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 p-3 flex items-center gap-2 animate-bounce-once">
            <CheckCircle size={18} className="text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Venda #{success} registrada!</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">Estoque e financeiro atualizados.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorePDV;
