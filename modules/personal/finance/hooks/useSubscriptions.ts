import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { Subscription } from '../types/finance.types';
import { SubscriptionBillSync } from '../services/SubscriptionBillSync';


export const useSubscriptions = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, credit_card:credit_cards(*), account:accounts(*)')
        .eq('user_id', user.id)
        .order('status', { ascending: true })
        .order('next_billing_date', { ascending: true });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Erro ao buscar assinaturas:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const addSubscription = useCallback(async (sub: Partial<Subscription>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({ ...sub, user_id: user.id });
      if (error) throw error;
      await fetchSubscriptions();
    } catch (err: any) {
      console.error('Erro ao adicionar assinatura:', err);
      throw err;
    }
  }, [user, fetchSubscriptions]);

  const updateSubscription = useCallback(async (id: string, updates: Partial<Subscription>) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      await fetchSubscriptions();
    } catch (err: any) {
      console.error('Erro ao atualizar assinatura:', err);
      throw err;
    }
  }, [fetchSubscriptions]);

  const deleteSubscription = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchSubscriptions();
    } catch (err: any) {
      console.error('Erro ao excluir assinatura:', err);
      throw err;
    }
  }, [fetchSubscriptions]);

  const toggleStatus = useCallback(async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await updateSubscription(id, { status: newStatus });
  }, [updateSubscription]);

  // Cálculos úteis
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trial');
  
  const monthlyTotal = activeSubscriptions.reduce((sum, sub) => {
    switch (sub.billing_cycle) {
      case 'weekly': return sum + (sub.amount * 4.33);
      case 'monthly': return sum + sub.amount;
      case 'quarterly': return sum + (sub.amount / 3);
      case 'semi_annual': return sum + (sub.amount / 6);
      case 'yearly': return sum + (sub.amount / 12);
      default: return sum + sub.amount;
    }
  }, 0);

  const yearlyTotal = monthlyTotal * 12;

  /**
 * Sincroniza assinaturas com bills (executa ao carregar a página)
 */
const syncWithBills = useCallback(async () => {
  try {
    await SubscriptionBillSync.syncAllSubscriptions();
  } catch (error) {
    console.error('Erro ao sincronizar assinaturas:', error);
  }
}, []);


// Sincroniza bills ao montar o componente
useEffect(() => {
  if (subscriptions.length > 0) {
    syncWithBills();
  }
}, [subscriptions.length, syncWithBills]);

  return {
  subscriptions,
  loading,
  refresh: fetchSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  toggleStatus,
  activeSubscriptions,
  monthlyTotal,
  yearlyTotal,
  syncWithBills, // ← ADICIONE ESTA LINHA
};
};