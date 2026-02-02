
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';

export function useAgencyDashboard() {
  return useQuery({
    queryKey: ['agency_dashboard_overview'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // 1. Projetos em Andamento (Vídeos) - Status diferente de 'posted'
      const projectsPromise = supabase
        .from('agency_projects')
        .select('id, title, status, deadline, client:agency_clients(name, logo_url)')
        .neq('status', 'posted')
        .eq('category', 'video')
        .order('deadline', { ascending: true })
        .limit(5);

      // 2. Tarefas de Clientes (Pendentes)
      const tasksPromise = supabase
        .from('agency_client_tasks')
        .select('id, title, priority, due_date, status, client:agency_clients(name)')
        .neq('status', 'posted')
        .order('priority', { ascending: false }) // Alta prioridade primeiro
        .limit(6);

      // 3. Propostas Comerciais (Abertas)
      const quotesPromise = supabase
        .from('agency_quotes')
        .select('id, title, total_monthly, total_one_time, status, client:agency_clients(name)')
        .in('status', ['draft', 'sent'])
        .order('created_at', { ascending: false });

      // 4. Contagem de Clientes Ativos
      const clientsCountPromise = supabase
        .from('agency_clients')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      const [projectsRes, tasksRes, quotesRes, clientsRes] = await Promise.all([
        projectsPromise,
        tasksPromise,
        quotesPromise,
        clientsCountPromise
      ]);

      // Cálculos de Totais
      const totalPipelineValue = (quotesRes.data || []).reduce((acc, q) => {
        return acc + (q.total_monthly || 0) + (q.total_one_time || 0);
      }, 0);

      return {
        activeProjects: projectsRes.data || [],
        pendingTasks: tasksRes.data || [],
        openQuotes: quotesRes.data || [],
        totalPipelineValue,
        activeClientsCount: clientsRes.count || 0
      };
    },
    refetchOnWindowFocus: true
  });
}
