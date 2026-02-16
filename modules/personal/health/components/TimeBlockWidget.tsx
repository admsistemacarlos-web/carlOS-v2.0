
import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, Settings, Coffee, Shield, PlayCircle, Clock, X, AlertTriangle, Trophy, Save, Minus, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';

// --- TYPES & STATIC DATA ---

type BlockType = 'strategic' | 'buffer' | 'escape';

// Configuração Visual Estática (não muda)
const BLOCK_THEME: Record<BlockType, { 
  label: string; 
  icon: React.ReactNode; 
  color: string; 
  activeBg: string;
}> = {
  strategic: {
    label: 'Estratégico',
    icon: <PlayCircle size={18} />,
    color: 'text-emerald-400',
    activeBg: 'bg-emerald-500',
  },
  buffer: {
    label: 'Buffer',
    icon: <Shield size={18} />,
    color: 'text-blue-400',
    activeBg: 'bg-blue-500',
  },
  escape: {
    label: 'Fuga',
    icon: <Coffee size={18} />,
    color: 'text-yellow-400',
    activeBg: 'bg-yellow-500',
  }
};

// Configuração do Usuário
interface UserConfig {
  duration: number; // minutos
  frequency: number; // vezes por semana
}

const DEFAULT_USER_CONFIG: Record<BlockType, UserConfig> = {
  strategic: { duration: 120, frequency: 1 },
  buffer: { duration: 30, frequency: 5 },
  escape: { duration: 60, frequency: 2 },
};

// --- COMPONENT ---

export const TimeBlockWidget: React.FC = () => {
  const { user } = useAuth();
  
  // --- STATE ---

  // 1. User Preferences
  const [config, setConfig] = useState<Record<BlockType, UserConfig>>(DEFAULT_USER_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // 2. Active Session (LocalStorage for resilience during refresh)
  const [activeSession, setActiveSession] = useState<{
    type: BlockType;
    startTime: number;
    pausedAt: number | null;
    duration: number;
    expectedEndTime: number;
  } | null>(() => {
    const saved = localStorage.getItem('carlos_active_focus');
    return saved ? JSON.parse(saved) : null;
  });

  // 3. History Stats (DB)
  const [completedCounts, setCompletedCounts] = useState<Record<BlockType, number>>({ strategic: 0, buffer: 0, escape: 0 });
  
  // 4. UI States
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [progress, setProgress] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfirmingStop, setIsConfirmingStop] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const timerRef = useRef<any>(null);
  const saveTimeoutRef = useRef<any>(null); // Debounce reference

  // --- EFFECTS ---

  // 1. Fetch Configs form DB
  useEffect(() => {
    if (!user) return;

    const fetchConfigs = async () => {
      try {
        const { data, error } = await supabase
          .from('time_block_configs')
          .select('block_type, duration_minutes, weekly_frequency')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          const dbConfig = { ...DEFAULT_USER_CONFIG };
          data.forEach((row: any) => {
            if (dbConfig[row.block_type as BlockType]) {
              dbConfig[row.block_type as BlockType] = {
                duration: row.duration_minutes,
                frequency: row.weekly_frequency
              };
            }
          });
          setConfig(dbConfig);
        }
      } catch (err) {
        console.error('Erro ao carregar configs de blocos:', err);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfigs();
  }, [user]);

  // 2. Auto-Save Configs to DB (Debounced)
  useEffect(() => {
    if (!user || loadingConfig) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Set new timeout (1.5s delay after last change)
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSavingConfig(true);
      try {
        const updates = (Object.entries(config) as [string, UserConfig][]).map(([type, settings]) => ({
          user_id: user.id,
          block_type: type,
          duration_minutes: settings.duration,
          weekly_frequency: settings.frequency,
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('time_block_configs')
          .upsert(updates, { onConflict: 'user_id, block_type' });

        if (error) throw error;
      } catch (err) {
        console.error('Erro ao salvar configs:', err);
      } finally {
        setIsSavingConfig(false);
      }
    }, 1500);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [config, user, loadingConfig]);

  // 3. Load Weekly Stats (Progress Bars)
  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const now = new Date();
      // Get Start of Week
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))); 
      startOfWeek.setHours(0,0,0,0);

      const { data } = await supabase
        .from('focus_sessions')
        .select('block_type')
        .eq('user_id', user.id)
        .gte('completed_at', startOfWeek.toISOString());

      const counts = { strategic: 0, buffer: 0, escape: 0 };
      data?.forEach((s: any) => {
        if (counts[s.block_type as BlockType] !== undefined) {
          counts[s.block_type as BlockType]++;
        }
      });
      setCompletedCounts(counts);
    };
    fetchStats();
  }, [user, showSuccess]);

  // 4. Timer Logic
  useEffect(() => {
    if (!activeSession || activeSession.pausedAt) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const end = activeSession.expectedEndTime;
      const totalMs = activeSession.duration * 60 * 1000;
      const remainingMs = Math.max(0, end - now);

      // Calc Progress
      const elapsed = totalMs - remainingMs;
      const pct = Math.min((elapsed / totalMs) * 100, 100);
      setProgress(pct);

      // Format HH:MM:SS
      const h = Math.floor(remainingMs / (1000 * 60 * 60));
      const m = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((remainingMs % (1000 * 60)) / 1000);
      
      const hDisplay = h > 0 ? `${h}:` : '';
      const mDisplay = m.toString().padStart(2, '0');
      const sDisplay = s.toString().padStart(2, '0');
      
      setTimeLeft(`${hDisplay}${mDisplay}:${sDisplay}`);

      if (remainingMs <= 0) {
        completeSession();
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSession]);

  // 5. Persist Active Session to LocalStorage (Resilience)
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('carlos_active_focus', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('carlos_active_focus');
    }
  }, [activeSession]);


  // --- ACTIONS ---

  const startSession = (type: BlockType) => {
    const durationMins = config[type].duration;
    const now = Date.now();
    setActiveSession({
      type,
      startTime: now,
      pausedAt: null,
      duration: durationMins,
      expectedEndTime: now + (durationMins * 60 * 1000)
    });
    setShowSuccess(false);
    setIsConfirmingStop(false);
  };

  const togglePause = () => {
    if (!activeSession) return;
    const now = Date.now();
    if (activeSession.pausedAt) {
      const pausedDuration = now - activeSession.pausedAt;
      setActiveSession({
        ...activeSession,
        pausedAt: null,
        expectedEndTime: activeSession.expectedEndTime + pausedDuration
      });
    } else {
      setActiveSession({ ...activeSession, pausedAt: now });
    }
  };

  const completeSession = async () => {
    if (!activeSession || !user) return;
    
    // Save to DB
    try {
      await supabase.from('focus_sessions').insert({
        user_id: user.id,
        block_type: activeSession.type,
        duration_minutes: activeSession.duration
      });
      setShowSuccess(true);
      setActiveSession(null);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const updateConfig = (type: BlockType, field: keyof UserConfig, value: number) => {
    setConfig(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: Math.max(1, value) // Minimum 1
      }
    }));
  };

  // --- RENDER HELPERS ---

  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
  };

  // --- VIEWS ---

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center h-[220px] bg-primary rounded-[2rem] shadow-lg">
        <Loader2 className="text-white/50 animate-spin" size={32} />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="bg-primary rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden animate-fade-in flex flex-col items-center justify-center min-h-[220px] text-center">
        <div className="mb-4 p-4 bg-card/10 rounded-full animate-bounce">
          <Trophy size={40} className="text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Sessão Concluída!</h2>
        <p className="text-white/60 text-sm">Foco registrado no histórico.</p>
      </div>
    );
  }

  if (activeSession) {
    const theme = BLOCK_THEME[activeSession.type];
    const isPaused = !!activeSession.pausedAt;

    return (
      <div className="bg-primary rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden animate-fade-in flex flex-col items-center justify-center min-h-[220px]">
        {/* Background Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1.5 bg-card/10 w-full">
           <div 
             className={`h-full transition-all duration-1000 ease-linear ${theme.activeBg}`}
             style={{ width: `${progress}%` }}
           />
        </div>

        {isConfirmingStop ? (
          <div className="absolute inset-0 bg-primary z-20 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <AlertTriangle className="text-red-400 mb-3" size={32} />
            <h3 className="text-lg font-bold mb-1">Abandonar Foco?</h3>
            <p className="text-xs text-white/60 mb-6 max-w-[200px]">O progresso atual será perdido.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setIsConfirmingStop(false)} className="flex-1 py-3 rounded-xl bg-card/10 text-white text-xs font-bold uppercase hover:bg-card/20">Voltar</button>
              <button onClick={() => { setActiveSession(null); setIsConfirmingStop(false); }} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-xs font-bold uppercase hover:bg-red-600">Parar</button>
            </div>
          </div>
        ) : (
          <>
            <div className="absolute top-4 right-4 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
            </div>
            <div className={`p-3 rounded-full bg-card/10 mb-4 ${isPaused ? 'opacity-50' : 'animate-bounce-slow'}`}>{theme.icon}</div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-1">Modo {theme.label}</h3>
            <div className="text-5xl font-mono font-bold tracking-tighter mb-8 tabular-nums">{timeLeft}</div>
            <div className="flex gap-4">
              <button onClick={togglePause} className="flex items-center gap-2 px-6 py-3 bg-card text-primary rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-accent transition-colors">
                {isPaused ? <Play size={16} /> : <Pause size={16} />} {isPaused ? 'Retomar' : 'Pausar'}
              </button>
              <button onClick={() => setIsConfirmingStop(true)} className="p-3 bg-card/10 text-white rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-colors"><Square size={16} fill="currentColor" /></button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 bg-primary rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden transition-all min-h-[220px]">
      <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><Clock size={80} /></div>
      
      {/* Header */}
      <div className="flex justify-between items-center relative z-10 mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
          {isSettingsOpen ? 'Configurar Metas' : 'Blocos de Foco'}
          {isSavingConfig && <Loader2 size={10} className="animate-spin text-white/50" />}
        </h3>
        <button 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-wider ${isSettingsOpen ? 'bg-card text-primary' : 'bg-card/10 text-white hover:bg-card/20'}`}
        >
          {isSettingsOpen ? <><Save size={12} /> Fechar</> : <><Settings size={12} /> Ajustar</>}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 relative z-10 h-full">
        {(Object.keys(DEFAULT_USER_CONFIG) as BlockType[]).map((type) => {
          const theme = BLOCK_THEME[type];
          const userConf = config[type];
          const count = completedCounts[type];
          const progressPct = Math.min((count / userConf.frequency) * 100, 100);

          if (isSettingsOpen) {
            // --- SETTINGS VIEW ---
            return (
              <div key={type} className="bg-card/5 rounded-2xl p-3 border border-white/10 flex flex-col justify-between animate-fade-in">
                <div className={`flex items-center gap-2 text-xs font-bold ${theme.color} mb-2`}>
                  {theme.icon} {theme.label}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] uppercase opacity-50 block mb-1">Duração</label>
                    <div className="flex items-center justify-between bg-black/20 rounded-lg p-1">
                      <button onClick={() => updateConfig(type, 'duration', userConf.duration - 15)} className="p-1 hover:text-white/80"><Minus size={12}/></button>
                      <span className="text-xs font-mono font-bold">{formatDuration(userConf.duration)}</span>
                      <button onClick={() => updateConfig(type, 'duration', userConf.duration + 15)} className="p-1 hover:text-white/80"><Plus size={12}/></button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[9px] uppercase opacity-50 block mb-1">Meta Semanal</label>
                    <div className="flex items-center justify-between bg-black/20 rounded-lg p-1">
                      <button onClick={() => updateConfig(type, 'frequency', userConf.frequency - 1)} className="p-1 hover:text-white/80"><Minus size={12}/></button>
                      <span className="text-xs font-mono font-bold">{userConf.frequency}x</span>
                      <button onClick={() => updateConfig(type, 'frequency', userConf.frequency + 1)} className="p-1 hover:text-white/80"><Plus size={12}/></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // --- DASHBOARD VIEW ---
          return (
            <button 
              key={type}
              onClick={() => startSession(type)}
              className="bg-card/5 hover:bg-card/10 rounded-2xl p-4 text-center border border-white/5 transition-all active:scale-95 group flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`transition-colors ${theme.color}`}>{theme.icon}</div>
                <div>
                  <p className="text-xl font-bold leading-none">{formatDuration(userConf.duration)}</p>
                  <p className="text-[9px] uppercase tracking-wider opacity-60 mt-1">{theme.label}</p>
                </div>
              </div>
              
              <div className="w-full">
                 <div className="flex justify-between text-[9px] font-bold mb-1 opacity-80">
                    <span>Semana</span>
                    <span className={count >= userConf.frequency ? 'text-emerald-400' : ''}>{count}/{userConf.frequency}</span>
                 </div>
                 <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${count >= userConf.frequency ? 'bg-emerald-400' : 'bg-card/30'}`}
                      style={{ width: `${progressPct}%` }}
                    />
                 </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
