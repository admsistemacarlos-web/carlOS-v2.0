import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import { AgencyContract } from '../types/agency.types';

const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();

export function useContracts(clientId: string | undefined) {
  return useQuery({
    queryKey: ['contracts', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('agency_contracts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AgencyContract[];
    },
    enabled: !!clientId,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contractData,
      clientId,
      file,
    }: {
      contractData: Omit<AgencyContract, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'file_url'>;
      clientId: string;
      file?: File | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      let file_url: string | null = null;
      if (file) {
        const sanitized = sanitizeFileName(file.name);
        const filePath = `${clientId}/contracts/${Date.now()}_${sanitized}`;
        const { error: uploadError } = await supabase.storage
          .from('client-files')
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('client-files')
          .getPublicUrl(filePath);
        file_url = publicUrl;
      }

      const { data, error } = await supabase
        .from('agency_contracts')
        .insert([{ ...contractData, client_id: clientId, user_id: user.id, file_url }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.clientId] });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      clientId,
      updates,
      file,
    }: {
      id: string;
      clientId: string;
      updates: Partial<AgencyContract>;
      file?: File | null;
    }) => {
      let file_url = updates.file_url;
      if (file) {
        const sanitized = sanitizeFileName(file.name);
        const filePath = `${clientId}/contracts/${Date.now()}_${sanitized}`;
        const { error: uploadError } = await supabase.storage
          .from('client-files')
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('client-files')
          .getPublicUrl(filePath);
        file_url = publicUrl;
      }
      const { data, error } = await supabase
        .from('agency_contracts')
        .update({ ...updates, file_url })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.clientId] });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fileUrl, clientId }: { id: string; fileUrl?: string | null; clientId: string }) => {
      const { error } = await supabase.from('agency_contracts').delete().eq('id', id);
      if (error) throw error;
      if (fileUrl) {
        const urlParts = fileUrl.split('client-files/');
        if (urlParts.length > 1) {
          await supabase.storage.from('client-files').remove([urlParts[1]]);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.clientId] });
    },
  });
}
