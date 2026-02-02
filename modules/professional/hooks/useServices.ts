
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import { AgencyServiceCatalog } from '../types/agency.types';

export function useServices() {
  return useQuery({
    queryKey: ['agency_services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_services')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true }); // Ordenação explícita por name

      if (error) throw error;
      return data as AgencyServiceCatalog[];
    }
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newService: Partial<AgencyServiceCatalog>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado.");

      const { data, error } = await supabase
        .from('agency_services')
        .insert([{ ...newService, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency_services'] });
    }
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<AgencyServiceCatalog>) => {
      const { data, error } = await supabase
        .from('agency_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency_services'] });
    }
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agency_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency_services'] });
    }
  });
}
