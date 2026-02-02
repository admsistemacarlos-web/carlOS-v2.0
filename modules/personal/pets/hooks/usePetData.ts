
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../../integrations/supabase/client';
import { Pet, PetLog } from '../types';
import { useAuth } from '../../../../contexts/AuthContext';

export function usePetData() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [logs, setLogs] = useState<PetLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('pets').select('*').order('created_at', { ascending: true });
    if (data) setPets(data);
    setLoading(false);
  }, [user]);

  const fetchLogs = useCallback(async (petId: string) => {
    const { data } = await supabase
      .from('pet_logs')
      .select('*')
      .eq('pet_id', petId)
      .order('event_date', { ascending: false }); // Mais recente primeiro
    if (data) setLogs(data);
  }, []);

  const addPet = async (petData: Partial<Pet>) => {
    if (!user) return;
    const { error } = await supabase.from('pets').insert([{ ...petData, user_id: user.id }]);
    if (error) throw error;
    await fetchPets();
  };

  const addLog = async (logData: Partial<PetLog>) => {
    if (!user) return;
    const { error } = await supabase.from('pet_logs').insert([{ ...logData, user_id: user.id }]);
    if (error) throw error;
    if (logData.pet_id) await fetchLogs(logData.pet_id);
  };

  const updateLog = async (logId: string, updates: Partial<PetLog>) => {
    if (!user) return;
    const { error } = await supabase.from('pet_logs').update(updates).eq('id', logId);
    if (error) throw error;
    // Precisamos do pet_id para atualizar a lista, se não vier nos updates, pegamos do log atual
    if (updates.pet_id) {
        await fetchLogs(updates.pet_id);
    } else {
        // Fallback: recarregar logs se não tivermos o pet_id fácil (cenário raro na UI atual)
        const updatedLog = logs.find(l => l.id === logId);
        if (updatedLog) await fetchLogs(updatedLog.pet_id);
    }
  };

  const deleteLog = async (logId: string, petId: string) => {
    const { error } = await supabase.from('pet_logs').delete().eq('id', logId);
    if (error) throw error;
    await fetchLogs(petId);
  };

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  return { pets, logs, loading, fetchLogs, addPet, addLog, updateLog, deleteLog };
}
