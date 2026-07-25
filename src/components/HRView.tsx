import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Trash2, Search, Filter, Mail, Phone,
  Briefcase, DollarSign, Calendar, ShieldCheck, CheckCircle2,
  Clock, AlertCircle, Edit3, X
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  contract_type?: string;
  salary?: number;
  status?: string;
  hired_at?: string;
}

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

const CONTRACT_TYPES = ['PJ', 'CLT', 'Sócio', 'Estágio', 'Freelancer'];
const STATUS_OPTIONS  = ['Ativo', 'De Férias', 'Licença', 'Inativo'];

const HRView: React.FC = () => {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterContract, setFilterContract] = useState('all');
  const [filterStatus, setFilterStatus]     = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [form, setForm] = useState({
    name: '', role: '', email: '', phone: '',
    contract_type: 'PJ', salary: '', status: 'Ativo',
    hired_at: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error("Erro ao buscar equipe:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await fetch(`http://localhost:3001/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            role: form.role,
            email: form.email,
            phone: form.phone,
            contract_type: form.contract_type,
            salary: parseFloat(form.salary) || 0,
            status: form.status,
            hired_at: form.hired_at
          })
        });
      } else {
        await fetch('http://localhost:3001/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            role: form.role,
            email: form.email,
            phone: form.phone,
            contract_type: form.contract_type,
            salary: parseFloat(form.salary) || 0,
            status: form.status,
            hired_at: form.hired_at
          })
        });
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (e) {
      console.error("Erro ao salvar colaborador:", e);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Remover este colaborador permanentemente?")) return;
    try {
      await fetch(`http://localhost:3001/api/users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e) {
      console.error("Erro ao remover:", e);
    }
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setForm({
      name: u.name || '',
      role: u.role || '',
      email: u.email || '',
      phone: u.phone || '',
      contract_type: u.contract_type || 'PJ',
      salary: u.salary ? String(u.salary) : '',
      status: u.status || 'Ativo',
      hired_at: u.hired_at || new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      name: '', role: '', email: '', phone: '',
      contract_type: 'PJ', salary: '', status: 'Ativo',
      hired_at: new Date().toISOString().split('T')[0]
    });
  };

  // Filtered users list
  const filteredUsers = users.filter(u => {
    const matchesSearch = search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

    const matchesContract = filterContract === 'all' || u.contract_type === filterContract;
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;

    return matchesSearch && matchesContract && matchesStatus;
  });

  // KPIs
  const totalEmployees = users.length;
  const activeEmployees = users.filter(u => u.status === 'Ativo' || !u.status).length;
  const totalPayroll   = users.reduce((sum, u) => sum + (parseFloat(String(u.salary || 0)) || 0), 0);
  const avgSalary      = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
  const pjCount        = users.filter(u => u.contract_type === 'PJ').length;
  const cltCount       = users.filter(u => u.contract_type === 'CLT').length;

  const statusBadgeClass = (st?: string) => {
    switch (st) {
      case 'Ativo': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'De Férias': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800';
      case 'Licença': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-300 dark:border-blue-800';
      case 'Inativo': return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-300 dark:border-rose-800';
      default: return 'th-surface2 th-muted border-th-border';
    }
  };

  return (
    <div className="p-6 bg-transparent flex-1 overflow-y-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b th-border pb-5">
        <div>
          <h3 className="text-2xl font-bold th-text flex items-center gap-2">
            <Users className="text-primary" size={24} /> Recursos Humanos & Gestão de Equipe
          </h3>
          <p className="th-muted text-sm mt-1">Gestão de colaboradores, folha de pagamento e contratos</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingUser(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors"
        >
          <UserPlus size={16} /> Cadastrar Colaborador
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="th-card p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="th-muted text-xs font-semibold">Total de Colaboradores</span>
            <Users size={18} className="text-primary" />
          </div>
          <div className="text-3xl font-bold th-text mb-1">{totalEmployees}</div>
          <div className="text-xs text-primary font-medium">{activeEmployees} ativos na operação</div>
        </div>

        <div className="th-card p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="th-muted text-xs font-semibold">Folha Mensal Estimada</span>
            <DollarSign size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-500 mb-1">{fmt(totalPayroll)}</div>
          <div className="text-xs th-muted">Média: {fmt(avgSalary)}/pessoa</div>
        </div>

        <div className="th-card p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="th-muted text-xs font-semibold">Modelos de Contrato</span>
            <Briefcase size={18} className="text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-500 mb-1">{pjCount} PJ <span className="text-sm font-normal th-muted">/ {cltCount} CLT</span></div>
          <div className="text-xs th-muted">Flexibilidade na contratação</div>
        </div>

        <div className="th-card p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="th-muted text-xs font-semibold">Taxa de Operação</span>
            <CheckCircle2 size={18} className="text-violet-500" />
          </div>
          <div className="text-3xl font-bold text-violet-500 mb-1">
            {totalEmployees > 0 ? `${Math.round((activeEmployees / totalEmployees) * 100)}%` : '100%'}
          </div>
          <div className="text-xs th-muted">Equipe em produção</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 th-card p-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 th-muted" />
          <input
            type="text"
            placeholder="Buscar por nome, cargo ou e-mail..."
            className="th-input pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Contract Filter */}
          <div className="flex items-center gap-2 th-surface2 border th-border px-3 py-2 rounded-xl text-xs">
            <Filter size={14} className="text-primary" />
            <span className="th-muted font-semibold">Contrato:</span>
            <select
              value={filterContract}
              onChange={e => setFilterContract(e.target.value)}
              className="bg-transparent th-text font-bold outline-none cursor-pointer"
            >
              <option value="all" className="th-surface th-text">Todos</option>
              {CONTRACT_TYPES.map(c => <option key={c} value={c} className="th-surface th-text">{c}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 th-surface2 border th-border px-3 py-2 rounded-xl text-xs">
            <ShieldCheck size={14} className="text-primary" />
            <span className="th-muted font-semibold">Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-transparent th-text font-bold outline-none cursor-pointer"
            >
              <option value="all" className="th-surface th-text">Todos</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s} className="th-surface th-text">{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="th-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b th-border th-surface2">
              <th className="py-3.5 px-4 text-xs font-semibold th-muted uppercase tracking-wider">Colaborador</th>
              <th className="py-3.5 px-4 text-xs font-semibold th-muted uppercase tracking-wider">Cargo / Função</th>
              <th className="py-3.5 px-4 text-xs font-semibold th-muted uppercase tracking-wider">Contrato</th>
              <th className="py-3.5 px-4 text-xs font-semibold th-muted uppercase tracking-wider">Salário / Remuneração</th>
              <th className="py-3.5 px-4 text-xs font-semibold th-muted uppercase tracking-wider">Status</th>
              <th className="py-3.5 px-4 text-xs font-semibold th-muted uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center th-muted">Carregando lista de colaboradores...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center th-muted">Nenhum colaborador encontrado com os filtros selecionados.</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="border-b th-border hover:bg-primary/5 transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="font-bold th-text text-sm">{user.name}</div>
                    <div className="text-xs th-muted flex items-center gap-3 mt-0.5">
                      {user.email && <span className="flex items-center gap-1"><Mail size={11} className="text-primary"/> {user.email}</span>}
                      {user.phone && <span className="flex items-center gap-1"><Phone size={11} className="th-muted"/> {user.phone}</span>}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-primary font-medium">
                    {user.role}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 th-surface2 border th-border rounded-md text-xs font-semibold th-text">
                      {user.contract_type || 'PJ'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-sm font-bold text-emerald-500">
                    {fmt(user.salary || 0)} <span className="text-xs font-normal th-muted">/mês</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusBadgeClass(user.status)}`}>
                      {user.status || 'Ativo'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(user)}
                      className="th-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10"
                      title="Editar Colaborador"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="th-muted hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10"
                      title="Remover Colaborador"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="th-card p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b th-border pb-3">
              <h3 className="text-lg font-bold th-text flex items-center gap-2">
                <Users size={18} className="text-primary" />
                {editingUser ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button onClick={() => setShowModal(false)} className="th-muted hover:text-rose-500 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Nome Completo *</label>
                <input
                  type="text" required placeholder="Ex: Lucas Ferreira"
                  className="th-input"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Cargo / Função *</label>
                  <input
                    type="text" required placeholder="Ex: Desenvolvedor Senior"
                    className="th-input"
                    value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Modelo Contratual</label>
                  <select
                    className="th-input"
                    value={form.contract_type} onChange={e => setForm({ ...form, contract_type: e.target.value })}
                  >
                    {CONTRACT_TYPES.map(c => <option key={c} value={c} className="th-surface th-text">{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">E-mail Corporativo</label>
                  <input
                    type="email" placeholder="nome@solutionmath.com"
                    className="th-input"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Telefone / WhatsApp</label>
                  <input
                    type="text" placeholder="(11) 99999-0000"
                    className="th-input"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Remuneração Mensal (R$)</label>
                  <input
                    type="number" placeholder="8500"
                    className="th-input"
                    value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Status</label>
                  <select
                    className="th-input"
                    value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} className="th-surface th-text">{s}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors mt-2"
              >
                {editingUser ? 'Atualizar Colaborador' : 'Cadastrar Colaborador'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRView;
