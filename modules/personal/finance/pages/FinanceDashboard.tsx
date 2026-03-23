import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions, useAccounts, useCards, useBills } from '../hooks/useFinanceData';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { supabase } from '../../../../integrations/supabase/client';
import {
  Wallet, CreditCard, RefreshCcw, Plus,
  ArrowUpRight, ArrowDownLeft, Lock, ShoppingBag, ShieldCheck,
  Filter, Pencil, Trash2, Receipt, ChevronLeft, ChevronRight, Calendar, Copy, Repeat
} from 'lucide-react';
import { Transaction, Account, Bill } from '../types/finance.types';
import ConfirmDialog from '../components/ConfirmDialog';
import UpcomingAlerts from '../components/UpcomingAlerts';
import InvoicePaymentDialog from '../components/modals/InvoicePaymentDialog';
import { formatDateBr } from '../utils/dateHelpers';

// ─── Hero Card (Saldo Atual) ────────────────────────────────────────────────
const HeroCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}> = ({ title, value, subtitle, icon, loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="w-full bg-primary text-primary-foreground p-8 rounded-[2rem] flex items-center justify-between shadow-sm hover:opacity-90 transition-all active:scale-[0.99] group overflow-hidden relative"
  >
    <div className="text-left relative z-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-60 mb-3">
        {title}
      </p>
      {loading ? (
        <div className="h-10 w-40 bg-primary-foreground/10 animate-pulse rounded-lg" />
      ) : (
        <h2 className="text-4xl lg:text-5xl font-medium tracking-tighter leading-none">
          {value}
        </h2>
      )}
      <p className="text-[11px] opacity-50 font-medium mt-3">{subtitle}</p>
    </div>
    <div className="absolute right-8 opacity-[0.07] pointer-events-none">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 96, strokeWidth: 1 })}
    </div>
  </button>
);

// ─── Cash Flow Summary ───────────────────────────────────────────────────────
const CashFlowSummary: React.FC<{
  income: number;
  expense: number;
  loading?: boolean;
}> = ({ income, expense, loading }) => {
  const result = income - expense;
  const isPositive = result >= 0;

  const fmt = (n: number) => `R$ ${Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex items-center gap-6 px-1 h-12">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 w-28 bg-secondary animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-6 px-1 flex-wrap">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Receitas</p>
        <p className="text-sm font-bold text-foreground">{fmt(income)}</p>
      </div>
      <span className="text-border text-lg select-none">·</span>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Despesas</p>
        <p className="text-sm font-bold text-destructive">{fmt(expense)}</p>
      </div>
      <span className="text-border text-lg select-none">·</span>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Resultado</p>
        <p className={`text-sm font-bold ${isPositive ? 'text-foreground' : 'text-destructive'}`}>
          {isPositive ? '+' : '−'} {fmt(result)}
        </p>
      </div>
    </div>
  );
};

// ─── Secondary Card ──────────────────────────────────────────────────────────
const SecondaryCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  iconColor?: string;
  loading?: boolean;
  onClick?: () => void;
}> = ({ title, value, icon, iconColor = 'text-muted-foreground', loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="w-full bg-card p-5 rounded-2xl border border-border flex items-start justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.98] group text-left"
  >
    <div className="flex-1 pr-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">{title}</p>
      {loading ? (
        <div className="h-6 w-20 bg-secondary animate-pulse rounded-md" />
      ) : (
        <p className="text-base font-bold text-foreground tracking-tight">{value}</p>
      )}
    </div>
    <div className={`p-2 rounded-xl bg-secondary border border-border flex-shrink-0 ${iconColor}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
    </div>
  </button>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [viewDate, setViewDate] = useState(new Date());

  const { startDate, endDate } = useMemo(() => {
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }, [viewDate]);

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const resetToToday = () => setViewDate(new Date());

  const formattedDate = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(viewDate);

  const { transactions, loading: loadingTransactions, refresh: refreshTransactions, setTransactions } = useTransactions({ startDate, endDate });
  const { accounts, loading: loadingAccounts, refresh: refreshAccounts } = useAccounts();
  const { cards, loading: loadingCards, refresh: refreshCards } = useCards();
  const { bills, loading: loadingBills, refresh: refreshBills } = useBills();
  const { subscriptions, loading: loadingSubscriptions, activeSubscriptions, monthlyTotal } = useSubscriptions();

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    transactionId: string | null;
  }>({ isOpen: false, transactionId: null });

  const [payingBill, setPayingBill] = useState<Bill | null>(null);

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

  const handleNew = () => navigate('/personal/finance/transactions/new');

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

      setTransactions(prev => prev.filter(t => t.id !== id));

      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;

      if (transactionToDelete.account_id) {
        setTimeout(refreshAccounts, 500);
      }
      refreshTransactions();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
      setTransactions(backup);
      refreshTransactions();
    }
  };

  const stats = useMemo(() => {
    const uniqueAccountsMap = new Map();
    accounts.forEach(a => {
      if (!uniqueAccountsMap.has(a.id)) uniqueAccountsMap.set(a.id, a);
    });
    const uniqueAccounts = Array.from(uniqueAccountsMap.values()) as Account[];
    const totalBalance = uniqueAccounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);

    const uniqueTransactionsMap = new Map();
    transactions.forEach(t => {
      if (!uniqueTransactionsMap.has(t.id)) uniqueTransactionsMap.set(t.id, t);
    });
    const uniqueTransactions = Array.from(uniqueTransactionsMap.values()) as Transaction[];

    let income = 0;
    let expense = 0;
    let cardSpend = 0;

    uniqueTransactions.forEach(t => {
      const val = Number(t.amount);
      if (t.type === 'income') {
        income += val;
      } else if (t.type === 'expense') {
        expense += val;
        if (t.credit_card_id) cardSpend += val;
      }
    });

    const totalLimits = cards.reduce((acc, card) => acc + card.limit_amount, 0);

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

  const groupedDashboardTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    stats.uniqueTransactions.forEach(t => {
      const dateKey = t.date.split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return sortedKeys.map(dateKey => ({ date: dateKey, items: groups[dateKey] }));
  }, [stats.uniqueTransactions]);

  const formatDateHeader = (dateString: string) => {
    const [y, m, d] = dateString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj.getTime() === today.getTime()) return 'Hoje';
    const weekDay = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    return `${formatDateBr(dateString)} (${weekDay})`;
  };

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 animate-fade-in pb-20">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tighter">Visão Geral</h1>
          <p className="text-muted-foreground text-xs font-medium tracking-wide mt-1">Sua saúde financeira em tempo real.</p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm flex-1 lg:flex-none justify-between lg:justify-start">
            <button onClick={prevMonth} className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2 px-4 min-w-[140px] justify-center">
              <Calendar size={14} className="text-muted-foreground" />
              <span className="text-sm font-bold text-foreground capitalize">{formattedDate}</span>
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={resetToToday}
            className="px-4 py-2.5 bg-secondary hover:bg-accent text-muted-foreground font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors"
          >
            Hoje
          </button>

          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-all active:scale-95 ml-auto"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Lançar</span>
          </button>
        </div>
      </div>

      {/* HERO: Saldo Atual */}
      <HeroCard
        title="Saldo Atual"
        value={fmt(stats.totalBalance)}
        subtitle="em todas as contas"
        icon={<Wallet />}
        loading={loadingAccounts}
        onClick={() => navigate('/personal/finance/transactions')}
      />

      {/* CASH FLOW DO MÊS */}
      <CashFlowSummary
        income={stats.income}
        expense={stats.expense}
        loading={loadingTransactions}
      />

      {/* CARDS SECUNDÁRIOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SecondaryCard
          title="Gasto Cartão"
          value={fmt(stats.cardSpend)}
          icon={<CreditCard />}
          loading={loadingTransactions}
          onClick={() => navigate('/personal/finance/cards')}
        />
        <SecondaryCard
          title="Contas Pendentes"
          value={fmt(stats.totalBillsPending)}
          icon={<Receipt />}
          iconColor="text-destructive"
          loading={loadingBills}
          onClick={() => navigate('/personal/finance/bills')}
        />
        <SecondaryCard
          title="Assinaturas"
          value={`${fmt(monthlyTotal)}/mês`}
          icon={<Repeat />}
          loading={loadingSubscriptions}
          onClick={() => navigate('/personal/finance/subscriptions')}
        />
        <SecondaryCard
          title="Limite Total"
          value={fmt(stats.totalLimits)}
          icon={<ShieldCheck />}
          loading={loadingCards}
          onClick={() => navigate('/personal/finance/limits')}
        />
      </div>

      {/* ALERTAS DE VENCIMENTO */}
      <UpcomingAlerts
        bills={bills}
        subscriptions={subscriptions}
        onPayBill={setPayingBill}
      />

      {/* EXTRATO */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h3 className="font-bold text-foreground text-sm uppercase tracking-widest flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            Movimentações de {formattedDate}
          </h3>
          <button
            onClick={() => navigate('/personal/finance/transactions')}
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Filtros Avançados
          </button>
        </div>

        {loadingTransactions ? (
          <div className="p-20 text-center text-muted-foreground text-sm animate-pulse bg-card rounded-[2rem] border border-border">
            Carregando dados do período...
          </div>
        ) : groupedDashboardTransactions.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground text-sm italic bg-card rounded-[2rem] border border-border shadow-sm">
            Nenhuma movimentação registrada em {formattedDate}.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedDashboardTransactions.map((group) => (
              <div key={group.date} className="animate-fade-in">
                <div className="flex items-center gap-3 mb-2 ml-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {formatDateHeader(group.date)}
                  </h3>
                  <div className="h-[1px] flex-1 bg-border" />
                </div>

                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="divide-y divide-border">
                    {group.items.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleEdit(t)}
                        className={`group flex items-center justify-between py-3 px-4 hover:bg-accent transition-colors cursor-pointer ${t.is_locked ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                            {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground text-sm">{t.description}</p>
                              {t.is_locked && <Lock size={12} className="text-muted-foreground" />}
                              {(t.items && t.items.length > 0) && <ShoppingBag size={12} className="text-muted-foreground" />}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {t.category}
                              </span>
                              {t.location && (
                                <span className="text-[10px] text-muted-foreground/60 font-medium">
                                  · {t.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`font-bold text-sm ${t.type === 'income' ? 'text-foreground' : 'text-destructive'}`}>
                            {t.type === 'expense' ? '− ' : '+ '}
                            R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>

                          {!t.is_locked && (
                            <div className="hidden group-hover:flex gap-1" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleDuplicate(t, e)}
                                className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                title="Duplicar"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                                className="p-1.5 hover:bg-secondary rounded-lg text-foreground transition-colors"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={(e) => handleDelete(t.id, e)}
                                className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
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

      {payingBill && (
        <InvoicePaymentDialog
          isOpen={true}
          onClose={() => setPayingBill(null)}
          onSuccess={() => { refreshBills(); setPayingBill(null); }}
          bill={payingBill}
        />
      )}

      <button
        onClick={() => navigate('/personal/finance/transactions/new')}
        className="fixed bottom-8 right-8 bg-primary hover:opacity-80 text-primary-foreground w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-95 transition-all"
        title="Nova Movimentação"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default FinanceDashboard;
