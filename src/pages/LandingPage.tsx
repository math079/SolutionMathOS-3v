import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu, X, ArrowRight, CheckCircle2, Star, Shield,
  BarChart3, Users, Package, CreditCard, Calendar, Kanban,
  TrendingUp, Clock, ChevronDown, ChevronUp,
  Lock, Award, Zap, Play, Building2, Globe,
  PhoneCall, Mail, MapPin, Check, Minus
} from 'lucide-react';
import { InteractiveSystemDemo } from '../components/InteractiveSystemDemo';
import { SalesFunnelQuiz } from '../components/SalesFunnelQuiz';

/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */

const FEATURES = [
  { icon: <Kanban className="w-6 h-6" />, title: 'CRM & Pipeline', desc: 'Acompanhe negociações, leads e clientes em um funil visual. Nunca perca uma oportunidade.' },
  { icon: <CreditCard className="w-6 h-6" />, title: 'Financeiro Completo', desc: 'Controle entradas, saídas, fluxo de caixa e emita relatórios com um clique.' },
  { icon: <Package className="w-6 h-6" />, title: 'Estoque & PDV', desc: 'Controle de produtos, movimentações, ponto de venda e alertas de estoque baixo.' },
  { icon: <Users className="w-6 h-6" />, title: 'Gestão de Clientes', desc: 'Cadastro completo, histórico de compras, cobranças e relacionamento centralizado.' },
  { icon: <Calendar className="w-6 h-6" />, title: 'Agenda & Tarefas', desc: 'Calendário completo para equipe, compromissos, follow-ups e atividades do dia a dia.' },
  { icon: <BarChart3 className="w-6 h-6" />, title: 'Dashboard Executivo', desc: 'Visão estratégica de toda a empresa em tempo real. Tome decisões com dados, não com intuição.' },
  { icon: <Building2 className="w-6 h-6" />, title: 'Gestão de Equipe', desc: 'Controle de colaboradores, hierarquias, departamentos e produtividade.' },
  { icon: <Globe className="w-6 h-6" />, title: 'Integrações (Em breve)', desc: 'WhatsApp, NF-e, PIX, Mercado Livre e muito mais. Ecossistema conectado ao seu negócio.' },
];

const STEPS = [
  { num: '01', title: 'Implantação em 48h', desc: 'Nosso time configura tudo. Importamos seus dados, personalizamos o sistema e você já começa a usar em até 2 dias úteis.', icon: <Zap className="w-5 h-5" /> },
  { num: '02', title: 'Treinamento ao Vivo', desc: 'Sessão online com nosso especialista para você e sua equipe aprenderem o sistema em poucas horas.', icon: <Play className="w-5 h-5" /> },
  { num: '03', title: 'Gerencie com Controle', desc: 'Financeiro, estoque, clientes e equipe em um lugar. Dados reais para decisões melhores.', icon: <TrendingUp className="w-5 h-5" /> },
];

const PLANS = [
  {
    name: 'Start',
    badge: null,
    monthlyPrice: 197,
    annualMonthlyPrice: 148,
    annualTotal: '1.776',
    implantacao: '697',
    implantacaoAnual: '397',
    highlight: false,
    description: 'Para MEIs e pequenos comércios iniciando a organização.',
    features: [
      'CRM + Pipeline de vendas',
      'Controle Financeiro completo',
      'Gestão de Clientes',
      'Estoque & Movimentações',
      'Dashboard Executivo',
      'Calendário & Agenda',
      '3 usuários inclusos',
      '5 GB de armazenamento',
      'Suporte via chat (5 dias úteis)',
    ],
    missing: ['Automações WhatsApp', 'Integrações API', 'PDV Avançado'],
  },
  {
    name: 'Growth',
    badge: 'MAIS POPULAR',
    monthlyPrice: 347,
    annualMonthlyPrice: 260,
    annualTotal: '3.120',
    implantacao: '997',
    implantacaoAnual: 'GRÁTIS',
    highlight: true,
    description: 'Para lojas que querem crescer com controle total.',
    features: [
      'Tudo do plano Start',
      'Módulo Lojas & PDV completo',
      'Automações (WhatsApp, e-mail)',
      'Integrações via API',
      'Até 10 usuários',
      '20 GB de armazenamento',
      'Relatórios avançados + PDF',
      'Suporte prioritário (WhatsApp)',
      'Onboarding VIP ao vivo',
    ],
    missing: [],
  },
  {
    name: 'Enterprise',
    badge: null,
    monthlyPrice: null,
    annualMonthlyPrice: null,
    annualTotal: null,
    implantacao: null,
    implantacaoAnual: null,
    highlight: false,
    description: 'Para redes, franquias e múltiplas unidades.',
    features: [
      'Tudo do plano Growth',
      'Desenvolvimento personalizado',
      'Múltiplas unidades/filiais',
      'SLA garantido (resposta < 2h)',
      'Gerente de conta dedicado',
      'Treinamento presencial',
      'Consultoria mensal incluída',
      'Usuários ilimitados',
      'Armazenamento sob medida',
    ],
    missing: [],
  },
];

const TESTIMONIALS = [
  { name: 'Marcos Oliveira', role: 'Dono de Mercado — São Paulo', text: 'Antes eu controlava tudo no caderno e sempre perdia dinheiro sem saber onde. Hoje tenho estoque, financeiro e clientes organizados. Em dois dias já estava funcionando.', rating: 5, initials: 'MO', color: 'bg-blue-600' },
  { name: 'Juliana Santos', role: 'Pet Shop Vida Animal — Minas Gerais', text: 'O sistema é simples, o suporte é rápido e o time entendeu meu negócio do primeiro dia. Nunca tive um atendimento assim de uma empresa de tecnologia.', rating: 5, initials: 'JS', color: 'bg-indigo-600' },
  { name: 'Ricardo Ferreira', role: 'Distribuidora de Bebidas — Rio de Janeiro', text: 'Migrei de planilha para o Solution Math e foi transformador. Os relatórios financeiros me economizam pelo menos 4 horas por semana.', rating: 5, initials: 'RF', color: 'bg-blue-800' },
];

const FAQS = [
  { q: 'Preciso de conhecimento técnico para usar?', a: 'Não. O Solution Math OS foi projetado para ser simples. Nossa equipe faz a implantação completa, importa seus dados e treina você e sua equipe. Em poucas horas já está operando.' },
  { q: 'Qual a diferença entre Implantação e Mensalidade?', a: 'A Implantação é um serviço único de configuração: preparamos o sistema, importamos seus dados e treinamos sua equipe. A Mensalidade cobre o uso contínuo, servidor, suporte e todas as atualizações futuras.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Planos mensais podem ser cancelados a qualquer momento sem multa ou burocracia. Planos anuais têm contrato de 12 meses com condições especiais.' },
  { q: 'E se eu não gostar? Tem garantia?', a: 'Sim. 7 dias de garantia total. Se dentro desse período você não ver valor real no sistema, devolvemos 100% do valor da mensalidade. Sem perguntas e sem enrolação.' },
  { q: 'Meus dados ficam seguros?', a: 'Absolutamente. Criptografia em trânsito e em repouso, backups diários automáticos e infraestrutura profissional. Seus dados são seus — nunca compartilhamos com terceiros.' },
  { q: 'Para quais tipos de negócio funciona?', a: 'Mercados, mercearias, hortifrutis, pet shops, autopeças, papelarias, materiais de construção, distribuidoras e qualquer pequeno ou médio comércio brasileiro.' },
  { q: 'O plano anual compensa?', a: 'Com certeza. No plano anual você paga 10 meses e usa 12 — economizando até R$1.044 no Growth. O Growth anual ainda inclui implantação gratuita, que sozinha vale R$997.' },
  { q: 'Posso começar com o Start e fazer upgrade depois?', a: 'Sim, e é exatamente o que recomendamos. Comece com o Start, aprenda o sistema e quando precisar de mais recursos como automações e PDV avançado, o upgrade é simples e sem perda de dados.' },
];

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#features' },
  { label: 'Simular Plano', href: '#funil-recomendador' },
  { label: 'Como funciona', href: '#how' },
  { label: 'Planos', href: '#plans' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contato', href: '#contact' },
];

/* ═══════════════════════════════════════════
   SUB-COMPONENTS & HELPERS
═══════════════════════════════════════════ */

const scrollToId = (e: React.MouseEvent<HTMLElement>, id: string) => {
  e.preventDefault();
  if (id === '#') return;
  const element = document.querySelector(id);
  if (element) {
    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${open ? 'border-blue-200 shadow-sm' : 'border-gray-200'}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 p-6 text-left bg-white hover:bg-blue-50/50 transition-colors">
        <span className={`font-semibold text-sm leading-snug ${open ? 'text-blue-700' : 'text-gray-800'}`}>{q}</span>
        {open
          ? <ChevronUp className="w-5 h-5 text-blue-500 flex-shrink-0" />
          : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-6 bg-white text-gray-600 text-sm leading-relaxed border-t border-blue-50 pt-4">
          {a}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */

const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [scrolled, setScrolled] = useState(false);
  const [activeHeroTab, setActiveHeroTab] = useState<'dashboard' | 'pdv' | 'crm' | 'lyra'>('dashboard');

  // ROI Calculator State
  const [calcSegment, setCalcSegment] = useState('Mercado / Mercearia');
  const [calcRevenue, setCalcRevenue] = useState('30k_100k');
  const [calcUsers, setCalcUsers] = useState('4_10');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    business_type: '',
    plan_interest: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');

  const generateWhatsAppLink = (name: string, businessType: string, plan: string) => {
    const planName = plan || 'Growth';
    const segment = businessType || 'meu negócio';

    const text = `Olá, equipe Solution Math!\n\nMeu nome é *${name}* e sou responsável por um(a) *${segment}*.\n\nTenho interesse no *Plano ${planName}* do Solution Math OS.\n\nGostaria de agendar uma demonstração técnica de 30 minutos para avaliar o sistema na prática.\n\nQual o melhor horário para conversarmos?`;
    
    return `https://wa.me/5511939157368?text=${encodeURIComponent(text)}`;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.whatsapp.trim()) {
      setFormError('Por favor, preencha seu nome e número de WhatsApp.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    const waLink = generateWhatsAppLink(formData.name, formData.business_type, formData.plan_interest);
    setRedirectUrl(waLink);

    try {
      await fetch('http://localhost:3001/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          whatsapp: formData.whatsapp,
          business_type: formData.business_type,
          plan_interest: formData.plan_interest,
          utm_source: 'landing_page_form'
        })
      });
    } catch (err) {
      console.warn('Erro ao salvar lead no backend, mas procedendo com WhatsApp:', err);
    } finally {
      setFormSubmitting(false);
      setFormSubmitted(true);
      // Redireciona para o WhatsApp após 1.5s
      setTimeout(() => {
        window.open(waLink, '_blank');
      }, 1500);
    }
  };

  // FIX: Enable scroll for landing page (body has overflow:hidden from OS)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ══ NAVBAR ══ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md border-b border-gray-100' : 'bg-white/95 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-5 h-[68px] flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 flex-shrink-0 group">
            <img src="/logo.jpg" alt="Solution Math Logo" className="w-10 h-10 rounded-full object-cover border-2 border-blue-600/30 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform" />
            <div>
              <span className="font-extrabold text-gray-900 text-base leading-none">Solution Math </span>
              <span className="font-extrabold text-blue-600 text-base leading-none">OS</span>
              <span className="block text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-0.5">Sistemas Empresariais</span>
            </div>
          </a>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={(e) => scrollToId(e, l.href)} className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">
              Entrar
            </Link>
            <a
              href="#contact"
              onClick={(e) => scrollToId(e, '#contact')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-px"
            >
              Começar agora
            </a>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-5 py-4 space-y-1 shadow-lg">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={(e) => { setMenuOpen(false); scrollToId(e, l.href); }} className="block py-2.5 text-gray-700 font-medium text-sm">
                {l.label}
              </a>
            ))}
            <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2">
              <Link to="/login" className="text-center border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium">Entrar</Link>
              <a href="#contact" onClick={(e) => { setMenuOpen(false); scrollToId(e, '#contact'); }} className="text-center bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold">Começar agora</a>
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO ══ */}
      <section className="pt-[68px] min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 flex items-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 right-[-100px] w-[500px] h-[500px] bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-[-80px] w-[350px] h-[350px] bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />
        {/* Dots pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{ backgroundImage: 'radial-gradient(circle, #93c5fd 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="max-w-7xl mx-auto px-5 py-16 md:py-24 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left */}
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                ERP + CRM para o comércio brasileiro
              </div>

              <h1 className="text-[2.6rem] md:text-[3.2rem] font-extrabold text-gray-900 leading-[1.15] tracking-tight mb-6">
                Gerencie seu negócio com{' '}
                <span className="text-blue-600 relative">
                  inteligência real.
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none">
                    <path d="M2 6 Q75 2 150 5 Q225 8 298 4" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
                O Solution Math OS unifica CRM, financeiro, estoque, PDV e clientes em um único sistema. Fácil de aprender em horas, poderoso para crescer por anos.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <a
                  href="#contact"
                  onClick={(e) => scrollToId(e, '#contact')}
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-4 rounded-xl transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 text-sm"
                >
                  Agendar demonstração gratuita
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#plans"
                  onClick={(e) => scrollToId(e, '#plans')}
                  className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-blue-300 text-gray-700 font-semibold px-7 py-4 rounded-xl transition-all hover:bg-blue-50 text-sm"
                >
                  Ver planos e preços
                </a>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-5">
                {[
                  { icon: <Shield className="w-4 h-4 text-blue-500" />, text: '7 dias de garantia' },
                  { icon: <Award className="w-4 h-4 text-blue-500" />, text: 'Implantação em 48h' },
                  { icon: <Clock className="w-4 h-4 text-blue-500" />, text: 'Suporte em até 2h' },
                ].map(t => (
                  <span key={t.text} className="flex items-center gap-1.5 text-gray-500 text-sm">
                    {t.icon} {t.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — Interactive System Sandbox Demo */}
            <div className="relative hidden lg:block">
              <InteractiveSystemDemo
                onOpenFunnel={() => {
                  const el = document.getElementById('funil-recomendador');
                  if (el) {
                    const offset = 80;
                    const pos = el.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top: pos, behavior: 'smooth' });
                  }
                }}
              />

              {/* Floating trust badge bottom-left */}
              <div className="absolute -bottom-5 -left-6 bg-white rounded-2xl shadow-2xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Crescimento Médio</p>
                  <p className="text-sm font-extrabold text-gray-900">+38% no 1º mês</p>
                </div>
              </div>

              {/* Floating trust badge top-right */}
              <div className="absolute -top-5 -right-5 bg-white rounded-2xl shadow-2xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                <img src="/logo.jpg" alt="Solution Math Badge" className="w-9 h-9 rounded-full object-cover border-2 border-blue-500/30 shadow-sm" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">SLA Corporativo</p>
                  <p className="text-sm font-extrabold text-blue-700">99.8% Disponibilidade</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats ribbon */}
        <div className="absolute bottom-0 left-0 right-0 bg-blue-600">
          <div className="max-w-7xl mx-auto px-5 py-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '200+', label: 'Empresas atendidas' },
              { value: '48h', label: 'Tempo de implantação' },
              { value: '99.8%', label: 'Disponibilidade' },
              { value: '7 dias', label: 'Garantia total' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xl md:text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-blue-200 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ INTERACTIVE ROI & PLAN CALCULATOR WIDGET ══ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-5">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-blue-900/10 border-2 border-blue-100 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
              <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-extrabold px-4 py-1.5 rounded-full mb-3 border border-blue-200 uppercase tracking-wider">
                Calculadora de ROI & Plano Ideal
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                Simule a economia real para o seu comércio.
              </h2>
              <p className="text-gray-500 text-sm">
                Selecione os dados do seu negócio abaixo e veja qual o plano ideal e a estimativa de retorno mensal.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Inputs (7 cols) */}
              <div className="lg:col-span-7 space-y-6">

                {/* 1. Segment */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    1. Qual o segmento da sua empresa?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      'Mercado / Mercearia',
                      'Pet Shop',
                      'Autopeças / Mat. Const.',
                      'Distribuidora / Varejo',
                      'Prestador de Serviços',
                      'Outro comércio',
                    ].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCalcSegment(s)}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                          calcSegment === s
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        <span className="truncate">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Revenue */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    2. Faturamento estimado mensal:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'ate_30k', label: 'Até R$ 30k' },
                      { id: '30k_100k', label: 'R$ 30k a 100k' },
                      { id: '100k_300k', label: 'R$ 100k a 300k' },
                      { id: 'acima_300k', label: '+ R$ 300k' },
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setCalcRevenue(r.id)}
                        className={`py-3 px-2 rounded-xl border text-xs font-bold text-center transition-all ${
                          calcRevenue === r.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Users */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    3. Quantos colaboradores vão utilizar?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '1_3', label: '1 a 3 usuários' },
                      { id: '4_10', label: '4 a 10 usuários' },
                      { id: 'mais_10', label: '+ 10 usuários' },
                    ].map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setCalcUsers(u.id)}
                        className={`py-3 px-2 rounded-xl border text-xs font-bold text-center transition-all ${
                          calcUsers === u.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Result Card (5 cols) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-7 text-white border-2 border-slate-800 shadow-xl">
                {(() => {
                  let recommendedPlan = 'Growth';
                  let priceText = 'R$ 347/mês';
                  let hoursSaved = '28 horas/mês';
                  let moneySaved = 'R$ 1.450/mês';
                  let badgeText = 'RECOMENDADO';

                  if (calcRevenue === 'ate_30k' && calcUsers === '1_3') {
                    recommendedPlan = 'Start';
                    priceText = 'R$ 197/mês';
                    hoursSaved = '16 horas/mês';
                    moneySaved = 'R$ 680/mês';
                    badgeText = 'PLANO INICIAL';
                  } else if (calcRevenue === 'acima_300k' || calcUsers === 'mais_10') {
                    recommendedPlan = 'Enterprise';
                    priceText = 'Sob Consulta';
                    hoursSaved = '45+ horas/mês';
                    moneySaved = 'R$ 3.900/mês';
                    badgeText = 'PLANO CORPORATIVO';
                  }

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-blue-500 text-white rounded-full">
                          {badgeText}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Recomendação Automática</span>
                      </div>

                      <h4 className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-1">Plano Ideal</h4>
                      <div className="text-3xl font-black text-white mb-1">
                        Plano {recommendedPlan}
                      </div>
                      <div className="text-sm font-semibold text-blue-200 mb-6">
                        {priceText}
                      </div>

                      <div className="space-y-3 mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Tempo Salvo em Gestão:</span>
                          <span className="font-bold text-emerald-400">{hoursSaved}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Prevenção de Perdas:</span>
                          <span className="font-bold text-emerald-400">{moneySaved}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Prazo de Implantação:</span>
                          <span className="font-bold text-blue-300">Até 48 horas</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            business_type: calcSegment,
                            plan_interest: recommendedPlan
                          }));
                          scrollToId(e, '#contact');
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-600/30 text-xs flex items-center justify-center gap-2"
                      >
                        Solicitar Demonstração para {calcSegment.split(' ')[0]}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ══ INTERACTIVE SALES FUNNEL & PRODUCT RECOMMENDATION ══ */}
      <section className="py-16 bg-gradient-to-b from-blue-50/50 via-white to-gray-50 border-b border-gray-200" id="funil-recomendador">
        <div className="max-w-7xl mx-auto px-5">
          <SalesFunnelQuiz />
        </div>
      </section>

      {/* ══ WHAT WE DO (Problems) ══ */}
      <section className="py-24 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-blue-200">
              PARA QUEM É
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              O sistema que todo lojista precisava.
            </h2>
            <p className="text-gray-500 text-lg">
              Se você controla seu negócio em caderno ou planilha, está perdendo dinheiro sem perceber. O Solution Math OS muda isso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="group p-6 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/8 transition-all duration-200">
                <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-600 rounded-xl flex items-center justify-center mb-5 transition-colors text-blue-600 group-hover:text-white">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how" className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-7xl mx-auto px-5 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="inline-block bg-white/15 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-white/20">
              COMO FUNCIONA
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
              Simples desde o primeiro dia.
            </h2>
            <p className="text-blue-100 text-lg">
              Implantamos, treinamos e você começa a usar. Sem complicação técnica.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.num} className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:bg-white/15 transition-all">
                <div className="text-7xl font-black text-white/10 absolute top-5 right-6 leading-none">{s.num}</div>
                <div className="w-11 h-11 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center text-white mb-6">
                  {s.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="text-blue-100 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PLANS ══ */}
      <section id="plans" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-blue-200">
              PLANOS E PREÇOS
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Escolha o plano do seu momento.
            </h2>
            <p className="text-gray-500 text-lg">
              Preços transparentes. Sem cobranças escondidas. Cancele quando quiser.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-semibold ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>Mensal</span>
            <button
              onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-[52px] h-7 rounded-full transition-colors ${billing === 'annual' ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${billing === 'annual' ? 'translate-x-[26px]' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-semibold flex items-center gap-2 ${billing === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>
              Anual
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                2 meses grátis
              </span>
            </span>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 items-center pt-5">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`relative rounded-3xl flex flex-col transition-all duration-200
                  ${plan.highlight
                    ? 'bg-blue-600 shadow-2xl shadow-blue-500/40 scale-[1.03] border-2 border-blue-500'
                    : 'bg-white border-2 border-gray-200 hover:border-blue-200 hover:shadow-xl'}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[11px] font-extrabold px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap uppercase tracking-widest z-10">
                    {plan.badge}
                  </div>
                )}

                <div className="p-7 pt-10 flex-1">
                  <h3 className={`text-xl font-extrabold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <p className={`text-sm mb-6 ${plan.highlight ? 'text-blue-100' : 'text-gray-500'}`}>{plan.description}</p>

                  {/* Price */}
                  {plan.monthlyPrice ? (
                    <>
                      <div className="flex items-baseline gap-0.5 mb-1">
                        <span className={`text-base font-semibold ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>R$</span>
                        <span className={`text-5xl font-black leading-none ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                          {billing === 'monthly' ? plan.monthlyPrice : plan.annualMonthlyPrice}
                        </span>
                        <span className={`text-sm ml-1 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>/mês</span>
                      </div>
                      {billing === 'annual' && (
                        <p className={`text-xs mb-1 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>
                          R${plan.annualTotal}/ano cobrado uma vez
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="mb-1">
                      <p className="text-4xl font-black text-gray-900 leading-none mb-1">Sob consulta</p>
                      <p className="text-sm text-gray-400">A partir de R$799/mês</p>
                    </div>
                  )}

                  {/* Implantação */}
                  {plan.implantacao !== null && (
                    <div className={`text-xs mt-3 mb-6 px-3 py-2.5 rounded-xl font-medium ${plan.highlight ? 'bg-white/15 text-blue-50 border border-white/20' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                      {billing === 'annual'
                        ? plan.implantacaoAnual === 'GRÁTIS'
                          ? 'Implantação GRATUITA no plano anual'
                          : `Implantação por R$${plan.implantacaoAnual} no plano anual`
                        : `+ Taxa de implantação: R$${plan.implantacao}`}
                    </div>
                  )}
                  {plan.implantacao === null && <div className="mb-6 mt-3" />}

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map(f => (
                      <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.highlight ? 'text-blue-50' : 'text-gray-600'}`}>
                        <Check className={`w-4 h-4 flex-shrink-0 mt-px ${plan.highlight ? 'text-white' : 'text-blue-500'}`} />
                        {f}
                      </li>
                    ))}
                    {plan.missing.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                        <Minus className="w-4 h-4 flex-shrink-0 mt-px text-gray-300" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-7 pb-7">
                  <a
                    href="#contact"
                    onClick={(e) => scrollToId(e, '#contact')}
                    className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all text-sm
                      ${plan.highlight
                        ? 'bg-white text-blue-600 hover:bg-blue-50'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  >
                    {plan.monthlyPrice ? 'Começar agora' : 'Falar com consultor'}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-8 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            Todos os planos incluem 7 dias de garantia. Sem risco.
          </p>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-blue-200">
              DEPOIMENTOS
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Quem usa, não volta atrás.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-gray-50 rounded-3xl p-7 border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GUARANTEE BANNER ══ */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-9 h-9 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-extrabold text-white mb-3">7 dias de garantia incondicional.</h2>
              <p className="text-gray-400 text-base leading-relaxed">
                Se dentro de 7 dias você não ver valor real no sistema, devolvemos 100% do valor da mensalidade. Sem perguntas, sem burocracia, sem enrolação. O risco é todo nosso.
              </p>
            </div>
            <a href="#contact" onClick={(e) => scrollToId(e, '#contact')} className="flex-shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm whitespace-nowrap">
              Começar com garantia
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-blue-200">
              DÚVIDAS FREQUENTES
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Suas dúvidas respondidas.
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ══ CONTACT / CTA FINAL ══ */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/30">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left */}
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <span className="inline-block bg-white/15 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 border border-white/20 w-fit">
                  FALE COM NOSSA EQUIPE
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                  Pronto para organizar seu negócio de verdade?
                </h2>
                <p className="text-blue-100 text-base mb-8 leading-relaxed">
                  Agende uma demonstração gratuita de 30 minutos. Nosso time vai entender seu negócio e mostrar como o sistema funciona para o seu caso específico.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: <PhoneCall className="w-4 h-4" />, text: 'Resposta em até 2 horas em dias úteis' },
                    { icon: <Shield className="w-4 h-4" />, text: 'Sem compromisso. 100% gratuito.' },
                    { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Demo personalizada para seu tipo de negócio' },
                  ].map(i => (
                    <div key={i.text} className="flex items-center gap-2.5 text-blue-100 text-sm">
                      <span className="text-white">{i.icon}</span>
                      {i.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Form */}
              <div className="bg-white p-10 md:p-14">
                {formSubmitted ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900">Cadastro realizado!</h3>
                    <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
                      Redirecionando para o WhatsApp Business da Solution Math com a sua mensagem personalizada...
                    </p>
                    <div className="pt-4">
                      <a
                        href={redirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 text-sm"
                      >
                        Abrir WhatsApp Agora
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Agende sua demonstração</h3>
                    {formError && (
                      <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold border border-red-100">
                        {formError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Seu nome completo"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        placeholder="(11) 99391-57368"
                        value={formData.whatsapp}
                        onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de negócio</label>
                      <select
                        value={formData.business_type}
                        onChange={e => setFormData({ ...formData, business_type: e.target.value })}
                        className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors text-gray-700"
                      >
                        <option value="">Selecione seu segmento</option>
                        <option value="Mercado / Mercearia">Mercado / Mercearia</option>
                        <option value="Hortifruti">Hortifruti</option>
                        <option value="Pet Shop">Pet Shop</option>
                        <option value="Autopeças">Autopeças</option>
                        <option value="Papelaria">Papelaria</option>
                        <option value="Materiais de Construção">Materiais de Construção</option>
                        <option value="Distribuidora">Distribuidora</option>
                        <option value="Outro comércio">Outro comércio</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Plano de interesse</label>
                      <select
                        value={formData.plan_interest}
                        onChange={e => setFormData({ ...formData, plan_interest: e.target.value })}
                        className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors text-gray-700"
                      >
                        <option value="">Qual plano te interessa?</option>
                        <option value="Start">Start — R$197/mês</option>
                        <option value="Growth">Growth — R$347/mês (Mais Popular)</option>
                        <option value="Enterprise">Enterprise — Sob consulta</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 text-sm mt-2"
                    >
                      {formSubmitting ? 'Cadastrando...' : 'Quero minha demonstração gratuita'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-gray-400 text-xs text-center">
                      Ao enviar, você concorda com nossa Política de Privacidade. Não enviamos spam.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-gray-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.jpg" alt="Solution Math Logo" className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-md" />
                <div>
                  <span className="font-extrabold text-white text-lg leading-none block">Solution Math OS</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Tecnologia Empresarial</span>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-5">
                ERP + CRM para pequenos e médios comércios brasileiros. Simples de usar, poderoso para crescer.
              </p>
              <div className="space-y-2">
                <a href="mailto:contato@solutionmath.com.br" className="flex items-center gap-2 text-gray-400 hover:text-blue-400 text-sm transition-colors">
                  <Mail className="w-3.5 h-3.5" /> contato@solutionmath.com.br
                </a>
                <a href="https://wa.me/55" className="flex items-center gap-2 text-gray-400 hover:text-blue-400 text-sm transition-colors">
                  <PhoneCall className="w-3.5 h-3.5" /> WhatsApp Comercial
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Produto</h4>
              <ul className="space-y-2.5">
                {['Funcionalidades', 'Como funciona', 'Planos', 'FAQ'].map(l => (
                  <li key={l}><a href="#" onClick={(e) => e.preventDefault()} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Empresa</h4>
              <ul className="space-y-2.5">
                {['Sobre nós', 'Contato', 'Política de Privacidade', 'Termos de Uso', 'LGPD'].map(l => (
                  <li key={l}><a href="#" onClick={(e) => e.preventDefault()} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">{l}</a></li>
                ))}
              </ul>
              <div className="mt-5">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-blue-400 text-sm transition-colors">
                  <Lock className="w-3.5 h-3.5" /> Área do cliente
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-600 text-xs">
            <p>© 2025 Solution Math. Todos os direitos reservados. CNPJ: 00.000.000/0001-00</p>
            <div className="flex items-center gap-5">
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-blue-400 transition-colors">Privacidade</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-blue-400 transition-colors">Termos</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-blue-400 transition-colors">LGPD</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
