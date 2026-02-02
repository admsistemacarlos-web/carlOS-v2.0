
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Save, Calendar, User, Loader2, Trash2, Eye, PenTool, Activity, Brain, Clock, CheckSquare } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { ConfirmModal } from '../../../../shared/components/ui/ConfirmModal';

export default function TherapyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'write' | 'read'>('write'); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Inicialização Correta: HOJE (Local Time YYYY-MM-DD)
  const getToday = () => new Date().toLocaleDateString('en-CA');

  const [formData, setFormData] = useState({
    date: getToday(),
    professional: '',
    type: 'psychologist',
    notes: '',
    insights: '',
    next_appointment: '',
    action_items: ''
  });

  useEffect(() => {
    if (!id || !user) return;

    const fetchSession = async () => {
      try {
        const { data, error } = await supabase
          .from('health_therapy_sessions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setFormData({
            date: new Date(data.date).toISOString().split('T')[0],
            professional: data.professional || '',
            type: data.type || 'psychologist',
            notes: data.notes || '',
            insights: data.insights || '',
            next_appointment: data.next_appointment ? new Date(data.next_appointment).toISOString().slice(0, 16) : '', 
            action_items: data.action_items || ''
          });
        }
      } catch (err) {
        alert('Erro ao carregar sessão.');
        navigate('/personal/health/therapy');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id, user, navigate]);

  const handleSave = async () => {
    if (!formData.professional.trim()) return alert("Nome do profissional obrigatório.");
    if (!user) return;

    setSaving(true);
    try {
      // FIX: Data ancorada no meio-dia para evitar problemas de fuso horário
      const [year, month, day] = formData.date.split('-').map(Number);
      const dateToSave = new Date(year, month - 1, day, 12, 0, 0).toISOString();

      const payload = {
        ...formData,
        date: dateToSave,
        next_appointment: formData.next_appointment ? new Date(formData.next_appointment).toISOString() : null,
        user_id: user.id
      };

      if (id) {
        await supabase.from('health_therapy_sessions').update(payload).eq('id', id);
      } else {
        await supabase.from('health_therapy_sessions').insert(payload);
      }

      navigate('/personal/health/therapy');
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await supabase.from('health_therapy_sessions').delete().eq('id', id);
      navigate('/personal/health/therapy');
    } catch (err) {
      alert("Erro ao excluir.");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="animate-spin text-[#143d2d]" size={32} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-transparent font-sans text-stone-800 animate-fade-in overflow-hidden">
      
      {/* Header Fixo */}
      <header className="flex-none w-full bg-transparent border-b border-stone-200 px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/personal/health/therapy')}
            className="p-2 -ml-2 hover:bg-stone-200 rounded-full text-stone-500 hover:text-[#143d2d] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-bold uppercase tracking-widest text-stone-500 hidden md:block">
            {id ? 'Editando Sessão' : 'Nova Sessão'}
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
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#143d2d] hover:bg-[#0f2e22] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Rolável */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6 min-h-full">
          
          {/* Cartão de Metadados */}
          <div className="flex-none bg-white p-6 rounded-[1.5rem] border border-stone-200 shadow-sm space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#143d2d] mb-1">
                  <User size={12} /> Profissional
                </label>
                <input 
                  value={formData.professional}
                  onChange={(e) => setFormData({...formData, professional: e.target.value})}
                  placeholder="Ex: Dra. Ana"
                  className="w-full bg-stone-50 border-b border-stone-200 focus:border-[#143d2d] rounded-lg px-3 py-2 text-sm text-stone-700 outline-none transition-all"
                  autoFocus={!id}
                />
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#143d2d] mb-1">
                  <Calendar size={12} /> Data Sessão
                </label>
                <input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-stone-50 border-b border-stone-200 focus:border-[#143d2d] rounded-lg px-3 py-2 text-sm text-stone-700 outline-none transition-all"
                />
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#143d2d] mb-1">
                  <Activity size={12} /> Tipo
                </label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-stone-50 border-b border-stone-200 focus:border-[#143d2d] rounded-lg px-3 py-2 text-sm text-stone-700 outline-none transition-all cursor-pointer appearance-none"
                >
                    <option value="psychologist">Psicólogo(a)</option>
                    <option value="psychiatrist">Psiquiatra</option>
                    <option value="psychoanalyst">Psicanalista</option>
                    <option value="other">Outro</option>
                </select>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#143d2d] mb-1">
                  <Clock size={12} /> Próxima Consulta
                </label>
                <input 
                  type="datetime-local"
                  value={formData.next_appointment}
                  onChange={(e) => setFormData({...formData, next_appointment: e.target.value})}
                  className="w-full bg-stone-50 border-b border-stone-200 focus:border-[#143d2d] rounded-lg px-3 py-2 text-sm text-stone-700 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#143d2d] mb-2">
                        <Brain size={14} /> Insights Chave
                    </label>
                    <textarea 
                        value={formData.insights}
                        onChange={(e) => setFormData({...formData, insights: e.target.value})}
                        placeholder="Quais foram os pontos altos?"
                        rows={3}
                        className="w-full bg-transparent border-none p-0 text-sm text-stone-700 placeholder-stone-400 outline-none resize-none leading-relaxed"
                    />
                </div>
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#143d2d] mb-2">
                        <CheckSquare size={14} /> Tarefas de Casa
                    </label>
                    <textarea 
                        value={formData.action_items}
                        onChange={(e) => setFormData({...formData, action_items: e.target.value})}
                        placeholder="O que preciso fazer até a próxima sessão?"
                        rows={3}
                        className="w-full bg-transparent border-none p-0 text-sm text-stone-700 placeholder-stone-400 outline-none resize-none leading-relaxed"
                    />
                </div>
            </div>
          </div>

          {/* Área de Texto Principal */}
          <div className="flex-1 flex flex-col bg-white rounded-[1.5rem] border border-stone-200 shadow-sm relative overflow-hidden min-h-[500px]">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#143d2d]/10 hidden md:block h-full"></div>
            
            {mode === 'write' ? (
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="# Detalhes da Sessão\n\nDescreva como foi a conversa, sentimentos e tópicos abordados..."
                className="flex-1 w-full h-full resize-none outline-none text-lg text-stone-700 leading-relaxed bg-transparent placeholder-stone-300 p-8 md:pl-12 border-none focus:ring-0 font-sans"
                spellCheck={false}
              />
            ) : (
              <div className="flex-1 w-full h-full overflow-y-auto p-8 md:pl-12 prose prose-stone prose-lg max-w-none prose-headings:text-[#143d2d] prose-a:text-[#143d2d]">
                {formData.notes ? (
                  <ReactMarkdown>
                    {formData.notes}
                  </ReactMarkdown>
                ) : (
                  <p className="text-stone-300 italic">Nenhuma anotação detalhada.</p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Sessão?"
        description="Tem certeza que deseja excluir esta sessão de terapia? Esta ação não pode ser desfeita."
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
}
