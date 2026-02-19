import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, ChevronLeft, ChevronRight, 
  Zap, ZapOff, Frown, Smile,
  Scale, Activity, Calendar as CalendarIcon, Loader2,
  Dumbbell, Footprints, Volleyball, Dribbble, TrendingDown, TrendingUp,
  XCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHealth } from '../hooks/useHealth';

// --- DATE HELPERS ---
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
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const isSameDay = (d1: Date, d2: Date) =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

const isSameMonth = (d1: Date, d2: Date) =>
  d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

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

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const logsMap = useMemo(() => {
    const map: Record<string, WellnessLog> = {};
    logs.forEach(log => {
      const dateKey = formatDateKey(new Date(log.date));
      map[dateKey] = log;
    });
    return map;
  }, [logs]);

  const weightChartData = useMemo(() => {
    return logs
      .filter(l => l.weight !== null && l.weight > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(l => ({
        date: new Date(l.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        fullDate: new Date(l.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
        weight: l.weight
      }))
      .slice(-14);
  }, [logs]);

  const weightProgress = useMemo(() => {
    const weightsWithDates = logs
      .filter(l => l.weight !== null && l.weight > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (weightsWithDates.length === 0) return null;
    const firstWeight = weightsWithDates[0].weight!;
    const lastWeight = weightsWithDates[weightsWithDates.length - 1].weight!;
    const difference = lastWeight - firstWeight;
    return { first: firstWeight, last: lastWeight, difference, isLoss: difference < 0, isGain: difference > 0 };
  }, [logs]);

  // --- ESTATÍSTICAS DO MÊS ---
  const statistics = useMemo(() => {
    const monthStart = getStartOfMonth(currentDate);
    const monthEnd = getEndOfMonth(currentDate);

    const monthLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= monthStart && logDate <= monthEnd;
    });

    const workoutDays = monthLogs.filter(l => l.workout_done).length;
    const noWorkoutDays = monthLogs.filter(l => !l.workout_done).length;
    const headacheDays = monthLogs.filter(l => l.headache).length;
    const noHeadacheDays = monthLogs.filter(l => !l.headache).length;

    return { workoutDays, noWorkoutDays, headacheDays, noHeadacheDays };
  }, [logs, currentDate]);

  const handleDayClick = (date: Date) => {
    const dateKey = formatDateKey(date);
    const existingLog = logsMap[dateKey];
    if (existingLog) {
      navigate(`/personal/health/wellness/${existingLog.id}`);
    } else {
      navigate(`/personal/health/wellness/new?date=${dateKey}`);
    }
  };

  const getWorkoutIcon = (type: string | null) => {
    const t = (type || '').toLowerCase();
    if (t.includes('vôlei') || t.includes('volei') || t.includes('volleyball')) return <Volleyball size={10} />;
    if (t.includes('ftv') || t.includes('fute') || t.includes('futebol') || t.includes('soccer')) return <Dribbble size={10} />;
    if (t.includes('cardio') || t.includes('caminhada') || t.includes('corrida') || t.includes('esteira')) return <Footprints size={10} />;
    if (t.includes('musculação') || t.includes('treino') || t.includes('peso') || t.includes('strength')) return <Dumbbell size={10} />;
    return <Activity size={10} />;
  };

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans bg-transparent">

      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4 flex flex-col gap-4">
        <button onClick={() => navigate('/personal/health')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors w-fit">
          <ArrowLeft size={14} /> Voltar
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <CalendarIcon className="text-primary" size={24} /> Diário de Bem-Estar
          </h1>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Seletor de Mês */}
            <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm flex-1 sm:flex-none">
              <button onClick={prevMonth} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="px-3 min-w-[120px] text-center">
                <span className="text-xs font-bold text-foreground capitalize">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <button onClick={nextMonth} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>

            <button onClick={goToToday} className="px-3 py-2 bg-card border border-border text-muted-foreground font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-secondary transition-colors shadow-sm whitespace-nowrap">
              Hoje
            </button>

            <button onClick={() => navigate('/personal/health/wellness/new')} className="bg-primary hover:bg-[#0f2e22] text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap">
              <Plus size={16} /> Novo
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-6">

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : (
          <>
            {/* Cards de Estatísticas do Mês */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              {/* Card 1: Dias Treinados */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <Dumbbell className="text-emerald-600" size={14} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                    Treinei — {monthName}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-emerald-600">{statistics.workoutDays}</span>
                  <span className="text-xs font-bold text-muted-foreground">dias</span>
                </div>
              </div>

              {/* Card 2: Dias Sem Treino */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-red-50 rounded-lg">
                    <XCircle className="text-red-500" size={14} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                    Sem treino — {monthName}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-red-500">{statistics.noWorkoutDays}</span>
                  <span className="text-xs font-bold text-muted-foreground">dias</span>
                </div>
              </div>

              {/* Card 3: Dias com Dor de Cabeça */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-red-50 rounded-lg">
                    <Frown className="text-red-500" size={14} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                    Dor de cabeça — {monthName}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-red-500">{statistics.headacheDays}</span>
                  <span className="text-xs font-bold text-muted-foreground">dias</span>
                </div>
              </div>

              {/* Card 4: Dias Sem Dor de Cabeça */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-50 rounded-lg">
                    <Smile className="text-purple-600" size={14} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                    Sem dor — {monthName}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-purple-600">{statistics.noHeadacheDays}</span>
                  <span className="text-xs font-bold text-muted-foreground">dias</span>
                </div>
              </div>

            </div>

            {/* Gráfico de Peso */}
            {weightChartData.length > 1 && (
              <div className="bg-card rounded-[2rem] border border-border shadow-sm p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Scale size={14} className="text-primary" /> Evolução do Peso
                  </h3>
                  {weightProgress && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 ${weightProgress.isLoss ? 'bg-emerald-50 border-emerald-200' : weightProgress.isGain ? 'bg-amber-50 border-amber-200' : 'bg-secondary border-border'}`}>
                      {weightProgress.isLoss && <TrendingDown className="text-emerald-600" size={16} />}
                      {weightProgress.isGain && <TrendingUp className="text-amber-600" size={16} />}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Progresso Total</span>
                        <span className={`text-lg font-bold ${weightProgress.isLoss ? 'text-emerald-600' : weightProgress.isGain ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {weightProgress.isLoss ? '' : '+'}{Math.abs(weightProgress.difference).toFixed(1)} kg
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="h-[200px] md:h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#143d2d" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#143d2d" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} tickMargin={10} />
                      <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        formatter={(value: any) => [`${value} kg`, 'Peso']}
                        labelFormatter={(label, payload) => payload && payload.length > 0 ? payload[0].payload.fullDate : label}
                      />
                      <Area type="monotone" dataKey="weight" stroke="#143d2d" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Calendário */}
            <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
              {/* Dias da Semana */}
              <div className="grid grid-cols-7 border-b border-border bg-secondary/50">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                  <div key={i} className="py-2 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="hidden sm:inline">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i]}
                    </span>
                    <span className="sm:hidden">{day}</span>
                  </div>
                ))}
              </div>

              {/* Grid de Dias */}
              <div className="grid grid-cols-7 divide-x divide-y divide-stone-100 border-t border-border">
                {calendarDays.map((day) => {
                  const dateKey = formatDateKey(day);
                  const log = logsMap[dateKey];
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isSameDay(day, new Date());

                  return (
                    <div
                      key={dateKey}
                      onClick={() => handleDayClick(day)}
                      className={`
                        min-h-[75px] sm:min-h-[110px] md:min-h-[130px] p-1 sm:p-2 transition-all cursor-pointer group relative flex flex-col
                        ${!isCurrentMonth ? 'bg-secondary/30' : 'bg-card'}
                        hover:bg-secondary
                      `}
                    >
                      {/* Número do Dia + Peso */}
                      <div className="flex justify-between items-start mb-1">
                        <span className={`
                          text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full transition-colors
                          ${isTodayDate ? 'bg-primary text-primary-foreground shadow-md' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40'}
                        `}>
                          {day.getDate()}
                        </span>
                        {log?.weight && (
                          <span className="hidden sm:inline text-[9px] font-bold text-muted-foreground bg-secondary px-1 py-0.5 rounded border border-border">
                            {log.weight}kg
                          </span>
                        )}
                      </div>

                      {/* Ícones e Treino */}
                      <div className="flex flex-col gap-1 flex-1">

                        {/* Ícones: Energético + Dor */}
                        {log && (
                          <div className="flex gap-0.5 sm:gap-1">
                            {log.energy_drink_consumed ? (
                              <div className="p-0.5 sm:p-1 bg-yellow-100 text-yellow-600 rounded" title="Consumiu Energético">
                                <Zap size={10} fill="currentColor" />
                              </div>
                            ) : (
                              <div className="p-0.5 sm:p-1 bg-emerald-100 text-emerald-600 rounded" title="Sem Energético">
                                <ZapOff size={10} />
                              </div>
                            )}
                            {log.headache ? (
                              <div className="p-0.5 sm:p-1 bg-red-100 text-red-500 rounded" title="Dor de cabeça">
                                <Frown size={10} />
                              </div>
                            ) : (
                              <div className="p-0.5 sm:p-1 bg-emerald-100 text-emerald-600 rounded" title="Sem dor">
                                <Smile size={10} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Treino */}
                        {log && (
                          log.workout_done ? (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/5 px-1 sm:px-1.5 py-0.5 sm:py-1 rounded border border-primary/10 w-full truncate">
                              <span className="shrink-0">{getWorkoutIcon(log.workout_type)}</span>
                              <span className="truncate hidden sm:inline">{log.workout_type || 'Treino'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-50 px-1 sm:px-1.5 py-0.5 sm:py-1 rounded border border-red-200 w-full truncate">
                              <XCircle size={10} className="shrink-0" />
                              <span className="truncate hidden sm:inline">Sem treino</span>
                            </div>
                          )
                        )}
                      </div>

                      {/* Hover: Adicionar */}
                      {!log && isCurrentMonth && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="p-1.5 bg-secondary rounded-full text-muted-foreground">
                            <Plus size={14} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start pb-4">
              {[
                { icon: <Dumbbell size={12} className="text-emerald-600" />, label: 'Musculação' },
                { icon: <Footprints size={12} className="text-emerald-600" />, label: 'Cardio' },
                { icon: <Volleyball size={12} className="text-emerald-600" />, label: 'Vôlei' },
                { icon: <Dribbble size={12} className="text-emerald-600" />, label: 'FTV' },
                { icon: <XCircle size={12} className="text-red-500" />, label: 'Sem treino' },
                { icon: <ZapOff size={12} className="text-emerald-600" />, label: 'Detox' },
                { icon: <Zap size={12} className="text-yellow-500" />, label: 'Energético' },
                { icon: <Frown size={12} className="text-red-500" />, label: 'Sintoma' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  {icon}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}