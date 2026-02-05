// --- ENUMS E TIPOS AUXILIARES (Mantidos) ---
export type AgencyStatus = 'active' | 'lead' | 'churned';
export type CrmStatus = 'novo_lead' | 'primeiro_contato' | 'proposta_enviada' | 'negociacao' | 'fechado' | 'perdido';
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected';
export type ProjectStatus = 'pendente' | 'em_andamento' | 'aprovacao' | 'concluido';
export type PaymentMethod = 'pix' | 'boleto' | 'cartao' | 'transferencia';
export type ChargeType = 'unique' | 'monthly'; // Importante para diferenciar recorrente de pontual

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
  name: string; // Refatorado: Banco usa 'name', não 'title'
  category: string;
  description?: string;
  default_price: number;
  charge_type: ChargeType;
  active: boolean;
  user_id: string;
}

// --- ITEM DA PROPOSTA (O Snapshot Editável - Tabela 'quote_items') ---
export interface AgencyQuoteItem {
  id?: string; 
  quote_id?: string;
  service_id?: string; // Link opcional ao catálogo original
  
  // Dados copiados (Snapshot)
  title: string; // Na proposta chamamos de title (item da lista)
  description?: string;
  unit_price: number; // O PREÇO EDITÁVEL FICA AQUI
  quantity: number;
  total_price?: number; // Novo: Preço total da linha (unit * qtd)
  charge_type: ChargeType;
  order_index?: number;
}

// --- PROPOSTA (Cabeçalho - Tabela 'quotes') ---
export interface AgencyQuote {
  id: string;
  quote_number?: number; // Novo campo sequencial
  client_id: string;
  client?: AgencyClient; // Expansão do cliente
  
  title: string;
  status: QuoteStatus;
  valid_until?: string;
  notes?: string;

  // Campos de Narrativa (Novos)
  introduction_text?: string;
  strategy_text?: string;
  terms_conditions?: string;
  
  // Totais calculados no Frontend
  total_one_time?: number;
  total_monthly?: number;
  
  items?: AgencyQuoteItem[]; // Array com os itens
  
  user_id: string;
  created_at?: string;
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