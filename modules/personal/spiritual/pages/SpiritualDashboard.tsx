
import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, Search, BookOpen, AlertTriangle, Loader2 } from "lucide-react";
import { bibleBooks } from "../data/bibleBooks";
import { useReadingProgress } from "../hooks/useReadingProgress";
import { TestamentSection } from "../components/TestamentSection";

export default function SpiritualDashboard() {
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
    // Primeiro filtramos por busca
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

  // Sub-filtros para a seção "Por Ler" (mantendo a ordem canônica)
  const notStartedOld = notStartedBooks.filter(b => b.testament === 'old');
  const notStartedNew = notStartedBooks.filter(b => b.testament === 'new');

  const handleResetConfirm = () => {
    resetProgress();
    setIsResetModalOpen(false);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="animate-spin text-olive" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-transparent pb-20 animate-fade-in font-sans">
      
      {/* Header Full Width */}
      <div className="w-full px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Leitura Bíblica</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe seu progresso espiritual diário.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar livro..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-muted-foreground"
            />
          </div>
          <button 
            onClick={() => setIsResetModalOpen(true)}
            className="p-3 bg-card border border-border rounded-xl text-muted-foreground hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
            title="Resetar Todo Progresso"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Progress Bar Global */}
      <div className="w-full px-8 mb-10">
        <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <BookOpen size={32} />
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Progresso Total</span>
              <span className="text-2xl font-bold text-foreground">{totalProgress.percentage}%</span>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${totalProgress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {totalProgress.read} de {totalProgress.total} capítulos lidos
            </p>
          </div>
        </div>
      </div>

      {/* Content Areas */}
      <div className="w-full px-8">
        
        {/* 1. EM LEITURA (Destaque) */}
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

        {/* 2. POR LER (Dividido por testamento para organização) */}
        {(notStartedOld.length > 0 || notStartedNew.length > 0) && (
          <div className="mt-8">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 ml-2">Biblioteca - Por Ler</h3>
            
            {notStartedOld.length > 0 && (
              <TestamentSection
                title="Antigo Testamento"
                books={notStartedOld}
                isChapterRead={isChapterRead}
                onToggleChapter={toggleChapter}
                onResetBook={resetBookProgress}
                onMarkComplete={markBookComplete}
                getBookProgress={getBookProgress}
                defaultExpanded={false} // Por ler vem fechado por padrão para limpar a tela
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

        {/* 3. CONCLUÍDOS */}
        {completedBooks.length > 0 && (
          <div className="mt-8 border-t border-border pt-8 opacity-75 hover:opacity-100 transition-opacity">
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

        {/* Estado vazio para busca */}
        {inProgressBooks.length === 0 && notStartedBooks.length === 0 && completedBooks.length === 0 && (
          <div className="text-center py-20 bg-card rounded-[2rem] border border-dashed border-border">
            <Search className="mx-auto h-12 w-12 text-slate-200 mb-3" />
            <p className="text-muted-foreground">Nenhum livro encontrado com "{searchQuery}".</p>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsResetModalOpen(false)}
          />
          <div className="relative bg-card w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Resetar Progresso?</h3>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              Esta ação não pode ser desfeita. Todo o seu histórico de leitura será apagado permanentemente da nuvem.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-3 bg-secondary hover:bg-secondary text-foreground font-bold rounded-xl transition-colors text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={handleResetConfirm}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-xs uppercase tracking-widest shadow-lg shadow-red-500/20"
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
