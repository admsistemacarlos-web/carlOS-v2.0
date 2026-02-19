import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Trash2, Feather, Quote } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import RichTextEditor from '../../../../shared/components/ui/RichTextEditor';

export default function PrayerEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const saveTimeoutRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    reference: '',
    content: ''
  });

  useEffect(() => {
    if (!id || !user) return;
    const fetchPrayer = async () => {
      try {
        const { data, error } = await supabase
          .from('prayer_models')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (data) {
          setFormData({
            title: data.title,
            reference: data.reference || '',
            content: data.content || ''
          });
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao carregar oração.');
        navigate('/personal/spiritual/prayers');
      } finally {
        setLoading(false);
      }
    };
    fetchPrayer();
  }, [id, user, navigate]);

  const handleContentChange = (newMarkdown: string) => {
    setFormData(prev => ({ ...prev, content: newMarkdown }));

    if (!id) return;

    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await supabase
        .from('prayer_models')
        .update({ content: newMarkdown })
        .eq('id', id);
      setIsSaving(false);
    }, 1000);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return alert("O título/tema é obrigatório.");
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        reference: formData.reference,
        content: formData.content,
        user_id: user.id
      };

      if (id) {
        const { error } = await supabase.from('prayer_models').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('prayer_models').insert(payload);
        if (error) throw error;
      }

      navigate('/personal/spiritual/prayers');
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Tem certeza que deseja excluir este modelo de oração?")) return;
    try {
      await supabase.from('prayer_models').delete().eq('id', id);
      navigate('/personal/spiritual/prayers');
    } catch (err) {
      alert("Erro ao excluir.");
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

      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur-md border-b border-border px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/personal/spiritual/prayers')}
            className="p-2 -ml-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-muted-foreground hidden md:block">
              {id ? 'Editando Modelo' : 'Novo Modelo de Oração'}
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
              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
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

      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6 min-h-full">

          <div className="flex-none bg-card p-6 rounded-[1.5rem] border border-border shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-secondary rounded-lg text-[#8D6E63]">
                <Feather size={20} />
              </div>
              <h2 className="text-lg font-bold text-foreground">Dados da Oração</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Título do Modelo
                </label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Oração de Arrependimento"
                  className="flex h-12 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all text-foreground"
                  autoFocus={!id}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Referência / Fonte
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Quote size={16} />
                  </div>
                  <input
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    placeholder="Ex: Salmo 51, Agostinho, etc."
                    className="flex h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-card rounded-[1.5rem] border border-border shadow-sm relative overflow-hidden min-h-[500px]">
            <div className="absolute top-0 left-8 bottom-0 w-px bg-secondary hidden md:block h-full pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full p-8 md:pl-16 overflow-y-auto">
              <RichTextEditor
                key={id}
                content={formData.content}
                onChange={handleContentChange}
                placeholder="# Oração&#10;&#10;Escreva aqui o texto da oração..."
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}