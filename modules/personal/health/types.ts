
export interface TherapySession {
  id: string;
  date: string;
  professional: string;
  type: string;
  notes: string;
  insights: string;
  next_appointment?: string;
  action_items?: string;
  user_id: string;
}

export interface WellnessLog {
  id: string;
  date: string;
  weight: number | null;
  workout_done: boolean;
  workout_type: string | null;
  headache: boolean;
  energy_drink_consumed: boolean;
  notes: string | null;
  user_id: string;
}

// --- WORKOUT TYPES ---

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string; // 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'
  user_id: string;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  set_order: number;
  completed?: boolean; // Controle local/visual
  created_at: string;
  // Join fields
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: string;
  name: string; // Ex: "Treino A - Peito"
  started_at: string;
  ended_at: string | null;
  user_id: string;
  // Virtual/Computed
  duration_minutes?: number;
  total_volume?: number;
  sets?: WorkoutSet[];
}
