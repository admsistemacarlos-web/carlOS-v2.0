-- ============================================================
-- MIGRATION: Adiciona tabelas agency_contracts e agency_payments
-- Rodar no Supabase SQL Editor: https://supabase.com/dashboard/project/ayhjuygbywilhiknffgj/sql
-- ============================================================

-- TABELA DE CONTRATOS
CREATE TABLE IF NOT EXISTS agency_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  client_id uuid REFERENCES agency_clients(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  value numeric,
  start_date date,
  end_date date,
  file_url text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT agency_contracts_status_check
    CHECK (status IN ('rascunho', 'enviado', 'assinado', 'vencido'))
);

-- TABELA DE RECIBOS DE PAGAMENTO
CREATE TABLE IF NOT EXISTS agency_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  client_id uuid REFERENCES agency_clients(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  payment_method text,
  reference text,
  file_url text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT agency_payments_method_check
    CHECK (payment_method IS NULL OR payment_method IN ('pix', 'ted', 'dinheiro', 'cartão', 'boleto'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agency_contracts_client_id ON agency_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_agency_contracts_user_id ON agency_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_payments_client_id ON agency_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_agency_payments_user_id ON agency_payments(user_id);

-- Row Level Security
ALTER TABLE agency_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contracts" ON agency_contracts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own payments" ON agency_payments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger para auto-atualizar updated_at nos contratos
CREATE OR REPLACE FUNCTION update_agency_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agency_contracts_updated_at
  BEFORE UPDATE ON agency_contracts
  FOR EACH ROW EXECUTE FUNCTION update_agency_contracts_updated_at();
