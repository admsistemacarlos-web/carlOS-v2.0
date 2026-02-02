
import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Search, BookOpen, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { bibleBooks } from "../data/bibleBooks";
import { useReadingProgress } from "../hooks/useReadingProgress";
import { TestamentSection } from "../components/TestamentSection";

export default function BibleReadingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const {
    loading,
    toggleChapter,
    isChapterRead,
    getBookProgress,
    getTotalProgress,
    resetProgress,
    resetBookProgress,
    markBookComplete,
  } = useReadingProgress();

  const totalProgress = getTotalProgress();

  // --- LÓGICA DE AGRUPAMENTO ---
  const { inProgressBooks, notStartedBooks, completedBooks } = useMemo(() => {
    const searched = bibleBooks.filter((book) =>
      book.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const inProgress = [];
    const notStarted = [];
    const completed = [];

    for (const book of searched) {
      const stats = getBookProgress(book.name, book.chapters);
      if (stats.percentage === 100) {
        completed.push(book);
      } else if (stats.read > 0) {
        inProgress.push(book);
      } else {
        notStarted.push(book);
      }
    }

    return { 
      inProgressBooks: inProgress, 
      notStartedBooks: notStarted, 
      completedBooks: completed 
    };
  }, [searchQuery, getBookProgress]);

  const notStartedOld = notStartedBooks.filter(b => b.testament === 'old');
  const notStartedNew = notStartedBooks.filter(b => b.testament === 'new');

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-transparent pb-20 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="w-full px-8 pt-8 pb-6">
        <button 
          onClick={() => navigate('/personal/spiritual')}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Voltar ao Hub
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Leitura Bíblica</h1>
            <p className="text-sm text-slate-500 mt-1">Acompanhe seu progresso canônico.</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar livro..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400"
              />
            </div>
            <button 
              onClick={() => setIsResetModalOpen(true)}
              className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
              title="Resetar Todo Progresso"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar Global */}
      <div className="w-full px-8 mb-10">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <BookOpen size={32} />
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Progresso Total</span>
              <span className="text-2xl font-bold text-slate-800">{totalProgress.percentage}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${totalProgress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 text-right">
              {totalProgress.read} de {totalProgress.total} capítulos lidos
            </p>
          </div>
        </div>
      </div>

      {/* Content Areas */}
      <div className="w-full px-8">
        
        {inProgressBooks.length > 0 && (
          <TestamentSection
            title="Lendo Agora"
            books={inProgressBooks}
            isChapterRead={isChapterRead}
            onToggleChapter={toggleChapter}
            onResetBook={resetBookProgress}
            onMarkComplete={markBookComplete}
            getBookProgress={getBookProgress}
            defaultExpanded={true}
            highlight={true}
          />
        )}

        {(notStartedOld.length > 0 || notStartedNew.length > 0) && (
          <div className="mt-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Biblioteca - Por Ler</h3>
            
            {notStartedOld.length > 0 && (
              <TestamentSection
                title="Antigo Testamento"
                books={notStartedOld}
                isChapterRead={isChapterRead}
                onToggleChapter={toggleChapter}
                onResetBook={resetBookProgress}
                onMarkComplete={markBookComplete}
                getBookProgress={getBookProgress}
                defaultExpanded={false}
              />
            )}

            {notStartedNew.length > 0 && (
              <TestamentSection
                title="Novo Testamento"
                books={notStartedNew}
                isChapterRead={isChapterRead}
                onToggleChapter={toggleChapter}
                onResetBook={resetBookProgress}
                onMarkComplete={markBookComplete}
                getBookProgress={getBookProgress}
                defaultExpanded={false}
              />
            )}
          </div>
        )}

        {completedBooks.length > 0 && (
          <div className="mt-8 border-t border-slate-100 pt-8 opacity-75 hover:opacity-100 transition-opacity">
             <TestamentSection
                title="Livros Concluídos"
                books={completedBooks}
                isChapterRead={isChapterRead}
                onToggleChapter={toggleChapter}
                onResetBook={resetBookProgress}
                onMarkComplete={markBookComplete}
                getBookProgress={getBookProgress}
                defaultExpanded={false}
              />
          </div>
        )}
      </div>

      {/* Reset Modal */}
      {isResetModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsResetModalOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Resetar Progresso?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={() => { resetProgress(); setIsResetModalOpen(false); }}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-xs uppercase tracking-widest"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
