// hooks/useCalendarEvents.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import type { CalendarEvent, CalendarMarkers } from '../types/calendar';

interface UseCalendarEventsProps {
  startDate: Date;
  endDate: Date;
  userId: string;
}

export const useCalendarEvents = ({ startDate, endDate, userId }: UseCalendarEventsProps) => {
  
  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const query = useQuery({
    queryKey: ['calendar-events', userId, formatDateKey(startDate), formatDateKey(endDate)],
    queryFn: async () => {
      const events: CalendarEvent[] = [];

      // 1. Buscar Bills (Contas a Vencer)
      const { data: bills } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .gte('due_date', formatDateKey(startDate))
        .lte('due_date', formatDateKey(endDate))
        .is('deleted_at', null);

      if (bills) {
        bills.forEach(bill => {
          events.push({
            id: `bill-${bill.id}`,
            title: bill.description,
            category: 'bill',
            date: bill.due_date,
            amount: bill.amount,
            status: bill.paid ? 'paid' : (new Date(bill.due_date) < new Date() ? 'overdue' : 'pending'),
            description: `Conta: ${bill.description} - R$ ${bill.amount}`
          });
        });
      }

      // 2. Buscar Transactions agendadas (futuras)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', formatDateKey(startDate))
        .lte('date', formatDateKey(endDate))
        .is('deleted_at', null);

      if (transactions) {
        transactions.forEach(tx => {
          if (new Date(tx.date) > new Date()) {
            events.push({
              id: `transaction-${tx.id}`,
              title: tx.description,
              category: 'general',
              date: tx.date,
              amount: tx.amount,
              description: `${tx.type === 'income' ? 'Receita' : 'Despesa'}: ${tx.description}`
            });
          }
        });
      }

      // 3. Buscar Wellness Logs (Treino, Dor de Cabeça)
      const { data: wellnessLogs } = await supabase
        .from('health_wellness_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (wellnessLogs) {
        wellnessLogs.forEach(log => {
          const dateKey = log.date.split('T')[0];
          
          if (log.workout_done) {
            events.push({
              id: `workout-${log.id}`,
              title: 'Treino Realizado',
              category: 'workout',
              date: dateKey,
              description: 'Atividade física registrada'
            });
          }
          
          if (log.headache) {
            events.push({
              id: `headache-${log.id}`,
              title: 'Dor de Cabeça',
              category: 'headache',
              date: dateKey,
              description: 'Sintoma registrado no Bio-Data'
            });
          }
        });
      }

      // 4. Buscar Pet Logs
      const { data: petLogs } = await supabase
        .from('pet_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('event_date', startDate.toISOString())
        .lte('event_date', endDate.toISOString());

      if (petLogs) {
        petLogs.forEach(log => {
          const dateKey = log.event_date.split('T')[0];
          events.push({
            id: `pet-${log.id}`,
            title: log.title || 'Evento Pet',
            category: 'pet',
            date: dateKey,
            description: log.notes || log.category || 'Cuidado com pet registrado'
          });
        });
      }

      // 5. Converter para formato CalendarMarkers
      const markers: CalendarMarkers = {};
      
      events.forEach(event => {
        if (!markers[event.date]) {
          markers[event.date] = {
            events: [],
            eventCount: 0
          };
        }
        
        markers[event.date].events!.push(event);
        markers[event.date].eventCount = (markers[event.date].eventCount || 0) + 1;
        
        // Definir flags booleanas por categoria
        if (event.category === 'workout') markers[event.date].hasWorkout = true;
        if (event.category === 'headache') markers[event.date].hasHeadache = true;
        if (event.category === 'pet') markers[event.date].hasPetEvent = true;
        if (event.category === 'bill') markers[event.date].hasBill = true;
        if (event.category === 'invoice') markers[event.date].hasInvoice = true;
        if (event.category === 'spiritual') markers[event.date].hasSpiritual = true;
        if (event.category === 'study') markers[event.date].hasStudy = true;
        if (event.category === 'project') markers[event.date].hasProject = true;
        if (event.category === 'general') markers[event.date].hasGeneral = true;
      });

      return markers;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return query;
};