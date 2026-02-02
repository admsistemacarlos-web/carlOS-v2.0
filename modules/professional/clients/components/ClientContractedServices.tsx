
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../integrations/supabase/client';
import { CheckCircle2, RefreshCw, Box, Loader2 } from 'lucide-react';

interface ContractedItem {
  id: string;
  title: string;
  unit_price: number;
  quantity: number;
  charge_type: 'unique' | 'monthly';
  quote_title: string;
  approved_at: string;
}

export default function ClientContractedServices({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<ContractedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContractedServices();
  }, [clientId]);

  const fetchContractedServices = async () => {
    try {
      const { data, error } = await supabase
        .from('agency_quote_items')
        .select(`
          *,
          quote:agency_quotes!inner (
            id,
            title,
            status,
            updated_at
          )
        `)
        .eq('quote.client_id', clientId)
        .eq('quote.status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: ContractedItem[] = data.map((item: any) => ({
        id: item.id,
        title: item.title, // Alterado de service_name para title
        unit_price: item.unit_price,
        quantity: item.quantity,
        charge_type: item.charge_type,
        quote_title: item.quote.title,
        approved_at: item.quote.updated_at
      }));

      setItems(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthlyItems = items.filter(i => i.charge_type === 'monthly');
  const uniqueItems = items.filter(i => i.charge_type === 'unique');

  const totalMonthly = monthlyItems.reduce((acc, i) => acc + (i.unit_price * i.quantity), 0);

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-[#737373]" /></div>;

  return (
    <div className="bg-[#202020] p-6 rounded-lg border border-[#404040] shadow-sm h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#E09B6B] flex items-center gap-2">
          <CheckCircle2 size={14} /> Serviços
        </h3>
        
        {totalMonthly > 0 && (
            <div className="bg-[#37352F] border border-[#404040] px-3 py-1 rounded text-right">
                <span className="text-[10px] uppercase font-bold text-[#9ca3af] block">MRR</span>
                <span className="text-sm font-bold text-[#FFFFFF] font-mono">R$ {totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
        )}
      </div>

      <div className="space-y-6">
        
        {/* Recorrentes */}
        <div>
            <h4 className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-[#404040] pb-2">
                <RefreshCw size={12} /> Mensalidades
            </h4>
            {monthlyItems.length === 0 ? (
                <p className="text-[#5c5c5c] text-xs italic">Nenhuma recorrência.</p>
            ) : (
                <div className="space-y-2">
                    {monthlyItems.map(item => (
                        <div key={item.id} className="bg-[#1A1A1A] p-3 rounded-md border border-[#404040] flex justify-between items-center group hover:border-[#737373] transition-colors">
                            <div className="min-w-0 pr-2">
                                <p className="text-sm font-bold text-[#E5E5E5] truncate">{item.title}</p>
                                <p className="text-[9px] text-[#737373] mt-0.5 truncate">Via: {item.quote_title}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xs font-bold text-[#E09B6B] font-mono">R$ {item.unit_price.toLocaleString('pt-BR')}</p>
                                {item.quantity > 1 && <p className="text-[9px] text-[#737373]">{item.quantity}x</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Pontuais */}
        <div>
            <h4 className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-[#404040] pb-2">
                <Box size={12} /> Projetos / Histórico
            </h4>
            {uniqueItems.length === 0 ? (
                <p className="text-[#5c5c5c] text-xs italic">Nenhum projeto pontual.</p>
            ) : (
                <div className="space-y-2">
                    {uniqueItems.slice(0, 3).map(item => (
                        <div key={item.id} className="bg-[#1A1A1A] p-3 rounded-md border border-[#404040] flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
                            <div className="min-w-0 pr-2">
                                <p className="text-xs font-medium text-[#D4D4D4] line-through decoration-[#737373] truncate">{item.title}</p>
                                <p className="text-[9px] text-[#5c5c5c] mt-0.5">{new Date(item.approved_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xs font-bold text-[#737373] font-mono">R$ {item.unit_price.toLocaleString('pt-BR')}</p>
                            </div>
                        </div>
                    ))}
                    {uniqueItems.length > 3 && (
                        <p className="text-[9px] text-center text-[#5c5c5c] pt-2">+ {uniqueItems.length - 3} outros itens</p>
                    )}
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
