
import { useState, useCallback } from "react";
import { supabase } from "../../../../integrations/supabase/client";
import { useAuth } from "../../../../contexts/AuthContext";
// Importação dos tipos centralizados
import { TherapySession, WellnessLog } from "../types";

type HealthTable = 'health_therapy_sessions' | 'health_wellness_logs';

// Mapeamento genérico para auxiliar na tipagem de retorno
type HealthDataType<T> = T extends 'health_therapy_sessions' ? TherapySession : WellnessLog;

export function useHealth<T>(tableName: HealthTable) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .select('*')
        .order('date', { ascending: false }); // Ordenação decrescente

      if (error) throw error;
      setData(result as T[]);
    } catch (err: any) {
      console.error(`Erro ao buscar ${tableName}:`, err.message || JSON.stringify(err));
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
      alert(`Erro ao criar: ${err.message || 'Erro desconhecido'}`);
      throw err;
    }
  }, [user, tableName, fetchData]);

  const updateItem = useCallback(async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from(tableName).update(updates).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert(`Erro ao atualizar: ${err.message || 'Erro desconhecido'}`);
      throw err;
    }
  }, [tableName, fetchData]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message || 'Erro desconhecido'}`);
      throw err;
    }
  }, [tableName, fetchData]);

  return { data, loading, fetchData, createItem, updateItem, deleteItem };
}
