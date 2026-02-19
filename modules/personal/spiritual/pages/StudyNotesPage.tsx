import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, PenTool, Book, Loader2, Trash2, Pencil, ChevronDown, Clock, Archive, Search, X } from 'lucide-react';
import { useSpiritual } from '../hooks/useSpiritual';

interface Study {
  id: string;
  title: string;
  topic: string;
  bible_references: string;
  content: string;
  tags: string[];
  created_at?: string;
}

interface StudySectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const StudySection: React.FC<StudySectionProps> = ({ title, icon, count, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  if (count === 0) return null;
  return (
    <div className="w-full animate-fade-in mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-secondary transition-colors group select-none shadow-sm"
      >
        <div className="flex items-center gap-3 text-foreground">
          {icon}
          <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
          <span className="bg-secondary px-2 py-0.5 rounded-md text-[10px] font-bold border border-border text-muted-foreground">{count}</span>
        </div>
        <ChevronDown size={20} className={`text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pt-4 pb-2 pl-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

export default function StudyNotesPage() {
  const navigate = useNavigate();
  const { data: studies, loading, fetchData, deleteItem } = useSpiritual<Study>('bible_study_notes');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchData(); }, [fetchData]);

  const { recent, archived, filteredTotal } = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = studies.filter(study => {
      if (!query) return true;
      return (
        study.title.toLowerCase().includes(query) ||
        study.topic.toLowerCase().includes(query) ||
        study.bible_references.toLowerCase().includes(query) ||
        study.content.toLowerCase().includes(query)
      );
    });
    const groups = filtered.reduce((acc, study) => {
      const date = study.created_at ? new Date(study.created_at) : new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (date >= thirtyDaysAgo) acc.recent.push(study);
      else acc.archived.push(study);
      return acc;
    }, { recent: [] as Study[], archived: [] as Study[] });
    return { ...groups, filteredTotal: filtered.length };
  }, [studies, searchQuery]);

  const StudyCard: React.FC<{ study: Study }> = ({ study }) => (
    <div className="bg-card p-8 rounded-[2rem] border border-border shadow-sm hover:shadow-lg transition-all group relative">
      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => navigate(`/personal/spiritual/studies/${study.id}`)}
          className="p-2 bg-secondary rounded-full hover:bg-accent text-muted-foreground"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => deleteItem(study.id)}
          className="p-2 bg-red-50 rounded-full hover:bg-red-100 text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          {study.topic || 'Geral'}
        </span>
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{study.title}</h3>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 font-medium">
        <Book size={14} /> {study.bible_references}
      </div>
      <div className="text-sm text-muted-foreground line-clamp-4">{study.content}</div>
    </div>
  );

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans">

      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <button
            onClick={() => navigate('/personal/spiritual')}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <PenTool className="text-emerald-500" /> Meus Estudos
          </h1>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar anotações..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm placeholder:text-muted-foreground text-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full text-muted-foreground transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => navigate('/personal/spiritual/studies/new')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 shrink-0"
          >
            <Plus size={18} /> <span className="hidden md:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
        ) : filteredTotal === 0 ? (
          <div className="text-center py-20 bg-card rounded-[2rem] border border-dashed border-border">
            {searchQuery ? (
              <>
                <Search className="mx-auto text-muted-foreground mb-3" size={32} />
                <p className="text-muted-foreground">Nenhum estudo encontrado para "{searchQuery}".</p>
                <button onClick={() => setSearchQuery('')} className="text-emerald-600 font-bold text-xs uppercase tracking-widest mt-2 hover:underline">Limpar Busca</button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Nenhum estudo criado.</p>
                <button onClick={() => navigate('/personal/spiritual/studies/new')} className="text-emerald-600 font-bold text-xs uppercase tracking-widest mt-2 hover:underline">Criar o Primeiro</button>
              </>
            )}
          </div>
        ) : (
          <>
            <StudySection title="Recentes" icon={<Clock size={20} />} count={recent.length} defaultOpen={true}>
              {recent.map(study => <StudyCard key={study.id} study={study} />)}
            </StudySection>
            <StudySection title="Arquivo de Estudos" icon={<Archive size={20} />} count={archived.length} defaultOpen={!!searchQuery}>
              {archived.map(study => <StudyCard key={study.id} study={study} />)}
            </StudySection>
          </>
        )}
      </div>
    </div>
  );
}