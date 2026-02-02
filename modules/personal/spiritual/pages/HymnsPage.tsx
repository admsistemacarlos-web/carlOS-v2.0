
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Music, Mic2, Loader2, PlayCircle, Trash2, AlertTriangle, ChevronDown, Star, Library } from 'lucide-react';
import { useSpiritual } from '../hooks/useSpiritual';

interface Hymn {
  id: string;
  title: string;
  artist: string;
  lyrics: string;
  link?: string;
}

interface HymnSectionProps {
    title: string;
    icon: React.ReactNode;
    count: number;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

// Componente de Seção (Accordion)
const HymnSection: React.FC<HymnSectionProps> = ({ 
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
                className="w-full flex items-center justify-between p-4 bg-stone-50 border border-stone-200/50 rounded-xl hover:bg-stone-100 transition-colors group select-none"
            >
                <div className="flex items-center gap-3 text-stone-600">
                    {icon}
                    <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
                    <span className="bg-white px-2 py-0.5 rounded-md text-[10px] font-bold border border-stone-200 text-stone-400">
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

export default function HymnsPage() {
  const navigate = useNavigate();
  const { data: hymns, loading, fetchData, deleteItem } = useSpiritual<Hymn>('spiritual_hymns');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Lógica de Agrupamento (Top 5 vs Resto)
  const recentHymns = hymns.slice(0, 5);
  const libraryHymns = hymns.slice(5);

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

  const HymnCard: React.FC<{ hymn: Hymn }> = ({ hymn }) => (
    <div 
        key={hymn.id} 
        onClick={() => navigate(`/personal/spiritual/hymns/${hymn.id}`)}
        className="bg-white p-6 rounded-[2rem] border border-[#E6E2DE] shadow-sm hover:shadow-xl hover:border-[#D7CCC8] hover:-translate-y-1 transition-all group flex flex-col cursor-pointer relative"
    >
        <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-stone-50 rounded-full text-stone-400 group-hover:text-[#5D4037] transition-colors">
            <Music size={20} />
            </div>
            
            <div className="flex gap-2">
            {hymn.link && (
                <a 
                href={hymn.link} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-stone-300 hover:text-red-500 transition-colors p-1"
                title="Ouvir"
                >
                    <PlayCircle size={22} />
                </a>
            )}
            <button 
                onClick={(e) => handleDeleteRequest(hymn.id, e)}
                className="text-stone-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                title="Excluir"
            >
                <Trash2 size={20} />
            </button>
            </div>
        </div>
        
        <h3 className="text-lg font-bold text-stone-800 mb-1 leading-tight">{hymn.title}</h3>
        <p className="text-sm text-stone-500 font-medium mb-4">{hymn.artist || 'Artista Desconhecido'}</p>
        
        <div className="flex-1 bg-stone-50 border border-stone-100 rounded-xl p-4 relative overflow-hidden h-32">
        <p className="text-xs text-stone-600 whitespace-pre-line font-mono opacity-80 leading-relaxed">
            {hymn.lyrics ? hymn.lyrics.slice(0, 150) + '...' : 'Sem letra cadastrada.'}
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-stone-50 to-transparent"></div>
        </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans bg-[#FAF9F6]">
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <button onClick={() => navigate('/personal/spiritual')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors mb-4">
            <ArrowLeft size={14} /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight flex items-center gap-3">
            <Music className="text-[#5D4037]" /> Hinos & Louvores
          </h1>
        </div>
        <button onClick={() => navigate('/personal/spiritual/hymns/new')} className="bg-[#3E2723] hover:bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg transition-all active:scale-95">
          <Plus size={18} /> Nova Hino
        </button>
      </div>

      <div className="px-8 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-stone-400" size={32} /></div>
        ) : hymns.length === 0 ? (
          <div className="text-center py-20 bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
            <Mic2 className="mx-auto text-stone-300 mb-3" size={32} />
            <p className="text-stone-400">Seu repertório está vazio.</p>
            <button onClick={() => navigate('/personal/spiritual/hymns/new')} className="text-[#5D4037] font-bold text-xs uppercase tracking-widest mt-2 hover:underline">Adicionar Primeiro Louvor</button>
          </div>
        ) : (
          <>
            <HymnSection title="Recentes / Favoritos" icon={<Star size={20} />} count={recentHymns.length} defaultOpen={true}>
                {recentHymns.map(hymn => <HymnCard key={hymn.id} hymn={hymn} />)}
            </HymnSection>

            <HymnSection title="Biblioteca Completa" icon={<Library size={20} />} count={libraryHymns.length} defaultOpen={false}>
                {libraryHymns.map(hymn => <HymnCard key={hymn.id} hymn={hymn} />)}
            </HymnSection>
          </>
        )}
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
              <h2 className="text-lg font-bold text-stone-800 mb-2">Excluir hino?</h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-6">
                Esta ação não pode ser desfeita.
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
