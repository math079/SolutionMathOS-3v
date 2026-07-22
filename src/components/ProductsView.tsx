import React, { useState, useEffect } from 'react';
import {
  Package, PlusCircle, Trash2, Edit3, DollarSign,
  TrendingUp, Percent, Calculator, Layers, X
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  ticket_price: number;
  cost: number;
  profit: number;
  category: string;
  description: string;
}

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

const ProductsView: React.FC = () => {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);

  // Simulator State
  const [selectedProdId, setSelectedProdId] = useState<number | ''>('');
  const [salesQuantity, setSalesQuantity]   = useState<number>(5);

  const [form, setForm] = useState({
    name: '', ticket_price: '5000', cost: '1700',
    category: 'Sistemas', description: ''
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/products');
      const data = await res.json();
      setProducts(data);
      if (data.length > 0 && selectedProdId === '') {
        setSelectedProdId(data[0].id);
      }
    } catch (e) {
      console.error("Erro ao buscar produtos:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProd) {
        await fetch(`http://localhost:3001/api/products/${editingProd.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      } else {
        await fetch('http://localhost:3001/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      }
      setShowModal(false);
      setEditingProd(null);
      resetForm();
      fetchProducts();
    } catch (e) {
      console.error("Erro ao salvar produto:", e);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto do catálogo?")) return;
    try {
      await fetch(`http://localhost:3001/api/products/${id}`, { method: 'DELETE' });
      setProducts(products.filter(p => p.id !== id));
    } catch (e) {
      console.error("Erro ao deletar produto:", e);
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProd(p);
    setForm({
      name: p.name,
      ticket_price: String(p.ticket_price),
      cost: String(p.cost),
      category: p.category || 'Sistemas',
      description: p.description || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ name: '', ticket_price: '5000', cost: '1700', category: 'Sistemas', description: '' });
  };

  // Simulator logic
  const simProduct = products.find(p => p.id === Number(selectedProdId)) || products[0];
  const simRevenue = simProduct ? simProduct.ticket_price * salesQuantity : 0;
  const simCost    = simProduct ? simProduct.cost * salesQuantity : 0;
  const simProfit  = simProduct ? simProduct.profit * salesQuantity : 0;
  const simMargin  = simRevenue > 0 ? (simProfit / simRevenue) * 100 : 0;

  return (
    <div className="p-6 bg-transparent flex-1 overflow-y-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="text-primary" size={24} /> Catálogo de Produtos & Margem de Lucro por Ticket
          </h3>
          <p className="text-white/40 text-sm mt-1">Correlação nítida entre ticket médio, custo de produção e margem líquida</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingProd(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black text-sm font-bold rounded-xl shadow-neon hover:bg-secondary transition-colors"
        >
          <PlusCircle size={16} /> Novo Produto / Serviço
        </button>
      </div>

      {/* Product Ticket Profitability Highlight Box */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 text-primary rounded-lg">
              <Calculator size={20} />
            </div>
            <h4 className="text-lg font-bold text-white">Simulador de Margem & Lucratividade por Ticket</h4>
          </div>
          <span className="text-xs text-primary font-bold px-3 py-1 bg-primary/20 rounded-full border border-primary/30">
            Análise em Tempo Real
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <label className="text-xs font-semibold text-white/50 mb-1 block">Selecione o Produto</label>
            <select
              value={selectedProdId}
              onChange={e => setSelectedProdId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-sm text-white font-bold outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id} className="bg-[#111]">{p.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <label className="text-xs font-semibold text-white/50 mb-1 block">Qtd. Vendas Projetadas</label>
            <input
              type="number"
              min={1}
              value={salesQuantity}
              onChange={e => setSalesQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-sm text-white font-bold outline-none"
            />
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <span className="text-xs font-semibold text-white/50 block mb-1">Faturamento Previsto</span>
            <div className="text-xl font-bold text-white">{fmt(simRevenue)}</div>
            <div className="text-xs text-white/40 mt-1">Ticket: {fmt(simProduct?.ticket_price || 0)}</div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <span className="text-xs font-semibold text-white/50 block mb-1">Custo Direto Total</span>
            <div className="text-xl font-bold text-red-400">{fmt(simCost)}</div>
            <div className="text-xs text-white/40 mt-1">Custo unitário: {fmt(simProduct?.cost || 0)}</div>
          </div>

          <div className="bg-black/40 border border-primary/30 rounded-xl p-4 bg-primary/5">
            <span className="text-xs font-semibold text-primary block mb-1">Lucro Líquido Previsto</span>
            <div className="text-2xl font-bold text-primary">{fmt(simProfit)}</div>
            <div className="text-xs text-green-400 font-bold mt-1">Margem: {simMargin.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Catalog Cards Grid */}
      <h4 className="text-lg font-bold text-white">Produtos & Serviços Cadastrados</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-white/40 text-sm col-span-3">Carregando catálogo de produtos...</p>
        ) : products.length === 0 ? (
          <p className="text-white/40 text-sm col-span-3">Nenhum produto cadastrado.</p>
        ) : (
          products.map(prod => {
            const marginPercent = prod.ticket_price > 0 ? (prod.profit / prod.ticket_price) * 100 : 0;
            return (
              <div
                key={prod.id}
                className="glass-card p-6 border border-white/10 rounded-2xl bg-black/30 hover:border-primary/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/60 text-xs font-semibold rounded-lg">
                      {prod.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 text-white/30 hover:text-primary transition-colors"
                        title="Editar Produto"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => deleteProduct(prod.id)}
                        className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                        title="Excluir Produto"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-2">{prod.name}</h4>
                  <p className="text-xs text-white/50 mb-6 leading-relaxed">{prod.description}</p>

                  {/* Financial Correlation Breakdown Box */}
                  <div className="bg-black/50 border border-white/10 rounded-xl p-4 space-y-2 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/50">Ticket de Venda:</span>
                      <span className="text-white font-bold text-sm">{fmt(prod.ticket_price)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/50">Custo de Produção:</span>
                      <span className="text-red-400 font-semibold">- {fmt(prod.cost)}</span>
                    </div>
                    <div className="h-[1px] bg-white/10 w-full my-1"></div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-primary font-bold">Lucro Líquido:</span>
                      <span className="text-primary font-extrabold">{fmt(prod.profit)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-white/40">Margem por Venda:</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold rounded-full">
                    {marginPercent.toFixed(1)}% Margem
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package size={18} className="text-primary" />
                {editingProd ? 'Editar Produto' : 'Novo Produto / Serviço'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1 block">Nome do Produto / Serviço *</label>
                <input
                  type="text" required placeholder="Ex: Sistema E-commerce sob Medida"
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">Ticket de Venda (R$) *</label>
                  <input
                    type="number" required placeholder="5000"
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
                    value={form.ticket_price} onChange={e => setForm({ ...form, ticket_price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">Custo Direto (R$) *</label>
                  <input
                    type="number" required placeholder="1700"
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
                    value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })}
                  />
                </div>
              </div>

              {/* Calculated profit preview */}
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex justify-between items-center text-xs">
                <span className="text-white/60">Lucro Estimado por Venda:</span>
                <span className="text-primary font-bold text-sm">
                  {fmt((parseFloat(form.ticket_price) || 0) - (parseFloat(form.cost) || 0))}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/50 mb-1 block">Categoria</label>
                <select
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
                  value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  {['Sistemas', 'Sites', 'Apps', 'IA', 'Integrações', 'Automações', 'Consultoria'].map(c => (
                    <option key={c} value={c} className="bg-[#111]">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/50 mb-1 block">Descrição / Detalhes</label>
                <textarea
                  rows={3} placeholder="Descrição curta do produto..."
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none resize-none"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-black font-bold rounded-xl shadow-neon hover:bg-secondary transition-colors"
              >
                {editingProd ? 'Salvar Alterações' : 'Cadastrar no Catálogo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsView;
