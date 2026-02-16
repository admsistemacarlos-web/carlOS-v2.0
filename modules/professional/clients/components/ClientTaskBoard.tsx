
import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Circle, Clock, AlertCircle, 
  MoreVertical, Plus, Calendar as CalendarIcon, ArrowRight, 
  List, ChevronLeft, ChevronRight, X, Save, Trash2, Edit2
} from 'lucide-react';
import { useClientTasks, useTaskOperations, TaskStatus, ClientTask } from '../../hooks/useClientWorkspace';
import { formatDateBr } from '../../../personal/finance/utils/dateHelpers';

// --- DATE HELPERS (Replacement for date-fns) ---
const getStartOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const getEndOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const getEndOfWeek = (date: Date) => {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  return d;
};

const eachDayOfInterval = ({ start, end }: { start: Date, end: Date }) => {
  const days = [];
  const current = new Date(start);
  // Ensure hours don't affect loop
  current.setHours(0,0,0,0);
  const endDate = new Date(end);
  endDate.setHours(0,0,0,0);

  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();
};

const isSameMonth = (d1: Date, d2: Date) => {
  return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
};

const isToday = (date: Date) => {
  const today = new Date();
  return isSameDay(date, today);
};

const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addMonths = (date: Date, amount: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return d;
};

const subMonths = (date: Date, amount: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - amount);
  return d;
};

// --- CONFIGURAÇÃO VISUAL ---
const STATUS_CONFIG: Record<TaskStatus, { label: string, color: string, icon: any }> = {
  todo: { label: 'A Fazer', color: 'text-muted-foreground', icon: Circle },
  in_progress: { label: 'Em Andamento', color: 'text-[#E09B6B]', icon: Clock },
  approval: { label: 'Aprovação', color: 'text-yellow-600', icon: AlertCircle },
  ready_to_post: { label: 'Pronto p/ Postar', color: 'text-purple-400', icon: ArrowRight },
  posted: { label: 'Concluído', color: 'text-emerald-600', icon: CheckCircle2 },
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta'
};

// --- MODAL DE EDIÇÃO/CRIAÇÃO ---
const TaskModal = ({ 
  isOpen, 
  onClose, 
  task, 
  clientId, 
  createTask, 
  updateTask,
  deleteTask 
}: any) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: new Date().toISOString().split('T')[0]
  });

  // Carregar dados ao abrir
  React.useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          due_date: task.due_date ? task.due_date.split('T')[0] : ''
        });
      } else {
        setFormData({
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          due_date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const payload: any = { ...formData };
    // Ajustar data para ISO com hora fixa para evitar fuso
    if (payload.due_date) {
        payload.due_date = new Date(payload.due_date + 'T12:00:00').toISOString();
    } else {
        payload.due_date = null;
    }

    if (task) {
      updateTask.mutate({ id: task.id, updates: payload });
    } else {
      createTask.mutate({ client_id: clientId, ...payload });
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta demanda?')) {
        deleteTask.mutate(task.id);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#202020] w-full max-w-md rounded-lg border border-[#404040] shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-[#404040]">
          <h3 className="text-base font-bold text-[#D4D4D4]">{task ? 'Editar Demanda' : 'Nova Demanda'}</h3>
          <button onClick={onClose} className="text-[#737373] hover:text-[#D4D4D4]"><X size={18} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1.5 block">Título</label>
            <input 
              autoFocus
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-[#37352F] border border-[#404040] rounded-md px-3 py-2 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none placeholder-[#5c5c5c]"
              placeholder="Ex: Criar Reels Institucional..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1.5 block">Data Entrega</label>
                <input 
                  type="date"
                  value={formData.due_date}
                  onChange={e => setFormData({...formData, due_date: e.target.value})}
                  className="w-full bg-[#37352F] border border-[#404040] rounded-md px-3 py-2 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none [color-scheme:dark]"
                />
             </div>
             <div>
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1.5 block">Prioridade</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                  className="w-full bg-[#37352F] border border-[#404040] rounded-md px-3 py-2 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none appearance-none"
                >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta 🔥</option>
                </select>
             </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1.5 block">Status</label>
            <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({...formData, status: key})}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-all ${
                            formData.status === key 
                            ? `bg-[#37352F] border-[#E09B6B] text-[#D4D4D4]` 
                            : 'bg-transparent border-[#404040] text-[#737373] hover:border-[#737373]'
                        }`}
                    >
                        <config.icon size={14} className={config.color} />
                        {config.label}
                    </button>
                ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1.5 block">Descrição / Obs</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-[#37352F] border border-[#404040] rounded-md px-3 py-2 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none resize-none placeholder-[#5c5c5c]"
              placeholder="Detalhes da tarefa..."
            />
          </div>

          <div className="pt-2 flex gap-3">
            {task && (
                <button 
                    type="button" 
                    onClick={handleDelete}
                    className="px-4 py-2 bg-[#3d1414] hover:bg-[#522020] text-red-400 rounded-md border border-red-900/30 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            )}
            <button 
                type="submit" 
                className="flex-1 bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFFFF] font-bold py-2.5 rounded-md transition-all shadow-sm flex items-center justify-center gap-2 text-sm border border-[#5D4037]"
            >
                <Save size={16} />
                Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function ClientTaskBoard({ clientId }: { clientId: string }) {
  const { data: tasks, isLoading } = useClientTasks(clientId);
  const taskOps = useTaskOperations(); // createTask, updateTask, deleteTask
  
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ClientTask | null>(null);

  const handleOpenNew = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: ClientTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // --- CALENDAR LOGIC ---
  const calendarDays = useMemo(() => {
    const monthStart = getStartOfMonth(currentDate);
    const monthEnd = getEndOfMonth(monthStart);
    const startDate = getStartOfWeek(monthStart);
    const endDate = getEndOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, ClientTask[]> = {};
    tasks?.forEach(task => {
        if (!task.due_date) return;
        const dateKey = formatDateKey(new Date(task.due_date));
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(task);
    });
    return map;
  }, [tasks]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  if (isLoading) return <div className="text-[#737373] text-xs p-4">Carregando tarefas...</div>;

  return (
    <div className="bg-[#202020] rounded-lg border border-[#404040] shadow-sm overflow-hidden flex flex-col h-[600px]">
      
      {/* HEADER DA SEÇÃO */}
      <div className="p-5 border-b border-[#404040] flex justify-between items-center shrink-0 bg-[#202020]">
        <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#E09B6B] flex items-center gap-2">
            <CheckCircle2 size={16} /> Gestão de Demandas
            </h3>
            
            {/* View Toggle */}
            <div className="flex bg-[#191919] p-0.5 rounded-md border border-[#404040]">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-sm transition-all ${viewMode === 'list' ? 'bg-[#37352F] text-[#D4D4D4] shadow-sm' : 'text-[#737373] hover:text-[#9ca3af]'}`}
                    title="Lista"
                >
                    <List size={14} />
                </button>
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`p-1.5 rounded-sm transition-all ${viewMode === 'calendar' ? 'bg-[#37352F] text-[#D4D4D4] shadow-sm' : 'text-[#737373] hover:text-[#9ca3af]'}`}
                    title="Calendário"
                >
                    <CalendarIcon size={14} />
                </button>
            </div>
        </div>

        <button 
            onClick={handleOpenNew}
            className="flex items-center gap-2 text-xs font-bold bg-[#37352F] text-[#D4D4D4] hover:text-[#FFFFFF] hover:bg-[#404040] px-3 py-1.5 rounded-md transition-colors border border-[#404040]"
        >
            <Plus size={14} /> Nova Demanda
        </button>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 overflow-hidden relative bg-[#191919]">
        
        {viewMode === 'list' ? (
            // --- LIST VIEW ---
            <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-2">
                {tasks && tasks.length > 0 ? tasks.map(task => {
                    const StatusIcon = STATUS_CONFIG[task.status].icon;
                    return (
                        <div 
                            key={task.id} 
                            onClick={() => handleOpenEdit(task)}
                            className="group flex items-center justify-between p-3 rounded-md bg-[#2C2C2C] border border-[#404040] hover:border-[#737373] transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`shrink-0 ${STATUS_CONFIG[task.status].color}`}>
                                    <StatusIcon size={18} />
                                </div>
                                <div className="min-w-0">
                                    <span className={`text-sm font-medium truncate block ${task.status === 'posted' ? 'text-[#737373] line-through' : 'text-[#E5E5E5]'}`}>
                                        {task.title}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] uppercase font-bold tracking-wider ${STATUS_CONFIG[task.status].color}`}>
                                            {STATUS_CONFIG[task.status].label}
                                        </span>
                                        {task.priority === 'high' && (
                                            <span className="text-[9px] font-bold bg-red-900/30 text-red-400 px-1.5 rounded border border-red-900/50">Alta</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {task.due_date && (
                                    <span className="text-[10px] font-mono text-[#9ca3af] bg-[#191919] px-2 py-1 rounded border border-[#404040]">
                                        {formatDateBr(task.due_date)}
                                    </span>
                                )}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[#737373]">
                                    <Edit2 size={14} />
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#5c5c5c]">
                        <List size={32} className="mb-2 opacity-50" />
                        <p className="text-xs">Nenhuma demanda registrada.</p>
                    </div>
                )}
            </div>
        ) : (
            // --- CALENDAR VIEW ---
            <div className="h-full flex flex-col">
                {/* Calendar Nav */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#404040] bg-[#202020]">
                    <span className="text-sm font-bold text-[#E5E5E5] capitalize">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={prevMonth} className="p-1 hover:bg-[#37352F] rounded text-[#9ca3af]"><ChevronLeft size={16} /></button>
                        <button onClick={goToToday} className="text-[10px] font-bold uppercase text-[#9ca3af] hover:text-[#E09B6B] px-2">Hoje</button>
                        <button onClick={nextMonth} className="p-1 hover:bg-[#37352F] rounded text-[#9ca3af]"><ChevronRight size={16} /></button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 grid grid-rows-[auto_1fr] bg-[#202020]">
                    {/* Weekdays */}
                    <div className="grid grid-cols-7 border-b border-[#404040]">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                            <div key={i} className="py-2 text-center text-[10px] font-bold text-[#737373] uppercase bg-[#252525]">
                                {d}
                            </div>
                        ))}
                    </div>
                    
                    {/* Days */}
                    <div className="grid grid-cols-7 grid-rows-5 bg-[#404040] gap-[1px]">
                        {calendarDays.map((day, idx) => {
                            const dateKey = formatDateKey(day);
                            const dayTasks = tasksByDate[dateKey] || [];
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isTodayDate = isToday(day);

                            return (
                                <div 
                                    key={dateKey} 
                                    className={`bg-[#191919] p-1 flex flex-col transition-colors hover:bg-[#202020] min-h-[80px] ${!isCurrentMonth ? 'opacity-30 bg-[#151515]' : ''}`}
                                    onClick={() => isCurrentMonth && handleOpenNew()} // Pode abrir para criar nova com data pré-setada futuramente
                                >
                                    <span className={`text-[10px] font-bold mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isTodayDate ? 'bg-[#E09B6B] text-[#191919]' : 'text-[#737373]'}`}>
                                        {day.getDate()}
                                    </span>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                        {dayTasks.map(task => (
                                            <div 
                                                key={task.id}
                                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(task); }}
                                                className={`text-[9px] px-1.5 py-1 rounded border truncate cursor-pointer select-none ${
                                                    task.status === 'posted' 
                                                    ? 'bg-primary/30 text-[#5c5c5c] border-transparent line-through' 
                                                    : 'bg-[#2C2C2C] text-[#D4D4D4] border-[#404040] hover:border-[#E09B6B]'
                                                }`}
                                                title={task.title}
                                            >
                                                {task.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Modal Render */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
        clientId={clientId}
        createTask={taskOps.createTask}
        updateTask={taskOps.updateTask}
        deleteTask={taskOps.deleteTask}
      />

    </div>
  );
}
