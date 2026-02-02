
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Calendar, Eye, Trash2, Settings, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuotes, useDeleteQuote } from '../hooks/useQuotes';
import { QuoteStatus } from '../types/agency.types';

const StatusBadge: React.FC<{ status: QuoteStatus }> = ({ status }) => {
  const styles = {
    draft: 'bg-[#2C2C2C] text-[#737373] border-[#404040]',
    sent: 'bg-[#3d2d14]/30 text-[#a88760] border-[#523e20]', // Muted Amber
    approved: 'bg-[#143d2d]/30 text-[#60a887] border-[#20523e]', // Muted Emerald
    rejected: 'bg-[#3d1414]/30 text-[#a86060] border-[#522020]', // Muted Red
  };
  const labels = {
    draft: 'Rascunho',
    sent: 'Enviado',
    approved: 'Aprovado',
    rejected: 'Recusado'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default function QuotesPage() {
  const navigate = useNavigate();
  const { data: quotes, isLoading } = useQuotes();
  const deleteQuote = useDeleteQuote();

  // Estado para controlar o modal de exclusão
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

  // Abre o modal
  const handleDeleteRequest = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setQuoteToDelete(id);
  }

  // Confirma a exclusão
  const confirmDelete = () => {
    if (quoteToDelete) {
        deleteQuote.mutate(quoteToDelete);
        setQuoteToDelete(null);
    }
  }

  return (
    <div className="animate-fade-in pb-20 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#FFFFFF] tracking-tight">Orçamentos</h1>
          <p className="text-[#9ca3af] text-sm mt-1">Gerencie propostas comerciais e negociações.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('template')}
            className="bg-[#2C2C2C] hover:bg-[#37352F] text-[#D4D4D4] px-4 py-2.5 rounded-md flex items-center gap-2 text-sm font-medium border border-[#404040] transition-all"
            title="Configurar Modelo Padrão"
          >
            <Settings size={16} /> <span className="hidden md:inline">Modelo</span>
          </button>
          <button 
            onClick={() => navigate('new')}
            className="bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFFFF] px-4 py-2.5 rounded-md flex items-center gap-2 text-sm font-medium shadow-sm border border-[#5D4037] active:scale-95 transition-all"
          >
            <Plus size={16} /> Novo Orçamento
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-[#737373]">Carregando orçamentos...</div>
      ) : quotes?.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#404040] rounded-lg bg-[#202020]">
            <FileText className="mx-auto text-[#404040] mb-4" size={32} />
            <p className="text-[#737373] text-sm">Nenhum orçamento criado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotes?.map(quote => (
            <div 
              key={quote.id}
              onClick={() => navigate(`${quote.id}`)}
              className="group bg-[#2C2C2C] border border-[#404040] hover:border-[#737373] rounded-lg p-5 cursor-pointer transition-all hover:shadow-lg"
            >
              <div className="flex justify-between items-start mb-4">
                <StatusBadge status={quote.status} />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-[#37352F] rounded text-[#9ca3af] hover:text-[#FFFFFF] transition-colors">
                        <Eye size={14} />
                    </button>
                    <button onClick={(e) => handleDeleteRequest(quote.id, e)} className="p-1.5 hover:bg-[#37352F] rounded text-[#9ca3af] hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-[#FFFFFF] mb-1 truncate">{quote.title}</h3>
              <p className="text-xs text-[#9ca3af] mb-6 font-mono">{quote.client?.company_name || quote.client?.name}</p>

              <div className="space-y-1.5 border-t border-[#404040] pt-4">
                <div className="flex justify-between text-xs">
                    <span className="text-[#737373]">Mensal (Fee)</span>
                    <span className="text-[#E09B6B] font-mono font-bold">R$ {quote.total_monthly?.toLocaleString('pt-BR', { minimumFractionDigits: 2}) || '0,00'}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-[#737373]">Setup (Único)</span>
                    <span className="text-[#D4D4D4] font-mono">R$ {quote.total_one_time?.toLocaleString('pt-BR', { minimumFractionDigits: 2}) || '0,00'}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-2 flex items-center gap-2 text-[10px] text-[#5c5c5c] font-medium uppercase tracking-wider">
                <Calendar size={10} /> 
                {new Date(quote.created_at!).toLocaleDateString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmação Customizado */}
      {quoteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#202020] w-full max-w-sm rounded-xl border border-[#404040] shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-900/20 border border-red-900/50 rounded-full flex items-center justify-center mb-4 text-red-500">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">Excluir Orçamento?</h3>
              <p className="text-[#9ca3af] text-sm leading-relaxed mb-6">
                Esta ação é irreversível. O orçamento será removido permanentemente da base de dados.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setQuoteToDelete(null)}
                  disabled={deleteQuote.isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-[#9ca3af] bg-[#37352F] hover:bg-[#404040] hover:text-[#D4D4D4] transition-colors border border-[#404040]"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={deleteQuote.isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-red-400 bg-red-900/20 border border-red-900/50 hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                >
                  {deleteQuote.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {deleteQuote.isPending ? '...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
