import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, PawPrint, BookOpen, Church, ChevronRight, Activity,
  CheckCircle2, Dumbbell, Check,
  Zap, Frown,
  Wine, Loader2, Scale, AlertCircle, Calendar, XCircle, Circle, Bell, ChevronDown
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useAuth } from '../../../contexts/AuthContext';
import { useCalendarEvents } from '../../../hooks/useCalendarEvents';
import { DashboardEventsSidebar } from '../components/DashboardEventsSidebar';
import { CategoryFilters } from '../components/CategoryFilters';
import type { CategoryFilter } from '../../../types/calendar';

// Hooks Específicos
import { useAccounts, useBills } from '../finance/hooks/useFinanceData';
import { useSubscriptions } from '../finance/hooks/useSubscriptions';
import UpcomingAlerts from '../finance/components/UpcomingAlerts';
import InvoicePaymentDialog from '../finance/components/modals/InvoicePaymentDialog';
import { Bill } from '../finance/types/finance.types';
import { useReadingProgress } from '../spiritual/hooks/useReadingProgress';
import { bibleBooks } from '../spiritual/data/bibleBooks';
import { DashboardCalendar } from '../components/DashboardCalendar';
import type { CalendarMarkers } from '../../../types/calendar';
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
    className="flex flex-col items-center justify-center p-4 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
  >
    <div className="text-muted-foreground group-hover:text-primary transition-colors mb-2">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
    </div>
    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
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

  let cardStyle = "bg-card border-border text-muted-foreground";
  let iconStyle = "text-muted-foreground";
  let statusIcon = <Circle size={18} className="text-stone-200" />;
  let statusText = "Registrar";

  if (value === true) {
    cardStyle = `bg-card ${activeColorClass} shadow-sm`;
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
      cardStyle = "bg-secondary border-border text-muted-foreground";
      iconStyle = "text-muted-foreground";
      statusIcon = <XCircle size={18} />;
      statusText = "Não";
    }
  }

  return (
    <button 
      onClick={handleClick}
      className={`
        w-full p-4 rounded-2xl border transition-all duration-200 overflow-hidden
        flex flex-col justify-between gap-2 h-24
        ${cardStyle}
        hover:scale-[1.01] active:scale-[0.98]
      `}
    >
      {/* Topo: Ícone + Label */}
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-full bg-white/50 flex-shrink-0 ${iconStyle}`}>
          {icon}
        </div>
        <span className="font-bold text-sm">{label}</span>
      </div>

      {/* Rodapé: Status + Ícone */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{statusText}</span>
        <div className="flex-shrink-0">{statusIcon}</div>
      </div>
    </button>
  );
};

// --- ACCORDION SECTION ---
interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  preview?: React.ReactNode;
  badge?: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, icon, isOpen, onToggle, children, preview, badge }) => (
  <div className="mb-4">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-1 py-3 group"
    >
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
        {icon} {title} {badge}
      </span>
      <div className="flex items-center gap-3">
        {!isOpen && preview && (
          <span className="text-sm font-semibold text-foreground">{preview}</span>
        )}
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[2000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
    >
      {children}
    </div>
  </div>
);

export default function HubPersonal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 1. FINANCEIRO
  const { accounts } = useAccounts();
  const { bills, refresh: refreshBills } = useBills();
  const { subscriptions } = useSubscriptions();
  const totalBalance = useMemo(() => accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0), [accounts]);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    financeiro: false,
    espiritual: false,
    tatica: false,
    pet: false,
    historico: false,
    biodata: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-700',
        icon: 'text-red-600',
        badge: 'bg-red-100 text-red-700 animate-pulse',
        label: '🔴 HOJE!'
      };
    } else if (daysUntil <= 3) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        text: 'text-amber-700',
        icon: 'text-amber-600',
        badge: 'bg-amber-100 text-amber-700',
        label: `⚠️ Em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`
      };
    } else {
      return {
        bg: 'bg-card',
        border: 'border-border',
        text: 'text-foreground',
        icon: 'text-primary',
        badge: 'bg-secondary text-muted-foreground',
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

  const [enabledCategories, setEnabledCategories] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([
    { category: 'workout', label: 'Treino', color: 'text-emerald-600', icon: 'Dumbbell', enabled: true },
    { category: 'headache', label: 'Sintoma', color: 'text-red-600', icon: 'Frown', enabled: true },
    { category: 'pet', label: 'Pet', color: 'text-purple-600', icon: 'PawPrint', enabled: true },
    { category: 'bill', label: 'Contas', color: 'text-red-600', icon: 'DollarSign', enabled: true },
    { category: 'invoice', label: 'Faturas', color: 'text-orange-600', icon: 'DollarSign', enabled: true },
    { category: 'spiritual', label: 'Espiritual', color: 'text-purple-600', icon: 'BookOpen', enabled: true },
    { category: 'study', label: 'Estudos', color: 'text-blue-600', icon: 'GraduationCap', enabled: true },
    { category: 'project', label: 'Projetos', color: 'text-emerald-600', icon: 'Briefcase', enabled: true },
    { category: 'general', label: 'Geral', color: 'text-muted-foreground', icon: 'Calendar', enabled: true },
  ]);
  
  const getMonthRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    return { startOfMonth, endOfMonth };
  };

  const { startOfMonth, endOfMonth } = getMonthRange(calendarMonth);

  const { data: financialMarkers, isLoading: isLoadingEvents } = useCalendarEvents({
    startDate: startOfMonth,
    endDate: endOfMonth,
    userId: user?.id || ''
  });

  const handleToggleCategory = (category: string) => {
    setCategoryFilters(prev => 
      prev.map(f => f.category === category ? { ...f, enabled: !f.enabled } : f)
    );
  };

  useEffect(() => {
    setEnabledCategories(categoryFilters.filter(f => f.enabled).map(f => f.category));
  }, [categoryFilters]);

  const combinedMarkers = useMemo(() => {
    const combined = { ...calendarMarkers };
    
    if (financialMarkers) {
      Object.keys(financialMarkers).forEach(dateKey => {
        if (!combined[dateKey]) {
          combined[dateKey] = {};
        }
        combined[dateKey] = {
          ...combined[dateKey],
          ...financialMarkers[dateKey]
        };
      });
    }
    
    return combined;
  }, [calendarMarkers, financialMarkers]);

  const selectedDateKey = formatDateDB(selectedDate);
  const eventsOfSelectedDay = combinedMarkers[selectedDateKey]?.events || [];
  const filteredEvents = eventsOfSelectedDay.filter(event => 
    enabledCategories.length === 0 || enabledCategories.includes(event.category)
  );

  const [wellnessData, setWellnessData] = useState<{
    weight: string;
    workout_done: boolean | null;
    workout_type: string;
    energy_drink_consumed: boolean | null;
    headache: boolean | null;
  }>({
    weight: '',
    workout_done: null,
    workout_type: '',
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
        const { data: petLogs } = await supabase.from('pet_logs').select('event_date').eq('user_id', user.id).gte('event_date', startOfMonth).lte('date', endOfMonth);

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
      setWellnessData({ weight: '', workout_done: null, workout_type: '', energy_drink_consumed: null, headache: null });
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
            workout_type: data.workout_type || '',
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
          workout_type: field === 'workout_type' ? value : (wellnessData.workout_type || null),
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

  const urgentPetTasks = petTasks.filter(task => !task.done && getDaysUntil(task.next_due_date) <= 3).length;

  return (
    <div className="animate-fade-in font-sans px-4 md:px-0 max-w-5xl mx-auto pb-24">
      
      {/* HEADER */}
      <header className="mb-6 pt-6 text-center md:text-left">
        <p className="text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Dashboard Operacional</p>
        <h1 className="text-3xl font-bold text-foreground tracking-tighter">
          Olá, <span className="text-muted-foreground font-serif italic">Cadu</span>.
        </h1>
        <p className="text-xs font-medium text-muted-foreground mt-1 capitalize">{formatFullDate(new Date())}</p>
      </header>

      {/* 1. NAVEGAÇÃO DE MÓDULOS */}
      <div className="mb-8">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
           <NavCard title="Financeiro" icon={<Wallet />} onClick={() => navigate('/personal/finance')} />
           <NavCard title="Saúde" icon={<Activity />} onClick={() => navigate('/personal/health')} />
           <NavCard title="Espiritual" icon={<Church />} onClick={() => navigate('/personal/spiritual')} />
           <NavCard title="Estudos" icon={<BookOpen />} onClick={() => navigate('/personal/studies')} />
           
           <button
  onClick={() => navigate('/personal/pet')}
  className="relative flex flex-col items-center justify-center p-4 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
>
  <div className="text-muted-foreground group-hover:text-primary transition-colors mb-2">
    <PawPrint size={24} />
  </div>
  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">PET CARE</span>
  {urgentPetTasks > 0 && (
    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse">
      {urgentPetTasks}
    </div>
  )}
</button>
           
           <NavCard title="Sommelier" icon={<Wine size={24} />} onClick={() => navigate('/personal/sommelier')} />
        </div>
      </div>

      {/* 2+3. FINANCEIRO (accordion) */}
      <AccordionSection
        title="Financeiro"
        icon={<Wallet size={16} />}
        isOpen={openSections.financeiro}
        onToggle={() => toggleSection('financeiro')}
        preview={
          <span className="text-foreground font-bold">
            R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        }
      >
        <div className="mb-4">
          <div
            onClick={() => navigate('/personal/finance/transactions')}
            className="bg-foreground rounded-[2rem] p-6 text-background shadow-lg cursor-pointer hover:scale-[1.01] transition-transform active:scale-95"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-background/50 mb-1">Saldo</p>
                <h2 className="text-3xl font-bold tracking-tighter">
                  R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="p-3 bg-background/10 rounded-full text-background/60">
                <Wallet size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <UpcomingAlerts bills={bills} subscriptions={subscriptions} onPayBill={setPayingBill} />
        </div>
        {payingBill && (
          <InvoicePaymentDialog
            isOpen={true}
            onClose={() => setPayingBill(null)}
            onSuccess={() => { refreshBills(); setPayingBill(null); }}
            bill={payingBill}
          />
        )}
      </AccordionSection>

      {/* 4. LENDO AGORA (accordion) */}
      {inProgressBooks.length > 0 && (
        <AccordionSection
          title="Lendo Agora"
          icon={<BookOpen size={16} />}
          isOpen={openSections.espiritual}
          onToggle={() => toggleSection('espiritual')}
          preview={<span className="text-xs text-muted-foreground">{inProgressBooks.length} livro{inProgressBooks.length > 1 ? 's' : ''}</span>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {inProgressBooks.slice(0, 2).map(book => {
              const stats = getBookProgress(book.name, book.chapters);
              return (
                <div
                  key={book.name}
                  onClick={() => navigate('/personal/spiritual/reading')}
                  className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-200 transition-colors group"
                >
                  <div className="flex-1">
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.15em] bg-blue-50 px-2 py-0.5 rounded mb-1.5 inline-block border border-blue-100/50">
                      Vida Espiritual
                    </span>
                    <h4 className="font-bold text-foreground group-hover:text-blue-700 transition-colors">{book.name}</h4>
                    <p className="text-xs text-muted-foreground">{stats.read} de {book.chapters} capítulos</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-600">{stats.percentage}%</span>
                    <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
                      <ChevronRight size={14} className="text-muted-foreground group-hover:text-blue-500" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AccordionSection>
      )}

      {/* 4. TÁTICA DIÁRIA (accordion) */}
      <AccordionSection
        title="Tática Diária (1-2-3)"
        icon={<CheckCircle2 size={16} />}
        isOpen={openSections.tatica}
        onToggle={() => toggleSection('tatica')}
        preview={(() => {
          const done = dailyTasks.filter(t => t.completed).length;
          const total = dailyTasks.length;
          return <span className="text-xs text-muted-foreground">{done}/{total} concluídas</span>;
        })()}
      >
        <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm space-y-4 mb-4">
            <div className="bg-secondary border-l-4 border-primary rounded-xl p-4 flex items-center gap-4">
              <button 
                  onClick={() => updateTask(focusTask.id, 'completed', !focusTask.completed)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${focusTask.completed ? 'bg-primary border-primary text-white' : 'border-border'}`}
              >
                  {focusTask.completed && <Check size={14} strokeWidth={3} />}
              </button>
              <input 
                  value={focusTask.text}
                  onChange={(e) => updateTask(focusTask.id, 'text', e.target.value)}
                  placeholder="Foco único do dia..."
                  className={`w-full bg-transparent font-bold text-foreground outline-none placeholder-stone-300 ${focusTask.completed ? 'line-through text-muted-foreground' : ''}`}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {importantTasks.map(task => (
                <div key={task.id} className="bg-secondary rounded-xl p-3 flex items-center gap-3 border border-border">
                    <button 
                      onClick={() => updateTask(task.id, 'completed', !task.completed)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-stone-400 border-stone-400 text-white' : 'border-border'}`}
                    >
                      {task.completed && <Check size={10} strokeWidth={3} />}
                    </button>
                    <input 
                      value={task.text}
                      onChange={(e) => updateTask(task.id, 'text', e.target.value)}
                      placeholder="Importante..."
                      className={`w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder-stone-300 ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                    />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {routineTasks.map(task => (
                <div key={task.id} className="bg-secondary/50 rounded-xl p-2.5 flex items-center gap-3 border border-border">
                    <button
                      onClick={() => updateTask(task.id, 'completed', !task.completed)}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-muted-foreground border-border text-white' : 'border-border'}`}
                    >
                      {task.completed && <Check size={8} strokeWidth={3} />}
                    </button>
                    <input
                      value={task.text}
                      onChange={(e) => updateTask(task.id, 'text', e.target.value)}
                      placeholder="Rotina..."
                      className={`w-full bg-transparent text-xs font-medium text-muted-foreground outline-none placeholder-stone-300 ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                    />
                </div>
              ))}
            </div>
          </div>
      </AccordionSection>

      {/* 5. PET REMINDERS (accordion) */}
      {petTasks.length > 0 && (
        <AccordionSection
          title="Compromissos Pet"
          icon={<PawPrint size={16} />}
          isOpen={openSections.pet}
          onToggle={() => toggleSection('pet')}
          badge={urgentPetTasks > 0 ? (
            <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full flex items-center gap-1">
              <Bell size={10} /> {urgentPetTasks} urgente{urgentPetTasks > 1 ? 's' : ''}
            </span>
          ) : undefined}
          preview={<span className="text-xs text-muted-foreground">{petTasks.length} compromisso{petTasks.length > 1 ? 's' : ''}</span>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
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
                          <PawPrint size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className={`font-bold ${style.text} text-sm truncate`}>{task.title}</h4>
                           <p className="text-xs text-muted-foreground font-medium">
                             {formatDateBr(task.next_due_date)}
                           </p>                          
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePetTask(task.id, task.done);
                        }}
                        disabled={updatingTaskId === task.id}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                          task.done 
                            ? 'bg-emerald-500 text-white shadow-sm' 
                            : 'bg-card border-2 border-border text-muted-foreground hover:border-emerald-400'
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
        </AccordionSection>
      )}

      {/* 6+7. HISTÓRICO MENSAL (accordion) */}
      <AccordionSection
        title="Histórico Mensal"
        icon={<Calendar size={16} />}
        isOpen={openSections.historico}
        onToggle={() => toggleSection('historico')}
        preview={<span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(calendarMonth)}</span>}
      >
        <div className="mb-4">
          <CategoryFilters
            filters={categoryFilters}
            onToggle={handleToggleCategory}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2 min-h-[450px]">
            <DashboardCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              currentMonth={calendarMonth}
              onMonthChange={setCalendarMonth}
              markers={combinedMarkers}
              enabledCategories={enabledCategories}
            />
          </div>
          <div className="min-h-[450px]">
            <DashboardEventsSidebar
              selectedDate={selectedDate}
              events={filteredEvents}
            />
          </div>
        </div>
      </AccordionSection>

      {/* 8. BIO-DATA CHECK-IN (accordion) */}
      <AccordionSection
        title={`Bio-Data • ${formatShortDate(selectedDate)}`}
        icon={<Activity size={16} />}
        isOpen={openSections.biodata}
        onToggle={() => toggleSection('biodata')}
        preview={wellnessData.weight ? <span className="text-xs text-muted-foreground">{wellnessData.weight} kg</span> : undefined}
        badge={
          saveStatus === 'saving' ? <Loader2 size={12} className="animate-spin text-muted-foreground ml-1" /> :
          saveStatus === 'saved' ? <CheckCircle2 size={12} className="text-emerald-600 ml-1" /> :
          saveStatus === 'error' ? <AlertCircle size={12} className="text-red-500 ml-1" /> : undefined
        }
      >
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Card 1: Peso (Input) */}
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between h-24">
                <div className="flex items-center gap-2 text-muted-foreground">
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
                        className="text-2xl font-bold text-foreground placeholder-stone-200 w-full bg-transparent outline-none"
                    />
                    <span className="text-xs font-bold text-muted-foreground">kg</span>
                </div>
          </div>

          {/* Card 2: Treino (com campo de texto) */}
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Dumbbell size={16} />
                <span className="font-bold text-xs uppercase tracking-wider">Treino</span>
              </div>
              <button
                onClick={() => {
                  const newValue = wellnessData.workout_done === null ? true : wellnessData.workout_done === true ? false : null;
                  handleUpdateLog('workout_done', newValue);
                  if (newValue !== true) {
                    setWellnessData(prev => ({ ...prev, workout_type: '' }));
                    handleUpdateLog('workout_type', null);
                  }
                }}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  wellnessData.workout_done === true 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                    : wellnessData.workout_done === false
                    ? 'bg-secondary text-muted-foreground border border-border'
                    : 'bg-secondary text-muted-foreground border border-border'
                }`}
              >
                {wellnessData.workout_done === true ? '✓ Sim' : wellnessData.workout_done === false ? '✗ Não' : 'Registrar'}
              </button>
            </div>
            
            {wellnessData.workout_done === true && (
              <input
                type="text"
                placeholder="Qual treino?"
                value={wellnessData.workout_type}
                onChange={(e) => setWellnessData(prev => ({ ...prev, workout_type: e.target.value }))}
                onBlur={(e) => handleUpdateLog('workout_type', e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder-stone-400"
                autoFocus
              />
            )}
          </div>

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
      </AccordionSection>

    </div>
  );
}