
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, PenTool, Book, Loader2, X, Trash2, Pencil, ChevronDown, Clock, Archive, Search } from 'lucide-react';
import { useSpiritual } from '../hooks/useSpiritual';
import RichTextEditor from '../../../../shared/components/ui/RichTextEditor';

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

const StudySection: React.FC<StudySectionProps> = ({ 
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
                className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group select-none shadow-sm"
            >
                <div className="flex items-center gap-3 text-slate-600">
                    {icon}
                    <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200 text-slate-400">
                        {count}
                    </span>
                </div>
                <ChevronDown 
                    size={20} 
                    className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                />
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
  const { data: studies, loading, fetchData, createItem, deleteItem, updateItem } = useSpiritual<Study>('bible_study_notes');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<Study | null>(null);
  const [form, setForm] = useState({ title: '', topic: '', bible_references: '', content: '' });
  
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

        if (date >= thirtyDaysAgo) {
            acc.recent.push(study);
        } else {
            acc.archived.push(study);
        }
        return acc;
    }, { recent: [] as Study[], archived: [] as Study[] });

    return { ...groups, filteredTotal: filtered.length };
  }, [studies, searchQuery]);

  const handleOpenModal = (study?: Study) => {
    if (study) {
      setEditingStudy(study);
      setForm({
        title: study.title,
        topic: study.topic,
        bible_references: study.bible_references,
        content: study.content
      });
    } else {
      setEditingStudy(null);
      setForm({ title: '', topic: '', bible_references: '', content: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, tags: [] };
    if (editingStudy) {
      await updateItem(editingStudy.id, payload);
    } else {
      await createItem(payload);
    }
    setIsModalOpen(false);
  };

  const StudyCard: React.FC<{ study: Study }> = ({ study }) => (
    <div key={study.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative">
        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => handleOpenModal(study)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600"><Pencil size={14} /></button>
            <button onClick={() => deleteItem(study.id)} className="p-2 bg-red-50 rounded-full hover:bg-red-100 text-red-500"><Trash2 size={14} /></button>
        </div>

        <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{study.topic || 'Geral'}</span>
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2">{study.title}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 font-medium">
            <Book size={14} /> {study.bible_references}
        </div>
        
        <div className="prose prose-sm text-slate-600 line-clamp-4">
            {study.content}
        </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <button onClick={() => navigate('/personal/spiritual')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors mb-4">
            <ArrowLeft size={14} /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <PenTool className="text-emerald-500" /> Meus Estudos
          </h1>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar anotações..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm placeholder:text-slate-400 text-slate-700"
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <button onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 shrink-0">
                <Plus size={18} /> <span className="hidden md:inline">Novo</span>
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
        ) : filteredTotal === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
            {searchQuery ? (
                <>
                    <Search className="mx-auto text-slate-300 mb-3" size={32} />
                    <p className="text-slate-400">Nenhum estudo encontrado para "{searchQuery}".</p>
                    <button onClick={() => setSearchQuery('')} className="text-emerald-600 font-bold text-xs uppercase tracking-widest mt-2 hover:underline">Limpar Busca</button>
                </>
            ) : (
                <>
                    <p className="text-slate-400">Nenhum estudo criado.</p>
                    <button onClick={() => handleOpenModal()} className="text-emerald-600 font-bold text-xs uppercase tracking-widest mt-2 hover:underline">Criar o Primeiro</button>
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

      {/* Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in flex flex-col h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">{editingStudy ? 'Editar Estudo' : 'Novo Estudo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
              <div className="p-6 space-y-4 border-b border-slate-100 bg-white shrink-0">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 ml-1">Título</label>
                        <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-200 outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 ml-1">Tópico (Tema)</label>
                        <input value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} placeholder="Ex: Graça, Escatologia" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-200 outline-none" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-slate-400 ml-1">Referências Bíblicas</label>
                    <input value={form.bible_references} onChange={e => setForm({...form, bible_references: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-200 outline-none" />
                </div>
              </div>
              
              {/* Editor Rico */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                <label className="text-xs font-bold uppercase text-slate-400 ml-1 mb-2 block">Conteúdo do Estudo</label>
                <div className="bg-white rounded-xl border border-slate-200 h-full overflow-hidden">
                    <RichTextEditor 
                        content={form.content}
                        onChange={(newMarkdown) => setForm({...form, content: newMarkdown})}
                        placeholder="Desenvolva seu estudo aqui..."
                        className="p-6 min-h-[300px]"
                    />
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95">Salvar Estudo</button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
