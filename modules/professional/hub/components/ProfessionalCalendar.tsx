import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

interface ProfessionalCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  markers?: CalendarMarkers;
}

export default function ProfessionalCalendar({
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
  markers = {}
}: ProfessionalCalendarProps) {

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const formatDateKey = (day: number) => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getEventsForDate = (day: number) => {
    const dateKey = formatDateKey(day);
    return markers[dateKey]?.events || [];
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    onMonthChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    onMonthChange(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    onMonthChange(today);
    onSelectDate(today);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
      {/* Navegação */}
<div className="flex flex-col items-center gap-3 mb-6">
  {/* Mês e Ano centralizados */}
  <h2 className="text-2xl font-bold text-white">
    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
  </h2>

  {/* Botões de navegação */}
  <div className="flex items-center justify-between w-full gap-2">
    <button
      onClick={goToPreviousMonth}
      className="flex items-center gap-1 px-3 py-2 bg-secondary hover:bg-secondary border border-border rounded-lg text-foreground text-xs font-bold transition-colors"
    >
      <ChevronLeft size={14} /> Anterior
    </button>

    <button
      onClick={goToToday}
      className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary text-xs font-bold transition-colors"
    >
      Hoje
    </button>

    <button
      onClick={goToNextMonth}
      className="flex items-center gap-1 px-3 py-2 bg-secondary hover:bg-secondary border border-border rounded-lg text-foreground text-xs font-bold transition-colors"
    >
      Próximo <ChevronRight size={14} />
    </button>
  </div>
</div>

      {/* Grade do Calendário */}
      <div className="grid grid-cols-7 gap-2">
        {/* Cabeçalho dos dias da semana */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wider py-2">
            {day}
          </div>
        ))}

        {/* Dias vazios antes do início do mês */}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Dias do mês */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayEvents = getEventsForDate(day);
          const isToday = isCurrentMonth && today.getDate() === day;

          return (
            <div
              key={day}
              onClick={() => {
                const clicked = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                onSelectDate(clicked);
              }}
              className={`
                aspect-square p-2 rounded-xl border cursor-pointer transition-all
                ${isToday 
                  ? 'bg-primary/20 border-primary ring-2 ring-primary/50' 
                  : 'bg-secondary border-border hover:bg-secondary hover:border-primary/30'
                }
              `}
            >
              <div className={`text-sm font-bold mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                {day}
              </div>
              
              {/* Indicadores de eventos */}
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                      event.category === 'task' 
                        ? 'bg-primary/10 text-primary border border-primary/30' 
                        : event.category === 'meeting'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    }`}
                    title={event.title}
                  >
                    {event.category === 'task' ? '📋' : event.category === 'meeting' ? '👥' : '🎬'} {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-muted-foreground font-bold">
                    +{dayEvents.length - 2} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}