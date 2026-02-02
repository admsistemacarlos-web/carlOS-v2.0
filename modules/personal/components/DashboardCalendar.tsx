
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell, Frown, Dog } from 'lucide-react';

export interface CalendarMarkers {
  [date: string]: {
    hasWorkout?: boolean;
    hasHeadache?: boolean;
    hasPetEvent?: boolean;
  };
}

interface DashboardCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  markers?: CalendarMarkers;
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
  markers = {}
}) => {
  // Helpers de Data Local
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  const startOffset = getFirstDayOfMonth(currentMonth);
  const emptyDays = Array(startOffset).fill(null);

  const prevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-coffee uppercase tracking-widest">
          {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-coffee transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-coffee transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-stone-300 uppercase py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 flex-1">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((date) => {
          const dateKey = formatDateKey(date);
          const marker = markers[dateKey];
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(date)}
              className={`
                relative h-10 md:h-12 w-full rounded-xl flex flex-col items-center justify-center transition-all group
                ${isSelected 
                  ? 'bg-coffee text-white shadow-md scale-105 z-10' 
                  : isToday 
                    ? 'bg-stone-100 text-coffee font-bold' 
                    : 'text-stone-600 hover:bg-stone-50'
                }
              `}
            >
              <span className="text-xs">{date.getDate()}</span>
              
              {/* Dots Container */}
              <div className="flex gap-0.5 mt-1 h-1.5">
                {marker?.hasWorkout && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500'}`} title="Treino"></div>
                )}
                {marker?.hasHeadache && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-400'}`} title="Dor de Cabeça"></div>
                )}
                {marker?.hasPetEvent && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-purple-300' : 'bg-purple-400'}`} title="Pet"></div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend (Opcional, mas bom para UX) */}
      <div className="mt-6 pt-4 border-t border-stone-100 flex justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Treino</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Sintoma</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Pet</span>
        </div>
      </div>
    </div>
  );
};
