
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { Exercise, WorkoutSession, WorkoutSet } from '../types';

export interface WorkoutTemplate {
  id: string;
  name: string;
  items?: {
    id: string;
    exercise_id: string;
    order_index: number;
    sets_target: number;
    exercise?: Exercise;
  }[];
}

export function useWorkouts() {
  const { user } = useAuth();
  
  // Data States
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  
  // Active Session State
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [activeSets, setActiveSets] = useState<WorkoutSet[]>([]);
  
  const [loading, setLoading] = useState(true);

  // --- BUSCAR DADOS INICIAIS ---
  const fetchExercises = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('health_exercises')
      .select('*')
      .order('name', { ascending: true });
    if (data) setExercises(data as Exercise[]);
  }, [user]);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('health_workout_templates')
        .select(`
          *,
          items:health_workout_template_items(
            *,
            exercise:health_exercises(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const sortedTemplates = data.map((t: any) => ({
          ...t,
          items: t.items?.sort((a: any, b: any) => a.order_index - b.order_index) || []
        }));
        setTemplates(sortedTemplates);
      }
    } catch (err) {
      console.log("Tabela de templates ainda não existe ou erro ao buscar.");
    }
  }, [user]);

  const fetchRecentSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('health_workout_sessions')
      .select('*, sets:health_workout_sets(*, exercise:health_exercises(name))')
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(10);
      
    if (data) setRecentSessions(data as any);
    setLoading(false);
  }, [user]);

  const checkActiveSession = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('health_workout_sessions')
        .select('*, sets:health_workout_sets(*, exercise:health_exercises(*))')
        .is('ended_at', null)
        .maybeSingle();

      if (data) {
        setActiveSession(data as WorkoutSession);
        
        // Safety check for sets array
        const rawSets = Array.isArray(data.sets) ? data.sets : [];
        const sortedSets = (rawSets as WorkoutSet[]).sort((a, b) => 
          (a.set_order || 0) - (b.set_order || 0) || 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setActiveSets(sortedSets);
      } else {
        setActiveSession(null);
        setActiveSets([]);
      }
    } catch (err) {
      console.error("Error checking active session:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchExercises();
      fetchTemplates();
      fetchRecentSessions();
      checkActiveSession();
    }
  }, [user, fetchExercises, fetchTemplates, fetchRecentSessions, checkActiveSession]);

  // --- AÇÕES DE SESSÃO ---

  const openSession = async (session: WorkoutSession) => {
    setLoading(true);
    try {
        const { data: setsData } = await supabase
            .from('health_workout_sets')
            .select('*, exercise:health_exercises(*)')
            .eq('session_id', session.id)
            .order('set_order', { ascending: true });

        setActiveSession(session);
        // Garante que é array
        setActiveSets((setsData as WorkoutSet[]) || []);
    } catch (err) {
        console.error("Erro ao abrir sessão:", err);
        setActiveSets([]);
    } finally {
        setLoading(false);
    }
  };

  const startSession = async (name: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('health_workout_sessions')
        .insert({
          user_id: user.id,
          name: name,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setActiveSession(data as WorkoutSession);
      setActiveSets([]);
    } catch (err: any) {
      console.error("Erro ao iniciar treino:", err);
      alert("Erro ao iniciar treino.");
    }
  };

  const startSessionFromTemplate = async (templateId: string) => {
    if (!user) return;
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setLoading(true); // Mostra loading enquanto prepara
    try {
        const { data: session, error: sessError } = await supabase
            .from('health_workout_sessions')
            .insert({
                user_id: user.id,
                name: template.name,
                started_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (sessError) throw sessError;

        if (template.items && template.items.length > 0) {
            const setsToInsert = [];
            // Cria 3 séries (padrão) para cada exercício do template
            let orderCounter = 1;
            for (const item of template.items) {
                // Valida se o exercício ainda existe
                if (item.exercise_id) {
                    const targetSets = item.sets_target || 3;
                    for (let i = 0; i < targetSets; i++) {
                        setsToInsert.push({
                            session_id: session.id,
                            exercise_id: item.exercise_id,
                            weight: 0,
                            reps: 0,
                            set_order: orderCounter++
                        });
                    }
                }
            }

            if (setsToInsert.length > 0) {
                const { error: setsError } = await supabase
                    .from('health_workout_sets')
                    .insert(setsToInsert);
                if (setsError) throw setsError;
            }
        }

        // Abre a sessão completa (recarregando os sets criados com os dados dos exercícios)
        await openSession(session as WorkoutSession);

    } catch (err: any) {
        console.error("Erro ao iniciar do template:", err);
        alert("Erro ao iniciar treino a partir do modelo.");
        setActiveSession(null); // Limpa sessão se falhou
    } finally {
        setLoading(false);
    }
  };

  const finishSession = async () => {
    if (!activeSession) return;
    try {
      if (!activeSession.ended_at) {
          const { error } = await supabase
            .from('health_workout_sessions')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', activeSession.id);

          if (error) throw error;
      }
      setActiveSession(null);
      setActiveSets([]);
      fetchRecentSessions();
    } catch (err: any) {
      console.error("Erro ao finalizar:", err);
      alert("Erro ao finalizar treino.");
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
        const { error } = await supabase
            .from('health_workout_sessions')
            .delete()
            .eq('id', sessionId);
        
        if (error) throw error;
        setRecentSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeSession?.id === sessionId) {
            setActiveSession(null);
            setActiveSets([]);
        }
    } catch (err: any) {
        console.error("Erro ao excluir sessão:", err);
        throw err;
    }
  };

  // --- MANIPULAÇÃO DE SÉRIES ---

  // Atualiza uma série existente
  const updateSet = async (setId: string, updates: Partial<WorkoutSet>) => {
    // Atualização Otimista
    setActiveSets(prev => prev.map(s => s.id === setId ? { ...s, ...updates } : s));

    try {
        // Filtra campos que não existem no banco ou são relacionamentos para evitar erro 400
        const { exercise, created_at, session_id, exercise_id, id, ...dbUpdates } = updates as any;
        
        const { error } = await supabase
            .from('health_workout_sets')
            .update(dbUpdates)
            .eq('id', setId);

        if (error) throw error;
    } catch (err) {
        console.error("Erro ao atualizar série:", err);
    }
  };

  // Adiciona uma nova série a um exercício já presente na sessão
  const addSet = async (exerciseId: string) => {
    if (!activeSession || !user) return;

    // Encontra o maior set_order atual
    const currentMaxOrder = activeSets.length > 0 
        ? Math.max(...activeSets.map((s) => s.set_order || 0)) 
        : 0;
    
    // Tenta encontrar a última série deste exercício para copiar a carga (UX)
    const lastSet = [...activeSets].reverse().find(s => s.exercise_id === exerciseId);
    const weightToCopy = lastSet ? lastSet.weight : 0;

    const newSetOrder = currentMaxOrder + 1;

    try {
        const { data, error } = await supabase
            .from('health_workout_sets')
            .insert({
                session_id: activeSession.id,
                exercise_id: exerciseId,
                weight: weightToCopy,
                reps: 0,
                set_order: newSetOrder
            })
            .select('*, exercise:health_exercises(*)')
            .single();

        if (error) throw error;
        
        // Adiciona ao estado local
        setActiveSets(prev => [...prev, data as WorkoutSet]);
    } catch (err) {
        console.error("Erro ao adicionar série:", err);
    }
  };

  const deleteSet = async (setId: string) => {
    try {
      // Optimistic update
      setActiveSets(prev => prev.filter(s => s.id !== setId));
      
      const { error } = await supabase.from('health_workout_sets').delete().eq('id', setId);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao excluir série", err);
      // Revert if needed, or simply refetch
      if (activeSession) openSession(activeSession);
    }
  };

  // Adiciona um novo exercício à sessão (cria 1ª série)
  const addExerciseToSession = async (exerciseId: string) => {
      await addSet(exerciseId);
  };

  // --- CRUD EXERCÍCIOS ---
  const createExercise = async (name: string, muscleGroup: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('health_exercises')
      .insert({ name, muscle_group: muscleGroup, user_id: user.id })
      .select()
      .single();
    
    if (!error && data) {
      setExercises(prev => [...prev, data as Exercise].sort((a,b) => a.name.localeCompare(b.name)));
    }
    return { data, error };
  };

  const updateExercise = async (id: string, updates: Partial<Exercise>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('health_exercises')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, ...data } : ex));
    }
    return { data, error };
  };

  const deleteExercise = async (id: string) => {
    try {
      const { error } = await supabase.from('health_exercises').delete().eq('id', id);
      if (error) throw error;
      setExercises(prev => prev.filter(ex => ex.id !== id));
    } catch (err) {
      console.error("Erro ao excluir exercício:", err);
      throw err;
    }
  };

  // --- CRUD TEMPLATES ---
  const saveTemplate = async (name: string, items: { exerciseId: string }[]) => {
    if (!user) return;
    try {
        const { data: template, error: tmplError } = await supabase
            .from('health_workout_templates')
            .insert({ name, user_id: user.id })
            .select()
            .single();
        
        if (tmplError) throw tmplError;

        const itemsPayload = items.map((item, idx) => ({
            template_id: template.id,
            exercise_id: item.exerciseId,
            order_index: idx + 1,
            sets_target: 3 // Default 3 séries
        }));

        const { error: itemsError } = await supabase
            .from('health_workout_template_items')
            .insert(itemsPayload);

        if (itemsError) throw itemsError;

        await fetchTemplates();
        return true;
    } catch (err) {
        console.error("Erro ao salvar template:", err);
        throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
      try {
          const { error } = await supabase.from('health_workout_templates').delete().eq('id', id);
          if (error) throw error;
          setTemplates(prev => prev.filter(t => t.id !== id));
      } catch (err) {
          console.error("Erro ao excluir template:", err);
          throw err;
      }
  };

  const getExerciseHistory = async (exerciseId: string): Promise<{ weight: number, reps: number } | null> => {
    const { data } = await supabase
      .from('health_workout_sets')
      .select('weight, reps, created_at')
      .eq('exercise_id', exerciseId)
      .neq('session_id', activeSession?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data;
  };

  return {
    exercises,
    recentSessions,
    templates,
    activeSession,
    activeSets,
    loading,
    startSession,
    startSessionFromTemplate,
    finishSession,
    deleteSession,
    saveTemplate,
    deleteTemplate,
    openSession,
    updateSet, 
    addSet,    
    addExerciseToSession,
    deleteSet,
    createExercise,
    updateExercise,
    deleteExercise,
    getExerciseHistory,
    setActiveSession
  };
}
