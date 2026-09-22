import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, ShoppingCart, Maximize2, Minimize2,
  ChevronRight, DollarSign, Users, BarChart2, FileText,
  Zap, LayoutDashboard, Clock, CheckCircle, Bell, Search,
  Plus, Info, Shield, Lock, Target, ArrowRight,
  TrendingDown, Package, Briefcase, Settings, Star
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, Tooltip as RechartTooltip,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

type Module = 'crm' | 'financeiro' | 'pdv' | 'ia';
type DealStage = 'Novo Lead' | 'Contato Feito' | 'Proposta Enviada' | 'Negociação' | 'Ganho' | 'Perdido';

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
  title: string;
  subtitle: string;
  description: string;
  insight: string;
  tip: string;
  highlightKanban: boolean;
  actionLabel: string;
  actionType: 'crm-move' | 'advance' | 'pdv-sale' | 'ia-ask' | 'cta';
}

// ─── Tour — 5 etapas profissionais com foco nos módulos de venda ─────────────

const TOUR: TourStep[] = [
  {
    id: 'crm',
    module: 'crm',
    title: 'CRM — Pipeline Comercial',
    subtitle: 'Visualize todos os negócios em andamento',
    description:
      'Cada card representa uma oportunidade real, com valor, responsável e histórico completo. Sua equipe comercial e você acompanham o funil em tempo real — sem planilha, sem e-mail perdido.',
    insight:
      'Empresas que usam o CRM integrado fecham até 3x mais negócios por mês. O funil garante que nenhuma oportunidade seja esquecida.',
    tip: 'No sistema real, avançar um deal notifica o responsável automaticamente e registra data e observação.',
    highlightKanban: true,
    actionLabel: 'Avançar deal para Proposta',
    actionType: 'crm-move',
  },
  {
    id: 'financeiro',
    module: 'financeiro',
    title: 'Financeiro — DRE em Tempo Real',
    subtitle: 'Resultado consolidado sem planilha',
    description:
      'Receitas, custos e margem líquida calculados automaticamente. Cada venda registrada no PDV aparece aqui em segundos. Chega de consolidar planilha no final do mês.',
    insight:
      'O DRE em tempo real é o módulo mais utilizado por CEOs e gestores financeiros — porque elimina o trabalho de conciliação manual.',
    tip: 'O gráfico de faturamento reflete as operações à medida que acontecem. Quando você registrar uma venda no PDV, o número muda aqui.',
    highlightKanban: false,
    actionLabel: 'Ver o PDV integrado',
    actionType: 'advance',
  },
  {
    id: 'pdv',
    module: 'pdv',
    title: 'PDV — Ponto de Venda Integrado',
    subtitle: 'Caixa que atualiza estoque e financeiro',
    description:
      'Registre uma venda agora. O sistema debita o estoque, credita o financeiro e emite o comprovante — tudo em uma única ação. Suporta PIX, cartão e dinheiro.',
    insight:
      'Este é o módulo mais usado no dia a dia de lojas, distribuidoras e restaurantes. A integração nativa elimina erros de conciliação.',
    tip: 'A venda que você registrar aqui vai atualizar o DRE do módulo financeiro em tempo real.',
    highlightKanban: false,
    actionLabel: 'Registrar venda agora',
    actionType: 'pdv-sale',
  },
  {
    id: 'ia',
    module: 'ia',
    title: 'Lyra — IA Operacional Integrada',
    subtitle: 'Respostas com base nos dados da sua empresa',
    description:
      'A Lyra acessa todos os módulos: vendas, CRM, RH e financeiro. Pergunte em linguagem natural e receba análises, alertas e sugestões de ação — sem precisar abrir relatório nenhum.',
    insight:
      'CEOs que usam o Lyra economizam em média 2h por semana em consultas e geração de relatórios. É como ter um analista disponível 24h.',
    tip: 'Lyra pode gerar relatórios em PDF, identificar gargalos operacionais e sugerir ações com base nos indicadores do negócio.',
    highlightKanban: false,
    actionLabel: 'Perguntar ao Lyra',
    actionType: 'ia-ask',
  },
  {
    id: 'fim',
    module: 'ia',
    title: 'Você acabou de explorar o Solution Math OS.',
    subtitle: 'CRM · Financeiro · PDV · IA — tudo integrado',
    description:
      'Em menos de 2 minutos você viu como gestores e CEOs acompanham suas operações em tempo real. Na versão completa, todos os módulos estão conectados com dados reais da sua empresa.',
    insight:
      'A implantação é feita em até 48 horas. Sem migração complexa, sem treinamento demorado.',
    tip: '',
    highlightKanban: false,
    actionLabel: 'Agendar demonstração completa',
    actionType: 'cta',
  },
];

// ─── Dados de exemplo ─────────────────────────────────────────────────────────

const INITIAL_DEALS: Deal[] = [
  { id: 1, company: 'Supermercado Progresso',  value: 36000, stage: 'Novo Lead',       contact: 'Marcos Oliveira' },
  { id: 2, company: 'Pet Shop Vida Animal',     value: 18500, stage: 'Contato Feito',   contact: 'Juliana Santos' },
  { id: 3, company: 'Distribuidora São José',   value: 48000, stage: 'Proposta Enviada',contact: 'Ricardo Alves' },
  { id: 4, company: 'App Mobile Startup XYZ',  value: 45000, stage: 'Negociação',      contact: 'Felipe Moura' },
  { id: 5, company: 'Integração Marketplace',  value: 35000, stage: 'Ganho',           contact: 'Ana Paula Ramos' },
  { id: 6, company: 'Landing Page + Ads',      value: 8500,  stage: 'Novo Lead',       contact: 'Beatriz Costa' },
];

const PRODUCTS = [
  { id: 1, name: 'Combo Mercado Smart',   price: 180, category: 'Alimentos', stock: 24 },
  { id: 2, name: 'Kit Pet Premium',       price: 95,  category: 'Pet',       stock: 18 },
  { id: 3, name: 'Caixa Distribuidora',   price: 340, category: 'Bebidas',   stock: 12 },
];

const CHART_DATA = [
  { m: 'Abr', v: 68000 },
  { m: 'Mai', v: 82000 },
  { m: 'Jun', v: 91000 },
  { m: 'Jul', v: 78000 },
  { m: 'Ago', v: 105000 },
  { m: 'Set', v: 121000 },
];

// Kanban stages to show (subset — matching the screenshot)
const KANBAN_STAGES: DealStage[] = ['Novo Lead', 'Contato Feito', 'Proposta Enviada', 'Negociação', 'Ganho'];

const STAGE_STYLE: Record<string, { topBorder: string; headerBg: string; headerText: string }> = {
  'Novo Lead':        { topBorder: 'border-t-blue-500',   headerBg: 'bg-blue-50',   headerText: 'text-blue-700' },
  'Contato Feito':    { topBorder: 'border-t-cyan-500',   headerBg: 'bg-cyan-50',   headerText: 'text-cyan-700' },
  'Proposta Enviada': { topBorder: 'border-t-amber-500',  headerBg: 'bg-amber-50',  headerText: 'text-amber-700' },
  'Negociação':       { topBorder: 'border-t-purple-500', headerBg: 'bg-purple-50', headerText: 'text-purple-700' },
  'Ganho':            { topBorder: 'border-t-green-500',  headerBg: 'bg-green-50',  headerText: 'text-green-700' },
  'Perdido':          { topBorder: 'border-t-red-400',    headerBg: 'bg-red-50',    headerText: 'text-red-600' },
};

// Sidebar navigation — fiel ao SO V3
const NAV_SECTIONS = [
  {
    label: 'PRINCIPAL',
    items: [
      { key: null,              label: 'Visão Geral',       icon: LayoutDashboard },
      { key: 'financeiro' as Module, label: 'Financeiro 2026',   icon: DollarSign },
      { key: null,              label: 'Produtos & Ticket', icon: Package },
    ],
  },
  {
    label: 'COMERCIAL',
    items: [
      { key: null,              label: 'Painel de Vendas',  icon: BarChart2 },
      { key: 'pdv' as Module,   label: 'Lojas / Varejo',    icon: ShoppingCart },
      { key: 'crm' as Module,   label: 'Pipeline Deals',    icon: Target },
      { key: null,              label: 'Leads & Contatos',  icon: Users },
      { key: null,              label: 'Leads Landing Page',icon: Star },
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
      { key: null, label: 'Relatórios PDF',       icon: FileText },
      { key: null, label: 'Workflows & Automações', icon: Zap },
      { key: null, label: 'Suporte & Helpdesk',   icon: Shield },
      { key: null, label: 'Logs de Segurança',    icon: Lock },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}

// ─── CRM Kanban View ──────────────────────────────────────────────────────────

function CRMView({ deals, highlight }: { deals: Deal[]; highlight: boolean }) {
  const grouped: Partial<Record<DealStage, Deal[]>> = {};
  KANBAN_STAGES.forEach(s => { grouped[s] = []; });
  deals.forEach(d => { if (grouped[d.stage]) grouped[d.stage]!.push(d); });

  const totalPipeline = deals.filter(d => d.stage !== 'Perdido').reduce((s, d) => s + d.value, 0);
  const totalGanho    = (grouped['Ganho'] ?? []).reduce((s, d) => s + d.value, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Module header */}
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

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-2 p-3 h-full min-w-max">
          {KANBAN_STAGES.map((stage, si) => {
            const s = STAGE_STYLE[stage];
            const stageDe = grouped[stage] ?? [];
            const isHighlighted = highlight && si === 0;
            return (
              <div
                key={stage}
                className={`w-40 flex-shrink-0 flex flex-col rounded-lg border-t-2 shadow-sm bg-white transition-all ${s.topBorder}
                  ${isHighlighted ? 'ring-2 ring-teal-400 ring-offset-1' : ''}`}
              >
                <div className={`px-2.5 pt-2 pb-1.5 ${s.headerBg} rounded-t-sm`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${s.headerText}`}>{stage}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">{stageDe.length} deal{stageDe.length !== 1 ? 's' : ''}</p>
                    <p className="text-xs font-semibold text-gray-600">{fmt(stageDe.reduce((s, d) => s + d.value, 0))}</p>
                  </div>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {stageDe.map(d => (
                    <div
                      key={d.id}
                      className="bg-white border border-gray-200 rounded-md p-2 shadow-sm hover:shadow-md transition-shadow cursor-default"
                    >
                      <p className="text-xs font-semibold text-gray-800 leading-tight">{d.company}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{d.contact}</p>
                      <p className={`text-xs font-bold mt-1.5 ${s.headerText}`}>{fmt(d.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Financial Dashboard (DRE) ────────────────────────────────────────────────

function FinanceView({ extraRevenue }: { extraRevenue: number }) {
  const receita   = 121000 + extraRevenue;
  const custos    = 72400;
  const resultado = receita - custos;
  const margem    = ((resultado / receita) * 100).toFixed(1);
  const meta      = 130000;
  const atingimento = ((receita / meta) * 100).toFixed(0);

  const chartData = CHART_DATA.map((d, i) => i === 5 ? { ...d, v: receita } : d);

  return (
    <div className="h-full overflow-auto p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">Financeiro — DRE Setembro 2026</h2>
        <p className="text-xs text-gray-500">Resultado consolidado · Atualização automática</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Receita Bruta',     value: receita,   textCls: 'text-green-600', bgCls: 'bg-green-50',  bdCls: 'border-green-200', icon: TrendingUp,   iconCls: 'text-green-500' },
          { label: 'Custos Operac.',    value: custos,    textCls: 'text-red-500',   bgCls: 'bg-red-50',    bdCls: 'border-red-200',   icon: TrendingDown, iconCls: 'text-red-400' },
          { label: 'Resultado Líquido', value: resultado, textCls: 'text-teal-600',  bgCls: 'bg-teal-50',   bdCls: 'border-teal-200',  icon: DollarSign,   iconCls: 'text-teal-500' },
        ].map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`rounded-xl border p-3 ${c.bgCls} ${c.bdCls}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500 font-medium leading-tight">{c.label}</p>
                <Icon size={12} className={c.iconCls} />
              </div>
              <p className={`text-sm font-bold ${c.textCls}`}>{fmt(c.value)}</p>
            </div>
          );
        })}
      </div>

      {/* Meta + margem */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-xs font-semibold text-gray-700">Meta do Mês: {fmt(meta)}</p>
          <span className="text-xs font-bold text-teal-600">{atingimento}% atingido</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(Number(atingimento), 100)}%` }}
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
        <ResponsiveContainer width="100%" height={88}>
          <BarChart data={chartData} barSize={16}>
            <XAxis dataKey="m" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <RechartTooltip formatter={(v: number) => [fmt(v), 'Faturamento']} />
            <Bar dataKey="v" fill="#14b8a6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── PDV Panel ────────────────────────────────────────────────────────────────

function PDVView({
  saleDone,
  onSale,
}: {
  saleDone: boolean;
  onSale: (total: number) => void;
}) {
  const [cart, setCart] = useState<CartItem[]>([{ id: 1, qty: 2 }]);

  const cartWithDetails = cart.map(item => ({
    ...item,
    product: PRODUCTS.find(p => p.id === item.id)!,
  }));

  const total = cartWithDetails.reduce((s, i) => s + i.product.price * i.qty, 0);

  const addToCart = (productId: number) => {
    if (saleDone) return;
    setCart(prev => {
      const ex = prev.find(i => i.id === productId);
      if (ex) return prev.map(i => i.id === productId ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: productId, qty: 1 }];
    });
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
              <div>
                <p className="text-xs font-semibold text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400">{p.category} · Estoque: {p.stock}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-600">{fmt(p.price)}</span>
                <button
                  disabled={saleDone}
                  onClick={() => addToCart(p.id)}
                  className="bg-teal-500 disabled:opacity-40 hover:bg-teal-600 text-white text-xs px-2 py-0.5 rounded transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="w-44 bg-white border-l border-gray-200 p-3 flex flex-col">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Carrinho</p>
        <div className="flex-1 overflow-auto space-y-2 min-h-0">
          {cartWithDetails.map(item => (
            <div key={item.id} className="text-xs border-b border-gray-100 pb-2">
              <p className="font-medium text-gray-800 leading-tight">{item.product.name}</p>
              <div className="flex justify-between text-gray-400 mt-0.5">
                <span>{item.qty}× {fmt(item.product.price)}</span>
                <span className="font-semibold text-gray-600">{fmt(item.product.price * item.qty)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-bold text-teal-600">{fmt(total)}</span>
          </div>
          <div className="flex gap-1">
            {['PIX', 'Cartão', 'Dinheiro'].map(f => (
              <span key={f} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{f}</span>
            ))}
          </div>
          {saleDone ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
              <CheckCircle size={13} className="text-green-500 mx-auto mb-0.5" />
              <p className="text-xs font-semibold text-green-700">Venda registrada</p>
              <p className="text-xs text-green-600">Financeiro atualizado</p>
            </div>
          ) : (
            <button
              onClick={() => onSale(total)}
              className="w-full bg-teal-500 hover:bg-teal-600 active:scale-95 text-white text-xs font-semibold py-1.5 rounded-lg transition-all"
            >
              Finalizar Venda
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── IA Lyra Panel ────────────────────────────────────────────────────────────

const IA_INITIAL: ChatMsg[] = [
  { role: 'ai', text: 'Olá! Sou a Lyra, sua assistente operacional integrada. Tenho acesso a todos os módulos — vendas, CRM, RH e financeiro. Como posso ajudar?' },
];

const IA_QUESTION = 'Qual foi o faturamento deste mês?';
const IA_ANSWER =
  'Em Setembro/2026, o faturamento bruto foi de R$ 121.000. A margem líquida está em 40,2% — acima da meta de 35%. Os 3 maiores clientes responderam por 67% da receita. Seu melhor vendedor fechou R$ 48.000 este mês. Deseja que eu gere o relatório completo em PDF?';

const IA_SUGGESTIONS = [
  'Qual foi o faturamento deste mês?',
  'Quais deals estão parados no funil?',
  'Gere um relatório de custos de setembro',
];

function IAView({
  messages,
  onAsk,
  asked,
}: {
  messages: ChatMsg[];
  onAsk: () => void;
  asked: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full flex flex-col overflow-hidden p-3 gap-2.5">
      {/* IA header */}
      <div className="flex items-center gap-2 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-2.5">
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
            <div
              className={`max-w-[82%] text-xs px-3 py-2 rounded-2xl leading-relaxed ${
                m.role === 'user'
                  ? 'bg-teal-500 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {!asked && (
          <div className="pt-1 space-y-1.5">
            <p className="text-xs text-gray-400 text-center">Perguntas sugeridas</p>
            {IA_SUGGESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={i === 0 ? onAsk : undefined}
                className={`w-full text-left text-xs border rounded-lg px-2.5 py-1.5 transition-colors ${
                  i === 0
                    ? 'border-teal-300 text-teal-600 bg-white hover:bg-teal-50'
                    : 'border-gray-200 text-gray-400 bg-white cursor-default'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/97 backdrop-blur-sm">
      <div className="max-w-sm w-full text-center px-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
          Demo Interativa · Versão Demonstrativa
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2.5 leading-snug">
          Veja o Solution Math OS funcionando agora
        </h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          Explore CRM, Financeiro, PDV e IA como um gestor real. Esta é uma versão limitada — mas os módulos são os mesmos que sua empresa usaria.
        </p>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-6">
          {['CRM Pipeline', 'DRE em Tempo Real', 'PDV Integrado', 'IA Lyra'].map(f => (
            <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
              {f}
            </span>
          ))}
        </div>

        <button
          onClick={onStart}
          className="bg-teal-500 hover:bg-teal-600 active:scale-95 text-white font-semibold text-sm px-7 py-3 rounded-xl transition-all flex items-center gap-2 mx-auto shadow-lg shadow-teal-200"
        >
          Iniciar tour do sistema
          <ArrowRight size={16} />
        </button>

        <p className="text-xs text-gray-400 mt-3">
          Sem cadastro&nbsp;·&nbsp;Aproximadamente 2 minutos&nbsp;·&nbsp;Sem compromisso
        </p>
      </div>
    </div>
  );
}

// ─── Tour Guide Bar (barra de orientação em baixo) ────────────────────────────

function TourGuide({
  step,
  stepIdx,
  total,
  actionDone,
  onAction,
}: {
  step: TourStep;
  stepIdx: number;
  total: number;
  actionDone: boolean;
  onAction: () => void;
}) {
  const isFinal = stepIdx === total - 1;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.08)]">
      {/* Insight strip (top of bar) */}
      {step.insight && (
        <div className="bg-teal-50 border-b border-teal-100 px-4 py-1.5 flex items-start gap-2">
          <Info size={11} className="text-teal-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-teal-700 font-medium leading-snug">{step.insight}</p>
        </div>
      )}

      {/* Main row */}
      <div className="px-3.5 py-2.5">
        <div className="flex items-center gap-3">
          {/* Progress indicator */}
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

          {/* Step title + description */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{step.title}</p>
            <p className="text-xs text-gray-500 truncate hidden sm:block">{step.subtitle}</p>
          </div>

          {/* Action button */}
          <button
            onClick={onAction}
            disabled={actionDone && !isFinal}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all ${
              isFinal
                ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-100'
                : actionDone
                ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                : 'bg-gray-900 hover:bg-gray-700 text-white'
            }`}
          >
            {actionDone && !isFinal ? (
              <><CheckCircle size={11} /> Concluído</>
            ) : (
              <>{step.actionLabel} {!isFinal && !actionDone && <ChevronRight size={11} />}</>
            )}
          </button>
        </div>

        {/* Tip */}
        {step.tip && (
          <p className="flex items-start gap-1.5 text-xs text-gray-400 italic mt-1.5">
            <Info size={10} className="text-teal-300 flex-shrink-0 mt-0.5" />
            {step.tip}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const InteractiveSystemDemo: React.FC = () => {
  const [started, setStarted]           = useState(false);
  const [stepIdx, setStepIdx]           = useState(0);
  const [activeModule, setActiveModule] = useState<Module>('crm');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // CRM
  const [deals, setDeals]       = useState<Deal[]>(INITIAL_DEALS);
  const [dealMoved, setDealMoved] = useState(false);

  // PDV
  const [saleDone, setSaleDone]         = useState(false);
  const [extraRevenue, setExtraRevenue] = useState(0);

  // IA
  const [iaMessages, setIaMessages] = useState<ChatMsg[]>(IA_INITIAL);
  const [iaAsked, setIaAsked]       = useState(false);

  const step = TOUR[stepIdx];

  const actionDone =
    (step.actionType === 'crm-move' && dealMoved)  ||
    (step.actionType === 'pdv-sale' && saleDone)   ||
    (step.actionType === 'ia-ask'   && iaAsked)    ||
    step.actionType === 'advance';

  // Fullscreen ESC handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Advance to next step
  const goNext = () => {
    const next = stepIdx + 1;
    if (next < TOUR.length) {
      setStepIdx(next);
      setActiveModule(TOUR[next].module);
    }
  };

  // Tour guide action dispatcher
  const handleAction = () => {
    const t = step.actionType;

    if (t === 'cta') {
      window.open('https://wa.me/5511999999999?text=Quero+agendar+uma+demonstracao+do+Solution+Math+OS', '_blank');
      return;
    }

    if (t === 'advance') {
      goNext();
      return;
    }

    if (t === 'crm-move' && !dealMoved) {
      // Move "Supermercado Progresso" from Novo Lead → Contato Feito
      setDeals(prev =>
        prev.map(d => d.id === 1 ? { ...d, stage: 'Contato Feito' } : d)
      );
      setDealMoved(true);
      setTimeout(goNext, 1300);
      return;
    }

    if (t === 'pdv-sale' && !saleDone) {
      // Register default cart (2x Combo Mercado Smart = R$ 360)
      setSaleDone(true);
      setExtraRevenue(prev => prev + 360);
      setTimeout(goNext, 1400);
      return;
    }

    if (t === 'ia-ask' && !iaAsked) {
      setIaMessages(prev => [...prev, { role: 'user', text: IA_QUESTION }]);
      setTimeout(() => {
        setIaMessages(prev => [...prev, { role: 'ai', text: IA_ANSWER }]);
        setIaAsked(true);
        setTimeout(goNext, 2000);
      }, 700);
      return;
    }
  };

  // PDV internal sale (from "Finalizar Venda" button inside the PDV panel)
  const handlePdvSale = (total: number) => {
    if (saleDone) return;
    setSaleDone(true);
    setExtraRevenue(prev => prev + total);
    setTimeout(goNext, 1400);
  };

  // Sidebar click — only unlocked modules respond
  const handleSidebarClick = (mod: Module | null) => {
    if (!mod || !started) return;
    setActiveModule(mod);
  };

  // Layout classes
  const isFS = isFullscreen;

  return (
    <div className={isFS ? 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6' : 'relative w-full'}>
      <div
        className={`bg-white border border-gray-200 overflow-hidden flex flex-col rounded-2xl shadow-2xl transition-all ${
          isFS ? 'w-full max-w-6xl h-[92vh]' : 'w-full h-[460px]'
        }`}
      >
        {/* ── Browser Chrome Bar ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 h-9 bg-white border-b border-gray-200 flex-shrink-0">
          {/* Traffic lights */}
          <div className="flex gap-1.5 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          {/* URL bar */}
          <div className="flex-1 bg-gray-100 rounded px-3 py-0.5 text-xs text-gray-400 font-mono truncate">
            solutionmath.com.br/app
          </div>
          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(f => !f)}
            title={isFS ? 'Sair da tela cheia (ESC)' : 'Expandir para tela cheia'}
            className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded"
          >
            {isFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        {/* ── App Shell ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Sidebar — dark, matching SO V3 */}
          <aside className="w-44 flex-shrink-0 bg-[#0f1117] flex flex-col overflow-hidden">
            {/* Logo */}
            <div className="px-3 pt-3 pb-2.5 border-b border-white/5 flex-shrink-0">
              <p className="text-white font-bold text-xs tracking-tight">Solution Math</p>
              <span className="text-xs text-teal-400 font-medium">OS 3.0 Enterprise</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-2 space-y-3">
              {NAV_SECTIONS.map(section => (
                <div key={section.label}>
                  <p className="text-xs text-gray-600 font-semibold px-3 mb-1 tracking-widest">
                    {section.label}
                  </p>
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
                          isActive
                            ? 'bg-teal-500/20 text-teal-400'
                            : isUnlocked
                            ? 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                            : 'text-gray-600 cursor-default'
                        }`}
                      >
                        <Icon size={12} className="flex-shrink-0" />
                        <span className="text-xs truncate">{item.label}</span>
                        {!isUnlocked && (
                          <Lock size={8} className="ml-auto flex-shrink-0 text-gray-700" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* IA footer item */}
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

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* App top bar (inside OS) */}
            <div className="flex items-center gap-2 px-3 h-9 bg-white border-b border-gray-200 flex-shrink-0">
              <div className="flex-1 flex items-center gap-1.5 bg-gray-100 rounded px-2 py-1 min-w-0">
                <Search size={10} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-400 truncate">
                  Buscar módulo, produto, loja ou deal...
                </span>
              </div>
              <button className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded flex-shrink-0 hover:bg-gray-50">
                Escuro
              </button>
              <Bell size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 font-medium px-1.5 py-0.5 bg-gray-100 rounded flex-shrink-0">
                OS 1
              </span>
              <button className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">Sair</button>
            </div>

            {/* Module view — padding-bottom reserves space for TourGuide bar */}
            <div
              className="flex-1 overflow-hidden bg-gray-50"
              style={{ paddingBottom: started ? '80px' : '0' }}
            >
              {activeModule === 'crm' && (
                <CRMView deals={deals} highlight={started && step.highlightKanban} />
              )}
              {activeModule === 'financeiro' && (
                <FinanceView extraRevenue={extraRevenue} />
              )}
              {activeModule === 'pdv' && (
                <PDVView saleDone={saleDone} onSale={handlePdvSale} />
              )}
              {activeModule === 'ia' && (
                <IAView messages={iaMessages} onAsk={handleAction} asked={iaAsked} />
              )}
            </div>
          </div>

          {/* Welcome overlay */}
          {!started && <WelcomeScreen onStart={() => setStarted(true)} />}

          {/* Tour guide bar */}
          {started && (
            <TourGuide
              step={step}
              stepIdx={stepIdx}
              total={TOUR.length}
              actionDone={actionDone}
              onAction={handleAction}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveSystemDemo;
