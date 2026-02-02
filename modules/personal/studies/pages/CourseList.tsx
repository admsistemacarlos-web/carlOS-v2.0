
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  Plus, BookOpen, MoreVertical, Pencil, Trash2, Loader2, 
  Search, ArrowLeft, ArrowRight, X, Filter 
} from 'lucide-react';
import { ConfirmModal } from '../../../../shared/components/ui/ConfirmModal';

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  cover_image_url: string | null;
  course_url: string | null;
  access_email: string | null;
  access_password: string | null;
  created_at: string;
  progress?: number;
}

const CourseList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Estado do formulário
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    category: '', 
    course_url: '', 
    access_email: '', 
    access_password: '' 
  });
  const [saving, setSaving] = useState(false);
  
  // Filtros e Menu
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Categorias únicas
  const categories = ['all', ...new Set(courses.map(c => c.category).filter(Boolean))] as string[];

  const fetchCourses = async () => {
    if (!user) return;

    const { data: coursesData, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar cursos:', error);
      return;
    }

    // Calcular progresso
    const coursesWithProgress = await Promise.all(
      (coursesData || []).map(async (course) => {
        const { data: modules } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', course.id);

        if (!modules?.length) return { ...course, progress: 0 };

        const moduleIds = modules.map(m => m.id);
        if (moduleIds.length === 0) return { ...course, progress: 0 };

        const { data: lessons } = await supabase
          .from('lessons')
          .select('is_completed')
          .in('module_id', moduleIds);

        const total = lessons?.length || 0;
        const completed = lessons?.filter(l => l.is_completed).length || 0;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { ...course, progress };
      })
    );

    setCourses(coursesWithProgress);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim()) return;

    setSaving(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category.trim() || null,
        course_url: formData.course_url.trim() || null,
        access_email: formData.access_email.trim() || null,
        access_password: formData.access_password.trim() || null,
      };

      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(payload)
          .eq('id', editingCourse.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('courses')
          .insert({
            ...payload,
            user_id: user.id,
            position: courses.length,
          });

        if (error) throw error;
      }

      fetchCourses();
      closeModal();
    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      category: course.category || '',
      course_url: course.course_url || '',
      access_email: course.access_email || '',
      access_password: course.access_password || '',
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const requestDelete = (courseId: string) => {
    setActiveMenuId(null);
    setDeleteId(courseId);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', deleteId);

    if (error) {
      console.error('Erro ao excluir:', error.message);
    } else {
      fetchCourses();
    }
    setIsDeleting(false);
    setDeleteId(null);
  };

  const openNewDialog = () => {
    setEditingCourse(null);
    setFormData({ title: '', description: '', category: '', course_url: '', access_email: '', access_password: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  // Filter Logic
  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'all' || (selectedCategory === 'sem_categoria' ? !course.category : course.category === selectedCategory);
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-olive" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20" onClick={() => setActiveMenuId(null)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors text-cappuccino">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-coffee tracking-tighter">Biblioteca</h1>
            <p className="text-cappuccino text-xs font-bold uppercase tracking-widest mt-1">Meus Cursos e Livros</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
             <input 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Buscar curso..." 
               className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-olive/50 transition-colors"
             />
          </div>
          <button 
            onClick={openNewDialog}
            className="bg-coffee text-white px-4 py-2.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Novo</span>
          </button>
        </div>
      </div>

      {/* Tags Filter */}
      {courses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-olive text-white border-olive'
                  : 'bg-white text-cappuccino border-stone-200 hover:border-olive'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat || 'Sem Categoria'}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-[2rem] border border-stone-100 shadow-sm">
          <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
            <BookOpen size={24} />
          </div>
          <h3 className="text-lg font-semibold text-coffee mb-2">Nenhum curso encontrado</h3>
          <p className="text-stone-400 text-sm max-w-md mx-auto mb-6">
            Adicione novos cursos para começar a acompanhar seu progresso.
          </p>
          <button onClick={openNewDialog} className="text-olive font-bold text-xs uppercase tracking-widest hover:underline">
            + Adicionar Curso
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div 
              key={course.id}
              className="group bg-white rounded-[2rem] border border-stone-100 p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden"
              onClick={() => navigate(`/personal/studies/courses/${course.id}`)}
            >
              {/* Menu de Opções */}
              <div className="absolute top-4 right-4 z-20">
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === course.id ? null : course.id); }}
                  className="p-2 hover:bg-stone-50 rounded-full text-stone-300 hover:text-coffee transition-colors"
                >
                  <MoreVertical size={16} />
                </button>
                
                {activeMenuId === course.id && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden animate-fade-in">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(course); }} 
                      className="w-full text-left px-4 py-3 text-xs font-bold text-coffee hover:bg-stone-50 flex items-center gap-2"
                    >
                      <Pencil size={12} /> Editar
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); requestDelete(course.id); }} 
                      className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                )}
              </div>

              <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 mb-4 group-hover:bg-olive/10 group-hover:text-olive transition-colors">
                <BookOpen size={24} />
              </div>

              {course.category && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-cappuccino bg-stone-50 px-2 py-1 rounded-md">
                  {course.category}
                </span>
              )}

              <h3 className="font-bold text-lg text-coffee mt-3 mb-1 truncate pr-8">{course.title}</h3>
              
              {course.description && (
                <p className="text-xs text-stone-400 mb-4 line-clamp-2 min-h-[2.5em]">
                  {course.description}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-stone-50">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                  <span>Progresso</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${course.progress === 100 ? 'bg-emerald-500' : 'bg-olive'}`} 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          
          <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl border border-stone-100 flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
             <div className="flex justify-between items-center p-6 border-b border-stone-50">
                <h2 className="text-xl font-semibold text-coffee tracking-tight">
                  {editingCourse ? 'Editar Curso' : 'Novo Curso'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-stone-50 rounded-full text-cappuccino transition-colors">
                  <X size={20} />
                </button>
             </div>

             <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-coffee uppercase tracking-widest ml-1">Título</label>
                  <input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: React Avançado"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-coffee outline-none focus:ring-2 focus:ring-olive/10"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-coffee uppercase tracking-widest ml-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Sobre o curso..."
                    rows={3}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-coffee outline-none focus:ring-2 focus:ring-olive/10 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-coffee uppercase tracking-widest ml-1">Categoria</label>
                  <input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Programação"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-coffee outline-none focus:ring-2 focus:ring-olive/10"
                  />
                </div>

                <div className="h-px bg-stone-100 my-2"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-cappuccino">Dados de Acesso Externo (Opcional)</p>

                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Link do Curso</label>
                  <input
                    type="url"
                    value={formData.course_url}
                    onChange={(e) => setFormData({ ...formData, course_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-coffee outline-none focus:ring-2 focus:ring-olive/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Email de Acesso</label>
                    <input
                      type="email"
                      value={formData.access_email}
                      onChange={(e) => setFormData({ ...formData, access_email: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-coffee outline-none focus:ring-2 focus:ring-olive/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Senha</label>
                    <input
                      type="text"
                      value={formData.access_password}
                      onChange={(e) => setFormData({ ...formData, access_password: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-coffee outline-none focus:ring-2 focus:ring-olive/10"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full bg-coffee hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 text-xs tracking-widest uppercase disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : (editingCourse ? <Pencil size={16} /> : <Plus size={16} />)}
                    {saving ? 'Salvando...' : (editingCourse ? 'Atualizar Curso' : 'Criar Curso')}
                  </button>
                </div>
             </form>
          </div>
        </div>,
        document.body
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Curso?"
        description="Tem certeza que deseja excluir este curso e todo o seu conteúdo (módulos e aulas)? Esta ação não pode ser desfeita."
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CourseList;
