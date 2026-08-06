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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 th-surface p-6 rounded-2xl border th-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold th-text flex items-center gap-2">
              Central de Workflows & Automações
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-500 border border-purple-500/30">
                Lyra Workflow Builder
              </span>
            </h1>
            <p className="text-xs th-muted">
              Gerencie gatilhos, regras e automações inteligentes para economizar tempo no Solution Math OS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenLyra && (
            <button
              onClick={onOpenLyra}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl th-surface2 hover:bg-purple-500/10 th-text border border-purple-500/30 text-xs font-semibold transition-all shadow-sm"
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
        <div className="th-surface border th-border p-5 rounded-2xl shadow-sm">
          <div className="text-xs th-muted font-medium mb-1">Workflows Ativos</div>
          <div className="text-2xl font-black text-emerald-500">{activeCount} automações</div>
        </div>

        <div className="th-surface border th-border p-5 rounded-2xl shadow-sm">
          <div className="text-xs th-muted font-medium mb-1">Total de Workflows</div>
          <div className="text-2xl font-black text-purple-500">{workflows.length} cadastrados</div>
        </div>

        <div className="th-surface border th-border p-5 rounded-2xl shadow-sm">
          <div className="text-xs th-muted font-medium mb-1">Execuções Realizadas</div>
          <div className="text-2xl font-black text-blue-500">{totalExecutions} acionamentos</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 th-muted pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar por nome, gatilho ou ação..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full th-input th-input-search text-sm th-text placeholder:th-muted outline-none focus:border-purple-500"
          />
        </div>

        <button onClick={fetchWorkflows} className="p-2.5 th-surface2 hover:bg-purple-500/10 border th-border rounded-xl th-muted hover:th-text">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Workflows List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 text-center py-16 th-muted text-sm">Carregando automações...</div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="col-span-2 text-center py-16 th-muted text-sm th-surface rounded-2xl border th-border">
            Nenhum workflow cadastrado. Clique em <strong>Novo Workflow</strong> ou solicite à Lyra!
          </div>
        ) : (
          filteredWorkflows.map((w) => (
            <div
              key={w.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                w.status === 'Ativo'
                  ? 'th-surface border-purple-500/40 shadow-md'
                  : 'th-surface border th-border opacity-75'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-mono text-purple-500 font-bold">WF-{w.id}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(w.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        w.status === 'Ativo'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}
                    >
                      {w.status === 'Ativo' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      {w.status}
                    </button>
                    <button onClick={() => handleDelete(w.id)} className="p-1 th-muted hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold th-text text-base mb-1">{w.name}</h3>
                <p className="text-xs th-muted leading-relaxed mb-4">{w.description || 'Sem descrição.'}</p>

                {/* Badges: Trigger & Condition */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-purple-500 w-16">Gatilho:</span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-medium">
                      ⚡ {w.trigger_event}
                    </span>
                  </div>

                  {w.condition_rules && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold th-muted w-16">Condição:</span>
                      <span className="px-2.5 py-1 rounded-lg th-surface2 th-text border th-border font-medium">
                        🔍 {w.condition_rules}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions list */}
                <div className="th-surface2 p-3.5 rounded-xl border th-border space-y-2">
                  <span className="text-[11px] font-bold th-muted uppercase tracking-wider block">Ações Executadas:</span>
                  <div className="space-y-1.5">
                    {w.actions.map((act, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs th-text">
                        <ArrowRight className="w-3 h-3 text-purple-500 shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t th-border flex items-center justify-between text-xs th-muted">
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
          <div className="th-surface border th-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold th-text flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              Criar Novo Workflow de Automação
            </h2>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium th-muted mb-1">Nome do Workflow</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Notificação de Pedido Alto Valor"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2 th-input text-sm th-text placeholder:th-muted"
                />
              </div>

              <div>
                <label className="block text-xs font-medium th-muted mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Envia WhatsApp para o vendedor quando pedido > R$ 10.000"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 th-input text-sm th-text placeholder:th-muted"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium th-muted mb-1">Gatilho (Trigger)</label>
                  <select
                    value={triggerEvent}
                    onChange={e => setTriggerEvent(e.target.value)}
                    className="w-full px-3 py-2 th-input text-xs th-text"
                  >
                    <option>Pedido Aprovado</option>
                    <option>Estoque Mínimo Atingido</option>
                    <option>Novo Lead Cadastrado</option>
                    <option>Chamado de Suporte Aberto</option>
                    <option>Pagamento Vencido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium th-muted mb-1">Condição Regra</label>
                  <input
                    type="text"
                    placeholder="Ex: Valor > 10000"
                    value={conditionRules}
                    onChange={e => setConditionRules(e.target.value)}
                    className="w-full px-3.5 py-2 th-input text-xs th-text placeholder:th-muted"
                  />
                </div>
              </div>

              {/* Actions Input */}
              <div>
                <label className="block text-xs font-medium th-muted mb-1">Ações do Workflow</label>
                <div className="space-y-2 mb-2">
                  {actionList.map((act, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 th-surface2 rounded-lg text-xs th-text border th-border">
                      <span>• {act}</span>
                      <button type="button" onClick={() => handleRemoveAction(i)} className="th-muted hover:text-red-500 text-xs">Remover</button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar nova ação..."
                    value={newActionInput}
                    onChange={e => setNewActionInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 th-input text-xs th-text placeholder:th-muted"
                  />
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t th-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold th-muted hover:th-text"
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
