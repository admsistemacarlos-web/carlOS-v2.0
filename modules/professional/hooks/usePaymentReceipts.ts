import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import { AgencyPaymentReceipt } from '../types/agency.types';

const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();

export function usePaymentReceipts(clientId: string | undefined) {
  return useQuery({
    queryKey: ['payment-receipts', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('agency_payments')
        .select('*')
        .eq('client_id', clientId)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data as AgencyPaymentReceipt[];
    },
    enabled: !!clientId,
  });
}

export function useCreatePaymentReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      receiptData,
      clientId,
      file,
    }: {
      receiptData: Omit<AgencyPaymentReceipt, 'id' | 'user_id' | 'created_at' | 'file_url'>;
      clientId: string;
      file?: File | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      let file_url: string | null = null;
      if (file) {
        const sanitized = sanitizeFileName(file.name);
        const filePath = `${clientId}/receipts/${Date.now()}_${sanitized}`;
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
        .from('agency_payments')
        .insert([{ ...receiptData, client_id: clientId, user_id: user.id, file_url }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment-receipts', variables.clientId] });
    },
  });
}

export function useDeletePaymentReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fileUrl, clientId }: { id: string; fileUrl?: string | null; clientId: string }) => {
      const { error } = await supabase.from('agency_payments').delete().eq('id', id);
      if (error) throw error;
      if (fileUrl) {
        const urlParts = fileUrl.split('client-files/');
        if (urlParts.length > 1) {
          await supabase.storage.from('client-files').remove([urlParts[1]]);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment-receipts', variables.clientId] });
    },
  });
}
