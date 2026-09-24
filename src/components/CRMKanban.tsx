import React, { useState, useEffect } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners, useDroppable
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusCircle, X, DollarSign, User, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const STAGES = ['Novo Lead', 'Contato Feito', 'Proposta Enviada', 'Negociação', 'Ganho', 'Perdido'];
const STAGE_COLORS: Record<string, string> = {
  'Novo Lead':         'border-blue-500/30 bg-blue-500/5',
  'Contato Feito':     'border-purple-500/30 bg-purple-500/5',
  'Proposta Enviada':  'border-amber-500/30 bg-amber-500/5',
  'Negociação':        'border-orange-500/30 bg-orange-500/5',
  'Ganho':             'border-emerald-500/30 bg-emerald-500/5',
  'Perdido':           'border-rose-500/30 bg-rose-500/5',
};
const STAGE_BADGE: Record<string, string> = {
  'Novo Lead': 'text-blue-500', 'Contato Feito': 'text-purple-500',
  'Proposta Enviada': 'text-amber-500', 'Negociação': 'text-orange-500',
  'Ganho': 'text-emerald-500', 'Perdido': 'text-rose-500',
};
const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

interface Deal {
  id: number; title: string; client_id?: number; client_name?: string;
  value: number; stage: string; assignee_id?: number; assignee_name?: string; notes?: string;
}
interface User_ { id: number; name: string; role: string; }
interface Client_ { id: number; name: string; }

// ── Sortable Card com Botões Rápidos ──
const DealCard: React.FC<{
  deal: Deal;
  onDelete: (id: number) => void;
  onMoveStage: (id: number, stage: string) => void;
}> = ({ deal, onDelete, onMoveStage }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `deal-${deal.id}`, data: { deal, stage: deal.stage }
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="th-card p-3.5 cursor-grab active:cursor-grabbing group hover:border-primary/40 transition-all shadow-sm space-y-2.5">
      <div className="flex justify-between items-start">
        <h4 className="font-bold th-text text-sm leading-tight flex-1 pr-2">{deal.title}</h4>
        <button onClick={(e) => { e.stopPropagation(); onDelete(deal.id); }}
          className="th-muted hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          title="Excluir deal">
          <Trash2 size={13}/>
        </button>
      </div>
      {deal.client_name && (
        <div className="text-xs th-muted">{deal.client_name}</div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-primary font-bold text-sm">
          <DollarSign size={13}/> {fmt(deal.value)}
        </div>
        {deal.assignee_name && (
          <div className="flex items-center gap-1 text-xs th-muted">
            <User size={11}/> {deal.assignee_name.split(' ')[0]}
          </div>
        )}
      </div>

      {/* Ações Rápidas de Estágio (Ganho / Perdido / Mudar) */}
      <div className="pt-2 border-t th-border flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
        <select
          value={deal.stage}
          onChange={(e) => onMoveStage(deal.id, e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg text-[10px] th-text px-1.5 py-1 font-semibold outline-none flex-1 max-w-[105px]"
        >
          {STAGES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          {deal.stage !== 'Ganho' && (
            <button
              onClick={() => onMoveStage(deal.id, 'Ganho')}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all"
              title="Marcar como Ganho (Envia para o Financeiro)"
            >
              <CheckCircle2 size={10} /> Ganho
            </button>
          )}
          {deal.stage !== 'Perdido' && (
            <button
              onClick={() => onMoveStage(deal.id, 'Perdido')}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
              title="Marcar como Perdido (Remove do Financeiro)"
            >
              <XCircle size={10} /> Perdido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Stage Column (Droppable) ──
const StageColumn: React.FC<{
  stage: string;
  deals: Deal[];
  onDelete: (id: number) => void;
  onMoveStage: (id: number, stage: string) => void;
}> = ({ stage, deals, onDelete, onMoveStage }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage }
  });
  const total = deals.reduce((s, d) => s + d.value, 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-64 shrink-0 border rounded-2xl overflow-hidden transition-all ${
        STAGE_COLORS[stage]
      } ${isOver ? 'ring-2 ring-primary ring-offset-2 ring-offset-slate-950 bg-primary/10' : ''}`}
    >
      <div className="px-4 py-3 border-b th-border">
        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${STAGE_BADGE[stage]}`}>{stage}</div>
        <div className="flex justify-between items-center">
          <span className="th-muted text-xs font-medium">{deals.length} deal{deals.length !== 1 ? 's' : ''}</span>
          <span className="th-text font-bold text-xs">{fmt(total)}</span>
        </div>
      </div>
      <SortableContext items={deals.map(d => `deal-${d.id}`)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-3 space-y-3 min-h-[140px] overflow-y-auto max-h-[500px]">
          {deals.length === 0 ? (
            <div className="h-full min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-slate-700/40 rounded-xl p-3 text-center">
              <span className="text-[11px] th-muted font-medium">Solte aqui para marcar como</span>
              <span className={`text-xs font-bold mt-1 ${STAGE_BADGE[stage]}`}>{stage}</span>
            </div>
          ) : (
            deals.map(deal => (
              <DealCard key={deal.id} deal={deal} onDelete={onDelete} onMoveStage={onMoveStage} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const CRMKanban: React.FC = () => {
  const [deals, setDeals]     = useState<Deal[]>([]);
  const [users, setUsers]     = useState<User_[]>([]);
  const [clients, setClients] = useState<Client_[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [form, setForm]       = useState({ title: '', client_id: '', value: '', stage: 'Novo Lead', assignee_id: '', notes: '' });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [d, u, c] = await Promise.all([
        fetch('http://localhost:3001/api/deals').then(r => r.json()),
        fetch('http://localhost:3001/api/users').then(r => r.json()),
        fetch('http://localhost:3001/api/crm/clients').then(r => r.json()),
      ]);
      setDeals(Array.isArray(d) ? d : []);
      setUsers(Array.isArray(u) ? u : []);
      setClients(Array.isArray(c) ? c : []);
    } catch (err) {
      console.error('Erro ao carregar dados do CRM:', err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find(d => `deal-${d.id}` === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleMoveStage = async (dealId: number, targetStage: string) => {
    // Atualização otimista imediata na UI
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: targetStage } : d));

    try {
      const res = await fetch(`http://localhost:3001/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage })
      });
      if (res.ok) {
        // Recarrega do servidor para atualizar totais de Pipeline e Ganho
        loadAll();
      } else {
        console.error('Falha ao atualizar deal');
      }
    } catch (err) {
      console.error('Erro ao mover estágio:', err);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);
    if (!over) return;

    const dealId = parseInt(String(active.id).replace('deal-', ''));
    if (!dealId) return;

    let targetStage: string | undefined;

    // Caso 1: Soltou direto na coluna (useDroppable)
    if (STAGES.includes(String(over.id))) {
      targetStage = String(over.id);
    }
    // Caso 2: over.data contém o estágio da coluna
    else if (over.data?.current?.stage) {
      targetStage = over.data.current.stage;
    }
    // Caso 3: Soltou em cima de outro card
    else if (String(over.id).startsWith('deal-')) {
      const overDealId = parseInt(String(over.id).replace('deal-', ''));
      const targetDeal = deals.find(d => d.id === overDealId);
      targetStage = targetDeal?.stage;
    }

    if (!targetStage || !STAGES.includes(targetStage)) return;

    await handleMoveStage(dealId, targetStage);
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3001/api/deals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, value: parseFloat(form.value) || 0 })
    });
    const data = await res.json();
    setDeals(prev => [...prev, data]);
    setForm({ title: '', client_id: '', value: '', stage: 'Novo Lead', assignee_id: '', notes: '' });
    setShowAdd(false);
    loadAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este deal?')) return;
    await fetch(`http://localhost:3001/api/deals/${id}`, { method: 'DELETE' });
    setDeals(prev => prev.filter(d => d.id !== id));
  };

  const totalPipeline = deals.filter(d => d.stage !== 'Ganho' && d.stage !== 'Perdido').reduce((s, d) => s + d.value, 0);
  const totalWon = deals.filter(d => d.stage === 'Ganho').reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b th-border shrink-0">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-bold th-text">CRM — Pipeline Kanban</h2>
          <div className="flex gap-4 text-sm">
            <span className="th-muted">Pipeline: <span className="th-text font-bold">{fmt(totalPipeline)}</span></span>
            <span className="th-muted">Ganho: <span className="text-emerald-500 font-bold">{fmt(totalWon)}</span></span>
            <span className="th-muted">Deals: <span className="text-primary font-bold">{deals.length}</span></span>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors">
          <PlusCircle size={16}/> Novo Deal
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full">
            {STAGES.map(stage => (
              <StageColumn key={stage} stage={stage}
                deals={deals.filter(d => d.stage === stage)}
                onDelete={handleDelete}
                onMoveStage={handleMoveStage}/>
            ))}
          </div>
          <DragOverlay>
            {activeDeal && (
              <div className="th-card p-4 shadow-2xl border border-primary opacity-90 w-60">
                <h4 className="font-bold th-text text-sm">{activeDeal.title}</h4>
                <div className="text-primary font-bold text-sm mt-2">{fmt(activeDeal.value)}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modal Add Deal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="th-card w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b th-border">
              <h3 className="font-bold th-text">Novo Deal / Oportunidade</h3>
              <button onClick={() => setShowAdd(false)} className="th-muted hover:text-rose-500 transition-colors"><X size={18}/></button>
            </div>
            <form onSubmit={handleAddDeal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium th-muted mb-1">Título do Deal *</label>
                <input required className="th-input"
                  placeholder="Ex: Projeto E-commerce Marca X" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium th-muted mb-1">Valor (R$)</label>
                  <input type="number" step="100" className="th-input"
                    placeholder="5000" value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}/>
                </div>
                <div>
                  <label className="block text-xs font-medium th-muted mb-1">Estágio</label>
                  <select className="th-input" value={form.stage}
                    onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium th-muted mb-1">Cliente</label>
                <select className="th-input" value={form.client_id}
                  onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">Selecionar Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium th-muted mb-1">Responsável</label>
                <select className="th-input" value={form.assignee_id}
                  onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
                  <option value="">Selecionar Responsável...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium th-muted mb-1">Observações</label>
                <textarea rows={2} className="th-input"
                  placeholder="Detalhes da proposta..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-sm th-muted hover:th-text transition-colors">Cancelar</button>
                <button type="submit"
                  className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors">
                  Criar Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMKanban;
