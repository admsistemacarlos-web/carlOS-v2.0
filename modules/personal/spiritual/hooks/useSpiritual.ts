
import { useState, useCallback } from "react";
import { supabase } from "../../../../integrations/supabase/client";
import { useAuth } from "../../../../contexts/AuthContext";

// Adicionado 'spiritual_hymns' e 'spiritual_books'
export function useSpiritual<T>(tableName: 'sermon_notes' | 'prayer_requests' | 'bible_study_notes' | 'prayer_models' | 'spiritual_hymns' | 'spiritual_books') {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase.from(tableName).select('*');
      
      // Ordenação específica por tabela
      if (tableName === 'sermon_notes') {
        query = query.order('date', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: result, error } = await query;
      if (error) throw error;
      setData(result as T[]);
    } catch (err) {
      console.error(`Erro ao buscar ${tableName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [user, tableName]);

  const createItem = useCallback(async (item: any) => {
    if (!user) return;
    try {
      const { error } = await supabase.from(tableName).insert([{ ...item, user_id: user.id }]);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert(`Erro ao criar: ${err.message}`);
    }
  }, [user, tableName, fetchData]);

  const updateItem = useCallback(async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from(tableName).update(updates).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert(`Erro ao atualizar: ${err.message}`);
    }
  }, [tableName, fetchData]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  }, [tableName, fetchData]);

  return { data, loading, fetchData, createItem, updateItem, deleteItem };
}
