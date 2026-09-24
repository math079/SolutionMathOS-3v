import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Trash2, Search, Filter, Mail, Phone,
  Briefcase, DollarSign, Calendar, ShieldCheck, CheckCircle2,
  Clock, AlertCircle, Edit3, X, Building, Plus, Award,
  Sparkles, TrendingUp, Percent, Target, Zap
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
  commission_rate?: number;
  base_target?: number;
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

interface Incentive {
  id: number;
  user_id: number;
  user_name?: string;
  user_role?: string;
  user_contract_type?: string;
  equity_percentage?: number;
  commission_rate?: number;
  type: 'commission' | 'monthly_bonus' | 'annual_bonus';
  amount: number;
  reference_period: string;
  metric_description?: string;
  target_achieved_percent?: number;
  status: string;
  notes?: string;
  created_at?: string;
}

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

const CONTRACT_TYPES = ['PJ', 'CLT', 'Sócio', 'Estágio', 'Freelancer'];
const STATUS_OPTIONS  = ['Ativo', 'De Férias', 'Licença', 'Inativo'];

const HRView: React.FC = () => {
  const [activeHRTab, setActiveHRTab] = useState<'employees' | 'contractors' | 'incentives'>('employees');
  const [users, setUsers]             = useState<User[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [incentives, setIncentives]   = useState<Incentive[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterContract, setFilterContract] = useState('all');
  const [filterStatus, setFilterStatus]     = useState('all');

  // Modal Colaboradores
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: '', role: '', email: '', phone: '',
    contract_type: 'PJ', salary: '', status: 'Ativo',
    hired_at: new Date().toISOString().split('T')[0],
    equity_percentage: '',
    commission_rate: '',
    base_target: ''
  });

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

  // Modal e Simulação de Incentivos (Comissões e Bonificações)
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [editingIncentive, setEditingIncentive] = useState<Incentive | null>(null);
  const [incentiveForm, setIncentiveForm] = useState({
    user_id: '',
    type: 'commission' as 'commission' | 'monthly_bonus' | 'annual_bonus',
    amount: '',
    reference_period: new Date().toISOString().slice(0, 7),
    metric_description: '',
    target_achieved_percent: '100',
    status: 'Aprovado',
    notes: ''
  });

  const [simulatedRevenue, setSimulatedRevenue] = useState('150000');
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [currentNetProfit, setCurrentNetProfit] = useState<number>(0);
  const [customProfitBase, setCustomProfitBase] = useState<string>('');

  useEffect(() => { 
    fetchUsers(); 
    fetchContractors();
    fetchIncentives();
    fetchNetProfit();
  }, []);

  const fetchNetProfit = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/finance/summary');
      const data = await res.json();
      if (data && data.net_profit !== undefined) {
        setCurrentNetProfit(data.net_profit);
      }
    } catch (e) {
      console.error("Erro ao carregar lucro líquido:", e);
    }
  };

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

  const fetchIncentives = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/hr/incentives');
      const data = await res.json();
      setIncentives(data || []);
    } catch (e) {
      console.error("Erro ao buscar incentivos:", e);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        role: form.role,
        email: form.email,
        phone: form.phone,
        contract_type: form.contract_type,
        salary: parseFloat(form.salary) || 0,
        equity_percentage: form.equity_percentage ? parseFloat(form.equity_percentage) : null,
        commission_rate: form.commission_rate ? parseFloat(form.commission_rate) : 0,
        base_target: form.base_target ? parseFloat(form.base_target) : 0,
        status: form.status,
        hired_at: form.hired_at
      };

      if (editingUser) {
        await fetch(`http://localhost:3001/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('http://localhost:3001/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
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
      equity_percentage: u.equity_percentage !== undefined && u.equity_percentage !== null ? String(u.equity_percentage) : '',
      commission_rate: u.commission_rate ? String(u.commission_rate) : '',
      base_target: u.base_target ? String(u.base_target) : ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      name: '', role: '', email: '', phone: '',
      contract_type: 'PJ', salary: '', status: 'Ativo',
      hired_at: new Date().toISOString().split('T')[0],
      equity_percentage: '',
      commission_rate: '',
      base_target: ''
    });
  };

  // Handlers Terceirizados
  const handleSaveContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContractor) {
        await fetch(`http://localhost:3001/api/hr/contractors/${editingContractor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...contractorForm,
            monthly_cost: parseFloat(contractorForm.monthly_cost) || 0,
            due_day: parseInt(contractorForm.due_day) || 10
          })
        });
      } else {
        await fetch('http://localhost:3001/api/hr/contractors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...contractorForm,
            monthly_cost: parseFloat(contractorForm.monthly_cost) || 0,
            due_day: parseInt(contractorForm.due_day) || 10
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

  // Handlers Incentivos (Comissões e Bônus)
  const handleSaveIncentive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incentiveForm.user_id || !incentiveForm.amount) return;
    try {
      const payload = {
        user_id: parseInt(incentiveForm.user_id),
        type: incentiveForm.type,
        amount: parseFloat(incentiveForm.amount) || 0,
        reference_period: incentiveForm.reference_period,
        metric_description: incentiveForm.metric_description,
        target_achieved_percent: parseFloat(incentiveForm.target_achieved_percent) || 100,
        status: incentiveForm.status,
        notes: incentiveForm.notes
      };

      if (editingIncentive) {
        await fetch(`http://localhost:3001/api/hr/incentives/${editingIncentive.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('http://localhost:3001/api/hr/incentives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setShowIncentiveModal(false);
      setEditingIncentive(null);
      resetIncentiveForm();
      fetchIncentives();
    } catch (e) {
      console.error("Erro ao salvar incentivo:", e);
    }
  };

  const handleDeleteIncentive = async (id: number) => {
    if (!confirm("Excluir este lançamento de comissão/bônus? A despesa no Financeiro será cancelada.")) return;
    try {
      await fetch(`http://localhost:3001/api/hr/incentives/${id}`, { method: 'DELETE' });
      setIncentives(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error("Erro ao excluir incentivo:", e);
    }
  };

  const openEditIncentive = (inc: Incentive) => {
    setEditingIncentive(inc);
    setIncentiveForm({
      user_id: String(inc.user_id),
      type: inc.type,
      amount: String(inc.amount),
      reference_period: inc.reference_period,
      metric_description: inc.metric_description || '',
      target_achieved_percent: inc.target_achieved_percent ? String(inc.target_achieved_percent) : '100',
      status: inc.status || 'Aprovado',
      notes: inc.notes || ''
    });
    setShowIncentiveModal(true);
  };

  const resetIncentiveForm = () => {
    setIncentiveForm({
      user_id: users.length > 0 ? String(users[0].id) : '',
      type: 'commission',
      amount: '',
      reference_period: new Date().toISOString().slice(0, 7),
      metric_description: '',
      target_achieved_percent: '100',
      status: 'Aprovado',
      notes: ''
    });
  };

  const handleRunSimulation = async (applyToDatabase: boolean = false) => {
    try {
      setSimulating(true);
      const res = await fetch('http://localhost:3001/api/hr/incentives/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulated_revenue: parseFloat(simulatedRevenue) || 150000,
          apply_to_database: applyToDatabase,
          reference_period: new Date().toISOString().slice(0, 7)
        })
      });
      const data = await res.json();
      setSimulationResult(data);
      if (applyToDatabase) {
        alert('Simulação aplicada com sucesso! Os bônus e comissões foram lançados como Custos Variáveis no Financeiro.');
        fetchIncentives();
      }
    } catch (e) {
      console.error("Erro ao simular incentivos:", e);
    } finally {
      setSimulating(false);
    }
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

  // KPIs Gerais
  const totalEmployees = users.length;
  const activeEmployees = users.filter(u => u.status === 'Ativo' || !u.status).length;
  const totalPayroll   = users.reduce((sum, u) => sum + (parseFloat(String(u.salary || 0)) || 0), 0);
  const totalPayrollAnnual = totalPayroll * 12;
  const activeContractors = contractors.filter(c => c.contract_status === 'Ativo' || !c.contract_status);
  const totalContractorMonthly = activeContractors.reduce((sum, c) => sum + (parseFloat(String(c.monthly_cost || 0)) || 0), 0);
  const totalContractorAnnual = totalContractorMonthly * 12;
  const totalCombinedMonthly = totalPayroll + totalContractorMonthly;
  const totalCombinedAnnual = totalCombinedMonthly * 12;

  // KPIs de Incentivos
  const totalCommissions = incentives.filter(i => i.type === 'commission').reduce((s, i) => s + (i.amount || 0), 0);
  const totalMonthlyBonuses = incentives.filter(i => i.type === 'monthly_bonus').reduce((s, i) => s + (i.amount || 0), 0);
  const totalAnnualBonuses = incentives.filter(i => i.type === 'annual_bonus').reduce((s, i) => s + (i.amount || 0), 0);
  const totalIncentives = totalCommissions + totalMonthlyBonuses + totalAnnualBonuses;

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b th-border pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold th-text flex items-center gap-2">
            Gestão de Equipe, RH & Terceirizados
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
              Integrado ao Financeiro
            </span>
          </h2>
          <p className="th-muted text-xs sm:text-sm mt-0.5">
            Cadastre colaboradores internos, parceiros terceirizados e configure comissões e bonificações variáveis por meta
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeHRTab === 'employees' && (
            <button
              onClick={() => { resetForm(); setEditingUser(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors"
            >
              <UserPlus size={16} /> Cadastrar Colaborador
            </button>
          )}

          {activeHRTab === 'contractors' && (
            <button
              onClick={() => { resetContractorForm(); setEditingContractor(null); setShowContractorModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
            >
              <Plus size={16} /> Nova Empresa Terceirizada
            </button>
          )}

          {activeHRTab === 'incentives' && (
            <button
              onClick={() => { resetIncentiveForm(); setEditingIncentive(null); setShowIncentiveModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
            >
              <Plus size={16} /> Lançar Comissão / Bonificação
            </button>
          )}
        </div>
      </div>

      {/* Sub-abas de RH */}
      <div className="flex items-center gap-2 border-b th-border pb-3 flex-wrap">
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
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'th-surface2 th-muted border-th-border hover:th-text'
          }`}
        >
          <Building size={14} /> Serviços & Empresas Terceirizadas PJ ({contractors.length})
        </button>

        <button
          onClick={() => setActiveHRTab('incentives')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeHRTab === 'incentives'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'th-surface2 th-muted border-th-border hover:th-text'
          }`}
        >
          <Award size={14} /> Comissões & Bonificações ({incentives.length})
        </button>
      </div>

      {/* KPI Cards Dinâmicos */}
      {activeHRTab !== 'incentives' ? (
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
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="th-card p-5 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start mb-3">
              <span className="th-muted text-xs font-semibold">Comissões de Vendas</span>
              <Percent size={18} className="text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500 mb-1">{fmt(totalCommissions)}</div>
            <div className="text-xs th-muted">Pagamento variável direto aos closers</div>
          </div>

          <div className="th-card p-5 border-l-4 border-l-purple-500">
            <div className="flex justify-between items-start mb-3">
              <span className="th-muted text-xs font-semibold">Bônus Mensais de Meta</span>
              <Target size={18} className="text-purple-500" />
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-500 mb-1">{fmt(totalMonthlyBonuses)}</div>
            <div className="text-xs th-muted">Incentivo por superação de meta</div>
          </div>

          <div className="th-card p-5 border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-start mb-3">
              <span className="th-muted text-xs font-semibold">Bonificação Anual / PLR</span>
              <Award size={18} className="text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-500 mb-1">{fmt(totalAnnualBonuses)}</div>
            <div className="text-xs th-muted">Provisão anual para sócios e liderança</div>
          </div>

          <div className="th-card p-5 border-l-4 border-l-amber-500">
            <div className="flex justify-between items-start mb-3">
              <span className="th-muted text-xs font-semibold">Custo Variável Total</span>
              <Zap size={18} className="text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-500 mb-1">{fmt(totalIncentives)}</div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Classificado como Custo Variável no DRE</div>
          </div>
        </div>
      )}

      {/* ── SEÇÃO COLABORADORES INTERNOS ── */}
      {activeHRTab === 'employees' && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 th-card p-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 th-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nome, cargo ou e-mail..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="th-input pl-10 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterContract}
                onChange={e => setFilterContract(e.target.value)}
                className="th-input text-xs"
              >
                <option value="all">Todos os Contratos</option>
                {CONTRACT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="th-input text-xs"
              >
                <option value="all">Todos os Status</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="th-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b th-border th-surface2">
                    <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Colaborador</th>
                    <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Cargo</th>
                    <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Contrato</th>
                    <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Comissão / Meta</th>
                    <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Salário Mensal / Anual</th>
                    <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Status</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold th-muted uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y th-border">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center th-muted text-sm">
                        Nenhum colaborador encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const userSalary = parseFloat(String(user.salary || 0)) || 0;
                      const userAnnual = userSalary * 12;
                      return (
                        <tr key={user.id} className="hover:bg-primary/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold th-text flex items-center gap-2">
                              {user.name}
                              {user.contract_type === 'Sócio' && user.equity_percentage && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  {user.equity_percentage}% Sócio
                                </span>
                              )}
                            </div>
                            <div className="text-xs th-muted">{user.email || user.phone || 'Sem contato'}</div>
                          </td>
                          <td className="py-3 px-4 text-xs th-muted">{user.role}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 text-xs font-medium rounded-md th-surface2 border th-border">
                              {user.contract_type || 'PJ'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {user.commission_rate && user.commission_rate > 0 ? (
                              <span className="px-2 py-0.5 rounded font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {user.commission_rate}% Comissão
                              </span>
                            ) : (
                              <span className="text-slate-500">Fixo puro</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-500">
                            <div>{fmt(userSalary)} <span className="text-[11px] font-normal th-muted">/mês</span></div>
                            <div className="text-[10px] text-slate-400 font-normal">{fmt(userAnnual)} /ano</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadgeClass(user.status)}`}>
                              {user.status || 'Ativo'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditModal(user)} className="p-1 rounded th-muted hover:text-primary">
                                <Edit3 size={15} />
                              </button>
                              <button onClick={() => deleteUser(user.id)} className="p-1 rounded th-muted hover:text-rose-500">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── SEÇÃO SERVIÇOS & EMPRESAS TERCEIRIZADAS PJ ── */}
      {activeHRTab === 'contractors' && (
        <div className="th-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b th-border th-surface2">
                  <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Empresa / Razão Social</th>
                  <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Tipo de Serviço</th>
                  <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Vencimento</th>
                  <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Custo Mensal / Anual</th>
                  <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Status</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold th-muted uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y th-border">
                {contractors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center th-muted text-sm">
                      Nenhuma empresa terceirizada cadastrada. Clique em "Nova Empresa Terceirizada".
                    </td>
                  </tr>
                ) : (
                  contractors.map(c => (
                    <tr key={c.id} className="hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold th-text">{c.company_name}</div>
                        <div className="text-xs th-muted">{c.contact_name} {c.contact_phone ? `(${c.contact_phone})` : ''}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-amber-500">{c.service_type}</td>
                      <td className="py-3 px-4 text-xs th-muted">Dia {c.due_day || 10} de cada mês</td>
                      <td className="py-3 px-4 font-bold text-amber-500">
                        <div>{fmt(c.monthly_cost)} <span className="text-[11px] font-normal th-muted">/mês</span></div>
                        <div className="text-[10px] text-slate-400 font-normal">{fmt(c.monthly_cost * 12)} /ano</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {c.contract_status || 'Ativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditContractor(c)} className="p-1 rounded th-muted hover:text-amber-500">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => handleDeleteContractor(c.id)} className="p-1 rounded th-muted hover:text-rose-500">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SEÇÃO COMISSÕES & BONIFICAÇÕES (INCENTIVOS VARIÁVEIS) ── */}
      {activeHRTab === 'incentives' && (
        <div className="space-y-6">
          {/* Painel do Simulador de Desempenho e Metas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Simulador Inteligente de Metas & Incentivos
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      Custo Variável Operacional
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Simule o impacto financeiro de comissões para vendedores e bonificações para sócios conforme o faturamento cresce
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRunSimulation(false)}
                  disabled={simulating}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                >
                  {simulating ? 'Calculando...' : 'Calcular Projeção'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRunSimulation(true)}
                  disabled={simulating}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-950/40"
                >
                  Gravar no Financeiro
                </button>
              </div>
            </div>

            {/* Configuração da Simulação */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Faturamento Mensal Simulado (R$):
                </label>
                <input
                  type="number"
                  step="1000"
                  value={simulatedRevenue}
                  onChange={e => setSimulatedRevenue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 flex-wrap pt-4">
                <span className="text-xs text-slate-400 font-medium">Metas Rápidas:</span>
                {[50000, 100000, 150000, 250000, 500000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setSimulatedRevenue(String(val)); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 text-xs font-semibold transition-colors"
                  >
                    R$ {(val / 1000)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Resultado da Simulação */}
            {simulationResult && (
              <div className="pt-4 border-t border-slate-800/80 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400 block font-medium">Custo Variável Total Projetado:</span>
                    <div className="text-lg font-bold text-amber-400 mt-0.5">
                      {fmt(simulationResult.total_variable_cost)}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Representa {simulationResult.variable_cost_ratio_percent}% da receita projetada
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400 block font-medium">Margem Operacional Líquida Restante:</span>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">
                      {fmt(simulationResult.simulated_revenue - simulationResult.total_variable_cost)}
                    </div>
                    <span className="text-[10px] text-slate-500">Após dedução de comissões e bonificações</span>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400 block font-medium">Regra de Incentivo:</span>
                    <div className="text-xs font-semibold text-slate-200 mt-1">
                      Comissão 5% a 10% Vendedores + Bônus Proporcional Sócios
                    </div>
                  </div>
                </div>

                {/* Tabela de Breakdown da Simulação */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3">Colaborador</th>
                        <th className="py-2.5 px-3">Papel</th>
                        <th className="py-2.5 px-3">Taxa / Regra</th>
                        <th className="py-2.5 px-3">Comissão Projetada</th>
                        <th className="py-2.5 px-3">Bônus Mensal</th>
                        <th className="py-2.5 px-3">Provisão Anual (PLR)</th>
                        <th className="py-2.5 px-3 font-bold text-white">Total Variável</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {simulationResult.simulations.map((s: any) => (
                        <tr key={s.user_id} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-medium text-white">{s.name}</td>
                          <td className="py-2.5 px-3">{s.role}</td>
                          <td className="py-2.5 px-3">
                            {s.is_socio ? 'Sócio / Equity' : s.commission_rate > 0 ? `${s.commission_rate}% sobre Vendas` : 'Meta de Performance'}
                          </td>
                          <td className="py-2.5 px-3 text-blue-400 font-semibold">{fmt(s.projected_commission)}</td>
                          <td className="py-2.5 px-3 text-purple-400 font-semibold">{fmt(s.projected_monthly_bonus)}</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-semibold">{fmt(s.projected_annual_bonus)}</td>
                          <td className="py-2.5 px-3 font-bold text-amber-400">{fmt(s.total_projected_variable)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Histórico e Lançamentos de Comissões e Bonificações */}
          <div className="th-card overflow-hidden">
            <div className="p-4 border-b th-border flex items-center justify-between">
              <div>
                <h4 className="font-bold th-text text-sm">Lançamentos Efetivos de Comissões & Bonificações</h4>
                <p className="text-xs th-muted">Registros integrados ao módulo Financeiro como custos variáveis</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b th-border th-surface2">
                    <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Colaborador</th>
                    <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Tipo de Incentivo</th>
                    <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Período</th>
                    <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Descrição / Meta Batida</th>
                    <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Valor (R$)</th>
                    <th className="py-3 px-4 text-xs font-semibold th-muted uppercase">Status</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold th-muted uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y th-border">
                  {incentives.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center th-muted text-sm">
                        Nenhum lançamento de comissão ou bonificação cadastrado. Clique em "Lançar Comissão / Bonificação".
                      </td>
                    </tr>
                  ) : (
                    incentives.map(inc => (
                      <tr key={inc.id} className="hover:bg-primary/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold th-text">{inc.user_name}</div>
                          <div className="text-xs th-muted">{inc.user_role}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                            inc.type === 'commission'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : inc.type === 'annual_bonus'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                            {inc.type === 'commission' ? 'Comissão Vendas' : inc.type === 'annual_bonus' ? 'Bonificação Anual PLR' : 'Bônus Mensal'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs th-muted">{inc.reference_period}</td>
                        <td className="py-3 px-4 text-xs text-slate-300">{inc.metric_description || 'Desempenho aprovado'}</td>
                        <td className="py-3 px-4 font-bold text-amber-400">{fmt(inc.amount)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {inc.status || 'Aprovado'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditIncentive(inc)} className="p-1 rounded th-muted hover:text-purple-400">
                              <Edit3 size={15} />
                            </button>
                            <button onClick={() => handleDeleteIncentive(inc.id)} className="p-1 rounded th-muted hover:text-rose-500">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro/Edição Colaborador */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="th-card p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 border-b th-border pb-3">
              <h3 className="text-lg font-bold th-text">
                {editingUser ? 'Editar Colaborador' : 'Novo Colaborador Interno'}
              </h3>
              <button onClick={() => setShowModal(false)} className="th-muted hover:text-rose-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Nome Completo *</label>
                <input
                  type="text" required placeholder="João Silva" className="th-input"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Cargo / Função *</label>
                  <input
                    type="text" required placeholder="Ex: Closer de Vendas, CEO..." className="th-input"
                    value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Tipo de Contrato</label>
                  <select
                    className="th-input" value={form.contract_type}
                    onChange={e => setForm({ ...form, contract_type: e.target.value })}
                  >
                    {CONTRACT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {form.contract_type === 'Sócio' && (
                <div>
                  <label className="text-xs font-semibold text-purple-400 mb-1 block">
                    Porcentagem de Participação / Sócio (% opcional)
                  </label>
                  <input
                    type="number" step="0.01" min="0" max="100" placeholder="Ex: 50 para 50%"
                    className="th-input font-bold text-purple-400"
                    value={form.equity_percentage}
                    onChange={e => setForm({ ...form, equity_percentage: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Salário Fixo Mensal (R$)</label>
                  <input
                    type="number" step="100" placeholder="5000" className="th-input font-bold text-emerald-500"
                    value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-blue-400 mb-1 block">Comissão sobre Vendas (% opcional)</label>
                  <input
                    type="number" step="0.1" placeholder="Ex: 5 para 5%" className="th-input font-bold text-blue-400"
                    value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">E-mail</label>
                  <input
                    type="email" placeholder="joao@empresa.com" className="th-input"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Telefone</label>
                  <input
                    type="text" placeholder="(11) 98765-4321" className="th-input"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Status</label>
                  <select
                    className="th-input" value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Data de Admissão</label>
                  <input
                    type="date" className="th-input"
                    value={form.hired_at} onChange={e => setForm({ ...form, hired_at: e.target.value })}
                  />
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

      {/* Modal Terceirizado */}
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

      {/* Modal Lançar / Editar Comissão ou Bonificação */}
      {showIncentiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="th-card p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b th-border pb-3">
              <h3 className="text-lg font-bold th-text flex items-center gap-2">
                <Award size={20} className="text-purple-400" />
                {editingIncentive ? 'Editar Incentivo / Comissão' : 'Lançar Comissão ou Bonificação Manual'}
              </h3>
              <button onClick={() => setShowIncentiveModal(false)} className="th-muted hover:text-rose-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveIncentive} className="space-y-4">
              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Colaborador / Beneficiário *</label>
                <select
                  required
                  className="th-input"
                  value={incentiveForm.user_id}
                  onChange={e => setIncentiveForm({ ...incentiveForm, user_id: e.target.value })}
                >
                  <option value="">Selecione o colaborador...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role} ({u.contract_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Tipo de Incentivo *</label>
                  <select
                    className="th-input"
                    value={incentiveForm.type}
                    onChange={e => setIncentiveForm({ ...incentiveForm, type: e.target.value as any })}
                  >
                    <option value="commission">Comissão de Vendas</option>
                    <option value="monthly_bonus">Bônus Mensal por Meta</option>
                    <option value="annual_bonus">Bonificação Anual / PLR (Sócios)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Valor do Bônus / Comissão (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 5000.00"
                    className="th-input font-bold text-amber-400"
                    value={incentiveForm.amount}
                    onChange={e => setIncentiveForm({ ...incentiveForm, amount: e.target.value })}
                  />
                </div>
              </div>

              {/* Assistente Inteligente de Bonificação sobre Lucro Líquido (5% do Dono/Sócios) */}
              {incentiveForm.type === 'annual_bonus' && (
                <div className="p-3.5 bg-slate-900 border border-purple-500/30 rounded-xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-purple-400" />
                      Calculadora de Bonificação sobre Lucro Líquido
                    </span>
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Lucro Líquido Real: {fmt(currentNetProfit)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300">
                    Selecione a porcentagem do lucro líquido que o dono/sócio receberá ao final do ano:
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    {[1, 2, 3, 5, 8, 10, 15].map(pct => {
                      const isRecommended = pct === 5;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            const base = parseFloat(customProfitBase) || currentNetProfit || 0;
                            const calculated = Math.round(base * (pct / 100));
                            setIncentiveForm(prev => ({
                              ...prev,
                              amount: String(calculated),
                              metric_description: `Bonificação Anual de ${pct}% sobre o Lucro Líquido da Empresa (${fmt(base)})`
                            }));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            isRecommended
                              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/50'
                              : 'bg-slate-800 hover:bg-slate-700 text-purple-200 border border-slate-700'
                          }`}
                        >
                          {pct}% {isRecommended ? '★ (5% do Dono)' : ''}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span>Base alternativa de lucro (R$):</span>
                    <input
                      type="number"
                      placeholder={String(Math.round(currentNetProfit))}
                      value={customProfitBase}
                      onChange={e => setCustomProfitBase(e.target.value)}
                      className="w-36 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Mês / Período de Referência *</label>
                  <input
                    type="month"
                    required
                    className="th-input"
                    value={incentiveForm.reference_period}
                    onChange={e => setIncentiveForm({ ...incentiveForm, reference_period: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold th-muted mb-1 block">Status do Pagamento</label>
                  <select
                    className="th-input"
                    value={incentiveForm.status}
                    onChange={e => setIncentiveForm({ ...incentiveForm, status: e.target.value })}
                  >
                    <option value="Aprovado">Aprovado (Lançado no Caixa)</option>
                    <option value="Pendente">Pendente de Aprovação</option>
                    <option value="Pago">Pago / Liquidado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold th-muted mb-1 block">Métrica / Justificativa do Desempenho</label>
                <input
                  type="text"
                  placeholder="Ex: Meta batida de 150k em vendas (comissão de 5%), PLR Trimestral de Sócios..."
                  className="th-input"
                  value={incentiveForm.metric_description}
                  onChange={e => setIncentiveForm({ ...incentiveForm, metric_description: e.target.value })}
                />
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Sincronização Automática com o Financeiro:
                </span>
                <p className="text-[11px] th-muted">
                  Este valor será automaticamente registrado no DRE como <strong>Custo Variável Operacional</strong> (categoria Comissões & Bônus), reduzindo a margem somente conforme as vendas e metas forem atingidas.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncentiveModal(false)}
                  className="px-4 py-2 rounded-xl th-surface2 border th-border text-xs font-semibold th-muted hover:th-text"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  {editingIncentive ? 'Salvar Alterações' : 'Confirmar e Sincronizar com Financeiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRView;
