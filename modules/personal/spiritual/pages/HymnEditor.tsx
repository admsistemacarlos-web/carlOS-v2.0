
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Trash2, Mic2, Link as LinkIcon, Music, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';

export default function HymnEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    link: '',
    lyrics: '',
    notes: ''
  });

  useEffect(() => {
    if (!id || !user) return;
    const fetchHymn = async () => {
      try {
        const { data, error } = await supabase.from('spiritual_hymns').select('*').eq('id', id).single();
        if (error) throw error;
        if (data) {
          setFormData({
            title: data.title,
            artist: data.artist || '',
            link: data.link || '',
            lyrics: data.lyrics || '',
            notes: data.notes || ''
          });
        }
      } catch (err) {
        alert('Erro ao carregar hino.');
        navigate('/personal/spiritual/hymns');
      } finally {
        setLoading(false);
      }
    };
    fetchHymn();
  }, [id, user, navigate]);

  const handleSave = async () => {
    if (!formData.title.trim()) return alert("O título é obrigatório.");
    if (!user) return;

    setSaving(true);
    try {
      const payload = { ...formData, user_id: user.id };
      if (id) {
        await supabase.from('spiritual_hymns').update(payload).eq('id', id);
      } else {
        await supabase.from('spiritual_hymns').insert(payload);
      }
      navigate('/personal/spiritual/hymns');
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
      await supabase.from('spiritual_hymns').delete().eq('id', id);
      navigate('/personal/spiritual/hymns');
    } catch (err) {
      alert("Erro ao excluir.");
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FAF9F6]"><Loader2 className="animate-spin text-stone-400" /></div>;

  return (
    <div className="h-screen flex flex-col bg-[#FAF9F6] font-sans text-stone-800 animate-fade-in overflow-hidden">
      
      {/* 1. Header Fixo */}
      <header className="flex-none w-full bg-[#FAF9F6] border-b border-stone-200 px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/personal/spiritual/hymns')} className="p-2 -ml-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-bold uppercase tracking-widest text-stone-500 hidden md:block">
            {id ? 'Editando Hino' : 'Novo Hino'}
          </h1>
        </div>
        <div className="flex gap-2">
          {id && (
            <button 
              onClick={() => setIsDeleteOpen(true)}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-[#3E2723] hover:bg-black text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </header>

      {/* 2. Conteúdo Rolável */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6 min-h-full">
          
          {/* Metadados */}
          <div className="flex-none bg-white p-6 rounded-[1.5rem] border border-stone-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-stone-50 rounded-lg text-[#8D6E63]"><Music size={20} /></div>
               <h2 className="text-lg font-bold text-stone-800">Detalhes da Canção</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Título</label>
                <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Ex: Amazing Grace" className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 transition-all text-stone-800" autoFocus={!id} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Artista / Autor</label>
                <div className="relative">
                    <Mic2 className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input value={formData.artist} onChange={(e) => setFormData({...formData, artist: e.target.value})} placeholder="Ex: Hillsong United" className="flex h-12 w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 transition-all text-stone-800" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Link (YouTube/Spotify)</label>
                <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} placeholder="https://..." className="flex h-12 w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 transition-all text-stone-800" />
                </div>
              </div>
            </div>
          </div>

          {/* Área de Letra (Monoespaçada ou Serifada) */}
          <div className="flex-1 flex flex-col bg-white rounded-[1.5rem] border border-stone-100 shadow-sm relative overflow-hidden min-h-[500px]">
            <div className="p-4 border-b border-stone-50 bg-stone-50/30 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Letra / Cifra</span>
            </div>
            <textarea 
              value={formData.lyrics}
              onChange={(e) => setFormData({...formData, lyrics: e.target.value})}
              placeholder="Cole a letra ou cifra aqui..."
              className="flex-1 w-full h-full resize-none outline-none text-base text-stone-700 font-mono leading-relaxed bg-transparent placeholder-stone-300 p-8 border-none focus:ring-0 whitespace-pre"
              spellCheck={false}
            />
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm transition-opacity" 
            onClick={() => !isDeleting && setIsDeleteOpen(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 animate-fade-in border border-stone-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-lg font-bold text-stone-800 mb-2">Excluir este hino?</h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-6">
                Esta ação não pode ser desfeita. O hino será removido permanentemente da sua coleção.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
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
