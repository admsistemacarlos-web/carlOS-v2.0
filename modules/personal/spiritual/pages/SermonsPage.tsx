
import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Mic2, User, BookOpen, Loader2, Trash2, Pencil, AlertTriangle, ChevronDown, Archive, Clock, Search, X } from 'lucide-react';
import { useSpiritual } from '../hooks/useSpiritual';
import { formatDateBr } from '../../finance/utils/dateHelpers';

interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  bible_passage: string;
  content: string;
}

interface SermonSectionProps { 
    title: string;
    icon: React.ReactNode;
    count: number;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

// Componente de Seção (Accordion)
const SermonSection: React.FC<SermonSectionProps> = ({ 
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

export default function SermonsPage() {
  const navigate = useNavigate();
  const { data: sermons, loading, fetchData, deleteItem } = useSpiritual<Sermon>('sermon_notes');
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estado da Busca
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lógica de Filtro e Agrupamento por Data (30 dias)
  const { recent, archived, filteredTotal } = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // 1. Filtrar
    const filtered = sermons.filter(sermon => {
        if (!query) return true;
        return (
            sermon.title.toLowerCase().includes(query) ||
            sermon.preacher?.toLowerCase().includes(query) ||
            sermon.bible_passage?.toLowerCase().includes(query) ||
            sermon.content?.toLowerCase().includes(query)
        );
    });

    // 2. Agrupar
    const groups = filtered.reduce((acc, sermon) => {
        const sermonDate = new Date(sermon.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (sermonDate >= thirtyDaysAgo) {
            acc.recent.push(sermon);
        } else {
            acc.archived.push(sermon);
        }
        return acc;
    }, { recent: [] as Sermon[], archived: [] as Sermon[] });

    return { ...groups, filteredTotal: filtered.length };
  }, [sermons, searchQuery]);

  const handleNew = () => navigate('/personal/spiritual/sermons/new');
  const handleEdit = (id: string) => navigate(`/personal/spiritual/sermons/${id}`);

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

  const SermonCard: React.FC<{ sermon: Sermon }> = ({ sermon }) => (
    <div 
        onClick={() => handleEdit(sermon.id)}
        className="bg-white p-6 rounded-[2rem] border border-[#E6E2DE] shadow-sm hover:shadow-xl hover:border-[#D7CCC8] hover:-translate-y-1 transition-all group flex flex-col h-full cursor-pointer relative"
    >
        <div className="flex justify-between items-start mb-4">
        <span className="bg-stone-50 border border-stone-100 text-stone-500 text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wider">
            {formatDateBr(sermon.date)}
        </span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6">
            <button 
            onClick={(e) => handleDeleteRequest(sermon.id, e)} 
            className="p-2 bg-white rounded-full hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors shadow-sm border border-stone-100"
            title="Excluir pregação"
            >
            <Trash2 size={14} />
            </button>
        </div>
        </div>
        
        <h3 className="text-xl font-bold text-stone-800 mb-2 line-clamp-2">{sermon.title}</h3>
        
        <div className="flex items-center gap-4 text-xs text-stone-500 mb-4">
        {sermon.preacher && (
            <span className="flex items-center gap-1"><User size={12} /> {sermon.preacher}</span>
        )}
        {sermon.bible_passage && (
            <span className="flex items-center gap-1"><BookOpen size={12} /> {sermon.bible_passage}</span>
        )}
        </div>
        
        <div className="flex-1 bg-stone-50 border border-stone-100 rounded-xl p-4 text-sm text-stone-600 leading-relaxed line-clamp-4 relative overflow-hidden">
        {sermon.content}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-stone-50 to-transparent"></div>
        </div>

        <div className="mt-4 flex justify-end">
            <span className="text-[#8D6E63] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Editar <Pencil size={10} />
            </span>
        </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans bg-[#FAF9F6]">
      
      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <button onClick={() => navigate('/personal/spiritual')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors mb-4">
            <ArrowLeft size={14} /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight flex items-center gap-3">
            <Mic2 className="text-[#5D4037]" /> Pregações & Cultos
          </h1>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
            {/* Barra de Pesquisa */}
            <div className="relative flex-1 md:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#5D4037] transition-colors" size={18} />
                <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar pregações..."
                    className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-[#5D4037]/20 focus:border-[#5D4037] transition-all shadow-sm placeholder:text-stone-400 text-stone-700"
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-stone-100 rounded-full text-stone-400 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <button onClick={handleNew} className="bg-[#3E2723] hover:bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg transition-all active:scale-95 shrink-0">
                <Plus size={18} /> Nova Anotação
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-stone-400" size={32} /></div>
        ) : filteredTotal === 0 ? (
          <div className="text-center py-20 bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
            {searchQuery ? (
                <>
                    <Search className="mx-auto text-stone-300 mb-3" size={32} />
                    <p className="text-stone-400">Nenhuma pregação encontrada para "{searchQuery}".</p>
                    <button onClick={() => setSearchQuery('')} className="text-[#5D4037] font-bold text-xs uppercase tracking-widest mt-2 hover:underline">Limpar Busca</button>
                </>
            ) : (
                <>
                    <p className="text-stone-400">Nenhuma pregação anotada ainda.</p>
                    <button onClick={handleNew} className="text-[#5D4037] font-bold text-xs uppercase tracking-widest mt-2 hover:underline">Criar a primeira</button>
                </>
            )}
          </div>
        ) : (
          <>
            <SermonSection 
                title="Recentes (30 dias)" 
                icon={<Clock size={20} />} 
                count={recent.length} 
                defaultOpen={true}
            >
                {recent.map(sermon => <SermonCard key={sermon.id} sermon={sermon} />)}
            </SermonSection>

            <SermonSection 
                title="Arquivo" 
                icon={<Archive size={20} />} 
                count={archived.length} 
                defaultOpen={!!searchQuery}
            >
                {archived.map(sermon => <SermonCard key={sermon.id} sermon={sermon} />)}
            </SermonSection>
          </>
        )}
      </div>

      {/* Delete Modal */}
      {isDeleteOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#3E2723]/20 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsDeleteOpen(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-[1.5rem] shadow-2xl p-6 animate-fade-in border border-stone-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-lg font-bold text-stone-800 mb-2">Excluir pregação?</h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-6">
                Essa ação não pode ser desfeita. A anotação será removida permanentemente.
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
