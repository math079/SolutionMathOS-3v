import React, { useState, useEffect, useRef } from 'react';
import { Upload, Paperclip, Trash2 } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  assignee_name: string;
  assignee_id: number;
  status: string;
  file_url: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignee_id: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        fetch('http://localhost:3001/api/tasks'),
        fetch('http://localhost:3001/api/users')
      ]);
      const [tasksData, usersData] = await Promise.all([tasksRes.json(), usersRes.json()]);
      setTasks(tasksData);
      setUsers(usersData);
      // Default to first user
      if (usersData.length > 0) {
        setNewTask(prev => ({ ...prev, assignee_id: String(usersData[0].id) }));
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newTask.title);
    formData.append('description', newTask.description);
    formData.append('assignee_id', newTask.assignee_id);
    formData.append('status', 'Pendente');
    
    if (fileInputRef.current?.files && fileInputRef.current.files[0]) {
      formData.append('file', fileInputRef.current.files[0]);
    }

    try {
      await fetch('http://localhost:3001/api/tasks', { method: 'POST', body: formData });
      setNewTask(prev => ({ ...prev, title: '', description: '' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchAll();
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await fetch(`http://localhost:3001/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const deleteTask = async (id: number) => {
    if (!confirm("Deseja realmente excluir esta tarefa?")) return;
    try {
      await fetch(`http://localhost:3001/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'Concluído') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (status === 'Em Andamento') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-white/10 text-white/60 border-white/20';
  };

  return (
    <div className="p-6 bg-transparent flex-1 overflow-y-auto">
      <h3 className="text-xl font-bold text-white mb-6">Kanban de Tarefas Operacionais</h3>

      {/* Formulario de Nova Tarefa */}
      <div className="bg-white/5 p-5 rounded-2xl border border-white/10 mb-8 backdrop-blur-md">
        <h4 className="text-sm font-bold text-white/60 mb-4">Nova Ordem de Serviço (OS)</h4>
        <form onSubmit={handleAddTask} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Título da Tarefa"
              className="flex-1 px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
              value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              required
            />
            {/* Dynamic assignee dropdown from database */}
            <select
              className="w-52 px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
              value={newTask.assignee_id}
              onChange={e => setNewTask({ ...newTask, assignee_id: e.target.value })}
            >
              {users.length === 0
                ? <option value="">Sem funcionários</option>
                : users.map(u => (
                    <option key={u.id} value={String(u.id)} className="bg-[#111]">
                      {u.name} ({u.role})
                    </option>
                  ))
              }
            </select>
          </div>
          <textarea
            placeholder="Escopo / Descrição detalhada..."
            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:outline-none"
            rows={3}
            value={newTask.description}
            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
          />
          <div className="flex justify-between items-center">
            <label className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
              <Upload size={16} className="text-primary" />
              <span className="text-sm text-white/70 font-medium">Anexar Briefing</span>
              <input type="file" className="hidden" ref={fileInputRef} />
            </label>
            <button
              type="submit"
              disabled={!newTask.assignee_id}
              className="px-6 py-2 bg-primary text-black rounded-xl text-sm font-bold shadow-neon hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Emitir OS
            </button>
          </div>
        </form>
      </div>

      {/* Task Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-white/40 text-sm col-span-2">Carregando fila de tarefas...</p>
        ) : tasks.length === 0 ? (
          <p className="text-white/40 text-sm col-span-2">A fila de operações está vazia.</p>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className="p-5 border border-white/10 bg-black/40 rounded-2xl hover:border-primary/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-white/90 flex-1 mr-2">{task.title}</h4>
                <div className="flex items-center space-x-2 shrink-0">
                  <select
                    value={task.status}
                    onChange={e => updateStatus(task.id, e.target.value)}
                    className={`px-2 py-1 rounded-md text-xs font-bold border outline-none cursor-pointer appearance-none ${statusColor(task.status)}`}
                  >
                    <option value="Pendente" className="bg-[#111] text-white">Pendente</option>
                    <option value="Em Andamento" className="bg-[#111] text-white">Em Andamento</option>
                    <option value="Concluído" className="bg-[#111] text-white">Concluído</option>
                  </select>
                  <button onClick={() => deleteTask(task.id)} className="text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {task.description && (
                <p className="text-sm text-white/50 mb-4">{task.description}</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                <span className="text-xs font-medium text-white/40">
                  Responsável: <span className="text-primary">{task.assignee_name || `ID ${task.assignee_id}`}</span>
                </span>
                {task.file_url && (
                  <a
                    href={`http://localhost:3001${task.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors"
                  >
                    <Paperclip size={14} className="mr-1" /> Ver Anexo
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TasksView;
