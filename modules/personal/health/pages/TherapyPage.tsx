
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Brain, Calendar, User, ChevronDown, Clock, Archive, Trash2, AlertTriangle, Loader2, MessageCircle, ArrowRight } from 'lucide-react';
import { useHealth } from '../hooks/useHealth';
import { formatDateBr } from '../../finance/utils/dateHelpers';

interface TherapySession {
  id: string;
  date: string;
  professional: string;
  type: string;
  notes: string;
  insights: string;
  next_appointment?: string;
}

interface TherapySectionProps {
    title: string;
    icon: React.ReactNode;
    count: number;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

// Componente de Seção (Accordion - Estilo Forest Flat)
const TherapySection: React.FC<TherapySectionProps> = ({ 
    title, 
    icon, 
    count, 
    children, 
    defaultOpen = false 
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (count === 0) return null;

    return (
        <div className="w-full animate-fade-in mb-4">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors group select-none shadow-sm"
            >
                <div className="flex items-center gap-3 text-stone-600">
                    <div className="text-[#143d2d]">
                        {icon}
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
                    <span className="bg-stone-100 px-2 py-0.5 rounded-md text-[10px] font-bold border border-stone-200 text-stone-400">
                        {count}
                    </span>
                </div>
                <ChevronDown 
                    size={20} 
                    className={`text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {isOpen && (
                <div className="pt-4 pb-2 pl-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};

export default function TherapyPage() {
  const navigate = useNavigate();
  const { data: sessions, loading, fetchData, deleteItem } = useHealth<TherapySession>('health_therapy_sessions');
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Lógica de Agrupamento por Data (30 dias)
  const { recent, archived } = sessions.reduce((acc, session) => {
    const sessionDate = new Date(session.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (sessionDate >= thirtyDaysAgo) {
      acc.recent.push(session);
    } else {
      acc.archived.push(session);
    }
    return acc;
  }, { recent: [] as TherapySession[], archived: [] as TherapySession[] });

  const handleDeleteRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
        await deleteItem(deleteId);
        setIsDeleteOpen(false);
        setDeleteId(null);
    } catch (error) {
        console.error("Erro ao excluir", error);
    } finally {
        setIsDeleting(false);
    }
  };

  const TherapyCard: React.FC<{ session: TherapySession }> = ({ session }) => {
    const nextAppt = session.next_appointment ? new Date(session.next_appointment) : null;
    const isFuture = nextAppt && nextAppt > new Date();

    return (
        <div 
            onClick={() => navigate(`/personal/health/therapy/${session.id}`)}
            className="bg-white p-6 rounded-[1.5rem] border border-stone-200 shadow-sm hover:shadow-md hover:border-[#143d2d]/30 hover:-translate-y-0.5 transition-all group flex flex-col h-full cursor-pointer relative"
        >
            <div className="flex justify-between items-start mb-4">
                <span className="bg-stone-100 border border-stone-200 text-[#143d2d] text-[10px] font-bold uppercase px-3 py-1 rounded-md tracking-wider flex items-center gap-1">
                    <Calendar size={10} />
                    {formatDateBr(session.date)}
                </span>
                <button 
                    onClick={(e) => handleDeleteRequest(session.id, e)} 
                    className="p-2 bg-white rounded-full hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors shadow-sm border border-stone-100 opacity-0 group-hover:opacity-100 absolute top-6 right-6"
                    title="Excluir sessão"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            
            <div className="flex items-center gap-2 mb-4 text-stone-600">
                <User size={16} className="text-[#143d2d]" />
                <h3 className="font-bold text-sm text-stone-800">{session.professional || 'Profissional'}</h3>
            </div>
            
            {/* Insights Preview */}
            <div className="flex-1 bg-stone-50 border border-stone-100 rounded-xl p-4 relative overflow-hidden mb-4">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#143d2d]">
                    <Brain size={12} /> Insights
                </div>
                <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">
                    {session.insights || 'Sem insights registrados.'}
                </p>
            </div>

            {/* Next Appointment Badge if exists */}
            {isFuture && nextAppt && (
                <div className="flex items-center justify-between bg-[#143d2d]/5 px-3 py-2 rounded-lg border border-[#143d2d]/10">
                    <span className="text-[10px] font-bold uppercase text-[#143d2d]">Próxima Sessão</span>
                    <span className="text-xs font-bold text-[#143d2d] flex items-center gap-1">
                        {nextAppt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} <Clock size={10} />
                    </span>
                </div>
            )}

            <div className="mt-4 flex justify-end">
                <span className="text-[#143d2d] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver Detalhes <ArrowRight size={10} />
                </span>
            </div>
        </div>
    );
  };

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans bg-transparent">
      
      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <button onClick={() => navigate('/personal/health')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-[#143d2d] transition-colors mb-4">
            <ArrowLeft size={14} /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight flex items-center gap-3">
            <Brain className="text-[#143d2d]" /> Minhas Terapias
          </h1>
        </div>
        <button onClick={() => navigate('/personal/health/therapy/new')} className="bg-[#143d2d] hover:bg-[#0f2e22] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm transition-all active:scale-95">
          <Plus size={18} /> Nova Sessão
        </button>
      </div>

      {/* Content */}
      <div className="px-8 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#143d2d]" size={32} /></div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
            <Brain className="mx-auto text-stone-300 mb-3" size={32} />
            <p className="text-stone-400">Nenhuma sessão registrada.</p>
            <button onClick={() => navigate('/personal/health/therapy/new')} className="text-[#143d2d] font-bold text-xs uppercase tracking-widest mt-2 hover:underline">Registrar Primeira</button>
          </div>
        ) : (
          <>
            <TherapySection 
                title="Sessões Recentes" 
                icon={<Clock size={20} />} 
                count={recent.length} 
                defaultOpen={true}
            >
                {recent.map(s => <TherapyCard key={s.id} session={s} />)}
            </TherapySection>

            <TherapySection 
                title="Arquivo" 
                icon={<Archive size={20} />} 
                count={archived.length} 
                defaultOpen={false}
            >
                {archived.map(s => <TherapyCard key={s.id} session={s} />)}
            </TherapySection>
          </>
        )}
      </div>

      {/* Delete Modal */}
      {isDeleteOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#1c1917]/20 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsDeleteOpen(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-[1.5rem] shadow-2xl p-6 animate-fade-in border border-stone-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-lg font-bold text-stone-800 mb-2">Excluir sessão?</h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-6">
                Essa ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsDeleteOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-red-700 hover:bg-red-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
