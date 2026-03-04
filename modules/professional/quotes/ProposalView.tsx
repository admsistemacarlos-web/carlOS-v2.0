import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../integrations/supabase/client';
import { AgencyQuote, AgencyQuoteItem } from '../types/agency.types';
import { Loader2, Printer, ArrowLeft, Download, CheckCircle2, Calendar, Building2, Mail } from 'lucide-react';

export default function ProposalView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quote, setQuote] = useState<AgencyQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('agency_quotes')
        .select(`
          *,
          client:agency_clients(*),
          items:agency_quote_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao carregar proposta:', error);
        navigate('/professional/quotes');
        return;
      }
      
      setQuote(data);
      setLoading(false);
    };

    fetchQuote();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!quote) return null;

  // --- PROCESSING DATA ---
  const oneTimeItems = quote.items?.filter(i => i.charge_type === 'unique').sort((a, b) => (a.order_index || 0) - (b.order_index || 0)) || [];
  const monthlyItems = quote.items?.filter(i => i.charge_type === 'monthly').sort((a, b) => (a.order_index || 0) - (b.order_index || 0)) || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não informada';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (val?: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 pb-20">
      
      {/* 1. TOP BAR (ACTIONS) */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex justify-between items-center print:hidden">
        <button 
          onClick={() => navigate('/professional/quotes')}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        
        <div className="flex gap-3">
            <button 
              onClick={() => navigate(`/professional/quotes/${id}/edit`)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary border border-border rounded-lg transition-all"
            >
              Editar Conteúdo
            </button>
            <button 
              onClick={() => window.print()}
              className="px-6 py-2 bg-primary text-background text-xs font-black uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(224,155,107,0.2)] hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Printer size={16} /> Imprimir / PDF
            </button>
        </div>
      </div>

      {/* 2. DOCUMENT CONTAINER (A4-ish Width) */}
      <div className="max-w-[900px] mx-auto bg-card mt-8 mb-12 shadow-2xl overflow-hidden print:shadow-none print:m-0 print:max-w-none print:bg-card print:text-black">
        
        {/* HEADER / BRANDING */}
        <div className="bg-background p-12 border-b border-border flex justify-between items-start print:bg-card print:border-black">
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-background font-black">
                        Q9
                    </div>
                    <span className="text-xl font-bold tracking-tighter text-white print:text-black">Studio Quattro9</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 print:text-black">{quote.title}</h1>
                <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Proposta Comercial #{String(quote.quote_number || '000').padStart(4, '0')}</p>
            </div>
            <div className="text-right text-sm space-y-1 text-muted-foreground">
                <p className="flex items-center justify-end gap-2"><Calendar size={14}/> {formatDate(quote.created_at)}</p>
                <p className="flex items-center justify-end gap-2 text-primary font-bold">Validade: 15 dias</p>
            </div>
        </div>

        {/* CLIENT INFO */}
        <div className="p-12 border-b border-border grid grid-cols-2 gap-12 print:border-border">
             <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Preparado Para</h3>
                <div className="space-y-1">
                    <p className="text-xl font-bold text-white print:text-black">{quote.client?.name}</p>
                    {quote.client?.company_name && (
                        <p className="flex items-center gap-2 text-muted-foreground print:text-foreground">
                            <Building2 size={14} /> {quote.client.company_name}
                        </p>
                    )}
                    {quote.client?.email && (
                        <p className="flex items-center gap-2 text-muted-foreground print:text-foreground">
                            <Mail size={14} /> {quote.client.email}
                        </p>
                    )}
                </div>
             </div>
             <div className="text-right">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Responsável</h3>
                <p className="text-lg font-bold text-white print:text-black">Eduardo (Cadu)</p>
                <p className="text-muted-foreground print:text-foreground">Head of Engineering</p>
                <p className="text-muted-foreground print:text-foreground">Studio Quattro9</p>
             </div>
        </div>

        {/* NARRATIVE SECTION */}
        <div className="p-12 space-y-12 print:space-y-8">
            
            {/* Introduction */}
            {quote.introduction_text && (
                <section>
                    <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <span className="w-8 h-[2px] bg-primary"></span> Apresentação
                    </h2>
                    <div className="text-foreground leading-relaxed whitespace-pre-wrap text-base print:text-foreground">
                        {quote.introduction_text}
                    </div>
                </section>
            )}

            {/* Strategy */}
            {quote.strategy_text && (
                <section>
                    <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <span className="w-8 h-[2px] bg-primary"></span> Diagnóstico & Estratégia
                    </h2>
                    <div className="text-foreground leading-relaxed whitespace-pre-wrap text-base print:text-foreground">
                        {quote.strategy_text}
                    </div>
                </section>
            )}

        </div>

        {/* FINANCIALS */}
        <div className="bg-background p-12 border-y border-border print:bg-secondary print:border-border">
            <h2 className="text-2xl font-bold text-white mb-8 text-center uppercase tracking-widest print:text-black">Investimento & Escopo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                
                {/* ONE TIME TABLE */}
                {oneTimeItems.length > 0 && (
                    <div className="bg-card rounded-2xl p-6 border border-border shadow-lg print:bg-card print:border-border print:shadow-none">
                        <div className="flex justify-between items-center mb-6 border-b border-border pb-4 print:border-border">
                            <h3 className="font-bold text-white uppercase tracking-wider print:text-black">Implementação (Setup)</h3>
                            <span className="text-[10px] bg-border text-muted-foreground px-2 py-1 rounded print:bg-secondary print:text-black">Pagamento Único</span>
                        </div>
                        <ul className="space-y-4">
                            {oneTimeItems.map(item => (
                                <li key={item.id} className="flex justify-between items-start text-sm">
                                    <div className="pr-4">
                                        <p className="font-bold text-foreground print:text-black">{item.title}</p>
                                        {item.quantity && item.quantity > 1 && (
                                            <span className="text-xs text-muted-foreground font-mono">{item.quantity}x {formatCurrency(item.unit_price)}</span>
                                        )}
                                    </div>
                                    <p className="font-bold text-white font-mono tabular-nums print:text-black">
                                        {formatCurrency((item.unit_price || 0) * (item.quantity || 1))}
                                    </p>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 pt-4 border-t border-border flex justify-between items-center print:border-border">
                            <span className="text-xs uppercase font-bold text-muted-foreground">Total Setup</span>
                            <span className="text-xl font-bold text-white print:text-black">{formatCurrency(quote.total_one_time)}</span>
                        </div>
                    </div>
                )}

                {/* RECURRING TABLE */}
                {monthlyItems.length > 0 && (
                    <div className="bg-card rounded-2xl p-6 border border-primary/30 shadow-[0_0_20px_rgba(224,155,107,0.05)] relative overflow-hidden print:bg-card print:border-border print:shadow-none">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent pointer-events-none print:hidden" />
                        
                        <div className="flex justify-between items-center mb-6 border-b border-border pb-4 print:border-border">
                            <h3 className="font-bold text-primary uppercase tracking-wider print:text-black">Recorrência Mensal</h3>
                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded print:bg-secondary print:text-black">Mensalidade</span>
                        </div>
                        <ul className="space-y-4">
                            {monthlyItems.map(item => (
                                <li key={item.id} className="flex justify-between items-start text-sm">
                                    <div className="pr-4">
                                        <p className="font-bold text-foreground print:text-black">{item.title}</p>
                                        {item.quantity && item.quantity > 1 && (
                                            <span className="text-xs text-muted-foreground font-mono">{item.quantity}x {formatCurrency(item.unit_price)}</span>
                                        )}
                                    </div>
                                    <p className="font-bold text-primary font-mono tabular-nums print:text-black">
                                        {formatCurrency((item.unit_price || 0) * (item.quantity || 1))}
                                    </p>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 pt-4 border-t border-border flex justify-between items-center print:border-border">
                            <span className="text-xs uppercase font-bold text-muted-foreground">Total Mensal</span>
                            <span className="text-2xl font-bold text-primary print:text-black">{formatCurrency(quote.total_monthly)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* TERMS & SIGNATURE */}
        <div className="p-12 bg-background print:bg-card print:text-black">
            {quote.terms_conditions && (
                <div className="mb-12">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Termos e Condições</h4>
                    <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap print:text-foreground">
                        {quote.terms_conditions}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-12 mt-20 print:mt-10">
                <div className="border-t border-secondary pt-4 print:border-black">
                    <p className="font-bold text-white text-sm mb-1 print:text-black">Studio Quattro9</p>
                    <p className="text-xs text-muted-foreground">Contratada</p>
                </div>
                <div className="border-t border-secondary pt-4 print:border-black">
                    <p className="font-bold text-white text-sm mb-1 print:text-black">{quote.client?.company_name || quote.client?.name}</p>
                    <p className="text-xs text-muted-foreground">Contratante (Aceite)</p>
                </div>
            </div>
        </div>
        
      </div>
      
      <div className="text-center text-secondary text-xs uppercase tracking-widest pb-8 print:hidden">
        Sistema carlOS v2.0 • Studio Quattro9
      </div>
    </div>
  );
}