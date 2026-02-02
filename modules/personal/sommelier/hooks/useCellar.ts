
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../../integrations/supabase/client';
import { Beverage } from '../types';
import { useAuth } from '../../../../contexts/AuthContext';

export function useCellar() {
  const { user } = useAuth();
  const [beverages, setBeverages] = useState<Beverage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBeverages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('personal_cellar_logs')
        .select('*')
        .order('consumed_date', { ascending: false });

      if (error) throw error;
      setBeverages(data as Beverage[]);
    } catch (err) {
      console.error('Erro ao buscar adega:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addBeverage = async (data: Partial<Beverage>) => {
    if (!user) return;
    const { error } = await supabase
      .from('personal_cellar_logs')
      .insert([{ ...data, user_id: user.id }]);
    
    if (error) throw error;
    await fetchBeverages();
  };

  const updateBeverage = async (id: string, updates: Partial<Beverage>) => {
    if (!user) return;
    const { error } = await supabase
      .from('personal_cellar_logs')
      .update(updates)
      .eq('id', id);
      
    if (error) throw error;
    await fetchBeverages();
  };

  const deleteBeverage = async (id: string) => {
    const { error } = await supabase
      .from('personal_cellar_logs')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    await fetchBeverages();
  };

  useEffect(() => {
    fetchBeverages();
  }, [fetchBeverages]);

  return { beverages, loading, fetchBeverages, addBeverage, updateBeverage, deleteBeverage };
}
