import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ProfessionalResource {
  id: string;
  user_id: string;
  resource_type: 'link' | 'note';
  title: string;
  description?: string;
  url?: string;
  note_content?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProfessionalResourceInput {
  resource_type: 'link' | 'note';
  title: string;
  description?: string;
  url?: string;
  note_content?: string;
}

export interface UpdateProfessionalResourceInput {
  title?: string;
  description?: string;
  url?: string;
  note_content?: string;
}

// ============================================================================
// HOOK: GET ALL RESOURCES
// ============================================================================

export function useProfessionalResources() {
  return useQuery({
    queryKey: ['professional_resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProfessionalResource[];
    },
  });
}

// ============================================================================
// HOOK: CREATE RESOURCE
// ============================================================================

export function useCreateProfessionalResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProfessionalResourceInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('professional_resources')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProfessionalResource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional_resources'] });
    },
  });
}

// ============================================================================
// HOOK: UPDATE RESOURCE
// ============================================================================

export function useUpdateProfessionalResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: UpdateProfessionalResourceInput 
    }) => {
      const { error } = await supabase
        .from('professional_resources')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional_resources'] });
    },
  });
}

// ============================================================================
// HOOK: DELETE RESOURCE
// ============================================================================

export function useDeleteProfessionalResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('professional_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional_resources'] });
    },
  });
}