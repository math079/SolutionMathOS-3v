import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Trash2, Search, Filter, Mail, Phone,
  Briefcase, DollarSign, Calendar, ShieldCheck, CheckCircle2,
  Clock, AlertCircle, Edit3, X, Building, Plus
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  contract_type?: string;
  salary?: number;
  equity_percentage?: number;
  status?: string;
  hired_at?: string;
}

interface Contractor {
  id: number;
  company_name: string;
  service_type: string;
  monthly_cost: number;
  contract_status?: string;
  due_day?: number;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
}

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

const CONTRACT_TYPES = ['PJ', 'CLT', 'Sócio', 'Estágio', 'Freelancer'];
const STATUS_OPTIONS  = ['Ativo', 'De Férias', 'Licença', 'Inativo'];

const HRView: React.FC = () => {
  const [activeHRTab, setActiveHRTab] = useState<'employees' | 'contractors'>('employees');
  const [users, setUsers]       = useState<User[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterContract, setFilterContract] = useState('all');
  const [filterStatus, setFilterStatus]     = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Modal Terceirizados
  const [showContractorModal, setShowContractorModal] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [contractorForm, setContractorForm] = useState({
    company_name: '',
    service_type: 'Assessoria & Consultoria',
    monthly_cost: '',
    contract_status: 'Ativo',
    due_day: '10',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    notes: ''
  });

  const [form, setForm] = useState({
    name: '', role: '', email: '', phone: '',
    contract_type: 'PJ', salary: '', status: 'Ativo',
    hired_at: new Date().toISOString().split('T')[0],
    equity_percentage: ''
  });

  useEffect(() => { 
    fetchUsers(); 
    fetchContractors();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/users');
      const data = await res.json();
      setUsers(data || []);
    } catch (e) {
      console.error("Erro ao buscar equipe:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchContractors = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/hr/contractors');
      const data = await res.json();
      setContractors(data || []);
    } catch (e) {
      console.error("Erro ao buscar empresas terceirizadas:", e);
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
            equity_percentage: form.equity_percentage ? parseFloat(form.equity_percentage) : null,
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
            equity_percentage: form.equity_percentage ? parseFloat(form.equity_percentage) : null,
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
      hired_at: u.hired_at || new Date().toISOString().split('T')[0],
      equity_percentage: u.equity_percentage ? String(u.equity_percentage) : ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      name: '', role: '', email: '', phone: '',
      contract_type: 'PJ', salary: '', status: 'Ativo',
      hired_at: new Date().toISOString().split('T')[0],
      equity_percentage: ''
    });
  };

  const handleSaveContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorForm.company_name.trim() || !contractorForm.monthly_cost) return;

    try {
      if (editingContractor) {
        await fetch(`http://localhost:3001/api/hr/contractors/${editingContractor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...contractorForm,
            monthly_cost: parseFloat(contractorForm.monthly_cost) || 0
          })
        });
      } else {
        await fetch('http://localhost:3001/api/hr/contractors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...contractorForm,
            monthly_cost: parseFloat(contractorForm.monthly_cost) || 0
          })
        });
      }
      setShowContractorModal(false);
      setEditingContractor(null);
      resetContractorForm();
      fetchContractors();
    } catch (e) {
      console.error("Erro ao salvar prestador terceirizado:", e);
    }
  };

  const handleDeleteContractor = async (id: number) => {
    if (!confirm("Remover esta empresa terceirizada e cancelar despesas no Financeiro?")) return;
    try {
      await fetch(`http://localhost:3001/api/hr/contractors/${id}`, { method: 'DELETE' });
      setContractors(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error("Erro ao remover prestador:", e);
    }
  };

  const openEditContractor = (c: Contractor) => {
    setEditingContractor(c);
    setContractorForm({
      company_name: c.company_name,
      service_type: c.service_type,
      monthly_cost: c.monthly_cost ? String(c.monthly_cost) : '',
      contract_status: c.contract_status || 'Ativo',
      due_day: c.due_day ? String(c.due_day) : '10',
      contact_name: c.contact_name || '',
      contact_email: c.contact_email || '',
      contact_phone: c.contact_phone || '',
      notes: c.notes || ''
    });
    setShowContractorModal(true);
  };

  const resetContractorForm = () => {
    setContractorForm({
      company_name: '',
      service_type: 'Assessoria & Consultoria',
      monthly_cost: '',
      contract_status: 'Ativo',
      due_day: '10',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      notes: ''
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
  const totalPayrollAnnual = totalPayroll * 12;
  const activeContractors = contractors.filter(c => c.contract_status === 'Ativo' || !c.contract_status);
  const totalContractorMonthly = activeContractors.reduce((sum, c) => sum + (parseFloat(String(c.monthly_cost || 0)) || 0), 0);
  const totalContractorAnnual = totalContractorMonthly * 12;
  const totalCombinedMonthly = totalPayroll + totalContractorMonthly;
  const totalCombinedAnnual = totalCombinedMonthly * 12;
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
    <div className="p-3 sm:p-6 bg-transparent flex-1 overflow-y-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b th-border pb-5">
        <div>
          <h3 className="text-2xl font-bold th-text flex items-center gap-2">
            <Users className="text-primary" size={24} /> Recursos Humanos & Gestão de Pessoas
          </h3>
          <p className="th-muted text-sm mt-1">Gestão de equipe interna, prestadores terceirizados e contratos</p>
        </div>
        {activeHRTab === 'employees' ? (
          <button
            onClick={() => { resetForm(); setEditingUser(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors"
          >
            <UserPlus size={16} /> Cadastrar Colaborador
          </button>
        ) : (
          <button
            onClick={() => { resetContractorForm(); setEditingContractor(null); setShowContractorModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Nova Empresa Terceirizada
          </button>
        )}
      </div>

      {/* Sub-abas de RH */}
      <div className="flex items-center gap-2 border-b th-border pb-3">
        <button
          onClick={() => setActiveHRTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeHRTab === 'employees'
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'th-surface2 th-muted border-th-border hover:th-text'
          }`}
        >
          <Users size={14} /> Colaboradores Internos ({users.length})
        </button>
        <button
          onClick={() => setActiveHRTab('contractors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeHRTab === 'contractors'
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'th-surface2 th-muted border-th-border hover:th-text'
          }`}
        >
          <Building size={14} /> Serviços & Empresas Terceirizadas PJ ({contractors.length})
        </button>
      </div>

      {/* KPI Cards com Custo Mensal e Anual */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="th-card p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="th-muted text-xs font-semibold">Total Pessoal & Parceiros</span>
            <Users size={18} className="text-primary" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl truncate font-bold th-text mb-1">{totalEmployees + contractors.length}</div>
          <div className="text-xs text-primary font-medium">{activeEmployees} internos + {activeContractors.length} terceirizados</div>
        </div>

        <div className="th-card p-5 min-w-0">
          <div className="flex justify-between items-start mb-3">
            <span className="th-muted text-xs font-semibold">Folha Interna</span>
            <DollarSign size={18} className="text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl truncate font-bold text-emerald-500 mb-1">{fmt(totalPayroll)} <span className="text-xs font-normal th-muted">/mês</span></div>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Total Anual: {fmt(totalPayrollAnnual)}</div>
        </div>

        <div className="th-card p-5 min-w-0">
          <div className="flex justify-between items-start mb-3">
            <span className="th-muted text-xs font-semibold">Contratos Terceirizados</span>
            <Building size={18} className="text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl truncate font-bold text-amber-500 mb-1">{fmt(totalContractorMonthly)} <span className="text-xs font-normal th-muted">/mês</span></div>
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">Total Anual: {fmt(totalContractorAnnual)}</div>
        </div>

        <div className="th-card p-5 min-w-0">
          <div className="flex justify-between items-start mb-3">
            <span className="th-muted text-xs font-semibold">Custo Total de Operação</span>
            <CheckCircle2 size={18} className="text-violet-500" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl truncate font-bold text-violet-500 mb-1">
            {fmt(totalCombinedMonthly)} <span className="text-xs font-normal th-muted">/mês</span>
          </div>
          <div className="text-xs font-semibold text-violet-600 dark:text-violet-400">Compromisso Anual: {fmt(totalCombinedAnnual)}</div>
        </div>
      </div>

      {/* Financial Sync Status Banner */}
      <div className="th-card p-4 border-l-4 border-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <DollarSign size={18} />
          </div>
          <div>
            <div className="text-sm font-bold th-text flex items-center gap-2">
              Folha Conectada ao Financeiro
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs rounded-full font-semibold border border-emerald-300 dark:border-emerald-800">
                ✓ Sincronizado
              </span>
            </div>
            <div className="text-xs th-muted mt-0.5">
              Os salários dos colaboradores ativos são lançados automaticamente como despesas de <strong>Pessoas</strong> no módulo Financeiro todo mês.
              Qualquer alteração aqui reflete em tempo real no Financeiro 2026.
            </div>
          </div>
        </div>
        <div className="sm:text-right text-left mt-2 sm:mt-0 flex-shrink-0">
          <div className="text-lg font-bold text-rose-500">{fmt(totalPayroll)}</div>
          <div className="text-xs th-muted">custo/mês lançado</div>
        </div>
      </div>

      {/* ── SEÇÃO COLABORADORES INTERNOS ── */}
      {activeHRTab === 'employees' && (
        <>
          {/* Filter and Search Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 th-card p-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 th-muted pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar por nome, cargo ou e-mail..."
            className="th-input th-input-search"
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="th-card p-8 text-center th-muted">Carregando lista de colaboradores...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="th-card p-8 text-center th-muted">Nenhum colaborador encontrado com os filtros selecionados.</div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="th-card p-4 space-y-3">
              <div className="flex justify-between items-start min-w-0 gap-2">
                <div className="min-w-0">
                  <div className="font-bold th-text text-sm truncate">{user.name}</div>
                  <div className="text-xs th-muted flex flex-col gap-1 mt-1">
                    {user.email && <span className="flex items-center gap-1 min-w-0"><Mail size={11} className="text-primary flex-shrink-0"/> <span className="truncate">{user.email}</span></span>}
                    {user.phone && <span className="flex items-center gap-1 min-w-0"><Phone size={11} className="th-muted flex-shrink-0"/> <span className="truncate">{user.phone}</span></span>}
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1">
                  <button onClick={() => openEditModal(user)} className="th-muted hover:text-primary p-1.5 rounded-lg hover:bg-primary/10">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => deleteUser(user.id)} className="th-muted hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs border-t th-border pt-3 mt-3">
                <div>
                  <span className="th-muted block mb-0.5">Cargo</span>
                  <span className="text-primary font-medium">{user.role}</span>
                </div>
                <div>
                  <span className="th-muted block mb-0.5">Contrato</span>
                  <span className="px-2 py-0.5 th-surface2 border th-border rounded-md font-semibold th-text inline-block">
                    {user.contract_type || 'PJ'}
                  </span>
                </div>
                <div>
                  <span className="th-muted block mb-0.5">Salário</span>
                  <div className="font-bold text-emerald-500">{fmt(user.salary || 0)}</div>
                  {(user.status === 'Ativo' || !user.status) && (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <DollarSign size={10} /> Lançado no financeiro
                    </div>
                  )}
                </div>
                <div>
                  <span className="th-muted block mb-0.5">Status</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold border inline-block ${statusBadgeClass(user.status)}`}>
                    {user.status || 'Ativo'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block th-card overflow-hidden">
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
                    <div className="font-bold th-text text-sm flex items-center gap-2">
                      {user.name}
                      {user.equity_percentage && user.equity_percentage > 0 && (
                        <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded text-[10px] uppercase font-bold">
                          {user.equity_percentage}% Sócio
                        </span>
                      )}
                    </div>
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
                  <td className="py-3.5 px-4">
                    <div className="text-sm font-bold text-emerald-500">
                      {fmt(user.salary || 0)} <span className="text-xs font-normal th-muted">/mês</span>
                    </div>
                    <div className="text-[11px] th-muted font-mono">
                      {fmt((user.salary || 0) * 12)} /ano
                    </div>
                    {(user.status === 'Ativo' || !user.status) && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                        <DollarSign size={10} />
                        <span>Lançado no financeiro</span>
                      </div>
                    )}
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
      </>
      )}

      {/* ── SEÇÃO EMPRESAS TERCEIRIZADAS (PJ) ── */}
      {activeHRTab === 'contractors' && (
        <div className="space-y-4">
          <div className="th-card p-4 border-l-4 border-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                <Building size={18} />
              </div>
              <div>
                <div className="text-sm font-bold th-text flex items-center gap-2">
                  Gestão de Empresas & Contratos Terceirizados (PJ)
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs rounded-full font-semibold border border-amber-300 dark:border-amber-800">
                    Sincronização Ativa com Financeiro
                  </span>
                </div>
                <div className="text-xs th-muted mt-0.5">
                  Ao cadastrar uma empresa parceira (contabilidade, assessoria, marketing, infraestrutura), o custo é lançado automaticamente no <strong>Financeiro Geral (DRE)</strong> e entra na lista de <strong>Gastos Recorrentes</strong> da empresa.
                </div>
              </div>
            </div>
            <div className="sm:text-right text-left mt-2 sm:mt-0 flex-shrink-0">
              <div className="text-lg font-bold text-amber-500">{fmt(totalContractorMonthly)}/mês</div>
              <div className="text-xs th-muted">Custo Anual: {fmt(totalContractorAnnual)}</div>
            </div>
          </div>

          {/* Desktop Table Terceirizados */}
          <div className="hidden md:block th-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b th-border text-xs uppercase th-muted bg-primary/5 font-semibold">
                  <th className="py-3 px-4">Empresa / Razão Social</th>
                  <th className="py-3 px-4">Serviço / Setor</th>
                  <th className="py-3 px-4">Custo Mensal & Anual</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Status & Sincronização</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contractors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center th-muted">
                      Nenhuma empresa terceirizada cadastrada. Clique em "Nova Empresa Terceirizada" acima.
                    </td>
                  </tr>
                ) : (
                  contractors.map(c => (
                    <tr key={c.id} className="border-b th-border hover:bg-primary/5 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="font-bold th-text text-sm flex items-center gap-2">
                          <Building size={14} className="text-amber-500" />
                          {c.company_name}
                        </div>
                        <div className="text-xs th-muted flex items-center gap-3 mt-0.5">
                          {c.contact_name && <span>Resp: {c.contact_name}</span>}
                          {c.contact_phone && <span>{c.contact_phone}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 th-surface2 border th-border rounded-md text-xs font-semibold th-text">
                          {c.service_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-sm font-bold text-amber-500">
                          {fmt(c.monthly_cost)} <span className="text-xs font-normal th-muted">/mês</span>
                        </div>
                        <div className="text-[11px] th-muted font-mono">
                          {fmt(c.monthly_cost * 12)} /ano
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs th-muted">
                        Todo dia <strong className="th-text">{c.due_day || 10}</strong>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold border inline-block ${
                            c.contract_status === 'Ativo'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                          }`}>
                            {c.contract_status || 'Ativo'}
                          </span>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Conectado ao Financeiro
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => openEditContractor(c)}
                          className="th-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10"
                          title="Editar Empresa"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteContractor(c.id)}
                          className="th-muted hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10"
                          title="Remover Empresa"
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

          {/* Mobile Cards Terceirizados */}
          <div className="md:hidden space-y-3">
            {contractors.length === 0 ? (
              <div className="th-card p-8 text-center th-muted">Nenhuma empresa terceirizada cadastrada.</div>
            ) : (
              contractors.map(c => (
                <div key={c.id} className="th-card p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold th-text text-sm flex items-center gap-1.5">
                        <Building size={14} className="text-amber-500" />
                        {c.company_name}
                      </div>
                      <div className="text-xs th-muted mt-0.5">{c.service_type}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditContractor(c)} className="th-muted hover:text-primary p-1.5">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDeleteContractor(c.id)} className="th-muted hover:text-rose-500 p-1.5">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs border-t th-border pt-2">
                    <div>
                      <span className="th-muted block">Custo Mensal / Anual</span>
                      <div className="font-bold text-amber-500">{fmt(c.monthly_cost)}/mês</div>
                      <div className="text-[10px] th-muted">{fmt(c.monthly_cost * 12)}/ano</div>
                    </div>
                    <div>
                      <span className="th-muted block">Vencimento</span>
                      <span className="th-text font-bold">Dia {c.due_day || 10}</span>
                      <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">✓ No Financeiro</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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

              {form.contract_type === 'Sócio' && (
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Participação Societária (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 30"
                    className="th-input"
                    value={form.equity_percentage}
                    onChange={e => setForm({ ...form, equity_percentage: e.target.value })}
                  />
                </div>
              )}

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

      {/* Modal Nova / Editar Empresa Terceirizada */}
      {showContractorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="th-card p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b th-border pb-3">
              <h3 className="text-lg font-bold th-text flex items-center gap-2">
                <Building size={18} className="text-amber-500" />
                {editingContractor ? 'Editar Empresa Terceirizada' : 'Nova Empresa Terceirizada (PJ)'}
              </h3>
              <button onClick={() => setShowContractorModal(false)} className="th-muted hover:text-rose-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveContractor} className="space-y-4">
              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Razão Social / Nome da Empresa *</label>
                <input
                  type="text" required placeholder="Ex: Assessoria Jurídica Silva & Associados"
                  className="th-input"
                  value={contractorForm.company_name}
                  onChange={e => setContractorForm({ ...contractorForm, company_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Tipo de Serviço / Setor *</label>
                  <select
                    className="th-input"
                    value={contractorForm.service_type}
                    onChange={e => setContractorForm({ ...contractorForm, service_type: e.target.value })}
                  >
                    <option value="Jurídico & Compliance">Jurídico & Compliance</option>
                    <option value="Contabilidade & Fiscal">Contabilidade & Fiscal</option>
                    <option value="Marketing & Growth">Marketing & Growth</option>
                    <option value="Operações & Facilities">Operações & Facilities</option>
                    <option value="TI, Suporte & Cloud">TI, Suporte & Cloud</option>
                    <option value="Consultoria Estratégica">Consultoria Estratégica</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Custo Mensal do Contrato (R$) *</label>
                  <input
                    type="number" step="0.01" required placeholder="3500"
                    className="th-input font-bold text-amber-500"
                    value={contractorForm.monthly_cost}
                    onChange={e => setContractorForm({ ...contractorForm, monthly_cost: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Dia de Vencimento Mensal</label>
                  <input
                    type="number" min="1" max="31" placeholder="10"
                    className="th-input"
                    value={contractorForm.due_day}
                    onChange={e => setContractorForm({ ...contractorForm, due_day: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Status do Contrato</label>
                  <select
                    className="th-input"
                    value={contractorForm.contract_status}
                    onChange={e => setContractorForm({ ...contractorForm, contract_status: e.target.value })}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Responsável / Contato</label>
                  <input
                    type="text" placeholder="Dr. Roberto Silva"
                    className="th-input"
                    value={contractorForm.contact_name}
                    onChange={e => setContractorForm({ ...contractorForm, contact_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Telefone / WhatsApp</label>
                  <input
                    type="text" placeholder="(11) 98888-1122"
                    className="th-input"
                    value={contractorForm.contact_phone}
                    onChange={e => setContractorForm({ ...contractorForm, contact_phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Observações do Contrato</label>
                <textarea
                  rows={2} placeholder="Escopo do serviço, SLA, link do contrato em PDF..."
                  className="th-input"
                  value={contractorForm.notes}
                  onChange={e => setContractorForm({ ...contractorForm, notes: e.target.value })}
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Sincronização Automática com o Financeiro:
                </span>
                <p className="text-[11px] th-muted">
                  Ao salvar, este custo mensal de R$ {contractorForm.monthly_cost || '0'} será lançado no DRE Geral como despesa de Terceirizados e sincronizado na aba de Gastos Recorrentes.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                {editingContractor ? 'Atualizar Empresa' : 'Salvar Empresa & Sincronizar com Financeiro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRView;
