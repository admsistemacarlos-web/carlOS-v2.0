
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions, useAccounts, useCards, useBills } from '../hooks/useFinanceData';
import { supabase } from '../../../../integrations/supabase/client';
import { 
  Wallet, TrendingUp, TrendingDown, CreditCard, RefreshCcw, Plus, 
  ArrowUpRight, ArrowDownLeft, Lock, ShoppingBag, ShieldCheck, 
  Clock, Filter, Pencil, Trash2, Receipt, ChevronLeft, ChevronRight, Calendar, Copy
} from 'lucide-react';
import { Transaction, Account } from '../types/finance.types';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDateBr } from '../utils/dateHelpers';

const SummaryCard: React.FC<{ 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color: string; 
  loading?: boolean;
  onClick?: () => void;
}> = ({ title, value, icon, color, loading, onClick }) => (
  <button 
    onClick={onClick}
    disabled={loading}
    className="w-full bg-white p-6 rounded-[2rem] border border-stone-100 flex items-center justify-between shadow-sm hover:shadow-lg transition-all active:scale-[0.98] group min-h-[8rem]"
  >
    <div className="flex-1 text-left pr-2">
      <p className="text-cappuccino text-[10px] font-bold uppercase tracking-widest mb-2">
        {title}
      </p>
      {loading ? (
        <div className="h-8 w-24 bg-stone-100 animate-pulse rounded-lg"></div>
      ) : (
        <h2 className="text-xl sm:text-2xl font-medium text-coffee tracking-tighter break-words">
          {value}
        </h2>
      )}
    </div>
    <div className={`hidden sm:block p-4 rounded-2xl bg-cream border border-stone-50 ml-2 flex-shrink-0 transition-colors group-hover:bg-opacity-50 ${color}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
    </div>
  </button>
);

const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // --- Controle de Data Global ---
  const [viewDate, setViewDate] = useState(new Date());

  // Calcula startDate e endDate do mês selecionado para o Hook
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { 
      startDate: start.toISOString(), 
      endDate: end.toISOString() 
    };
  }, [viewDate]);

  // Funções de Navegação de Data
  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const resetToToday = () => setViewDate(new Date());

  // Formatador para o Header
  const formattedDate = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(viewDate);

  // --- Hooks de Dados ---
  // Passamos as datas para o hook filtrar no Backend
  const { transactions, loading: loadingTransactions, refresh: refreshTransactions, setTransactions } = useTransactions({ startDate, endDate });
  const { accounts, loading: loadingAccounts, refresh: refreshAccounts } = useAccounts(); // Contas são sempre saldo atual
  const { cards, loading: loadingCards, refresh: refreshCards } = useCards(); // Cartões trazem limites globais
  const { bills, loading: loadingBills, refresh: refreshBills } = useBills(); // Contas a pagar trazem tudo

  // Estado para Confirmação de Exclusão
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    transactionId: string | null;
  }>({ isOpen: false, transactionId: null });

  const handleEdit = (t: Transaction) => {
    if (t.is_locked) {
        alert("Transação bloqueada (provavelmente paga ou em fatura fechada).");
        return;
    }
    navigate(`/personal/finance/edit/${t.id}`);
  };

  const handleDuplicate = (t: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/personal/finance/transactions/new?duplicateId=${t.id}`);
  };

  const handleNew = () => {
    navigate('/personal/finance/transactions/new');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirm({ isOpen: true, transactionId: id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirm.transactionId;
    if (!id) return;
    
    setDeleteConfirm({ isOpen: false, transactionId: null });
    const backup = [...transactions];
    
    try {
      const transactionToDelete = transactions.find(t => t.id === id);
      if (!transactionToDelete) return;
      
      // Atualização Otimista
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      
      // Recarrega contas para pegar o saldo atualizado pelo Trigger do banco
      if (transactionToDelete.account_id) {
        setTimeout(refreshAccounts, 500); // Pequeno delay para garantir que o trigger rodou
      }
      refreshTransactions();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
      setTransactions(backup);
      refreshTransactions();
    }
  };

  // --- ESTATÍSTICAS (CORREÇÃO CRÍTICA DE DUPLICIDADE) ---
  const stats = useMemo(() => {
    // 1. Deduplicação Defensiva de Contas
    const uniqueAccountsMap = new Map();
    accounts.forEach(a => {
        if (!uniqueAccountsMap.has(a.id)) {
            uniqueAccountsMap.set(a.id, a);
        }
    });
    const uniqueAccounts = Array.from(uniqueAccountsMap.values()) as Account[];
    
    // Saldo Total
    const totalBalance = uniqueAccounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);

    // 2. Deduplicação Defensiva de Transações
    const uniqueTransactionsMap = new Map();
    transactions.forEach(t => {
        if (!uniqueTransactionsMap.has(t.id)) {
            uniqueTransactionsMap.set(t.id, t);
        }
    });
    const uniqueTransactions = Array.from(uniqueTransactionsMap.values()) as Transaction[];

    // Cálculos de Receita e Despesa
    let income = 0;
    let expense = 0;
    let cardSpend = 0;

    uniqueTransactions.forEach(t => {
        const val = Number(t.amount);
        
        if (t.type === 'income') {
            income += val;
        } else if (t.type === 'expense') {
            expense += val;
            
            // Gasto com Cartão
            if (t.credit_card_id) {
                cardSpend += val;
            }
        }
    });

    // 4. Limite Total (Global)
    const totalLimits = cards.reduce((acc, card) => acc + card.limit_amount, 0);

    // 5. Contas a Pagar (Pendentes)
    const relevantBills = bills.filter(b => {
        if (b.status === 'paid') return false; 
        const dueDate = new Date(b.due_date);
        const endOfViewMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
        return dueDate <= endOfViewMonth;
    });

    const billGroups = new Set();
    const uniqueBills = relevantBills.filter(b => {
      if (b.is_installment && b.installment_group_id) {
        if (billGroups.has(b.installment_group_id)) return false;
        billGroups.add(b.installment_group_id);
      }
      return true;
    });

    const totalBillsPending = uniqueBills.reduce((acc, b) => acc + b.amount, 0);

    return { totalBalance, income, expense, cardSpend, totalLimits, totalBillsPending, uniqueTransactions };
  }, [accounts, transactions, cards, bills, viewDate]);

  // --- Lógica de Agrupamento para Lista ---
  const groupedDashboardTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    stats.uniqueTransactions.forEach(t => {
      const dateKey = t.date.split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return sortedKeys.map(dateKey => ({
      date: dateKey,
      items: groups[dateKey]
    }));
  }, [stats.uniqueTransactions]);

  // Helpers Visuais
  const formatDateHeader = (dateString: string) => {
    // Usando formatDateBr para garantir DD/MM/AAAA correto e complementar com dia da semana
    const [y, m, d] = dateString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (dateObj.getTime() === today.getTime()) return 'Hoje';
    
    // Formato personalizado com a data correta
    const weekDay = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    return `${formatDateBr(dateString)} (${weekDay})`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* HEADER & DATE SELECTOR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-coffee tracking-tighter">Visão Geral</h1>
          <p className="text-cappuccino text-xs font-medium tracking-wide mt-1">Sua saúde financeira em tempo real.</p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Seletor de Mês */}
            <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1 shadow-sm flex-1 lg:flex-none justify-between lg:justify-start">
                <button onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-coffee transition-colors">
                    <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2 px-4 min-w-[140px] justify-center">
                    <Calendar size={14} className="text-olive" />
                    <span className="text-sm font-bold text-coffee capitalize">{formattedDate}</span>
                </div>
                <button onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-coffee transition-colors">
                    <ChevronRight size={18} />
                </button>
            </div>

            <button 
                onClick={resetToToday}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-500 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors"
                title="Voltar para Hoje"
            >
                Hoje
            </button>

            <button 
                onClick={handleNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-coffee text-white rounded-xl shadow-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 ml-auto"
            >
                <Plus size={14} /> <span className="hidden sm:inline">Lançar</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Saldo Atual" 
          value={`R$ ${stats.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<Wallet />}
          color="text-olive"
          loading={loadingAccounts}
          onClick={() => navigate('/personal/finance/accounts')}
        />
        <SummaryCard 
          title={`Gasto Cartão (${formattedDate})`}
          value={`R$ ${stats.cardSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<CreditCard />}
          color="text-coffee"
          loading={loadingTransactions}
          onClick={() => navigate('/personal/finance/cards')}
        />
        <SummaryCard 
          title="Contas Pendentes (Mês+)" 
          value={`R$ ${stats.totalBillsPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<Receipt />}
          color="text-terracotta"
          loading={loadingBills}
          onClick={() => navigate('/personal/finance/bills')}
        />
        <SummaryCard 
          title="Limite Total Cartões" 
          value={`R$ ${stats.totalLimits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<ShieldCheck />}
          color="text-emerald-600"
          loading={loadingCards}
          onClick={() => navigate('/personal/finance/limits')}
        />
      </div>

      {/* Extrato Filtrado */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
            <div>
                 <h3 className="font-bold text-coffee text-sm uppercase tracking-widest flex items-center gap-2">
                    <Filter size={14} className="text-olive"/> Movimentações de {formattedDate}
                 </h3>
            </div>
            <button 
                onClick={() => navigate('/personal/finance/transactions')}
                className="text-[10px] font-bold uppercase tracking-widest text-olive hover:underline"
            >
                Ver Filtros Avançados
            </button>
        </div>

        {loadingTransactions ? (
          <div className="p-20 text-center text-cappuccino text-sm animate-pulse bg-white rounded-[2rem] border border-stone-100">Carregando dados do período...</div>
        ) : groupedDashboardTransactions.length === 0 ? (
          <div className="p-20 text-center text-cappuccino text-sm italic bg-white rounded-[2rem] border border-stone-100 shadow-sm">
            Nenhuma movimentação registrada em {formattedDate}.
          </div>
        ) : (
           <div className="space-y-6">
               {groupedDashboardTransactions.map((group) => (
                   <div key={group.date} className="animate-fade-in">
                     <div className="flex items-center gap-3 mb-2 ml-2">
                       <h3 className="text-xs font-bold uppercase tracking-widest text-coffee">
                         {formatDateHeader(group.date)}
                       </h3>
                       <div className="h-[1px] flex-1 bg-stone-200"></div>
                     </div>

                     <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                       <div className="divide-y divide-stone-50">
                         {group.items.map((t) => (
                           <div 
                             key={t.id} 
                             onClick={() => handleEdit(t)}
                             className={`group flex items-center justify-between py-3 px-4 hover:bg-stone-50 transition-colors cursor-pointer ${t.is_locked ? 'opacity-60' : ''}`}
                           >
                             <div className="flex items-center gap-3">
                               <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-olive/10 text-olive' : 'bg-terracotta/10 text-terracotta'}`}>
                                 {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                               </div>
                               <div>
                                 <div className="flex items-center gap-2">
                                   <p className="font-semibold text-coffee text-sm">{t.description}</p>
                                   {t.is_locked && <Lock size={12} className="text-stone-400" />}
                                   {(t.items && t.items.length > 0) && <ShoppingBag size={12} className="text-olive" />}
                                 </div>
                                 <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-bold uppercase tracking-wider text-cappuccino">
                                     {t.category}
                                   </span>
                                   {t.location && (
                                       <span className="text-[10px] text-stone-400 font-medium">
                                           • {t.location}
                                       </span>
                                   )}
                                 </div>
                               </div>
                             </div>

                             

                             <div className="flex items-center gap-4">
                               <span className={`font-bold text-sm ${t.type === 'income' ? 'text-olive' : 'text-terracotta'}`}>
                                 {t.type === 'expense' ? '- ' : '+ '}
                                 R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                               </span>

                               {!t.is_locked && (
                                <div className="hidden group-hover:flex gap-1" onClick={e => e.stopPropagation()}>
                                  <button 
                                    onClick={(e) => handleDuplicate(t, e)}
                                    className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-coffee transition-colors"
                                    title="Duplicar"
                                  >
                                    <Copy size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                                    className="p-1.5 hover:bg-stone-200 rounded-lg text-coffee transition-colors"
                                    title="Editar"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => handleDelete(t.id, e)}
                                    className="p-1.5 hover:bg-terracotta/10 rounded-lg text-terracotta transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                 ))}
           </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Excluir Lançamento?"
        message="Esta ação não pode ser desfeita. Se o lançamento estiver pago, o saldo da conta será restaurado automaticamente."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, transactionId: null })}
      />

      <button
        onClick={() => navigate('/personal/finance/transactions/new')}
        className="fixed bottom-8 right-8 bg-coffee hover:bg-black text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-95 transition-all animate-bounce-slow"
        title="Nova Movimentação"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default FinanceDashboard;
