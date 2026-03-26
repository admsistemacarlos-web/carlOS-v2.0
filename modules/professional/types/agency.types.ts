// --- ENUMS E TIPOS AUXILIARES (Mantidos) ---
export type AgencyStatus = 'active' | 'lead' | 'churned';
export type CrmStatus = 'novo_lead' | 'primeiro_contato' | 'proposta_enviada' | 'negociacao' | 'fechado' | 'perdido';
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected';
export type ProjectStatus = 'pendente' | 'em_andamento' | 'aprovacao' | 'concluido';
export type PaymentMethod = 'pix' | 'boleto' | 'cartao' | 'transferencia';
export type ChargeType = 'unique' | 'monthly'; 
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';


// --- EVENTOS E CALENDÁRIO (NOVOS) ---
export type AgencyEventType = 'meeting' | 'call' | 'deadline' | 'other';

export interface AgencyEvent {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  description?: string;
  event_type: AgencyEventType;
  start_time: string;
  end_time?: string;
  meeting_link?: string;
  created_at?: string;
}

export interface GlobalCalendarItem {
  item_id: string;
  user_id: string;
  client_id: string;
  client_name: string;
  client_logo: string | null;
  title: string;
  event_date: string;
  item_type: 'task' | 'meeting';
  item_status: string;
}

// --- REUNIÕES ---
export interface AgencyMeeting {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  description?: string;
  meeting_date: string;
  duration_minutes?: number;
  location?: string;
  meeting_link?: string;
  status?: MeetingStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  client?: AgencyClient;
}

// --- CLIENTE (Mantido com sua estrutura rica) ---
export interface AgencyClient {
  id: string;
  user_id: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  cpf_cnpj?: string;
  address?: string;
  status: AgencyStatus;
  drive_folder_url?: string;
  website?: string;
  instagram?: string;
  notes?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

// --- SERVIÇO (Catálogo Base - Tabela 'services') ---
export interface AgencyServiceCatalog {
  id: string;
  name: string; 
  category: string;
  description?: string;
  default_price: number;
  charge_type: ChargeType;
  active: boolean;
  user_id: string;
}

// --- ITEM DA PROPOSTA ---
export interface AgencyQuoteItem {
  id?: string; 
  quote_id?: string;
  service_id?: string; 
  title: string; 
  description?: string;
  unit_price: number; 
  quantity: number;
  total_price?: number; 
  charge_type: ChargeType;
  order_index?: number;
}

// --- PROPOSTA ---
export interface AgencyQuote {
  id: string;
  quote_number?: number; 
  client_id: string;
  client?: AgencyClient; 
  title: string;
  status: QuoteStatus;
  valid_until?: string;
  notes?: string;
  total_one_time?: number;
  total_monthly?: number;
  items?: AgencyQuoteItem[]; 
  user_id: string;
  created_at?: string;
}

// --- CONTRATOS ---
export type ContractStatus = 'rascunho' | 'enviado' | 'assinado' | 'vencido';

export interface AgencyContract {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  status: ContractStatus;
  value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  file_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// --- RECIBOS DE PAGAMENTO ---
export type PaymentMethodDoc = 'pix' | 'ted' | 'dinheiro' | 'cartão' | 'boleto';

export interface AgencyPaymentReceipt {
  id: string;
  user_id: string;
  client_id: string;
  description: string;
  amount: number;
  payment_date: string;
  payment_method?: PaymentMethodDoc | null;
  reference?: string | null;
  file_url?: string | null;
  notes?: string | null;
  created_at: string;
}

// --- PROJETOS (Mantido) ---
export interface AgencyProject {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  status: ProjectStatus;
  due_date?: string;
  priority: 'baixa' | 'media' | 'alta';
  created_at?: string;
  client?: AgencyClient;
}