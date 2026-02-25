import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Video, Users, MapPin, ExternalLink, Clock } from 'lucide-react';
import { useCalendarEvents } from '../hooks/useMeetings';
import MeetingModal from './MeetingModal';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  // Calcular período do mês atual
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: events = [], isLoading } = useCalendarEvents(
    startOfMonth.toISOString(),
    endOfMonth.toISOString()
  );

  // Funções auxiliares
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

  const getEventsForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return events.filter(event => event.date.split('T')[0] === dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: number) => {
    const clicked = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clicked);
    setShowMeetingModal(true);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E09B6B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <CalendarIcon size={32} className="text-[#E09B6B]" />
              Calendário Profissional
            </h1>
            <p className="text-[#9ca3af] mt-1">Vídeos em produção e reuniões com clientes</p>
          </div>
          <button
            onClick={() => {
              setSelectedDate(new Date());
              setShowMeetingModal(true);
            }}
            className="bg-[#E09B6B] hover:opacity-90 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition-all active:scale-95 shadow-lg"
          >
            <Plus size={18} />
            Nova Reunião
          </button>
        </div>
      </header>

      {/* Navegação do Calendário */}
      <div className="bg-[#202020] border border-[#404040] rounded-2xl p-6 mb-6 shadow-premium">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="px-4 py-2 bg-[#2C2C2C] hover:bg-[#37352F] border border-[#404040] rounded-lg text-[#D4D4D4] transition-colors"
          >
            ← Anterior
          </button>
          
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-[#E09B6B]/10 hover:bg-[#E09B6B]/20 border border-[#E09B6B]/30 rounded-lg text-[#E09B6B] text-sm font-bold transition-colors"
            >
              Hoje
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            className="px-4 py-2 bg-[#2C2C2C] hover:bg-[#37352F] border border-[#404040] rounded-lg text-[#D4D4D4] transition-colors"
          >
            Próximo →
          </button>
        </div>

        {/* Grade do Calendário */}
        <div className="grid grid-cols-7 gap-2">
          {/* Cabeçalho dos dias da semana */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-[#737373] uppercase tracking-wider py-2">
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
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square p-2 rounded-xl border cursor-pointer transition-all
                  ${isToday 
                    ? 'bg-[#E09B6B]/20 border-[#E09B6B] ring-2 ring-[#E09B6B]/50' 
                    : 'bg-[#2C2C2C] border-[#404040] hover:bg-[#37352F] hover:border-[#E09B6B]/30'
                  }
                `}
              >
                <div className={`text-sm font-bold mb-1 ${isToday ? 'text-[#E09B6B]' : 'text-[#D4D4D4]'}`}>
                  {day}
                </div>
                
                {/* Indicadores de eventos */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                        event.type === 'project' 
                          ? 'bg-[#E09B6B]/10 text-[#E09B6B] border border-[#E09B6B]/30' 
                          : 'bg-[#E09B6B]/20 text-[#E09B6B] border border-[#E09B6B]/40'
                      }`}
                      title={event.title}
                    >
                      {event.type === 'project' ? '🎬' : '👥'} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-[#737373] font-bold">
                      +{dayEvents.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

     {/* Lista de Eventos Próximos */}
      <div className="bg-[#202020] border border-[#404040] rounded-2xl p-6 shadow-premium">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock size={20} className="text-[#E09B6B]" />
          Próximos Eventos
        </h3>

        {events.length === 0 ? (
          <p className="text-[#737373] text-sm italic">Nenhum evento agendado para este mês.</p>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 10).map(event => {
              const eventDate = new Date(event.date);
              const isPast = eventDate < new Date();
              
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    isPast 
                      ? 'bg-[#2C2C2C]/50 border-[#404040]/50 opacity-60' 
                      : 'bg-[#2C2C2C] border-[#404040] hover:border-[#E09B6B]/30'
                  } transition-all`}
                >
                  <div className={`p-3 rounded-lg ${
                    event.type === 'project' 
                      ? 'bg-[#E09B6B]/10 text-[#E09B6B] border border-[#E09B6B]/30' 
                      : 'bg-[#E09B6B]/20 text-[#E09B6B] border border-[#E09B6B]/40'
                  }`}>
                    {event.type === 'project' ? <Video size={20} /> : <Users size={20} />}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-bold text-white">{event.title}</h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-[#737373]">
                      <span>
                        {eventDate.toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {event.client && (
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {Array.isArray(event.client) ? event.client[0]?.name : (event.client as any).name}
                        </span>
                      )}
                      {event.type === 'meeting' && (event as any).location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {(event as any).location}
                        </span>
                      )}
                    </div>
                  </div>

                  {event.type === 'meeting' && (event as any).meeting_link && (
                    <a
                      href={(event as any).meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-[#E09B6B]/10 hover:bg-[#E09B6B]/20 border border-[#E09B6B]/30 rounded-lg text-[#E09B6B] transition-colors"
                      title="Abrir link da reunião"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    event.type === 'project' 
                      ? 'bg-[#E09B6B]/10 text-[#E09B6B] border-[#E09B6B]/30' 
                      : (event as any).status === 'completed'
                      ? 'bg-[#E09B6B]/15 text-[#E09B6B] border-[#E09B6B]/35'
                      : (event as any).status === 'cancelled'
                      ? 'bg-[#2C2C2C] text-[#737373] border-[#404040]'
                      : 'bg-[#E09B6B]/20 text-[#E09B6B] border-[#E09B6B]/40'
                  }`}>
                    {event.type === 'project' ? 'Vídeo' : 
                     (event as any).status === 'completed' ? 'Concluída' :
                     (event as any).status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Reunião */}
      {showMeetingModal && (
        <MeetingModal
          selectedDate={selectedDate}
          onClose={() => {
            setShowMeetingModal(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}