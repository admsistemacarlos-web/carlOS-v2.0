// src/types/calendar.ts

export type EventCategory = 
  | 'workout'      // Treino
  | 'headache'     // Dor de cabeça
  | 'pet'          // Pet
  | 'bill'         // Conta a vencer
  | 'invoice'      // Fatura de cartão
  | 'spiritual'    // Leitura/oração
  | 'study'        // Aula/curso
  | 'project'      // Deadline de projeto
  | 'general';     // Evento geral

export interface CalendarEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string; // formato: YYYY-MM-DD
  time?: string; // HH:MM (opcional)
  description?: string;
  amount?: number; // para bills/invoices
  status?: 'pending' | 'paid' | 'overdue'; // para financeiro
  priority?: 'low' | 'medium' | 'high';
}

export interface CalendarMarkers {
  [date: string]: {
    // Eventos existentes
    hasWorkout?: boolean;
    hasHeadache?: boolean;
    hasPetEvent?: boolean;
    
    // Novos eventos
    hasBill?: boolean;
    hasInvoice?: boolean;
    hasSpiritual?: boolean;
    hasStudy?: boolean;
    hasProject?: boolean;
    hasGeneral?: boolean;
    
    // Lista completa de eventos do dia
    events?: CalendarEvent[];
    
    // Contadores
    eventCount?: number;
  };
}

export interface CategoryFilter {
  category: EventCategory;
  label: string;
  color: string;
  icon: string;
  enabled: boolean;
}

