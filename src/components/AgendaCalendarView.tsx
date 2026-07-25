import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, Clock, PlusCircle, Trash2,
  CheckCircle, ChevronLeft, ChevronRight, User, Tag, X, AlertCircle
} from 'lucide-react';

interface AgendaEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  category: string;
  assignee_id?: number;
  assignee_name?: string;
  status: string;
}

interface User {
  id: number;
  name: string;
}

const CATEGORIES = ['Cliente', 'Projeto', 'Vendas', 'Dev', 'Interno', 'Financeiro'];

const AgendaCalendarView: React.FC = () => {
  const [events, setEvents]       = useState<AgendaEvent[]>([]);
  const [users, setUsers]         = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedDate, setSelectedDate] = useState('2026-07-23');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: '', date: '2026-07-23', time: '10:00',
    category: 'Projeto', assignee_id: '', status: 'Agendado'
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [eventsRes, usersRes] = await Promise.all([
        fetch('http://localhost:3001/api/agenda'),
        fetch('http://localhost:3001/api/users')
      ]);
      const eventsData = await eventsRes.json();
      const usersData  = await usersRes.json();
      setEvents(eventsData);
      setUsers(usersData);
      if (usersData.length > 0 && form.assignee_id === '') {
        setForm(prev => ({ ...prev, assignee_id: String(usersData[0].id) }));
      }
    } catch (e) {
      console.error("Erro ao carregar agenda:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:3001/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setShowModal(false);
      setForm(prev => ({ ...prev, title: '' }));
      fetchAll();
    } catch (e) {
      console.error("Erro ao criar compromisso:", e);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`http://localhost:3001/api/agenda/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setEvents(events.map(ev => ev.id === id ? { ...ev, status } : ev));
    } catch (e) {
      console.error("Erro ao atualizar status:", e);
    }
  };

  const deleteEvent = async (id: number) => {
    if (!confirm("Excluir este compromisso da agenda?")) return;
    try {
      await fetch(`http://localhost:3001/api/agenda/${id}`, { method: 'DELETE' });
      setEvents(events.filter(ev => ev.id !== id));
    } catch (e) {
      console.error("Erro ao deletar evento:", e);
    }
  };

  const selectedDateEvents = events.filter(ev => ev.date === selectedDate);

  return (
    <div className="p-6 bg-transparent flex-1 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b th-border pb-5">
        <div>
          <h3 className="text-2xl font-bold th-text flex items-center gap-2">
            <CalendarIcon className="text-primary" size={24} /> Agenda & Calendário de Operações (2026)
          </h3>
          <p className="th-muted text-sm mt-1">Previsibilidade diária de entregas, reuniões e marcos operacionais</p>
        </div>
        <button
          onClick={() => { setForm(prev => ({ ...prev, date: selectedDate })); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors"
        >
          <PlusCircle size={16} /> Novo Compromisso / Milestone
        </button>
      </div>

      {/* Date Quick Selector Bar */}
      <div className="th-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h4 className="text-sm font-bold th-text flex items-center gap-2">
            <Clock size={16} className="text-primary" /> Selecionar Data de Operações (Ano 2026)
          </h4>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="th-input text-sm font-bold cursor-pointer"
            />
          </div>
        </div>

        {/* Quick Date Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { date: '2026-07-22', label: 'Hoje (22/07/2026)' },
            { date: '2026-07-23', label: 'Amanhã (23/07/2026)' },
            { date: '2026-07-24', label: 'Sexta (24/07/2026)' },
            { date: '2026-07-25', label: 'Sábado (25/07/2026)' },
            { date: '2026-07-28', label: 'Terça (28/07/2026)' },
            { date: '2026-07-31', label: 'Fim do Mês (31/07/2026)' },
          ].map(d => (
            <button
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedDate === d.date
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'th-surface2 th-muted border-th-border hover:text-primary'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events for Selected Day + All Events Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Day Column */}
        <div className="lg:col-span-1 th-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4 border-b th-border pb-3">
              <h4 className="text-base font-bold th-text flex items-center gap-2">
                Compromissos do Dia
              </h4>
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20">
                {selectedDate.split('-').reverse().join('/')}
              </span>
            </div>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8 th-muted text-sm">
                  Nenhum compromisso agendado para esta data.
                  <button
                    onClick={() => { setForm(prev => ({ ...prev, date: selectedDate })); setShowModal(true); }}
                    className="block mx-auto mt-3 text-xs text-primary hover:underline font-bold"
                  >
                    + Agendar para este dia
                  </button>
                </div>
              ) : (
                selectedDateEvents.map(ev => (
                  <div
                    key={ev.id}
                    className="p-4 th-surface2 border th-border rounded-xl hover:border-primary/40 transition-all space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold th-text text-sm">{ev.title}</h5>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {ev.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs th-muted">
                      <span className="flex items-center gap-1"><Clock size={12} className="text-primary"/> {ev.time}</span>
                      <span className="flex items-center gap-1"><Tag size={12}/> {ev.category}</span>
                      {ev.assignee_name && <span className="flex items-center gap-1"><User size={12}/> {ev.assignee_name}</span>}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t th-border">
                      <select
                        value={ev.status}
                        onChange={e => updateStatus(ev.id, e.target.value)}
                        className="th-input text-xs py-0.5 px-2 w-auto"
                      >
                        <option value="Agendado" className="th-surface th-text">Agendado</option>
                        <option value="Em Andamento" className="th-surface th-text">Em Andamento</option>
                        <option value="Concluído" className="th-surface th-text">Concluído</option>
                      </select>
                      <button onClick={() => deleteEvent(ev.id)} className="th-muted hover:text-rose-500 text-xs transition-colors">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* All Upcoming Events Schedule Column */}
        <div className="lg:col-span-2 th-card p-5">
          <h4 className="text-base font-bold th-text mb-4 border-b th-border pb-3 flex items-center justify-between">
            <span>Visão Geral da Agenda (2026)</span>
            <span className="text-xs font-normal th-muted">{events.length} eventos no total</span>
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b th-border th-surface2">
                  <th className="py-2.5 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider">Data & Hora</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider">Compromisso / Marco</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider">Categoria</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider">Responsável</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold th-muted uppercase tracking-wider">Status</th>
                  <th className="py-2.5 px-3 text-right text-xs font-semibold th-muted uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center th-muted">Carregando eventos...</td></tr>
                ) : events.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center th-muted">Nenhum evento registrado.</td></tr>
                ) : (
                  events.map(ev => (
                    <tr key={ev.id} className="border-b th-border hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-3 th-text font-mono text-xs whitespace-nowrap">
                        <div className="font-bold text-primary">{ev.date.split('-').reverse().join('/')}</div>
                        <div className="th-muted">{ev.time}</div>
                      </td>
                      <td className="py-3 px-3 font-bold th-text">{ev.title}</td>
                      <td className="py-3 px-3 text-xs th-muted">
                        <span className="px-2 py-0.5 th-surface2 border th-border rounded">
                          {ev.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs th-muted">{ev.assignee_name || 'Equipe'}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          ev.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button onClick={() => deleteEvent(ev.id)} className="th-muted hover:text-rose-500 p-1 transition-colors">
                          <Trash2 size={15}/>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="th-card p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b th-border pb-3">
              <h3 className="text-lg font-bold th-text flex items-center gap-2">
                <CalendarIcon size={18} className="text-primary" /> Novo Compromisso na Agenda
              </h3>
              <button onClick={() => setShowModal(false)} className="th-muted hover:text-rose-500 transition-colors"><X size={18}/></button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Título / Marco *</label>
                <input
                  type="text" required placeholder="Ex: Reunião com Cliente / Entrega Sprint"
                  className="th-input"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Data *</label>
                  <input
                    type="date" required
                    className="th-input"
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Horário *</label>
                  <input
                    type="time" required
                    className="th-input"
                    value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Categoria</label>
                  <select
                    className="th-input"
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="th-surface th-text">{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Responsável</label>
                  <select
                    className="th-input"
                    value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}
                  >
                    {users.map(u => <option key={u.id} value={u.id} className="th-surface th-text">{u.name}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors mt-2"
              >
                Agendar Compromisso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaCalendarView;
