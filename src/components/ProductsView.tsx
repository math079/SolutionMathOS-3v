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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b th-border pb-5">
        <div>
          <h3 className="text-2xl font-bold th-text flex items-center gap-2">
            <Package className="text-primary" size={24} /> Catálogo de Produtos & Margem de Lucro por Ticket
          </h3>
          <p className="th-muted text-sm mt-1">Correlação nítida entre ticket médio, custo de produção e margem líquida</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingProd(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors"
        >
          <PlusCircle size={16} /> Novo Produto / Serviço
        </button>
      </div>

      {/* Product Ticket Profitability Highlight Box */}
      <div className="th-card p-6 border-l-4 border-l-primary relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Calculator size={20} />
            </div>
            <h4 className="text-lg font-bold th-text">Simulador de Margem & Lucratividade por Ticket</h4>
          </div>
          <span className="text-xs text-primary font-bold px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            Análise em Tempo Real
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="th-surface2 border th-border rounded-xl p-4">
            <label className="text-xs font-semibold th-muted mb-1 block">Selecione o Produto</label>
            <select
              value={selectedProdId}
              onChange={e => setSelectedProdId(Number(e.target.value))}
              className="th-input text-sm font-bold"
            >
              {products.map(p => (
                <option key={p.id} value={p.id} className="th-surface th-text">{p.name}</option>
              ))}
            </select>
          </div>

          <div className="th-surface2 border th-border rounded-xl p-4">
            <label className="text-xs font-semibold th-muted mb-1 block">Qtd. Vendas Projetadas</label>
            <input
              type="number"
              min={1}
              value={salesQuantity}
              onChange={e => setSalesQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="th-input text-sm font-bold"
            />
          </div>

          <div className="th-surface2 border th-border rounded-xl p-4">
            <span className="text-xs font-semibold th-muted block mb-1">Faturamento Previsto</span>
            <div className="text-xl font-bold th-text">{fmt(simRevenue)}</div>
            <div className="text-xs th-muted mt-1">Ticket: {fmt(simProduct?.ticket_price || 0)}</div>
          </div>

          <div className="th-surface2 border th-border rounded-xl p-4">
            <span className="text-xs font-semibold th-muted block mb-1">Custo Direto Total</span>
            <div className="text-xl font-bold text-rose-500">{fmt(simCost)}</div>
            <div className="text-xs th-muted mt-1">Custo unitário: {fmt(simProduct?.cost || 0)}</div>
          </div>

          <div className="th-surface2 border border-primary/30 rounded-xl p-4 bg-primary/5">
            <span className="text-xs font-semibold text-primary block mb-1">Lucro Líquido Previsto</span>
            <div className="text-2xl font-bold text-primary">{fmt(simProfit)}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">Margem: {simMargin.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Catalog Cards Grid */}
      <h4 className="text-lg font-bold th-text">Produtos & Serviços Cadastrados</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="th-muted text-sm col-span-3">Carregando catálogo de produtos...</p>
        ) : products.length === 0 ? (
          <p className="th-muted text-sm col-span-3">Nenhum produto cadastrado.</p>
        ) : (
          products.map(prod => {
            const marginPercent = prod.ticket_price > 0 ? (prod.profit / prod.ticket_price) * 100 : 0;
            return (
              <div
                key={prod.id}
                className="th-card p-6 rounded-2xl hover:border-primary/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                      {prod.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="th-muted hover:text-primary transition-colors p-1"
                        title="Editar Produto"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => deleteProduct(prod.id)}
                        className="th-muted hover:text-rose-500 transition-colors p-1"
                        title="Deletar Produto"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h5 className="text-xl font-bold th-text mb-2">{prod.name}</h5>
                  <p className="text-xs th-muted mb-6 leading-relaxed">{prod.description || 'Sem descrição cadastrada'}</p>

                  <div className="space-y-2 border-t border-b th-border py-4 my-4">
                    <div className="flex justify-between text-sm">
                      <span className="th-muted font-medium">Ticket de Venda:</span>
                      <span className="th-text font-bold">{fmt(prod.ticket_price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="th-muted font-medium">Custo de Produção:</span>
                      <span className="text-rose-500 font-semibold">{fmt(prod.cost)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t th-border">
                      <span className="text-primary font-bold">Lucro Líquido Unitário:</span>
                      <span className="text-primary font-bold text-base">{fmt(prod.profit)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs th-muted font-semibold">Margem por Unidade</span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg border border-emerald-300 dark:border-emerald-800">
                    {marginPercent.toFixed(0)}% Lucro Puro
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="th-card p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b th-border pb-3">
              <h3 className="text-lg font-bold th-text flex items-center gap-2">
                <Package size={18} className="text-primary" />
                {editingProd ? 'Editar Produto' : 'Novo Produto no Catálogo'}
              </h3>
              <button onClick={() => setShowModal(false)} className="th-muted hover:text-rose-500 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Nome do Produto / Serviço *</label>
                <input
                  type="text" required placeholder="Ex: Sistema E-commerce Enterprise"
                  className="th-input"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Ticket de Venda (R$) *</label>
                  <input
                    type="number" required placeholder="5000"
                    className="th-input"
                    value={form.ticket_price} onChange={e => setForm({ ...form, ticket_price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Custo de Produção (R$) *</label>
                  <input
                    type="number" required placeholder="1700"
                    className="th-input"
                    value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })}
                  />
                </div>
              </div>

              {/* Calculated profit preview in form */}
              {form.ticket_price && form.cost && (
                <div className="p-3 th-surface2 border th-border rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="th-muted">Lucro Bruto Calculado:</span>
                    <span className="text-primary font-bold">{fmt(Math.max(0, parseFloat(form.ticket_price) - parseFloat(form.cost)))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="th-muted">Margem Estimada:</span>
                    <span className="text-emerald-500 font-bold">
                      {parseFloat(form.ticket_price) > 0 ? (((parseFloat(form.ticket_price) - parseFloat(form.cost)) / parseFloat(form.ticket_price)) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Categoria</label>
                <select
                  className="th-input"
                  value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  {['Sistemas', 'Sites', 'Apps', 'IA', 'Automações', 'Infraestrutura', 'Consultoria'].map(c => (
                    <option key={c} value={c} className="th-surface th-text">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Descrição do Produto</label>
                <textarea
                  rows={2} placeholder="Escopo, entregáveis do projeto..."
                  className="th-input resize-none"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors mt-2"
              >
                {editingProd ? 'Atualizar Produto' : 'Cadastrar no Catálogo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsView;
