import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Trash2, User, Book as BookIcon, Star, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { ImageUpload } from '../../../../shared/components/ui/ImageUpload';
import RichTextEditor from '../../../../shared/components/ui/RichTextEditor';

export default function BookEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const saveTimeoutRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    status: 'want_to_read',
    rating: 0,
    notes: '',
    cover_url: '',
    owned: false
  });

  useEffect(() => {
    if (!id || !user) return;
    const fetchBook = async () => {
      try {
        const { data, error } = await supabase.from('spiritual_books').select('*').eq('id', id).single();
        if (error) throw error;
        if (data) {
          setFormData({
            title: data.title,
            author: data.author || '',
            status: data.status,
            rating: data.rating || 0,
            notes: data.notes || '',
            cover_url: data.cover_url || '',
            owned: data.owned || false
          });
        }
      } catch (err) {
        alert('Erro ao carregar livro.');
        navigate('/personal/spiritual/books');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id, user, navigate]);

  const handleNotesChange = (newMarkdown: string) => {
    setFormData(prev => ({ ...prev, notes: newMarkdown }));

    if (!id) return;

    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await supabase.from('spiritual_books').update({ notes: newMarkdown }).eq('id', id);
      setIsSaving(false);
    }, 1000);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return alert("O título é obrigatório.");
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        author: formData.author,
        status: formData.status,
        rating: formData.rating,
        notes: formData.notes,
        cover_url: formData.cover_url,
        owned: formData.owned,
        user_id: user.id
      };

      if (id) {
        await supabase.from('spiritual_books').update(payload).eq('id', id);
      } else {
        await supabase.from('spiritual_books').insert(payload);
      }
      navigate('/personal/spiritual/books');
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await supabase.from('spiritual_books').delete().eq('id', id);
      navigate('/personal/spiritual/books');
    } catch (err) {
      alert("Erro ao excluir.");
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-card"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="h-screen flex flex-col bg-card font-sans text-foreground animate-fade-in overflow-hidden">

      <header className="flex-none w-full bg-card border-b border-border px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/personal/spiritual/books')} className="p-2 -ml-2 hover:bg-accent rounded-full text-muted-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-muted-foreground hidden md:block">
              {id ? 'Editando Livro' : 'Novo Livro'}
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
            <button onClick={() => setIsDeleteOpen(true)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
              <Trash2 size={20} />
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-[#3E2723] hover:bg-black text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6 min-h-full">

          <div className="flex-none bg-card p-6 rounded-[1.5rem] border border-border shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-secondary rounded-lg text-[#8D6E63]"><BookIcon size={20} /></div>
              <h2 className="text-lg font-bold text-foreground">Ficha do Livro</h2>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-none flex justify-center md:justify-start">
                <ImageUpload
                  value={formData.cover_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, cover_url: url }))}
                />
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Título</label>
                  <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Título do livro" className="flex h-12 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 transition-all text-foreground font-semibold" autoFocus={!id} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Autor</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} placeholder="Nome do autor" className="flex h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 transition-all text-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Status de Leitura</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="flex h-12 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 transition-all text-foreground cursor-pointer appearance-none">
                    <option value="want_to_read">Quero Ler</option>
                    <option value="reading">Lendo Agora</option>
                    <option value="read">Leitura Concluída</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Avaliação</label>
                  <div className="flex h-12 items-center gap-2 p-2 bg-secondary rounded-xl border border-border">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setFormData({...formData, rating: star})} className="transition-transform hover:scale-110 p-1">
                        <Star size={24} className={star <= formData.rating ? "fill-[#8D6E63] text-[#8D6E63]" : "text-muted-foreground"} />
                      </button>
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                      {formData.rating > 0 ? `${formData.rating} Estrelas` : 'Sem nota'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2 pt-2">
                  <div
                    onClick={() => setFormData(prev => ({...prev, owned: !prev.owned}))}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${formData.owned ? 'bg-primary/5 border-primary/20' : 'bg-secondary border-border hover:bg-secondary'}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${formData.owned ? 'bg-primary border-primary' : 'bg-card border-border'}`}>
                      {formData.owned && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${formData.owned ? 'text-primary' : 'text-muted-foreground'}`}>Tenho este livro</p>
                      <p className="text-xs text-muted-foreground">Marque se você possui o exemplar físico ou digital.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-card rounded-[1.5rem] border border-border shadow-sm relative overflow-hidden min-h-[500px]">
            <div className="absolute top-0 left-8 bottom-0 w-px bg-secondary hidden md:block h-full pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full p-8 md:pl-16 overflow-y-auto">
              <RichTextEditor
                key={id}
                content={formData.notes}
                onChange={handleNotesChange}
                placeholder="# Resumo &amp; Anotações&#10;&#10;Escreva aqui seus aprendizados sobre o livro..."
              />
            </div>
          </div>

        </div>
      </div>

      {isDeleteOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm transition-opacity" onClick={() => !isDeleting && setIsDeleteOpen(false)} />
          <div className="relative bg-card w-full max-w-sm rounded-[2rem] shadow-2xl p-6 animate-fade-in border border-border">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Excluir livro?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Esta ação não pode ser desfeita. O livro e suas anotações serão removidos.
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setIsDeleteOpen(false)} disabled={isDeleting} className="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground bg-secondary hover:bg-accent transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}