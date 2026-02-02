
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import { AgencyQuote, AgencyQuoteItem, AgencyServiceCatalog } from '../types/agency.types';

const QUOTES_KEY = ['agency_quotes'];
const TEMPLATE_KEY = ['agency_proposal_template'];

// --- 1. CATÁLOGO DE SERVIÇOS ---
export function useServicesCatalog() {
  return useQuery({
    queryKey: ['agency_services_catalog'],
    queryFn: async () => {
      // Eduardo: Removido filtros 'active' e 'title' que causavam erro 400
      const { data, error } = await supabase
        .from('agency_services')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as AgencyServiceCatalog[];
    }
  });
}

// --- 2. GESTÃO DE PROPOSTAS (ORÇAMENTOS) ---
export function useQuotes() {
  return useQuery({
    queryKey: QUOTES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_quotes')
        .select('*, client:agency_clients(name, company_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AgencyQuote[];
    }
  });
}

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: ['agency_quote', id],
    queryFn: async () => {
      if (!id) return null;
      const { data: quote, error: quoteError } = await supabase
        .from('agency_quotes')
        .select('*, client:agency_clients(name, company_name)')
        .eq('id', id)
        .single();
      if (quoteError) throw quoteError;

      const { data: items, error: itemsError } = await supabase
        .from('agency_quote_items')
        .select('*')
        .eq('quote_id', id)
        .order('order_index', { ascending: true }); // Ordena corretamente ao buscar
      if (itemsError) throw itemsError;

      return { ...quote, items } as AgencyQuote;
    },
    enabled: !!id
  });
}

export function useSaveQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { quote: Partial<AgencyQuote>, items: Partial<AgencyQuoteItem>[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      const quoteData = {
        title: payload.quote.title,
        client_id: payload.quote.client_id,
        status: payload.quote.status,
        total_one_time: payload.quote.total_one_time,
        total_monthly: payload.quote.total_monthly,
        introduction_text: (payload.quote as any).introduction_text,
        strategy_text: (payload.quote as any).strategy_text,
        terms_conditions: (payload.quote as any).terms_conditions,
        user_id: user.id
      };

      let quoteId = payload.quote.id;

      if (quoteId) {
        const { error } = await supabase.from('agency_quotes').update(quoteData).eq('id', quoteId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('agency_quotes').insert([quoteData]).select().single();
        if (error) throw error;
        quoteId = data.id;
      }

      if (quoteId && payload.items.length > 0) {
        await supabase.from('agency_quote_items').delete().eq('quote_id', quoteId);
        
        const itemsToInsert = payload.items.map((item, index) => ({
          quote_id: quoteId,
          service_id: item.service_id,
          title: item.title,
          description: item.description,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_price: (item.unit_price || 0) * (item.quantity || 1), // Cálculo adicionado para evitar erro 23502
          charge_type: item.charge_type,
          order_index: item.order_index ?? index,
          user_id: user.id
        }));

        const { error: itemsError } = await supabase.from('agency_quote_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }
      return quoteId;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUOTES_KEY })
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agency_quotes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTES_KEY });
    },
  });
}

// --- 3. GESTÃO DO TEMPLATE (O SEU MODELO) ---
export function useProposalTemplate() {
  return useQuery({
    queryKey: TEMPLATE_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_proposal_templates')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });
}

export function useSaveTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      // Eduardo: Removemos o ID se ele for nulo/vazio para o banco gerar o UUID (Correção Erro 23502)
      const { id, ...dataWithoutId } = template;
      const payload = { ...dataWithoutId, user_id: user.id };
      
      if (id && id !== "") {
        const { error } = await supabase.from('agency_proposal_templates').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('agency_proposal_templates').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEMPLATE_KEY })
  });
}
