import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, Dog, BookOpen, Heart, ChevronRight, Activity, 
  CheckCircle2, Dumbbell, Check,
  Zap, Frown,
  Wine, Loader2, Scale, AlertCircle, Calendar, XCircle, Circle, Bell
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useAuth } from '../../../contexts/AuthContext';

// Hooks Específicos
import { useAccounts } from '../finance/hooks/useFinanceData';
import { useReadingProgress } from '../spiritual/hooks/useReadingProgress';
import { bibleBooks } from '../spiritual/data/bibleBooks';
import { DashboardCalendar, CalendarMarkers } from '../components/DashboardCalendar';
import { formatDateBr, getDaysUntil } from '../finance/utils/dateHelpers';

// --- HELPER DATE ---
const formatDateDB = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatFullDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
};

const formatShortDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
};

// --- TYPES ---
interface OneTwoThreeTask {
  id: string;
  text: string;
  completed: boolean;
  type: '1' | '2' | '3';
}

interface PetTask {
  id: string;
  title: string;
  category: string;
  next_due_date: string;
  done: boolean;
}

interface NavCardProps { 
  title: string; 
  icon: React.ReactNode; 
  onClick: () => void;
}

// --- CONSTANTS ---
const DEFAULT_TASKS: OneTwoThreeTask[] = [
  { id: '1-1', type: '1', text: '', completed: false },
  { id: '2-1', type: '2', text: '', completed: false },
  { id: '2-2', type: '2', text: '', completed: false },
  { id: '3-1', type: '3', text: '', completed: false },
  { id: '3-2', type: '3', text: '', completed: false },
  { id: '3-3', type: '3', text: '', completed: false },
];

// --- COMPONENTS ---

const NavCard: React.FC<NavCardProps> = ({ title, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 bg-white border border-stone-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
  >
    <div className="text-stone-400 group-hover:text-[#143d2d] transition-colors mb-2">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
    </div>
    <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">{title}</span>
  </button>
);

// Componente de Checkbox Cíclico para o Bio-Data
interface BioTrackerCardProps {
  label: string;
  icon: React.ReactNode;
  value: boolean | null;
  onChange: (newValue: boolean | null) => void;
  activeColorClass: string;
  variant?: 'standard' | 'avoidance';
}

const BioTrackerCard: React.FC<BioTrackerCardProps> = ({ 
  label, 
  icon, 
  value, 
  onChange, 
  activeColorClass,
  variant = 'standard' 
}) => {
  
  const handleClick = () => {
    if (value === null) onChange(true);
    else if (value === true) onChange(false);
    else onChange(null);
  };

  let cardStyle = "bg-white border-stone-200 text-stone-400";
  let iconStyle = "text-stone-300";
  let statusIcon = <Circle size={18} className="text-stone-200" />;
  let statusText = "Registrar";

  if (value === true) {
    cardStyle = `bg-white ${activeColorClass} shadow-sm`;
    iconStyle = "currentColor"; 
    statusIcon = <CheckCircle2 size={18} strokeWidth={2.5} />;
    statusText = "Sim";
  } else if (value === false) {
    if (variant === 'avoidance') {
      cardStyle = "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm";
      iconStyle = "text-emerald-600";
      statusIcon = <CheckCircle2 size={18} strokeWidth={2.5} />;
      statusText = "Não";
    } else {
      cardStyle = "bg-stone-50 border-stone-200 text-stone-400";
      iconStyle = "text-stone-300";
      statusIcon = <XCircle size={18} />;
      statusText = "Não";
    }
  }

  return (
    <button 
      onClick={handleClick}
      className={`
        w-full p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group
        ${cardStyle}
        hover:scale-[1.01] active:scale-[0.98]
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full bg-white/50 ${iconStyle}`}>
          {icon}
        </div>
        <span className="font-bold text-sm">{label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{statusText}</span>
        {statusIcon}
      </div>
    </button>
  );
};

export default function HubPersonal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 1. FINANCEIRO
  const { accounts } = useAccounts();
  const totalBalance = useMemo(() => accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0), [accounts]);

  // 2. PET (Berry's Reminders) - ATUALIZADO
  const [petTasks, setPetTasks] = useState<PetTask[]>([]);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) return;
    const fetchBerryTasks = async () => {
      try {
        let { data: pet } = await supabase.from('pets').select('id').ilike('name', 'Berry').maybeSingle();
        if (!pet) {
             const { data: anyPet } = await supabase.from('pets').select('id').limit(1).maybeSingle();
             pet = anyPet;
        }

        if (pet) {
          const today = formatDateDB(new Date());
          const { data: tasks } = await supabase
            .from('pet_logs')
            .select('id, title, category, next_due_date, done')
            .eq('pet_id', pet.id)
            .not('next_due_date', 'is', null)
            .gte('next_due_date', today)
            .order('next_due_date', { ascending: true })
            .limit(5);
          if (tasks) setPetTasks(tasks);
        }
      } catch (err) {
        console.error("Erro ao buscar tarefas pet", err);
      }
    };
    fetchBerryTasks();
  }, [user]);

  // Handler para marcar tarefa como feita/não feita
  const handleTogglePetTask = async (taskId: string, currentDone: boolean) => {
    setUpdatingTaskId(taskId);
    try {
      const { error } = await supabase
        .from('pet_logs')
        .update({ done: !currentDone })
        .eq('id', taskId);
      
      if (error) throw error;
      
      // Atualiza o estado local
      setPetTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, done: !currentDone } : task
      ));
    } catch (err) {
      console.error("Erro ao atualizar tarefa", err);
      alert("Erro ao atualizar tarefa");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Função para determinar o estilo do card baseado na urgência
  const getPetTaskStyle = (task: PetTask) => {
    if (task.done) {
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: 'text-emerald-600',
        badge: 'bg-emerald-100 text-emerald-700',
        label: '✓ Feito'
      };
    }

    const daysUntil = getDaysUntil(task.next_due_date);
    
    if (daysUntil === 0) {
      // Hoje - Vermelho
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-700',
        icon: 'text-red-600',
        badge: 'bg-red-100 text-red-700 animate-pulse',
        label: '🔴 HOJE!'
      };
    } else if (daysUntil <= 3) {
      // Próximos 3 dias - Amarelo
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        text: 'text-amber-700',
        icon: 'text-amber-600',
        badge: 'bg-amber-100 text-amber-700',
        label: `⚠️ Em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`
      };
    } else {
      // Futuro - Neutro
      return {
        bg: 'bg-white',
        border: 'border-stone-200',
        text: 'text-stone-700',
        icon: 'text-[#5F6F52]',
        badge: 'bg-stone-100 text-stone-600',
        label: `Em ${daysUntil} dias`
      };
    }
  };

  // 3. ESPIRITUAL (Leitura em Progresso)
  const { getBookProgress } = useReadingProgress();
  const inProgressBooks = useMemo(() => {
    return bibleBooks.filter(book => {
      const stats = getBookProgress(book.name, book.chapters);
      return stats.read > 0 && stats.percentage < 100;
    });
  }, [getBookProgress]);

  // 4. TAREFAS 1-2-3
  const [dailyTasks, setDailyTasks] = useState<OneTwoThreeTask[]>(DEFAULT_TASKS);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchDailyTasks = async () => {
      try {
        const today = formatDateDB(new Date());
        const { data } = await supabase.from('daily_scratchpad').select('date, tasks').eq('user_id', user.id).maybeSingle();
        if (data && data.date === today && Array.isArray(data.tasks)) setDailyTasks(data.tasks as OneTwoThreeTask[]);
        else setDailyTasks(DEFAULT_TASKS);
      } catch (err) { console.error(err); }
    };
    fetchDailyTasks();
  }, [user]);

  const saveTasksToSupabase = async (tasksToSave: OneTwoThreeTask[]) => {
    if (!user) return;
    try {
      const today = formatDateDB(new Date());
      await supabase.from('daily_scratchpad').upsert({ user_id: user.id, date: today, tasks: tasksToSave }, { onConflict: 'user_id' });
    } catch (err) { console.error(err); }
  };

  const updateTask = (taskId: string, field: 'text' | 'completed', value: any) => {
    setDailyTasks(prev => {
      const updatedTasks = prev.map(t => t.id === taskId ? { ...t, [field]: value } : t);
      if (field === 'completed') saveTasksToSupabase(updatedTasks);
      else {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => saveTasksToSupabase(updatedTasks), 1000);
      }
      return updatedTasks;
    });
  };

  // 5. BIO-DATA INTELLIGENCE
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarMarkers, setCalendarMarkers] = useState<CalendarMarkers>({});
  
  const [wellnessData, setWellnessData] = useState<{
    weight: string;
    workout_done: boolean | null;
    energy_drink_consumed: boolean | null;
    headache: boolean | null;
  }>({
    weight: '',
    workout_done: null,
    energy_drink_consumed: null,
    headache: null
  });
  
  const logIdRef = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // FETCH MARKERS
  useEffect(() => {
    if (!user) return;
    const fetchMarkers = async () => {
      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      try {
        const { data: wellnessLogs } = await supabase.from('health_wellness_logs').select('date, workout_done, headache').eq('user_id', user.id).gte('date', startOfMonth).lte('date', endOfMonth);
        const { data: petLogs } = await supabase.from('pet_logs').select('event_date').eq('user_id', user.id).gte('event_date', startOfMonth).lte('event_date', endOfMonth);

        const markers: CalendarMarkers = {};
        wellnessLogs?.forEach(log => {
          const dateKey = log.date.split('T')[0];
          if (!markers[dateKey]) markers[dateKey] = {};
          if (log.workout_done) markers[dateKey].hasWorkout = true;
          if (log.headache) markers[dateKey].hasHeadache = true;
        });
        petLogs?.forEach(log => {
          const dateKey = log.event_date.split('T')[0];
          if (!markers[dateKey]) markers[dateKey] = {};
          markers[dateKey].hasPetEvent = true;
        });
        setCalendarMarkers(markers);
      } catch (err) { console.error(err); }
    };
    fetchMarkers();
  }, [user, calendarMonth, saveStatus]);

  // FETCH DAILY DETAIL
  useEffect(() => {
    if (!user) return;
    const fetchDetail = async () => {
      setWellnessData({ weight: '', workout_done: null, energy_drink_consumed: null, headache: null });
      logIdRef.current = null;
      try {
        const startOfDay = new Date(selectedDate); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(selectedDate); endOfDay.setHours(23,59,59,999);
        const { data } = await supabase.from('health_wellness_logs').select('*').eq('user_id', user.id).gte('date', startOfDay.toISOString()).lte('date', endOfDay.toISOString()).limit(1).maybeSingle();
        if (data) {
          logIdRef.current = data.id;
          setWellnessData({
            weight: data.weight ? String(data.weight) : '',
            workout_done: data.workout_done,
            energy_drink_consumed: data.energy_drink_consumed,
            headache: data.headache
          });
        }
      } catch (err) { console.error(err); }
    };
    fetchDetail();
  }, [user, selectedDate]);

  // SAVE LOGIC
  const handleUpdateLog = async (field: keyof typeof wellnessData, value: any) => {
    if (!user) return;
    setWellnessData(prev => ({ ...prev, [field]: value }));
    setSaveStatus('saving');

    try {
      const dateToSave = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 12, 0, 0).toISOString();
      if (logIdRef.current) {
        await supabase.from('health_wellness_logs').update({ [field]: value }).eq('id', logIdRef.current);
      } else {
        const payload = {
          user_id: user.id,
          date: dateToSave,
          weight: field === 'weight' ? (value ? parseFloat(value) : null) : (wellnessData.weight ? parseFloat(wellnessData.weight) : null),
          workout_done: field === 'workout_done' ? value : wellnessData.workout_done,
          energy_drink_consumed: field === 'energy_drink_consumed' ? value : wellnessData.energy_drink_consumed,
          headache: field === 'headache' ? value : wellnessData.headache,
        };
        const { data, error } = await supabase.from('health_wellness_logs').insert(payload).select('id').single();
        if (error) throw error;
        if (data) logIdRef.current = data.id;
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const focusTask = dailyTasks.find(t => t.type === '1') || DEFAULT_TASKS[0];
  const importantTasks = dailyTasks.filter(t => t.type === '2');
  const routineTasks = dailyTasks.filter(t => t.type === '3');

  // Contar notificações urgentes (não feitas e com urgência)
  const urgentPetTasks = petTasks.filter(task => !task.done && getDaysUntil(task.next_due_date) <= 3).length;

  return (
    <div className="animate-fade-in font-sans px-4 md:px-0 max-w-5xl mx-auto pb-24">
      
      {/* HEADER */}
      <header className="mb-6 pt-6 text-center md:text-left">
        <p className="text-[#143d2d] text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Dashboard Operacional</p>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tighter">
          Olá, <span className="text-stone-400 font-serif italic">Cadu</span>.
        </h1>
        <p className="text-xs font-medium text-stone-400 mt-1 capitalize">{formatFullDate(new Date())}</p>
      </header>

      {/* 1. NAVEGAÇÃO DE MÓDULOS */}
      <div className="mb-8">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
           <NavCard title="Financeiro" icon={<Wallet />} onClick={() => navigate('/personal/finance')} />
           <NavCard title="Saúde" icon={<Activity />} onClick={() => navigate('/personal/health')} />
           <NavCard title="Espiritual" icon={<Heart />} onClick={() => navigate('/personal/spiritual')} />
           <NavCard title="Estudos" icon={<BookOpen />} onClick={() => navigate('/personal/studies')} />
           
           {/* Pet Care com Badge de Notificação */}
           <div className="relative">
             <NavCard title="Pet Care" icon={<Dog />} onClick={() => navigate('/personal/pet')} />
             {urgentPetTasks > 0 && (
               <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse">
                 {urgentPetTasks}
               </div>
             )}
           </div>
           
           <NavCard title="Sommelier" icon={<Wine size={24} />} onClick={() => navigate('/personal/sommelier')} />
        </div>
      </div>

      {/* 2. RESUMO FINANCEIRO */}
      <div className="mb-8">
        <div 
          onClick={() => navigate('/personal/finance')}
          className="bg-[#1c1917] rounded-[2rem] p-6 text-white shadow-lg cursor-pointer hover:scale-[1.01] transition-transform active:scale-95"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Patrimônio Líquido</p>
              <h2 className="text-3xl font-bold tracking-tighter">
                R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-3 bg-white/10 rounded-full text-stone-300">
              <Wallet size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. LENDO AGORA */}
      {inProgressBooks.length > 0 && (
        <div className="mb-8">
           <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
              <BookOpen size={16} /> Lendo Agora
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {inProgressBooks.slice(0, 2).map(book => {
               const stats = getBookProgress(book.name, book.chapters);
               return (
                 <div 
                   key={book.name} 
                   onClick={() => navigate('/personal/spiritual/reading')}
                   className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-200 transition-colors group"
                 >
                    <div className="flex-1">
                       <span className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.15em] bg-blue-50 px-2 py-0.5 rounded mb-1.5 inline-block border border-blue-100/50">
                          Vida Espiritual
                       </span>
                       <h4 className="font-bold text-stone-700 group-hover:text-blue-700 transition-colors">{book.name}</h4>
                       <p className="text-xs text-stone-400">{stats.read} de {book.chapters} capítulos</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-xs font-bold text-blue-600">{stats.percentage}%</span>
                       <div className="w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
                          <ChevronRight size={14} className="text-stone-400 group-hover:text-blue-500" />
                       </div>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      )}

      {/* 4. TÁTICA DIÁRIA */}
      <div className="mb-8">
          <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
            <CheckCircle2 size={16} /> Tática Diária (1-2-3)
          </h3>
          <div className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm space-y-4">
            <div className="bg-stone-50 border-l-4 border-[#143d2d] rounded-xl p-4 flex items-center gap-4">
              <button 
                  onClick={() => updateTask(focusTask.id, 'completed', !focusTask.completed)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${focusTask.completed ? 'bg-[#143d2d] border-[#143d2d] text-white' : 'border-stone-300'}`}
              >
                  {focusTask.completed && <Check size={14} strokeWidth={3} />}
              </button>
              <input 
                  value={focusTask.text}
                  onChange={(e) => updateTask(focusTask.id, 'text', e.target.value)}
                  placeholder="Foco único do dia..."
                  className={`w-full bg-transparent font-bold text-stone-800 outline-none placeholder-stone-300 ${focusTask.completed ? 'line-through text-stone-400' : ''}`}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {importantTasks.map(task => (
                <div key={task.id} className="bg-stone-50 rounded-xl p-3 flex items-center gap-3 border border-stone-100">
                    <button 
                      onClick={() => updateTask(task.id, 'completed', !task.completed)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-stone-400 border-stone-400 text-white' : 'border-stone-300'}`}
                    >
                      {task.completed && <Check size={10} strokeWidth={3} />}
                    </button>
                    <input 
                      value={task.text}
                      onChange={(e) => updateTask(task.id, 'text', e.target.value)}
                      placeholder="Importante..."
                      className={`w-full bg-transparent text-sm font-medium text-stone-700 outline-none placeholder-stone-300 ${task.completed ? 'line-through text-stone-400' : ''}`}
                    />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {routineTasks.map(task => (
                <div key={task.id} className="bg-stone-50/50 rounded-xl p-2.5 flex items-center gap-3 border border-stone-100">
                    <button 
                      onClick={() => updateTask(task.id, 'completed', !task.completed)}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-stone-300 border-stone-300 text-white' : 'border-stone-200'}`}
                    >
                      {task.completed && <Check size={8} strokeWidth={3} />}
                    </button>
                    <input 
                      value={task.text}
                      onChange={(e) => updateTask(task.id, 'text', e.target.value)}
                      placeholder="Rotina..."
                      className={`w-full bg-transparent text-xs font-medium text-stone-600 outline-none placeholder-stone-300 ${task.completed ? 'line-through text-stone-300' : ''}`}
                    />
                </div>
              ))}
            </div>
          </div>
      </div>

      {/* 5. PET REMINDERS - ATUALIZADO COM SISTEMA DE CORES E TOGGLE */}
      {petTasks.length > 0 && (
        <div className="mb-8">
           <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
              <Dog size={16} /> Compromissos Pet
              {urgentPetTasks > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Bell size={10} /> {urgentPetTasks} urgente{urgentPetTasks > 1 ? 's' : ''}
                </span>
              )}
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
             {petTasks.map(task => {
               const style = getPetTaskStyle(task);
               return (
                <div 
                  key={task.id}
                  className={`${style.bg} p-4 rounded-2xl border ${style.border} shadow-sm transition-all hover:shadow-md`}
                >
                   <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center ${style.icon} border ${style.border}`}>
                          <Dog size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className={`font-bold ${style.text} text-sm truncate`}>{task.title}</h4>
                           <p className="text-xs text-stone-500 font-medium">
                             {new Date(task.next_due_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                           </p>
                        </div>
                      </div>
                      
                      {/* Toggle Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePetTask(task.id, task.done);
                        }}
                        disabled={updatingTaskId === task.id}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                          task.done 
                            ? 'bg-emerald-500 text-white shadow-sm' 
                            : 'bg-white border-2 border-stone-300 text-stone-400 hover:border-emerald-400'
                        } ${updatingTaskId === task.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
                      >
                        {updatingTaskId === task.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : task.done ? (
                          <Check size={16} strokeWidth={3} />
                        ) : (
                          <Circle size={16} strokeWidth={2} />
                        )}
                      </button>
                   </div>
                   
                   <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${style.badge} px-2 py-1 rounded`}>
                        {task.category === 'medication' ? 'Remédio' : task.category === 'vaccine' ? 'Vacina' : task.category === 'hygiene' ? 'Higiene' : task.category}
                      </span>
                      <span className={`text-[10px] font-bold ${style.text}`}>
                        {style.label}
                      </span>
                   </div>
                </div>
               );
             })}
           </div>
        </div>
      )}

      {/* 6. CALENDÁRIO HISTÓRICO */}
      <div className="mb-8">
         <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
            <Calendar size={16} /> Histórico Mensal
         </h3>
         <div className="h-[450px]">
            <DashboardCalendar 
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                currentMonth={calendarMonth}
                onMonthChange={setCalendarMonth}
                markers={calendarMarkers}
            />
         </div>
      </div>

      {/* 7. BIO-DATA CHECK-IN */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} /> Bio-Data • {formatShortDate(selectedDate)}
            </h3>
            
            {/* Feedback Visual */}
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && <span className="text-[10px] text-stone-400 font-medium flex gap-1"><Loader2 size={12} className="animate-spin" /></span>}
              {saveStatus === 'saved' && <span className="text-[10px] text-emerald-600 font-bold flex gap-1 animate-fade-in"><CheckCircle2 size={12} /></span>}
              {saveStatus === 'error' && <span className="text-[10px] text-red-500 font-bold flex gap-1"><AlertCircle size={12} /></span>}
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Peso (Input) */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between h-24">
                <div className="flex items-center gap-2 text-stone-500">
                    <Scale size={16} />
                    <span className="font-bold text-xs uppercase tracking-wider">Peso</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                    <input 
                        type="number" 
                        placeholder="00.0"
                        value={wellnessData.weight}
                        onChange={(e) => setWellnessData(prev => ({...prev, weight: e.target.value}))}
                        onBlur={(e) => handleUpdateLog('weight', parseFloat(e.target.value))}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        className="text-2xl font-bold text-stone-800 placeholder-stone-200 w-full bg-transparent outline-none"
                    />
                    <span className="text-xs font-bold text-stone-400">kg</span>
                </div>
          </div>

          {/* Card 2: Treino */}
          <BioTrackerCard 
            label="Treino" 
            icon={<Dumbbell size={18} />} 
            value={wellnessData.workout_done} 
            onChange={(val) => handleUpdateLog('workout_done', val)}
            activeColorClass="text-emerald-600 border-emerald-200 bg-emerald-50"
            variant="standard"
          />

          {/* Card 3: Energético */}
          <BioTrackerCard 
            label="Energético" 
            icon={<Zap size={18} />} 
            value={wellnessData.energy_drink_consumed} 
            onChange={(val) => handleUpdateLog('energy_drink_consumed', val)}
            activeColorClass="text-amber-500 border-amber-200 bg-amber-50"
            variant="avoidance"
          />

          {/* Card 4: Dor */}
          <BioTrackerCard 
            label="Dor" 
            icon={<Frown size={18} />} 
            value={wellnessData.headache} 
            onChange={(val) => handleUpdateLog('headache', val)}
            activeColorClass="text-red-500 border-red-200 bg-red-50"
            variant="avoidance"
          />
        </div>
      </div>

    </div>
  );
}