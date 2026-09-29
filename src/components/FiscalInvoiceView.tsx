import React, { useState } from 'react';
import {
  FileText, ShieldCheck, Upload, CheckCircle2, Clock, AlertTriangle,
  Download, Send, Eye, RefreshCw, Key, Truck, Building2, Package,
  ExternalLink, Sparkles, Check, ChevronRight, Hash, ArrowUpRight
} from 'lucide-react';

interface FiscalDoc {
  id: number;
  number: string;
  type: 'NFS-e' | 'NF-e' | 'MDF-e';
  client_name: string;
  cnpj: string;
  amount: number;
  issue_date: string;
  status: 'Autorizada' | 'Processando' | 'Cancelada';
  protocol: string;
  access_key?: string;
  municipality?: string;
}

export const FiscalInvoiceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'nfse' | 'nfe' | 'mdfe'>('all');
  const [simulatingEmission, setSimulatingEmission] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string>('braspress');
  const [certPassword, setCertPassword] = useState('••••••••');
  const [certUploaded, setCertUploaded] = useState(true);

  // Lista de notas fiscais prontas / emitidas
  const [documents, setDocuments] = useState<FiscalDoc[]>([
    {
      id: 1,
      number: 'NFS-e 2026/000842',
      type: 'NFS-e',
      client_name: 'Braspress Transportes Urgentes Ltda',
      cnpj: '48.740.351/0001-65',
      amount: 85000,
      issue_date: '29/09/2026 14:15',
      status: 'Autorizada',
      protocol: 'SP-20260929-881920',
      access_key: '35260948740351000165570010000008421008420012',
      municipality: 'São Paulo - SP'
    },
    {
      id: 2,
      number: 'MDF-e 2026/000115',
      type: 'MDF-e',
      client_name: 'Patrus Transportes Urgentes (Rota SP > MG)',
      cnpj: '17.262.223/0001-49',
      amount: 95000,
      issue_date: '28/09/2026 18:30',
      status: 'Autorizada',
      protocol: 'MG-20260928-441209',
      access_key: '31260917262223000149580010000001151001150033',
      municipality: 'Contagem - MG'
    },
    {
      id: 3,
      number: 'NFS-e 2026/000841',
      type: 'NFS-e',
      client_name: 'Grupo GPS Soluções Corporativas',
      cnpj: '03.882.259/0001-10',
      amount: 120000,
      issue_date: '27/09/2026 11:20',
      status: 'Autorizada',
      protocol: 'SP-20260927-112048',
      access_key: '35260903882259000110570010000008411008410091',
      municipality: 'Campinas - SP'
    },
    {
      id: 4,
      number: 'NFS-e 2026/000840',
      type: 'NFS-e',
      client_name: 'Stefanini Consultoria e TI',
      cnpj: '58.069.458/0001-12',
      amount: 65000,
      issue_date: '26/09/2026 09:45',
      status: 'Autorizada',
      protocol: 'SP-20260926-094512',
      access_key: '35260958069458000112570010000008401008400045',
      municipality: 'São Paulo - SP'
    }
  ]);

  const handleSimulateEmission = () => {
    setSimulatingEmission(true);
    setTimeout(() => {
      const newDoc: FiscalDoc = {
        id: Date.now(),
        number: `NFS-e 2026/00084${documents.length + 3}`,
        type: 'NFS-e',
        client_name: selectedSaleId === 'braspress' ? 'Patrus Transportes Urgentes' : 'Rede OdontoCompany Clínicas',
        cnpj: selectedSaleId === 'braspress' ? '17.262.223/0001-49' : '08.921.341/0001-88',
        amount: selectedSaleId === 'braspress' ? 95000 : 42000,
        issue_date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR').slice(0, 5),
        status: 'Autorizada',
        protocol: `SEFAZ-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        access_key: `352609487403510001655700100000084${documents.length + 3}1008420012`,
        municipality: 'São Paulo - SP'
      };
      setDocuments(prev => [newDoc, ...prev]);
      setSimulatingEmission(false);
      alert(`✅ Nota Fiscal emitida com sucesso!\nNúmero: ${newDoc.number}\nProtocolo Prefeitura: ${newDoc.protocol}\nXML assinado digitalmente via PlugNotas.`);
    }, 1500);
  };

  const filteredDocs = activeTab === 'all' ? documents : documents.filter(d => {
    if (activeTab === 'nfse') return d.type === 'NFS-e';
    if (activeTab === 'nfe') return d.type === 'NF-e';
    if (activeTab === 'mdfe') return d.type === 'MDF-e';
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 flex-1 overflow-y-auto">
      
      {/* Header com Badge PlugNotas & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b th-border pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold th-text">Módulo Fiscal & Emissão Eletrônica</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              PlugNotas & TecnoSpeed API
            </span>
          </div>
          <p className="text-sm th-muted">
            Emissão unificada de Nota Fiscal de Serviços (NFS-e), Produtos (NF-e) e Manifesto Eletrônico de Cargas (MDF-e) integrado ao caixa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Webservice SEFAZ / Prefeituras Operacional
          </div>
        </div>
      </div>

      {/* Grid: Card de Certificado Digital A1 + Card de Diferencial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Card do Certificado Digital A1 */}
        <div className="lg:col-span-2 th-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b th-border pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm th-text">Certificado Digital A1 (.PFX / .P12)</h3>
                <p className="text-xs th-muted">Assinatura digital padrão ICP-Brasil em nuvem via HSM</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Certificado Vinculado
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">Empresa Titular do Certificado:</span>
              <div className="text-sm font-bold text-white">Solution Math OS — Operações Corporativas</div>
              <span className="text-xs text-slate-400">CNPJ: 45.892.124/0001-90</span>
            </div>

            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">Status & Vigência da Assinatura:</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Válido até 25/09/2027
              </div>
              <span className="text-xs text-slate-400">Emissor: Certisign Autoridade Certificadora</span>
            </div>
          </div>

          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between text-xs text-purple-300">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-purple-400 shrink-0" />
              <span>O certificado digital fica salvo no cofre criptografado em nuvem (PlugNotas HSM). Não exige instalação no PC.</span>
            </div>
            <button className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shrink-0">
              Renovar Certificado
            </button>
          </div>
        </div>

        {/* Card de Configuração Rápida & Chave API */}
        <div className="th-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm th-text">Integração API PlugNotas</h3>
            </div>
            <p className="text-xs th-muted leading-relaxed">
              Para colocar em produção com clientes reais, basta colar a sua chave de parceiro da TecnoSpeed / PlugNotas abaixo:
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold th-muted block">API Key (Token de Parceiro / Software House):</label>
            <input
              type="password"
              value="pn_live_89481928491823901840918"
              readOnly
              className="th-input text-xs font-mono text-purple-400 bg-slate-950"
            />
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Check size={12} /> Endpoint conectado e pronto para emissão
            </span>
          </div>

          <div className="pt-2 border-t th-border text-center">
            <a
              href="https://docs.plugnotas.com.br"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Consultar Documentação Técnica Oficial <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Simulador de Disparo Fiscal para Reunião de Hoje */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Emissão de Nota Fiscal em 1 Clique (Demonstração ao Vivo)
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                100% Automático
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Selecione uma venda recente do CRM e dispare a emissão para demonstrar ao cliente durante a reunião.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateEmission}
              disabled={simulatingEmission}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/40 transition-all active:scale-95 disabled:opacity-50"
            >
              {simulatingEmission ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Assinando e Transmitindo para Prefeitura...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Emitir Nota Fiscal Agora
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium">Contrato Selecionado:</span>
            <div className="text-sm font-bold text-white mt-0.5">Patrus Transportes Urgentes</div>
            <span className="text-[11px] text-purple-400">R$ 95.000,00 &bull; Implantação Enterprise</span>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium">Tipo de Documento:</span>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">NFS-e de Serviços de Software</div>
            <span className="text-[11px] text-slate-500">Cód. Tributação: 01.07 (Desenvolvimento/SaaS)</span>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium">Disparo Automático:</span>
            <div className="text-xs font-semibold text-slate-200 mt-1 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              PDF e XML enviados no e-mail e WhatsApp do cliente
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Histórico de Notas Emitidas */}
      <div className="th-card overflow-hidden">
        <div className="p-4 border-b th-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold th-text text-sm">Histórico de Documentos Fiscais Emitidos</h4>
            <p className="text-xs th-muted">Notas Fiscais de Serviço (NFS-e), Mercadorias (NF-e) e Manifestos (MDF-e)</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {[
              { id: 'all', label: 'Todos os Documentos' },
              { id: 'nfse', label: 'NFS-e (Serviços)' },
              { id: 'mdfe', label: 'MDF-e (Logística)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab.id ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b th-border th-surface2">
                <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Tipo / Número</th>
                <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Cliente / Tomador</th>
                <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Valor Bruto</th>
                <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Data de Emissão</th>
                <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Protocolo SEFAZ</th>
                <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Status</th>
                <th className="py-3 px-4 text-right text-xs font-semibold th-muted uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y th-border">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-primary/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold th-text flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        doc.type === 'MDF-e'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {doc.type}
                      </span>
                      {doc.number}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">{doc.access_key}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold th-text">{doc.client_name}</div>
                    <div className="text-xs th-muted">{doc.cnpj} &bull; {doc.municipality}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    R$ {doc.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-xs th-muted">{doc.issue_date}</td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-400">{doc.protocol}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                      <CheckCircle2 size={12} /> {doc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => alert(`📄 Visualizando DANFE da ${doc.number} emitida para ${doc.client_name}.\nValor: R$ ${doc.amount.toLocaleString('pt-BR')}`)}
                        className="p-1.5 rounded-lg th-surface2 hover:bg-purple-500/20 th-muted hover:text-purple-400 transition-colors"
                        title="Visualizar DANFE (PDF)"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => alert(`⬇️ Download do arquivo XML oficial assinado com Certificado A1 efetuado com sucesso!`)}
                        className="p-1.5 rounded-lg th-surface2 hover:bg-emerald-500/20 th-muted hover:text-emerald-400 transition-colors"
                        title="Baixar XML Assinado"
                      >
                        <Download size={15} />
                      </button>
                      <button
                        onClick={() => alert(`📲 Nota Fiscal enviada via WhatsApp e E-mail para ${doc.client_name} com link de download direto!`)}
                        className="p-1.5 rounded-lg th-surface2 hover:bg-blue-500/20 th-muted hover:text-blue-400 transition-colors"
                        title="Disparar no WhatsApp"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
export default FiscalInvoiceView;
