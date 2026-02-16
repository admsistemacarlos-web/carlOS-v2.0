
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, Play, Plus, Clock, Calendar, ChevronRight, Loader2, Settings, Trash2, AlertTriangle, List, LayoutTemplate, Search, Pencil, Save, X } from 'lucide-react';
import { useWorkouts } from '../hooks/useWorkouts';
import { WorkoutSessionModal } from '../components/WorkoutSessionModal';
import { WorkoutTemplateForm } from '../components/WorkoutTemplateForm';
import { formatDateBr } from '../../finance/utils/dateHelpers';
import { ConfirmModal } from '../../../../shared/components/ui/ConfirmModal';

export default function WorkoutsPage() {
  const navigate = useNavigate();
  const { 
    loading, 
    recentSessions, 
    activeSession, 
    activeSets, 
    exercises,
    templates,
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
    getExerciseHistory
  } = useWorkouts();

  const [newSessionName, setNewSessionName] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  
  // Controle de Visibilidade do Modal de Sessão
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  
  // Modais de Gerenciamento
  const [isExerciseMgrOpen, setIsExerciseMgrOpen] = useState(false);
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  
  // Exercise Management States
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('chest');

  // Delete Confirmation State
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- FILTRAGEM DE EXERCÍCIOS ---
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => 
        ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
    );
  }, [exercises, exerciseSearch]);

  const muscleLabels: Record<string, string> = {
      chest: 'Peito',
      back: 'Costas',
      legs: 'Pernas',
      shoulders: 'Ombros',
      arms: 'Braços',
      core: 'Abs/Core',
      cardio: 'Cardio'
  };

  const handleStart = async () => {
    if (!newSessionName.trim()) return;
    await startSession(newSessionName);
    setNewSessionName('');
    setIsStarting(false);
    setIsSessionOpen(true);
  };

  const handleStartTemplate = async (templateId: string) => {
    await startSessionFromTemplate(templateId);
    setIsSessionOpen(true);
  };

  const handleHistoryClick = async (session: any) => {
    await openSession(session);
    setIsSessionOpen(true);
  };

  const handleResume = () => {
    setIsSessionOpen(true);
  };

  // --- EXERCISE CRUD HANDLERS ---
  
  const handleSaveExercise = async () => {
    if(!newExName) return;
    
    if (editingExerciseId) {
        await updateExercise(editingExerciseId, { name: newExName, muscle_group: newExMuscle });
        setEditingExerciseId(null);
    } else {
        await createExercise(newExName, newExMuscle);
    }
    
    setNewExName('');
    setNewExMuscle('chest');
  };

  const handleEditExercise = (ex: any) => {
      setEditingExerciseId(ex.id);
      setNewExName(ex.name);
      setNewExMuscle(ex.muscle_group);
  };

  const handleCancelEdit = () => {
      setEditingExerciseId(null);
      setNewExName('');
      setNewExMuscle('chest');
  };

  const handleDeleteExercise = (id: string) => {
      setExerciseToDelete(id);
  };

  const confirmDeleteExercise = async () => {
      if (!exerciseToDelete) return;
      setIsDeleting(true);
      try {
          await deleteExercise(exerciseToDelete);
          setExerciseToDelete(null);
      } catch(e) {
          alert("Erro ao excluir. Verifique se não há treinos usando este exercício.");
      } finally {
          setIsDeleting(false);
      }
  };

  const handleDeleteSessionClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
  };

  const handleDeleteTemplateClick = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    setTemplateToDelete(templateId);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
        await deleteSession(sessionToDelete);
        setSessionToDelete(null);
    } catch (error) {
        alert("Erro ao excluir treino.");
    } finally {
        setIsDeleting(false);
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
        await deleteTemplate(templateToDelete);
        setTemplateToDelete(null);
    } catch (error) {
        alert("Erro ao excluir modelo.");
    } finally {
        setIsDeleting(false);
    }
  };

  const handleFinishSession = async () => {
    await finishSession();
    setIsSessionOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const isRunningSession = activeSession && !activeSession.ended_at;

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans bg-transparent">
      
      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <button onClick={() => navigate('/personal/health')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft size={14} /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Dumbbell className="text-primary" /> Workouts
          </h1>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => setIsTemplateFormOpen(true)}
                className="bg-primary hover:bg-[#0f2e22] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
            >
                <Plus size={16} /> Criar Modelo
            </button>
            <button 
                onClick={() => setIsExerciseMgrOpen(!isExerciseMgrOpen)}
                className={`bg-card border border-border px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 ${isExerciseMgrOpen ? 'text-primary border-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
                <Settings size={16} /> Exercícios
            </button>
        </div>
      </div>

      {/* Exercise Manager (Expandable) */}
      {isExerciseMgrOpen && (
          <div className="px-8 mb-8 animate-fade-in">
              <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm flex flex-col gap-6">
                  
                  {/* Form de Criação / Edição */}
                  <div className="flex flex-col gap-2 bg-secondary p-4 rounded-xl border border-border">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                          {editingExerciseId ? 'Editar Exercício' : 'Novo Exercício'}
                      </h3>
                      <div className="flex flex-col md:flex-row gap-3">
                          <input 
                            value={newExName} 
                            onChange={e => setNewExName(e.target.value)}
                            placeholder="Nome (ex: Supino Reto)"
                            className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary"
                          />
                          <select 
                            value={newExMuscle}
                            onChange={e => setNewExMuscle(e.target.value)}
                            className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer"
                          >
                              {Object.entries(muscleLabels).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                              ))}
                          </select>
                          <div className="flex gap-2">
                            {editingExerciseId && (
                                <button 
                                    onClick={handleCancelEdit} 
                                    className="bg-accent text-muted-foreground px-4 rounded-xl font-bold text-xs uppercase hover:bg-stone-300 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <button 
                                onClick={handleSaveExercise} 
                                className="bg-primary text-primary-foreground px-5 rounded-xl font-bold text-xs uppercase hover:bg-[#0f2e22] transition-colors flex items-center gap-2"
                            >
                                {editingExerciseId ? <Save size={16} /> : <Plus size={16} />}
                                {editingExerciseId ? 'Salvar' : 'Adicionar'}
                            </button>
                          </div>
                      </div>
                  </div>

                  {/* Lista de Exercícios */}
                  <div className="space-y-4">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                          <input 
                              value={exerciseSearch}
                              onChange={e => setExerciseSearch(e.target.value)}
                              placeholder="Buscar exercício cadastrado..."
                              className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
                          />
                      </div>

                      <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                          {filteredExercises.map(ex => (
                              <div key={ex.id} className="flex justify-between items-center p-3 hover:bg-secondary rounded-xl border border-transparent hover:border-border transition-all group">
                                  <div>
                                      <p className="text-sm font-bold text-foreground">{ex.name}</p>
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md mt-1 inline-block">
                                          {muscleLabels[ex.muscle_group] || ex.muscle_group}
                                      </span>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                          onClick={() => handleEditExercise(ex)}
                                          className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                                      >
                                          <Pencil size={14} />
                                      </button>
                                      <button 
                                          onClick={() => handleDeleteExercise(ex.id)}
                                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </div>
                          ))}
                          {filteredExercises.length === 0 && (
                              <p className="text-center text-muted-foreground text-xs py-4 italic">Nenhum exercício encontrado.</p>
                          )}
                      </div>
                  </div>

              </div>
          </div>
      )}

      {/* Start/Resume Button (Se já tiver sessão rodando) */}
      {isRunningSession && (
          <div className="px-8 mb-8 animate-fade-in">
             <button 
                onClick={handleResume}
                className="w-full py-6 rounded-[2rem] flex items-center justify-center gap-3 text-lg font-bold uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] bg-emerald-100 text-emerald-800 border-2 border-emerald-200 hover:bg-emerald-200"
            >
                Treino em Andamento... <span className="text-xs bg-card/50 px-2 py-1 rounded ml-2 flex items-center gap-1"><Play size={10} fill="currentColor"/> Retomar</span>
            </button>
          </div>
      )}

      {/* Templates Section */}
      <div className="px-8 mb-10">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
            <LayoutTemplate size={16} /> Meus Modelos
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card para Novo Treino Avulso */}
            <div className="bg-secondary rounded-[2rem] p-6 border-2 border-dashed border-border flex flex-col justify-center items-center cursor-pointer hover:border-border hover:bg-accent/50 transition-all group min-h-[140px]" onClick={() => setIsStarting(true)}>
                {!isStarting ? (
                    <>
                        <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-muted-foreground group-hover:text-primary mb-2 shadow-sm">
                            <Plus size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Treino Avulso</span>
                    </>
                ) : (
                    <div className="w-full animate-fade-in" onClick={e => e.stopPropagation()}>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2 block text-center">Nome do Treino</label>
                        <input 
                            autoFocus
                            value={newSessionName}
                            onChange={e => setNewSessionName(e.target.value)}
                            placeholder="Ex: Treino Rápido"
                            className="w-full bg-card border border-border rounded-xl px-4 py-2 text-foreground font-bold outline-none focus:ring-2 focus:ring-[#143d2d]/20 mb-2 text-center"
                            onKeyDown={e => e.key === 'Enter' && handleStart()}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setIsStarting(false)} className="flex-1 bg-card text-muted-foreground py-2 rounded-lg font-bold text-xs uppercase">Cancelar</button>
                            <button onClick={handleStart} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-bold text-xs uppercase">Iniciar</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Lista de Templates */}
            {templates.map(template => (
                <div 
                    key={template.id}
                    onClick={() => handleStartTemplate(template.id)}
                    className="bg-card rounded-[2rem] p-6 border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group relative flex flex-col justify-between min-h-[140px]"
                >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => handleDeleteTemplateClick(e, template.id)}
                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold text-foreground mb-2 pr-8">{template.name}</h4>
                        <div className="flex flex-wrap gap-1">
                            {template.items?.slice(0, 3).map((item: any) => (
                                <span key={item.id} className="text-[9px] font-bold uppercase bg-secondary text-muted-foreground px-2 py-1 rounded border border-border">
                                    {item.exercise?.name}
                                </span>
                            ))}
                            {(template.items?.length || 0) > 3 && (
                                <span className="text-[9px] font-bold uppercase bg-secondary text-muted-foreground px-2 py-1 rounded border border-border">
                                    +{template.items!.length - 3}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center text-primary text-xs font-bold uppercase tracking-widest gap-2">
                        <Play size={14} fill="currentColor" /> Iniciar
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Recent History */}
      <div className="px-8 space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Clock size={16} /> Histórico Recente
        </h3>

        {recentSessions.length === 0 ? (
            <div className="text-center py-12 bg-secondary rounded-[2rem] border border-dashed border-border text-muted-foreground text-sm">
                Nenhum treino finalizado ainda.
            </div>
        ) : (
            recentSessions.map(session => {
                const volume = session.sets?.reduce((acc, s) => acc + (s.weight * s.reps), 0) || 0;
                const exercisesCount = new Set(session.sets?.map(s => s.exercise_id)).size;

                return (
                    <div 
                        key={session.id} 
                        onClick={() => handleHistoryClick(session)}
                        className="bg-card p-6 rounded-[2rem] border border-border shadow-sm flex justify-between items-center group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer relative"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="bg-secondary text-muted-foreground text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-border flex items-center gap-1">
                                    <Calendar size={10} /> {formatDateBr(session.ended_at || session.started_at)}
                                </span>
                                {volume > 0 && (
                                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                                        {volume.toLocaleString()}kg Vol.
                                    </span>
                                )}
                            </div>
                            <h4 className="text-lg font-bold text-foreground">{session.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{session.sets?.length || 0} séries • {exercisesCount} exercícios</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={(e) => handleDeleteSessionClick(e, session.id)}
                                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                title="Excluir Treino"
                            >
                                <Trash2 size={18} />
                            </button>
                            <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* MODALS */}
      
      {/* 1. Workout Session Runner */}
      {activeSession && (
        <WorkoutSessionModal 
            isOpen={isSessionOpen}
            onClose={() => setIsSessionOpen(false)}
            session={activeSession}
            activeSets={activeSets}
            exercises={exercises}
            updateSet={updateSet}
            addSet={addSet}
            addExerciseToSession={addExerciseToSession}
            finishSession={handleFinishSession}
            deleteSet={deleteSet}
            getHistory={getExerciseHistory}
        />
      )}

      {/* 2. Template Creator */}
      <WorkoutTemplateForm 
        isOpen={isTemplateFormOpen}
        onClose={() => setIsTemplateFormOpen(false)}
        onSave={saveTemplate}
        exercises={exercises}
      />

      {/* 3. Confirm Delete Session */}
      <ConfirmModal 
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={confirmDeleteSession}
        title="Excluir Histórico?"
        description="Tem certeza que deseja apagar este registro de treino?"
        isDestructive
        isLoading={isDeleting}
      />

      {/* 4. Confirm Delete Template */}
      <ConfirmModal 
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={confirmDeleteTemplate}
        title="Excluir Modelo?"
        description="Este modelo será removido da sua lista de treinos rápidos."
        isDestructive
        isLoading={isDeleting}
      />

      {/* 5. Confirm Delete Exercise */}
      <ConfirmModal 
        isOpen={!!exerciseToDelete}
        onClose={() => setExerciseToDelete(null)}
        onConfirm={confirmDeleteExercise}
        title="Excluir Exercício?"
        description="Tem certeza que deseja excluir este exercício? Isso pode afetar históricos de treinos anteriores."
        isDestructive
        isLoading={isDeleting}
      />

    </div>
  );
}
