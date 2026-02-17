import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteResource {
  id: string;
  quote_id: string;
  user_id: string;
  resource_type: 'link' | 'file' | 'note';
  title: string;
  description?: string;
  url?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  note_content?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateQuoteResourceInput {
  quote_id: string;
  resource_type: 'link' | 'file' | 'note';
  title: string;
  description?: string;
  url?: string;
  note_content?: string;
}

export interface UpdateQuoteResourceInput {
  title?: string;
  description?: string;
  url?: string;
  note_content?: string;
}

// ============================================================================
// HOOK: GET RESOURCES BY QUOTE
// ============================================================================

export function useQuoteResources(quoteId: string | undefined) {
  return useQuery({
    queryKey: ['quote_resources', quoteId],
    queryFn: async () => {
      if (!quoteId) return [];

      const { data, error } = await supabase
        .from('quote_resources')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as QuoteResource[];
    },
    enabled: !!quoteId,
  });
}

// ============================================================================
// HOOK: CREATE RESOURCE
// ============================================================================

export function useCreateQuoteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateQuoteResourceInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('quote_resources')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as QuoteResource;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['quote_resources', variables.quote_id] 
      });
    },
  });
}

// ============================================================================
// HOOK: UPDATE RESOURCE
// ============================================================================

export function useUpdateQuoteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      quoteId, 
      data 
    }: { 
      id: string; 
      quoteId: string; 
      data: UpdateQuoteResourceInput 
    }) => {
      const { error } = await supabase
        .from('quote_resources')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['quote_resources', variables.quoteId] 
      });
    },
  });
}

// ============================================================================
// HOOK: DELETE RESOURCE
// ============================================================================

export function useDeleteQuoteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      quoteId 
    }: { 
      id: string; 
      quoteId: string 
    }) => {
      const { error } = await supabase
        .from('quote_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['quote_resources', variables.quoteId] 
      });
    },
  });
}