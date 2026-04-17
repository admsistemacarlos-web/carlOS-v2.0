/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const INVALID_SUPABASE_URL_MESSAGE =
  '❌ Erro: defina uma URL HTTP(S) válida em VITE_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL.';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '❌ Erro: credenciais do Supabase não configuradas. Use VITE_SUPABASE_* ou NEXT_PUBLIC_SUPABASE_* no .env.local.'
  );
}

let supabaseOrigin: URL;

try {
  supabaseOrigin = new URL(SUPABASE_URL);
} catch {
  throw new Error(INVALID_SUPABASE_URL_MESSAGE);
}

if (!/^https?:$/.test(supabaseOrigin.protocol)) {
  throw new Error(INVALID_SUPABASE_URL_MESSAGE);
}

export const SUPABASE_HOST = supabaseOrigin.hostname;

export const getSupabaseConnectionErrorMessage = (error: unknown) => {
  const normalizedMessage =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  const isNetworkFailure =
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('fetch') ||
    normalizedMessage.includes('networkerror') ||
    normalizedMessage.includes('network request failed') ||
    normalizedMessage.includes('authretryablefetcherror');

  if (!isNetworkFailure) {
    return null;
  }

  return `Nao foi possivel conectar ao Supabase (${SUPABASE_HOST}). Verifique se esse hostname do projeto realmente existe no painel do Supabase e reinicie/rebuild o app apos corrigir o .env.local.`;
};

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
    },
  }
});

if (import.meta.env?.DEV) {
  console.log(`✅ Supabase configurado para ${SUPABASE_HOST}`);
}
