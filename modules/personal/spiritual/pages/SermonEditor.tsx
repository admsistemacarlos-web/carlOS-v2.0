
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, User, BookOpen, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import RichTextEditor from '../../../../shared/components/ui/RichTextEditor';
import { ConfirmModal } from '../../../../shared/components/ui/ConfirmModal';

export default function SermonEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const getToday = () => new Date().toLocaleDateString('en-CA');

  const [formData, setFormData] = useState({
    title: '',
    preacher: '',
    date: getToday(),
    bible_passage: '',
    content: ''
  });

  useEffect(() => {
    if (!id || !user) return;

    const fetchSermon = async () => {
      try {
        const { data, error } = await supabase
          .from('sermon_notes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setFormData({
            title: data.title,
            preacher: data.preacher,
            date: new Date(data.date).toISOString().split('T')[0],
            bible_passage: data.bible_passage,
            content: data.content
          });
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao carregar pregação.');
        navigate('/personal/spiritual/sermons');
      } finally {
        setLoading(false);
      }
    };

    fetchSermon();
  }, [id, user, navigate]);

  const handleSave = async () => {
    if (!formData.title.trim()) return alert("O título é obrigatório.");
    if (!user) return;

    setSaving(true);
    try {
      const [year, month, day] = formData.date.split('-').map(Number);
      const dateToSave = new Date(year, month - 1, day, 12, 0, 0).toISOString();

      const payload = {
        title: formData.title,
        preacher: formData.preacher,
        date: dateToSave,
        bible_passage: formData.bible_passage,
        content: formData.content,
        user_id: user.id
      };

      if (id) {
        const { error } = await supabase
          .from('sermon_notes')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sermon_notes')
          .insert(payload);
        if (error) throw error;
      }

      navigate('/personal/spiritual/sermons');
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await supabase.from('sermon_notes').delete().eq('id', id);
      navigate('/personal/spiritual/sermons');
    } catch (err) {
      alert("Erro ao excluir.");
      setShowDeleteConfirm(false);
    } finally {
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
      
      {/* Header Fixo */}
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur-md border-b border-border px-6 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/personal/spiritual/sermons')}
            className="p-2 -ml-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-bold uppercase tracking-widest text-muted-foreground hidden md:block">
            {id ? 'Editando Anotação' : 'Nova Anotação'}
          </h1>
        </div>

        <div className="flex gap-2">
          {id && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Excluir"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#3E2723] hover:bg-black text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </header>

      {/* Área de Conteúdo */}
      <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 gap-6">
        
        {/* Bloco de Metadados */}
        <div className="flex-none bg-card p-6 rounded-[1.5rem] border border-border shadow-sm space-y-6">
          <div>
            <input 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Título da Mensagem..."
              className="w-full text-2xl md:text-3xl font-bold text-foreground placeholder-stone-300 outline-none bg-transparent"
              autoFocus={!id}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-50">
            <div className="group">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 group-focus-within:text-[#5D4037] transition-colors">
                <User size={12} /> Pregador
              </label>
              <input 
                value={formData.preacher}
                onChange={(e) => setFormData({...formData, preacher: e.target.value})}
                placeholder="Nome do pregador"
                className="w-full bg-secondary border-b border-transparent focus:border-[#A1887F] rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-all focus:bg-card"
              />
            </div>

            <div className="group">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 group-focus-within:text-[#5D4037] transition-colors">
                <Calendar size={12} /> Data
              </label>
              <input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-secondary border-b border-transparent focus:border-[#A1887F] rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-all focus:bg-card"
              />
            </div>

            <div className="group">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 group-focus-within:text-[#5D4037] transition-colors">
                <BookOpen size={12} /> Texto Base
              </label>
              <input 
                value={formData.bible_passage}
                onChange={(e) => setFormData({...formData, bible_passage: e.target.value})}
                placeholder="Ex: Romanos 8"
                className="w-full bg-secondary border-b border-transparent focus:border-[#A1887F] rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-all focus:bg-card"
              />
            </div>
          </div>
        </div>

        {/* Área de Texto Rico */}
        <div className="flex-1 flex flex-col bg-card rounded-[1.5rem] border border-border shadow-sm relative overflow-hidden min-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-full p-8 md:p-12 overflow-y-auto">
             <RichTextEditor 
                content={formData.content}
                onChange={(newMarkdown) => setFormData({...formData, content: newMarkdown})}
                placeholder="# Anotações\n\nEscreva os principais pontos da mensagem..."
             />
          </div>
        </div>

      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Anotação?"
        description="Tem certeza que deseja excluir esta pregação? Esta ação não pode ser desfeita."
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
}
