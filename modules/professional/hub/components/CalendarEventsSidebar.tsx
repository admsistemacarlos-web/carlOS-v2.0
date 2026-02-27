import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CheckCircle2, Film, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  description?: string;
}

interface CalendarEventsSidebarProps {
  selectedDate: Date;
  events: CalendarEvent[];
}

export default function CalendarEventsSidebar({ selectedDate, events }: CalendarEventsSidebarProps) {
  const navigate = useNavigate();

  const getCategoryConfig = (category: string) => {
const configs: Record<string, { icon: React.ReactElement; color: string; label: string; path: string }> = {
      task: { 
        icon: <CheckCircle2 size={16} />, 
        color: 'text-[#E09B6B] bg-[#E09B6B]/10 border-[#E09B6B]/30',
        label: 'Demanda',
        path: '/professional/crm'
      },
      meeting: { 
        icon: <Users size={16} />, 
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        label: 'Reunião',
        path: '/professional/calendar'
      },
      project: { 
        icon: <Film size={16} />, 
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        label: 'Projeto',
        path: '/professional/video-editor'
      }
    };
    return configs[category] || configs.task;
  };

  return (
    <div className="bg-[#202020] border border-[#404040] rounded-2xl p-6 h-full flex flex-col">
      <div className="mb-4 pb-4 border-b border-[#404040]">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar size={20} className="text-[#E09B6B]" />
          {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
        </h3>
        <p className="text-xs text-[#737373] mt-1">
          {events.length} evento{events.length !== 1 ? 's' : ''} neste dia
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Calendar size={48} className="text-[#404040] mb-3" />
            <p className="text-[#737373] text-sm">Nenhum evento neste dia</p>
          </div>
        ) : (
          events.map(event => {
            const config = getCategoryConfig(event.category);
            return (
              <div
                key={event.id}
                onClick={() => navigate(config.path)}
                className="p-4 bg-[#2C2C2C] hover:bg-[#37352F] border border-[#404040] hover:border-[#E09B6B]/30 rounded-xl cursor-pointer transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm group-hover:text-[#E09B6B] transition-colors truncate">
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className="text-xs text-[#737373] mt-1 truncate">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}