import React, { useState, useEffect } from 'react';
import {
  PieChart, Plus, Trash2, Calendar, DollarSign,
  AlertCircle, CheckCircle2, TrendingUp, Info
} from 'lucide-react';
import { SectorBudget, CostType } from './types';

export const FinancialBudgetsView: React.FC = () => {
  const [budgets, setBudgets] = useState<SectorBudget[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  // Form para nova verba
  const [sector, setSector] = useState('');
  const [categoryType, setCategoryType] = useState<CostType>('fixed');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/finance/budgets?month=${selectedMonth}`);
      const data = await res.json();
      setBudgets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector || !allocatedAmount) return;

    try {
      const res = await fetch('http://localhost:3001/api/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector,
          allocated_amount: parseFloat(allocatedAmount),
          month: selectedMonth,
          category_type: categoryType,
          notes
        })
      });

      if (res.ok) {
        setSector('');
        setAllocatedAmount('');
        setNotes('');
        setIsAdding(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (!confirm('Deseja excluir este orçamento setorial?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/finance/budgets/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalAllocated = budgets.reduce((acc, b) => acc + (b.allocated_amount || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.spent_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header com Totais */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 bg-teal-950 px-2.5 py-0.5 rounded border border-teal-800">
            Controle Orçamentário
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Verbas e Orçamentos por Setor</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina limites máximos de gastos para Marketing, RH, Operações e TI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-teal-500"
          />

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            Nova Verba Setorial
          </button>
        </div>
      </div>

      {/* Resumo de Consumo de Verba */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">Orçamento Global do Mês:</span>
          <div className="text-xl font-bold text-white mt-1">
            R$ {totalAllocated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500">Soma de todos os setores</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">Gastos Realizados:</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500">
            {totalAllocated > 0 ? `${((totalSpent / totalAllocated) * 100).toFixed(1)}% do orçamento consumido` : '0%'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">Saldo de Verba Disponível:</span>
          <div className={`text-xl font-bold mt-1 ${totalAllocated - totalSpent >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            R$ {(totalAllocated - totalSpent).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500">Margem restante para gastar</span>
        </div>
      </div>

      {/* Form de Adicionar Verba */}
      {isAdding && (
        <form onSubmit={handleSaveBudget} className="bg-slate-900 border border-teal-500/40 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            Estabelecer Teto Orçamentário para {selectedMonth}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Setor / Departamento:</label>
              <input
                type="text"
                required
                placeholder="Ex: Marketing Digital, RH & Pessoal, TI..."
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Natureza do Custo:</label>
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value as CostType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="fixed">Custo Fixo Operacional</option>
                <option value="variable">Custo Variável Operacional</option>
                <option value="investment">Investimento Estratégico (CAPEX)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Teto da Verba (R$):</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Ex: 15000.00"
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              Salvar Orçamento
            </button>
          </div>
        </form>
      )}

      {/* Grid de Orçamentos por Setor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.length === 0 ? (
          <div className="col-span-full bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
            Nenhum orçamento cadastrado para o mês {selectedMonth}. Clique em "Nova Verba Setorial" para planejar.
          </div>
        ) : (
          budgets.map((b) => {
            const spent = b.spent_amount || 0;
            const percent = b.allocated_amount > 0 ? Math.round((spent / b.allocated_amount) * 100) : 0;
            const isOverBudget = spent > b.allocated_amount;

            return (
              <div
                key={b.id || b.sector}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {b.category_type === 'fixed' ? 'Custo Fixo' : b.category_type === 'variable' ? 'Custo Variável' : 'Investimento'}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">{b.sector}</h4>
                  </div>
                  {b.id && (
                    <button
                      onClick={() => handleDeleteBudget(b.id!)}
                      className="text-slate-600 hover:text-rose-400 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Teto Planejado:</span>
                    <span className="font-bold text-white">R$ {b.allocated_amount.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Gasto Atual:</span>
                    <span className={`font-bold ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                      R$ {spent.toLocaleString('pt-BR')} ({percent}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverBudget ? 'bg-rose-500' : percent > 80 ? 'bg-amber-400' : 'bg-teal-400'
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>

                {isOverBudget && (
                  <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-1 bg-rose-950/40 p-2 rounded-lg border border-rose-900">
                    <AlertCircle size={12} /> Verba estourada em R$ {(spent - b.allocated_amount).toLocaleString('pt-BR')}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
