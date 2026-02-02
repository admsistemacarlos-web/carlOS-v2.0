
export type AccountType = 'checking' | 'investment' | 'cash';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'pending' | 'paid';
export type CategoryType = 'income' | 'expense' | 'transfer';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type: CategoryType;
  user_id?: string;
  created_at?: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  user_id?: string;
  created_at?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit_amount: number;
  closing_day: number;
  due_day: number;
  user_id?: string;
  created_at?: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  name: string;
  amount: number;      // Valor total do item
  quantity: number;
  unit_price?: number; // Preço unitário (opcional)
  category_id?: string;
  item_category?: string; // Categoria específica do item (ex: Limpeza, Alimentação)
  
  // Relacionamento Opcional (Join)
  category?: Category;
}

export interface TransactionPayment {
  id?: string;
  transaction_id?: string;
  amount: number;
  payment_method: 'account' | 'credit_card';
  account_id?: string | null;
  credit_card_id?: string | null;
  installments?: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  date: string; // ISO 8601 string
  payment_date?: string | null;

  // Campos de Inteligência
  location?: string | null; // Estabelecimento
  tags?: string[] | null;   // Etiquetas para agrupamento

  // Lista de Itens Detalhados (Opcional)
  items?: TransactionItem[];

  // Lista de Pagamentos (Multi-meios)
  payments?: TransactionPayment[];

  // Parcelamento
  is_installment: boolean;
  installment_current?: number | null;
  installment_total?: number | null;

  // Foreign Keys (Legacy / Single Payment Source of Truth)
  account_id?: string | null;
  destination_account_id?: string | null; // Para transferências
  credit_card_id?: string | null;
  category_id?: string | null;
  bill_id?: string | null;
  user_id?: string;
  created_at?: string;

  // Campos de Controle Frontend (UI)
  is_locked?: boolean; 
  is_recurring?: boolean;

  // Columns
  category: string; // Mantido para retrocompatibilidade (Categoria Geral)

  // Relacionamentos (Joins)
  account?: Account;
  credit_card?: CreditCard;
  bill?: Bill;
}

export interface Bill {
  id: string;
  description: string;
  category: string;
  amount: number;
  
  // Datas
  due_date: string;
  payment_date?: string | null;
  
  // Status
  status: 'pending' | 'paid' | 'overdue';
  
  // Tipo
  type?: 'fixed' | 'variable' | 'temporary';
  
  // Recorrência
  is_recurring?: boolean;
  recurrence_period?: 'monthly' | 'yearly' | 'weekly';

  // Parcelamento
  is_installment?: boolean;
  installment_number?: number;
  total_installments?: number;
  installment_group_id?: string;
  parent_installment_id?: string;

  // Vínculo com transação (Pagamento)
  transaction_id?: string | null;
  
  // Metadados
  user_id?: string;
  created_at?: string;
  updated_at?: string;

  // Relacionamento
  transaction?: Transaction;
}

export interface Subscription {
  id: string;
  service_name: string;
  amount: number;
  billing_cycle: 'monthly' | 'yearly';
}

export interface CardTransactionView {
  payment_id: string;
  credit_card_id: string;
  card_amount: number;
  installments: number;
  transaction_id: string;
  description: string;
  date: string;
  category: string;
  is_locked: boolean;
  user_id: string;
}
