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
      <div className="min-h-screen bg-[#191919] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#E09B6B]" size={32} />
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
    <div className="min-h-screen bg-[#191919] text-[#D4D4D4] font-sans selection:bg-[#E09B6B]/30 pb-20">
      
      {/* 1. TOP BAR (ACTIONS) */}
      <div className="sticky top-0 z-50 bg-[#191919]/80 backdrop-blur-md border-b border-[#333] px-6 py-4 flex justify-between items-center print:hidden">
        <button 
          onClick={() => navigate('/professional/quotes')}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#737373] hover:text-[#D4D4D4] transition-colors"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        
        <div className="flex gap-3">
            <button 
              onClick={() => navigate(`/professional/quotes/${id}/edit`)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#737373] hover:text-[#E09B6B] border border-[#333] rounded-lg transition-all"
            >
              Editar Conteúdo
            </button>
            <button 
              onClick={() => window.print()}
              className="px-6 py-2 bg-[#E09B6B] text-[#191919] text-xs font-black uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(224,155,107,0.2)] hover:bg-[#E09B6B]/90 transition-all flex items-center gap-2"
            >
              <Printer size={16} /> Imprimir / PDF
            </button>
        </div>
      </div>

      {/* 2. DOCUMENT CONTAINER (A4-ish Width) */}
      <div className="max-w-[900px] mx-auto bg-[#202020] mt-8 mb-12 shadow-2xl overflow-hidden print:shadow-none print:m-0 print:max-w-none print:bg-white print:text-black">
        
        {/* HEADER / BRANDING */}
        <div className="bg-[#151515] p-12 border-b border-[#333] flex justify-between items-start print:bg-white print:border-black">
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-[#E09B6B] rounded-lg flex items-center justify-center text-[#191919] font-black">
                        Q9
                    </div>
                    <span className="text-xl font-bold tracking-tighter text-white print:text-black">Studio Quattro9</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 print:text-black">{quote.title}</h1>
                <p className="text-[#737373] text-sm uppercase tracking-widest font-bold">Proposta Comercial #{String(quote.quote_number || '000').padStart(4, '0')}</p>
            </div>
            <div className="text-right text-sm space-y-1 text-[#737373]">
                <p className="flex items-center justify-end gap-2"><Calendar size={14}/> {formatDate(quote.created_at)}</p>
                <p className="flex items-center justify-end gap-2 text-[#E09B6B] font-bold">Validade: 15 dias</p>
            </div>
        </div>

        {/* CLIENT INFO */}
        <div className="p-12 border-b border-[#333] grid grid-cols-2 gap-12 print:border-gray-200">
             <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5c5c5c] mb-4">Preparado Para</h3>
                <div className="space-y-1">
                    <p className="text-xl font-bold text-white print:text-black">{quote.client?.name}</p>
                    {quote.client?.company_name && (
                        <p className="flex items-center gap-2 text-[#999] print:text-gray-600">
                            <Building2 size={14} /> {quote.client.company_name}
                        </p>
                    )}
                    {quote.client?.email && (
                        <p className="flex items-center gap-2 text-[#999] print:text-gray-600">
                            <Mail size={14} /> {quote.client.email}
                        </p>
                    )}
                </div>
             </div>
             <div className="text-right">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5c5c5c] mb-4">Responsável</h3>
                <p className="text-lg font-bold text-white print:text-black">Eduardo (Cadu)</p>
                <p className="text-[#999] print:text-gray-600">Head of Engineering</p>
                <p className="text-[#999] print:text-gray-600">Studio Quattro9</p>
             </div>
        </div>

        {/* NARRATIVE SECTION */}
        <div className="p-12 space-y-12 print:space-y-8">
            
            {/* Introduction */}
            {quote.introduction_text && (
                <section>
                    <h2 className="text-xl font-bold text-[#E09B6B] mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <span className="w-8 h-[2px] bg-[#E09B6B]"></span> Apresentação
                    </h2>
                    <div className="text-[#D4D4D4] leading-relaxed whitespace-pre-wrap text-base print:text-gray-800">
                        {quote.introduction_text}
                    </div>
                </section>
            )}

            {/* Strategy */}
            {quote.strategy_text && (
                <section>
                    <h2 className="text-xl font-bold text-[#E09B6B] mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <span className="w-8 h-[2px] bg-[#E09B6B]"></span> Diagnóstico & Estratégia
                    </h2>
                    <div className="text-[#D4D4D4] leading-relaxed whitespace-pre-wrap text-base print:text-gray-800">
                        {quote.strategy_text}
                    </div>
                </section>
            )}

        </div>

        {/* FINANCIALS */}
        <div className="bg-[#1A1A1A] p-12 border-y border-[#333] print:bg-gray-50 print:border-gray-200">
            <h2 className="text-2xl font-bold text-white mb-8 text-center uppercase tracking-widest print:text-black">Investimento & Escopo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                
                {/* ONE TIME TABLE */}
                {oneTimeItems.length > 0 && (
                    <div className="bg-[#202020] rounded-2xl p-6 border border-[#333] shadow-lg print:bg-white print:border-gray-300 print:shadow-none">
                        <div className="flex justify-between items-center mb-6 border-b border-[#333] pb-4 print:border-gray-200">
                            <h3 className="font-bold text-white uppercase tracking-wider print:text-black">Implementação (Setup)</h3>
                            <span className="text-[10px] bg-[#333] text-[#999] px-2 py-1 rounded print:bg-gray-200 print:text-black">Pagamento Único</span>
                        </div>
                        <ul className="space-y-4">
                            {oneTimeItems.map(item => (
                                <li key={item.id} className="flex justify-between items-start text-sm">
                                    <div className="pr-4">
                                        <p className="font-bold text-[#D4D4D4] print:text-black">{item.title}</p>
                                        {item.quantity && item.quantity > 1 && (
                                            <span className="text-xs text-[#737373] font-mono">{item.quantity}x {formatCurrency(item.unit_price)}</span>
                                        )}
                                    </div>
                                    <p className="font-bold text-white font-mono tabular-nums print:text-black">
                                        {formatCurrency((item.unit_price || 0) * (item.quantity || 1))}
                                    </p>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 pt-4 border-t border-[#333] flex justify-between items-center print:border-gray-200">
                            <span className="text-xs uppercase font-bold text-[#737373]">Total Setup</span>
                            <span className="text-xl font-bold text-white print:text-black">{formatCurrency(quote.total_one_time)}</span>
                        </div>
                    </div>
                )}

                {/* RECURRING TABLE */}
                {monthlyItems.length > 0 && (
                    <div className="bg-[#202020] rounded-2xl p-6 border border-[#E09B6B]/30 shadow-[0_0_20px_rgba(224,155,107,0.05)] relative overflow-hidden print:bg-white print:border-gray-300 print:shadow-none">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#E09B6B]/10 to-transparent pointer-events-none print:hidden" />
                        
                        <div className="flex justify-between items-center mb-6 border-b border-[#333] pb-4 print:border-gray-200">
                            <h3 className="font-bold text-[#E09B6B] uppercase tracking-wider print:text-black">Recorrência Mensal</h3>
                            <span className="text-[10px] bg-[#E09B6B]/20 text-[#E09B6B] px-2 py-1 rounded print:bg-gray-200 print:text-black">Mensalidade</span>
                        </div>
                        <ul className="space-y-4">
                            {monthlyItems.map(item => (
                                <li key={item.id} className="flex justify-between items-start text-sm">
                                    <div className="pr-4">
                                        <p className="font-bold text-[#D4D4D4] print:text-black">{item.title}</p>
                                        {item.quantity && item.quantity > 1 && (
                                            <span className="text-xs text-[#737373] font-mono">{item.quantity}x {formatCurrency(item.unit_price)}</span>
                                        )}
                                    </div>
                                    <p className="font-bold text-[#E09B6B] font-mono tabular-nums print:text-black">
                                        {formatCurrency((item.unit_price || 0) * (item.quantity || 1))}
                                    </p>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 pt-4 border-t border-[#333] flex justify-between items-center print:border-gray-200">
                            <span className="text-xs uppercase font-bold text-[#737373]">Total Mensal</span>
                            <span className="text-2xl font-bold text-[#E09B6B] print:text-black">{formatCurrency(quote.total_monthly)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* TERMS & SIGNATURE */}
        <div className="p-12 bg-[#151515] print:bg-white print:text-black">
            {quote.terms_conditions && (
                <div className="mb-12">
                    <h4 className="text-xs font-bold text-[#737373] uppercase tracking-widest mb-4">Termos e Condições</h4>
                    <div className="text-xs text-[#5c5c5c] leading-relaxed whitespace-pre-wrap print:text-gray-600">
                        {quote.terms_conditions}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-12 mt-20 print:mt-10">
                <div className="border-t border-[#404040] pt-4 print:border-black">
                    <p className="font-bold text-white text-sm mb-1 print:text-black">Studio Quattro9</p>
                    <p className="text-xs text-[#737373]">Contratada</p>
                </div>
                <div className="border-t border-[#404040] pt-4 print:border-black">
                    <p className="font-bold text-white text-sm mb-1 print:text-black">{quote.client?.company_name || quote.client?.name}</p>
                    <p className="text-xs text-[#737373]">Contratante (Aceite)</p>
                </div>
            </div>
        </div>
        
      </div>
      
      <div className="text-center text-[#404040] text-xs uppercase tracking-widest pb-8 print:hidden">
        Sistema carlOS v2.0 • Studio Quattro9
      </div>
    </div>
  );
}