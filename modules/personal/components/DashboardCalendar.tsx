// DashboardCalendar.tsx

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, DollarSign, BookOpen, GraduationCap, Briefcase, Dumbbell, Frown, Dog } from 'lucide-react';
import type { CalendarMarkers } from '../../../types/calendar';

interface DashboardCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  markers?: CalendarMarkers;
  enabledCategories?: string[];
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
  markers = {},
  enabledCategories = []
}) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

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

  const goToToday = () => {
    const today = new Date();
    onMonthChange(today);
    onSelectDate(today);
  };

  // Filtrar eventos por categorias habilitadas
  const getFilteredEventCount = (dateKey: string) => {
    const marker = markers[dateKey];
    if (!marker?.events) return 0;
    
    return marker.events.filter(event => 
      enabledCategories.length === 0 || enabledCategories.includes(event.category)
    ).length;
  };

  const shouldShowMarker = (dateKey: string, markerType: string) => {
    if (enabledCategories.length === 0) return true;
    
    const categoryMap: Record<string, string> = {
      hasWorkout: 'workout',
      hasHeadache: 'headache',
      hasPetEvent: 'pet',
      hasBill: 'bill',
      hasInvoice: 'invoice',
      hasSpiritual: 'spiritual',
      hasStudy: 'study',
      hasProject: 'project',
      hasGeneral: 'general'
    };
    
    return enabledCategories.includes(categoryMap[markerType]);
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-stone-200 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h3 className="text-xs md:text-sm font-bold text-coffee uppercase tracking-widest">
          {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={goToToday}
            className="hidden md:block px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-coffee hover:text-white rounded-lg transition-colors"
          >
            Hoje
          </button>
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
          const eventCount = getFilteredEventCount(dateKey);
          const isHovered = hoveredDate === dateKey;

          return (
            <div
              key={dateKey}
              className="relative"
              onMouseEnter={() => setHoveredDate(dateKey)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <button
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
                
                {/* Event Counter Badge */}
                {eventCount > 0 && (
                  <span className={`
                    absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center
                    ${isSelected ? 'bg-white text-coffee' : 'bg-coffee text-white'}
                  `}>
                    {eventCount}
                  </span>
                )}
                
                {/* Dots Container */}
                <div className="flex gap-0.5 mt-1 h-1.5">
                  {marker?.hasWorkout && shouldShowMarker(dateKey, 'hasWorkout') && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500'}`}></div>
                  )}
                  {marker?.hasHeadache && shouldShowMarker(dateKey, 'hasHeadache') && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-400'}`}></div>
                  )}
                  {marker?.hasPetEvent && shouldShowMarker(dateKey, 'hasPetEvent') && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-purple-300' : 'bg-purple-400'}`}></div>
                  )}
                  {marker?.hasBill && shouldShowMarker(dateKey, 'hasBill') && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-500'}`}></div>
                  )}
                  {marker?.hasInvoice && shouldShowMarker(dateKey, 'hasInvoice') && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-orange-300' : 'bg-orange-500'}`}></div>
                  )}
                  {marker?.hasSpiritual && shouldShowMarker(dateKey, 'hasSpiritual') && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-purple-300' : 'bg-purple-500'}`}></div>
                  )}
                  {marker?.hasStudy && shouldShowMarker(dateKey, 'hasStudy') && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-300' : 'bg-blue-500'}`}></div>
                  )}
                  {marker?.hasProject && shouldShowMarker(dateKey, 'hasProject') && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`}></div>
                  )}
                  {marker?.hasGeneral && shouldShowMarker(dateKey, 'hasGeneral') && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-stone-300' : 'bg-stone-500'}`}></div>
                  )}
                </div>
              </button>

              {/* Tooltip */}
              {isHovered && eventCount > 0 && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-coffee text-white px-3 py-2 rounded-lg shadow-lg text-[10px] font-semibold whitespace-nowrap">
                  {eventCount} evento{eventCount > 1 ? 's' : ''}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-coffee"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 md:mt-6 pt-4 border-t border-stone-100">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {shouldShowMarker('', 'hasWorkout') && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Treino</span>
            </div>
          )}
          {shouldShowMarker('', 'hasHeadache') && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Sintoma</span>
            </div>
          )}
          {shouldShowMarker('', 'hasPetEvent') && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Pet</span>
            </div>
          )}
          {shouldShowMarker('', 'hasBill') && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Conta</span>
            </div>
          )}
          {shouldShowMarker('', 'hasInvoice') && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Fatura</span>
            </div>
          )}
          {shouldShowMarker('', 'hasSpiritual') && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Espiritual</span>
            </div>
          )}
          {shouldShowMarker('', 'hasStudy') && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Estudo</span>
            </div>
          )}
          {shouldShowMarker('', 'hasProject') && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Projeto</span>
            </div>
          )}
          {shouldShowMarker('', 'hasGeneral') && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-stone-500"></div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Geral</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};