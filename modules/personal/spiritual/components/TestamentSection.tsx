
import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, RotateCcw, ChevronDown, BookOpen } from 'lucide-react';
import { BibleBook } from '../data/bibleBooks';

interface TestamentSectionProps {
  title: string;
  books: BibleBook[];
  isChapterRead: (book: string, chapter: number) => boolean;
  onToggleChapter: (book: string, chapter: number) => void;
  onResetBook: (book: string) => void;
  onMarkComplete: (book: string, chapters: number) => void;
  getBookProgress: (book: string, chapters: number) => { percentage: number; read: number };
  defaultExpanded?: boolean;
  highlight?: boolean; // Novo prop para dar destaque (seção "Lendo")
}

export const TestamentSection: React.FC<TestamentSectionProps> = ({
  title,
  books,
  isChapterRead,
  onToggleChapter,
  onResetBook,
  onMarkComplete,
  getBookProgress,
  defaultExpanded = true,
  highlight = false,
}) => {
  const [isSectionExpanded, setIsSectionExpanded] = useState(defaultExpanded);
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({});

  // Se for highlight, expandimos todos os livros automaticamente para facilitar a leitura imediata
  useEffect(() => {
    if (highlight) {
      const allExpanded: Record<string, boolean> = {};
      books.forEach(b => allExpanded[b.name] = true);
      setExpandedBooks(allExpanded);
    }
  }, [highlight, books]);

  const toggleBook = (bookName: string) => {
    setExpandedBooks(prev => ({ ...prev, [bookName]: !prev[bookName] }));
  };

  if (books.length === 0) return null;

  return (
    <div className="mb-8 w-full animate-fade-in">
      
      {/* Header da Seção */}
      <button 
        onClick={() => setIsSectionExpanded(!isSectionExpanded)}
        className={`w-full flex items-center justify-between group p-3 rounded-xl transition-colors mb-3 select-none ${highlight ? 'bg-blue-50/50' : 'hover:bg-secondary'}`}
      >
        <h2 className="text-lg font-bold text-foreground flex items-center gap-3 px-1">
          <span className={`w-1.5 h-6 rounded-full transition-colors ${highlight ? 'bg-blue-500 shadow-blue-200 shadow-sm' : (isSectionExpanded ? 'bg-primary' : 'bg-stone-300')}`}></span>
          {title}
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${highlight ? 'bg-blue-100 text-blue-600' : 'bg-secondary text-muted-foreground'}`}>
            {books.length} {books.length === 1 ? 'livro' : 'livros'}
          </span>
        </h2>
        
        <div className={`
          p-2 rounded-full text-muted-foreground transition-all duration-300
          ${isSectionExpanded ? 'bg-card shadow-sm rotate-180 text-olive' : 'bg-transparent rotate-0'}
        `}>
          <ChevronDown size={20} />
        </div>
      </button>
      
      {/* Container Lista Vertical (Accordion Style) */}
      {isSectionExpanded && (
        <div className={`bg-card rounded-[1.5rem] border overflow-hidden shadow-sm divide-y divide-stone-50 animate-fade-in origin-top ${highlight ? 'border-blue-100 shadow-blue-50' : 'border-border'}`}>
          {books.map((book) => {
            const stats = getBookProgress(book.name, book.chapters);
            const isComplete = stats.percentage === 100;
            const isExpanded = expandedBooks[book.name];

            return (
              <div key={book.name} className="group transition-colors">
                
                {/* Header / Trigger do Livro */}
                <div 
                  onClick={() => toggleBook(book.name)}
                  className={`
                    w-full flex items-center justify-between p-5 cursor-pointer transition-all
                    ${isExpanded ? 'bg-secondary/80' : 'hover:bg-secondary/40 bg-card'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-90 text-olive' : ''}`}>
                      <ChevronRight size={18} />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-base ${isComplete ? 'text-olive line-through decoration-olive/30' : 'text-foreground'}`}>
                        {book.name}
                      </h3>
                      {/* Subtitulo para seção de leitura ativa */}
                      {highlight && (
                        <p className="text-xs text-blue-500 font-medium flex items-center gap-1 mt-0.5">
                          <BookOpen size={12} />
                          Continuar lendo...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Porcentagem / Badge de Progresso */}
                    <div className="flex items-center gap-3">
                      {highlight ? (
                         <div className="bg-card border border-blue-100 px-3 py-1 rounded-full shadow-sm">
                            <span className="text-xs font-bold text-blue-600">
                                {stats.read} <span className="text-blue-300">/</span> {book.chapters}
                            </span>
                         </div>
                      ) : (
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${isComplete ? 'text-olive' : 'text-muted-foreground'}`}>
                            {stats.percentage}%
                            </span>
                            {/* Mini barra visual apenas em telas maiores */}
                            <div className="hidden sm:block w-12 h-1 bg-secondary rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-primary' : 'bg-stone-300'}`}
                                style={{ width: `${stats.percentage}%` }}
                            />
                            </div>
                        </div>
                      )}

                      {/* Ações Rápidas (sem expandir) */}
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                        {isComplete ? (
                          <button 
                            onClick={() => onResetBook(book.name)}
                            className="p-2 text-olive hover:bg-primary/10 rounded-full transition-colors"
                            title="Reiniciar Leitura"
                          >
                            <RotateCcw size={16} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => onMarkComplete(book.name, book.chapters)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-full transition-colors"
                            title="Marcar todos como lido"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content / Grid de Capítulos */}
                {isExpanded && (
                  <div className={`border-t border-stone-50 p-6 animate-fade-in ${highlight ? 'bg-blue-50/10' : 'bg-secondary/30'}`}>
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
                      {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => {
                        const read = isChapterRead(book.name, chapter);
                        return (
                          <button
                            key={chapter}
                            onClick={() => onToggleChapter(book.name, chapter)}
                            className={`
                              h-9 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center
                              ${read 
                                ? 'bg-primary text-primary-foreground shadow-sm scale-105' 
  : 'bg-card text-muted-foreground border border-border hover:border-primary/50 hover:text-primary'
                              }
                            `}
                          >
                            {chapter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
