import React, { useState } from 'react';
import {
  Sparkles, CheckCircle2, ArrowRight, ShieldCheck,
  Building2, Users, DollarSign, Zap, Bot, MessageSquare,
  Gift, Check, ChevronRight, HelpCircle, PhoneCall
} from 'lucide-react';

interface Recommendation {
  segment: string;
  revenue: string;
  users: string;
  recommendedPlan: 'Start' | 'Growth' | 'Enterprise';
  price: string;
  originalPrice: string;
  implantationFee: string;
  hasUpsellLyra: boolean;
  hasUpsellBackup: boolean;
}

export const SalesFunnelQuiz: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  // Step 1: Segment, Step 2: Revenue & Team, Step 3: Upsells & Special Offers, Step 4: Result + WhatsApp Dispatch
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // User Answers
  const [segment, setSegment] = useState<string>('Mercado / Supermercado');
  const [revenue, setRevenue] = useState<string>('R$ 30k a 100k');
  const [teamSize, setTeamSize] = useState<string>('4 a 10 colaboradores');

  // Upsells & Special Offer toggles
  const [addLyraAI, setAddLyraAI] = useState<boolean>(true); // Upsell: Assistente Lyra IA VIP
  const [addPrioritySetup, setAddPrioritySetup] = useState<boolean>(true); // Oferta: Implantação Relâmpago 24h

  // Contact for WhatsApp
  const [userName, setUserName] = useState<string>('');
  const [userWhatsapp, setUserWhatsapp] = useState<string>('');

  // Calculate recommendation
  const getRecommendation = (): Recommendation => {
    if (revenue === 'Até R$ 30k' && teamSize === '1 a 3 colaboradores') {
      return {
        segment,
        revenue,
        users: teamSize,
        recommendedPlan: 'Start',
        price: 'R$ 197/mês',
        originalPrice: 'R$ 247/mês',
        implantationFee: 'R$ 397 (Promoção 48h)',
        hasUpsellLyra: addLyraAI,
        hasUpsellBackup: addPrioritySetup,
      };
    } else if (revenue === 'Mais de R$ 300k' || teamSize === 'Mais de 10 colaboradores') {
      return {
        segment,
        revenue,
        users: teamSize,
        recommendedPlan: 'Enterprise',
        price: 'A partir de R$ 799/mês',
        originalPrice: 'R$ 1.200/mês',
        implantationFee: 'Sob Medida VIP',
        hasUpsellLyra: addLyraAI,
        hasUpsellBackup: addPrioritySetup,
      };
    } else {
      return {
        segment,
        revenue,
        users: teamSize,
        recommendedPlan: 'Growth',
        price: 'R$ 347/mês',
        originalPrice: 'R$ 497/mês',
        implantationFee: 'GRÁTIS no Plano Anual',
        hasUpsellLyra: addLyraAI,
        hasUpsellBackup: addPrioritySetup,
      };
    }
  };

  const rec = getRecommendation();

  // Trigger WhatsApp send with complete customized diagnostics and upsells
  const handleSendToWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const nameStr = userName.trim() || 'Gestor(a)';
    const recPlan = rec.recommendedPlan;

    let upsellText = '';
    if (addLyraAI) {
      upsellText += '\n• + Upsell Ativado: Assistente Lyra IA Integrada (Suporte e Relatórios 24h)';
    }
    if (addPrioritySetup) {
      upsellText += '\n• + Oferta Especial: Implantação Prioritária e Treinamento VIP em 24h';
    }

    const message = 
`🚀 *DIAGNÓSTICO COMERCIAL — SOLUTION MATH OS*

Olá! Acabei de realizar a simulação no funil do sistema.

👤 *Nome:* ${nameStr}
📱 *WhatsApp:* ${userWhatsapp || 'Não informado'}
🏢 *Segmento:* ${segment}
💰 *Faturamento:* ${revenue}
👥 *Equipe:* ${teamSize}

🎯 *Plano Recomendado:* Plano ${recPlan} (${rec.price})
🏷️ *Oferta Implantação:* ${rec.implantationFee}${upsellText}

Gostaria de garantir as condições e promoções recomendadas pelo funil e agendar a ativação do meu sistema. Qual o próximo passo?`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/5511939157368?text=${encoded}`, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-blue-100 shadow-2xl p-6 md:p-10 max-w-4xl mx-auto my-8 relative overflow-hidden">
      {/* Background glowing accents */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Funnel Progress Tracker */}
      <div className="flex items-center justify-between max-w-md mx-auto mb-8 border-b border-gray-100 pb-4">
        {[
          { num: 1, label: 'Negócio' },
          { num: 2, label: 'Porte & Meta' },
          { num: 3, label: 'Aceleração IA' },
          { num: 4, label: 'Plano Ideal' },
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                step >= s.num
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step > s.num ? <Check size={14} /> : s.num}
            </div>
            <span className={`text-[11px] font-semibold ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── ETAPA 1: Segmento do Negócio ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[11px] uppercase tracking-widest font-extrabold text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
              Passo 1 de 4 · Diagnóstico Inteligente
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-3">
              Qual é o segmento principal da sua empresa?
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Personalizamos os fluxos de PDV, estoque e CRM de acordo com o nicho de atuação do seu comércio.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {[
              'Mercado / Supermercado',
              'Hortifruti & Sacolão',
              'Pet Shop & Veterinária',
              'Autopeças & Oficina',
              'Distribuidora / Atacado',
              'Materiais de Construção',
              'Papelaria & Presentes',
              'Bebidas & Conveniência',
              'Prestador de Serviços / Outro',
            ].map((seg) => (
              <button
                key={seg}
                type="button"
                onClick={() => setSegment(seg)}
                className={`p-4 rounded-2xl border-2 text-left font-bold text-xs md:text-sm transition-all flex flex-col justify-between h-24 ${
                  segment === seg
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-md shadow-blue-500/10'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white hover:bg-gray-50/50'
                }`}
              >
                <Building2 className={`w-5 h-5 ${segment === seg ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{seg}</span>
              </button>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 text-sm transition-all hover:translate-x-1"
            >
              Continuar
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── ETAPA 2: Faturamento & Equipe ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[11px] uppercase tracking-widest font-extrabold text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
              Passo 2 de 4 · Porte e Operação
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-3">
              Qual o volume estimado de faturamento e equipe?
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Isso nos permite calcular a economia real e recomendar o plano com os recursos exatos sem você pagar a mais.
            </p>
          </div>

          <div className="space-y-5 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                Faturamento Mensal Estimado:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['Até R$ 30k', 'R$ 30k a 100k', 'R$ 100k a 300k', 'Mais de R$ 300k'].map((rev) => (
                  <button
                    key={rev}
                    type="button"
                    onClick={() => setRevenue(rev)}
                    className={`py-3.5 px-3 rounded-xl border-2 text-xs font-bold transition-all text-center ${
                      revenue === rev
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {rev}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                Quantos colaboradores utilizarão o sistema?
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {['1 a 3 colaboradores', '4 a 10 colaboradores', 'Mais de 10 colaboradores'].map((team) => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => setTeamSize(team)}
                    className={`py-3.5 px-3 rounded-xl border-2 text-xs font-bold transition-all text-center ${
                      teamSize === team
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
              onClick={() => setStep(1)}
              className="text-gray-500 hover:text-gray-800 text-xs font-bold underline"
            >
              ← Voltar segmento
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 text-sm transition-all hover:translate-x-1"
            >
              Avançar para Recursos
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── ETAPA 3: UPSELL & PROMOÇÕES ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[11px] uppercase tracking-widest font-extrabold text-emerald-600 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              Passo 3 de 4 · Ofertas Especiais & Upsell
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-3">
              Turbine seu Solution Math OS com recursos VIP
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Selecione os módulos adicionais com desconto exclusivo garantido nesta sessão.
            </p>
          </div>

          {/* Upsell 1: Assistente Lyra IA */}
          <div
            onClick={() => setAddLyraAI(!addLyraAI)}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
              addLyraAI
                ? 'border-teal-500 bg-teal-50/40 shadow-lg shadow-teal-500/10'
                : 'border-gray-200 bg-white opacity-80 hover:opacity-100'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 border transition-all ${
                addLyraAI ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300 bg-white'
              }`}
            >
              {addLyraAI && <Check size={14} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-black bg-gradient-to-r from-teal-600 to-indigo-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  UPSELL VIP RECOMENDADO
                </span>
                <span className="text-xs text-gray-400 line-through">De R$ 149/mês</span>
                <span className="text-xs font-extrabold text-teal-700">Por + R$ 49/mês</span>
              </div>
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-teal-600" />
                Assistente de IA Lyra Integrada (Operação 24h)
              </h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Tenha uma IA corporativa conectada ao seu WhatsApp e dentro do sistema que responde perguntas da sua equipe, emite relatórios DRE em segundos e identifica gargalos de caixa automaticamente.
              </p>
            </div>
          </div>

          {/* Upsell 2: Implantação Relâmpago 24h & Treinamento */}
          <div
            onClick={() => setAddPrioritySetup(!addPrioritySetup)}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
              addPrioritySetup
                ? 'border-blue-500 bg-blue-50/40 shadow-lg shadow-blue-500/10'
                : 'border-gray-200 bg-white opacity-80 hover:opacity-100'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 border transition-all ${
                addPrioritySetup ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'
              }`}
            >
              {addPrioritySetup && <Check size={14} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-black bg-blue-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  OFERTA ESPECIAL
                </span>
                <span className="text-xs text-emerald-700 font-bold">100% Bonificado no Fechamento</span>
              </div>
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Onboarding VIP + Migração de Dados em 24h
              </h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Nosso time técnico importa seus produtos, clientes e histórico de vendas direto das suas planilhas ou sistema antigo sem você perder tempo.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
              onClick={() => setStep(2)}
              className="text-gray-500 hover:text-gray-800 text-xs font-bold underline"
            >
              ← Voltar porte
            </button>
            <button
              onClick={() => setStep(4)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 text-sm transition-all hover:translate-x-1"
            >
              Ver Meu Plano Ideal
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── ETAPA 4: RECOMENDAÇÃO FINAL & DISPATCH WHATSAPP ── */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[11px] uppercase tracking-widest font-extrabold text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
              Diagnóstico Pronto com Sucesso
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-3">
              Plano recomendado para seu comércio:
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Baseado em {segment} com porte {revenue} e equipe de {teamSize}.
            </p>
          </div>

          {/* Diagnosis Result Card */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white border-2 border-slate-700 shadow-2xl relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-blue-500 text-white rounded-full">
                  PLANO RECOMENDADO
                </span>
                <h3 className="text-3xl font-black text-white mt-2">
                  Plano {rec.recommendedPlan}
                </h3>
                <p className="text-xs text-blue-300 mt-0.5">
                  Solução completa com CRM, PDV, Estoque e Relatórios Integrados.
                </p>
              </div>

              <div className="text-left md:text-right">
                <span className="text-xs text-slate-400 line-through block">{rec.originalPrice}</span>
                <div className="text-2xl md:text-3xl font-black text-emerald-400">{rec.price}</div>
                <span className="text-[11px] text-slate-300 font-semibold">Taxa de Implantação: {rec.implantationFee}</span>
              </div>
            </div>

            {/* Included features highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Tempo Médio Salvo:</span>
                <span className="text-sm font-bold text-emerald-400">Até 30h / mês</span>
              </div>
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Setup e Treinamento:</span>
                <span className="text-sm font-bold text-blue-300">Em até 24h a 48h</span>
              </div>
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Módulos Extras:</span>
                <span className="text-sm font-bold text-teal-300">
                  {addLyraAI ? 'IA Lyra Inclusa' : 'Padrão'}
                </span>
              </div>
            </div>

            {/* Form to dispatch straight to WhatsApp */}
            <form onSubmit={handleSendToWhatsApp} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Seu Nome ou da Empresa:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva (Mercado Central)"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Seu WhatsApp de Contato:</label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={userWhatsapp}
                    onChange={(e) => setUserWhatsapp(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-4 px-6 rounded-xl transition-all shadow-xl shadow-emerald-500/20 text-sm md:text-base flex items-center justify-center gap-3 cursor-pointer"
              >
                <PhoneCall className="w-5 h-5" />
                Receber Proposta & Ativar Oferta no WhatsApp
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-[11px] text-slate-400">
                Você será direcionado diretamente ao WhatsApp do nosso especialista com seu diagnóstico pronto. Sem custo e sem compromisso.
              </p>
            </form>
          </div>

          <div className="flex justify-between items-center text-xs">
            <button
              onClick={() => setStep(3)}
              className="text-gray-500 hover:text-gray-800 font-bold underline"
            >
              ← Revisar upsells e recursos
            </button>
            <button
              onClick={() => setStep(1)}
              className="text-blue-600 hover:text-blue-800 font-bold"
            >
              Refazer simulação do zero
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
