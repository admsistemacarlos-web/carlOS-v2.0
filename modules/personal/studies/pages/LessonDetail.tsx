
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../../integrations/supabase/client';
import { 
  ArrowLeft, CheckCircle2, ChevronDown, 
  Menu, Save, Loader2, Circle,
  Search, X, Plus
} from 'lucide-react';
import { createPortal } from 'react-dom';
import RichTextEditor from '../../../../shared/components/ui/RichTextEditor';
import { useAuth } from '../../../../contexts/AuthContext';

// --- TYPES ---
interface Lesson {
  id: string;
  title: string;
  content: string | null;
  is_completed: boolean;
  module_id: string;
  position: number;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  position: number;
}

export default function LessonDetail() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Data State
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Create Lesson State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Refs for Auto-Save
  const contentRef = useRef(content);
  const saveTimeoutRef = useRef<any>(null);

  // --- FETCHING ---
  useEffect(() => {
    if (!lessonId) return;
    fetchLessonData();
  }, [lessonId]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchLessonData = async () => {
    setLoading(true);
    try {
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          modules (
            id,
            course_id,
            courses (
              id,
              title
            )
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError || !lessonData) throw new Error('Aula não encontrada');

      const lesson = {
        id: lessonData.id,
        title: lessonData.title,
        content: lessonData.content || '',
        is_completed: lessonData.is_completed,
        module_id: lessonData.module_id,
        position: lessonData.position
      };
      
      const fetchedCourseId = lessonData.modules?.course_id;
      const courseTitleVal = lessonData.modules?.courses?.title;

      setCurrentLesson(lesson);
      setContent(lesson.content || ''); 
      contentRef.current = lesson.content || '';
      setCourseTitle(courseTitleVal || 'Curso');
      setCourseId(fetchedCourseId || null);

      if (fetchedCourseId) {
        const { data: modulesData } = await supabase
          .from('modules')
          .select(`
            id,
            title,
            position,
            lessons (
              id,
              title,
              is_completed,
              position
            )
          `)
          .eq('course_id', fetchedCourseId)
          .order('position', { ascending: true });

        if (modulesData) {
          const sortedModules = modulesData.map((m: any) => ({
            ...m,
            lessons: (m.lessons || []).sort((a: Lesson, b: Lesson) => a.position - b.position)
          }));
          
          setModules(sortedModules);
          
          setOpenModules(prev => {
            const newSet = new Set(prev);
            newSet.add(lessonData.module_id);
            return newSet;
          });
        }
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = useMemo(() => {
    if (!sidebarSearch.trim()) return modules;

    return modules.map(module => ({
      ...module,
      lessons: module.lessons.filter(l => 
        l.title.toLowerCase().includes(sidebarSearch.toLowerCase())
      )
    })).filter(module => module.lessons.length > 0);
  }, [modules, sidebarSearch]);

  useEffect(() => {
    if (sidebarSearch.trim()) {
      setOpenModules(new Set(filteredModules.map(m => m.id)));
    }
  }, [sidebarSearch, filteredModules]);


  // --- AUTO SAVE LOGIC ---
  const handleContentChange = (newMarkdown: string) => {
    setContent(newMarkdown);
    contentRef.current = newMarkdown;
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (lessonId) {
        await supabase
          .from('lessons')
          .update({ content: newMarkdown })
          .eq('id', lessonId);
        setIsSaving(false);
      }
    }, 1000);
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) newSet.delete(moduleId);
      else newSet.add(moduleId);
      return newSet;
    });
  };

  const toggleComplete = async () => {
    if (!currentLesson) return;
    const newState = !currentLesson.is_completed;
    
    setCurrentLesson({ ...currentLesson, is_completed: newState });
    
    setModules(prev => prev.map(m => ({
        ...m,
        lessons: m.lessons.map(l => l.id === currentLesson.id ? { ...l, is_completed: newState } : l)
    })));

    await supabase
      .from('lessons')
      .update({ is_completed: newState })
      .eq('id', currentLesson.id);
  };

  // --- LESSON CREATION HANDLERS ---
  const handleOpenCreateModal = (moduleId: string) => {
    setTargetModuleId(moduleId);
    setNewLessonTitle('');
    setIsCreateModalOpen(true);
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetModuleId || !newLessonTitle.trim() || !user) return;

    setIsCreating(true);
    try {
       const module = modules.find(m => m.id === targetModuleId);
       const currentMaxPos = module?.lessons.length || 0;

       const { data, error } = await supabase.from('lessons').insert({
         module_id: targetModuleId,
         title: newLessonTitle.trim(),
         user_id: user.id,
         position: currentMaxPos,
         content: ''
       }).select().single();

       if (error) throw error;

       // Recarregar para atualizar a lista
       await fetchLessonData();
       setIsCreateModalOpen(false);
       
       // Opcional: Navegar para a nova aula
       if (data) {
         navigate(`/personal/studies/lessons/${data.id}`);
       }

    } catch(err: any) {
       alert('Erro ao criar aula: ' + err.message);
    } finally {
       setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-card">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex w-full h-full bg-card overflow-hidden font-sans text-muted-foreground">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`
          flex-shrink-0 bg-secondary border-r border-border flex flex-col transition-all duration-300 ease-in-out absolute lg:relative z-20 h-full
          ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0 overflow-hidden opacity-0 lg:opacity-100'}
        `}
      >
        <div className="w-80 flex flex-col h-full"> 
            <div className="p-5 border-b border-border bg-secondary flex-shrink-0">
            <button 
                onClick={() => navigate(`/personal/studies/courses/${courseId || ''}`)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-muted-foreground transition-colors mb-3"
            >
                <ArrowLeft size={12} /> Voltar ao Curso
            </button>
            <h2 className="text-base font-bold text-foreground leading-tight line-clamp-2">
                {courseTitle}
            </h2>
            </div>

            <div className="p-4 border-b border-border bg-secondary flex-shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input 
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    placeholder="Buscar aula..."
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-8 py-2.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-muted-foreground transition-all shadow-sm"
                    />
                    {sidebarSearch && (
                    <button 
                        onClick={() => setSidebarSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-muted-foreground transition-colors"
                    >
                        <X size={12} />
                    </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredModules.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-10">Nenhum resultado.</p>
            ) : (
                filteredModules.map(module => {
                const isOpen = openModules.has(module.id);
                return (
                    <div key={module.id} className="space-y-0.5">
                    <button 
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between text-left p-2.5 rounded-lg hover:bg-gray-200/50 transition-colors group"
                    >
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide truncate pr-2">{module.title}</span>
                        <ChevronDown size={14} className={`text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isOpen && (
                        <div className="space-y-0.5 ml-3 border-l border-border pl-1">
                        {module.lessons.map(lesson => {
                            const isActive = lesson.id === lessonId;
                            return (
                            <button
                                key={lesson.id}
                                onClick={() => {
                                navigate(`/personal/studies/lessons/${lesson.id}`);
                                if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`
                                w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-start gap-2 relative
                                ${isActive 
                                    ? 'bg-card text-muted-foreground font-semibold shadow-sm ring-1 ring-gray-200 z-10' 
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }
                                `}
                            >
                                <div className="mt-0.5 flex-shrink-0">
                                {lesson.is_completed ? (
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                ) : (
                                    <Circle size={12} className={isActive ? "text-muted-foreground" : "text-muted-foreground"} />
                                )}
                                </div>
                                <span className="truncate leading-relaxed text-[13px]">{lesson.title}</span>
                            </button>
                            );
                        })}
                        
                        {/* BOTÃO ADICIONAR AULA */}
                        <button
                            onClick={() => handleOpenCreateModal(module.id)}
                            className="w-full text-left px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 mt-1 opacity-70 hover:opacity-100"
                        >
                            <Plus size={12} /> Nova Aula
                        </button>
                        </div>
                    )}
                    </div>
                );
                })
            )}
            </div>
        </div>
      </aside>

      {/* --- MOBILE OVERLAY --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-10 bg-stone-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- MAIN AREA --- */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-card relative">
        
        {/* Editor Header */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-gray-100 bg-card z-10 shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
              title={isSidebarOpen ? "Fechar Sidebar" : "Abrir Sidebar"}
            >
              <Menu size={20} />
            </button>
            
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-bold text-foreground truncate">
                {currentLesson?.title}
              </h1>
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                {isSaving ? (
                  <><Loader2 size={10} className="animate-spin" /> Salvando...</>
                ) : (
                  <><Save size={10} /> Salvo</>
                )}
              </span>
            </div>
          </div>

          <button 
            onClick={toggleComplete}
            className={`
              flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ml-4
              ${currentLesson?.is_completed 
                ? 'bg-stone-800 text-white' 
                : 'bg-card border border-border text-muted-foreground hover:border-border hover:text-foreground'
              }
            `}
          >
            <CheckCircle2 size={14} />
            <span className="hidden md:inline">{currentLesson?.is_completed ? 'Concluída' : 'Concluir'}</span>
          </button>
        </header>

        {/* Content Area - Rich Text Editor */}
        <div className="flex-1 overflow-y-auto bg-card relative">
          <div className="w-full h-full max-w-4xl mx-auto px-8 md:px-12 py-8">
            <RichTextEditor 
                key={lessonId} // Garante que o editor reinicie ao trocar de aula
                content={content}
                onChange={handleContentChange}
                placeholder="# Comece a escrever..."
            />
          </div>
        </div>
      </main>

      {/* --- CREATE LESSON MODAL --- */}
      {isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-xl p-6 animate-fade-in">
             <h3 className="text-lg font-bold text-foreground mb-4">Nova Aula</h3>
             <form onSubmit={handleCreateLesson} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Título da Aula</label>
                    <input 
                        autoFocus
                        value={newLessonTitle}
                        onChange={e => setNewLessonTitle(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="Ex: Introdução..."
                    />
                </div>
                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-2.5 bg-secondary text-muted-foreground font-bold text-xs rounded-xl hover:bg-accent transition-colors">Cancelar</button>
                    <button type="submit" disabled={isCreating} className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors">
                        {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar
                    </button>
                </div>
             </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
