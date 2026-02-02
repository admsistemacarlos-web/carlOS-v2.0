
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ArrowLeft, Calendar, Target, 
  Compass, Mountain, CheckCircle2, AlertTriangle, 
  Loader2, Plus, Trash2, Crosshair, Zap, Flag,
  MoreVertical, Pencil, X, Trophy, ChevronLeft, ChevronRight, Star,
  Check, BarChart3, GripVertical, PlayCircle, Coffee, Shield
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { TimeBlockWidget } from '../components/TimeBlockWidget';

// --- DATE HELPERS ---

const startOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfWeek = (date: Date) => {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }) => {
  const days = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const addDays = (date: Date, amount: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
};

const subDays = (date: Date, amount: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() - amount);
  return d;
};

const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const isFuture = (date: Date) => {
  const now = new Date();
  const d = new Date(date);
  d.setHours(0,0,0,0);
  const t = new Date(now);
  t.setHours(0,0,0,0);
  return d > t;
};

// Helper para formatar data para o banco (YYYY-MM-DD)
const formatDateDB = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const format = (date: Date, fmt: string) => {
  if (fmt === 'yyyy-MM-dd') return formatDateDB(date);
  
  if (fmt === "d 'de' MMM") {
    const day = date.getDate();
    const month = date.toLocaleDateString('pt-BR', { month: 'short' });
    return `${day} de ${month.charAt(0).toUpperCase() + month.slice(1).replace('.', '')}`;
  }
  if (fmt === 'EEE') {
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });
    return weekday.charAt(0).toUpperCase() + weekday.slice(1).replace('.', '');
  }
  if (fmt === 'd') {
    return String(date.getDate());
  }
  return date.toLocaleDateString('pt-BR');
};

// --- TYPES ---

const WHEEL_AREAS = [
  'Espiritual', 'Saúde Física', 'Saúde Mental', 'Financeiro', 
  'Carreira', 'Relacionamento', 'Lazer', 'Intelectual'
];

interface GoalAction {
  id: string;
  title: string;
  type: 'recurring' | 'fixed';
  week?: number;
}

interface GoalData {
  id?: string;
  title: string;
  what: string;
  for_what: string;
  why: string;
  costs: string;
  actions: GoalAction[];
}

interface CycleState {
  startDate: string;
  endDate: string;
  antiVision: string;
  futureVision: string;
  dreams: string[];
  wheelScores: Record<string, number>;
  focusAreas: string[];
  goals: Record<string, GoalData>;
}

// Types do Banco de Dados
interface ActiveCycle {
  id: string;
  start_date: string;
  end_date: string;
  vision_future: string;
  anti_vision: string;
  dreams: string[];
  wheel_scores: { area: string; score: number }[];
  goals: {
    id: string;
    area: string;
    title: string;
    what: string;
    for_what: string;
    why: string;
    pain_costs: string;
    planning_actions: {
      id: string;
      title: string;
      type: 'recurring' | 'fixed';
      week_number: number | null;
    }[];
  }[];
}

interface DailyLog {
  id?: string; // Opcional pois no upsert pode não ser necessário saber antes
  action_id: string;
  log_date: string; // YYYY-MM-DD
  is_completed: boolean;
}

// Type para o Método 1-2-3 (Local)
interface OneTwoThreeTask {
  id: string;
  text: string;
  completed: boolean;
  type: '1' | '2' | '3';
}

// --- INITIAL STATE ---

const getToday = () => new Date().toLocaleDateString('en-CA');
const get12WeeksLater = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  date.setDate(date.getDate() + (12 * 7));
  return date.toLocaleDateString('en-CA');
};

const initialGoalData: GoalData = {
  title: '', what: '', for_what: '', why: '', costs: '', actions: []
};

// --- COMPONENT ---

export default function PlanningPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // States Globais
  const [loadingData, setLoadingData] = useState(true);
  const [activeCycle, setActiveCycle] = useState<ActiveCycle | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // States do Tracker Semanal
  const [currentTrackerDate, setCurrentTrackerDate] = useState(new Date());
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  
  // State do Método 1-2-3
  const [dailyTasks, setDailyTasks] = useState<OneTwoThreeTask[]>([]);

  // States do Wizard
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CycleState>({
    startDate: getToday(),
    endDate: get12WeeksLater(getToday()),
    antiVision: '',
    futureVision: '',
    dreams: ['', '', '', '', ''],
    wheelScores: WHEEL_AREAS.reduce((acc, area) => ({ ...acc, [area]: 5 }), {}),
    focusAreas: [],
    goals: {}
  });

  // --- FETCHING LOGIC ---

  useEffect(() => {
    if (!user) return;
    fetchActiveCycle();
  }, [user]);

  // Fetch Logs quando muda a semana ou o ciclo
  useEffect(() => {
    if (activeCycle) {
      fetchWeeklyLogs();
    }
  }, [activeCycle, currentTrackerDate]);

  // Load 1-2-3 Tasks from LocalStorage
  useEffect(() => {
    const dateKey = formatDateDB(currentTrackerDate);
    const storageKey = `carlos_123_${dateKey}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      setDailyTasks(JSON.parse(saved));
    } else {
      setDailyTasks([
        { id: '1-1', type: '1', text: '', completed: false },
        { id: '2-1', type: '2', text: '', completed: false },
        { id: '2-2', type: '2', text: '', completed: false },
        { id: '3-1', type: '3', text: '', completed: false },
        { id: '3-2', type: '3', text: '', completed: false },
        { id: '3-3', type: '3', text: '', completed: false },
      ]);
    }
  }, [currentTrackerDate]);

  const fetchActiveCycle = async () => {
    try {
      setLoadingData(true);
      
      const { data: cycle, error } = await supabase
        .from('planning_12sy_cycles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (cycle) {
        const { data: scores } = await supabase
          .from('planning_wheel_scores')
          .select('area, score')
          .eq('cycle_id', cycle.id);

        const { data: goals } = await supabase
          .from('planning_goals')
          .select(`*, planning_actions (*)`)
          .eq('cycle_id', cycle.id);

        setActiveCycle({
          ...cycle,
          wheel_scores: scores || [],
          goals: goals || []
        });
      } else {
        setActiveCycle(null);
      }

    } catch (err) {
      console.error("Erro ao carregar ciclo:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchWeeklyLogs = async () => {
    if (!activeCycle) return;
    
    const start = formatDateDB(startOfWeek(currentTrackerDate));
    const end = formatDateDB(endOfWeek(currentTrackerDate));

    try {
      const { data, error } = await supabase
        .from('planning_daily_logs')
        .select('*')
        .gte('log_date', start)
        .lte('log_date', end);

      if (!error && data) {
        setDailyLogs(data);
      } else {
        setDailyLogs([]); 
      }
    } catch (err) {
      console.log("Error fetching logs", err);
    }
  };

  // --- WIZARD HANDLERS ---
  const updateFormData = (updates: Partial<CycleState>) => { setFormData(prev => ({ ...prev, ...updates })); };
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = e.target.value;
    updateFormData({ startDate: start, endDate: get12WeeksLater(start) });
  };
  const handleWheelChange = (area: string, value: number) => {
    updateFormData({ wheelScores: { ...formData.wheelScores, [area]: value } });
  };
  const toggleFocusArea = (area: string) => {
    const current = formData.focusAreas;
    let newAreas = [];
    if (current.includes(area)) {
      newAreas = current.filter(a => a !== area);
      const newGoals = { ...formData.goals };
      delete newGoals[area];
      updateFormData({ focusAreas: newAreas, goals: newGoals });
    } else {
      if (current.length >= 3) return alert("Escolha no máximo 3 áreas de foco.");
      newAreas = [...current, area];
      updateFormData({ focusAreas: newAreas, goals: { ...formData.goals, [area]: { ...initialGoalData } } });
    }
  };
  const updateGoal = (area: string, field: keyof GoalData, value: any) => {
    setFormData(prev => ({ ...prev, goals: { ...prev.goals, [area]: { ...prev.goals[area], [field]: value } } }));
  };
  const addAction = (area: string, type: 'recurring' | 'fixed') => {
    const newAction: GoalAction = { id: crypto.randomUUID(), title: '', type, week: type === 'fixed' ? 1 : undefined };
    const currentActions = formData.goals[area].actions || [];
    updateGoal(area, 'actions', [...currentActions, newAction]);
  };
  const updateAction = (area: string, actionId: string, field: keyof GoalAction, value: any) => {
    const currentActions = formData.goals[area].actions.map(a => a.id === actionId ? { ...a, [field]: value } : a);
    updateGoal(area, 'actions', currentActions);
  };
  const removeAction = (area: string, actionId: string) => {
    const currentActions = formData.goals[area].actions.filter(a => a.id !== actionId);
    updateGoal(area, 'actions', currentActions);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      let cycleId = editingCycleId;
      if (editingCycleId) {
        await supabase.from('planning_12sy_cycles').update({
            start_date: new Date(formData.startDate).toISOString(),
            end_date: new Date(formData.endDate).toISOString(),
            vision_future: formData.futureVision,
            anti_vision: formData.antiVision,
            dreams: formData.dreams.filter(d => d.trim() !== ''),
          }).eq('id', editingCycleId);
        await supabase.from('planning_wheel_scores').delete().eq('cycle_id', editingCycleId);
        await supabase.from('planning_goals').delete().eq('cycle_id', editingCycleId);
      } else {
        const { data: cycle, error } = await supabase.from('planning_12sy_cycles').insert({
            user_id: user.id,
            start_date: new Date(formData.startDate).toISOString(),
            end_date: new Date(formData.endDate).toISOString(),
            vision_future: formData.futureVision,
            anti_vision: formData.antiVision,
            dreams: formData.dreams.filter(d => d.trim() !== ''),
            status: 'active'
          }).select().single();
        if (error) throw error;
        cycleId = cycle.id;
      }
      if (!cycleId) throw new Error("ID do ciclo não encontrado.");
      
      const wheelPayload = Object.entries(formData.wheelScores).map(([area, score]) => ({ cycle_id: cycleId, user_id: user.id, area, score }));
      await supabase.from('planning_wheel_scores').insert(wheelPayload);
      
      for (const area of formData.focusAreas) {
        const goalData = formData.goals[area];
        const { data: goal } = await supabase.from('planning_goals').insert({
            cycle_id: cycleId, user_id: user.id, area, title: goalData.title, what: goalData.what,
            for_what: goalData.for_what, why: goalData.why, pain_costs: goalData.costs, status: 'active'
          }).select().single();
        
        if (goal && goalData.actions.length > 0) {
          const actionsPayload = goalData.actions.map(action => ({
            goal_id: goal.id, user_id: user.id, title: action.title, type: action.type,
            week_number: action.type === 'fixed' ? action.week : null
          }));
          await supabase.from('planning_actions').insert(actionsPayload);
        }
      }

      // Redireciona para o Dashboard recarregando os dados (sem recarregar a página)
      await fetchActiveCycle();
      setEditingCycleId(null);
      setStep(1);
      setIsMenuOpen(false);

    } catch (err: any) { 
        alert("Erro: " + err.message); 
    } finally { 
        setSubmitting(false); 
    }
  };

  // --- ACTIONS (DELETE & EDIT CYCLE) ---
  const handleDeleteCycle = () => { setIsDeleteModalOpen(true); setIsMenuOpen(false); };
  const confirmDeleteCycle = async () => {
    if (!activeCycle) return;
    try {
      setLoadingData(true);
      await supabase.from('planning_12sy_cycles').delete().eq('id', activeCycle.id);
      setActiveCycle(null);
      setEditingCycleId(null);
      setIsDeleteModalOpen(false);
      setFormData({
        startDate: getToday(), endDate: get12WeeksLater(getToday()), antiVision: '', futureVision: '',
        dreams: ['', '', '', '', ''], wheelScores: WHEEL_AREAS.reduce((acc, area) => ({ ...acc, [area]: 5 }), {}),
        focusAreas: [], goals: {}
      });
      setStep(1);
    } catch (err: any) { alert("Erro: " + err.message); } finally { setLoadingData(false); }
  };

  const handleEditCycle = () => {
    if (!activeCycle) return;
    const scores: Record<string, number> = {};
    activeCycle.wheel_scores.forEach(ws => { scores[ws.area] = ws.score; });
    WHEEL_AREAS.forEach(area => { if (scores[area] === undefined) scores[area] = 5; });
    const mappedGoals: Record<string, GoalData> = {};
    const focusAreas: string[] = [];
    activeCycle.goals.forEach(g => {
      focusAreas.push(g.area);
      mappedGoals[g.area] = {
        id: g.id, title: g.title, what: g.what, for_what: g.for_what, why: g.why, costs: g.pain_costs,
        actions: g.planning_actions.map(a => ({ id: a.id, title: a.title, type: a.type as 'recurring' | 'fixed', week: a.week_number || undefined }))
      };
    });
    setFormData({
      startDate: new Date(activeCycle.start_date).toISOString().split('T')[0],
      endDate: new Date(activeCycle.end_date).toISOString().split('T')[0],
      antiVision: activeCycle.anti_vision || '', futureVision: activeCycle.vision_future || '',
      dreams: activeCycle.dreams || ['', '', '', '', ''], wheelScores: scores, focusAreas: focusAreas, goals: mappedGoals
    });
    setEditingCycleId(activeCycle.id);
    setStep(1);
    setIsMenuOpen(false);
    setActiveCycle(null); 
  };

  // --- TRACKER LOGIC ---

  const toggleDailyLog = async (actionId: string, date: Date) => {
    if (!user) return;
    const logDate = formatDateDB(date);

    // Encontrar log existente localmente
    const existingLog = dailyLogs.find(l => l.action_id === actionId && l.log_date === logDate);
    const newStatus = existingLog ? !existingLog.is_completed : true;

    // Atualização Otimista
    let newLogs = [...dailyLogs];
    if (existingLog) {
        newLogs = newLogs.map(l => 
            l.action_id === actionId && l.log_date === logDate 
            ? { ...l, is_completed: newStatus } 
            : l
        );
    } else {
        newLogs.push({ action_id: actionId, log_date: logDate, is_completed: true });
    }
    setDailyLogs(newLogs);

    // Call Supabase Upsert
    try {
        await supabase.from('planning_daily_logs').upsert({
            action_id: actionId,
            log_date: logDate,
            is_completed: newStatus,
            user_id: user.id
        }, { onConflict: 'action_id, log_date' });
    } catch (error) {
        console.error("Erro ao salvar log:", error);
    }
  };

  // --- 1-2-3 METHOD LOGIC ---
  const update123Task = (taskId: string, field: 'text' | 'completed', value: any) => {
    const updatedTasks = dailyTasks.map(t => t.id === taskId ? { ...t, [field]: value } : t);
    setDailyTasks(updatedTasks);
    
    const dateKey = formatDateDB(currentTrackerDate);
    const storageKey = `carlos_123_${dateKey}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedTasks));
  };

  // --- RENDER DASHBOARD ---

  const renderDashboard = () => {
    if (!activeCycle) return null;

    const startOfCurrentWeek = startOfWeek(currentTrackerDate);
    const weekDays = eachDayOfInterval({
      start: startOfCurrentWeek,
      end: endOfWeek(currentTrackerDate)
    });

    const cycleStartDate = new Date(activeCycle.start_date);
    
    const diffTime = currentTrackerDate.getTime() - cycleStartDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let currentCycleWeek = Math.ceil(diffDays / 7);
    if (currentCycleWeek < 1) currentCycleWeek = 1;

    // --- SCORECARD LOGIC ---
    let totalScheduled12S = 0;
    let totalCompleted12S = 0;

    const recurringActions = activeCycle.goals.flatMap(g => g.planning_actions.filter(a => a.type === 'recurring').map(a => ({...a, goalArea: g.area})));
    
    // Calcula Scorecard da Semana
    recurringActions.forEach(action => {
      weekDays.forEach(day => {
        // Considera apenas dias até hoje (ou futuro se já marcou, mas lógica padrão é passado+hoje)
        if (day <= new Date()) { 
           totalScheduled12S++;
           const log = dailyLogs.find(l => l.action_id === action.id && l.log_date === formatDateDB(day));
           if (log?.is_completed) totalCompleted12S++;
        }
      });
    });

    const performance = totalScheduled12S > 0 ? Math.round((totalCompleted12S / totalScheduled12S) * 100) : 0;
    const isGoodPerformance = performance >= 85;

    return (
      <div className="space-y-8 animate-fade-in pb-24" onClick={() => setIsMenuOpen(false)}>
        {/* Header Navigation */}
        <div className="px-8 pt-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/personal/health')} className="p-2 -ml-2 rounded-full hover:bg-stone-100 text-stone-400 transition-colors">
                <ArrowLeft size={20} />
             </button>
             <div>
                <h1 className="text-2xl font-bold text-stone-800 tracking-tight flex items-center gap-2">
                   Daily Tracker <span className="text-stone-300 font-light">|</span> <span className="text-[#143d2d]">Semana {currentCycleWeek}</span>
                </h1>
                <p className="text-xs font-medium text-stone-500 mt-1 uppercase tracking-widest">
                   {format(startOfCurrentWeek, "d 'de' MMM")} - {format(endOfWeek(currentTrackerDate), "d 'de' MMM")}
                </p>
             </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-stone-200 shadow-sm">
             <button onClick={() => setCurrentTrackerDate(subDays(currentTrackerDate, 1))} className="p-2 hover:bg-stone-100 rounded-lg text-stone-500"><ChevronLeft size={18} /></button>
             <button onClick={() => setCurrentTrackerDate(new Date())} className="px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 rounded-lg text-stone-600">Hoje</button>
             <button onClick={() => setCurrentTrackerDate(addDays(currentTrackerDate, 1))} className="p-2 hover:bg-stone-100 rounded-lg text-stone-500"><ChevronRight size={18} /></button>
          </div>

          <div className="relative ml-auto md:ml-0">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                className="p-2.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors text-stone-500 shadow-sm"
              >
                <MoreVertical size={20} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden z-50 animate-fade-in">
                  <button onClick={handleEditCycle} className="w-full text-left px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2 font-medium"><Pencil size={14} /> Editar Planejamento</button>
                  <button onClick={handleDeleteCycle} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium border-t border-stone-50"><Trash2 size={14} /> Excluir Ciclo</button>
                </div>
              )}
            </div>
        </div>

        {/* --- TIME BLOCKS & SCORECARD --- */}
        <div className="px-8 flex flex-col md:flex-row gap-6">
            {/* Scorecard */}
            <div className="flex-1 bg-white rounded-[2rem] border border-stone-200 p-6 shadow-sm flex items-center gap-6 relative overflow-hidden min-h-[220px]">
                <div className={`absolute top-0 right-0 p-4 opacity-10 ${isGoodPerformance ? 'text-emerald-500' : 'text-stone-300'}`}>
                    <Trophy size={80} />
                </div>
                <div className={`z-10 p-4 rounded-2xl ${isGoodPerformance ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-500'}`}>
                    <BarChart3 size={32} />
                </div>
                <div className="z-10 flex-1">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500">Execução Estratégica</h3>
                            <p className="text-[10px] text-stone-400">Meta: 85% das ações 12S</p>
                        </div>
                        <span className={`text-4xl font-bold tracking-tighter ${isGoodPerformance ? 'text-emerald-600' : 'text-stone-700'}`}>
                            {performance}%
                        </span>
                    </div>
                    <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isGoodPerformance ? 'bg-emerald-500' : 'bg-[#143d2d]'}`}
                            style={{ width: `${performance}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Novo Widget de Blocos de Tempo */}
            <div className="flex-1">
               <TimeBlockWidget />
            </div>
        </div>

        {/* --- WEEKLY HABIT GRID (The 80 Plan) --- */}
        <div className="px-8">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
               <Crosshair size={16} /> Grade de Hábitos (Plano 80)
            </h3>
            
            <div className="bg-white border border-stone-200 rounded-[2rem] shadow-sm overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Header Row */}
                    <div className="grid grid-cols-[1.8fr_repeat(7,1fr)] border-b border-stone-100 bg-stone-50/50">
                        <div className="p-4 flex items-end">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Ações Fundamentais</span>
                        </div>
                        {weekDays.map(day => {
                            const isTodayDate = isToday(day);
                            return (
                                <div key={day.toISOString()} className={`p-3 text-center border-l border-stone-50 flex flex-col items-center justify-center ${isTodayDate ? 'bg-[#143d2d]/5' : ''}`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isTodayDate ? 'text-[#143d2d]' : 'text-stone-400'}`}>
                                        {format(day, 'EEE')}
                                    </span>
                                    <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full ${isTodayDate ? 'bg-[#143d2d] text-white shadow-md' : 'text-stone-700'}`}>
                                        {format(day, 'd')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions Rows */}
                    <div className="divide-y divide-stone-50">
                        {recurringActions.map(action => (
                            <div key={action.id} className="grid grid-cols-[1.8fr_repeat(7,1fr)] hover:bg-stone-50/30 transition-colors group">
                                <div className="p-4 flex flex-col justify-center border-r border-stone-50/50 relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#143d2d] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">{action.goalArea}</span>
                                    <span className="text-sm font-bold text-stone-700 leading-tight">{action.title}</span>
                                </div>
                                {weekDays.map(day => {
                                    const log = dailyLogs.find(l => l.action_id === action.id && l.log_date === formatDateDB(day));
                                    const isDone = log?.is_completed;
                                    const isFutureDay = isFuture(day) && !isToday(day);

                                    return (
                                        <div key={day.toISOString()} className="border-l border-stone-50 flex items-center justify-center p-2">
                                            <button
                                                disabled={isFutureDay}
                                                onClick={() => toggleDailyLog(action.id, day)}
                                                className={`
                                                    w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                                    ${isDone 
                                                        ? 'bg-[#143d2d] border-[#143d2d] text-white shadow-sm scale-100' 
                                                        : 'border-stone-200 bg-white text-transparent hover:border-[#143d2d]/30 hover:scale-110'
                                                    }
                                                    ${isFutureDay ? 'opacity-30 cursor-not-allowed border-stone-100' : 'cursor-pointer'}
                                                `}
                                            >
                                                <Check size={14} strokeWidth={4} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        {recurringActions.length === 0 && (
                            <div className="p-10 text-center text-stone-400 text-sm italic">
                                Nenhuma ação recorrente configurada.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* --- 1-2-3 METHOD SECTION --- */}
        <div className="px-8">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
               <Zap size={16} /> Tática Diária: Método 1-2-3
            </h3>

            <div className="flex flex-col gap-4">
                {/* 1. Prioridade Alta */}
                <div className="bg-gradient-to-r from-[#143d2d] to-[#1e5740] rounded-[1.5rem] p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Star size={64} /></div>
                    <div className="relative z-10">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-2 block">1. Prioridade Única (Foco 12S)</label>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => update123Task(dailyTasks[0].id, 'completed', !dailyTasks[0].completed)}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${dailyTasks[0].completed ? 'bg-white border-white text-[#143d2d]' : 'border-emerald-200/50 hover:border-white'}`}
                            >
                                {dailyTasks[0].completed && <Check size={16} strokeWidth={4} />}
                            </button>
                            <input 
                                value={dailyTasks[0].text}
                                onChange={(e) => update123Task(dailyTasks[0].id, 'text', e.target.value)}
                                placeholder="A coisa mais importante do dia..."
                                className="bg-transparent border-b border-emerald-200/30 w-full text-xl font-bold placeholder-emerald-200/50 focus:border-white outline-none py-2"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Prioridades Médias */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dailyTasks.filter(t => t.type === '2').map(task => (
                        <div key={task.id} className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                            <button 
                                onClick={() => update123Task(task.id, 'completed', !task.completed)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-stone-400 border-stone-400 text-white' : 'border-stone-300 hover:border-[#143d2d]'}`}
                            >
                                {task.completed && <Check size={12} strokeWidth={4} />}
                            </button>
                            <input 
                                value={task.text}
                                onChange={(e) => update123Task(task.id, 'text', e.target.value)}
                                placeholder="Importante..."
                                className={`w-full text-sm font-medium outline-none placeholder-stone-300 ${task.completed ? 'text-stone-400 line-through' : 'text-stone-700'}`}
                            />
                        </div>
                    ))}
                </div>

                {/* 3. Prioridades Baixas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dailyTasks.filter(t => t.type === '3').map(task => (
                        <div key={task.id} className="bg-stone-50 border border-stone-100 rounded-xl p-3 flex items-center gap-3">
                            <button 
                                onClick={() => update123Task(task.id, 'completed', !task.completed)}
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-stone-300 border-stone-300 text-white' : 'border-stone-300 bg-white hover:border-stone-400'}`}
                            >
                                {task.completed && <Check size={10} strokeWidth={4} />}
                            </button>
                            <input 
                                value={task.text}
                                onChange={(e) => update123Task(task.id, 'text', e.target.value)}
                                placeholder="Rotina/Admin..."
                                className={`w-full text-xs font-medium bg-transparent outline-none placeholder-stone-300 ${task.completed ? 'text-stone-400 line-through' : 'text-stone-600'}`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    );
  };

  // --- RENDER WIZARD ---
  const renderWizardStep1 = () => ( 
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#143d2d]">{editingCycleId ? 'Editar: A Peça é Você' : 'A Peça é Você'}</h2>
        <p className="text-stone-500">Defina o ponto de partida e a visão clara do futuro.</p>
      </div>
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Período do Ciclo</label>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#143d2d]" size={18} />
            <input type="date" value={formData.startDate} onChange={handleDateChange} className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl text-stone-800 font-bold outline-none focus:ring-2 focus:ring-[#143d2d]/20" />
          </div>
          <ArrowRight className="text-stone-300" />
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input type="date" value={formData.endDate} readOnly className="w-full pl-10 pr-4 py-3 bg-stone-50/50 rounded-xl text-stone-500 font-bold outline-none cursor-not-allowed" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="text-red-500" size={20} /><h3 className="text-lg font-bold text-red-700">Anti-Visão</h3></div>
          <textarea value={formData.antiVision} onChange={e => updateFormData({ antiVision: e.target.value })} className="w-full h-40 bg-white/50 rounded-xl p-4 text-sm text-stone-700 outline-none resize-none focus:bg-white transition-colors" placeholder="O que eu NÃO tolero mais?" />
        </div>
        <div className="bg-[#143d2d]/5 p-6 rounded-[2rem] border border-[#143d2d]/10">
          <div className="flex items-center gap-2 mb-3"><Mountain className="text-[#143d2d]" size={20} /><h3 className="text-lg font-bold text-[#143d2d]">Visão de Futuro</h3></div>
          <textarea value={formData.futureVision} onChange={e => updateFormData({ futureVision: e.target.value })} className="w-full h-40 bg-white/50 rounded-xl p-4 text-sm text-stone-700 outline-none resize-none focus:bg-white transition-colors" placeholder="Onde estarei ao final?" />
        </div>
      </div>
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2"><Target className="text-[#143d2d]" size={20} /> 5 Sonhos para este Ciclo</h3>
        <div className="space-y-3">
          {formData.dreams.map((dream, index) => (
            <div key={index} className="flex items-center gap-3"><span className="text-xs font-bold text-stone-300 w-4">{index + 1}</span><input value={dream} onChange={e => { const newDreams = [...formData.dreams]; newDreams[index] = e.target.value; updateFormData({ dreams: newDreams }); }} className="flex-1 bg-stone-50 border-b border-transparent focus:border-[#143d2d] px-3 py-2 outline-none text-stone-700 transition-all rounded-lg" placeholder="Um objetivo concreto..." /></div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWizardStep2 = () => { 
    const chartData = WHEEL_AREAS.map(area => ({ subject: area, A: formData.wheelScores[area], fullMark: 10 }));
    return (
        <div className="space-y-8 animate-fade-in h-full flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
            <div className="mb-4"><h2 className="text-2xl font-bold text-[#143d2d]">O Diagnóstico</h2><p className="text-stone-500">Seja honesto. Onde você está hoje (0 a 10)?</p></div>
            <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto pr-2">
            {WHEEL_AREAS.map(area => (
                <div key={area} className="bg-white p-4 rounded-xl border border-stone-100"><div className="flex justify-between mb-2"><label className="text-sm font-bold text-stone-700">{area}</label><span className="text-sm font-bold text-[#143d2d] bg-[#143d2d]/10 px-2 py-0.5 rounded">{formData.wheelScores[area]}</span></div><input type="range" min="0" max="10" step="1" value={formData.wheelScores[area]} onChange={(e) => handleWheelChange(area, Number(e.target.value))} className="w-full accent-[#143d2d] h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer" /></div>
            ))}
            </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-white rounded-[2rem] border border-stone-100 shadow-sm p-4 min-h-[300px]"><ResponsiveContainer width="100%" height="100%" minHeight={300}><RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}><PolarGrid stroke="#e5e5e5" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#78716c', fontSize: 10, fontWeight: 'bold' }} /><PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} /><Radar name="Você" dataKey="A" stroke="#143d2d" strokeWidth={3} fill="#143d2d" fillOpacity={0.3} /></RadarChart></ResponsiveContainer></div>
        </div>
    );
  };

  const renderWizardStep3 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8"><h2 className="text-2xl font-bold text-[#143d2d]">Desequilíbrio Intencional</h2><p className="text-stone-500 max-w-lg mx-auto">Para avançar rápido, você precisa focar. Escolha de <span className="font-bold text-[#143d2d]">1 a 3 áreas</span>.</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {WHEEL_AREAS.map(area => {
          const isSelected = formData.focusAreas.includes(area);
          return (<button key={area} onClick={() => toggleFocusArea(area)} className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 h-32 ${isSelected ? 'border-[#143d2d] bg-[#143d2d] text-white shadow-lg scale-105' : 'border-stone-200 bg-white text-stone-400 hover:border-[#143d2d]/30 hover:bg-stone-50'}`}>{isSelected ? <Crosshair size={24} /> : <Compass size={24} />}<span className="text-sm font-bold uppercase tracking-wider text-center">{area}</span></button>);
        })}
      </div>
    </div>
  );

  const renderWizardStep4 = () => (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="mb-6"><h2 className="text-2xl font-bold text-[#143d2d]">{editingCycleId ? 'Revisar Plano' : 'O Plano 80'}</h2><p className="text-stone-500">Defina o "como" para cada área de foco.</p></div>
      {formData.focusAreas.map((area, index) => {
        const goal = formData.goals[area];
        return (
          <div key={area} className="bg-white border border-stone-200 rounded-[2rem] overflow-hidden shadow-sm mb-8">
            <div className="bg-[#143d2d] p-4 text-white flex justify-between items-center"><h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2"><span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">{index + 1}</span>{area}</h3></div>
            <div className="p-6 md:p-8 space-y-8">
              <div className="space-y-4"><div><label className="text-[10px] font-bold uppercase text-stone-400">Título da Meta</label><input value={goal.title} onChange={e => updateGoal(area, 'title', e.target.value)} placeholder={`Ex: Transformar meu corpo`} className="w-full text-xl font-bold text-[#143d2d] placeholder-stone-300 outline-none border-b border-stone-100 py-2" /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-stone-50 p-4 rounded-xl"><label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">O Quê?</label><textarea value={goal.what} onChange={e => updateGoal(area, 'what', e.target.value)} rows={2} className="w-full bg-transparent text-sm resize-none outline-none" /></div><div className="bg-stone-50 p-4 rounded-xl"><label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">Para Quê?</label><textarea value={goal.for_what} onChange={e => updateGoal(area, 'for_what', e.target.value)} rows={2} className="w-full bg-transparent text-sm resize-none outline-none" /></div><div className="bg-stone-50 p-4 rounded-xl"><label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">Por Quê?</label><textarea value={goal.why} onChange={e => updateGoal(area, 'why', e.target.value)} rows={2} className="w-full bg-transparent text-sm resize-none outline-none" /></div></div></div>
              <div><div className="flex justify-between items-end mb-3"><h4 className="text-sm font-bold text-stone-700 flex items-center gap-2"><Zap size={16} className="text-[#143d2d]" /> Ações Fundamentais</h4><button onClick={() => addAction(area, 'recurring')} className="text-[#143d2d] text-xs font-bold hover:underline">+ Adicionar</button></div><div className="space-y-2">{goal.actions.filter(a => a.type === 'recurring').map(action => (<div key={action.id} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#143d2d]"></div><input value={action.title} onChange={e => updateAction(area, action.id, 'title', e.target.value)} className="flex-1 bg-stone-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#143d2d]/20" /><button onClick={() => removeAction(area, action.id)} className="text-stone-300 hover:text-red-500"><Trash2 size={14} /></button></div>))}</div></div>
              <div><div className="flex justify-between items-end mb-3"><h4 className="text-sm font-bold text-stone-700 flex items-center gap-2"><Flag size={16} className="text-red-500" /> Peças Chave</h4><button onClick={() => addAction(area, 'fixed')} className="text-[#143d2d] text-xs font-bold hover:underline">+ Adicionar</button></div><div className="space-y-2">{goal.actions.filter(a => a.type === 'fixed').map(action => (<div key={action.id} className="flex items-center gap-2"><select value={action.week} onChange={e => updateAction(area, action.id, 'week', Number(e.target.value))} className="bg-stone-100 rounded-lg px-2 py-2 text-xs font-bold text-stone-600 outline-none cursor-pointer">{[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Sem {i+1}</option>)}</select><input value={action.title} onChange={e => updateAction(area, action.id, 'title', e.target.value)} className="flex-1 bg-stone-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#143d2d]/20" /><button onClick={() => removeAction(area, action.id)} className="text-stone-300 hover:text-red-500"><Trash2 size={14} /></button></div>))}</div></div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWizard = () => { 
    const steps = [{ num: 1, label: 'Visão' }, { num: 2, label: 'Roda' }, { num: 3, label: 'Foco' }, { num: 4, label: 'Plano' }];
    return (
        <div className="w-full min-h-screen bg-transparent pb-20 font-sans text-stone-800">
            <div className="px-8 pt-8 pb-6 flex items-center justify-between"><button onClick={() => editingCycleId ? window.location.reload() : navigate('/personal/health')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-[#143d2d] transition-colors"><ArrowLeft size={14} /> Cancelar</button><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#143d2d] animate-pulse"></span><span className="text-xs font-bold uppercase tracking-widest text-[#143d2d]">{editingCycleId ? 'Editando Ciclo' : 'Novo Ciclo 12S'}</span></div></div>
            <div className="px-8 mb-8"><div className="flex justify-between max-w-md mx-auto relative"><div className="absolute top-1/2 left-0 w-full h-0.5 bg-stone-200 -z-10 -translate-y-1/2"></div>{steps.map((s) => (<div key={s.num} className="flex flex-col items-center gap-2 bg-[#fafafa] px-2"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${step >= s.num ? 'bg-[#143d2d] text-white shadow-lg scale-110' : 'bg-stone-200 text-stone-400'}`}>{s.num}</div><span className={`text-[10px] font-bold uppercase tracking-widest ${step >= s.num ? 'text-[#143d2d]' : 'text-stone-300'}`}>{s.label}</span></div>))}</div></div>
            <div className="px-8 max-w-4xl mx-auto">{step === 1 && renderWizardStep1()}{step === 2 && renderWizardStep2()}{step === 3 && renderWizardStep3()}{step === 4 && renderWizardStep4()}</div>
            <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-stone-200 p-4 md:px-8 flex justify-between items-center z-50"><button onClick={() => setStep(prev => Math.max(1, prev - 1))} disabled={step === 1} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-100 disabled:opacity-30 transition-colors">Voltar</button>{step < 4 ? (<button onClick={() => setStep(prev => Math.min(4, prev + 1))} className="bg-[#143d2d] hover:bg-[#0f2e22] text-white px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all active:scale-95">Próximo <ArrowRight size={14} /></button>) : (<button onClick={handleFinish} disabled={submitting} className="bg-[#143d2d] hover:bg-[#0f2e22] text-white px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-70">{submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}{submitting ? 'Salvando...' : (editingCycleId ? 'Atualizar Planejamento' : 'Finalizar Planejamento')}</button>)}</div>
        </div>
    );
  };

  // --- MAIN RENDER LOGIC ---

  if (loadingData) {
    return <div className="h-screen w-full flex items-center justify-center bg-transparent"><Loader2 className="animate-spin text-[#143d2d]" size={32}/></div>;
  }

  // Se tivermos um ID de edição ou não tiver ciclo ativo, mostramos o Wizard.
  if (editingCycleId || !activeCycle) {
    return renderWizard();
  }

  return (
    <>
      {renderDashboard()}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1c1917]/20 backdrop-blur-sm transition-opacity" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[1.5rem] shadow-2xl p-6 animate-fade-in border border-stone-200">
            <div className="flex flex-col items-center text-center"><div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-100"><AlertTriangle size={24} /></div><h2 className="text-lg font-bold text-stone-800 mb-2">Excluir Ciclo?</h2><p className="text-sm text-stone-500 leading-relaxed mb-6">Tem certeza que deseja excluir este ciclo de 12 semanas? Todos os dados, metas e progressos serão perdidos.</p><div className="flex gap-3 w-full"><button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors">Cancelar</button><button onClick={confirmDeleteCycle} disabled={loadingData} className="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2">{loadingData ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}{loadingData ? 'Excluindo...' : 'Excluir'}</button></div></div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
