import React, { useState, useEffect } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusCircle, X, DollarSign, User, Trash2 } from 'lucide-react';

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

// ── Sortable Card ──
const DealCard: React.FC<{ deal: Deal; onDelete: (id: number) => void }> = ({ deal, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `deal-${deal.id}`, data: { deal }
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="th-card p-4 cursor-grab active:cursor-grabbing group hover:border-primary/40 transition-all shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold th-text text-sm leading-tight flex-1 pr-2">{deal.title}</h4>
        <button onClick={(e) => { e.stopPropagation(); onDelete(deal.id); }}
          className="th-muted hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
          <Trash2 size={13}/>
        </button>
      </div>
      {deal.client_name && (
        <div className="text-xs th-muted mb-3">{deal.client_name}</div>
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
    </div>
  );
};

// ── Stage Column ──
const StageColumn: React.FC<{ stage: string; deals: Deal[]; onDelete: (id: number) => void }> = ({ stage, deals, onDelete }) => {
  const total = deals.reduce((s, d) => s + d.value, 0);
  return (
    <div className={`flex flex-col w-60 shrink-0 border rounded-2xl overflow-hidden ${STAGE_COLORS[stage]}`}>
      <div className="px-4 py-3 border-b th-border">
        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${STAGE_BADGE[stage]}`}>{stage}</div>
        <div className="flex justify-between items-center">
          <span className="th-muted text-xs font-medium">{deals.length} deal{deals.length !== 1 ? 's' : ''}</span>
          <span className="th-text font-bold text-xs">{fmt(total)}</span>
        </div>
      </div>
      <SortableContext items={deals.map(d => `deal-${d.id}`)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-3 space-y-3 min-h-[120px] overflow-y-auto max-h-[480px]">
          {deals.map(deal => <DealCard key={deal.id} deal={deal} onDelete={onDelete}/>)}
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [d, u, c] = await Promise.all([
      fetch('http://localhost:3001/api/deals').then(r => r.json()),
      fetch('http://localhost:3001/api/users').then(r => r.json()),
      fetch('http://localhost:3001/api/crm/clients').then(r => r.json()),
    ]);
    setDeals(d); setUsers(u); setClients(c);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find(d => `deal-${d.id}` === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);
    if (!over) return;

    const dealId = parseInt(String(active.id).replace('deal-', ''));
    const newStage = over.data?.current?.sortable?.containerId
      ? deals.find(d => `deal-${d.id}` === String(over.id))?.stage
      : String(over.id);

    if (!newStage) return;
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
    await fetch(`http://localhost:3001/api/deals/${dealId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage })
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const dealId = parseInt(String(active.id).replace('deal-', ''));
    const overId  = String(over.id);
    const targetStage = STAGES.includes(overId) ? overId
      : deals.find(d => `deal-${d.id}` === overId)?.stage;
    if (!targetStage) return;
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === targetStage) return;
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: targetStage } : d));
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

  const totalPipeline = deals.reduce((s, d) => s + d.value, 0);
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
          onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
          <div className="flex gap-4 h-full">
            {STAGES.map(stage => (
              <StageColumn key={stage} stage={stage}
                deals={deals.filter(d => d.stage === stage)}
                onDelete={handleDelete}/>
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
