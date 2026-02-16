
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Activity, ArrowRight, Calendar, Scale, PiggyBank, Target, Flag, Dumbbell } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';

const HubCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  isPlaceholder?: boolean;
  highlight?: React.ReactNode;
  variant?: 'default' | 'success'; 
}> = ({ title, subtitle, icon, onClick, isPlaceholder, highlight, variant = 'default' }) => (
  <button 
    onClick={isPlaceholder ? undefined : onClick}
    className={`group relative flex flex-col justify-between p-8 h-56 border rounded-[1.5rem] transition-all duration-300 w-full text-left overflow-hidden ${
      isPlaceholder 
        ? 'bg-secondary border-border opacity-60 cursor-not-allowed' 
        : variant === 'success' 
          ? 'bg-primary border-primary text-white shadow-md' 
          : 'bg-card border-border hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
    }`}
  >
    {/* Background Pattern Sutil para o card Detox */}
    {variant === 'success' && (
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
    )}

    <div className="relative z-10 flex justify-between items-start w-full">
       <div className={`bg-transparent p-0 transition-colors duration-300 ${
         isPlaceholder ? 'text-muted-foreground' : variant === 'success' ? 'text-primary-foreground' : 'text-primary'
       }`}>
         {React.cloneElement(icon as React.ReactElement<any>, { size: 32, strokeWidth: 1.5 })}
       </div>

       {!isPlaceholder && (
         <div className={`opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-500 ${variant === 'success' ? 'text-primary-foreground' : 'text-primary'}`}>
           <ArrowRight size={20} />
         </div>
       )}
    </div>

    <div className="relative z-10 mt-auto">
      {highlight && (
        <div className="mb-3">
          {highlight}
        </div>
      )}
      <h3 className={`text-xl font-bold mb-1 tracking-tight ${
        isPlaceholder ? 'text-muted-foreground' : variant === 'success' ? 'text-white' : 'text-foreground group-hover:text-primary'
      }`}>
        {title}
      </h3>
      <p className={`text-sm font-medium ${
        isPlaceholder ? 'text-muted-foreground' : variant === 'success' ? 'text-primary-foreground/80' : 'text-muted-foreground group-hover:text-foreground'
      }`}>
        {subtitle}
      </p>
      
    </div>
  </button>
);

export default function HealthHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // States para Resumos
  const [nextTherapy, setNextTherapy] = useState<string | null>(null);
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const [detoxSavings, setDetoxSavings] = useState<{ amount: number, days: number }>({ amount: 0, days: 0 });
  const [activeCycleWeek, setActiveCycleWeek] = useState<number | null>(null);
  const [lastWorkout, setLastWorkout] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchSummaries = async () => {
      try {
        // 1. Próxima Terapia
        const { data: therapy } = await supabase
          .from('health_therapy_sessions')
          .select('next_appointment, professional')
          .gte('next_appointment', new Date().toISOString()) // Apenas futuras
          .order('next_appointment', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (therapy?.next_appointment) {
          const date = new Date(therapy.next_appointment).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
          const professionalName = therapy.professional ? therapy.professional.split(' ')[0] : 'Terapia';
          setNextTherapy(`${professionalName}: ${date}`);
        }

        // 2. Último Peso & Detox Stats
        const { data: logs } = await supabase
          .from('health_wellness_logs')
          .select('weight, energy_drink_consumed, date')
          .order('date', { ascending: false });

        if (logs && logs.length > 0) {
          const lastWeightLog = logs.find(l => l.weight !== null);
          if (lastWeightLog) setLastWeight(lastWeightLog.weight);

          const daysWithout = logs.filter(l => l.energy_drink_consumed === false).length;
          const moneySaved = daysWithout * 9; 
          setDetoxSavings({ amount: moneySaved, days: daysWithout });
        }

        // 3. Ciclo 12S Ativo
        const { data: cycle } = await supabase
          .from('planning_12sy_cycles')
          .select('start_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (cycle) {
          const start = new Date(cycle.start_date);
          const now = new Date();
          // Diferença em milissegundos
          const diffTime = now.getTime() - start.getTime();
          // Converter para dias
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
          // Converter para semanas (iniciando em 1)
          const currentWeek = Math.floor(diffDays / 7) + 1;
          
          setActiveCycleWeek(currentWeek > 12 ? 12 : Math.max(1, currentWeek));
        }

        // 4. Último Treino (Workout)
        const { data: lastWk } = await supabase
          .from('health_workout_sessions')
          .select('name, ended_at')
          .not('ended_at', 'is', null) // Apenas finalizados
          .order('ended_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastWk) {
            const date = new Date(lastWk.ended_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
            setLastWorkout(`${lastWk.name} • ${date}`);
        }

      } catch (error) {
        console.error("Erro ao carregar dados do hub:", error);
      }
    };

    fetchSummaries();
  }, [user]);

  return (
    <div className="w-full min-h-screen animate-fade-in font-sans pb-20 bg-transparent">
      <div className="w-full px-8 pt-10 pb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-1 bg-primary rounded-full"></div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Saúde Integral</p>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tighter mb-3">
          Corpo & <span className="text-primary font-serif italic">Mente</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
          Gestão de vitalidade e longevidade. Monitore seu progresso físico e mental.
        </p>
      </div>

      <div className="w-full px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        
        {/* Card Detox (Destaque Sóbrio) */}
        <HubCard 
          title="Desafio Detox" 
          subtitle={`${detoxSavings.days} dias sem energético`}
          icon={<PiggyBank />}
          onClick={() => navigate('/personal/health/wellness')}
          variant="success"
          highlight={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-background/20 text-foreground rounded-md text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-foreground/20">
              R$ {detoxSavings.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Economizados
            </span>
          }
        />

        <HubCard 
          title="Corpo & Rotina" 
          subtitle="Diário de peso e sintomas"
          icon={<Activity />}
          onClick={() => navigate('/personal/health/wellness')}
          highlight={lastWeight && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary text-primary rounded-md text-xs font-bold uppercase tracking-wider border border-border">
              <Scale size={12} /> Peso Atual: {lastWeight}kg
            </span>
          )}
        />

        <HubCard 
          title="Workouts" 
          subtitle="Registro de treinos e cargas"
          icon={<Dumbbell />}
          onClick={() => navigate('/personal/health/workouts')}
          highlight={lastWorkout && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary text-primary rounded-md text-xs font-bold uppercase tracking-wider border border-border truncate max-w-full">
              <Activity size={12} /> {lastWorkout}
            </span>
          )}
        />

        <HubCard 
          title="Mente & Terapia" 
          subtitle="Sessões e insights"
          icon={<Brain />}
          onClick={() => navigate('/personal/health/therapy')}
          highlight={nextTherapy && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary text-primary rounded-md text-xs font-bold uppercase tracking-wider border border-border">
              <Calendar size={12} /> {nextTherapy}
            </span>
          )}
        />

        {/* Card Planejamento 12S */}
        <HubCard 
          title="Ano de 12 Semanas" 
          subtitle="Gestão de Metas"
          icon={<Target />}
          onClick={() => navigate('/personal/health/planning/new')}
          highlight={activeCycleWeek ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary text-primary rounded-md text-xs font-bold uppercase tracking-wider border border-border">
              <Flag size={12} /> Semana {activeCycleWeek} de 12
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary text-muted-foreground rounded-md text-xs font-bold uppercase tracking-wider border border-border">
              Iniciar Novo Ciclo
            </span>
          )}
        />

      </div>
    </div>
  );
}
