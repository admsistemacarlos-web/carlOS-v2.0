
import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  Plus, ChevronDown, ChevronRight, Layers, FileText, MoreVertical,
  Pencil, Trash2, Loader2, ArrowLeft, Link as LinkIcon, Mail,
  Eye, EyeOff, Copy, CheckCircle2, X, Search
} from 'lucide-react';
import { ConfirmModal } from '../../../../shared/components/ui/ConfirmModal';

// Types
interface Module {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  position: number;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  course_url: string | null;
  access_email: string | null;
  access_password: string | null;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Module dialog
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });

  // Lesson dialog
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', description: '' });

  const [saving, setSaving] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'module' | 'lesson';
    id: string | null;
  }>({ isOpen: false, type: 'lesson', id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    if (!user || !courseId) return;

    try {
        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title, description, course_url, access_email, access_password')
          .eq('id', courseId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (courseError || !courseData) {
          setCourse(null);
        } else {
          setCourse(courseData);

          // Fetch modules
          const { data: modulesData } = await supabase
            .from('modules')
            .select('*')
            .eq('course_id', courseId)
            .order('position', { ascending: true });

          const modulesWithLessons = await Promise.all(
            (modulesData || []).map(async (module) => {
              const { data: lessons } = await supabase
                .from('lessons')
                .select('*')
                .eq('module_id', module.id)
                .order('position', { ascending: true });

              return { ...module, lessons: lessons || [] };
            })
          );

          setModules(modulesWithLessons);
          // Open all modules by default
          setOpenModules(new Set(modulesWithLessons.map(m => m.id)));
        }
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, courseId]);

  // --- LÓGICA DE FILTRAGEM ---
  const filteredModules = useMemo(() => {
    if (!searchTerm.trim()) return modules;
    const lowerTerm = searchTerm.toLowerCase();

    return modules.map(module => {
        // Se o título do módulo der match, mostra ele inteiro
        const moduleMatch = module.title.toLowerCase().includes(lowerTerm);
        // Filtra as aulas que dão match
        const matchingLessons = module.lessons.filter(l => l.title.toLowerCase().includes(lowerTerm));

        if (moduleMatch) return module; // Retorna módulo completo
        if (matchingLessons.length > 0) return { ...module, lessons: matchingLessons }; // Retorna módulo com aulas filtradas
        
        return null; // Não retorna nada
    }).filter((m): m is Module => m !== null);
  }, [modules, searchTerm]);

  const toggleModule = (moduleId: string) => {
    const newOpen = new Set(openModules);
    if (newOpen.has(moduleId)) {
      newOpen.delete(moduleId);
    } else {
      newOpen.add(moduleId);
    }
    setOpenModules(newOpen);
  };

  // Module CRUD
  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId || !moduleForm.title.trim()) return;

    setSaving(true);

    try {
        if (editingModule) {
          const { error } = await supabase
            .from('modules')
            .update({
              title: moduleForm.title.trim(),
              description: moduleForm.description.trim() || null,
            })
            .eq('id', editingModule.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('modules')
            .insert({
              course_id: courseId,
              user_id: user.id,
              title: moduleForm.title.trim(),
              description: moduleForm.description.trim() || null,
              position: modules.length,
            });

          if (error) throw error;
        }
        await fetchData();
        closeModuleModal();
    } catch (error: any) {
        console.error('Erro:', error.message);
    } finally {
        setSaving(false);
    }
  };

  // Lesson CRUD
  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedModuleId || !lessonForm.title.trim()) return;

    setSaving(true);

    try {
        if (editingLesson) {
          const { error } = await supabase
            .from('lessons')
            .update({
              title: lessonForm.title.trim(),
              description: lessonForm.description.trim() || null,
            })
            .eq('id', editingLesson.id);

          if (error) throw error;
        } else {
          const module = modules.find(m => m.id === selectedModuleId);
          const { error } = await supabase
            .from('lessons')
            .insert({
              module_id: selectedModuleId,
              user_id: user.id,
              title: lessonForm.title.trim(),
              description: lessonForm.description.trim() || null,
              position: module?.lessons.length || 0,
            });

          if (error) throw error;
        }
        await fetchData();
        closeLessonModal();
    } catch (error: any) {
        console.error('Erro:', error.message);
    } finally {
        setSaving(false);
    }
  };

  // DELETE HANDLERS (New)
  const requestDeleteModule = (moduleId: string) => {
    setDeleteConfirmation({ isOpen: true, type: 'module', id: moduleId });
  };

  const requestDeleteLesson = (lessonId: string) => {
    setDeleteConfirmation({ isOpen: true, type: 'lesson', id: lessonId });
  };

  const confirmDelete = async () => {
    const { type, id } = deleteConfirmation;
    if (!id) return;

    setIsDeleting(true);
    try {
        if (type === 'module') {
            const { error } = await supabase.from('modules').delete().eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('lessons').delete().eq('id', id);
            if (error) throw error;
        }
        await fetchData();
        setDeleteConfirmation({ isOpen: false, type: 'lesson', id: null });
    } catch (err: any) {
        console.error('Erro ao excluir:', err.message);
    } finally {
        setIsDeleting(false);
    }
  };

  const toggleLessonComplete = async (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation
    const { error } = await supabase
      .from('lessons')
      .update({
        is_completed: !lesson.is_completed,
        completed_at: !lesson.is_completed ? new Date().toISOString() : null,
      })
      .eq('id', lesson.id);

    if (!error) {
      // Optimistic update locally
      setModules(prev => prev.map(m => ({
          ...m,
          lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, is_completed: !l.is_completed } : l)
      })));
    }
  };

  // Dialog Handlers
  const openNewModuleDialog = () => {
    setEditingModule(null);
    setModuleForm({ title: '', description: '' });
    setIsModuleModalOpen(true);
  };

  const openEditModuleDialog = (module: Module) => {
    setEditingModule(module);
    setModuleForm({ title: module.title, description: module.description || '' });
    setIsModuleModalOpen(true);
    setActiveMenuId(null);
  };

  const closeModuleModal = () => setIsModuleModalOpen(false);

  const openNewLessonDialog = (moduleId: string) => {
    setEditingLesson(null);
    setSelectedModuleId(moduleId);
    setLessonForm({ title: '', description: '' });
    setIsLessonModalOpen(true);
  };

  const openEditLessonDialog = (lesson: Lesson, moduleId: string) => {
    setEditingLesson(lesson);
    setSelectedModuleId(moduleId);
    setLessonForm({ title: lesson.title, description: lesson.description || '' });
    setIsLessonModalOpen(true);
    setActiveMenuId(null);
  };

  const closeLessonModal = () => setIsLessonModalOpen(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-olive" size={32} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground mb-4">Curso não encontrado ou removido.</p>
        <Link to="/personal/studies" className="text-olive font-bold hover:underline">
          Voltar para biblioteca
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20" onClick={() => setActiveMenuId(null)}>
      {/* Header */}
      <div className="space-y-6">
        <Link to="/personal/studies" className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para biblioteca
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tighter mb-2">{course.title}</h1>
            {course.description && (
              <p className="text-muted-foreground leading-relaxed max-w-2xl">{course.description}</p>
            )}
          </div>
          <button 
            onClick={openNewModuleDialog}
            className="flex items-center gap-2 px-5 py-2.5 bg-coffee text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
          >
            <Plus size={14} /> Novo Módulo
          </button>
        </div>

        {/* Access Info Card */}
        {(course.course_url || course.access_email || course.access_password) && (
          <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-stone-50 pb-2">Credenciais de Acesso</h3>
            
            {course.course_url && (
                <div className="flex items-center gap-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a 
                    href={course.course_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-olive hover:underline truncate font-medium"
                  >
                    {course.course_url}
                  </a>
                </div>
            )}
            
            {course.access_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 truncate text-foreground select-all">{course.access_email}</span>
                  <button
                    className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(course.access_email || '');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
            )}
            
            {course.access_password && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-4 shrink-0">🔑</span>
                  <span className="text-sm flex-1 font-mono text-foreground">
                    {showPassword ? course.access_password : '••••••••'}
                  </span>
                  <div className="flex gap-1">
                    <button
                        className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    <button
                        className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
                        onClick={() => {
                        navigator.clipboard.writeText(course.access_password || '');
                        }}
                    >
                        <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Search Input */}
      {modules.length > 0 && (
        <div className="relative animate-fade-in">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input 
            type="text"
            placeholder="Filtrar aulas ou módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-[1.5rem] py-4 pl-12 pr-12 text-foreground outline-none focus:ring-2 focus:ring-olive/10 transition-all shadow-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Modules List (Fichário Index Style) */}
      <div className="space-y-4">
        {modules.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-[2rem] border border-dashed border-border">
                <Layers className="h-12 w-12 mx-auto text-stone-200 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Currículo vazio</h3>
                <p className="text-muted-foreground text-sm mb-6">Comece estruturando o curso com módulos e aulas.</p>
                <button 
                    onClick={openNewModuleDialog}
                    className="text-olive font-bold text-xs uppercase tracking-widest hover:underline"
                >
                    + Criar primeiro módulo
                </button>
            </div>
        ) : filteredModules.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-[2rem] border border-border">
                <Search className="h-12 w-12 mx-auto text-stone-200 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum resultado</h3>
                <p className="text-muted-foreground text-sm mb-6">Não encontramos aulas ou módulos com "{searchTerm}".</p>
                <button 
                    onClick={() => setSearchTerm('')}
                    className="text-olive font-bold text-xs uppercase tracking-widest hover:underline"
                >
                    Limpar busca
                </button>
            </div>
        ) : (
            filteredModules.map((module) => {
                // Se estiver buscando, força o módulo a ficar aberto para ver os resultados
                const isOpen = searchTerm ? true : openModules.has(module.id);
                const moduleCompleted = module.lessons.filter(l => l.is_completed).length;
                const moduleTotal = module.lessons.length;

                return (
                    <div key={module.id} className="bg-card rounded-[2rem] border border-border overflow-hidden shadow-sm transition-all">
                        {/* Module Header */}
                        <div 
                            className="flex items-center gap-4 p-6 cursor-pointer hover:bg-secondary/50 transition-colors select-none"
                            onClick={() => toggleModule(module.id)}
                        >
                            <div className="text-muted-foreground">
                                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </div>
                            
                            <div className="flex-1">
                                <h3 className="font-bold text-foreground text-base">{module.title}</h3>
                                {moduleTotal > 0 && (
                                    <div className="mt-1">
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{moduleCompleted}/{moduleTotal} Tópicos</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openNewLessonDialog(module.id); }}
                                    className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors"
                                    title="Adicionar Aula"
                                >
                                    <Plus size={16} />
                                </button>
                                <div className="relative">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === module.id ? null : module.id); }}
                                        className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    
                                    {activeMenuId === module.id && (
                                        <div className="absolute right-0 mt-2 w-32 bg-card rounded-xl shadow-xl border border-border z-10 overflow-hidden animate-fade-in">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openEditModuleDialog(module); }} 
                                                className="w-full text-left px-4 py-3 text-xs font-bold text-foreground hover:bg-secondary flex items-center gap-2"
                                            >
                                                <Pencil size={12} /> Editar
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); requestDeleteModule(module.id); }} 
                                                className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 size={12} /> Excluir
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Lessons List (Index Style) */}
                        {isOpen && (
                            <div className="border-t border-stone-50 divide-y divide-stone-50 bg-secondary/30">
                                {module.lessons.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6 italic">Nenhuma aula cadastrada neste módulo.</p>
                                ) : (
                                    module.lessons.map(lesson => (
                                        <div 
                                            key={lesson.id}
                                            className="group flex items-center justify-between p-4 pl-14 hover:bg-card transition-colors cursor-pointer"
                                            onClick={() => navigate(`/personal/studies/lessons/${lesson.id}`)}
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <button 
                                                    onClick={(e) => toggleLessonComplete(lesson, e)}
                                                    className={`
                                                        w-5 h-5 rounded-full border flex items-center justify-center transition-all
                                                        ${lesson.is_completed 
                                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                            : 'border-border text-transparent hover:border-emerald-500'
                                                        }
                                                    `}
                                                >
                                                    <CheckCircle2 size={12} />
                                                </button>
                                                <div className="min-w-0">
                                                    <span className={`text-sm font-medium truncate block ${lesson.is_completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                                        {lesson.title}
                                                    </span>
                                                    {lesson.description && (
                                                        <span className="text-xs text-muted-foreground truncate block mt-0.5 max-w-md">
                                                            {lesson.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); openEditLessonDialog(lesson, module.id); }}
                                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); requestDeleteLesson(lesson.id); }}
                                                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <div className="text-muted-foreground pl-1">
                                                    <FileText size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                );
            })
        )}
      </div>

      {/* --- MODAL (MODULE) --- */}
      {isModuleModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeModuleModal} />
          <div className="relative bg-card w-full max-w-md rounded-[2rem] shadow-2xl p-6 animate-fade-in">
             <h3 className="text-lg font-bold text-foreground mb-4">{editingModule ? 'Editar Módulo' : 'Novo Módulo'}</h3>
             <form onSubmit={handleModuleSubmit} className="space-y-4">
                <input 
                    autoFocus
                    placeholder="Título do Módulo" 
                    value={moduleForm.title}
                    onChange={e => setModuleForm({...moduleForm, title: e.target.value})}
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-olive/10"
                />
                <textarea 
                    placeholder="Descrição (opcional)" 
                    value={moduleForm.description}
                    onChange={e => setModuleForm({...moduleForm, description: e.target.value})}
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-olive/10 resize-none h-24"
                />
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModuleModal} className="flex-1 py-3 rounded-xl bg-secondary text-muted-foreground font-bold text-xs uppercase tracking-widest hover:bg-accent">Cancelar</button>
                    <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-coffee text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50">
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
             </form>
          </div>
        </div>,
        document.body
      )}

      {/* --- MODAL (LESSON) --- */}
      {isLessonModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeLessonModal} />
          <div className="relative bg-card w-full max-w-md rounded-[2rem] shadow-2xl p-6 animate-fade-in">
             <h3 className="text-lg font-bold text-foreground mb-4">{editingLesson ? 'Editar Aula' : 'Nova Aula'}</h3>
             <form onSubmit={handleLessonSubmit} className="space-y-4">
                <input 
                    autoFocus
                    placeholder="Título da Aula" 
                    value={lessonForm.title}
                    onChange={e => setLessonForm({...lessonForm, title: e.target.value})}
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-olive/10"
                />
                <textarea 
                    placeholder="Descrição curta (opcional)" 
                    value={lessonForm.description}
                    onChange={e => setLessonForm({...lessonForm, description: e.target.value})}
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-olive/10 resize-none h-24"
                />
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeLessonModal} className="flex-1 py-3 rounded-xl bg-secondary text-muted-foreground font-bold text-xs uppercase tracking-widest hover:bg-accent">Cancelar</button>
                    <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-[#4a5740] transition-colors disabled:opacity-50">
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
             </form>
          </div>
        </div>,
        document.body
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      <ConfirmModal 
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: 'lesson', id: null })}
        onConfirm={confirmDelete}
        title={`Excluir ${deleteConfirmation.type === 'module' ? 'Módulo' : 'Aula'}?`}
        description={deleteConfirmation.type === 'module' 
            ? "Tem certeza que deseja excluir este módulo e todas as suas aulas? Esta ação não pode ser desfeita."
            : "Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita."
        }
        isDestructive
        isLoading={isDeleting}
      />

    </div>
  );
}
