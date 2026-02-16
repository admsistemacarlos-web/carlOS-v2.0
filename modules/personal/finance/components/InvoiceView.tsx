import React, { useMemo, useState } from 'react';
import { CreditCard, Transaction } from '../types/finance.types';
import { supabase } from '../../../../integrations/supabase/client';
import { Calendar, Lock, Unlock, ShoppingBag, FileText, CheckCircle2, Loader2 } from 'lucide-react';

interface InvoiceViewProps {
  card: CreditCard;
  transactions: Transaction[]; // Todas as transações deste cartão
  onClose: () => void;
  onUpdate: () => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ card, transactions, onClose, onUpdate }) => {
  const [closing, setClosing] = useState(false);

  // Calcula a fatura "aberta" baseada no dia de fechamento
  const currentInvoiceData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const closingDay = card.closing_day;

    // Se hoje for antes do dia de fechamento, a fatura é deste mês.
    // Se hoje for depois, a fatura aberta é a do próximo mês.
    // Lógica simplificada: Vamos pegar todas as transações não pagas que vencem neste ciclo.
    
    // Para simplificar a UX: Mostramos transações onde (Mês da Data) == (Mês Atual ou Próximo dependendo do dia)
    // Mas para MVP robusto: Mostramos todas as transações "pendentes" (is_locked = false) ordenadas por data.
    // E destacamos as que entrariam na "Próxima Fatura".

    // Filtrar apenas transações deste cartão
    const cardTransactions = transactions
      .filter(t => t.credit_card_id === card.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Separar por status
    const openTransactions = cardTransactions.filter(t => !t.is_locked);
    const totalOpen = openTransactions.reduce((acc, t) => acc + t.amount, 0);

    return { openTransactions, totalOpen };
  }, [card, transactions]);

  const handleCloseInvoice = async () => {
    if (currentInvoiceData.totalOpen <= 0) {
      alert("Não há valor para fechar nesta fatura.");
      return;
    }
    
    const confirm = window.confirm(`Deseja fechar a fatura no valor de R$ ${currentInvoiceData.totalOpen.toFixed(2)}? Isso gerará uma Conta a Pagar.`);
    if (!confirm) return;

    setClosing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      const today = new Date();
      // Data de vencimento baseada no due_day do cartão
      // Se hoje > closing_day, vencimento é no próximo mês (provavelmente)
      let dueMonth = today.getMonth();
      let dueYear = today.getFullYear();
      
      if (today.getDate() >= card.closing_day) {
        dueMonth++;
        if (dueMonth > 11) { dueMonth = 0; dueYear++; }
      }

      const dueDate = new Date(dueYear, dueMonth, card.due_day);

      // 1. Criar a Conta a Pagar (Bill)
      const { error: billError } = await supabase.from('bills').insert({
        description: `Fatura ${card.name} - ${today.toLocaleDateString('pt-BR', { month: 'long' })}`,
        amount: currentInvoiceData.totalOpen,
        due_date: dueDate.toISOString(),
        status: 'pending',
        user_id: user.id
      });

      if (billError) throw billError;

      // 2. Trancar as transações (opcional, mas recomendado para não somar 2x)
      const transactionIds = currentInvoiceData.openTransactions.map(t => t.id);
      if (transactionIds.length > 0) {
        await supabase
          .from('transactions')
          .update({ is_locked: true })
          .in('id', transactionIds);
      }

      alert("Fatura fechada com sucesso! Boleto gerado em 'Contas a Pagar'.");
      onUpdate();
      onClose(); // Fecha a drawer
    } catch (err: any) {
      alert("Erro ao fechar fatura: " + err.message);
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-background shadow-2xl z-[100] border-l border-border transform transition-transform animate-fade-in flex flex-col">
      {/* Header */}
      <div className="p-8 bg-card border-b border-border flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Detalhes do Cartão</p>
          <h2 className="text-3xl font-semibold text-foreground tracking-tighter">{card.name}</h2>
          <div className="flex gap-4 mt-4">
             <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
               <Calendar size={14} /> Fecha dia {card.closing_day}
             </div>
             <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
               <FileText size={14} /> Vence dia {card.due_day}
             </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
          <CheckCircle2 size={24} className="text-olive" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Card Summary */}
        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 mb-8">
           <p className="text-[10px] font-bold uppercase tracking-widest text-olive mb-1">Fatura Atual (Aberta)</p>
           <h3 className="text-4xl font-bold text-foreground tracking-tighter">
             R$ {currentInvoiceData.totalOpen.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
           </h3>
           <p className="text-xs text-muted-foreground mt-2">
             Limite disponível estimado: R$ {(card.limit_amount - currentInvoiceData.totalOpen).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
           </p>
        </div>

        {/* Transactions List */}
        <h4 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShoppingBag size={14} /> Lançamentos
        </h4>
        
        <div className="space-y-3">
          {currentInvoiceData.openTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10 italic">Nenhuma compra em aberto.</p>
          ) : (
            currentInvoiceData.openTransactions.map(t => (
              <div key={t.id} className="bg-card p-4 rounded-xl border border-border flex justify-between items-center shadow-sm">
                <div>
                   <p className="text-sm font-semibold text-foreground">{t.description}</p>
                   <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                      <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                      {t.installment_total && t.installment_total > 1 && (
                        <span className="bg-secondary px-1.5 rounded text-muted-foreground font-bold">
                          {t.installment_current}/{t.installment_total}
                        </span>
                      )}
                   </div>
                </div>
                <span className="font-bold text-foreground text-sm">
                  R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-card border-t border-border pb-10">
        <button 
          onClick={handleCloseInvoice}
          disabled={closing || currentInvoiceData.totalOpen === 0}
          className="w-full bg-coffee hover:bg-black text-white py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {closing ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
          {closing ? 'Processando...' : 'Fechar Fatura do Mês'}
        </button>
      </div>
    </div>
  );
};

export default InvoiceView;