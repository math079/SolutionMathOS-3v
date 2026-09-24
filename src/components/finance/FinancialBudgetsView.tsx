import React, { useState, useEffect } from 'react';
import {
  PieChart, Plus, Trash2, Calendar, DollarSign,
  AlertCircle, CheckCircle2, TrendingUp, Info,
  FileSpreadsheet, UploadCloud, Download, Edit3, X, Check, RefreshCw
} from 'lucide-react';
import { SectorBudget, CostType } from './types';

export const FinancialBudgetsView: React.FC = () => {
  const [budgets, setBudgets] = useState<SectorBudget[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [managementCost, setManagementCost] = useState<{
    total_payroll: number;
    executive_cost: number;
    operational_cost: number;
    executive_ratio: number;
    total_cash: number;
    cash_burn_payroll_ratio: number;
    executive_members: Array<{ name: string; role: string; salary: number }>;
    operational_count: number;
    diagnosis: string;
    recommendation: string;
  } | null>(null);

  // Form para nova verba
  const [sector, setSector] = useState('');
  const [categoryType, setCategoryType] = useState<CostType>('fixed');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Modal para Ajustar Gasto Atual (Manual vs Automático)
  const [editingBudget, setEditingBudget] = useState<SectorBudget | null>(null);
  const [manualSpentInput, setManualSpentInput] = useState('');
  const [savingSpent, setSavingSpent] = useState(false);

  // Modal para Importação de Planilha Excel / CSV
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    counts?: { transactions: number; users: number; sales: number; recurring: number };
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/finance/budgets?month=${selectedMonth}`);
      const data = await res.json();
      setBudgets(data || []);

      const resMgmt = await fetch('http://localhost:3001/api/finance/analytics/management-cost');
      const dataMgmt = await resMgmt.json();
      setManagementCost(dataMgmt);
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

  // Ajuste de gasto manual
  const handleOpenEditSpent = (b: SectorBudget) => {
    setEditingBudget(b);
    setManualSpentInput(b.is_manual && b.spent_amount !== undefined ? String(b.spent_amount) : '');
  };

  const handleSaveSpent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget?.id) return;
    try {
      setSavingSpent(true);
      const val = manualSpentInput.trim() === '' ? null : parseFloat(manualSpentInput);
      const res = await fetch(`http://localhost:3001/api/finance/budgets/${editingBudget.id}/spent`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual_spent: val })
      });
      if (res.ok) {
        setEditingBudget(null);
        loadData();
      }
    } catch (err) {
      console.error('Erro ao atualizar gasto manual:', err);
    } finally {
      setSavingSpent(false);
    }
  };

  const handleRestoreAuto = async () => {
    if (!editingBudget?.id) return;
    try {
      setSavingSpent(true);
      const res = await fetch(`http://localhost:3001/api/finance/budgets/${editingBudget.id}/spent`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual_spent: null })
      });
      if (res.ok) {
        setEditingBudget(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSpent(false);
    }
  };

  // Importação de Planilha
  const handleDownloadTemplate = () => {
    window.open('http://localhost:3001/api/finance/import-template', '_blank');
  };

  const handleProcessSpreadsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setImporting(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('http://localhost:3001/api/finance/import-spreadsheet', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setImportResult({
          success: true,
          message: data.message || 'Planilha importada com sucesso!',
          counts: data.counts
        });
        loadData();
      } else {
        setImportResult({
          success: false,
          message: data.error || 'Falha ao importar a planilha.'
        });
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        message: 'Erro de conexão: ' + err.message
      });
    } finally {
      setImporting(false);
    }
  };

  const totalAllocated = budgets.reduce((acc, b) => acc + (b.allocated_amount || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.spent_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header com Totais & Ações */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 bg-teal-950 px-2.5 py-0.5 rounded border border-teal-800">
            Controle Orçamentário & Verbas
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Verbas e Orçamentos por Setor</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina limites máximos de gastos para Marketing, RH, Operações e TI com cálculo automático ou manual.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-teal-500"
          />

          <button
            onClick={() => { setShowImportModal(true); setImportResult(null); setSelectedFile(null); }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
            title="Importar banco de dados financeiro de uma planilha Excel ou CSV"
          >
            <FileSpreadsheet size={14} />
            Importar Planilha (Excel/CSV)
          </button>

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
          <span className="text-[11px] text-slate-500">Soma de todos os tetos planejados</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">Gastos Realizados no Mês:</span>
          <div className={`text-xl font-bold mt-1 ${totalSpent > totalAllocated ? 'text-rose-400' : 'text-emerald-400'}`}>
            R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500">
            {totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0}% do orçamento consumido
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block font-medium">Margem Restante de Verba:</span>
          <div className={`text-xl font-bold mt-1 ${totalAllocated - totalSpent < 0 ? 'text-rose-400' : 'text-teal-400'}`}>
            R$ {(totalAllocated - totalSpent).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500">Margem restante para gastar</span>
        </div>
      </div>

      {/* Diagnóstico Executivo de Gestão & Folha */}
      {managementCost && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Info size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">
                    Diagnóstico de Gestão & Folha (C-Level / Diretoria vs. Operação)
                  </h3>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    managementCost.diagnosis.includes('ELEVADA')
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {managementCost.diagnosis}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Análise da distribuição de capital entre alta liderança, time operacional e o caixa da empresa.
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-400">
              Impacto no Caixa Total: <span className="text-purple-400 font-bold">{Number(managementCost.cash_burn_payroll_ratio || 0).toFixed(1)}% do caixa/mês</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Alta Gestão (CEOs & Sócios):</span>
              <div className="text-xl font-bold text-purple-400">
                R$ {managementCost.executive_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                Representa <strong className="text-purple-300">{Number(managementCost.executive_ratio || 0).toFixed(1)}%</strong> da folha total
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                {managementCost.executive_members.length > 0 ? (
                  managementCost.executive_members.map((m, idx) => (
                    <span key={idx} className="block truncate">
                      {m.name} ({m.role}): R$ {m.salary.toLocaleString('pt-BR')}
                    </span>
                  ))
                ) : (
                  <span>Nenhum executivo C-Level cadastrado</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Equipe Técnica / Operacional:</span>
              <div className="text-xl font-bold text-teal-400">
                R$ {managementCost.operational_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                <strong className="text-teal-300">{(100 - managementCost.executive_ratio).toFixed(1)}%</strong> da folha ({managementCost.operational_count} colaboradores)
              </p>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                Mão de obra direta executando vendas, produto e suporte.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <AlertCircle size={14} />
                <span>Recomendação Estratégica:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {managementCost.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulário: Nova Verba */}
      {isAdding && (
        <form onSubmit={handleSaveBudget} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm">Cadastrar Novo Teto Orçamentário</h3>

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
                      title="Excluir verba"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Teto Planejado:</span>
                    <span className="font-bold text-white">R$ {b.allocated_amount.toLocaleString('pt-BR')}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      Gasto Atual:
                      {b.is_manual ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-800 font-semibold" title="Valor definido manualmente">
                          Manual
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-400 border border-teal-800 font-semibold" title="Calculado automaticamente pelas despesas reais">
                          Automático
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                        R$ {spent.toLocaleString('pt-BR')} ({percent}%)
                      </span>
                      <button
                        onClick={() => handleOpenEditSpent(b)}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Ajustar Gasto (Manual / Automático)"
                      >
                        <Edit3 size={11} />
                      </button>
                    </div>
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

      {/* Modal: Ajustar Gasto Atual (Manual vs Automático) */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Ajustar Gasto do Setor</h3>
                <p className="text-xs text-slate-400">{editingBudget.sector}</p>
              </div>
              <button onClick={() => setEditingBudget(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSpent} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 block font-semibold">Cálculo Automático do Sistema:</span>
                <p className="text-slate-300">
                  O sistema analisa automaticamente todas as despesas lançadas no financeiro associadas a este setor.
                </p>
                <div className="text-sm font-bold text-teal-400 pt-1">
                  Teto Planejado: R$ {editingBudget.allocated_amount.toLocaleString('pt-BR')}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Definir Gasto Manual (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 40000.00"
                  value={manualSpentInput}
                  onChange={(e) => setManualSpentInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-teal-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Deixe em branco ou clique em "Restaurar Automático" para que o sistema volte a calcular com base nas despesas reais.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleRestoreAuto}
                  disabled={savingSpent}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold px-2 py-1.5 rounded-lg border border-teal-800/60 hover:bg-teal-950/40 transition-colors"
                >
                  Restaurar Automático
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBudget(null)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingSpent}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {savingSpent ? 'Salvando...' : 'Salvar Gasto'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Importação de Planilha Excel / CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Importar Banco de Dados (Excel / CSV)</h3>
                  <p className="text-xs text-slate-400">
                    Alimente automaticamente o financeiro, vendas, colaboradores e custos recorrentes
                  </p>
                </div>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Baixar Planilha Modelo:</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download size={13} />
                  Baixar Modelo .xlsx
                </button>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Você pode utilizar a nossa planilha modelo com abas pré-configuradas (Transações, Colaboradores, Vendas e Custos Recorrentes) ou enviar seu próprio extrato em Excel/CSV. O sistema mapeia os campos automaticamente!
              </p>
            </div>

            <form onSubmit={handleProcessSpreadsheet} className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-all bg-slate-950/40">
                <UploadCloud size={36} className="mx-auto text-emerald-400 mb-2" />
                <label className="block text-xs font-bold text-white cursor-pointer hover:underline mb-1">
                  Clique para selecionar a planilha (.xlsx, .xls ou .csv)
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setImportResult(null);
                      }
                    }}
                  />
                </label>
                <p className="text-[11px] text-slate-500">
                  {selectedFile ? (
                    <span className="text-emerald-400 font-bold">Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  ) : (
                    'Suporta arquivos de até 15 MB'
                  )}
                </p>
              </div>

              {importResult && (
                <div className={`p-4 rounded-xl text-xs space-y-2 border ${
                  importResult.success
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {importResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{importResult.message}</span>
                  </div>
                  {importResult.counts && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-900/60 text-slate-200">
                      <div className="bg-slate-900/60 p-2 rounded-lg text-center">
                        <span className="text-slate-400 block text-[10px]">Transações</span>
                        <strong className="text-emerald-400 text-sm">{importResult.counts.transactions}</strong>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg text-center">
                        <span className="text-slate-400 block text-[10px]">Colaboradores</span>
                        <strong className="text-teal-400 text-sm">{importResult.counts.users}</strong>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg text-center">
                        <span className="text-slate-400 block text-[10px]">Vendas</span>
                        <strong className="text-blue-400 text-sm">{importResult.counts.sales}</strong>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg text-center">
                        <span className="text-slate-400 block text-[10px]">Recorrentes</span>
                        <strong className="text-purple-400 text-sm">{importResult.counts.recurring}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="text-xs text-slate-400 hover:text-white px-4 py-2"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || importing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Processando Planilha...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Alimentar Banco de Dados
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
