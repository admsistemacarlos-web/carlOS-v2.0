// modules/personal/components/DashboardEventsSidebar.tsx

import React from 'react';
import { DollarSign, Calendar, BookOpen, GraduationCap, Briefcase, X } from 'lucide-react';
import type { CalendarEvent } from '../../../types/calendar';

interface DashboardEventsSidebarProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onClose?: () => void;
}

const categoryConfig = {
  bill: { icon: DollarSign, color: 'text-red-500', bg: 'bg-red-50', label: 'Conta' },
  invoice: { icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Fatura' },
  spiritual: { icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Espiritual' },
  study: { icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Estudo' },
  project: { icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Projeto' },
  general: { icon: Calendar, color: 'text-stone-500', bg: 'bg-stone-50', label: 'Geral' },
  workout: { icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Treino' },
  headache: { icon: Calendar, color: 'text-red-500', bg: 'bg-red-50', label: 'Sintoma' },
  pet: { icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Pet' },
};

export const DashboardEventsSidebar: React.FC<DashboardEventsSidebarProps> = ({
  selectedDate,
  events,
  onClose
}) => {
  const formattedDate = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-bold text-coffee uppercase tracking-widest mb-1">
            Eventos do Dia
          </h3>
          <p className="text-xs text-stone-400 capitalize">{formattedDate}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-coffee transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto mb-3 text-stone-300" size={48} />
            <p className="text-sm text-stone-400">Nenhum evento neste dia</p>
          </div>
        ) : (
          events.map((event) => {
            const config = categoryConfig[event.category];
            const Icon = config.icon;

            return (
              <div
                key={event.id}
                className={`${config.bg} rounded-2xl p-4 border border-stone-100 hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${config.color} mt-0.5`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold ${config.color} uppercase tracking-wider`}>
                        {config.label}
                      </span>
                      {event.status === 'overdue' && (
                        <span className="text-[8px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase">
                          Vencido
                        </span>
                      )}
                      {event.status === 'paid' && (
                        <span className="text-[8px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                          Pago
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm text-coffee mb-1 truncate">
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className="text-xs text-stone-500 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                    {event.amount && (
                      <p className="text-sm font-bold text-coffee mt-2">
                        R$ {event.amount.toFixed(2)}
                      </p>
                    )}
                    {event.time && (
                      <p className="text-xs text-stone-400 mt-1">
                        🕐 {event.time}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};