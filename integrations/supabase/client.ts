import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
// ATENÇÃO: Estas chaves são públicas (anon key) mas ainda assim devem ser protegidas
// Quando publicar o site, mova para variáveis de ambiente (.env)
const SUPABASE_URL = "https://ayhjuygbywilhiknffgj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JAELS7rVzj-eIA3SGbF71w_sE52FZYW";

// Validação básica
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("❌ Erro: Credenciais do Supabase não configuradas!");
}

// Cliente Supabase com configurações de segurança
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configurações extras de segurança
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
// @ts-ignore
if (import.meta.env?.DEV) {
  console.log('✅ Supabase conectado:', SUPABASE_URL);
}
