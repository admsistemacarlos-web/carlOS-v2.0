import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Trash2, BookOpen, Tag } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import RichTextEditor from '../../../../shared/components/ui/RichTextEditor';

export default function StudyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const saveTimeoutRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    bible_references: '',
    content: '',
    tags: [] as string[],
  });

  useEffect(() => {
    if (!id || !user) return;
    const fetchStudy = async () => {
      try {
        const { data, error } = await supabase
          .from('bible_study_notes')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (data) {
          setFormData({
            title: data.title,
            topic: data.topic || '',
            bible_references: data.bible_references || '',
            content: data.content || '',
            tags: data.tags || [],
          });
        }
      } catch (err) {
        alert('Erro ao carregar estudo.');
        navigate('/personal/spiritual/studies');
      } finally {
        setLoading(false);
      }
    };
    fetchStudy();
  }, [id, user, navigate]);

  const handleContentChange = (newMarkdown: string) => {
    setFormData(prev => ({ ...prev, content: newMarkdown }));

    if (!id) return;

    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await supabase
        .from('bible_study_notes')
        .update({ content: newMarkdown })
        .eq('id', id);
      setIsSaving(false);
    }, 1000);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return alert('O título é obrigatório.');
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        topic: formData.topic,
        bible_references: formData.bible_references,
        content: formData.content,
        tags: formData.tags,
        user_id: user.id,
      };

      if (id) {
        const { error } = await supabase.from('bible_study_notes').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bible_study_notes').insert(payload);
        if (error) throw error;
      }

      navigate('/personal/spiritual/studies');
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Tem certeza que deseja excluir este estudo?')) return;
    setIsDeleting(true);
    try {
      await supabase.from('bible_study_notes').delete().eq('id', id);
      navigate('/personal/spiritual/studies');
    } catch (err) {
      alert('Erro ao excluir.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-card font-sans text-foreground animate-fade-in">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur-md border-b border-border px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/personal/spiritual/studies')}
            className="p-2 -ml-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-muted-foreground hidden md:block">
              {id ? 'Editando Estudo' : 'Novo Estudo'}
            </h1>
            {id && (
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                {isSaving
                  ? <><Loader2 size={10} className="animate-spin" /> Salvando...</>
                  : <><Save size={10} /> Salvo</>}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {id && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 gap-6">

        {/* Metadados */}
        <div className="flex-none bg-card p-6 rounded-[1.5rem] border border-border shadow-sm space-y-6">
          <div>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Título do Estudo"
              className="w-full text-2xl md:text-3xl font-bold text-foreground placeholder-stone-300 outline-none bg-transparent"
              autoFocus={!id}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
            <div className="group">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                <Tag size={12} /> Tópico / Tema
              </label>
              <input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Ex: Graça"
                className="w-full bg-secondary border-b border-transparent focus:border-emerald-400 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-all focus:bg-card"
              />
            </div>
            <div className="group">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                <BookOpen size={12} /> Referências Bíblicas
              </label>
              <input
                value={formData.bible_references}
                onChange={(e) => setFormData({ ...formData, bible_references: e.target.value })}
                placeholder="Ex: Romanos 8"
                className="w-full bg-secondary border-b border-transparent focus:border-emerald-400 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-all focus:bg-card"
              />
            </div>
          </div>
        </div>

        {/* Editor Rico */}
        <div className="flex-1 flex flex-col bg-card rounded-[1.5rem] border border-border shadow-sm relative overflow-hidden min-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-full p-8 md:p-12 overflow-y-auto">
            <RichTextEditor
              key={id}
              content={formData.content}
              onChange={handleContentChange}
              placeholder="# Desenvolvimento do Estudo&#10;&#10;Escreva seus aprendizados aqui..."
            />
          </div>
        </div>

      </div>
    </div>
  );
}