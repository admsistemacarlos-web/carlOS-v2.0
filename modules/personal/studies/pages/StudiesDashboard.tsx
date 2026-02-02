
import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  Plus, Search, Book, MoreVertical, Pencil, Trash2, 
  Loader2, X, Folder, ChevronRight 
} from 'lucide-react';
import { ConfirmModal } from '../../../../shared/components/ui/ConfirmModal';

// --- TYPES ---
interface Course {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  course_url: string | null;
  access_email: string | null;
  access_password: string | null;
  updated_at: string;
}

export default function StudiesDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    course_url: '',
    access_email: '',
    access_password: ''
  });

  // --- FETCH DATA ---
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_archived', false)
        .order('category', { ascending: true }) // Ordenar por categoria primeiro
        .order('title', { ascending: true });   // Depois por título

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCourses();
  }, [user]);

  // --- GROUPING LOGIC ---
  const groupedCourses = useMemo(() => {
    const filtered = courses.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: { [key: string]: Course[] } = {};

    filtered.forEach(course => {
      const cat = course.category || 'Geral'; // Categoria default
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(course);
    });

    return groups;
  }, [courses, searchTerm]);

  // --- ACTIONS ---
  
  // Delete Handler
  const handleDeleteRequest = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(courseId);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      await fetchCourses();
      setDeleteId(null);
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Modal (Create)
  const handleOpenCreate = () => {
    setEditingCourse(null);
    setFormData({ title: '', category: '', description: '', course_url: '', access_email: '', access_password: '' });
    setIsModalOpen(true);
  };

  // Open Modal (Edit)
  const handleOpenEdit = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourse(course);
    setFormData({
      title: course.title,
      category: course.category || '',
      description: course.description || '',
      course_url: course.course_url || '',
      access_email: course.access_email || '',
      access_password: course.access_password || ''
    });
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !user) return;

    setIsSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category.trim() || null,
        description: formData.description.trim() || null,
        course_url: formData.course_url.trim() || null,
        access_email: formData.access_email.trim() || null,
        access_password: formData.access_password.trim() || null,
        user_id: user.id
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
          .insert(payload);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-20 font-sans text-gray-900 animate-fade-in w-full">
      
      {/* --- HEADER --- */}
      <div className="w-full px-8 pt-8 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Meus Estudos</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie seus cursos, livros e anotações.</p>
          </div>
          
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors active:scale-95"
          >
            <Plus size={18} /> Novo Curso
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou categoria..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="w-full px-8 space-y-8">
        
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : Object.keys(groupedCourses).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
            <Book className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum curso encontrado</h3>
            <p className="text-gray-500 text-sm mb-6">Comece adicionando seu primeiro material de estudo.</p>
            <button onClick={handleOpenCreate} className="text-blue-600 hover:underline text-sm font-medium">
              + Criar Curso
            </button>
          </div>
        ) : (
          Object.keys(groupedCourses).map(category => (
            <div key={category} className="animate-fade-in w-full">
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <Folder size={16} className="text-gray-400" />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{category}</h2>
                <div className="h-px bg-gray-200 flex-1 ml-2"></div>
              </div>

              {/* Courses List */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100 w-full">
                {groupedCourses[category].map(course => (
                  <div 
                    key={course.id}
                    onClick={() => navigate(`/personal/studies/courses/${course.id}`)}
                    className="group flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer w-full"
                  >
                    {/* Left: Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Book size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {course.title}
                        </h3>
                        {course.description ? (
                          <p className="text-xs text-gray-500 truncate max-w-md">
                            {course.description}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Sem descrição</p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 pl-4">
                      <button 
                        onClick={(e) => handleOpenEdit(course, e)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteRequest(course.id, e)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="text-gray-300">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODAL (CREATE/EDIT) --- */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsModalOpen(false)} 
          />
          
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCourse ? 'Editar Curso' : 'Novo Curso'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              
              {/* Título & Categoria */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título do Curso</label>
                  <input 
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Introdução ao Design"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Categoria</label>
                  <input 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="Ex: Design, Programação, Finanças..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descrição</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Sobre o que é este curso?"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Dados de Acesso (Opcional) */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dados de Acesso (Opcional)</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Link do Curso</label>
                  <input 
                    type="url"
                    value={formData.course_url}
                    onChange={e => setFormData({...formData, course_url: e.target.value})}
                    placeholder="https://..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email / Login</label>
                    <input 
                      value={formData.access_email}
                      onChange={e => setFormData({...formData, access_email: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Senha</label>
                    <input 
                      value={formData.access_password}
                      onChange={e => setFormData({...formData, access_password: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : (editingCourse ? 'Salvar Alterações' : 'Criar Curso')}
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
