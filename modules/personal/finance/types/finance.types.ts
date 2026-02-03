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
  amount: number;
  quantity: number;
  unit_price?: number;
  category_id?: string;
  item_category?: string;
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
  date: string;
  payment_date?: string | null;

  // Campos de Inteligência
  location?: string | null;
  tags?: string[] | null;

  // Lista de Itens Detalhados
  items?: TransactionItem[];

  // Lista de Pagamentos (Multi-meios)
  payments?: TransactionPayment[];

  // Parcelamento
  is_installment: boolean;
  installment_current?: number | null;
  installment_total?: number | null;

  // Foreign Keys
  account_id?: string | null;
  destination_account_id?: string | null;
  credit_card_id?: string | null;
  category_id?: string | null;
  bill_id?: string | null;
  user_id?: string;
  created_at?: string;

  // ✅ NOVOS CAMPOS - Soft Delete e Period Lock
  deleted_at?: string | null;  // Quando preenchido, transação está "na lixeira"
  is_locked?: boolean;         // Quando true, pertence a período fechado

  // Campos de Controle Frontend
  is_recurring?: boolean;

  // Categoria (texto para retrocompatibilidade)
  category: string;

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

// ✅ NOVO: Interface para fechamento de período
export interface AccountPeriodLock {
  id: string;
  account_id: string;
  user_id: string;
  period_end_date: string;
  confirmed_balance: number;
  calculated_balance: number;
  adjustment_transaction_id?: string | null;
  locked_at: string;
  notes?: string;
  
  // Relacionamento
  account?: Account;
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