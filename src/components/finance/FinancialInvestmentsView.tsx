import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Plus, Trash2, Tag, DollarSign,
  Info, AlertCircle, CheckCircle2, Building, Layers
} from 'lucide-react';
import { InvestmentCategory, SectorBudget } from './types';

export const FinancialInvestmentsView: React.FC = () => {
  const [categories, setCategories] = useState<InvestmentCategory[]>([]);
  const [budgets, setBudgets] = useState<SectorBudget[]>([]);
  const [loading, setLoading] = useState(true);

  // Form para nova categoria de investimento customizada (Holding, Cripto, etc)
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8b5cf6');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Form para alocar verba/investimento na categoria
  const [selectedCategory, setSelectedCategory] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [budgetNotes, setBudgetNotes] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const loadData = async () => {
    try {
      setLoading(true);
      const [resCat, resBud] = await Promise.all([
        fetch('http://localhost:3001/api/finance/investment-categories'),
        fetch(`http://localhost:3001/api/finance/budgets?month=${selectedMonth}`)
      ]);
      const cats = await resCat.json();
      const buds = await resBud.json();
      setCategories(cats || []);
      setBudgets(buds || []);
      if (cats && cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0].name);
      }
    } catch (err) {
      console.error('Erro ao carregar investimentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('http://localhost:3001/api/finance/investment-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
          color: newCatColor
        })
      });

      if (res.ok) {
        setNewCatName('');
        setNewCatDesc('');
        setIsAddingCategory(false);
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao cadastrar categoria.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Deseja excluir esta categoria de investimento?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/finance/investment-categories/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !allocatedAmount) return;

    try {
      const res = await fetch('http://localhost:3001/api/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: selectedCategory,
          allocated_amount: parseFloat(allocatedAmount),
          month: selectedMonth,
          notes: budgetNotes,
          category_type: 'investment'
        })
      });

      if (res.ok) {
        setAllocatedAmount('');
        setBudgetNotes('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalAllocated = budgets
    .filter(b => b.category_type === 'investment')
    .reduce((acc, b) => acc + (b.allocated_amount || 0), 0);

  const totalSpent = budgets
    .filter(b => b.category_type === 'investment')
    .reduce((acc, b) => acc + (b.spent_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-black text-purple-400 bg-purple-950/80 px-2.5 py-0.5 rounded-md border border-purple-800">
                CAPEX & Alocação Estratégica
              </span>
              <span className="text-xs text-slate-400">Exclusivo para Aportes e Crescimento</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Investimentos, Holdings & Expansão
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Diferente dos custos fixos da rotina, aqui sua empresa aloca capital em ativos de valorização: campanhas de aquisição (Google/Meta Ads), aportes societários, holding, reservas de expansão e tecnologia.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* KPIs de Investimento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Verba de Investimento Alocada:</span>
            <div className="text-xl font-bold text-white mt-1">
              R$ {totalAllocated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-purple-400">Planejado para {selectedMonth}</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Total Já Executado / Aportado:</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400">
              {totalAllocated > 0 ? `${((totalSpent / totalAllocated) * 100).toFixed(1)}% consumido` : 'Sem teto definido'}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Saldo Disponível para Aporte:</span>
            <div className={`text-xl font-bold mt-1 ${totalAllocated - totalSpent >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              R$ {(totalAllocated - totalSpent).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400">Restante para investir no mês</span>
          </div>
        </div>
      </div>

      {/* Grid: Categorias Customizadas & Alocação de Verba */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna 1 & 2: Categorias de Investimento e Execução */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="text-purple-400 w-5 h-5" />
              Categorias Estratégicas ({categories.length})
            </h3>

            <button
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} />
              Criar Nova Categoria (Ex: Holding)
            </button>
          </div>

          {/* Form Dinâmico para Cadastrar Categoria Personalizada */}
          {isAddingCategory && (
            <form onSubmit={handleCreateCategory} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-purple-300">Nova Categoria de Investimento</span>
                <span className="text-[11px] text-slate-400">Livre para sua empresa nomear</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Nome da Categoria:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Holding & Participações, Cripto, Imóveis..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Cor de Identificação:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Descrição breve da finalidade..."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          )}

          {/* Lista de Categorias Ativas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const currentBudget = budgets.find(b => b.sector === cat.name);
              const allocated = currentBudget ? currentBudget.allocated_amount : 0;
              const spent = currentBudget ? (currentBudget.spent_amount || 0) : 0;
              const percent = allocated > 0 ? Math.min(Math.round((spent / allocated) * 100), 100) : 0;

              return (
                <div
                  key={cat.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                    </div>
                    {/* Botão excluir apenas se não for padrão antigo */}
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      title="Excluir categoria"
                      className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{cat.description}</p>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Verba Alocada:</span>
                      <span className="font-bold text-white">R$ {allocated.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Realizado:</span>
                      <span className="font-bold text-emerald-400">R$ {spent.toLocaleString('pt-BR')}</span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: percent > 90 ? '#f43f5e' : cat.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna 3: Painel de Definição de Verba / Aporte */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="text-purple-400 w-4 h-4" />
            Alocar Verba de Investimento ({selectedMonth})
          </h3>

          <form onSubmit={handleSaveBudget} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selecione a Categoria de Investimento:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-purple-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor da Verba / Aporte Planejado (R$):
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Ex: 20000.00"
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Observações / Estratégia do Aporte:
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Destinado para campanhas de Google Ads de alta conversão..."
                value={budgetNotes}
                onChange={(e) => setBudgetNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-purple-600/20"
            >
              Definir Verba para {selectedMonth}
            </button>
          </form>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-purple-300 flex items-center gap-1">
              <Info size={12} />
              Integração com DRE:
            </p>
            <p>
              Qualquer despesa lançada com essa categoria consumirá automaticamente o teto desta verba, permitindo analisar ROI e retorno sobre investimento.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
