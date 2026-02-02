
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';

// --- TYPES ---
export type TaskStatus = 'todo' | 'in_progress' | 'approval' | 'ready_to_post' | 'posted';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface ClientTask {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  created_at: string;
}

export interface ClientNote {
  id: string;
  client_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

// --- HOOKS: TASKS ---
export function useClientTasks(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client_tasks', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('agency_client_tasks')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }); // Mais recentes primeiro
      if (error) throw error;
      return data as ClientTask[];
    },
    enabled: !!clientId
  });
}

export function useTaskOperations() {
  const queryClient = useQueryClient();

  const createTask = useMutation({
    mutationFn: async (task: Partial<ClientTask>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");
      const { error } = await supabase.from('agency_client_tasks').insert([{ ...task, user_id: user.id }]);
      if (error) throw error;
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ['client_tasks', vars.client_id] })
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<ClientTask> }) => {
      const { error } = await supabase.from('agency_client_tasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client_tasks'] })
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agency_client_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client_tasks'] })
  });

  return { createTask, updateTask, deleteTask };
}

// --- HOOKS: NOTES ---
export function useClientNotes(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client_notes', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('agency_client_notes')
        .select('*')
        .eq('client_id', clientId)
        .order('is_pinned', { ascending: false }) // Fixados primeiro
        .order('created_at', { ascending: false }); // Depois mais recentes
      if (error) throw error;
      return data as ClientNote[];
    },
    enabled: !!clientId
  });
}

export function useNoteOperations() {
  const queryClient = useQueryClient();

  const createNote = useMutation({
    mutationFn: async (note: Partial<ClientNote>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");
      const { error } = await supabase.from('agency_client_notes').insert([{ ...note, user_id: user.id }]);
      if (error) throw error;
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ['client_notes', vars.client_id] })
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agency_client_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client_notes'] })
  });

  return { createNote, deleteNote };
}
