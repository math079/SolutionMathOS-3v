import React, { useState, useEffect } from 'react';
import {
  Repeat, Plus, Trash2, Calendar, CreditCard,
  Building, CheckCircle2, Clock, DollarSign
} from 'lucide-react';
import { RecurringCost, CostType } from './types';

export const FinancialRecurringView: React.FC = () => {
  const [items, setItems] = useState<RecurringCost[]>([]);
  const [loading, setLoading] = useState(true);

  // Form para nova despesa recorrente
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryType, setCategoryType] = useState<CostType>('fixed');
  const [department, setDepartment] = useState('Geral');
  const [dueDay, setDueDay] = useState('5');
  const [paymentMethod, setPaymentMethod] = useState('Boleto');
  const [isAdding, setIsAdding] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/finance/recurring');
      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    try {
      const res = await fetch('http://localhost:3001/api/finance/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          category_type: categoryType,
          department,
          due_day: parseInt(dueDay),
          payment_method: paymentMethod
        })
      });

      if (res.ok) {
        setDescription('');
        setAmount('');
        setIsAdding(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este custo recorrente?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/finance/recurring/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalMonthlyCommitment = items.reduce((acc, i) => acc + (i.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded border border-blue-800">
            Previsibilidade Financeira
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Gastos Recorrentes & Assinaturas</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Controle de aluguéis, licenças de software, folha e custos fixos mensais com vencimento programado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Comprometimento Mensal Fixo:</span>
            <span className="text-base font-bold text-rose-400">
              R$ {totalMonthlyCommitment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            Novo Gasto Recorrente
          </button>
        </div>
      </div>

      {/* Form de Adição */}
      {isAdding && (
        <form onSubmit={handleCreateRecurring} className="bg-slate-900 border border-blue-500/40 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            Cadastrar Novo Custo Fixo / Recorrente
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição do Custo:</label>
              <input
                type="text"
                required
                placeholder="Ex: Aluguel Sede, Servidores Cloud, Assinatura ChatGPT..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Mensal (R$):</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Ex: 2500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Dia do Vencimento:</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Natureza do Gasto:</label>
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value as CostType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="fixed">Custo Fixo Operacional</option>
                <option value="variable">Custo Variável</option>
                <option value="investment">Investimento Contínuo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Setor / Departamento:</label>
              <input
                type="text"
                placeholder="Ex: Operações, RH, Marketing..."
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Forma de Pagamento:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Boleto">Boleto Bancário</option>
                <option value="PIX">PIX Automático</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Débito Automático">Débito Automático</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              Salvar Despesa Recorrente
            </button>
          </div>
        </form>
      )}

      {/* Lista de Recorrentes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5 font-semibold">Descrição</th>
              <th className="p-3.5 font-semibold">Setor</th>
              <th className="p-3.5 font-semibold">Classificação</th>
              <th className="p-3.5 font-semibold">Vencimento</th>
              <th className="p-3.5 font-semibold">Pagamento</th>
              <th className="p-3.5 font-semibold text-right">Valor Mensal</th>
              <th className="p-3.5 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-medium text-white">{item.description}</td>
                <td className="p-3.5 text-slate-400">{item.department}</td>
                <td className="p-3.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {item.category_type === 'fixed' ? 'Fixo' : item.category_type === 'variable' ? 'Variável' : 'Investimento'}
                  </span>
                </td>
                <td className="p-3.5">Todo dia {item.due_day}</td>
                <td className="p-3.5 text-slate-400">{item.payment_method}</td>
                <td className="p-3.5 text-right font-bold text-rose-400">
                  R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3.5 text-center">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
