
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../../integrations/supabase/client';

export const CHART_COLORS = ['#5F6F52', '#A34343', '#8D6E63', '#B9B4C7', '#E5C3A6', '#3C3633', '#747264', '#7FB3D5', '#D2B4DE', '#F5CBA7'];

export type AnalyticsPeriod = 'month' | 'quarter' | 'semester' | 'year' | 'all';

interface EvolutionPoint {
  date: string;
  displayDate: string;
  value: number;
}

interface MacroData {
  categoryData: { name: string; value: number; color: string }[];
  locationData: { name: string; value: number; count: number }[];
  monthlyData: { month: string; income: number; expense: number }[];
  evolutionData: EvolutionPoint[];
  totalExpense: number;
  dailyAverage: number;
}

export function useAnalyticsData(period: AnalyticsPeriod = 'month') {
  const [loading, setLoading] = useState(true);
  const [macroData, setMacroData] = useState<MacroData>({ 
    categoryData: [], 
    locationData: [], 
    monthlyData: [],
    evolutionData: [],
    totalExpense: 0,
    dailyAverage: 0
  });

  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'month':
        start.setDate(1);
        break;
      case 'quarter':
        start.setDate(now.getDate() - 90);
        break;
      case 'semester':
        start.setDate(now.getDate() - 180);
        break;
      case 'year':
        start.setMonth(0, 1);
        break;
      case 'all':
        start.setFullYear(2000, 0, 1);
        break;
    }
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end: now.toISOString() };
  }, [period]);

  const fetchMacroData = useCallback(async () => {
    setLoading(true);
    try {
      // Busca todas as transações do período
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, category, location, type, date')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: true });

      if (error) throw error;
      if (!transactions) return;

      const catMap: Record<string, number> = {};
      const locMap: Record<string, { value: number; count: number }> = {};
      const evolutionMap: Record<string, number> = {};
      let totalExp = 0;

      transactions.forEach(t => {
        // Ignora transferências na análise de gastos/receitas reais
        if (t.type === 'transfer' || t.category === 'Transferência') return;

        const amt = Number(t.amount);
        const dateKey = t.date.split('T')[0];

        if (t.type === 'expense') {
          totalExp += amt;
          
          // Agrupamento por Categoria (a chave é a string digitada no form)
          const cat = (t.category || 'Outros').trim();
          catMap[cat] = (catMap[cat] || 0) + amt;

          if (t.location) {
            const loc = t.location.trim();
            if (!locMap[loc]) locMap[loc] = { value: 0, count: 0 };
            locMap[loc].value += amt;
            locMap[loc].count += 1;
          }
          evolutionMap[dateKey] = (evolutionMap[dateKey] || 0) + amt;
        }
      });

      const evolutionData = Object.entries(evolutionMap).map(([date, value]) => ({
        date,
        displayDate: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        value
      }));

      const categoryData = Object.entries(catMap)
        .map(([name, value], index) => ({
          name,
          value,
          color: CHART_COLORS[index % CHART_COLORS.length]
        }))
        .sort((a, b) => b.value - a.value);

      const locationData = Object.entries(locMap)
        .map(([name, data]) => ({
          name,
          value: data.value,
          count: data.count
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const diffDays = Math.max(1, Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24)));
      const dailyAverage = totalExp / diffDays;

      setMacroData({ 
        categoryData, 
        locationData, 
        monthlyData: [], 
        evolutionData,
        totalExpense: totalExp,
        dailyAverage
      });

    } catch (err) {
      console.error('Erro no Analytics Hook:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchMacroData(); }, [fetchMacroData]);

  const analyzeItemHistory = useCallback(async (itemName: string) => {
    if (!itemName.trim()) return null;
    const term = `%${itemName.trim()}%`;
    try {
      const { data: items } = await supabase
        .from('transaction_items')
        .select('unit_price, quantity, amount, transactions!inner (date, location)')
        .ilike('name', term)
        .order('created_at', { ascending: false });

      if (!items || items.length === 0) return { found: false };

      const history = items.map((i: any) => ({
        date: i.transactions.date,
        price: i.unit_price || (i.amount / i.quantity),
        location: i.transactions.location || '?',
        quantity: i.quantity
      }));

      const totalSpent = history.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      const avgPrice = history.reduce((acc, curr) => acc + curr.price, 0) / history.length;

      return {
        found: true,
        averagePrice: avgPrice,
        totalSpent,
        history,
        lastPrice: history[0].price
      };
    } catch (err) { return { found: false }; }
  }, []);

  return { loading, macroData, analyzeItemHistory };
}
