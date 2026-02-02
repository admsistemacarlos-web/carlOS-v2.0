
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';

export interface ClientFile {
  id: string;
  client_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export function useClientFiles(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-files', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('agency_client_files')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ClientFile[];
    },
    enabled: !!clientId,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, clientId }: { file: File, clientId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      // 1. Upload para o Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${clientId}/${Date.now()}_${file.name}`; // Organiza por pasta do cliente
      
      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-files')
        .getPublicUrl(filePath);

      // 2. Salvar Metadados no Banco
      const { data, error: dbError } = await supabase
        .from('agency_client_files')
        .insert({
          client_id: clientId,
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-files', variables.clientId] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, fileUrl }: { fileId: string, fileUrl: string }) => {
      // 1. Remove do Banco
      const { error: dbError } = await supabase
        .from('agency_client_files')
        .delete()
        .eq('id', fileId);
        
      if (dbError) throw dbError;

      // 2. Tenta remover do Storage (Opcional, mas limpa espaço)
      // Extrai o path da URL
      const path = fileUrl.split('client-files/')[1];
      if (path) {
        await supabase.storage.from('client-files').remove([path]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-files'] });
    },
  });
}
