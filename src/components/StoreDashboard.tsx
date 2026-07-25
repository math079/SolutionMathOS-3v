import React, { useEffect, useState } from 'react';
import { ShoppingBag, TrendingUp, DollarSign, ShoppingCart, AlertTriangle, Award, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API = 'http://localhost:3001';
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

interface DashData {
  salesDay: number;
  salesMonth: number;
  ticketAvg: number;
  ordersDay: number;
  ordersMonth: number;
  topProducts: { name: string; total_sold: number }[];
  lowStock: { id: number; name: string; stock_qty: number; stock_min: number }[];
}

const KPI = ({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color: string;
}) => (
  <div className="th-card p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xs th-muted font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold th-text truncate">{value}</p>
      {sub && <p className="text-xs th-muted mt-0.5">{sub}</p>}
    </div>
  </div>
);

const StoreDashboard: React.FC = () => {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/store/dashboard`);
      setData(await r.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const chartData = data.topProducts.map(p => ({ name: p.name.length > 14 ? p.name.slice(0,14)+'…' : p.name, vendas: p.total_sold }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold th-text flex items-center gap-2">
            <ShoppingBag size={24} className="text-primary" /> Dashboard da Loja
          </h1>
          <p className="text-sm th-muted mt-0.5">22 de julho de 2026 — atualizado automaticamente</p>
        </div>
        <button onClick={load} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
          ↻ Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={DollarSign}    label="Vendas Hoje"     value={fmt(data.salesDay)}    sub={`${data.ordersDay} pedidos`}   color="bg-emerald-500" />
        <KPI icon={TrendingUp}    label="Vendas do Mês"   value={fmt(data.salesMonth)}  sub={`${data.ordersMonth} pedidos`} color="bg-blue-500" />
        <KPI icon={ShoppingCart}  label="Ticket Médio"    value={fmt(data.ticketAvg)}   sub="por pedido este mês"           color="bg-violet-500" />
        <KPI icon={Package}       label="Alertas Estoque" value={String(data.lowStock.length)} sub="produtos abaixo do mínimo" color={data.lowStock.length > 0 ? "bg-rose-500" : "bg-teal-500"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top produtos */}
        <div className="th-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} className="text-primary" />
            <h2 className="font-semibold th-text text-sm">Produtos Mais Vendidos</h2>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [v, 'Unidades']}
                />
                <Bar dataKey="vendas" radius={[0,4,4,0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${170 + i * 15}, 70%, 50%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 th-muted text-sm">
              <ShoppingBag size={32} className="mb-2 opacity-30" />
              Nenhuma venda registrada ainda
            </div>
          )}
        </div>

        {/* Alertas de estoque baixo */}
        <div className="th-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-rose-500" />
            <h2 className="font-semibold th-text text-sm">Alertas de Estoque Baixo</h2>
          </div>
          {data.lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-emerald-500 text-sm">
              <Package size={32} className="mb-2 opacity-60" />
              Todos os produtos ok
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                  <span className="text-sm font-medium text-rose-700 dark:text-rose-400">{p.name}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-rose-600">{p.stock_qty} un.</span>
                    <span className="text-rose-400">(mín: {p.stock_min})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreDashboard;
