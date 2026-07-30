import React, { useState, useEffect } from 'react';
import {
  FileText, Printer, Download, TrendingUp, DollarSign, Package,
  ShoppingCart, AlertTriangle, Calendar, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';

interface FinancialReport {
  monthlyBreakdown: { month: string; type: string; total: number }[];
  categoryBreakdown: { category: string; type: string; total: number }[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

interface SalesReport {
  dailySales: { day: string; orders: number; revenue: number }[];
  topSellingProducts: { name: string; sku: string; qty_sold: number; total_revenue: number }[];
  summary: { count: number; total: number; avg_ticket: number };
}

interface InventoryReport {
  totals: { total_items: number; total_value: number; total_cost: number };
  lowStockProducts: any[];
  categorySummary: { category: string; count: number; category_value: number }[];
}

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'financial' | 'sales' | 'inventory'>('financial');
  const [loading, setLoading] = useState(true);

  const [financialData, setFinancialData] = useState<FinancialReport | null>(null);
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryReport | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [finRes, salesRes, invRes] = await Promise.all([
        fetch('http://localhost:3001/api/reports/financial'),
        fetch('http://localhost:3001/api/reports/sales'),
        fetch('http://localhost:3001/api/reports/inventory'),
      ]);

      if (finRes.ok) setFinancialData(await finRes.json());
      if (salesRes.ok) setSalesData(await salesRes.json());
      if (invRes.ok) setInventoryData(await invRes.json());
    } catch (err) {
      console.error('Erro ao carregar relatórios', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:max-w-none">
      {/* Print-only Header */}
      <div className="hidden print:block mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Solution Math OS — Relatório Executivo</h1>
        <p className="text-sm text-gray-600">
          Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/60 p-6 rounded-2xl border border-gray-800 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Central de Relatórios Executivos</h1>
            <p className="text-xs text-gray-400">
              Análise consolidada de desempenho financeiro, vendas e movimentação de estoque.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-blue-500/20"
          >
            <Printer className="w-4 h-4" />
            Exportar / Imprimir PDF
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-800 space-x-4 print:hidden">
        <button
          onClick={() => setActiveTab('financial')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'financial'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Relatório Financeiro & DRE
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'sales'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Relatório de Vendas & PDV
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'inventory'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Relatório de Estoque & Valor
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 text-sm">Carregando dados consolidados...</div>
      ) : (
        <>
          {/* TAB 1: FINANCIAL */}
          {activeTab === 'financial' && financialData && (
            <div className="space-y-6">
              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-400 font-medium">Total de Entradas</span>
                    <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><ArrowUpRight className="w-4 h-4" /></span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">
                    R$ {(financialData.totalIncome || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-400 font-medium">Total de Saídas</span>
                    <span className="p-2 bg-red-500/10 text-red-400 rounded-lg"><ArrowDownRight className="w-4 h-4" /></span>
                  </div>
                  <div className="text-2xl font-black text-red-400">
                    R$ {(financialData.totalExpense || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-400 font-medium">Resultado Líquido</span>
                    <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><TrendingUp className="w-4 h-4" /></span>
                  </div>
                  <div className={`text-2xl font-black ${financialData.netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    R$ {(financialData.netProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* DRE Category Breakdown */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Detalhamento por Categoria
                </h3>

                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-gray-950 text-gray-400 text-xs font-semibold uppercase border-b border-gray-800">
                    <tr>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4 text-right">Valor Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {financialData.categoryBreakdown.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/40">
                        <td className="py-3 px-4 font-medium text-gray-200">{cat.category}</td>
                        <td className="py-3 px-4 text-xs">
                          {cat.type === 'income' ? (
                            <span className="text-emerald-400 font-bold">Receita</span>
                          ) : (
                            <span className="text-red-400 font-bold">Despesa</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold font-mono">
                          R$ {cat.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SALES */}
          {activeTab === 'sales' && salesData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <div className="text-xs text-gray-400 font-medium mb-1">Faturamento Total do PDV</div>
                  <div className="text-2xl font-black text-emerald-400">
                    R$ {(salesData.summary.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <div className="text-xs text-gray-400 font-medium mb-1">Total de Pedidos</div>
                  <div className="text-2xl font-black text-blue-400">
                    {salesData.summary.count || 0} pedidos
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <div className="text-xs text-gray-400 font-medium mb-1">Ticket Médio por Venda</div>
                  <div className="text-2xl font-black text-indigo-400">
                    R$ {(salesData.summary.avg_ticket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Top 10 Produtos Mais Vendidos
                </h3>

                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-gray-950 text-gray-400 text-xs font-semibold uppercase border-b border-gray-800">
                    <tr>
                      <th className="py-3 px-4">Produto</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4 text-center">Unidades Vendidas</th>
                      <th className="py-3 px-4 text-right">Receita Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {salesData.topSellingProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-gray-500">Nenhuma venda registrada até o momento.</td>
                      </tr>
                    ) : (
                      salesData.topSellingProducts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-800/40">
                          <td className="py-3 px-4 font-bold text-gray-200">{p.name}</td>
                          <td className="py-3 px-4 text-xs font-mono text-gray-400">{p.sku || '-'}</td>
                          <td className="py-3 px-4 text-center font-bold text-blue-400">{p.qty_sold}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-400 font-mono">
                            R$ {p.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY */}
          {activeTab === 'inventory' && inventoryData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <div className="text-xs text-gray-400 font-medium mb-1">Total de Itens no Catálogo</div>
                  <div className="text-2xl font-black text-white">
                    {inventoryData.totals.total_items || 0} produtos
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <div className="text-xs text-gray-400 font-medium mb-1">Valor Imobilizado (Preço Venda)</div>
                  <div className="text-2xl font-black text-emerald-400">
                    R$ {(inventoryData.totals.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <div className="text-xs text-gray-400 font-medium mb-1">Alerta de Estoque Baixo</div>
                  <div className="text-2xl font-black text-amber-400">
                    {inventoryData.lowStockProducts.length} itens críticos
                  </div>
                </div>
              </div>

              {/* Low Stock Warning Table */}
              {inventoryData.lowStockProducts.length > 0 && (
                <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Produtos com Alerta de Estoque Baixo
                  </h3>

                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-gray-950 text-gray-400 text-xs font-semibold uppercase border-b border-gray-800">
                      <tr>
                        <th className="py-3 px-4">Produto</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4 text-center">Qtd Atual</th>
                        <th className="py-3 px-4 text-center">Qtd Mínima</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {inventoryData.lowStockProducts.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-800/40">
                          <td className="py-3 px-4 font-bold text-gray-200">{item.name}</td>
                          <td className="py-3 px-4 text-xs text-gray-400">{item.category || '-'}</td>
                          <td className="py-3 px-4 text-center font-bold text-red-400">{item.stock_qty}</td>
                          <td className="py-3 px-4 text-center text-gray-400">{item.stock_min}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
