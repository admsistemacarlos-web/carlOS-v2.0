export type LogCategory = 
  | 'food'        // Ração
  | 'treats'      // Petiscos
  | 'pads'        // Tapetes Higiênicos
  | 'cleaning'    // Seca Xixi / Limpeza
  | 'hygiene'     // Banho e Tosa
  | 'health'      // Veterinário
  | 'vaccine'     // Vacinas
  | 'medication'  // Medicamentos
  | 'measurement'; // Peso/Medidas

export interface Pet {
  id: string;
  name: string;
  breed: string;
  birth_date: string;
  color_theme?: string;
  user_id: string;
}

export interface PetLog {
  id: string;
  pet_id: string;
  category: LogCategory;
  title: string;
  cost: number;
  event_date: string;
  next_due_date?: string | null;
  done?: boolean; // Indica se o compromisso foi realizado
  value?: number | null; // Usado para peso (kg)
  location?: string | null;
  notes?: string | null;
  created_at?: string;
  user_id?: string;
}