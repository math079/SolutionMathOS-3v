import React, { useState, useEffect } from 'react';
import {
  Wallet, ShieldCheck, AlertTriangle, ArrowUpRight,
  TrendingDown, CheckCircle, RefreshCw, Info, Edit3, Save, X
} from 'lucide-react';
import { FinancialAccount, CashFlowHealth } from './types';

export const FinancialCashFlowView: React.FC = () => {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [health, setHealth] = useState<CashFlowHealth | null>(null);
  const [loading, setLoading] = useState(true);

  // Edição de saldo de conta
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editTarget, setEditTarget] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [resAcc, resHealth] = await Promise.all([
        fetch('http://localhost:3001/api/finance/accounts'),
        fetch('http://localhost:3001/api/finance/analytics/cash-flow-health')
      ]);
      const accs = await resAcc.json();
      const hlth = await resHealth.json();
      setAccounts(accs || []);
      setHealth(hlth || null);
    } catch (err) {
      console.error('Erro ao carregar dados de caixa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartEdit = (acc: FinancialAccount) => {
    setEditingAccountId(acc.id);
    setEditBalance(acc.balance.toString());
    setEditTarget(acc.target_amount.toString());
  };

  const handleSaveAccount = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/finance/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: parseFloat(editBalance) || 0,
          target_amount: parseFloat(editTarget) || 0
        })
      });
      if (res.ok) {
        setEditingAccountId(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalCash = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Inteligente: Algoritmo de Saúde Financeira & Runway */}
      {health && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-800">
                  Algoritmo de Inteligência de Caixa
                </span>
                <span className="text-xs text-slate-400">Recomendações Estatísticas de Segurança</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" />
                Saúde de Caixa & Runway Operacional
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {health.recommendation}
              </p>
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl border border-slate-700 transition-colors w-fit"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Recalcular Indicadores
            </button>
          </div>

          {/* Cards de Métricas de Queima (Burn Rate) & Recomendações */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-emerald-500/20">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Burn Rate (Custo Médio Mensal):</span>
              <div className="text-xl font-bold text-rose-400 mt-1">
                R$ {health.avg_monthly_burn.toLocaleString('pt-BR')}
              </div>
              <span className="text-[11px] text-slate-500">Média ponderada trimestral</span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Runway Atual de Sobrevivência:</span>
              <div className="text-xl font-bold text-teal-400 mt-1">
                {health.current_runway_months} Meses
              </div>
              <span className="text-[11px] text-slate-500">Com o saldo em caixa total</span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Capital de Giro Recomendado:</span>
              <div className="text-xl font-bold text-white mt-1">
                R$ {health.ideal_working_capital.toLocaleString('pt-BR')}
              </div>
              <span className="text-[11px] text-emerald-400">1.5x o custo mensal da empresa</span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Reserva Estratégica Ideal (3m):</span>
              <div className="text-xl font-bold text-amber-400 mt-1">
                R$ {health.ideal_emergency_reserve.toLocaleString('pt-BR')}
              </div>
              <span className="text-[11px] text-slate-500">Para blindar contra imprevistos</span>
            </div>
          </div>
        </div>
      )}

      {/* Divisão dos Caixas da Empresa */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet className="text-teal-400 w-5 h-5" />
              Alocação dos Caixas & Contas de Liquidez
            </h3>
            <p className="text-xs text-slate-400">
              Saldo consolidado em todas as contas: <strong className="text-emerald-400 font-bold">R$ {totalCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => {
            const isEditing = editingAccountId === acc.id;
            const progress = acc.target_amount > 0 ? Math.min(Math.round((acc.balance / acc.target_amount) * 100), 100) : 100;

            return (
              <div
                key={acc.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {acc.type === 'operational' ? 'Caixa Operacional'
                        : acc.type === 'working_capital' ? 'Capital de Giro'
                        : acc.type === 'emergency_reserve' ? 'Reserva de Emergência'
                        : 'Fundo de Investimento'}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1.5">{acc.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{acc.description}</p>
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={() => handleStartEdit(acc)}
                      className="text-slate-400 hover:text-teal-300 text-xs flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700"
                    >
                      <Edit3 size={12} />
                      Ajustar Saldo
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSaveAccount(acc.id)}
                        className="text-white bg-emerald-600 hover:bg-emerald-500 text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                      >
                        <Save size={12} /> Salvar
                      </button>
                      <button
                        onClick={() => setEditingAccountId(null)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Bloco de Valores */}
                {!isEditing ? (
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-end">
                    <div>
                      <span className="text-xs text-slate-400">Saldo Atual da Conta:</span>
                      <div className="text-2xl font-black text-white mt-0.5">
                        R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    {acc.target_amount > 0 && (
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400">Meta Estabelecida:</span>
                        <div className="text-xs font-semibold text-slate-300">
                          R$ {acc.target_amount.toLocaleString('pt-BR')} ({progress}%)
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Novo Saldo (R$):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editBalance}
                        onChange={(e) => setEditBalance(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Meta Ideal (R$):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editTarget}
                        onChange={(e) => setEditTarget(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Barra de progresso para a meta */}
                {acc.target_amount > 0 && (
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        progress >= 100 ? 'bg-emerald-400' : progress >= 60 ? 'bg-teal-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
