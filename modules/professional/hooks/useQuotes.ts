import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import { AgencyQuote } from '../types/agency.types';

// --- HOOK DE LISTAGEM (O que estava faltando) ---
export function useQuotes() {
  return useQuery({
    queryKey: ['agency_quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_quotes')
        .select(`
          *,
          client:agency_clients(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AgencyQuote[];
    }
  });
}

// --- HOOK DE DELETE (Geralmente necessário na listagem) ---
export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agency_quotes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency_quotes'] });
    }
  });
}

// --- HOOK DO TEMPLATE (A Ponte para o Modelo) ---
export function useProposalTemplate() {
  return useQuery({
    queryKey: ['proposal_template'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar template:', error);
        return null;
      }
      return data;
    }
  });
}

export function useSaveProposalTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      proposal_intro_default: string; 
      proposal_strategy_default: string; 
      proposal_terms_default: string; 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: existing } = await supabase
        .from('agency_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        return await supabase
          .from('agency_settings')
          .update(data)
          .eq('id', existing.id);
      } else {
        return await supabase
          .from('agency_settings')
          .insert({ ...data, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal_template'] });
      alert('Modelo salvo com sucesso!');
    },
    onError: (error) => {
      alert('Erro ao salvar modelo: ' + error.message);
    }
  });
}