import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';

interface CalendarMarkers {
  [dateKey: string]: {
    events?: Array<{
      id: string;
      title: string;
      category: string;
      date: string;
      description?: string;
    }>;
    eventCount?: number;
    hasTask?: boolean;
    hasMeeting?: boolean;
    hasProject?: boolean;
  };
}

interface UseProfessionalCalendarEventsProps {
  startDate: Date;
  endDate: Date;
  userId: string;
}

export const useProfessionalCalendarEvents = ({ 
  startDate, 
  endDate, 
  userId 
}: UseProfessionalCalendarEventsProps) => {
  
  const formatDateKey = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return useQuery({
    queryKey: ['professional-calendar-events', userId, formatDateKey(startDate), formatDateKey(endDate)],
    queryFn: async () => {
      const markers: CalendarMarkers = {};

      // 1. Buscar Tasks de Clientes
      const { data: tasks } = await supabase
        .from('agency_client_tasks')
        .select('id, title, due_date, status, priority, client_id, agency_clients!inner(id,name)')
        .eq('user_id', userId)
        .not('due_date', 'is', null)
        .gte('due_date', startDate.toISOString())
        .lte('due_date', endDate.toISOString())
        .neq('status', 'posted');

      if (tasks) {
        tasks.forEach((task: any) => {
          const dateKey = formatDateKey(task.due_date);
          
          if (!markers[dateKey]) {
            markers[dateKey] = { events: [], eventCount: 0 };
          }

              const clientName = task.agency_clients?.name || 'Sem cliente';

          markers[dateKey].events!.push({
            id: `task-${task.id}`,
            title: task.title,
            category: 'task',
            date: dateKey,
            description: clientName
          });

          markers[dateKey].hasTask = true;
          markers[dateKey].eventCount = (markers[dateKey].eventCount || 0) + 1;
        });
      }

      // 2. Buscar Reuniões
      const { data: meetings } = await supabase
        .from('agency_meetings')
        .select('id, title, meeting_date, client_id, agency_clients!inner(id, name)')
        .eq('user_id', userId)
        .gte('meeting_date', startDate.toISOString())
        .lte('meeting_date', endDate.toISOString());

      if (meetings) {
        meetings.forEach((meeting: any) => {
          const dateKey = formatDateKey(meeting.meeting_date);
          
          if (!markers[dateKey]) {
            markers[dateKey] = { events: [], eventCount: 0 };
          }

            const clientName = meeting.agency_clients?.name || 'Sem cliente';
  

          markers[dateKey].events!.push({
            id: `meeting-${meeting.id}`,
            title: meeting.title,
            category: 'meeting',
            date: dateKey,
            description: clientName
          });

          markers[dateKey].hasMeeting = true;
          markers[dateKey].eventCount = (markers[dateKey].eventCount || 0) + 1;
        });
      }

      // 3. Buscar Projetos com Deadline
      const { data: projects } = await supabase
        .from('agency_projects')
        .select('id, title, deadline, status, client_id, agency_clients!inner(id,name)')
        .eq('user_id', userId)
        .not('deadline', 'is', null)
        .gte('deadline', startDate.toISOString())
        .lte('deadline', endDate.toISOString())
        .neq('status', 'posted');

      if (projects) {
        projects.forEach((project: any) => {
          const dateKey = formatDateKey(project.deadline);
          
          if (!markers[dateKey]) {
            markers[dateKey] = { events: [], eventCount: 0 };
          }

              const clientName = project.agency_clients?.name || 'Sem cliente';


          markers[dateKey].events!.push({
            id: `project-${project.id}`,
            title: project.title,
            category: 'project',
            date: dateKey,
            description: clientName
          });

          markers[dateKey].hasProject = true;
          markers[dateKey].eventCount = (markers[dateKey].eventCount || 0) + 1;
        });
      }

      return markers;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};