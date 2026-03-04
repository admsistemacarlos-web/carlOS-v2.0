import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  due_date: string;
  status: string;
  priority: string;
  client: {
    id: string;
    name: string;
  };
}

interface HubCalendarWidgetProps {
  tasks: Task[];
}

export default function HubCalendarWidget({ tasks }: HubCalendarWidgetProps) {
  const navigate = useNavigate();

  // Agrupar tasks por data
  const upcomingTasks = tasks
    .filter(t => t.due_date)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5); // Mostrar apenas os 5 próximos

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return '🔥 Hoje';
    if (isTomorrow(date)) return '📌 Amanhã';
    if (isThisWeek(date)) return format(date, "EEEE", { locale: ptBR });
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 border-red-500/40 text-red-400';
      case 'medium': return 'bg-primary/20 border-primary/40 text-primary';
      default: return 'bg-secondary/20 border-secondary/40 text-muted-foreground';
    }
  };

  if (upcomingTasks.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-secondary p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Calendar size={16} className="text-primary" /> Próximos Eventos
          </h3>
          <button 
            onClick={() => navigate('/professional/calendar')}
            className="text-[10px] font-bold text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors"
          >
            Ver Calendário
          </button>
        </div>
        <div className="text-center py-8 text-muted-foreground text-xs">
          <Calendar size={32} className="mx-auto mb-2 opacity-30" />
          <p>Nenhum evento agendado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-secondary overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-secondary flex justify-between items-center bg-card">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Calendar size={16} className="text-primary" /> Próximos Eventos
        </h3>
        <button 
          onClick={() => navigate('/professional/calendar')}
          className="text-[10px] font-bold text-muted-foreground hover:text-primary uppercase tracking-wider flex items-center gap-1 transition-colors"
        >
          Ver Calendário →
        </button>
      </div>

      {/* Lista de eventos */}
      <div className="p-2 space-y-1">
        {upcomingTasks.map((task) => {
          const isOverdue = isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
          
          return (
            <div
              key={task.id}
              onClick={() => navigate('/professional/calendar')}
              className="flex items-center gap-3 p-3 hover:bg-secondary rounded-md cursor-pointer group transition-colors border border-transparent hover:border-secondary"
            >
              {/* Data */}
              <div className="shrink-0 text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {format(new Date(task.due_date), 'MMM', { locale: ptBR })}
                </div>
                <div className={`text-xl font-bold ${isOverdue ? 'text-red-400' : 'text-foreground'}`}>
                  {format(new Date(task.due_date), 'dd')}
                </div>
              </div>

              {/* Linha vertical */}
              <div className={`w-px h-12 ${isOverdue ? 'bg-red-500/30' : 'bg-secondary'}`}></div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                    {getDateLabel(task.due_date)}
                  </span>
                  {isOverdue && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-red-400">
                      <AlertCircle size={10} /> ATRASADO
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {task.title}
                </h4>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock size={10} />
                  {task.client.name} • {format(new Date(task.due_date), 'HH:mm', { locale: ptBR })}
                </p>
              </div>

              {/* Indicador de prioridade */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                task.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                task.priority === 'medium' ? 'bg-primary' : 
                'bg-secondary'
              }`}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}