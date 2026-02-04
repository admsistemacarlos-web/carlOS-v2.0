import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../../integrations/supabase/client';
import { Transaction, Account, Bill, CreditCard, Subscription } from '../types/finance.types';

// --- Generic Helpers ---
function useTable<T>(tableName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: result, error: supabaseError } = await supabase
        .from(tableName)
        .select('*');

      if (supabaseError) throw supabaseError;
      setData(result as T[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  

  return { data, loading, error, refetch: fetchData, setData };
}

// --- Specific Hooks with CRUD ---

interface TransactionFilterOptions {
  startDate?: string;
  endDate?: string;
  fetchAll?: boolean; 
}

export const useTransactions = (options: TransactionFilterOptions = {}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('transactions')
        .select('*, items:transaction_items(*), payments:transaction_payments(*)')
        .is('deleted_at', null)  // ✅ SOFT DELETE: Ignora transações "deletadas"
        .order('date', { ascending: false });

      if (!options.fetchAll) {
        let start = options.startDate;
        let end = options.endDate;

        if (!start || !end) {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          start = firstDay.toISOString();
          end = lastDay.toISOString();
        }

        if (end.length === 10) {
            end = `${end}T23:59:59.999Z`;
        }

        query = query.gte('date', start).lte('date', end);
      }

      const { data, error } = await query;
      if (error) throw error;

      const uniqueMap = new Map();
      (data || []).forEach((t: any) => {
        if (!uniqueMap.has(t.id)) {
          uniqueMap.set(t.id, t);
        }
      });
      
      const uniqueTransactions = Array.from(uniqueMap.values());
      setTransactions(uniqueTransactions as Transaction[]);
    } catch (err: any) {
      console.error('Erro ao buscar transações:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [options.startDate, options.endDate, options.fetchAll]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const addTransaction = useCallback(async (transactionData: Partial<Transaction>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      // LÓGICA ESPECIAL PARA TRANSFERÊNCIA
      if (transactionData.type === 'transfer' && transactionData.account_id && transactionData.destination_account_id) {
        const transferId = crypto.randomUUID();
        
        const payloadOut = {
          ...transactionData,
          user_id: user.id,
          type: 'expense',
          category: 'Transferência',
          description: `Saída: ${transactionData.description}`,
          tags: [...(transactionData.tags || []), `transfer_${transferId}`]
        };
        delete (payloadOut as any).destination_account_id;
        delete (payloadOut as any).payments;

        const payloadIn = {
          ...transactionData,
          user_id: user.id,
          account_id: transactionData.destination_account_id,
          type: 'income',
          category: 'Transferência',
          description: `Entrada: ${transactionData.description}`,
          tags: [...(transactionData.tags || []), `transfer_${transferId}`]
        };
        delete (payloadIn as any).destination_account_id;
        delete (payloadIn as any).payments;

        const { error } = await supabase.from('transactions').insert([payloadOut, payloadIn]);
        if (error) throw error;
        
        await fetchTransactions();
        return { success: true };
      }

      // Lógica Normal (Receita/Despesa)
      const { payments, items, ...transData } = transactionData;
      const { data, error } = await supabase.from('transactions').insert([{...transData, user_id: user.id}]).select().single();
      if (error) throw error;
      
      if (data) await fetchTransactions(); 
      return data;
    } catch (err) { throw err; }
  }, [fetchTransactions]);

  // ✅ SOFT DELETE com verificação de período fechado
  const deleteTransaction = useCallback(async (id: string) => {
    // 1. Verifica se a transação está travada (período fechado)
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('is_locked, description')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      throw new Error('Erro ao verificar transação: ' + fetchError.message);
    }

    if (transaction?.is_locked) {
      throw new Error(
        `A transação "${transaction.description}" pertence a um período fechado e não pode ser excluída. ` +
        `Crie uma transação de ajuste no período atual para corrigir.`
      );
    }

    // 2. SOFT DELETE: marca como excluída em vez de deletar
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
    
    // 3. Remove da lista local (atualização visual imediata)
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  // ✅ NOVO: Função para restaurar transação deletada
  const restoreTransaction = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: null })
      .eq('id', id);
    
    if (error) throw error;
    await fetchTransactions();
  }, [fetchTransactions]);

  return { 
    transactions, 
    loading, 
    error, 
    refresh: fetchTransactions, 
    addTransaction, 
    deleteTransaction,
    restoreTransaction, // ✅ Nova função exposta
    setTransactions 
  };
};

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .order('name', { ascending: true });
        
      if (accountsError) throw accountsError;

      // ✅ Busca saldo calculado da view corrigida
      const { data: balanceData } = await supabase
        .from('view_account_balances')
        .select('account_id, current_balance');

      const uniqueAccounts = (accountsData || []).map((acc: any) => {
          const balanceRecord = balanceData?.find((b: any) => b.account_id === acc.id);
          return { ...acc, balance: balanceRecord ? Number(balanceRecord.current_balance) : 0 };
      });
      
      setAccounts(uniqueAccounts as Account[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
      await fetchAccounts();
    } catch (err: any) {
      console.error("Erro ao excluir conta:", err);
      throw err;
    }
  }, [fetchAccounts]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
  const { error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
  await fetchAccounts(); // Recarrega a lista
}, [fetchAccounts]);

return { 
  accounts, 
  loading, 
  error, 
  refresh: fetchAccounts,
  deleteAccount,    // ✅ Mantenha esta linha (já existia)
  updateAccount     // ✅ E adicione esta
};
};

export const useCards = () => {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('credit_cards').select('*').order('name', { ascending: true });
    setCards(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  return { cards, loading, refresh: fetchCards };
};

export const useBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('bills').select('*').order('due_date', { ascending: true });
    setBills(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const deleteBill = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;
      await fetchBills();
    } catch (err: any) {
      console.error("Erro ao excluir conta a pagar:", err);
      throw err;
    }
  }, [fetchBills]);

  return { bills, loading, refresh: fetchBills, deleteBill };
};

// --- HOOK DE CATEGORIAS PADRONIZADAS ---
export const useCategorySuggestions = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [itemCategories, setItemCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: transCats } = await supabase.rpc('get_unique_transaction_categories');
      if (transCats) setCategories(transCats.map((c: any) => c.category).filter(Boolean));

      const { data: itemCats } = await supabase.rpc('get_unique_item_categories');
      if (itemCats) setItemCategories(itemCats.map((c: any) => c.item_category).filter(Boolean));
    };

    fetchCategories();
  }, []);

  return { categories, itemCategories };
};

export interface ItemSuggestion {
  name: string;
  category: string;
}

export const useItemSuggestions = () => {
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data } = await supabase
        .from('transaction_items')
        .select('name, item_category')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (data) {
        const uniqueItems = new Map<string, string>();
        data.forEach(item => {
          const normalizedName = item.name.trim();
          if (!uniqueItems.has(normalizedName)) {
            uniqueItems.set(normalizedName, item.item_category || 'Outros');
          }
        });
        setSuggestions(Array.from(uniqueItems.entries()).map(([name, category]) => ({ name, category })));
      }
    };
    fetchSuggestions();
  }, []);

  return { suggestions };
};

// ✅ NOVO: Hook para gerenciar fechamento de período
export const usePeriodLocks = () => {
  const [locks, setLocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('account_period_locks')
      .select('*, account:accounts(name)')
      .order('period_end_date', { ascending: false });
    setLocks(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLocks(); }, [fetchLocks]);

  const closePeriod = useCallback(async (
    accountId: string, 
    periodEndDate: string, 
    confirmedBalance: number
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não logado");

    // 1. Busca saldo calculado atual
    const { data: balanceData } = await supabase
      .from('view_account_balances')
      .select('current_balance')
      .eq('account_id', accountId)
      .single();

    const calculatedBalance = balanceData?.current_balance || 0;
    let adjustmentTransactionId = null;

    // 2. Se houver diferença, cria transação de ajuste
    const difference = confirmedBalance - Number(calculatedBalance);
    if (Math.abs(difference) > 0.01) {
      const adjustmentType = difference > 0 ? 'income' : 'expense';
      const { data: adjustment, error: adjError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: accountId,
          description: `Ajuste de reconciliação - ${periodEndDate}`,
          amount: Math.abs(difference),
          type: adjustmentType,
          category: 'Ajuste',
          date: periodEndDate,
          status: 'paid',
          is_locked: true
        })
        .select()
        .single();

      if (adjError) throw adjError;
      adjustmentTransactionId = adjustment?.id;
    }

    // 3. Trava todas as transações até a data
    const { error: lockError } = await supabase
      .from('transactions')
      .update({ is_locked: true })
      .eq('account_id', accountId)
      .lte('date', periodEndDate)
      .is('deleted_at', null);

    if (lockError) throw lockError;

    // 4. Registra o fechamento
    const { error: insertError } = await supabase
      .from('account_period_locks')
      .insert({
        user_id: user.id,
        account_id: accountId,
        period_end_date: periodEndDate,
        confirmed_balance: confirmedBalance,
        calculated_balance: calculatedBalance,
        adjustment_transaction_id: adjustmentTransactionId
      });

    if (insertError) throw insertError;

    await fetchLocks();
    return { success: true, adjustment: difference };
  }, [fetchLocks]);

  return { locks, loading, refresh: fetchLocks, closePeriod };
};

export const useCreditCards = useCards;
export const useSubscriptions = () => useTable<Subscription>('subscriptions');