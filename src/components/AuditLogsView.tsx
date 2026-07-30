import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, RefreshCw, Download, Filter, Search, Lock, User, Terminal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  username?: string;
  role?: string;
  resource?: string;
  method?: string;
  ip?: string;
  body_keys?: string;
}

export const AuditLogsView: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/audit-logs', {
        headers: {
          'x-auth-user': user?.username || 'system',
          'x-auth-role': user?.role || 'admin',
        },
      });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Acesso negado: Somente administradores podem visualizar os logs de auditoria.');
        }
        throw new Error('Erro ao carregar logs de auditoria.');
      }
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Auto refresh a cada 10s
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      (log.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ip || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.resource || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (actionFilter === 'ALL') return matchesSearch;
    if (actionFilter === 'DENIED') return matchesSearch && (log.action.includes('DENIED') || log.action.includes('BLOCKED'));
    if (actionFilter === 'AUTH') return matchesSearch && (log.action.includes('LOGIN') || log.action.includes('LOGOUT'));
    if (actionFilter === 'CRITICAL') return matchesSearch && (log.action.includes('DELETE') || log.action.includes('PUT') || log.action.includes('POST'));

    return matchesSearch;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Data/Hora', 'Ação', 'Usuário', 'Role', 'IP', 'Recurso', 'Método'];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.timestamp).toLocaleString('pt-BR'),
      l.action,
      l.username || 'Desconhecido',
      l.role || '-',
      l.ip || '-',
      l.resource || '-',
      l.method || '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('BLOCKED') || action.includes('DENIED')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
          <ShieldAlert className="w-3.5 h-3.5" />
          {action}
        </span>
      );
    }
    if (action.includes('LOGIN') || action.includes('LOGOUT')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <User className="w-3.5 h-3.5" />
          {action}
        </span>
      );
    }
    if (action.includes('DELETE') || action.includes('PUT')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <Info className="w-3.5 h-3.5" />
        {action}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/60 p-6 rounded-2xl border border-gray-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Logs de Auditoria & Segurança
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                14 Regras Ativas
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Monitoramento em tempo real de acessos, auterações críticas e eventos do sistema.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold border border-gray-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={exportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-blue-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Warning/Error if not admin */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por IP, usuário, ação ou recurso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400 mr-1" />
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'DENIED', label: 'Bloqueios/Negações' },
            { id: 'AUTH', label: 'Login/Logout' },
            { id: 'CRITICAL', label: 'Alterações Críticas' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActionFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                actionFilter === f.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-950 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4">Evento / Ação</th>
                <th className="py-3.5 px-4">Usuário</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">IP Ordem</th>
                <th className="py-3.5 px-4">Recurso / Endpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 text-sm">
                    {loading ? 'Carregando eventos...' : 'Nenhum log encontrado para os filtros selecionados.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-gray-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4 font-medium text-gray-200">
                      {log.username || <span className="text-gray-500 italic">Anônimo</span>}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400 uppercase">
                      {log.role || '-'}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-400">
                      {log.ip || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-300">
                      <span className="text-blue-400 font-bold mr-1.5">{log.method || 'GET'}</span>
                      {log.resource || '/'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-gray-950 p-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gray-500" />
            <span>Exibindo <strong>{filteredLogs.length}</strong> de <strong>{logs.length}</strong> eventos gravados na sessão.</span>
          </div>
          <span>Limpeza automática ativada (1.000 eventos max)</span>
        </div>
      </div>
    </div>
  );
};
