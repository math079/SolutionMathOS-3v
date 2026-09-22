import React, { useState, useEffect } from 'react';
import {
  TrendingUp, ShoppingBag, Target, Sparkles, CheckCircle2,
  Plus, ArrowRight, DollarSign, ChevronRight, HelpCircle,
  CreditCard, Search, Bell, ShieldCheck, Zap, MessageSquare,
  Send, User, Maximize2, Minimize2, Trophy, Award, Check
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, Tooltip
} from 'recharts';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
}

interface Deal {
  id: number;
  company: string;
  value: number;
  stage: 'Prospecção' | 'Proposta' | 'Negociação' | 'Ganho';
}

interface ChatMessage {
  id: number;
  sender: 'client' | 'agent';
  text: string;
  time: string;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Combo Mercado Smart', price: 180, stock: 24, category: 'Alimentos' },
  { id: 2, name: 'Kit Pet Premium', price: 95, stock: 18, category: 'Pet' },
  { id: 3, name: 'Caixa Distribuidora', price: 340, stock: 12, category: 'Bebidas' },
];

const INITIAL_DEALS: Deal[] = [
  { id: 1, company: 'Supermercado Progresso', value: 36000, stage: 'Proposta' },
  { id: 2, company: 'Pet Shop Cão & Gato', value: 18500, stage: 'Negociação' },
  { id: 3, company: 'Distribuidora São José', value: 48000, stage: 'Prospecção' },
];

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 1,
    sender: 'client',
    text: 'Olá! Sou o Marcos do Supermercado Progresso. Gostei muito da apresentação do Solution Math OS. Vocês conseguem integrar nosso PDV e emissão de notas?',
    time: '14:20'
  },
  {
    id: 2,
    sender: 'agent',
    text: 'Olá Marcos! Sim, a integração com PDV, estoque e financeiro é nativa e a implantação é feita em até 48 horas.',
    time: '14:22'
  },
  {
    id: 3,
    sender: 'client',
    text: 'Perfeito! Se enviar a proposta formal com desconto para pagamento anual, fechamos hoje mesmo.',
    time: '14:25'
  }
];

export const InteractiveSystemDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'finance' | 'pdv' | 'crm' | 'chat' | 'lyra'>('dashboard');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Gamificação: Níveis e XP do CEO
  const [xp, setXp] = useState<number>(0);
  const [completedMissions, setCompletedMissions] = useState<{ pvd: boolean; chat: boolean; deal: boolean }>({
    pvd: false,
    chat: false,
    deal: false
  });
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Estado interativo do Dashboard e Financeiro
  const [simulatedSalesTotal, setSimulatedSalesTotal] = useState<number>(203004);
  const [simulatedSalesCount, setSimulatedSalesCount] = useState<number>(18);
  const [recentSales, setRecentSales] = useState<Array<{ name: string; value: number; time: string; type: 'income' | 'expense' }>>([
    { name: 'Venda Caixa PDV #1042', value: 230, time: 'Agora', type: 'income' },
    { name: 'Licença Anual Enterprise', value: 15000, time: 'Há 5 min', type: 'income' },
    { name: 'Folha Pagamento RH (Equipe)', value: 38000, time: 'Programado', type: 'expense' },
  ]);

  // Estado do PDV
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<Array<{ product: Product; qty: number }>>([]);
  const [saleNotification, setSaleNotification] = useState<string | null>(null);

  // Estado do Pipeline CRM
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);

  // Estado do Chat CRM (WhatsApp Integrado)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [isClientTyping, setIsClientTyping] = useState<boolean>(false);

  // Estado da Lyra IA
  const [aiChat, setAiChat] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Olá! Sou a Lyra 3.0. Como posso otimizar os lucros e operações da sua empresa hoje?'
    }
  ]);

  // Fechar fullscreen com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const chartData = [
    { month: 'Jun', val: 42000 },
    { month: 'Jul', val: 68000 },
    { month: 'Ago', val: 94000 },
    { month: 'Set', val: simulatedSalesTotal },
  ];

  // Ação: Adicionar ao Carrinho no PDV
  const handleAddToCart = (p: Product) => {
    setCart(prev => {
      const exists = prev.find(item => item.product.id === p.id);
      if (exists) {
        return prev.map(item => item.product.id === p.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product: p, qty: 1 }];
    });
  };

  // Ação: Finalizar Venda no PDV (Missão 1)
  const handleCheckoutSale = () => {
    const totalCart = cart.reduce((s, i) => s + (i.product.price * i.qty), 0) || 180;
    const finalAmount = totalCart > 0 ? totalCart : 180;

    // Atualiza faturamento e feed
    setSimulatedSalesTotal(prev => prev + finalAmount);
    setSimulatedSalesCount(prev => prev + 1);
    setRecentSales(prev => [
      { name: `Venda Caixa PDV (${cart[0]?.product.name || 'Combo Smart'})`, value: finalAmount, time: 'Agora', type: 'income' },
      ...prev.slice(0, 2)
    ]);
    setCart([]);

    // Notificação e XP de Gamificação
    setSaleNotification(`✓ Venda de R$ ${finalAmount.toLocaleString('pt-BR')} registrada no Caixa e sincronizada com o Financeiro!`);
    setTimeout(() => setSaleNotification(null), 3500);

    if (!completedMissions.pvd) {
      setCompletedMissions(prev => ({ ...prev, pvd: true }));
      setXp(prev => {
        const nextXp = prev + 100;
        if (nextXp >= 300) setShowCelebration(true);
        return nextXp;
      });
    }
  };

  // Ação: Enviar Proposta no Chat do CRM (Missão 2)
  const handleSendProposalInChat = () => {
    const newMsg: ChatMessage = {
      id: Date.now(),
      sender: 'agent',
      text: '📄 Marcos, segue nossa proposta formal do Solution Math OS Enterprise (R$ 36.000/ano com implantação em 48h inclusa). Chave PIX gerada: pix@solutionmath.com.br',
      time: 'Agora'
    };
    setChatMessages(prev => [...prev, newMsg]);
    setIsClientTyping(true);

    // Simula resposta do cliente no WhatsApp
    setTimeout(() => {
      setIsClientTyping(false);
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'client',
          text: '✓ Pagamento do PIX realizado com sucesso! Pode iniciar a implantação da nossa equipe.',
          time: 'Agora'
        }
      ]);

      // Atualiza automaticamente o Deal para Ganho
      setDeals(prev => prev.map(d => d.id === 1 ? { ...d, stage: 'Ganho' } : d));
      setSimulatedSalesTotal(prev => prev + 36000);
      setSaleNotification('🏆 Negócio com Marcos Oliveira Ganho no CRM! (+R$ 36.000 somados)');
      setTimeout(() => setSaleNotification(null), 4000);

      if (!completedMissions.chat) {
        setCompletedMissions(prev => ({ ...prev, chat: true }));
        setXp(prev => {
          const nextXp = prev + 100;
          if (nextXp >= 300) setShowCelebration(true);
          return nextXp;
        });
      }
    }, 1800);
  };

  // Ação: Avançar estágio do Deal no Funil (Missão 3)
  const handleAdvanceDeal = (id: number) => {
    const stages: Deal['stage'][] = ['Prospecção', 'Proposta', 'Negociação', 'Ganho'];
    setDeals(prev => prev.map(d => {
      if (d.id === id) {
        const currentIdx = stages.indexOf(d.stage);
        const nextStage = stages[Math.min(stages.length - 1, currentIdx + 1)];
        return { ...d, stage: nextStage };
      }
      return d;
    }));

    if (!completedMissions.deal) {
      setCompletedMissions(prev => ({ ...prev, deal: true }));
      setXp(prev => {
        const nextXp = prev + 100;
        if (nextXp >= 300) setShowCelebration(true);
        return nextXp;
      });
    }
  };

  // Ação: Perguntar para a Lyra IA
  const handleAskAI = (question: string, answer: string) => {
    setAiChat(prev => [
      ...prev,
      { role: 'user', text: question },
      { role: 'assistant', text: answer }
    ]);
  };

  // Render do Miolo do Sistema SO V3
  const renderSystemContent = () => (
    <div className={`flex flex-col bg-white text-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-xl transition-all ${
      isFullscreen ? 'w-full h-full max-w-6xl' : 'w-full'
    }`}>
      
      {/* ── Barra Superior do Navegador / Sistema ── */}
      <div className="bg-slate-100/95 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          
          <div className="ml-2 bg-white border border-slate-200 rounded-lg px-3 py-0.5 flex items-center gap-2 text-xs text-slate-600 font-mono">
            <span className="text-blue-600 font-bold">https://</span>
            <span>app.solutionmath.com.br/demo</span>
          </div>
        </div>

        {/* Botão de Tela Cheia & Status */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hidden sm:inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            SO V3.0 Enterprise
          </span>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 text-xs font-bold transition-all shadow-sm active:scale-95"
            title={isFullscreen ? 'Reduzir para tamanho normal (ESC)' : 'Expandir para Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}</span>
          </button>
        </div>
      </div>

      {/* ── Top Bar Oficial SO V3 (Modo Claro) ── */}
      <div className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Solution Math" className="w-7 h-7 rounded-full object-cover border border-blue-500/30 shadow-sm" />
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-900 text-xs tracking-tight">Solution Math</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
              OS 3.0
            </span>
          </div>
        </div>

        {/* Barra de Busca Simulada */}
        <div className="hidden sm:flex items-center max-w-xs w-full mx-4">
          <div className="relative w-full">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              readOnly
              placeholder="Buscar cliente, venda ou deal..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-600 placeholder-slate-400 focus:outline-none cursor-default"
            />
          </div>
        </div>

        {/* Nível do CEO (Gamificação) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-[11px] font-bold">
            <Trophy size={13} className="text-amber-500" />
            <span>
              {xp === 0 && 'CEO Aprendiz'}
              {xp === 100 && 'CEO Operacional'}
              {xp === 200 && 'CEO Negociador'}
              {xp >= 300 && 'CEO Master 🏆'}
            </span>
            <span className="text-amber-600 text-[10px]">({xp}/300 XP)</span>
          </div>
        </div>
      </div>

      {/* ── Banner de Missão Gamificada (Como um Jogo) ── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2 text-white flex items-center justify-between text-xs shadow-inner">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase tracking-wide bg-white/20 px-2 py-0.5 rounded text-[10px]">
              🎮 MISSÃO ATUAL:
            </span>
            <span className="font-medium text-blue-50">
              {!completedMissions.pvd && 'Missão 1: Abra "Lojas & PDV" e clique em "Registrar Venda no Caixa" (+100 XP)'}
              {completedMissions.pvd && !completedMissions.chat && 'Missão 2: Abra "Chat Leads (CRM)" e envie a proposta para fechar com Marcos (+100 XP)'}
              {completedMissions.pvd && completedMissions.chat && !completedMissions.deal && 'Missão 3: Abra "Pipeline Deals" e clique em "Avançar Etapa" (+100 XP)'}
              {xp >= 300 && '🏆 Parabéns! Você completou todas as missões e dominou a gestão integrada!'}
            </span>
          </div>
        </div>

        {/* Barra de XP Animada */}
        <div className="flex items-center gap-2">
          <div className="w-28 bg-black/20 rounded-full h-2 overflow-hidden border border-white/20">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${(xp / 300) * 100}%` }}
            />
          </div>
          <span className="font-bold text-[10px] text-emerald-300">{Math.round((xp / 300) * 100)}%</span>
        </div>
      </div>

      {/* Notificação de Sucesso */}
      {saleNotification && (
        <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{saleNotification}</span>
          </div>
          <button onClick={() => setSaleNotification(null)} className="opacity-80 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── Corpo Dividido: Mini-Sidebar SO V3 + Conteúdo ── */}
      <div className={`flex bg-slate-50 ${isFullscreen ? 'h-[calc(90vh-145px)]' : 'min-h-[410px] max-h-[460px]'}`}>
        
        {/* Mini-Sidebar Lateral Clássica do SO V3 */}
        <aside className="w-44 sm:w-48 bg-white border-r border-slate-200 p-2.5 flex flex-col justify-between shrink-0 select-none">
          <div className="space-y-3">
            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                PRINCIPAL
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp size={14} className="shrink-0 text-blue-600" />
                  <span>Visão Geral</span>
                </button>

                <button
                  onClick={() => setActiveTab('finance')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'finance'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard size={14} className="shrink-0 text-emerald-600" />
                  <span>Financeiro</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                COMERCIAL & CRM
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('pdv')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                    activeTab === 'pdv'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={14} className="shrink-0 text-amber-600" />
                    <span>Lojas & PDV</span>
                  </div>
                  {!completedMissions.pvd && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="shrink-0 text-emerald-600" />
                    <span>Chat Clientes</span>
                  </div>
                  {completedMissions.pvd && !completedMissions.chat && (
                    <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[9px] font-bold animate-bounce">
                      1
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('crm')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'crm'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Target size={14} className="shrink-0 text-purple-600" />
                    <span>Pipeline Deals</span>
                  </div>
                  {completedMissions.chat && !completedMissions.deal && (
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                INTELIGÊNCIA
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('lyra')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'lyra'
                      ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles size={14} className="shrink-0 text-purple-600" />
                  <span>IA Lyra 3.0</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[10px] text-slate-600">
            <span className="font-bold text-slate-800 block mb-0.5">🎮 Progresso do Jogo</span>
            <span className="text-slate-500">{completedMissions.pvd ? '✓ PDV concluído' : '○ Fazer 1 venda'}</span>
            <span className="block text-slate-500">{completedMissions.chat ? '✓ Chat atendido' : '○ Atender no CRM'}</span>
            <span className="block text-slate-500">{completedMissions.deal ? '✓ Negócio ganho' : '○ Fechar proposta'}</span>
          </div>
        </aside>

        {/* ── Área Principal de Conteúdo ── */}
        <main className="flex-1 p-3 sm:p-5 overflow-y-auto">

          {/* MÓDULO 1: VISÃO GERAL (DIMENSÕES CALIBRADAS) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <TrendingUp size={16} className="text-blue-600" />
                    Visão Geral da Empresa — Setembro/2026
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Operação Integrada • Faturamento, Custos e Metas em Tempo Real</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Operação Online
                </span>
              </div>

              {/* Grid de KPIs com Dimensões Espaçosas (2 cols no normal / 4 cols em Fullscreen) */}
              <div className={`grid gap-3 ${isFullscreen ? 'grid-cols-4' : 'grid-cols-2'}`}>
                {/* Card 1: Faturamento */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faturamento Setembro</span>
                    <DollarSign size={15} className="text-emerald-500" />
                  </div>
                  <div className="text-base sm:text-xl font-black text-emerald-600 tracking-tight my-0.5">
                    R$ {simulatedSalesTotal.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span>+822% vs mês anterior</span>
                  </div>
                </div>

                {/* Card 2: Custos */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custos Operacionais</span>
                    <CreditCard size={15} className="text-rose-500" />
                  </div>
                  <div className="text-base sm:text-xl font-black text-rose-600 tracking-tight my-0.5">
                    R$ 69.800
                  </div>
                  <div className="text-[10px] text-slate-500">
                    <span>Folha RH R$ 38k + Despesas</span>
                  </div>
                </div>

                {/* Card 3: Lucro */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lucro Líquido Real</span>
                    <TrendingUp size={15} className="text-blue-500" />
                  </div>
                  <div className="text-base sm:text-xl font-black text-blue-600 tracking-tight my-0.5">
                    R$ {(simulatedSalesTotal - 69800).toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold">
                    <span>Margem Líquida: 65.6% ✓</span>
                  </div>
                </div>

                {/* Card 4: Meta */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meta Mensal</span>
                    <Target size={15} className="text-amber-500" />
                  </div>
                  <div className="text-base sm:text-xl font-black text-amber-600 tracking-tight my-0.5">
                    {((simulatedSalesTotal / 100000) * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-amber-700 font-semibold">
                    <span>Meta: R$ 100.000 (Atingida!)</span>
                  </div>
                </div>
              </div>

              {/* Gráfico + Lançamentos Recentes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-800 block mb-2">Evolução do Faturamento 2026</span>
                  <div className={`${isFullscreen ? 'h-44' : 'h-28'} w-full`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip
                          content={({ payload }) => {
                            if (!payload?.length) return null;
                            return (
                              <div className="bg-white border border-slate-200 p-2 rounded-lg text-xs shadow-md font-bold text-slate-900">
                                R$ {Number(payload[0].value).toLocaleString('pt-BR')}
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="val" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Últimos Lançamentos</span>
                  <div className={`space-y-1.5 ${isFullscreen ? 'max-h-44' : 'max-h-28'} overflow-y-auto pr-1`}>
                    {recentSales.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                          <span className="font-semibold text-slate-800 block text-[11px]">{s.name}</span>
                          <span className="text-[9px] text-slate-400">{s.time}</span>
                        </div>
                        <span className={`font-bold text-xs ${s.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {s.type === 'income' ? '+' : '-'}R$ {s.value.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MÓDULO 2: CHAT & CRM COM O CLIENTE (NOVO RECURSO PEDIDO) */}
          {activeTab === 'chat' && (
            <div className="space-y-3 animate-in fade-in duration-150 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                      MO
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        Marcos Oliveira • Supermercado Progresso
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      </h3>
                      <p className="text-[10px] text-slate-500">Lead Qualificado no CRM • WhatsApp Conectado</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Proposta R$ 36.000
                  </span>
                </div>

                {/* Mensagens do Chat */}
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`p-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed shadow-sm ${
                          msg.sender === 'agent'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span className={`text-[9px] block text-right mt-1 ${
                          msg.sender === 'agent' ? 'text-blue-200' : 'text-slate-400'
                        }`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isClientTyping && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 italic">
                      <span>Marcos está digitando...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações de Conversão Rápida no Chat */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ações Rápidas do CRM (Clique para interagir):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSendProposalInChat}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    <Send size={12} /> Enviar Proposta & Cobrança PIX (R$ 36k)
                  </button>

                  <button
                    onClick={() => {
                      setChatMessages(prev => [
                        ...prev,
                        { id: Date.now(), sender: 'agent', text: 'Marcos, nosso consultor já reservou seu horário de treinamento para amanhã às 10h.', time: 'Agora' }
                      ]);
                    }}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-700 text-xs font-semibold shadow-sm transition-all"
                  >
                    📅 Agendar Treinamento
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MÓDULO 3: LOJAS & PDV */}
          {activeTab === 'pdv' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <ShoppingBag size={15} className="text-amber-600" />
                    Ponto de Venda (PDV) & Frente de Caixa
                  </h3>
                  <p className="text-[11px] text-slate-500">Bipe produtos para emitir venda e atualizar o financeiro</p>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                  Frente Ativa
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 block">Itens do Estoque (Clique para bipar)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {products.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleAddToCart(p)}
                        className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group"
                      >
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">{p.category}</span>
                        <p className="font-bold text-xs text-slate-800 mt-1">{p.name}</p>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                          <span className="text-xs font-black text-emerald-600">R$ {p.price}</span>
                          <span className="p-1 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Plus size={12} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block mb-1.5">Cupom Fiscal do Caixa</span>
                    {cart.length === 0 ? (
                      <div className="py-5 text-center text-[10px] text-slate-400">
                        Bipe os produtos ao lado para incluir no cupom.
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {cart.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] p-1 bg-slate-50 rounded">
                            <span className="truncate max-w-[90px]">{item.product.name} ({item.qty}x)</span>
                            <span className="font-bold text-emerald-600">R$ {item.product.price * item.qty}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 mt-2 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Total:</span>
                      <span className="font-black text-emerald-600 text-sm">
                        R$ {(cart.reduce((s, i) => s + (i.product.price * i.qty), 0) || 180).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <button
                      onClick={handleCheckoutSale}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all active:scale-95 flex items-center justify-center gap-1"
                    >
                      <Zap size={12} /> Registrar Venda no Caixa (+100 XP)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MÓDULO 4: PIPELINE DEALS */}
          {activeTab === 'crm' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Target size={15} className="text-purple-600" />
                    Pipeline Deals (Funil de Negócios)
                  </h3>
                  <p className="text-[11px] text-slate-500">Avance oportunidades pelo funil de vendas</p>
                </div>
                <span className="text-xs font-bold text-purple-700">
                  R$ {deals.reduce((s, d) => s + d.value, 0).toLocaleString('pt-BR')} em Negociação
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {deals.map(deal => (
                  <div key={deal.id} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700">{deal.company}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        deal.stage === 'Ganho'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {deal.stage}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold">VALOR DO CONTRATO</span>
                      <span className="text-sm font-black text-slate-900">R$ {deal.value.toLocaleString('pt-BR')}</span>
                    </div>

                    <button
                      onClick={() => handleAdvanceDeal(deal.id)}
                      disabled={deal.stage === 'Ganho'}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        deal.stage === 'Ganho'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 active:scale-95'
                      }`}
                    >
                      {deal.stage === 'Ganho' ? <>✓ Negócio Ganho (+100 XP)</> : <>Avançar Etapa <ChevronRight size={12} /></>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MÓDULO 5: FINANCEIRO */}
          {activeTab === 'finance' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard size={15} className="text-emerald-600" />
                    Gestão Financeira & DRE Integrada
                  </h3>
                  <p className="text-[11px] text-slate-500">Fluxo de Caixa, Despesas Operacionais e Folha Salarial</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                  Setembro 2026
                </span>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Demonstrativo Sintético</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 font-bold block">Receitas Brutas</span>
                    <span className="font-black text-sm text-emerald-800">R$ {simulatedSalesTotal.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="p-2 bg-rose-50/60 rounded-xl border border-rose-100">
                    <span className="text-[10px] text-rose-700 font-bold block">Custos & Gastos</span>
                    <span className="font-black text-sm text-rose-800">R$ 69.800</span>
                  </div>
                  <div className="p-2 bg-blue-50/60 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-700 font-bold block">Lucro Líquido</span>
                    <span className="font-black text-sm text-blue-800">R$ {(simulatedSalesTotal - 69800).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="font-bold block">Folha RH Conectada com o Financeiro</span>
                  <span className="text-[11px] text-emerald-700">R$ 38.000/mês com salários de CEO, Tech Lead, Comercial e Design.</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-200/60 text-emerald-800 rounded font-bold text-[10px]">
                  ✓ Sincronizado
                </span>
              </div>
            </div>
          )}

          {/* MÓDULO 6: IA LYRA 3.0 */}
          {activeTab === 'lyra' && (
            <div className="space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Sparkles size={13} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Lyra IA 3.0 — Assistente Executiva</h3>
                    <p className="text-[10px] text-emerald-600 font-medium">● Online • Análise em tempo real</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  IA Oficial
                </span>
              </div>

              <div className="space-y-1.5 h-36 overflow-y-auto pr-1">
                {aiChat.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 block mb-1">Perguntas Rápidas:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleAskAI(
                      'Qual produto tem a maior margem de lucro?',
                      'O "Kit Pet Premium" apresenta 68% de margem bruta hoje, sendo o produto mais lucrativo do catálogo.'
                    )}
                    className="text-[11px] px-2 py-1 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 transition-all text-left shadow-sm"
                  >
                    📈 Produto com maior margem?
                  </button>

                  <button
                    onClick={() => handleAskAI(
                      'Como fechar Setembro com mais de R$ 250.000?',
                      'Faltam R$ 46.996 para os R$ 250k. Convertendo a proposta do Supermercado Progresso no CRM, faltarão apenas poucas vendas no PDV!'
                    )}
                    className="text-[11px] px-2 py-1 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 transition-all text-left shadow-sm"
                  >
                    🎯 Meta de R$ 250.000
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Modal Comemorativo de Vitória (Jogo Completo) ── */}
      {showCelebration && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-3 flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
              <Trophy size={20} />
            </div>
            <div>
              <p className="font-extrabold text-amber-950 text-xs">
                PARABÉNS! VOCÊ DOMINOU O SOLUTION MATH OS 3.0 (300/300 XP)
              </p>
              <p className="text-[11px] text-amber-800">
                Você integrou vendas, CRM e financeiro. Pronto para ativar a operação na sua empresa real?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#contact"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition-all hover:scale-105"
            >
              Resgatar Implantação Grátis (48h)
            </a>
            <button onClick={() => setShowCelebration(false)} className="text-amber-800 text-xs font-bold px-2 py-1">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Rodapé do Sandbox com CTA ── */}
      {!showCelebration && (
        <div className="bg-white border-t border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Versão Demonstrativa do <strong>Solution Math OS 3.0</strong>. Experimente os recursos.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            >
              {isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia ⛶'}
            </button>
            <a
              href="#contact"
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              Ativar Meu Sistema Real (48h)
            </a>
          </div>
        </div>
      )}

    </div>
  );

  return (
    <>
      {/* Visualização Normal Embutida na Landing Page */}
      <div className="relative w-full">
        {renderSystemContent()}
      </div>

      {/* Visualização Fullscreen Imersiva (Estilo YouTube) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="relative w-full h-full max-w-6xl max-h-[92vh] flex items-center justify-center">
            {renderSystemContent()}
          </div>
        </div>
      )}
    </>
  );
};
