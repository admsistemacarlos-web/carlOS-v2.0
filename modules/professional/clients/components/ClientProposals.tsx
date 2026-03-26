import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { useQuotes } from '../../hooks/useQuotes';
import { QuoteStatus } from '../../types/agency.types';

const STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string }> = {
  draft:    { label: 'Rascunho', color: 'text-muted-foreground bg-secondary' },
  sent:     { label: 'Enviada',  color: 'text-yellow-400 bg-yellow-400/10' },
  approved: { label: 'Aprovada', color: 'text-green-400 bg-green-400/10' },
  rejected: { label: 'Recusada', color: 'text-red-400 bg-red-400/10' },
};

export default function ClientProposals({ clientId }: { clientId: string }) {
  const navigate = useNavigate();
  const { data: allQuotes, isLoading } = useQuotes();

  const quotes = allQuotes?.filter(q => q.client_id === clientId) ?? [];

  const formatCurrency = (value?: number | null) => {
    if (!value) return '—';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-card p-6 rounded-xl border border-secondary shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
          <FileText size={14} /> Propostas
        </h3>
        <button
          onClick={() => navigate('/professional/quotes/new')}
          className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <Plus size={14} /> Nova Proposta
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 border-2 border-dashed border-secondary rounded-lg">
          <FileText size={20} className="text-muted-foreground/40" />
          <p className="text-muted-foreground text-xs">Nenhuma proposta criada para este cliente.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {quotes.map(quote => {
            const cfg = STATUS_CONFIG[quote.status];
            return (
              <div
                key={quote.id}
                onClick={() => navigate(`/professional/quotes/${quote.id}`)}
                className="group flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-secondary hover:border-primary/30 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FileText size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {quote.quote_number ? `#${quote.quote_number} — ` : ''}{quote.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {quote.created_at ? new Date(quote.created_at).toLocaleDateString('pt-BR') : ''}
                      {quote.total_monthly ? ` · ${formatCurrency(quote.total_monthly)}/mês` : ''}
                      {quote.total_one_time ? ` · ${formatCurrency(quote.total_one_time)} setup` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <ExternalLink size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
