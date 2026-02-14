// modules/personal/components/CategoryFilters.tsx

import React from 'react';
import { DollarSign, Calendar, BookOpen, GraduationCap, Briefcase, Dumbbell, Frown, Dog } from 'lucide-react';
import type { CategoryFilter } from '../../../types/calendar';

interface CategoryFiltersProps {
  filters: CategoryFilter[];
  onToggle: (category: string) => void;
}

const iconMap: Record<string, any> = {
  DollarSign,
  Calendar,
  BookOpen,
  GraduationCap,
  Briefcase,
  Dumbbell,
  Frown,
  Dog
};

export const CategoryFilters: React.FC<CategoryFiltersProps> = ({ filters, onToggle }) => {
  return (
    <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm p-6">
      <h3 className="text-sm font-bold text-coffee uppercase tracking-widest mb-4">
        Filtrar Eventos
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filters.map((filter) => {
          const Icon = iconMap[filter.icon];
          
          return (
            <button
              key={filter.category}
              onClick={() => onToggle(filter.category)}
              className={`
                flex items-center gap-2 p-3 rounded-xl border-2 transition-all
                ${filter.enabled 
                  ? `${filter.color} bg-opacity-10 border-current` 
                  : 'border-stone-200 text-stone-300 hover:border-stone-300'
                }
              `}
            >
              <Icon size={16} />
              <span className="text-xs font-semibold">{filter.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};