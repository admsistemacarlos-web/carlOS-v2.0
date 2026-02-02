
import React, { useState, useMemo, useEffect } from 'react';
import { useTransactions, useAccounts, useCreditCards } from '../hooks/useFinanceData';
import ConfirmDialog from '../components/ConfirmDialog';
import { Transaction } from '../types/finance.types';
import { 
  ArrowUpRight, ArrowDownLeft, Trash2, Pencil, 
  Lock, ShoppingBag, X, ArrowLeft, Calendar, Filter, Plus, 
  Search, MapPin, Tag, RefreshCcw, Landmark, PackageSearch, Copy, Download
} from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDateBr } from '../utils/dateHelpers';
import { exportToCSV } from '../utils/exportHelper';

// Definições de Período Predefinidos
type PeriodType = 'this_month' | 'last_month' | 'next_month' | 'all';

const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // --- Estados de Filtro ---
  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [searchText, setSearchText] = useState(''); 
  const [itemSearch, setItemSearch] = useState(''); 
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [accountIdFilter, setAccountIdFilter] = useState(searchParams.get('accountId') || '');

  // Sincroniza estado local com URL se mudar externamente
  useEffect(() => {
    const urlAccId = searchParams.get('accountId');
    if (urlAccId !== null) {
      setAccountIdFilter(urlAccId);
    }
  }, [searchParams]);

  // --- Controle de Datas para o Hook ---
  const { startDate, endDate, fetchAll } = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    if (period === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: start.toISOString(), endDate: todayEnd.toISOString(), fetchAll: false };
    }
    
    if (period === 'last_month') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { startDate: start.toISOString(), endDate: todayEnd.toISOString(), fetchAll: false };
    }

    if (period === 'next_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        return { startDate: start.toISOString(), endDate: end.toISOString(), fetchAll: false };
    }

    return { startDate: undefined, endDate: undefined, fetchAll: true };
  }, [period]);

  const { transactions, loading, refresh, setTransactions } = useTransactions({ startDate, endDate, fetchAll });
  const { accounts, refresh: refreshAccounts } = useAccounts();
  const { cards } = useCreditCards(); // Necessário para o Export Lookup

  // --- Modal Delete ---
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; transactionId: string | null; }>({ isOpen: false, transactionId: null });

  // --- Filtragem em Memória ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Filtro de Conta (Origem)
      if (accountIdFilter && t.account_id !== accountIdFilter) return false;

      // 2. Texto (Descrição Principal)
      if (searchText && !t.description.toLowerCase().includes(searchText.toLowerCase())) return false;
      
      // 3. NOVO: Filtro por Item Específico (Busca dentro da Nota Fiscal)
      if (itemSearch) {
        const hasItem = t.items?.some(item => 
          item.name.toLowerCase().includes(itemSearch.toLowerCase())
        );
        if (!hasItem) return false;
      }

      // 4. Categoria
      if (categoryFilter && !t.category.toLowerCase().includes(categoryFilter.toLowerCase())) return false;

      // 5. Local
      if (locationFilter && (!t.location || !t.location.toLowerCase().includes(locationFilter.toLowerCase()))) return false;

      // 6. Tag
      if (tagFilter) {
          if (!t.tags || t.tags.length === 0) return false;
          const hasTag = t.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()));
          if (!hasTag) return false;
      }

      return true;
    });
  }, [transactions, searchText, itemSearch, categoryFilter, locationFilter, tagFilter, accountIdFilter]);

  // --- LÓGICA DE SALDO DIÁRIO ---
  const groupedWithBalance = useMemo(() => {
    let anchorBalance = 0;
    if (accountIdFilter) {
      anchorBalance = accounts.find(a => a.id === accountIdFilter)?.balance || 0;
    } else {
      anchorBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
    }

    const sorted = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const groups: { date: string; items: Transaction[]; dayEndBalance: number }[] = [];
    let currentRollingBalance = anchorBalance;
    
    sorted.forEach((t) => {
      const dateKey = t.date.split('T')[0];
      let lastGroup = groups[groups.length - 1];

      if (!lastGroup || lastGroup.date !== dateKey) {
        groups.push({
          date: dateKey,
          items: [t],
          dayEndBalance: currentRollingBalance
        });
      } else {
        lastGroup.items.push(t);
      }

      if (t.type === 'income') {
        currentRollingBalance -= t.amount;
      } else {
        currentRollingBalance += t.amount;
      }
    });

    return groups.filter(group => {
       if (period === 'all') return true;
       const groupDate = new Date(group.date + 'T12:00:00');
       const now = new Date();
       
       if (period === 'this_month') {
         return groupDate.getMonth() === now.getMonth() && groupDate.getFullYear() === now.getFullYear();
       }
       if (period === 'last_month') {
         const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
         return groupDate.getMonth() === lastMonth.getMonth() && groupDate.getFullYear() === lastMonth.getFullYear();
       }
       if (period === 'next_month') {
         const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
         return groupDate.getMonth() === nextMonth.getMonth() && groupDate.getFullYear() === nextMonth.getFullYear();
       }
       return true;
    });
  }, [filteredTransactions, accounts, accountIdFilter, period]);

  const clearFilters = () => {
    setSearchText('');
    setItemSearch('');
    setCategoryFilter('');
    setLocationFilter('');
    setTagFilter('');
    setAccountIdFilter('');
    setSearchParams({});
  };

  const handleExport = () => {
    const dataToExport = filteredTransactions.map(t => {
      // 1. Definição do Nome da Fonte (Conta ou Cartão)
      let sourceName = 'Não Identificado';

      // Tentativa A: Colunas Raiz (Legado ou Simples)
      if (t.account_id) {
         const acc = accounts.find(a => a.id === t.account_id);
         if (acc) sourceName = acc.name;
      } 
      else if (t.credit_card_id) {
         const card = cards.find(c => c.id === t.credit_card_id);
         if (card) sourceName = card.name;
      }
      
      // Tentativa B: Deep Dive no array de Pagamentos (Se Raiz falhou)
      if ((sourceName === 'Não Identificado') && t.payments && t.payments.length > 0) {
         // Pega o primeiro pagamento (ou concatena se quiser ser muito específico, mas o primeiro basta para 99% dos casos)
         const mainPayment = t.payments[0];
         
         if (mainPayment.payment_method === 'account' && mainPayment.account_id) {
             const acc = accounts.find(a => a.id === mainPayment.account_id);
             if (acc) sourceName = acc.name;
         } 
         else if (mainPayment.payment_method === 'credit_card' && mainPayment.credit_card_id) {
             const card = cards.find(c => c.id === mainPayment.credit_card_id);
             if (card) sourceName = card.name;
         }
      }

      // 2. Definição de Status (Tradução amigável)
      // Prioriza status 'paid' ou booleano is_paid (cast to any for safety if is_paid not in interface)
      const isPaid = t.status === 'paid' || (t as any).is_paid === true;
      const statusLabel = isPaid ? 'Pago/Recebido' : 'Pendente';

      // 3. Definição de Tipo
      const typeLabel = t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência';

      return {
        Data: formatDateBr(t.date),
        Descrição: t.description,
        Categoria: t.category || 'Outros',
        Tipo: typeLabel,
        Valor: t.amount, // O helper exportToCSV formata isso
        'Conta/Origem': sourceName,
        Status: statusLabel,
        Tags: t.tags ? t.tags.join(', ') : ''
      };
    });

    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const filename = `extrato_completo_${dateStr}.csv`;
    // Headers devem bater com as chaves do objeto acima
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Conta/Origem', 'Status', 'Tags'];

    exportToCSV(dataToExport, filename, headers);
  };

  const hasActiveFilters = searchText || itemSearch || categoryFilter || locationFilter || tagFilter || accountIdFilter;

  const totalPeriod = filteredTransactions.reduce((acc, t) => {
      return t.type === 'expense' ? acc - t.amount : acc + t.amount;
  }, 0);

  const selectedAccountName = useMemo(() => {
    if (!accountIdFilter) return null;
    return accounts.find(a => a.id === accountIdFilter)?.name;
  }, [accountIdFilter, accounts]);

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors text-cappuccino">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-coffee tracking-tighter">
              {selectedAccountName ? `Extrato: ${selectedAccountName}` : 'Extrato Geral'}
            </h1>
            <p className="text-cappuccino text-xs font-bold uppercase tracking-widest mt-1">
              {filteredTransactions.length} registros • Fluxo: <span className={totalPeriod >= 0 ? 'text-olive' : 'text-terracotta'}>R$ {totalPeriod.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={handleExport}
              className="p-2.5 bg-white border border-stone-200 rounded-xl text-stone-400 hover:text-olive hover:border-olive/30 transition-colors"
              title="Exportar CSV"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={() => { refresh(); refreshAccounts(); }} 
              className="p-2.5 bg-white border border-stone-200 rounded-xl text-stone-400 hover:text-coffee transition-colors"
              title="Atualizar"
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={() => navigate('/personal/finance/transactions/new')} 
              className="bg-coffee text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Plus size={14} /> Novo
            </button>
        </div>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="bg-white p-5 rounded-[2rem] border border-stone-200 shadow-sm space-y-4">
        
        <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex bg-stone-100 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
                <button onClick={() => setPeriod('last_month')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all ${period === 'last_month' ? 'bg-white text-coffee shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Mês Passado</button>
                <button onClick={() => setPeriod('this_month')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all ${period === 'this_month' ? 'bg-white text-coffee shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Este Mês</button>
                <button onClick={() => setPeriod('next_month')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all ${period === 'next_month' ? 'bg-white text-coffee shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Próximo</button>
                <button onClick={() => setPeriod('all')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all ${period === 'all' ? 'bg-white text-coffee shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Tudo</button>
            </div>

            <div className="relative flex-1">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                <select 
                    value={accountIdFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAccountIdFilter(val);
                      if (val) setSearchParams({ accountId: val });
                      else setSearchParams({});
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-coffee outline-none focus:border-olive appearance-none cursor-pointer"
                >
                    <option value="">Todas as Contas (Origem)</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toLocaleString('pt-BR')})</option>
                    ))}
                </select>
            </div>

            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                <input 
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="Descrição da compra..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium text-coffee outline-none focus:border-olive transition-colors"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
                <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
                <input 
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    placeholder="Produto na nota (ex: Miojo)..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-olive transition-colors font-bold text-olive"
                />
            </div>
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
                <input 
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    placeholder="Categoria..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-olive transition-colors"
                />
            </div>
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
                <input 
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                    placeholder="Local..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-olive transition-colors"
                />
            </div>
            <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
                <input 
                    value={tagFilter}
                    onChange={e => setTagFilter(e.target.value)}
                    placeholder="Tag..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-olive transition-colors"
                />
            </div>
        </div>

        {hasActiveFilters && (
            <div className="flex justify-end pt-2 border-t border-stone-50">
                <button onClick={clearFilters} className="text-[10px] font-bold text-terracotta uppercase tracking-wider hover:underline flex items-center gap-1">
                    <X size={10} /> Limpar Filtros
                </button>
            </div>
        )}
      </div>

      {/* --- LISTAGEM --- */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-20 text-center text-cappuccino text-sm animate-pulse">Carregando transações...</div>
        ) : groupedWithBalance.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-stone-100 p-20 text-center shadow-sm">
            <Filter size={32} className="mx-auto text-stone-200 mb-4" />
            <p className="text-cappuccino text-sm italic">
              Nenhum registro encontrado para {selectedAccountName || 'esta seleção'}.
            </p>
          </div>
        ) : (
          groupedWithBalance.map((group) => (
            <div key={group.date} className="animate-fade-in">
                <div className="flex items-center gap-3 mb-2 ml-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-coffee whitespace-nowrap">
                        {formatDateBr(group.date)}
                    </h3>
                    
                    <span className="bg-stone-100 text-stone-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-stone-200 whitespace-nowrap shadow-sm">
                        Saldo: R$ {group.dayEndBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>

                    <div className="h-[1px] flex-1 bg-stone-200"></div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-stone-50">
                        {group.items.map((t) => (
                            <div 
                                key={t.id} 
                                onClick={() => navigate(`/personal/finance/edit/${t.id}`)}
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
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-cappuccino">
                                                {t.category}
                                            </span>
                                            {t.location && (
                                                <span className="text-[10px] text-stone-400 font-medium">
                                                    • {t.location}
                                                </span>
                                            )}
                                            {t.account?.name && (
                                                <span className="text-[9px] font-bold uppercase text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Landmark size={8} /> {t.account.name}
                                                </span>
                                            )}
                                            {itemSearch && t.items?.some(i => i.name.toLowerCase().includes(itemSearch.toLowerCase())) && (
                                                <span className="text-[9px] font-bold text-olive bg-olive/10 px-1.5 py-0.5 rounded flex items-center gap-1 border border-olive/20 animate-pulse">
                                                    <PackageSearch size={8} /> Inclui: {itemSearch}
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
                                                onClick={() => navigate(`/personal/finance/transactions/new?duplicateId=${t.id}`)}
                                                className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-coffee transition-colors"
                                                title="Duplicar"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/personal/finance/edit/${t.id}`)}
                                                className="p-1.5 hover:bg-stone-200 rounded-lg text-coffee transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, transactionId: t.id }); }}
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
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Excluir Lançamento?"
        message="Esta ação não pode ser desfeita. O saldo da conta será restaurado se necessário."
        onConfirm={async () => {
          if (!deleteConfirm.transactionId) return;
          const { error } = await supabase.from('transactions').delete().eq('id', deleteConfirm.transactionId);
          if (!error) {
            setTransactions(prev => prev.filter(t => t.id !== deleteConfirm.transactionId));
            setDeleteConfirm({ isOpen: false, transactionId: null });
            refresh();
            refreshAccounts();
          }
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, transactionId: null })}
      />
    </div>
  );
};

export default TransactionsPage;
