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

      // 2. Tarefas de Clientes (Pendentes) - CORRIGIDO
      // Agora mostra TODAS as tasks não finalizadas, ordenadas por data
      const tasksPromise = supabase
  .from('agency_client_tasks')
  .select(`
    id, 
    title, 
    priority, 
    due_date, 
    status,
    agency_clients(id, name)
  `)
  .neq('status', 'posted')
  .order('due_date', { ascending: true, nullsFirst: false })
  .limit(10);

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

      // 5. NOVO: Buscar TODAS as tasks com datas para o calendário
      const allTasksPromise = supabase
  .from('agency_client_tasks')
  .select(`
    id,
    title,
    due_date,
    status,
    priority,
    agency_clients(id, name)
  `)
        .not('due_date', 'is', null)
        .neq('status', 'posted')
        .order('due_date', { ascending: true });

      const [projectsRes, tasksRes, quotesRes, clientsRes, allTasksRes] = await Promise.all([
        projectsPromise,
        tasksPromise,
        quotesPromise,
        clientsCountPromise,
        allTasksPromise
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
  activeClientsCount: clientsRes.count || 0,
  allTasks: (allTasksRes.data || []).map((task: any) => ({
    ...task,
    client: task.agency_clients?.[0] || { id: '', name: 'Cliente não encontrado' }
  }))
};
    },
    refetchOnWindowFocus: true
  });
}