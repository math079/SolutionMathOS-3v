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
        // Update existing user
        await fetch(`http://localhost:3001/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            salary: parseFloat(form.salary) || 0
          })
        });
      } else {
        // Create new user
        await fetch('http://localhost:3001/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            salary: parseFloat(form.salary) || 0
          })
        });
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (e) {
      console.error("Erro ao salvar usuário:", e);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este funcionário da equipe?")) return;
    try {
      await fetch(`http://localhost:3001/api/users/${id}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== id));
    } catch (e) {
      console.error("Erro ao deletar usuário:", e);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      role: user.role || '',
      email: user.email || '',
      phone: user.phone || '',
      contract_type: user.contract_type || 'PJ',
      salary: user.salary ? String(user.salary) : '0',
      status: user.status || 'Ativo',
      hired_at: user.hired_at || new Date().toISOString().split('T')[0]
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

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

    const matchesContract = filterContract === 'all' || u.contract_type === filterContract;
    const matchesStatus   = filterStatus === 'all' || u.status === filterStatus;

    return matchesSearch && matchesContract && matchesStatus;
  });

  // KPIs
  const totalEmployees = users.length;
  const activeEmployees = users.filter(u => u.status === 'Ativo' || !u.status).length;
  const totalPayroll   = users.reduce((sum, u) => sum + (u.salary || 0), 0);
  const avgSalary      = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
  const pjCount        = users.filter(u => u.contract_type === 'PJ').length;
  const cltCount       = users.filter(u => u.contract_type === 'CLT').length;

  const statusBadgeClass = (st?: string) => {
    switch (st) {
      case 'Ativo': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'De Férias': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Licença': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Inativo': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  return (
    <div className="p-6 bg-transparent flex-1 overflow-y-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-primary" size={24} /> Recursos Humanos & Gestão de Equipe
          </h3>
          <p className="text-white/40 text-sm mt-1">Gestão de colaboradores, folha de pagamento e contratos</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingUser(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black text-sm font-bold rounded-xl shadow-neon hover:bg-secondary transition-colors"
        >
          <UserPlus size={16} /> Cadastrar Colaborador
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-white/40 text-xs font-semibold">Total de Colaboradores</span>
            <Users size={18} className="text-primary" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{totalEmployees}</div>
          <div className="text-xs text-primary font-medium">{activeEmployees} ativos na operação</div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-white/40 text-xs font-semibold">Folha Mensal Estimada</span>
            <DollarSign size={18} className="text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-1">{fmt(totalPayroll)}</div>
          <div className="text-xs text-white/40">Média: {fmt(avgSalary)}/pessoa</div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-white/40 text-xs font-semibold">Modelos de Contrato</span>
            <Briefcase size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mb-1">{pjCount} PJ <span className="text-sm font-normal text-white/50">/ {cltCount} CLT</span></div>
          <div className="text-xs text-white/40">Flexibilidade na contratação</div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-white/40 text-xs font-semibold">Taxa de Operação</span>
            <CheckCircle2 size={18} className="text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-1">
            {totalEmployees > 0 ? `${Math.round((activeEmployees / totalEmployees) * 100)}%` : '100%'}
          </div>
          <div className="text-xs text-white/40">Equipe em produção</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por nome, cargo ou e-mail..."
            className="w-full pl-9 pr-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Contract Filter */}
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-xs">
            <Filter size={14} className="text-primary" />
            <span className="text-white/50 font-semibold">Contrato:</span>
            <select
              value={filterContract}
              onChange={e => setFilterContract(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#111]">Todos</option>
              {CONTRACT_TYPES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-xs">
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-white/50 font-semibold">Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#111]">Todos</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-[#111]">{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto bg-black/30 rounded-xl border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3.5 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Colaborador</th>
              <th className="py-3.5 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Cargo / Função</th>
              <th className="py-3.5 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Contrato</th>
              <th className="py-3.5 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Salário / Remuneração</th>
              <th className="py-3.5 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
              <th className="py-3.5 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-white/50">Carregando lista de colaboradores...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-white/50">Nenhum colaborador encontrado com os filtros selecionados.</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white/90 text-sm">{user.name}</div>
                    <div className="text-xs text-white/40 flex items-center gap-3 mt-0.5">
                      {user.email && <span className="flex items-center gap-1"><Mail size={11} className="text-primary"/> {user.email}</span>}
                      {user.phone && <span className="flex items-center gap-1"><Phone size={11} className="text-white/30"/> {user.phone}</span>}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-primary/90 font-medium">
                    {user.role}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-semibold text-white/80">
                      {user.contract_type || 'PJ'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-sm font-bold text-green-400">
                    {fmt(user.salary || 0)} <span className="text-xs font-normal text-white/40">/mês</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusBadgeClass(user.status)}`}>
                      {user.status || 'Ativo'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-white/30 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-white/5"
                      title="Editar Colaborador"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-white/30 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-primary" />
                {editingUser ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1 block">Nome Completo *</label>
                <input
                  type="text" required placeholder="Ex: Lucas Ferreira"
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">Cargo / Função *</label>
                  <input
                    type="text" required placeholder="Ex: Desenvolvedor Senior"
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
                    value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">Modelo Contratual</label>
                  <select
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
                    value={form.contract_type} onChange={e => setForm({ ...form, contract_type: e.target.value })}
                  >
                    {CONTRACT_TYPES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">E-mail Corporativo</label>
                  <input
                    type="email" placeholder="nome@solutionmath.com"
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">Telefone / WhatsApp</label>
                  <input
                    type="text" placeholder="(11) 99999-0000"
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">Remuneração Mensal (R$)</label>
                  <input
                    type="number" placeholder="8500"
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
                    value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1 block">Status</label>
                  <select
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
                    value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-[#111]">{s}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-black font-bold rounded-xl shadow-neon hover:bg-secondary transition-colors mt-2"
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
