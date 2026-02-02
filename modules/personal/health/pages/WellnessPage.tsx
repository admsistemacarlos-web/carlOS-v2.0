
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, ChevronLeft, ChevronRight, 
  CheckCircle2, Zap, ZapOff, Frown, 
  Scale, Activity, Calendar as CalendarIcon, Loader2,
  Dumbbell, Footprints, Volleyball, Dribbble
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHealth } from '../hooks/useHealth';

// --- DATE HELPERS (Replacement for date-fns) ---
const getStartOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const getEndOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday
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
  // Normalize hours to avoid infinite loops in some edge cases
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

interface WellnessLog {
  id: string;
  date: string;
  weight: number | null;
  workout_done: boolean;
  workout_type: string | null;
  headache: boolean;
  notes: string | null;
  energy_drink_consumed?: boolean;
}

export default function WellnessPage() {
  const navigate = useNavigate();
  const { data: logs, loading, fetchData } = useHealth<WellnessLog>('health_wellness_logs');
  
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // --- LÓGICA DO CALENDÁRIO ---
  const calendarDays = useMemo(() => {
    const monthStart = getStartOfMonth(currentDate);
    const monthEnd = getEndOfMonth(monthStart);
    const startDate = getStartOfWeek(monthStart);
    const endDate = getEndOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Mapa de logs por data para busca rápida O(1)
  const logsMap = useMemo(() => {
    const map: Record<string, WellnessLog> = {};
    logs.forEach(log => {
      const dateKey = formatDateKey(new Date(log.date));
      map[dateKey] = log;
    });
    return map;
  }, [logs]);

  // --- DADOS DO GRÁFICO ---
  const weightChartData = useMemo(() => {
    return logs
      .filter(l => l.weight !== null && l.weight > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(l => ({
        date: new Date(l.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        fullDate: new Date(l.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
        weight: l.weight
      }))
      .slice(-14); // Pega os últimos 14 registros de peso para o gráfico
  }, [logs]);

  const handleDayClick = (date: Date) => {
    const dateKey = formatDateKey(date);
    const existingLog = logsMap[dateKey];
    
    if (existingLog) {
      navigate(`/personal/health/wellness/${existingLog.id}`);
    } else {
      // Passa a data selecionada para a página de criação via state ou query
      navigate(`/personal/health/wellness/new?date=${dateKey}`);
    }
  };

  // Helper para ícone do treino
  const getWorkoutIcon = (type: string | null) => {
    const t = (type || '').toLowerCase();
    
    // Vôlei
    if (t.includes('vôlei') || t.includes('volei') || t.includes('volleyball')) {
      return <Volleyball size={10} />;
    }
    
    // FTV / Futebol (Usando Dribbble como representação de bola)
    if (t.includes('ftv') || t.includes('fute') || t.includes('futebol') || t.includes('soccer')) {
      return <Dribbble size={10} />;
    }

    // Cardio / Running
    if (t.includes('cardio') || t.includes('caminhada') || t.includes('corrida') || t.includes('esteira')) {
      return <Footprints size={10} />;
    }

    // Weights
    if (t.includes('musculação') || t.includes('treino') || t.includes('peso') || t.includes('strength')) {
      return <Dumbbell size={10} />;
    }

    // Default
    return <Activity size={10} />;
  };

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans bg-transparent">
      
      {/* Header */}
      <div className="px-4 md:px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <button onClick={() => navigate('/personal/health')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-[#143d2d] transition-colors mb-4">
            <ArrowLeft size={14} /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight flex items-center gap-3">
            <CalendarIcon className="text-[#143d2d]" /> Diário de Bem-Estar
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Seletor de Mês */}
          <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1 shadow-sm overflow-hidden">
            <button onClick={prevMonth} className="p-2 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-[#143d2d] transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 min-w-[140px] text-center">
              <span className="text-sm font-bold text-stone-700 capitalize">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-[#143d2d] transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <button onClick={goToToday} className="px-4 py-2.5 bg-white border border-stone-200 text-stone-500 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-stone-50 transition-colors shadow-sm">
            Hoje
          </button>

          <button onClick={() => navigate('/personal/health/wellness/new')} className="bg-[#143d2d] hover:bg-[#0f2e22] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm transition-all active:scale-95 ml-auto md:ml-0">
            <Plus size={18} /> Novo
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-8">
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#143d2d]" size={32} /></div>
        ) : (
          <>
            {/* Gráfico de Evolução de Peso */}
            {weightChartData.length > 1 && (
              <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm p-6">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Scale size={14} className="text-[#143d2d]" /> Evolução do Peso (Recente)
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#143d2d" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#143d2d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 10, fill: '#a8a29e'}} 
                        axisLine={false} 
                        tickLine={false} 
                        tickMargin={10}
                      />
                      <YAxis 
                        domain={['dataMin - 1', 'dataMax + 1']} 
                        tick={{fontSize: 10, fill: '#a8a29e'}} 
                        axisLine={false} 
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => [`${value} kg`, 'Peso']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0) {
                            return payload[0].payload.fullDate;
                          }
                          return label;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#143d2d" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorWeight)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden">
              {/* Dias da Semana */}
              <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50/50">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="p-3 text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid de Dias */}
              <div className="grid grid-cols-7 divide-x divide-y divide-stone-100 border-t border-stone-100">
                {calendarDays.map((day, idx) => {
                  const dateKey = formatDateKey(day);
                  const log = logsMap[dateKey];
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isSameDay(day, new Date());

                  return (
                    <div 
                      key={dateKey}
                      onClick={() => handleDayClick(day)}
                      className={`
                        min-h-[100px] md:min-h-[130px] p-2 transition-all cursor-pointer group relative flex flex-col justify-between
                        ${!isCurrentMonth ? 'bg-stone-50/30' : 'bg-white'}
                        ${log?.workout_done ? 'bg-emerald-50/10' : ''}
                        hover:bg-stone-50
                      `}
                    >
                      {/* Header do Dia: Data e Peso */}
                      <div className="flex justify-between items-start mb-1">
                        <span className={`
                          text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors
                          ${isTodayDate ? 'bg-[#143d2d] text-white shadow-md' : isCurrentMonth ? 'text-stone-700' : 'text-stone-300'}
                        `}>
                          {day.getDate()}
                        </span>
                        
                        {log?.weight && (
                          <span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-100">
                            {log.weight}kg
                          </span>
                        )}
                      </div>

                      {/* Conteúdo Central e Inferior */}
                      <div className="flex flex-col gap-1.5 flex-1 justify-start">
                        
                        {/* 1. Ícones (Energético e Dor) */}
                        <div className="flex flex-wrap gap-1 min-h-[20px]">
                          {log && (
                            log.energy_drink_consumed ? (
                              <div className="p-1 bg-yellow-100 text-yellow-600 rounded-md" title="Consumiu Energético">
                                <Zap size={12} fill="currentColor" />
                              </div>
                            ) : (
                              <div className="p-1 bg-emerald-100 text-emerald-600 rounded-md" title="Dia sem Energético">
                                <ZapOff size={12} />
                              </div>
                            )
                          )}

                          {log?.headache && (
                            <div className="p-1 bg-red-100 text-red-500 rounded-md" title="Teve dor de cabeça">
                              <Frown size={12} />
                            </div>
                          )}
                        </div>

                        {/* 2. Treino (Na base, preenchendo a largura) */}
                        {log?.workout_done && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-[#143d2d] bg-[#143d2d]/5 px-1.5 py-1 rounded border border-[#143d2d]/10 w-full truncate">
                            <span className="shrink-0">{getWorkoutIcon(log.workout_type)}</span>
                            <span className="truncate">{log.workout_type || 'Treino'}</span>
                          </div>
                        )}
                      </div>

                      {/* Botão de Adição Rápida (só aparece no hover se não houver log) */}
                      {!log && isCurrentMonth && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="p-2 bg-stone-100 rounded-full text-stone-400">
                             <Plus size={16} />
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Legenda */}
      <div className="px-4 md:px-8 mt-6 flex flex-wrap gap-6 justify-center md:justify-start pb-8">
        <div className="flex items-center gap-2">
          <Dumbbell size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Musculação</span>
        </div>
        <div className="flex items-center gap-2">
          <Footprints size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Cardio</span>
        </div>
        <div className="flex items-center gap-2">
          <Volleyball size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Vôlei</span>
        </div>
        <div className="flex items-center gap-2">
          <Dribbble size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">FTV</span>
        </div>
        <div className="flex items-center gap-2">
          <ZapOff size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Sucesso Detox</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-yellow-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Energético</span>
        </div>
        <div className="flex items-center gap-2">
          <Frown size={14} className="text-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Sintoma</span>
        </div>
      </div>
    </div>
  );
}
