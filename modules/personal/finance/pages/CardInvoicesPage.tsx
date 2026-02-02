
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../../integrations/supabase/client';
import { CreditCard, Transaction, Bill, CardTransactionView } from '../types/finance.types';
import { InvoiceService } from '../../../../services/InvoiceService';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  ArrowLeft, 
  Calendar, 
  Lock, 
  Unlock, 
  CreditCard as CardIcon, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle,
  History,
  Loader2
} from 'lucide-react';
import InvoicePaymentDialog from '../components/modals/InvoicePaymentDialog';
import { formatDateBr } from '../utils/dateHelpers';

const CardInvoicesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [card, setCard] = useState<CreditCard | null>(null);
  // We use Transaction type for compatibility, but 'amount' will be the payment amount
  const [openTransactions, setOpenTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);

  useEffect(() => {
    if (id && user) fetchData();
  }, [id, user]);

  const fetchData = async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      // 1. Fetch Card
      const { data: cardData } = await supabase.from('credit_cards').select('*').eq('id', id).single();
      setCard(cardData);

      // 2. Fetch Open Transactions (From VIEW)
      // Filter by card ID and not locked (not yet in an invoice)
      const { data: viewData, error: viewError } = await supabase
        .from('view_card_transactions_detailed')
        .select('*')
        .eq('credit_card_id', id)
        .eq('is_locked', false)
        .order('date', { ascending: false });

      if (viewError) throw viewError;

      // ADAPTER: Map view data to Transaction type for UI compatibility
      const adaptedTransactions: Transaction[] = (viewData as CardTransactionView[]).map((item) => ({
        id: item.transaction_id, // Important: Use transaction_id for locking
        description: item.description,
        amount: item.card_amount, // Critical: Use card portion amount
        date: item.date,
        category: item.category || 'Outros',
        type: 'expense',
        status: 'paid',
        payment_date: item.date,
        // Adapter specific fields
        is_installment: (item.installments || 1) > 1,
        installment_total: item.installments,
        is_locked: item.is_locked,
        credit_card_id: item.credit_card_id,
        user_id: item.user_id,
        // Defaults to satisfy TS
        account_id: null,
        items: [],
        payments: [],
        tags: []
      }));

      setOpenTransactions(adaptedTransactions);

      // 3. Fetch History (Bills)
      if (cardData) {
        const { data: billsData } = await supabase
          .from('bills')
          .select('*')
          .ilike('description', `%${cardData.name}%`)
          .order('due_date', { ascending: false });
        setBills(billsData || []);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalOpen = useMemo(() => openTransactions.reduce((acc, t) => acc + t.amount, 0), [openTransactions]);

  const handleCloseInvoice = async () => {
    if (!card || !user) return;
    if (totalOpen <= 0) return alert("Fatura zerada.");
    
    const confirm = window.confirm(`Confirmar fechamento da fatura no valor de R$ ${totalOpen.toFixed(2)}?`);
    if (!confirm) return;

    setClosing(true);
    try {
      // InvoiceService.closeInvoice uses the list of transactions to lock them in the DB.
      // adaptedTransactions contains the real transaction IDs, so this works correctly.
      await InvoiceService.closeInvoice(card, totalOpen, openTransactions, user.id);
      await fetchData(); 
      alert("Fatura fechada com sucesso!");
    } catch (err: any) {
      alert("Erro ao fechar: " + err.message);
    } finally {
      setClosing(false);
    }
  };

  const nextClosingDate = useMemo(() => {
    if (!card) return new Date();
    const today = new Date();
    let target = new Date(today.getFullYear(), today.getMonth(), card.closing_day);
    if (today.getDate() >= card.closing_day) {
      target.setMonth(target.getMonth() + 1);
    }
    return target;
  }, [card]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-olive" size={32} /></div>;
  if (!card) return <div>Cartão não encontrado</div>;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#4A4036] p-4 md:p-8 pb-24 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-coffee flex items-center gap-2">
            <CardIcon className="text-olive" />
            {card.name}
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-cappuccino mt-1">Gestão de Faturas</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUNA 1: FATURA ABERTA (ATUAL) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Unlock size={18} className="text-olive" />
            <h2 className="text-lg font-bold text-coffee uppercase tracking-wide">Fatura Aberta</h2>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-premium border border-olive/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <ShoppingBag size={80} className="text-olive" />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cappuccino mb-2">Total Atual</p>
            <h3 className="text-4xl font-bold text-coffee tracking-tighter mb-1">
              R$ {totalOpen.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-olive font-medium mb-6 flex items-center gap-1">
              <Calendar size={12} />
              Próximo fechamento: {nextClosingDate.toLocaleDateString('pt-BR')}
            </p>

            <button 
              onClick={handleCloseInvoice}
              disabled={closing || totalOpen === 0}
              className="w-full bg-olive hover:bg-black text-white py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {closing ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
              {closing ? 'Fechando...' : 'Fechar Fatura Agora'}
            </button>
          </div>

          {/* Lista de Transações da Fatura Aberta */}
          <div className="bg-white rounded-[2rem] p-6 border border-stone-100 min-h-[200px]">
            <h4 className="text-xs font-bold text-cappuccino uppercase tracking-widest mb-4">Lançamentos Pendentes</h4>
            <div className="space-y-3">
              {openTransactions.length === 0 ? (
                <p className="text-center text-stone-400 text-sm py-4 italic">Nenhuma compra em aberto.</p>
              ) : (
                openTransactions.slice(0, 10).map((t, idx) => (
                  <div key={`${t.id}-${idx}`} className="flex justify-between items-center py-2 border-b border-stone-50 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-coffee truncate">{t.description}</p>
                      <p className="text-[10px] text-stone-400">{formatDateBr(t.date)}</p>
                    </div>
                    <span className="text-sm font-bold text-coffee">
                      R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
              {openTransactions.length > 10 && (
                 <p className="text-center text-[10px] text-olive font-bold uppercase cursor-pointer mt-2 pt-2 border-t border-stone-50">
                   + {openTransactions.length - 10} outros lançamentos
                 </p>
              )}
            </div>
          </div>
        </div>

        {/* COLUNA 2: HISTÓRICO DE FATURAS (FECHADAS) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <History size={18} className="text-coffee" />
            <h2 className="text-lg font-bold text-coffee uppercase tracking-wide">Histórico</h2>
          </div>

          <div className="space-y-4">
            {bills.map(bill => (
              <div key={bill.id} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 group hover:border-olive/30 transition-all">
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <p className="text-sm font-bold text-coffee">{bill.description}</p>
                    {bill.status === 'paid' ? (
                       <CheckCircle2 size={14} className="text-olive" />
                    ) : (
                       <AlertCircle size={14} className="text-terracotta" />
                    )}
                  </div>
                  <p className="text-[10px] uppercase font-bold text-cappuccino tracking-widest">
                    Vencimento: {formatDateBr(bill.due_date)}
                  </p>
                </div>

                <div className="text-center sm:text-right">
                  <p className={`text-xl font-bold tracking-tight mb-2 ${bill.status === 'paid' ? 'text-olive' : 'text-coffee'}`}>
                    R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  
                  {bill.status === 'pending' ? (
                    <button 
                      onClick={() => setPaymentBill(bill)}
                      className="px-4 py-2 bg-coffee text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg active:scale-95"
                    >
                      Pagar
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-olive/10 text-olive rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Pago
                    </span>
                  )}
                </div>
              </div>
            ))}

            {bills.length === 0 && (
              <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-stone-200">
                <p className="text-cappuccino text-sm italic">Nenhuma fatura fechada encontrada no histórico.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {paymentBill && (
        <InvoicePaymentDialog 
          isOpen={!!paymentBill}
          bill={paymentBill}
          onClose={() => setPaymentBill(null)}
          onSuccess={() => {
            fetchData();
            alert("Pagamento registrado com sucesso!");
          }}
        />
      )}
    </div>
  );
};

export default CardInvoicesPage;
