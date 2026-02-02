
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Save, Loader2, Trash2, Eye, PenTool, Feather, Quote } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';

export default function PrayerEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'write' | 'read'>('write'); 
  
  const [formData, setFormData] = useState({
    title: '',
    reference: '',
    content: ''
  });

  // Carregar dados se for edição
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
        const { error } = await supabase
          .from('prayer_models')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('prayer_models')
          .insert(payload);
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
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-400" size={32} />
      </div>
    );
  }

  return (
    // 1. Container Principal: h-screen trava a altura na janela, flex-col organiza verticalmente, overflow-hidden impede scroll externo
    <div className="h-screen flex flex-col bg-[#FAF9F6] font-sans text-stone-800 animate-fade-in overflow-hidden">
      
      {/* 2. Cabeçalho: flex-none garante que ele não encolha nem cresça, ocupando seu espaço natural */}
      <header className="flex-none w-full bg-[#FAF9F6] border-b border-stone-200 px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/personal/spiritual/prayers')}
            className="p-2 -ml-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-bold uppercase tracking-widest text-stone-500 hidden md:block">
            {id ? 'Editando Modelo' : 'Novo Modelo de Oração'}
          </h1>
        </div>

        <div className="flex gap-2">
          {/* Toggle Visualizar/Editar */}
          <button
            onClick={() => setMode(mode === 'write' ? 'read' : 'write')}
            className="flex items-center gap-2 bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
            title={mode === 'write' ? "Visualizar Leitura" : "Voltar a Editar"}
          >
            {mode === 'write' ? <Eye size={16} /> : <PenTool size={16} />}
            <span className="hidden sm:inline">{mode === 'write' ? 'Ler' : 'Editar'}</span>
          </button>

          {id && (
            <button 
              onClick={handleDelete}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
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

      {/* 3. Área de Conteúdo: flex-1 ocupa todo o espaço restante e overflow-y-auto permite scroll apenas aqui */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6 min-h-full">
          
          {/* Metadados (Formulário Estruturado) */}
          <div className="flex-none bg-white p-6 rounded-[1.5rem] border border-stone-100 shadow-sm space-y-4">
            
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-stone-50 rounded-lg text-[#8D6E63]">
                  <Feather size={20} />
               </div>
               <h2 className="text-lg font-bold text-stone-800">Dados da Oração</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campo 1: Título */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">
                  Título do Modelo
                </label>
                <input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Oração de Arrependimento"
                  className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm ring-offset-white placeholder:text-stone-400 focus-visible:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all text-stone-800"
                  autoFocus={!id}
                />
              </div>

              {/* Campo 2: Referência */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">
                  Referência / Fonte
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                    <Quote size={16} />
                  </div>
                  <input 
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    placeholder="Ex: Salmo 51, Agostinho, etc."
                    className="flex h-12 w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-sm ring-offset-white placeholder:text-stone-400 focus-visible:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all text-stone-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Área de Texto Principal (Papel) */}
          <div className="flex-1 flex flex-col bg-white rounded-[1.5rem] border border-stone-100 shadow-sm relative overflow-hidden min-h-[500px]">
            {/* Linhas decorativas sutis na lateral */}
            <div className="absolute top-0 left-8 bottom-0 w-px bg-stone-50 hidden md:block h-full pointer-events-none"></div>
            
            {mode === 'write' ? (
              <textarea 
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="# Oração\n\nEscreva aqui o texto da oração..."
                className="flex-1 w-full h-full resize-none outline-none text-lg text-stone-700 font-serif leading-loose bg-transparent placeholder-stone-300 p-8 md:pl-16 border-none focus:ring-0"
                spellCheck={false}
              />
            ) : (
              <div className="flex-1 w-full h-full overflow-y-auto p-8 md:pl-16 prose prose-stone prose-lg max-w-none font-serif leading-loose">
                {formData.content ? (
                  <ReactMarkdown>
                    {formData.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-stone-300 italic text-center mt-20">Nenhuma oração escrita para visualizar.</p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
