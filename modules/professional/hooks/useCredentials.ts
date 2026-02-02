
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';

export interface AgencyCredential {
  id: string;
  client_id: string;
  platform: string;
  username: string;
  password_text: string;
}

export function useCredentials(clientId: string | undefined) {
  return useQuery({
    queryKey: ['credentials', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('agency_credentials')
        .select('*')
        .eq('client_id', clientId);
      if (error) throw error;
      return data as AgencyCredential[];
    },
    enabled: !!clientId, // Só busca se tiver ID do cliente
  });
}

export function useCreateCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCred: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase
        .from('agency_credentials')
        .insert([{ ...newCred, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['credentials', variables.client_id] });
    },
  });
}

export function useDeleteCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agency_credentials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
  });
}
