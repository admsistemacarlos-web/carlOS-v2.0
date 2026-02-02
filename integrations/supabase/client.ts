import { createClient } from '@supabase/supabase-js';

// Busca credenciais das variáveis de ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("❌ Erro: Credenciais do Supabase não configuradas no .env.local!");
}

// Cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'carlOS'
    }
  }
});

// Log apenas em desenvolvimento
if (import.meta.env?.DEV) {
  console.log('✅ Supabase conectado');
}