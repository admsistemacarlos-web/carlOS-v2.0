import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Save, Loader2, Trash2, Eye, PenTool, User, Book as BookIcon, Star, AlertTriangle, Check, Library } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { ImageUpload } from '../../../../shared/components/ui/ImageUpload';

export default function BookEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'write' | 'read'>('write');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    status: 'want_to_read',
    rating: 0,
    notes: '',
    cover_url: '',
    owned: false // Novo estado
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
            owned: data.owned || false // Carregar do banco
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
        owned: formData.owned, // Salvar
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FAF9F6]"><Loader2 className="animate-spin text-stone-400" /></div>;

  return (
    <div className="h-screen flex flex-col bg-[#FAF9F6] font-sans text-stone-800 animate-fade-in overflow-hidden">
      
      {/* Header */}
      <header className="flex-none w-full bg-[#FAF9F6] border-b border-stone-200 px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/personal/spiritual/books')} className="p-2 -ml-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-bold uppercase tracking-widest text-stone-500 hidden md:block">
            {id ? 'Editando Livro' : 'Novo Livro'}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode(mode === 'write' ? 'read' : 'write')}
            className="flex items-center gap-2 bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
          >
            {mode === 'write' ? <Eye size={16} /> : <PenTool size={16} />}
            <span className="hidden sm:inline">{mode === 'write' ? 'Ler' : 'Editar'}</span>
          </button>
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

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6 min-h-full">
          
          {/* Cartão de Metadados (Ficha do Livro) */}
          <div className="flex-none bg-white p-6 rounded-[1.5rem] border border-stone-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-stone-50 rounded-lg text-[#8D6E63]"><BookIcon size={20} /></div>
               <h2 className="text-lg font-bold text-stone-800">Ficha do Livro</h2>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Esquerda: Capa */}
              <div className="flex-none flex justify-center md:justify-start">
                <ImageUpload 
                  value={formData.cover_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, cover_url: url }))}
                />
              </div>

              {/* Direita: Campos */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Título</label>
                  <input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    placeholder="Título do livro" 
                    className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 transition-all text-stone-800 font-semibold" 
                    autoFocus={!id} 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Autor</label>
                  <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                      <input 
                        value={formData.author} 
                        onChange={(e) => setFormData({...formData, author: e.target.value})} 
                        placeholder="Nome do autor" 
                        className="flex h-12 w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 transition-all text-stone-800" 
                      />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Status de Leitura</label>
                  <select 
                      value={formData.status} 
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 transition-all text-stone-800 cursor-pointer appearance-none"
                  >
                      <option value="want_to_read">Quero Ler</option>
                      <option value="reading">Lendo Agora</option>
                      <option value="read">Leitura Concluída</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Avaliação</label>
                  <div className="flex h-12 items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-100">
                      {[1, 2, 3, 4, 5].map((star) => (
                          <button
                              key={star}
                              type="button"
                              onClick={() => setFormData({...formData, rating: star})}
                              className="transition-transform hover:scale-110 p-1"
                          >
                              <Star 
                                  size={24} 
                                  className={star <= formData.rating ? "fill-[#8D6E63] text-[#8D6E63]" : "text-stone-300 hover:text-stone-400"} 
                              />
                          </button>
                      ))}
                      <span className="ml-2 text-xs text-stone-400 font-bold uppercase tracking-widest">
                        {formData.rating > 0 ? `${formData.rating} Estrelas` : 'Sem nota'}
                      </span>
                  </div>
                </div>

                {/* Checkbox de Acervo */}
                <div className="space-y-2 md:col-span-2 pt-2">
                    <div 
                        onClick={() => setFormData(prev => ({...prev, owned: !prev.owned}))}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                            formData.owned 
                            ? 'bg-[#143d2d]/5 border-[#143d2d]/20' 
                            : 'bg-stone-50 border-stone-100 hover:bg-stone-100'
                        }`}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                            formData.owned ? 'bg-[#143d2d] border-[#143d2d]' : 'bg-white border-stone-300'
                        }`}>
                            {formData.owned && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${formData.owned ? 'text-[#143d2d]' : 'text-stone-600'}`}>Tenho este livro</p>
                            <p className="text-xs text-stone-400">Marque se você possui o exemplar físico ou digital.</p>
                        </div>
                    </div>
                </div>

              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white rounded-[1.5rem] border border-stone-100 shadow-sm relative overflow-hidden min-h-[500px]">
            <div className="absolute top-0 left-8 bottom-0 w-px bg-stone-50 hidden md:block h-full pointer-events-none"></div>
            {mode === 'write' ? (
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="# Resumo & Anotações\n\nEscreva aqui seus aprendizados sobre o livro..."
                className="flex-1 w-full h-full resize-none outline-none text-lg text-stone-700 leading-relaxed bg-transparent placeholder-stone-300 p-8 md:pl-16 border-none focus:ring-0 font-sans"
                spellCheck={false}
              />
            ) : (
              <div className="flex-1 w-full h-full overflow-y-auto p-8 md:pl-16 prose prose-stone prose-lg max-w-none">
                {formData.notes ? <ReactMarkdown>{formData.notes}</ReactMarkdown> : <p className="text-stone-300 italic">Nenhuma anotação.</p>}
              </div>
            )}
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
              <h2 className="text-lg font-bold text-stone-800 mb-2">Excluir livro?</h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-6">
                Esta ação não pode ser desfeita. O livro e suas anotações serão removidos.
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