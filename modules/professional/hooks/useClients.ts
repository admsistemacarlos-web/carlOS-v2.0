import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Verifique se o caminho do supabase está correto para seu projeto
import { supabase } from '../../../integrations/supabase/client';
import { AgencyClient } from '../types/agency.types';

const CLIENTS_QUERY_KEY = ['agency_clients'];

// --- FUNÇÃO AJUDANTE: Upload de Imagem ---
async function uploadLogo(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`; // Cria um nome único por usuário
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('agency-logos') // Nome do bucket que criamos
    .upload(filePath, file);

  if (uploadError) {
    throw new Error('Erro ao fazer upload da logo');
  }

  // Pega a URL pública para salvar no banco
  const { data } = supabase.storage.from('agency-logos').getPublicUrl(filePath);
  return data.publicUrl;
}
// -----------------------------------------

export function useClients() {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return data as AgencyClient[];
    },
    staleTime: 1000 * 60 * 5, 
  });
}

// Tipo auxiliar para a mutação (dados + arquivo opcional)
type ClientMutationData = {
  data: Partial<AgencyClient>;
  logoFile?: File | null; // Arquivo novo (opcional)
};

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data: clientData, logoFile }: ClientMutationData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      let finalData = { ...clientData, user_id: user.id };

      // Se tiver arquivo novo, faz upload antes
      if (logoFile) {
        const logoUrl = await uploadLogo(logoFile, user.id);
        finalData = { ...finalData, logo_url: logoUrl };
      }

      // Remove campos que não devem ir pro insert (como id se vier vazio)
      const { id, created_at, updated_at, ...dataToSave } = finalData as any;

      const { data, error } = await supabase
        .from('agency_clients')
        .insert([dataToSave])
        .select()
        .single();

      if (error) throw error;
      return data as AgencyClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, logoFile }: { id: string } & ClientMutationData) => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error("Usuário não autenticado.");
       
      let finalData = { ...data };

       // Se tiver arquivo novo na edição, faz upload e atualiza a URL
      if (logoFile) {
        const logoUrl = await uploadLogo(logoFile, user.id);
        finalData = { ...finalData, logo_url: logoUrl };
      }

      const { data: updatedClient, error } = await supabase
        .from('agency_clients')
        .update(finalData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedClient as AgencyClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agency_clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}