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
  'Novo Lead':         'border-blue-500/40 bg-blue-500/5',
  'Contato Feito':     'border-purple-500/40 bg-purple-500/5',
  'Proposta Enviada':  'border-amber-500/40 bg-amber-500/5',
  'Negociação':        'border-orange-500/40 bg-orange-500/5',
  'Ganho':             'border-green-500/40 bg-green-500/5',
  'Perdido':           'border-red-500/40 bg-red-500/5',
};
const STAGE_BADGE: Record<string, string> = {
  'Novo Lead': 'text-blue-400', 'Contato Feito': 'text-purple-400',
  'Proposta Enviada': 'text-amber-400', 'Negociação': 'text-orange-400',
  'Ganho': 'text-green-400', 'Perdido': 'text-red-400',
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
      className="bg-[#0f0f13] border border-white/10 rounded-xl p-4 cursor-grab active:cursor-grabbing group hover:border-primary/30 transition-all">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-white/90 text-sm leading-tight flex-1 pr-2">{deal.title}</h4>
        <button onClick={(e) => { e.stopPropagation(); onDelete(deal.id); }}
          className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
          <Trash2 size={13}/>
        </button>
      </div>
      {deal.client_name && (
        <div className="text-xs text-white/40 mb-3">{deal.client_name}</div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-primary font-bold text-sm">
          <DollarSign size={13}/> {fmt(deal.value)}
        </div>
        {deal.assignee_name && (
          <div className="flex items-center gap-1 text-xs text-white/40">
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
      <div className="px-4 py-3 border-b border-white/10">
        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${STAGE_BADGE[stage]}`}>{stage}</div>
        <div className="flex justify-between items-center">
          <span className="text-white/40 text-xs">{deals.length} deal{deals.length !== 1 ? 's' : ''}</span>
          <span className="text-white font-bold text-xs">{fmt(total)}</span>
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-bold text-white">CRM — Pipeline Kanban</h2>
          <div className="flex gap-4 text-sm">
            <span className="text-white/40">Pipeline: <span className="text-white font-bold">{fmt(totalPipeline)}</span></span>
            <span className="text-white/40">Ganho: <span className="text-green-400 font-bold">{fmt(totalWon)}</span></span>
            <span className="text-white/40">Deals: <span className="text-primary font-bold">{deals.length}</span></span>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-bold rounded-xl shadow-neon hover:bg-secondary transition-colors">
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
              <div className="bg-[#0f0f13] border border-primary/50 rounded-xl p-4 shadow-neon w-56 opacity-95">
                <div className="font-bold text-white text-sm mb-1">{activeDeal.title}</div>
                <div className="text-primary font-bold text-sm">{fmt(activeDeal.value)}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Deal Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white">Novo Deal</h3>
              <button onClick={() => setShowAdd(false)} className="text-white/40 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleAddDeal} className="space-y-4">
              <input type="text" required placeholder="Título do Negócio" value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"/>
              <div className="flex gap-3">
                <input type="number" placeholder="Valor (R$)" value={form.value}
                  onChange={e => setForm({...form, value: e.target.value})}
                  className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"/>
                <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}
                  className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none">
                  {STAGES.map(s => <option key={s} value={s} className="bg-[#111]">{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}
                  className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none">
                  <option value="" className="bg-[#111]">Selecionar Cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id} className="bg-[#111]">{c.name}</option>)}
                </select>
                <select value={form.assignee_id} onChange={e => setForm({...form, assignee_id: e.target.value})}
                  className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none">
                  <option value="" className="bg-[#111]">Responsável</option>
                  {users.map(u => <option key={u.id} value={u.id} className="bg-[#111]">{u.name}</option>)}
                </select>
              </div>
              <textarea placeholder="Notas / Contexto" value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})} rows={2}
                className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none resize-none"/>
              <button type="submit"
                className="w-full py-3 bg-primary text-black font-bold rounded-xl shadow-neon hover:bg-secondary transition-colors">
                Criar Deal no Pipeline
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMKanban;
