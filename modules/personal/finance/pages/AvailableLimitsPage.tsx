
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCards } from '../hooks/useFinanceData';
import { ArrowLeft, ShieldCheck, CreditCard as CardIcon } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { CardTransactionView } from '../types/finance.types';

const AvailableLimitsPage: React.FC = () => {
  const navigate = useNavigate();
  const { cards, loading: loadingCards } = useCards();
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setLoadingUsage(true);
        // Fetch credit card payments associated with unlocked transactions from the VIEW
        const { data, error } = await supabase
          .from('view_card_transactions_detailed')
          .select('credit_card_id, card_amount')
          .eq('is_locked', false);

        if (error) throw error;

        const map: Record<string, number> = {};
        
        (data as Partial<CardTransactionView>[]).forEach(item => {
          if (item.credit_card_id && item.card_amount) {
            const current = map[item.credit_card_id] || 0;
            map[item.credit_card_id] = current + item.card_amount;
          }
        });

        setUsageMap(map);
      } catch (err) {
        console.error("Error fetching usage data:", err);
      } finally {
        setLoadingUsage(false);
      }
    };

    fetchUsage();
  }, []);

  const loading = loadingCards || loadingUsage;

  const totalMetrics = cards.reduce((acc, card) => {
    const used = usageMap[card.id] || 0;
    const available = card.limit_amount - used;
    
    return {
      totalAvailable: acc.totalAvailable + available,
      totalLimit: acc.totalLimit + card.limit_amount,
      totalUsed: acc.totalUsed + used
    };
  }, { totalAvailable: 0, totalLimit: 0, totalUsed: 0 });

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors text-cappuccino"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-coffee tracking-tighter">Limites Disponíveis</h1>
            <p className="text-cappuccino text-xs font-bold uppercase tracking-widest mt-1">Poder de Compra</p>
          </div>
        </div>
      </div>

      {/* Resumo Principal */}
      <div className="bg-olive/5 rounded-[2rem] p-8 border border-olive/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-olive mb-2">Total Disponível para Compra</p>
          {loading ? (
             <div className="h-10 w-48 bg-stone-200 animate-pulse rounded-lg"/>
          ) : (
            <h2 className="text-4xl font-bold text-coffee tracking-tighter">
              R$ {totalMetrics.totalAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
          )}
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-olive/10 shadow-sm">
          <ShieldCheck className="text-olive" size={24} />
          <div className="text-right">
             <p className="text-[9px] font-bold text-cappuccino uppercase">Limite Global</p>
             <p className="text-sm font-bold text-coffee">R$ {totalMetrics.totalLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Lista de Cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
           [1, 2].map(i => <div key={i} className="h-40 bg-stone-100 rounded-[2rem] animate-pulse" />)
        ) : cards.length === 0 ? (
           <div className="col-span-full text-center text-cappuccino py-10">Nenhum cartão cadastrado.</div>
        ) : (
          cards.map(card => {
            const used = usageMap[card.id] || 0;
            const available = card.limit_amount - used;
            const percentageUsed = card.limit_amount > 0 ? Math.min((used / card.limit_amount) * 100, 100) : 0;
            
            return (
              <div 
                key={card.id} 
                onClick={() => navigate(`/personal/finance/cards/${card.id}`)}
                className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-stone-50 rounded-xl text-coffee group-hover:bg-olive group-hover:text-white transition-colors">
                      <CardIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-coffee">{card.name}</h3>
                      <p className="text-[10px] font-bold text-cappuccino uppercase tracking-wider">Limite: R$ {card.limit_amount.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10">
                   <div className="flex justify-between text-sm mb-2">
                     <span className="text-cappuccino font-medium">Usado</span>
                     <span className="text-coffee font-bold">R$ {used.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                   </div>
                   
                   {/* Progress Bar */}
                   <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden mb-4">
                     <div 
                       className={`h-full rounded-full transition-all duration-500 ${percentageUsed > 90 ? 'bg-terracotta' : 'bg-coffee'}`}
                       style={{ width: `${percentageUsed}%` }}
                     />
                   </div>

                   <div className="flex justify-between items-end pt-2 border-t border-stone-50">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-olive">Disponível</span>
                     <span className="text-2xl font-bold text-olive">R$ {available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AvailableLimitsPage;
