import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';

export type ProjectStatus = 'video_received' | 'editing' | 'approval' | 'changes' | 'drive_sent' | 'posted';

export interface AgencyProject {
  id: string;
  client_id: string;
  client?: { name: string, logo_url: string };
  title: string;
  category: string;
  status: ProjectStatus;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  received_date?: string;
  approval_sent_date?: string;
  description?: string;
  drive_link?: string;
  preview_link?: string;
}

// 1. Busca TODOS os projetos
export function useProjects(category: string) {
  return useQuery({
    queryKey: ['projects', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_projects')
        .select('*, client:agency_clients(name, logo_url)')
        .eq('category', category)
        .order('deadline', { ascending: true });

      if (error) throw error;
      return data as AgencyProject[];
    },
  });
}

// 2. Busca UM projeto específico
export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('agency_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as AgencyProject;
    },
    enabled: !!id,
  });
}

// 3. Cria Projeto
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newProject: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error } = await supabase
        .from('agency_projects')
        .insert([{ ...newProject, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['projects', vars.category] });
    },
  });
}

// 4. Atualiza STATUS
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('agency_projects')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// 5. Atualiza DADOS COMPLETOS
export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const { error } = await supabase
        .from('agency_projects')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', vars.id] });
    },
  });
}

// 6. DELETAR PROJETO (NOVO!)
export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agency_projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}