import { supabase } from '../../../../integrations/supabase/client';

/**
 * Serviço de sincronização entre Subscriptions e Bills
 * Gerencia a criação automática de bills e atualização de next_billing_date
 */
export const SubscriptionBillSync = {
  
  /**
   * Força a geração da próxima bill de uma assinatura
   * Útil quando o trigger não executou ou para forçar manualmente
   */
  async syncSubscription(subscriptionId: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('generate_next_subscription_bill', {
      p_subscription_id: subscriptionId
    });
    
    if (error) {
      console.error('Erro ao sincronizar assinatura:', error);
      throw error;
    }
    
    return data; // Retorna o ID da bill criada ou null
  },

  /**
   * Sincroniza todas as assinaturas ativas que precisam de bills
   * (bills com vencimento nos próximos 7 dias)
   */
  async syncAllSubscriptions(): Promise<any> {
    const { data, error } = await supabase.rpc('generate_all_pending_subscription_bills');
    
    if (error) {
      console.error('Erro ao sincronizar todas assinaturas:', error);
      throw error;
    }
    
    return data;
  },

  /**
   * Busca a bill pendente mais próxima de uma assinatura
   */
  async getPendingBill(subscriptionId: string) {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true })
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  /**
   * Busca todas as bills de uma assinatura (histórico)
   */
  async getSubscriptionBills(subscriptionId: string) {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('due_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Verifica integridade do sistema (para debug/manutenção)
   * Retorna lista de assinaturas com status de suas bills
   */
  async checkIntegrity() {
    const { data, error } = await supabase.rpc('check_subscription_bills_integrity');
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Calcula estatísticas de uma assinatura
   */
  async getSubscriptionStats(subscriptionId: string) {
    const bills = await this.getSubscriptionBills(subscriptionId);
    
    const paidCount = bills.filter(b => b.status === 'paid').length;
    const totalPaid = bills
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + parseFloat(String(b.amount)), 0);
    
    return {
      totalBills: bills.length,
      paidCount,
      pendingCount: bills.filter(b => b.status === 'pending').length,
      overdueCount: bills.filter(b => b.status === 'overdue').length,
      totalPaid,
      averageAmount: paidCount > 0 ? totalPaid / paidCount : 0
    };
  }
};