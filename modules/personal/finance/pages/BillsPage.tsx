
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBills } from '../hooks/useFinanceData';
import { 
  Plus, Calendar, AlertCircle, CheckCircle2, ArrowLeft, 
  Wallet, Trash2, Pencil, Filter, TrendingDown, Clock, Repeat,
  ChevronLeft, ChevronRight, LayoutGrid, CalendarDays
} from 'lucide-react';
import { Bill } from '../types/finance.types';
import InvoicePaymentDialog from '../components/modals/InvoicePaymentDialog';
import BillFormModal from '../components/modals/BillFormModal';
import InstallmentDetailsModal from '../components/modals/InstallmentDetailsModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { parseLocalDate, formatDateBr } from '../utils/dateHelpers';

type PeriodType = 'month' | 'quarter' | 'semester' | 'year';

const getTypeLabel = (type?: string) => {
  const labels: Record<string, { label: string; color: string }> = {
    'fixed': { label: 'Fixa', color: 'text-muted-foreground' }, 
    'variable': { label: 'Variável', color: 'text-muted-foreground' },
    'temporary': { label: 'Temp', color: 'text-muted-foreground' },
  };
  return labels[type || 'variable'];
};

const BillsPage: React.FC = () => {
  const navigate = useNavigate();
  const { bills, loading, refresh, deleteBill } = useBills();

  // --- CONTROLE DE PERÍODO ---
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  
  // --- ESTADOS DE MODAL ---
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [billToPay, setBillToPay] = useState<Bill | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; billId: string | null }>({
    isOpen: false,
    billId: null
  });
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState<Bill[]>([]);

  // --- LÓGICA DE DATAS (O Coração da Performance) ---
  const dateRange = useMemo(() => {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    let start: Date;
    let end: Date;

    switch (periodType) {
      case 'quarter':
        const quarterStartMonth = Math.floor(month / 3) * 3;
        start = new Date(year, quarterStartMonth, 1);
        end = new Date(year, quarterStartMonth + 3, 0);
        break;
      case 'semester':
        const semesterStartMonth = month < 6 ? 0 : 6;
        start = new Date(year, semesterStartMonth, 1);
        end = new Date(year, semesterStartMonth + 6, 0);
        break;
      case 'year':
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31);
        break;
      case 'month':
      default:
        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 0);
        break;
    }
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }, [periodType, referenceDate]);

  const navigatePeriod = (direction: 'next' | 'prev') => {
    const d = new Date(referenceDate);
    const amount = direction === 'next' ? 1 : -1;

    switch (periodType) {
      case 'month': d.setMonth(d.getMonth() + amount); break;
      case 'quarter': d.setMonth(d.getMonth() + (amount * 3)); break;
      case 'semester': d.setMonth(d.getMonth() + (amount * 6)); break;
      case 'year': d.setFullYear(d.getFullYear() + amount); break;
    }
    setReferenceDate(d);
  };

  const getPeriodLabel = () => {
    if (periodType === 'year') return referenceDate.getFullYear().toString();
    if (periodType === 'month') return referenceDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (periodType === 'quarter') {
      const q = Math.floor(referenceDate.getMonth() / 3) + 1;
      return `${q}º Trimestre de ${referenceDate.getFullYear()}`;
    }
    const s = referenceDate.getMonth() < 6 ? '1º' : '2º';
    return `${s} Semestre de ${referenceDate.getFullYear()}`;
  };

  // --- FILTRAGEM ---
  const filteredBills = useMemo(() => {
    return bills
      .filter(b => {
        const dueDate = new Date(b.due_date.split('T')[0] + 'T12:00:00');
        const isInRange = dueDate >= dateRange.start && dueDate <= dateRange.end;
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        return isInRange && matchesStatus;
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [bills, dateRange, statusFilter]);

  // Estatísticas do Período Selecionado
  const stats = useMemo(() => {
    const periodBills = bills.filter(b => {
      const dueDate = new Date(b.due_date.split('T')[0] + 'T12:00:00');
      return dueDate >= dateRange.start && dueDate <= dateRange.end;
    });

    const pending = periodBills.filter(b => b.status === 'pending').reduce((acc, b) => acc + b.amount, 0);
    const paid = periodBills.filter(b => b.status === 'paid').reduce((acc, b) => acc + b.amount, 0);
    const overdue = periodBills.filter(b => b.status === 'overdue').reduce((acc, b) => acc + b.amount, 0);
    const overdueCount = periodBills.filter(b => b.status === 'overdue').length;

    return { pending, paid, overdue, overdueCount };
  }, [bills, dateRange]);

  const groupedBills = useMemo(() => {
    const groups: { [key: string]: Bill[] } = {};
    filteredBills.forEach(bill => {
      const dateKey = parseLocalDate(bill.due_date);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(bill);
    });
    return Object.keys(groups).map(date => ({ date, items: groups[date] }));
  }, [filteredBills]);

  // --- HANDLERS ---
  const handlePayClick = (bill: Bill) => { setBillToPay(bill); setIsPaymentOpen(true); };
  const handleEditClick = (bill: Bill) => { setBillToEdit(bill); setIsFormOpen(true); };
  const handleDeleteClick = (id: string) => { setDeleteConfirm({ isOpen: true, billId: id }); };
  const confirmDelete = async () => {
    if (deleteConfirm.billId) {
      await deleteBill(deleteConfirm.billId);
      setDeleteConfirm({ isOpen: false, billId: null });
      refresh();
    }
  };

  const formatDateHeader = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (dateObj.getTime() === today.getTime()) return { text: 'Hoje', isToday: true, isPast: false };
    if (dateObj < today) return { text: formatDateBr(dateString), isToday: false, isPast: true };
    return { text: formatDateBr(dateString), isToday: false, isPast: false };
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tighter">Extrato de Contas</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Gestão Cronológica</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Seletor de Tipo de Período */}
          <div className="flex bg-secondary p-1 rounded-xl">
            {(['month', 'quarter', 'semester', 'year'] as PeriodType[]).map((type) => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  periodType === type ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-muted-foreground'
                }`}
              >
                {type === 'month' ? 'Mês' : type === 'quarter' ? 'Tri' : type === 'semester' ? 'Sem' : 'Ano'}
              </button>
            ))}
          </div>

          {/* Navegador de Data */}
          <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
            <button onClick={() => navigatePeriod('prev')} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2 px-3 min-w-[140px] justify-center">
              <CalendarDays size={14} className="text-olive" />
              <span className="text-xs font-bold text-foreground capitalize whitespace-nowrap">{getPeriodLabel()}</span>
            </div>
            <button onClick={() => navigatePeriod('next')} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <button 
            onClick={() => navigate('/personal/finance/transactions/new')}
            className="bg-coffee hover:bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all ml-auto lg:ml-0"
          >
            <Plus size={14} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Cards de Resumo Dinâmicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm group hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Pendente no Período</p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-foreground">R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            <Clock size={18} className="text-muted-foreground group-hover:text-muted-foreground transition-colors" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-[2rem] border border-red-100 shadow-sm group hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-800 mb-2">Atrasado no Período</p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-red-700">R$ {stats.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            <AlertCircle size={18} className="text-red-300 group-hover:text-red-400 transition-colors" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-[2rem] border border-emerald-100 shadow-sm group hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold uppercase tracking-widest text-olive mb-2">Pago no Período</p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-olive">R$ {stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            <CheckCircle2 size={18} className="text-emerald-200 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>

      {/* Filtros de Status */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
            { id: 'all', label: 'Todos os Lançamentos' },
            { id: 'pending', label: 'Pendentes' },
            { id: 'overdue', label: 'Atrasadas' },
            { id: 'paid', label: 'Pagas' }
        ].map(filter => (
            <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${
                    statusFilter === filter.id 
                    ? 'bg-stone-800 text-white border-stone-800 shadow-md scale-105' 
                    : 'bg-card text-muted-foreground border-border hover:bg-secondary'
                }`}
            >
                {filter.label}
            </button>
        ))}
      </div>

      {/* LISTA AGRUPADA */}
      {loading ? (
        <div className="p-20 text-center text-muted-foreground animate-pulse bg-card rounded-[2rem] border border-border">Calculando lançamentos...</div>
      ) : groupedBills.length === 0 ? (
        <div className="p-20 text-center text-muted-foreground italic bg-card rounded-[2rem] border border-dashed border-border">
          Nenhuma conta encontrada para o período selecionado.
        </div>
      ) : (
        <div className="space-y-8">
          {groupedBills.map((group) => {
            const dateInfo = formatDateHeader(group.date);
            return (
              <div key={group.date} className="animate-fade-in">
                <div className="flex items-center gap-3 mb-3 ml-2">
                  <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${dateInfo.isToday ? 'text-blue-600' : dateInfo.isPast ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {dateInfo.text}
                  </div>
                  <div className="h-[1px] flex-1 bg-secondary"></div>
                </div>

                <div className="space-y-2">
                  {group.items.map((bill) => (
                    <div 
                      key={bill.id} 
                      className={`group flex items-center justify-between py-3.5 px-5 rounded-2xl border transition-all hover:shadow-sm ${
                        bill.status === 'paid' 
                          ? 'bg-secondary/50 border-border opacity-60' 
                          : 'bg-card border-border hover:border-border'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${
                          bill.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                          bill.status === 'overdue' ? 'bg-red-50 text-red-600' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {bill.status === 'paid' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                        </div>

                        <div className="min-w-0">
                          <h3 className={`font-bold text-sm truncate ${bill.status === 'paid' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {bill.description}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                              {bill.category}
                            </span>
                            {bill.is_installment && (
                              <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {bill.installment_number}/{bill.total_installments}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className={`text-sm font-bold ${
                          bill.status === 'paid' ? 'text-emerald-600' : 
                          bill.status === 'overdue' ? 'text-red-600' : 
                          'text-foreground'
                        }`}>
                          R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        
                        <div className="hidden group-hover:flex gap-1">
                          <button onClick={() => handleEditClick(bill)} className="p-2 hover:bg-secondary text-muted-foreground hover:text-muted-foreground rounded-lg transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => handleDeleteClick(bill.id)} className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                          {bill.status !== 'paid' && (
                            <button onClick={() => handlePayClick(bill)} className="px-3 py-1.5 bg-primary hover:bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all active:scale-95">Pagar</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modais */}
      {billToPay && <InvoicePaymentDialog isOpen={isPaymentOpen} bill={billToPay} onClose={() => setIsPaymentOpen(false)} onSuccess={() => { refresh(); setIsPaymentOpen(false); }} />}
      {isFormOpen && <BillFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={() => { refresh(); setIsFormOpen(false); }} billToEdit={billToEdit} />}
      <InstallmentDetailsModal isOpen={installmentModalOpen} onClose={() => setInstallmentModalOpen(false)} installments={selectedInstallments} onPayInstallment={(id) => { const billToPay = bills.find(b => b.id === id); if (billToPay) { setBillToPay(billToPay); setIsPaymentOpen(true); setInstallmentModalOpen(false); } }} />
      <ConfirmDialog isOpen={deleteConfirm.isOpen} title="Excluir Conta?" message="Deseja realmente excluir este lançamento? Esta ação é irreversível." onConfirm={confirmDelete} onCancel={() => setDeleteConfirm({ isOpen: false, billId: null })} />
    </div>
  );
};

export default BillsPage;
