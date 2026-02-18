
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Trash2, Plus, ArrowLeft, MoreHorizontal, Dumbbell, Activity, HeartPulse, Trophy, Heart } from 'lucide-react';
import { WorkoutSession, WorkoutSet, Exercise } from '../types';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';

interface WorkoutSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkoutSession;
  activeSets: WorkoutSet[];
  exercises: Exercise[];
  finishSession: () => Promise<void>;
  updateSet: (id: string, updates: Partial<WorkoutSet>) => Promise<void>;
  addSet: (exerciseId: string) => Promise<void>;
  deleteSet: (id: string) => Promise<void>;
  addExerciseToSession: (exerciseId: string) => Promise<void>;
  getHistory: (exId: string) => Promise<{ weight: number, reps: number } | null>;
}

const WORKOUT_TYPES = [
  { id: 'Musculação', icon: <Dumbbell size={18} />, label: 'Musculação' },
  { id: 'Cardio', icon: <HeartPulse size={18} />, label: 'Cardio' },
  { id: 'Esporte', icon: <Trophy size={18} />, label: 'Esporte' },
  { id: 'Funcional', icon: <Activity size={18} />, label: 'Funcional' },
];

export const WorkoutSessionModal: React.FC<WorkoutSessionModalProps> = ({
  isOpen,
  onClose,
  session,
  activeSets,
  exercises,
  finishSession,
  updateSet,
  addSet,
  deleteSet,
  addExerciseToSession
}) => {
  const { user } = useAuth();
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [isAddExOpen, setIsAddExOpen] = useState(false);
  const [exerciseFilter, setExerciseFilter] = useState('');
  
  // Estado para o tipo de treino no check-in
  const [selectedWorkoutType, setSelectedWorkoutType] = useState('Musculação');
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Agrupar sets por exercício
  const groupedSets = useMemo(() => {
    if (!activeSets || !Array.isArray(activeSets)) return [];

    const groups: { exerciseId: string; exerciseName: string; sets: WorkoutSet[] }[] = [];
    const seenExercises = new Set<string>();
    
    // Safety copy and sort
    const sortedSets = [...activeSets].sort((a, b) => (a.set_order || 0) - (b.set_order || 0));

    sortedSets.forEach(set => {
        if (!set || !set.exercise_id) return;
        
        if (!seenExercises.has(set.exercise_id)) {
            seenExercises.add(set.exercise_id);
            groups.push({
                exerciseId: set.exercise_id,
                // Handle missing exercise relation gracefully
                exerciseName: set.exercise?.name || 'Exercício Desconhecido',
                sets: []
            });
        }
        
        const group = groups.find(g => g.exerciseId === set.exercise_id);
        if (group) group.sets.push(set);
    });

    return groups;
  }, [activeSets]);

  const filteredExercises = exercises.filter(e => e.name.toLowerCase().includes(exerciseFilter.toLowerCase()));

  // Handlers
  const handleBlur = (setId: string, field: 'weight' | 'reps', value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (isNaN(numValue)) return; // Don't update if invalid
    updateSet(setId, { [field]: numValue });
  };

  const handleDeleteSet = (setId: string) => {
      // Remoção direta sem confirm() para evitar erro no sandbox e agilizar UX
      deleteSet(setId);
  };

  const toggleComplete = (set: WorkoutSet) => {
    updateSet(set.id, { completed: !set.completed });
  };

  const handleFinish = async () => {
    setIsSavingLog(true);
    try {
      // 1. Finaliza a sessão de treino (Lógica original)
      await finishSession();

      // 2. Atualiza o Check-in Diário (Wellness Log)
      if (user) {
        // Data de hoje em UTC/ISO para bater com a chave do banco se for Date type, 
        // ou ISO string com hora fixa para evitar problemas de fuso.
        // O app usa "Date at Noon" pattern em outros lugares.
        const now = new Date();
        const dateToSave = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString();

        // Verifica se já existe log hoje
        const { data: existingLog } = await supabase
          .from('health_wellness_logs')
          .select('id')
          .eq('date', dateToSave)
          .maybeSingle();

        if (existingLog) {
          // Atualiza
          await supabase
            .from('health_wellness_logs')
            .update({
              workout_done: true,
              workout_type: selectedWorkoutType
            })
            .eq('id', existingLog.id);
        } else {
          // Cria novo
          await supabase
            .from('health_wellness_logs')
            .insert({
              user_id: user.id,
              date: dateToSave,
              workout_done: true,
              workout_type: selectedWorkoutType,
              // Campos default
              headache: false,
              energy_drink_consumed: false
            });
        }
      }

      onClose();
    } catch (err) {
      console.error("Erro ao salvar check-in:", err);
      // Mesmo com erro no log, fecha o modal pois o treino pode ter salvo
      onClose();
    } finally {
      setIsSavingLog(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-card animate-fade-in">
      
      {/* Header Fixo */}
      <div className="bg-card border-b border-border px-4 py-4 flex justify-between items-center shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">{session.name}</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                    {session.ended_at ? 'Treino Finalizado' : 'Em Andamento'}
                </p>
            </div>
        </div>
        
        {!session.ended_at && (
            <button 
                onClick={() => setIsFinishConfirmOpen(true)}
                className="bg-primary hover:bg-[#0f2e22] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm transition-all"
            >
                Finalizar
            </button>
        )}
      </div>

      {/* Conteúdo Rolável */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24">
        
        {groupedSets.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                <Dumbbell size={48} className="mb-4 opacity-20" />
                <p>Nenhum exercício adicionado.</p>
                <button 
                    onClick={() => setIsAddExOpen(true)}
                    className="mt-4 text-primary font-bold uppercase text-xs hover:underline"
                >
                    Adicionar Exercício
                </button>
            </div>
        ) : (
            groupedSets.map((group) => (
                <div key={group.exerciseId} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    {/* Exercise Header */}
                    <div className="px-4 py-3 bg-secondary border-b border-border flex justify-between items-center">
                        <h3 className="text-sm font-bold text-foreground">{group.exerciseName}</h3>
                        <button className="text-muted-foreground hover:text-muted-foreground">
                            <MoreHorizontal size={16} />
                        </button>
                    </div>

                    {/* Sets List (Table-like) */}
                    <div className="p-2">
                        {/* Table Header */}
                        <div className="flex text-[9px] font-bold uppercase text-muted-foreground px-2 mb-2 text-center items-center">
                            <div className="w-8">Set</div>
                            <div className="flex-1">Kg</div>
                            <div className="flex-1">Reps</div>
                            <div className="w-10">Feito</div>
                            <div className="w-8"></div>
                        </div>

                        {group.sets.map((set, idx) => (
                            <div 
                                key={set.id} 
                                className={`flex items-center gap-2 p-2 rounded-xl mb-1 transition-colors ${set.completed ? 'bg-emerald-50/50' : 'bg-card'}`}
                            >
                                {/* Set Number */}
                                <div className="w-8 text-center text-xs font-bold text-muted-foreground">
                                    {idx + 1}
                                </div>

                                {/* Weight Input */}
                                <div className="flex-1">
                                    <input 
                                        type="number"
                                        placeholder="0"
                                        className="w-full bg-secondary rounded-lg py-2 text-center text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-[#143d2d]/20 transition-all"
                                        defaultValue={set.weight || ''}
                                        onBlur={(e) => handleBlur(set.id, 'weight', e.target.value)}
                                        disabled={!!session.ended_at}
                                    />
                                </div>

                                {/* Reps Input */}
                                <div className="flex-1">
                                    <input 
                                        type="number"
                                        placeholder="0"
                                        className="w-full bg-secondary rounded-lg py-2 text-center text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-[#143d2d]/20 transition-all"
                                        defaultValue={set.reps || ''}
                                        onBlur={(e) => handleBlur(set.id, 'reps', e.target.value)}
                                        disabled={!!session.ended_at}
                                    />
                                </div>

                                {/* Check Action */}
                                <div className="w-10 flex justify-center">
                                    <button
                                        onClick={() => toggleComplete(set)}
                                        disabled={!!session.ended_at}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                            set.completed 
                                            ? 'bg-emerald-500 text-white shadow-sm' 
                                            : 'bg-accent text-muted-foreground hover:bg-stone-300'
                                        }`}
                                    >
                                        <Check size={16} strokeWidth={3} />
                                    </button>
                                </div>

                                {/* Delete Action */}
                                <div className="w-8 flex justify-center">
                                    {!session.ended_at && (
                                        <button 
                                            onClick={() => handleDeleteSet(set.id)}
                                            className="text-muted-foreground hover:text-red-500 p-1 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Actions Footer */}
                        {!session.ended_at && (
                            <div className="mt-2 pt-2 border-t border-stone-50 flex justify-center">
                                <button 
                                    onClick={() => addSet(group.exerciseId)}
                                    className="w-full py-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Plus size={14} /> Adicionar Série
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))
        )}

        {/* Add Exercise Button (Bottom) */}
        {!session.ended_at && (
            <button 
                onClick={() => setIsAddExOpen(true)}
                className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-muted-foreground font-bold uppercase tracking-widest text-xs hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
                <Plus size={16} /> Adicionar Exercício
            </button>
        )}

      </div>

      {/* MODAL: ADICIONAR EXERCÍCIO */}
      {isAddExOpen && (
        <div className="fixed inset-0 z-[210] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-bold text-foreground">Selecionar Exercício</h3>
                    <button onClick={() => setIsAddExOpen(false)}><X size={20} className="text-muted-foreground" /></button>
                </div>
                <div className="p-4">
                    <input 
                        autoFocus
                        placeholder="Buscar..." 
                        value={exerciseFilter}
                        onChange={e => setExerciseFilter(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredExercises.map(ex => (
                        <button 
                            key={ex.id}
                            onClick={() => {
                                addExerciseToSession(ex.id);
                                setIsAddExOpen(false);
                                setExerciseFilter('');
                            }}
                            className="w-full text-left p-3 hover:bg-secondary rounded-xl text-sm font-semibold text-foreground flex justify-between items-center group"
                        >
                            {ex.name}
                            <Plus size={16} className="text-muted-foreground group-hover:text-primary" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* CONFIRM FINISH & LOG */}
      {isFinishConfirmOpen && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fade-in">
            <div className="bg-card w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-border text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Treino Concluído?</h3>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                Selecione o tipo para registrar no seu check-in diário.
              </p>
              
              {/* Seletor de Tipo */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {WORKOUT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedWorkoutType(type.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      selectedWorkoutType === type.id 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border bg-secondary text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {type.icon}
                    <span className="text-[10px] font-bold uppercase mt-1">{type.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleFinish}
                  disabled={isSavingLog}
                  className="w-full py-4 bg-primary hover:bg-[#0f2e22] text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSavingLog ? 'Salvando...' : 'Finalizar e Salvar'}
                </button>
                <button 
                  onClick={() => setIsFinishConfirmOpen(false)}
                  disabled={isSavingLog}
                  className="w-full py-4 bg-secondary hover:bg-accent text-muted-foreground rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        )}

    </div>,
    document.body
  );
};
