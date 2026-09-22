import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingCart, Maximize2, Minimize2,
  ChevronRight, DollarSign, Users, BarChart2, FileText,
  Zap, LayoutDashboard, Clock, CheckCircle, Bell, Search,
  Plus, Info, Shield, Lock, Target, ArrowRight, Package,
  Briefcase, Star, X, Minus
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, Tooltip as RechartTooltip, Cell,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

type Module = 'crm' | 'financeiro' | 'pdv' | 'ia';
type DealStage = 'Novo Lead' | 'Contato Feito' | 'Proposta Enviada' | 'Negociação' | 'Ganho';
type Phase = 'welcome' | 'explain' | 'explore' | 'cta';

interface Deal {
  id: number;
  company: string;
  value: number;
  stage: DealStage;
  contact: string;
}

interface CartItem {
  id: number;
  qty: number;
}

interface ChatMsg {
  role: 'user' | 'ai';
  text: string;
}

interface TourStep {
  id: string;
  module: Module;
  whatIs: {
    heading: string;
    definition: string;
    points: string[];
    tip: string;
  };
  exploreTip: string;
  nextLabel: string;
}

// ─── Tour Steps com Explicações Completas ─────────────────────────────────────

const TOUR: TourStep[] = [
  {
    id: 'crm',
    module: 'crm',
    whatIs: {
      heading: 'O que é CRM?',
      definition:
        'CRM (Customer Relationship Management) é o sistema que organiza todos os seus negócios e oportunidades comerciais em um funil visual chamado de kanban. Você acompanha cada deal — do primeiro contato até o fechamento — com histórico completo, valor e responsável.',
      points: [
        'Cada card representa um negócio real com valor, responsável e histórico de contato',
        'Avançar um deal de etapa notifica automaticamente o responsável por e-mail ou WhatsApp',
        'Integrado ao Financeiro: deals ganhos já contam como receita no DRE em tempo real',
        'Visualize taxa de conversão, ticket médio e ciclo de vendas por período',
      ],
      tip: 'Na demo, clique em "Avançar →" em qualquer card do kanban para ver o deal mudar de etapa.',
    },
    exploreTip: 'Explore o kanban: clique em "Avançar →" nos cards para mover deals entre as etapas do funil.',
    nextLabel: 'Próximo: Financeiro',
  },
  {
    id: 'financeiro',
    module: 'financeiro',
    whatIs: {
      heading: 'O que é o DRE em Tempo Real?',
      definition:
        'O DRE (Demonstrativo de Resultado do Exercício) mostra se sua empresa lucrou ou não em um período. No Solution Math OS ele é atualizado a cada transação — sem precisar fechar o mês manualmente ou consolidar planilhas. Você vê o resultado agora.',
      points: [
        'Receitas, custos e margem líquida atualizados a cada venda registrada no PDV',
        'Gráfico de faturamento mensal para identificar tendências e sazonalidades',
        'Acompanhamento de meta mensal com percentual de atingimento em tempo real',
        'Integrado ao PDV, CRM e RH: todos os dados financeiros em um único painel',
      ],
      tip: 'Na demo, clique nos meses do gráfico para ver os dados financeiros de cada período.',
    },
    exploreTip: 'Explore o financeiro: clique nos meses da linha do tempo para ver os dados de cada período.',
    nextLabel: 'Próximo: PDV',
  },
  {
    id: 'pdv',
    module: 'pdv',
    whatIs: {
      heading: 'O que é PDV?',
      definition:
        'PDV (Ponto de Venda) é o caixa digital da sua empresa. No Solution Math OS, o PDV é integrado ao estoque e ao financeiro: cada venda registrada no caixa debita o produto do estoque e credita o valor no DRE — tudo em tempo real, sem retrabalho ou planilha.',
      points: [
        'Registre vendas por PIX, cartão de crédito/débito, dinheiro ou boleto',
        'Estoque decrementado automaticamente a cada produto vendido',
        'A receita da venda aparece no DRE financeiro instantaneamente',
        'Suporta múltiplos caixas, filiais e operadores simultâneos',
      ],
      tip: 'Na demo, adicione produtos ao carrinho e clique em "Finalizar Venda" para ver o financeiro atualizar.',
    },
    exploreTip: 'Experimente: adicione produtos ao carrinho e finalize a venda. O financeiro atualiza em tempo real.',
    nextLabel: 'Próximo: IA Lyra',
  },
  {
    id: 'ia',
    module: 'ia',
    whatIs: {
      heading: 'O que é a IA Lyra?',
      definition:
        'A Lyra é a assistente de inteligência artificial integrada ao Solution Math OS. Ela acessa todos os módulos — vendas, CRM, RH e financeiro — e responde perguntas em linguagem natural. É como ter um analista de dados disponível 24 horas por dia, sem precisar abrir nenhum relatório.',
      points: [
        'Consulte métricas: "qual foi o faturamento de agosto?" — resposta instantânea',
        'Gere relatórios: "me mostre o DRE de setembro em PDF" — pronto em segundos',
        'Receba alertas: Lyra avisa quando uma meta está em risco ou um deal esfriou',
        'Acessa todos os módulos: vendas, CRM, RH, financeiro, estoque e agenda',
      ],
      tip: 'Na demo, clique em uma das sugestões de pergunta para ver a Lyra em ação.',
    },
    exploreTip: 'Converse com a Lyra: clique nas sugestões abaixo para fazer perguntas sobre os dados da empresa.',
    nextLabel: 'Concluir tour',
  },
];

// ─── Dados de Exemplo ─────────────────────────────────────────────────────────

const INITIAL_DEALS: Deal[] = [
  { id: 1, company: 'Supermercado Progresso',  value: 36000, stage: 'Novo Lead',        contact: 'Marcos Oliveira' },
  { id: 2, company: 'Pet Shop Vida Animal',     value: 18500, stage: 'Contato Feito',    contact: 'Juliana Santos' },
  { id: 3, company: 'Distribuidora São José',   value: 48000, stage: 'Proposta Enviada', contact: 'Ricardo Alves' },
  { id: 4, company: 'App Mobile Startup XYZ',  value: 45000, stage: 'Negociação',       contact: 'Felipe Moura' },
  { id: 5, company: 'Integração Marketplace',  value: 35000, stage: 'Ganho',            contact: 'Ana Paula Ramos' },
  { id: 6, company: 'Landing Page + Ads',      value: 8500,  stage: 'Novo Lead',        contact: 'Beatriz Costa' },
];

const PRODUCTS = [
  { id: 1, name: 'Combo Mercado Smart',   price: 180, category: 'Alimentos', stock: 24 },
  { id: 2, name: 'Kit Pet Premium',       price: 95,  category: 'Pet',       stock: 18 },
  { id: 3, name: 'Caixa Distribuidora',   price: 340, category: 'Bebidas',   stock: 12 },
];

const MONTHLY_DATA = [
  { label: 'Abr', receita: 68000,  custos: 41000 },
  { label: 'Mai', receita: 82000,  custos: 49000 },
  { label: 'Jun', receita: 91000,  custos: 54000 },
  { label: 'Jul', receita: 78000,  custos: 47000 },
  { label: 'Ago', receita: 105000, custos: 63000 },
  { label: 'Set', receita: 121000, custos: 72400 },
];

const IA_INITIAL: ChatMsg[] = [
  { role: 'ai', text: 'Olá! Sou a Lyra, sua assistente operacional. Tenho acesso a todos os módulos do sistema. Clique em uma das sugestões abaixo ou faça sua pergunta.' },
];

const IA_SUGGESTIONS = [
  {
    q: 'Qual foi o faturamento deste mês?',
    a: 'Em Setembro/2026, o faturamento bruto foi R$ 121.000. Margem líquida: 40,2% — acima da meta de 35%. Os 3 maiores clientes responderam por 67% da receita. Posso gerar o relatório completo em PDF?',
  },
  {
    q: 'Quais deals estão parados no funil?',
    a: '2 deals sem movimentação há mais de 7 dias: "Supermercado Progresso" (R$ 36.000, Novo Lead) e "Pet Shop Vida Animal" (R$ 18.500, Contato Feito). Desejo agendar follow-up automático para ambos?',
  },
  {
    q: 'Qual o custo com pessoal este mês?',
    a: 'Custo com pessoal em Setembro: R$ 28.400 (23,5% da receita bruta). Salários: R$ 22.000 · Encargos: R$ 6.400. Dentro da meta de até 25%. Tudo dentro do esperado.',
  },
];

// ─── Kanban config ────────────────────────────────────────────────────────────

const STAGES: DealStage[] = ['Novo Lead', 'Contato Feito', 'Proposta Enviada', 'Negociação', 'Ganho'];

const STAGE_STYLE: Record<string, { top: string; bg: string; text: string }> = {
  'Novo Lead':        { top: 'border-t-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700' },
  'Contato Feito':    { top: 'border-t-cyan-500',   bg: 'bg-cyan-50',   text: 'text-cyan-700' },
  'Proposta Enviada': { top: 'border-t-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700' },
  'Negociação':       { top: 'border-t-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
  'Ganho':            { top: 'border-t-green-500',  bg: 'bg-green-50',  text: 'text-green-700' },
};

const STAGE_NEXT: Partial<Record<DealStage, DealStage>> = {
  'Novo Lead':        'Contato Feito',
  'Contato Feito':    'Proposta Enviada',
  'Proposta Enviada': 'Negociação',
  'Negociação':       'Ganho',
};

// Sidebar navigation — espelho do SO V3
const NAV_SECTIONS = [
  {
    label: 'PRINCIPAL',
    items: [
      { key: null,                   label: 'Visão Geral',        icon: LayoutDashboard },
      { key: 'financeiro' as Module, label: 'Financeiro 2026',    icon: DollarSign },
      { key: null,                   label: 'Produtos & Ticket',  icon: Package },
    ],
  },
  {
    label: 'COMERCIAL',
    items: [
      { key: null,              label: 'Painel de Vendas',   icon: BarChart2 },
      { key: 'pdv' as Module,   label: 'Lojas / Varejo',     icon: ShoppingCart },
      { key: 'crm' as Module,   label: 'Pipeline Deals',     icon: Target },
      { key: null,              label: 'Leads & Contatos',   icon: Users },
      { key: null,              label: 'Leads Landing Page', icon: Star },
    ],
  },
  {
    label: 'OPERAÇÕES',
    items: [
      { key: null, label: 'Agenda de Operações', icon: Clock },
      { key: null, label: 'Tarefas (OS)',         icon: Briefcase },
      { key: null, label: 'Equipe (RH)',           icon: Users },
    ],
  },
  {
    label: 'GESTÃO',
    items: [
      { key: null, label: 'Relatórios PDF',        icon: FileText },
      { key: null, label: 'Workflows & Aut.',      icon: Zap },
      { key: null, label: 'Suporte & Helpdesk',    icon: Shield },
      { key: null, label: 'Logs de Segurança',     icon: Lock },
    ],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}

// ─── CRM Kanban View ──────────────────────────────────────────────────────────

function CRMView({
  deals,
  onAdvanceDeal,
}: {
  deals: Deal[];
  onAdvanceDeal: (id: number) => void;
}) {
  const grouped: Record<DealStage, Deal[]> = {
    'Novo Lead': [], 'Contato Feito': [], 'Proposta Enviada': [], 'Negociação': [], 'Ganho': [],
  };
  deals.forEach(d => { if (grouped[d.stage]) grouped[d.stage].push(d); });

  const totalPipeline = deals.filter(d => d.stage !== 'Ganho').reduce((s, d) => s + d.value, 0);
  const totalGanho    = grouped['Ganho'].reduce((s, d) => s + d.value, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">CRM — Pipeline Kanban</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Pipeline:&nbsp;<strong className="text-gray-700">{fmt(totalPipeline)}</strong>
            &nbsp;&nbsp;Ganho:&nbsp;<strong className="text-green-600">{fmt(totalGanho)}</strong>
            &nbsp;&nbsp;Deals:&nbsp;<strong className="text-teal-600">{deals.length}</strong>
          </p>
        </div>
        <button className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
          <Plus size={11} />
          Novo Deal
        </button>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-2 p-3 h-full" style={{ minWidth: 'max-content' }}>
          {STAGES.map(stage => {
            const s = STAGE_STYLE[stage];
            const cols = grouped[stage] ?? [];
            return (
              <div
                key={stage}
                className={`w-40 flex-shrink-0 flex flex-col rounded-lg border-t-2 shadow-sm bg-white ${s.top}`}
              >
                <div className={`px-2.5 pt-2 pb-1.5 rounded-t-sm ${s.bg}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${s.text}`}>{stage}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{cols.length} deal{cols.length !== 1 ? 's' : ''}</p>
                    <p className="text-xs font-semibold text-gray-600">
                      {fmt(cols.reduce((s, d) => s + d.value, 0))}
                    </p>
                  </div>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {cols.map(deal => {
                    const canAdvance = STAGE_NEXT[deal.stage] !== undefined;
                    return (
                      <div
                        key={deal.id}
                        className="bg-white border border-gray-200 rounded-md p-2 shadow-sm hover:shadow-md transition-shadow group"
                      >
                        <p className="text-xs font-semibold text-gray-800 leading-tight">{deal.company}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{deal.contact}</p>
                        <p className={`text-xs font-bold mt-1.5 ${s.text}`}>{fmt(deal.value)}</p>
                        {canAdvance && (
                          <button
                            onClick={() => onAdvanceDeal(deal.id)}
                            className="mt-1.5 w-full flex items-center justify-center gap-1 text-xs text-teal-600 border border-teal-200 bg-teal-50 hover:bg-teal-100 rounded py-0.5 transition-colors"
                          >
                            Avançar <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Finance View ─────────────────────────────────────────────────────────────

function FinanceView({
  extraRevenue,
  selectedIdx,
  onSelectMonth,
}: {
  extraRevenue: number;
  selectedIdx: number;
  onSelectMonth: (i: number) => void;
}) {
  const base = MONTHLY_DATA[selectedIdx];
  const isLastMonth = selectedIdx === MONTHLY_DATA.length - 1;
  const receita   = isLastMonth ? base.receita + extraRevenue : base.receita;
  const custos    = base.custos;
  const resultado = receita - custos;
  const margem    = ((resultado / receita) * 100).toFixed(1);
  const meta      = Math.round(receita * 1.075);
  const atingPct  = Math.min(Math.round((receita / meta) * 100), 100);

  const chartData = MONTHLY_DATA.map((d, i) => ({
    m: d.label,
    v: i === MONTHLY_DATA.length - 1 ? d.receita + extraRevenue : d.receita,
    selected: i === selectedIdx,
  }));

  return (
    <div className="h-full overflow-auto p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">
          Financeiro — DRE {MONTHLY_DATA[selectedIdx].label}/2026
        </h2>
        <p className="text-xs text-gray-500">Resultado consolidado · Atualização automática</p>
      </div>

      {/* Month selector */}
      <div className="flex gap-1 flex-wrap">
        {MONTHLY_DATA.map((d, i) => (
          <button
            key={d.label}
            onClick={() => onSelectMonth(i)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
              i === selectedIdx
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Receita Bruta',     value: receita,   textCls: 'text-green-600', bgCls: 'bg-green-50',  bdCls: 'border-green-200', Icon: TrendingUp },
          { label: 'Custos Operac.',    value: custos,    textCls: 'text-red-500',   bgCls: 'bg-red-50',    bdCls: 'border-red-200',   Icon: TrendingDown },
          { label: 'Resultado Líquido', value: resultado, textCls: 'text-teal-600',  bgCls: 'bg-teal-50',   bdCls: 'border-teal-200',  Icon: DollarSign },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-3 ${c.bgCls} ${c.bdCls}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 font-medium leading-tight">{c.label}</p>
              <c.Icon size={11} className={c.textCls} />
            </div>
            <p className={`text-sm font-bold ${c.textCls}`}>{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Meta */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-1.5">
        <div className="flex justify-between">
          <p className="text-xs font-semibold text-gray-700">Meta: {fmt(meta)}</p>
          <span className={`text-xs font-bold ${atingPct >= 100 ? 'text-green-600' : 'text-teal-600'}`}>
            {atingPct}% atingido
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${atingPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <TrendingUp size={11} className="text-teal-500" />
          Margem líquida:&nbsp;<strong className="text-teal-600">{margem}%</strong>
        </p>
      </div>

      {/* Bar chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">Faturamento Mensal</p>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={chartData} barSize={16}>
            <XAxis dataKey="m" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <RechartTooltip formatter={(v: number) => [fmt(v), 'Faturamento']} />
            <Bar dataKey="v" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.selected ? '#0d9488' : '#99f6e4'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── PDV View ─────────────────────────────────────────────────────────────────

function PDVView({
  saleDone,
  onSale,
}: {
  saleDone: boolean;
  onSale: (total: number) => void;
}) {
  const [cart, setCart] = useState<CartItem[]>([{ id: 1, qty: 2 }]);
  const [payMethod, setPayMethod] = useState<'PIX' | 'Cartão' | 'Dinheiro'>('PIX');

  const withDetails = cart.map(i => ({ ...i, product: PRODUCTS.find(p => p.id === i.id)! }));
  const total = withDetails.reduce((s, i) => s + i.product.price * i.qty, 0);

  const addItem = (pid: number) => {
    if (saleDone) return;
    setCart(prev => {
      const ex = prev.find(i => i.id === pid);
      if (ex) return prev.map(i => i.id === pid ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: pid, qty: 1 }];
    });
  };

  const removeItem = (pid: number) => {
    setCart(prev =>
      prev
        .map(i => i.id === pid ? { ...i, qty: i.qty - 1 } : i)
        .filter(i => i.qty > 0)
    );
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Products */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Produtos</p>
          <span className="text-xs text-gray-400">Estoque em tempo real</span>
        </div>
        <div className="space-y-2">
          {PRODUCTS.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.category} · Estoque: {p.stock}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-teal-600">{fmt(p.price)}</span>
                <button
                  disabled={saleDone}
                  onClick={() => addItem(p.id)}
                  className="bg-teal-500 disabled:opacity-40 hover:bg-teal-600 text-white text-xs w-6 h-6 rounded flex items-center justify-center transition-colors"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="w-44 bg-white border-l border-gray-200 p-3 flex flex-col">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Carrinho</p>

        {/* Items */}
        <div className="flex-1 overflow-auto space-y-2 min-h-0">
          {withDetails.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-4">Nenhum item</p>
          ) : (
            withDetails.map(item => (
              <div key={item.id} className="text-xs border-b border-gray-100 pb-2">
                <p className="font-medium text-gray-800 leading-tight truncate">{item.product.name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-center gap-1">
                    <button
                      disabled={saleDone}
                      onClick={() => removeItem(item.id)}
                      className="w-4 h-4 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center disabled:opacity-40"
                    >
                      <Minus size={8} />
                    </button>
                    <span className="text-gray-600 w-4 text-center">{item.qty}</span>
                    <button
                      disabled={saleDone}
                      onClick={() => addItem(item.id)}
                      className="w-4 h-4 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center disabled:opacity-40"
                    >
                      <Plus size={8} />
                    </button>
                  </div>
                  <span className="font-semibold text-gray-700">{fmt(item.product.price * item.qty)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment + Total */}
        <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
          {/* Payment method */}
          <div className="flex gap-1">
            {(['PIX', 'Cartão', 'Dinheiro'] as const).map(m => (
              <button
                key={m}
                disabled={saleDone}
                onClick={() => setPayMethod(m)}
                className={`flex-1 text-xs py-0.5 rounded transition-all ${
                  payMethod === m
                    ? 'bg-teal-500 text-white font-semibold'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-teal-600">{fmt(total)}</span>
          </div>

          {saleDone ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
              <CheckCircle size={13} className="text-green-500 mx-auto mb-0.5" />
              <p className="text-xs font-semibold text-green-700">Venda registrada</p>
              <p className="text-xs text-green-600">Financeiro atualizado</p>
            </div>
          ) : (
            <button
              disabled={cart.length === 0}
              onClick={() => onSale(total)}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 active:scale-95 text-white text-xs font-semibold py-1.5 rounded-lg transition-all"
            >
              Finalizar Venda
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── IA View ─────────────────────────────────────────────────────────────────

function IAView({
  messages,
  onAsk,
  usedSuggestions,
}: {
  messages: ChatMsg[];
  onAsk: (idx: number) => void;
  usedSuggestions: Set<number>;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const availableSuggestions = IA_SUGGESTIONS.filter((_, i) => !usedSuggestions.has(i));

  return (
    <div className="h-full flex flex-col overflow-hidden p-3 gap-2.5">
      {/* Header */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center flex-shrink-0">
          <Zap size={13} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-800">Lyra — IA Assistente</p>
          <p className="text-xs text-gray-500 truncate">Integrada a todos os módulos do sistema</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-500 font-medium flex-shrink-0">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Online
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto bg-gray-50 rounded-xl p-3 space-y-2.5 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'ai' && (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center flex-shrink-0 mr-1.5 mt-0.5">
                <Zap size={9} className="text-white" />
              </div>
            )}
            <div className={`max-w-[82%] text-xs px-3 py-2 rounded-2xl leading-relaxed ${
              m.role === 'user'
                ? 'bg-teal-500 text-white rounded-br-sm'
                : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />

        {/* Available suggestions */}
        {availableSuggestions.length > 0 && (
          <div className="pt-1 space-y-1.5">
            {messages.length > 1 && (
              <p className="text-xs text-gray-400 text-center">Mais perguntas disponíveis</p>
            )}
            {availableSuggestions.map((s, idx) => {
              const originalIdx = IA_SUGGESTIONS.indexOf(s);
              return (
                <button
                  key={originalIdx}
                  onClick={() => onAsk(originalIdx)}
                  className="w-full text-left text-xs border border-teal-200 text-teal-600 bg-white hover:bg-teal-50 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  {s.q}
                </button>
              );
            })}
          </div>
        )}
        {availableSuggestions.length === 0 && usedSuggestions.size > 0 && (
          <p className="text-xs text-gray-400 text-center italic">
            Você explorou todas as perguntas da demo. No sistema real, Lyra responde qualquer dúvida operacional.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white p-6">
      <div className="max-w-xs w-full text-center">
        {/* Logo da Empresa */}
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <img
            src="/logo.jpg"
            alt="Solution Math Logo"
            className="w-10 h-10 rounded-xl object-cover border border-blue-500/30 shadow-md"
          />
          <div className="text-left">
            <span className="font-extrabold text-gray-900 text-sm leading-none block">Solution Math</span>
            <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">OS 3.0 Enterprise</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
          Demo Interativa · Versão Demonstrativa
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
          Veja o Solution Math OS funcionando agora
        </h3>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Explore CRM, Financeiro, PDV e IA como um gestor real. Versão limitada — mas com os módulos reais do sistema.
        </p>
        <div className="flex flex-wrap justify-center gap-1.5 mb-6">
          {['CRM Pipeline', 'DRE Financeiro', 'PDV Integrado', 'IA Lyra'].map(f => (
            <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{f}</span>
          ))}
        </div>
        <button
          onClick={onStart}
          className="bg-teal-500 hover:bg-teal-600 active:scale-95 text-white font-semibold text-sm px-7 py-3 rounded-xl transition-all flex items-center gap-2 mx-auto shadow-lg shadow-teal-100"
        >
          Iniciar tour do sistema
          <ArrowRight size={16} />
        </button>
        <p className="text-xs text-gray-400 mt-3">Sem cadastro · ~2 minutos · Sem compromisso</p>
      </div>
    </div>
  );
}

// ─── Explain Slide ("O que é X?") ─────────────────────────────────────────────

const MODULE_META: Record<Module, { icon: React.ComponentType<{ size?: number | string; className?: string }>; color: string; bg: string }> = {
  crm:        { icon: Target,      color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  financeiro: { icon: DollarSign,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  pdv:        { icon: ShoppingCart,color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  ia:         { icon: Zap,         color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
};

function ExplainSlide({
  step,
  stepIdx,
  total,
  onExplore,
}: {
  step: TourStep;
  stepIdx: number;
  total: number;
  onExplore: () => void;
}) {
  const meta = MODULE_META[step.module];
  const Icon = meta.icon;

  const moduleLabel: Record<Module, string> = {
    crm: 'o CRM',
    financeiro: 'o Financeiro',
    pdv: 'o PDV',
    ia: 'a IA Lyra',
  };

  return (
    <div className="absolute inset-0 z-40 bg-white flex flex-col overflow-auto">
      {/* Progress bar */}
      <div className="flex gap-1 p-4 pb-0 flex-shrink-0">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all ${
              i === stepIdx ? 'bg-teal-500' : i < stepIdx ? 'bg-teal-200' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 p-5 flex flex-col min-h-0 overflow-auto">
        {/* Module badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border mb-3 w-fit ${meta.bg} ${meta.color}`}>
          <Icon size={11} />
          Módulo {stepIdx + 1} de {total}
        </div>

        {/* Heading */}
        <h2 className="text-lg font-bold text-gray-900 mb-2">{step.whatIs.heading}</h2>

        {/* Definition */}
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{step.whatIs.definition}</p>

        {/* How it works */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Como funciona no Solution Math OS
        </p>
        <div className="space-y-2 mb-4">
          {step.whatIs.points.map((pt, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle size={12} className="text-teal-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 leading-snug">{pt}</p>
            </div>
          ))}
        </div>

        {/* Tip box */}
        {step.whatIs.tip && (
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 mb-4">
            <p className="text-xs text-teal-700 flex items-start gap-1.5 leading-snug">
              <Info size={11} className="flex-shrink-0 mt-0.5 text-teal-500" />
              {step.whatIs.tip}
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onExplore}
          className="w-full bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white font-semibold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 mt-auto"
        >
          Explorar {moduleLabel[step.module]}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── CTA Final Screen ─────────────────────────────────────────────────────────

function CTAScreen({
  onRestart,
  onOpenFunnel,
  onCloseFullscreen,
}: {
  onRestart: () => void;
  onOpenFunnel?: () => void;
  onCloseFullscreen?: () => void;
}) {
  const handleFunnelClick = () => {
    // 1. Fecha o modo tela cheia se estiver aberto
    if (onCloseFullscreen) {
      onCloseFullscreen();
    }
    // 2. Aciona o callback para rolar a tela ou direcionar para o funil
    if (onOpenFunnel) {
      onOpenFunnel();
    } else {
      const el = document.getElementById('funil-recomendador');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.open('https://wa.me/5511939157368?text=' + encodeURIComponent('Olá! Concluí a demonstração do Solution Math OS e gostaria de simular meu plano ideal com as ofertas disponíveis.'), '_blank');
      }
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 p-6 text-white text-center">
      <div className="max-w-sm w-full mx-auto">
        {/* Logo da Empresa */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <img
            src="/logo.jpg"
            alt="Solution Math Logo"
            className="w-12 h-12 rounded-2xl object-cover border-2 border-teal-400/40 shadow-xl shadow-teal-500/20"
          />
          <div className="text-left">
            <span className="font-extrabold text-white text-base leading-none block">Solution Math</span>
            <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">OS 3.0 Enterprise</span>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full border border-teal-500/30">
          Tour Demonstrativo Concluído
        </span>

        <h3 className="text-xl font-black text-white mt-3 mb-2 leading-tight">
          Pronto para ver o sistema rodando na sua empresa?
        </h3>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          Você conheceu o CRM, Financeiro DRE, PDV e a IA Lyra. Agora descubra exatamente qual plano atende seu comércio com desconto de implantação e bônus exclusivo da IA.
        </p>

        <div className="space-y-2.5">
          <button
            onClick={handleFunnelClick}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-extrabold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-95"
          >
            Conhecer Produtos & Simular Plano Ideal
            <ArrowRight size={16} />
          </button>

          <a
            href="https://wa.me/5511939157368?text=Ol%C3%A1!%20Conclu%C3%AD%20a%20demo%20do%20Solution%20Math%20OS%20e%20quero%20falar%20com%20um%20especialista%20sobre%20as%20condi%C3%A7%C3%B5es%20especiais."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white/10 hover:bg-white/20 text-slate-200 font-bold py-2.5 px-4 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 text-xs"
          >
            Falar com Especialista no WhatsApp
          </a>
        </div>

        <button
          onClick={onRestart}
          className="text-xs text-slate-400 hover:text-slate-200 mt-4 transition-colors block mx-auto underline"
        >
          Explorar a demo novamente
        </button>
      </div>
    </div>
  );
}

// ─── Tour Guide Bar (durante fase 'explore') ──────────────────────────────────

function TourGuideBar({
  step,
  stepIdx,
  total,
  onNext,
  isFullscreen,
  onToggleFullscreen,
}: {
  step: TourStep;
  stepIdx: number;
  total: number;
  onNext: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-2px_12px_-2px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Step dots */}
        <div className="flex gap-1 flex-shrink-0">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIdx ? 'w-4 bg-teal-500' : i < stepIdx ? 'w-1.5 bg-teal-300' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Tip */}
        <div className="flex-1 min-w-0 flex items-start gap-1">
          <Info size={10} className="text-teal-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-snug truncate">{step.exploreTip}</p>
        </div>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {isFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          <span className="hidden sm:inline">{isFullscreen ? 'Reduzir' : 'Ampliar'}</span>
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          className="flex-shrink-0 flex items-center gap-1 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          {step.nextLabel}
          <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const InteractiveSystemDemo: React.FC<{ onOpenFunnel?: () => void }> = ({ onOpenFunnel }) => {
  const [phase, setPhase]           = useState<Phase>('welcome');
  const [stepIdx, setStepIdx]       = useState(0);
  const [activeModule, setActiveModule] = useState<Module>('crm');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // CRM
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);

  // Finance
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(5);
  const [extraRevenue, setExtraRevenue]         = useState(0);

  // PDV
  const [saleDone, setSaleDone] = useState(false);

  // IA
  const [iaMessages, setIaMessages]         = useState<ChatMsg[]>(IA_INITIAL);
  const [usedSuggestions, setUsedSuggestions] = useState<Set<number>>(new Set());
  const [iaSending, setIaSending]           = useState(false);

  // ESC closes fullscreen
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const step = TOUR[stepIdx];

  // Advance CRM deal
  const handleAdvanceDeal = (id: number) => {
    setDeals(prev => prev.map(d => {
      if (d.id !== id) return d;
      const next = STAGE_NEXT[d.stage];
      return next ? { ...d, stage: next } : d;
    }));
  };

  // PDV sale completion
  const handleSale = (total: number) => {
    if (saleDone) return;
    setSaleDone(true);
    setExtraRevenue(prev => prev + total);
  };

  // IA suggestion ask
  const handleIaAsk = (idx: number) => {
    if (iaSending || usedSuggestions.has(idx)) return;
    const suggestion = IA_SUGGESTIONS[idx];
    setIaSending(true);
    setIaMessages(prev => [...prev, { role: 'user', text: suggestion.q }]);
    setUsedSuggestions(prev => new Set([...prev, idx]));
    setTimeout(() => {
      setIaMessages(prev => [...prev, { role: 'ai', text: suggestion.a }]);
      setIaSending(false);
    }, 700);
  };

  // Tour progression
  const handleNext = () => {
    const next = stepIdx + 1;
    if (next < TOUR.length) {
      setStepIdx(next);
      setActiveModule(TOUR[next].module);
      setPhase('explain');
    } else {
      setPhase('cta');
    }
  };

  const handleExplore = () => {
    setPhase('explore');
  };

  const handleRestart = () => {
    setPhase('welcome');
    setStepIdx(0);
    setActiveModule('crm');
    setDeals(INITIAL_DEALS);
    setSaleDone(false);
    setExtraRevenue(0);
    setSelectedMonthIdx(5);
    setIaMessages(IA_INITIAL);
    setUsedSuggestions(new Set());
  };

  const handleSidebarClick = (mod: Module | null) => {
    if (!mod) return;
    if (phase === 'welcome') return;
    setActiveModule(mod);
    // if still in explain phase, stay there
  };

  // Layout
  const isFS = isFullscreen;

  return (
    <div className={isFS
      ? 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3'
      : 'relative w-full'
    }>
      <div className={`bg-white border border-gray-200 overflow-hidden flex flex-col rounded-2xl shadow-2xl transition-all ${
        isFS ? 'w-full max-w-6xl h-[92vh]' : 'w-full h-[540px]'
      }`}>

        {/* Browser Chrome */}
        <div className="flex items-center gap-3 px-4 h-9 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex gap-1.5 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-gray-100 rounded px-3 py-0.5 text-xs text-gray-400 font-mono truncate">
            solutionmath.com.br/app
          </div>
          <button
            onClick={() => setIsFullscreen(f => !f)}
            title={isFS ? 'Sair da tela cheia (ESC)' : 'Expandir para tela cheia'}
            className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
          >
            {isFS ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>

        {/* App Shell */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Sidebar — dark, fiel ao SO V3 */}
          <aside className="w-44 flex-shrink-0 bg-[#0f1117] flex flex-col overflow-hidden">
            <div className="px-3 pt-3 pb-2.5 border-b border-white/5 flex-shrink-0 flex items-center gap-2">
              <img
                src="/logo.jpg"
                alt="Solution Math Logo"
                className="w-6 h-6 rounded-md object-cover border border-teal-500/40 flex-shrink-0 shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-xs tracking-tight truncate">Solution Math</p>
                <span className="text-[10px] text-teal-400 font-medium block leading-none">OS 3.0 Enterprise</span>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-2 space-y-3">
              {NAV_SECTIONS.map(section => (
                <div key={section.label}>
                  <p className="text-xs text-gray-600 font-semibold px-3 mb-1 tracking-widest">{section.label}</p>
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isActive   = item.key !== null && item.key === activeModule;
                    const isUnlocked = item.key !== null;
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleSidebarClick(item.key as Module | null)}
                        title={!isUnlocked ? 'Disponível na versão completa' : item.label}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                          isActive   ? 'bg-teal-500/20 text-teal-400'
                          : isUnlocked ? 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                          : 'text-gray-600 cursor-default'
                        }`}
                      >
                        <Icon size={12} className="flex-shrink-0" />
                        <span className="text-xs truncate">{item.label}</span>
                        {!isUnlocked && <Lock size={8} className="ml-auto flex-shrink-0 text-gray-700" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* IA footer */}
            <button
              onClick={() => handleSidebarClick('ia')}
              className={`flex items-center gap-2 px-3 py-2.5 border-t border-white/5 transition-colors flex-shrink-0 ${
                activeModule === 'ia'
                  ? 'bg-teal-500/20 text-teal-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
              }`}
            >
              <Zap size={12} />
              <span className="text-xs font-medium">IA Assistente</span>
            </button>
          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* App top bar */}
            <div className="flex items-center gap-2 px-3 h-9 bg-white border-b border-gray-200 flex-shrink-0">
              <div className="flex-1 flex items-center gap-1.5 bg-gray-100 rounded px-2 py-1 min-w-0">
                <Search size={10} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-400 truncate">Buscar módulo, produto, loja ou deal...</span>
              </div>
              <button className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded flex-shrink-0 hover:bg-gray-50">Escuro</button>
              <Bell size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 font-medium px-1.5 py-0.5 bg-gray-100 rounded flex-shrink-0">OS 1</span>
              <button className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">Sair</button>
            </div>

            {/* Module view */}
            <div
              className="flex-1 overflow-hidden bg-gray-50"
              style={{ paddingBottom: phase === 'explore' ? '52px' : '0' }}
            >
              {activeModule === 'crm' && (
                <CRMView deals={deals} onAdvanceDeal={handleAdvanceDeal} />
              )}
              {activeModule === 'financeiro' && (
                <FinanceView
                  extraRevenue={extraRevenue}
                  selectedIdx={selectedMonthIdx}
                  onSelectMonth={setSelectedMonthIdx}
                />
              )}
              {activeModule === 'pdv' && (
                <PDVView saleDone={saleDone} onSale={handleSale} />
              )}
              {activeModule === 'ia' && (
                <IAView
                  messages={iaMessages}
                  onAsk={handleIaAsk}
                  usedSuggestions={usedSuggestions}
                />
              )}
            </div>
          </div>

          {/* Overlays */}
          {phase === 'welcome' && <WelcomeScreen onStart={() => { setPhase('explain'); setStepIdx(0); setActiveModule('crm'); }} />}

          {phase === 'explain' && (
            <ExplainSlide
              step={step}
              stepIdx={stepIdx}
              total={TOUR.length}
              onExplore={handleExplore}
            />
          )}

          {phase === 'cta' && (
            <CTAScreen
              onRestart={handleRestart}
              onOpenFunnel={onOpenFunnel}
              onCloseFullscreen={() => setIsFullscreen(false)}
            />
          )}

          {/* Tour guide bar (only during explore) */}
          {phase === 'explore' && (
            <TourGuideBar
              step={step}
              stepIdx={stepIdx}
              total={TOUR.length}
              onNext={handleNext}
              isFullscreen={isFS}
              onToggleFullscreen={() => setIsFullscreen(f => !f)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveSystemDemo;
