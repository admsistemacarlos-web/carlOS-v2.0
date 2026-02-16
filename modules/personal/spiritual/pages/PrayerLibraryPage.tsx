
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Feather, BookOpen, Loader2, Trash2, Quote, AlertTriangle, ChevronDown, Star, Library } from 'lucide-react';
import { useSpiritual } from '../hooks/useSpiritual';

interface PrayerModel {
  id: string;
  title: string;
  reference: string;
  content: string;
}

interface PrayerSectionProps {
    title: string;
    icon: React.ReactNode;
    count: number;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

// Componente de Seção (Accordion)
const PrayerSection: React.FC<PrayerSectionProps> = ({ 
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
                className="w-full flex items-center justify-between p-4 bg-secondary border border-border/50 rounded-xl hover:bg-secondary transition-colors group select-none"
            >
                <div className="flex items-center gap-3 text-muted-foreground">
                    {icon}
                    <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
                    <span className="bg-card px-2 py-0.5 rounded-md text-[10px] font-bold border border-border text-muted-foreground">
                        {count}
                    </span>
                </div>
                <ChevronDown 
                    size={20} 
                    className={`text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
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

export default function PrayerLibraryPage() {
  const navigate = useNavigate();
  const { data: prayers, loading, fetchData, deleteItem } = useSpiritual<PrayerModel>('prayer_models');
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lógica de Agrupamento (Top 5 vs Resto)
  const recentPrayers = prayers.slice(0, 5);
  const libraryPrayers = prayers.slice(5);

  const handleDeleteRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteItem(deleteId);
    setIsDeleting(false);
    setIsDeleteOpen(false);
    setDeleteId(null);
  };

  const PrayerCard: React.FC<{ prayer: PrayerModel }> = ({ prayer }) => (
    <div 
        key={prayer.id} 
        onClick={() => navigate(`/personal/spiritual/prayers/${prayer.id}`)}
        className="bg-card p-8 rounded-[2rem] border border-border shadow-sm hover:shadow-xl hover:border-[#D7CCC8] hover:-translate-y-1 transition-all group flex flex-col h-full cursor-pointer relative"
    >
        <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-secondary rounded-2xl text-[#8D6E63]">
            <Quote size={20} />
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6">
            <button 
            onClick={(e) => handleDeleteRequest(prayer.id, e)} 
            className="p-2 bg-card rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shadow-sm border border-border"
            title="Excluir"
            >
            <Trash2 size={14} />
            </button>
        </div>
        </div>
        
        <h3 className="text-xl font-serif italic font-bold text-foreground mb-2 line-clamp-2 leading-tight">
        {prayer.title}
        </h3>
        
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5D4037] mb-4">
        <span className="w-4 h-px bg-[#5D4037]"></span>
        {prayer.reference || 'Autor Desconhecido'}
        </div>
        
        <div className="flex-1 text-sm text-muted-foreground leading-relaxed line-clamp-4 relative overflow-hidden font-serif">
        {prayer.content}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-50 flex justify-end">
            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 group-hover:text-[#5D4037] transition-colors">
            Ler Oração <BookOpen size={10} />
            </span>
        </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans bg-card">
      
      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <button onClick={() => navigate('/personal/spiritual')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-muted-foreground transition-colors mb-4">
            <ArrowLeft size={14} /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Feather className="text-[#5D4037]" /> Biblioteca de Orações
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Modelos bíblicos e teológicos para inspiração.</p>
        </div>
        <button onClick={() => navigate('/personal/spiritual/prayers/new')} className="bg-[#3E2723] hover:bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg transition-all active:scale-95">
          <Plus size={18} /> Nova Oração
        </button>
      </div>

      {/* Content */}
      <div className="px-8 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={32} /></div>
        ) : prayers.length === 0 ? (
          <div className="text-center py-20 bg-secondary rounded-[2rem] border border-dashed border-border">
            <Quote className="mx-auto text-muted-foreground mb-3" size={32} />
            <p className="text-muted-foreground">Sua biblioteca de orações está vazia.</p>
            <button onClick={() => navigate('/personal/spiritual/prayers/new')} className="text-[#5D4037] font-bold text-xs uppercase tracking-widest mt-2 hover:underline">Adicionar Primeiro Modelo</button>
          </div>
        ) : (
          <>
            <PrayerSection title="Destaques / Recentes" icon={<Star size={20} />} count={recentPrayers.length} defaultOpen={true}>
                {recentPrayers.map(prayer => <PrayerCard key={prayer.id} prayer={prayer} />)}
            </PrayerSection>

            <PrayerSection title="Biblioteca Completa" icon={<Library size={20} />} count={libraryPrayers.length} defaultOpen={false}>
                {libraryPrayers.map(prayer => <PrayerCard key={prayer.id} prayer={prayer} />)}
            </PrayerSection>
          </>
        )}
      </div>

      {/* AlertDialog de Exclusão */}
      {isDeleteOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#3E2723]/20 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsDeleteOpen(false)}
          />
          <div className="relative bg-card w-full max-w-sm rounded-[1.5rem] shadow-2xl p-6 animate-fade-in border border-border">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Excluir oração?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                O modelo será removido permanentemente da sua biblioteca.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsDeleteOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground bg-secondary hover:bg-accent transition-colors"
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
