import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModuleHeader } from '../../../shared/components/Navigation/ModuleHeader';
import { useQuotes } from '../hooks/useQuotes';
import { 
  Plus, Search, FileText, Calendar, DollarSign, 
  MoreVertical, Loader2, Eye, Pencil, Trash2 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../../integrations/supabase/client';

export default function QuotesPage() {
  const navigate = useNavigate();
  const { data: quotes, isLoading, refetch } = useQuotes();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta proposta?')) return;
    
    try {
      const { error } = await supabase.from('agency_quotes').delete().eq('id', id);
      if (error) throw error;
      refetch();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir.');
    }
  };

  const filteredQuotes = quotes?.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#191919] text-[#D4D4D4] pb-20 animate-fade-in">
      <ModuleHeader 
        title="Orçamentos & Propostas" 
        subtitle="Gestão comercial e geração de contratos"
      />

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-8 space-y-6">
        
        {/* ACTIONS BAR */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={18} />
            <input 
              type="text"
              placeholder="Buscar por projeto ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-[#202020] border border-[#333] rounded-xl pl-10 pr-4 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none transition-all"
            />
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={() => navigate('/professional/quotes/template')}
               className="h-12 px-6 border border-[#333] hover:border-[#737373] text-[#D4D4D4] font-bold uppercase tracking-wider text-xs rounded-xl transition-all flex items-center gap-2"
             >
               <FileText size={16} /> Templates
             </button>
             <button 
               onClick={() => navigate('/professional/quotes/new')}
               className="h-12 px-6 bg-[#E09B6B] hover:bg-[#E09B6B]/90 text-[#191919] font-bold uppercase tracking-wider text-xs rounded-xl shadow-[0_0_15px_rgba(224,155,107,0.2)] transition-all flex items-center gap-2"
             >
               <Plus size={18} /> Nova Proposta
             </button>
          </div>
        </div>

        {/* LIST */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#E09B6B]" size={32} />
          </div>
        ) : filteredQuotes?.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[#333] rounded-2xl">
            <p className="text-[#737373]">Nenhum orçamento encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredQuotes?.map((quote) => (
              <div 
                key={quote.id}
                onClick={() => navigate(`/professional/quotes/${quote.id}`)} // Clicar no card leva para EDIÇÃO
                className="bg-[#202020] border border-[#333] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#E09B6B]/50 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Status Stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    quote.status === 'sent' ? 'bg-blue-500' : 
                    quote.status === 'approved' ? 'bg-green-500' : 
                    quote.status === 'rejected' ? 'bg-red-500' : 
                    'bg-[#737373]'
                }`} />

                <div className="pl-3 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-mono text-[#5c5c5c] uppercase tracking-widest">
                      #{String(quote.quote_number || 0).padStart(4, '0')}
                    </span>
                    <h3 className="font-bold text-white text-lg group-hover:text-[#E09B6B] transition-colors">
                      {quote.title}
                    </h3>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#999]">
                    <span className="flex items-center gap-1">
                       <FileText size={12} /> {quote.client?.name}
                    </span>
                    <span className="flex items-center gap-1">
                       <Calendar size={12} /> {quote.created_at && format(new Date(quote.created_at), "d 'de' MMM, yyyy", { locale: ptBR })}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        quote.status === 'approved' ? 'bg-green-900/20 text-green-400' :
                        quote.status === 'sent' ? 'bg-blue-900/20 text-blue-400' :
                        'bg-[#333] text-[#737373]'
                    }`}>
                        {quote.status === 'draft' ? 'Rascunho' : quote.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 pl-3 md:pl-0 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                        <p className="text-[10px] text-[#737373] uppercase font-bold">Total Mensal</p>
                        <p className="text-[#E09B6B] font-bold font-mono">
                            {(quote.total_monthly || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                    <div className="text-right border-l border-[#333] pl-4">
                        <p className="text-[10px] text-[#737373] uppercase font-bold">Setup</p>
                        <p className="text-[#D4D4D4] font-bold font-mono">
                            {(quote.total_one_time || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>

                    {/* ACTIONS BUTTONS */}
                    <div className="flex items-center gap-2 pl-2" onClick={e => e.stopPropagation()}>
                        
                        {/* BOTÃO VISUALIZAR (NOVO) */}
                        <button 
                            onClick={() => navigate(`/professional/quotes/${quote.id}/view`)}
                            title="Visualizar Proposta Final"
                            className="p-2 hover:bg-[#333] text-[#737373] hover:text-white rounded-lg transition-colors border border-transparent hover:border-[#404040]"
                        >
                            <Eye size={18} />
                        </button>

                        <button 
                            onClick={() => navigate(`/professional/quotes/${quote.id}`)}
                            title="Editar Rascunho"
                            className="p-2 hover:bg-[#333] text-[#737373] hover:text-[#E09B6B] rounded-lg transition-colors border border-transparent hover:border-[#404040]"
                        >
                            <Pencil size={18} />
                        </button>

                        <button 
                            onClick={(e) => handleDelete(e, quote.id)}
                            title="Excluir"
                            className="p-2 hover:bg-red-900/20 text-[#737373] hover:text-red-400 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}