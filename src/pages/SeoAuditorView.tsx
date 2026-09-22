import React, { useState } from 'react';
import {
  Search, ShieldCheck, FileText, CheckCircle2, Globe,
  Building2, ShoppingBag, Layers, ChevronRight, HelpCircle,
  ExternalLink, BarChart, ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface KeywordGroup {
  category: string;
  badgeColor: string;
  description: string;
  keywords: string[];
}

const SEO_GROUPS: KeywordGroup[] = [
  {
    category: '1. Palavras-chave de Produto (Alta Intenção de Compra)',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Termos diretos utilizados por empresários buscando contratar uma solução de gestão.',
    keywords: [
      'sistema de gestão empresarial',
      'software de gestão empresarial',
      'ERP',
      'sistema ERP',
      'ERP empresarial',
      'sistema de gestão',
      'software de gestão',
      'plataforma de gestão empresarial',
      'sistema integrado de gestão',
      'sistema de gestão comercial',
      'software de gestão comercial'
    ]
  },
  {
    category: '2. Palavras-chave por Módulo (CRM, PDV, Estoque, Vendas)',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'Buscas focadas em necessidades específicas de cada departamento da empresa.',
    keywords: [
      'CRM',
      'sistema CRM',
      'software CRM',
      'CRM empresarial',
      'CRM para empresas',
      'sistema de gestão de clientes',
      'plataforma CRM',
      'sistema PDV',
      'software PDV',
      'sistema de vendas',
      'sistema para vendas',
      'sistema para loja',
      'sistema para lojas',
      'software para lojas',
      'sistema comercial',
      'sistema de controle de estoque',
      'software de controle de estoque',
      'sistema para controle de estoque',
      'gestão de estoque',
      'controle de estoque empresarial'
    ]
  },
  {
    category: '3. Palavras-chave por Segmento & Público',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Segmentação nichada para varejistas, comércios e empresas de pequeno a médio porte.',
    keywords: [
      'ERP para varejo',
      'sistema para varejo',
      'sistema de gestão para varejo',
      'ERP para lojas',
      'sistema para lojas',
      'ERP para comércio',
      'sistema para comércio',
      'software para comércio',
      'ERP para pequenas empresas',
      'ERP para médias empresas',
      'sistema de gestão para pequenas empresas',
      'sistema de gestão para médias empresas',
      'ERP para e-commerce',
      'sistema para e-commerce'
    ]
  },
  {
    category: '4. Palavras-chave de Dores, Problemas & Dúvidas (SEO Educativo)',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    description: 'Perguntas e dúvidas frequentes no Google que direcionam tráfego topo/meio de funil.',
    keywords: [
      'como controlar estoque',
      'como organizar uma empresa',
      'como controlar vendas',
      'como gerenciar uma loja',
      'como fazer gestão empresarial',
      'como melhorar gestão de estoque',
      'como automatizar uma empresa',
      'como integrar vendas e estoque',
      'como organizar clientes',
      'como centralizar gestão empresarial',
      'sistema para automatizar empresa'
    ]
  }
];

export const SeoAuditorView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const totalKeywords = SEO_GROUPS.reduce((acc, g) => acc + g.keywords.length, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Solution Math Logo" className="w-12 h-12 rounded-xl object-cover border border-teal-500/40 shadow-lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-black text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded-md border border-teal-800">
                  Painel de Auditoria SEO
                </span>
                <span className="text-xs text-slate-500">Uso Interno Administrativo</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
                Solution Math OS — Estrutura de Indexação Orgânica
              </h1>
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold px-4 py-2.5 rounded-xl border border-slate-700 text-xs transition-colors"
          >
            Ver Landing Page Principal
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Live Indexing Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total de Palavras-Chave</span>
            <div className="text-3xl font-black text-teal-400 mt-2">{totalKeywords} termos</div>
            <p className="text-[11px] text-slate-500 mt-1">Mapeadas e indexadas no Schema.org</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold uppercase">Meta Tags Primárias</span>
            <div className="text-3xl font-black text-emerald-400 mt-2">100% Ativas</div>
            <p className="text-[11px] text-slate-500 mt-1">Title, Description e Keywords no index.html</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold uppercase">Sitemap & Robots</span>
            <div className="text-3xl font-black text-blue-400 mt-2">Configurados</div>
            <p className="text-[11px] text-slate-500 mt-1">/robots.txt e /sitemap.xml operacionais</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold uppercase">JSON-LD Schema</span>
            <div className="text-3xl font-black text-purple-400 mt-2">SoftwareApp</div>
            <p className="text-[11px] text-slate-500 mt-1">Rich Snippets do Google habilitados</p>
          </div>
        </div>

        {/* Search filter */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar se uma palavra-chave específica foi incluída (ex: ERP para varejo, PDV, estoque)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none w-full"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Keyword Groups Grid */}
        <div className="space-y-6">
          {SEO_GROUPS.map((group, idx) => {
            const filteredWords = group.keywords.filter((kw) =>
              kw.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (searchTerm && filteredWords.length === 0) return null;

            return (
              <div key={idx} className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 md:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">{group.category}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{group.description}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${group.badgeColor}`}>
                    {filteredWords.length} termos
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {filteredWords.map((kw, kIdx) => (
                    <div
                      key={kIdx}
                      className="bg-slate-900 border border-slate-700 hover:border-teal-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-medium flex items-center gap-2 group transition-colors"
                    >
                      <CheckCircle2 size={13} className="text-teal-400 flex-shrink-0" />
                      <span>{kw}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Audit Specifications & Invisible Architecture */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-teal-400 w-5 h-5" />
            Como o SEO está estruturado de forma invisível para o usuário final:
          </h3>
          <ul className="text-xs text-slate-400 space-y-2.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
              <span><strong>Metadados no Cabeçalho HTML:</strong> O Google rastreia <code>&lt;title&gt;</code>, <code>&lt;meta name="description"&gt;</code> e <code>&lt;meta name="keywords"&gt;</code> diretamente no <code>index.html</code> antes da renderização do JavaScript.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
              <span><strong>Schema.org Estruturado (JSON-LD):</strong> Informa aos robôs de busca que o Solution Math OS é um Software corporativo com suporte a CRM, PDV, Estoque e IA, ativando painéis ricos nos resultados de busca.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
              <span><strong>FAQPage Schema Semântico:</strong> Perguntas frequentes como "como controlar estoque", "como gerenciar uma loja" e "sistema de gestão para comércio" são indexadas diretamente para respostas rápidas nos buscadores.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
              <span><strong>Sitemap e Robots:</strong> Arquivos <code>/sitemap.xml</code> e <code>/robots.txt</code> orientam os rastreadores a priorizarem as páginas comerciais e protegerem as rotas restritas do painel (<code>/app</code>).</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};
