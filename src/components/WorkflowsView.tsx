import React, { useState, useEffect } from 'react';
import {
  Zap, Play, Pause, Trash2, Plus, ArrowRight, ShieldCheck,
  CheckCircle2, AlertTriangle, Layers, Bot, RefreshCw, Filter, Search
} from 'lucide-react';
import { LyraAvatar } from './AIChatView';

interface Workflow {
  id: number;
  name: string;
  description: string;
  trigger_event: string;
  condition_rules: string;
  actions: string[];
  status: 'Ativo' | 'Pausado';
  executions_count: number;
  created_at: string;
}

export const WorkflowsView: React.FC<{ onOpenLyra?: () => void }> = ({ onOpenLyra }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('Pedido Aprovado');
  const [conditionRules, setConditionRules] = useState('');
  const [actionList, setActionList] = useState<string[]>(['Localizar vendedor responsável', 'Enviar mensagem WhatsApp']);
  const [newActionInput, setNewActionInput] = useState('');

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/workflows');
      if (res.ok) setWorkflows(await res.json());
    } catch (err) {
      console.error('Erro ao buscar workflows', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleToggle = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/workflows/${id}/toggle`, { method: 'PUT' });
      if (res.ok) fetchWorkflows();
    } catch (err) {
      console.error('Erro ao alternar status', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este workflow?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/workflows/${id}`, { method: 'DELETE' });
      if (res.ok) fetchWorkflows();
    } catch (err) {
      console.error('Erro ao excluir workflow', err);
    }
  };

  const handleAddAction = () => {
    if (!newActionInput.trim()) return;
    setActionList(prev => [...prev, newActionInput.trim()]);
    setNewActionInput('');
  };

  const handleRemoveAction = (index: number) => {
    setActionList(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('http://localhost:3001/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          trigger_event: triggerEvent,
          condition_rules: conditionRules,
          actions: actionList,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setName('');
        setDescription('');
        setConditionRules('');
        fetchWorkflows();
      }
    } catch (err) {
      console.error('Erro ao criar workflow', err);
    }
  };

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.trigger_event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = workflows.filter(w => w.status === 'Ativo').length;
  const totalExecutions = workflows.reduce((acc, w) => acc + (w.executions_count || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-purple-950/20 p-6 rounded-2xl border border-purple-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Central de Workflows & Automações
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Lyra Workflow Builder
              </span>
            </h1>
            <p className="text-xs text-purple-200/70">
              Gerencie gatilhos, regras e automações inteligentes para economizar tempo no Solution Math OS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenLyra && (
            <button
              onClick={onOpenLyra}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-500/30 text-xs font-semibold transition-all shadow-md"
            >
              <LyraAvatar size="sm" />
              Pedir para Lyra Criar
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            Novo Workflow
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gray-900/80 border border-gray-800 p-5 rounded-2xl">
          <div className="text-xs text-gray-400 font-medium mb-1">Workflows Ativos</div>
          <div className="text-2xl font-black text-emerald-400">{activeCount} automações</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 p-5 rounded-2xl">
          <div className="text-xs text-gray-400 font-medium mb-1">Total de Workflows</div>
          <div className="text-2xl font-black text-purple-400">{workflows.length} cadastrados</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 p-5 rounded-2xl">
          <div className="text-xs text-gray-400 font-medium mb-1">Execuções Realizadas</div>
          <div className="text-2xl font-black text-blue-400">{totalExecutions} acionamentos</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, gatilho ou ação..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-purple-500/50"
          />
        </div>

        <button onClick={fetchWorkflows} className="p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-400 hover:text-gray-200">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Workflows List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 text-center py-16 text-gray-500 text-sm">Carregando automações...</div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-gray-500 text-sm bg-gray-900/40 rounded-2xl border border-gray-800">
            Nenhum workflow cadastrado. Clique em <strong>Novo Workflow</strong> ou solicite à Lyra!
          </div>
        ) : (
          filteredWorkflows.map((w) => (
            <div
              key={w.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                w.status === 'Ativo'
                  ? 'bg-gray-900/90 border-purple-500/30 shadow-lg shadow-purple-950/20'
                  : 'bg-gray-950/60 border-gray-800 opacity-60'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-mono text-purple-400 font-bold">WF-{w.id}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(w.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        w.status === 'Ativo'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {w.status === 'Ativo' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      {w.status}
                    </button>
                    <button onClick={() => handleDelete(w.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-white text-base mb-1">{w.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">{w.description || 'Sem descrição.'}</p>

                {/* Badges: Trigger & Condition */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-purple-400 w-16">Gatilho:</span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-200 border border-purple-500/20 font-medium">
                      ⚡ {w.trigger_event}
                    </span>
                  </div>

                  {w.condition_rules && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-gray-400 w-16">Condição:</span>
                      <span className="px-2.5 py-1 rounded-lg bg-gray-800 text-gray-300 border border-gray-700 font-medium">
                        🔍 {w.condition_rules}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions list */}
                <div className="bg-gray-950/80 p-3.5 rounded-xl border border-gray-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Ações Executadas:</span>
                  <div className="space-y-1.5">
                    {w.actions.map((act, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                        <ArrowRight className="w-3 h-3 text-purple-400 shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-500">
                <span>Executado <strong>{w.executions_count || 0}</strong> vezes</span>
                <span>Criado em {new Date(w.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-purple-500/20 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Criar Novo Workflow de Automação
            </h2>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nome do Workflow</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Notificação de Pedido Alto Valor"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-200 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Envia WhatsApp para o vendedor quando pedido > R$ 10.000"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-200 outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Gatilho (Trigger)</label>
                  <select
                    value={triggerEvent}
                    onChange={e => setTriggerEvent(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-200 outline-none"
                  >
                    <option>Pedido Aprovado</option>
                    <option>Estoque Mínimo Atingido</option>
                    <option>Novo Lead Cadastrado</option>
                    <option>Chamado de Suporte Aberto</option>
                    <option>Pagamento Vencido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Condição Regra</label>
                  <input
                    type="text"
                    placeholder="Ex: Valor > 10000"
                    value={conditionRules}
                    onChange={e => setConditionRules(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              {/* Actions Input */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Ações do Workflow</label>
                <div className="space-y-2 mb-2">
                  {actionList.map((act, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-gray-950 rounded-lg text-xs text-gray-300 border border-gray-800">
                      <span>• {act}</span>
                      <button type="button" onClick={() => handleRemoveAction(i)} className="text-gray-500 hover:text-red-400 text-xs">Remover</button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar nova ação..."
                    value={newActionInput}
                    onChange={e => setNewActionInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-xl text-xs font-semibold"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold"
                >
                  Criar Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
