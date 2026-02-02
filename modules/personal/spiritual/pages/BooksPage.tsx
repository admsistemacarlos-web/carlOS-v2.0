import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Library, Star, BookOpen, CheckCircle2, Bookmark, Trash2, Loader2, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { useSpiritual } from '../hooks/useSpiritual';

interface Book {
  id: string;
  title: string;
  author: string;
  status: 'reading' | 'read' | 'want_to_read';
  rating: number;
  cover_url?: string;
  owned?: boolean; // Novo campo
}

// --- COMPONENTES AUXILIARES ---

const BookCard: React.FC<{ book: Book, onClick: () => void, onDelete: (e: React.MouseEvent) => void }> = ({ book, onClick, onDelete }) => (
  <div onClick={onClick} className="bg-white p-4 rounded-2xl border border-[#E6E2DE] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group relative flex gap-4 h-full">
    <button 
        onClick={onDelete}
        className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-stone-300 hover:text-red-500 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-20 border border-stone-100"
        title="Excluir Livro"
    >
        <Trash2 size={14} />
    </button>

    {/* Capa ou Placeholder */}
    <div className="flex-shrink-0 relative">
        {book.cover_url ? (
            <img 
            src={book.cover_url} 
            alt={book.title} 
            className="w-16 h-24 object-cover rounded-lg shadow-sm border border-stone-100"
            />
        ) : (
            <div className="w-16 h-24 bg-stone-100 rounded-lg border border-stone-200 flex items-center justify-center shadow-inner text-stone-300">
                <BookOpen size={24} />
            </div>
        )}

        {/* Badge de Acervo */}
        {book.owned && (
            <div className="absolute -top-2 -left-2 bg-[#143d2d] text-white p-1 rounded-full shadow-md border-2 border-white z-10" title="Tenho este livro">
                <Check size={10} strokeWidth={4} />
            </div>
        )}
    </div>

    {/* Informações */}
    <div className="flex flex-col justify-between flex-1 py-1 min-w-0">
        <div>
            <h3 className="font-bold text-stone-800 text-sm leading-tight mb-1 line-clamp-2 pr-6">{book.title}</h3>
            <p className="text-xs text-stone-500 mb-2 truncate">{book.author || 'Autor desconhecido'}</p>
        </div>
        
        <div className="flex items-center justify-between mt-auto">
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className={i < book.rating ? "fill-[#8D6E63] text-[#8D6E63]" : "text-stone-200"} />
                ))}
            </div>
            {book.owned && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#143d2d] bg-[#143d2d]/5 px-1.5 py-0.5 rounded">
                    Acervo
                </span>
            )}
        </div>
    </div>
  </div>
);

interface BookSectionProps {
    title: string;
    icon: React.ReactNode;
    count: number;
    children: React.ReactNode;
    defaultOpen?: boolean;
    headerColor?: string;
}

const BookSection: React.FC<BookSectionProps> = ({ 
    title, 
    icon, 
    count, 
    children, 
    defaultOpen = false,
    headerColor = "text-stone-600"
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="w-full animate-fade-in">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-stone-50 border border-stone-200/50 rounded-xl hover:bg-stone-100 transition-colors group select-none"
            >
                <div className={`flex items-center gap-3 ${headerColor}`}>
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
                <div className="pt-4 pb-8 pl-2 animate-fade-in">
                    {count === 0 ? (
                        <p className="text-sm text-stone-400 italic ml-2">Nenhum livro nesta lista.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {children}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---

export default function BooksPage() {
  const navigate = useNavigate();
  const { data: books, fetchData, deleteItem } = useSpiritual<Book>('spiritual_books');

  // Estado para exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { fetchData(); }, [fetchData]);

  const reading = books.filter(b => b.status === 'reading');
  const wantToRead = books.filter(b => b.status === 'want_to_read');
  const read = books.filter(b => b.status === 'read');

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

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans bg-[#FAF9F6]">
      
      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <button onClick={() => navigate('/personal/spiritual')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors mb-4">
            <ArrowLeft size={14} /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight flex items-center gap-3">
            <Library className="text-[#5D4037]" /> Biblioteca
          </h1>
        </div>
        <button onClick={() => navigate('/personal/spiritual/books/new')} className="bg-[#3E2723] hover:bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg transition-all active:scale-95">
          <Plus size={18} /> Novo Livro
        </button>
      </div>

      {/* Accordion Layout */}
      <div className="px-8 space-y-2">
        
        {/* Seção 1: Lendo Agora */}
        <BookSection 
            title="Lendo Agora" 
            icon={<BookOpen size={20} />} 
            count={reading.length} 
            defaultOpen={true}
            headerColor="text-[#5D4037]"
        >
            {reading.map(book => (
                <BookCard 
                    key={book.id} 
                    book={book} 
                    onClick={() => navigate(`/personal/spiritual/books/${book.id}`)} 
                    onDelete={(e) => handleDeleteRequest(book.id, e)}
                />
            ))}
        </BookSection>

        {/* Seção 2: Quero Ler */}
        <BookSection 
            title="Quero Ler" 
            icon={<Bookmark size={20} />} 
            count={wantToRead.length} 
            headerColor="text-stone-500"
        >
            {wantToRead.map(book => (
                <BookCard 
                    key={book.id} 
                    book={book} 
                    onClick={() => navigate(`/personal/spiritual/books/${book.id}`)} 
                    onDelete={(e) => handleDeleteRequest(book.id, e)}
                />
            ))}
        </BookSection>

        {/* Seção 3: Concluídos */}
        <BookSection 
            title="Leitura Concluída" 
            icon={<CheckCircle2 size={20} />} 
            count={read.length} 
            headerColor="text-stone-400"
        >
            {read.map(book => (
                <BookCard 
                    key={book.id} 
                    book={book} 
                    onClick={() => navigate(`/personal/spiritual/books/${book.id}`)} 
                    onDelete={(e) => handleDeleteRequest(book.id, e)}
                />
            ))}
        </BookSection>

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
              <h2 className="text-lg font-bold text-stone-800 mb-2">Excluir livro?</h2>
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