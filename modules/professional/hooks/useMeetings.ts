import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import { AgencyMeeting } from '../types/agency.types';

// 1. Buscar TODAS as reuniões do usuário
export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error } = await supabase
        .from('agency_meetings')
        .select('*, client:agency_clients(name, logo_url)')
        .eq('user_id', user.id)
        .order('meeting_date', { ascending: true });

      if (error) throw error;
      return data as AgencyMeeting[];
    },
  });
}

// 2. Buscar reuniões de um cliente específico
export function useClientMeetings(clientId: string | undefined) {
  return useQuery({
    queryKey: ['meetings', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('agency_meetings')
        .select('*, client:agency_clients(name, logo_url)')
        .eq('client_id', clientId)
        .order('meeting_date', { ascending: true });

      if (error) throw error;
      return data as AgencyMeeting[];
    },
    enabled: !!clientId,
  });
}

// 3. Buscar UMA reunião específica
export function useMeeting(id: string | undefined) {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('agency_meetings')
        .select('*, client:agency_clients(name, logo_url)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as AgencyMeeting;
    },
    enabled: !!id,
  });
}

// 4. Criar nova reunião
export function useCreateMeeting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newMeeting: Partial<AgencyMeeting>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error } = await supabase
        .from('agency_meetings')
        .insert([{ ...newMeeting, user_id: user.id }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

// 5. Atualizar reunião
export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AgencyMeeting> & { id: string }) => {
      const { error } = await supabase
        .from('agency_meetings')
        .update(updates)
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.id] });
    },
  });
}

// 6. Deletar reunião
export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agency_meetings')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

// 7. Buscar eventos do calendário (projetos + reuniões) - HELPER
export function useCalendarEvents(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['calendar_events', startDate, endDate],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Buscar projetos com deadline no período
      const projectsPromise = supabase
        .from('agency_projects')
        .select('id, title, deadline, status, client:agency_clients(name, logo_url)')
        .eq('user_id', user.id)
        .eq('category', 'video')
        .gte('deadline', startDate || new Date().toISOString())
        .lte('deadline', endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());

      // Buscar reuniões no período
      const meetingsPromise = supabase
        .from('agency_meetings')
        .select('id, title, meeting_date, duration_minutes, location, meeting_link, status, client:agency_clients(name, logo_url)')
        .eq('user_id', user.id)
        .gte('meeting_date', startDate || new Date().toISOString())
        .lte('meeting_date', endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());

      const [projectsRes, meetingsRes] = await Promise.all([projectsPromise, meetingsPromise]);

      if (projectsRes.error) throw projectsRes.error;
      if (meetingsRes.error) throw meetingsRes.error;

      // Transformar em formato unificado
      const events = [
        ...(projectsRes.data || []).map(p => ({
          id: p.id,
          title: p.title,
          date: p.deadline,
          type: 'project' as const,
          status: p.status,
          client: p.client,
          deadline: p.deadline,
        })),
        ...(meetingsRes.data || []).map(m => ({
          id: m.id,
          title: m.title,
          date: m.meeting_date,
          type: 'meeting' as const,
          status: m.status,
          client: m.client,
          duration_minutes: m.duration_minutes,
          location: m.location,
          meeting_link: m.meeting_link,
        }))
      ];

      // Ordenar por data
      return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
  });
}