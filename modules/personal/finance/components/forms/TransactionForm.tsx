
import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { 
  ArrowRightLeft, ArrowUpCircle, ArrowDownCircle, 
  Calendar, MapPin, Tag, Plus, X, Save, Loader2, 
  Wallet, CreditCard, ShoppingBag, Check, Search, AlertCircle, Repeat, Clock,
  AlignLeft, DollarSign, Split
} from 'lucide-react';
import { supabase } from '../../../../../integrations/supabase/client';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useAccounts, useCards } from '../../hooks/useFinanceData';
import { Transaction } from '../../types/finance.types';
import { toISOWithNoon, getTodayLocal } from '../../utils/dateHelpers';

// --- TIPOS ---

type TransactionType = 'expense' | 'income' | 'transfer';
type StatusType = 'paid' | 'pending';

interface TransactionFormData {
  amount: number | string;
  description: string;
  type: TransactionType;
  date: string;
  category_id: string | null;
  category_name?: string; // Campo auxiliar para salvar o nome texto
  location: string;
  tags: string[];
  
  // Controle Lógico
  is_recurring: boolean;
  status: StatusType;

  // Transferência
  origin_account_id: string | null;
  destination_account_id: string | null;

  // Pagamento Simples (Despesa/Receita)
  payment_method: 'account' | 'credit_card';
  account_id: string | null;
  credit_card_id: string | null;
  installments: number; // Parcelamento simples (cartão)

  // Itens Detalhados
  items: { 
    name: string; 
    quantity: number; 
    unit_price: number; 
    // subtotal calculado visualmente
  }[];

  // Split Payments (Apenas Despesa Paga)
  use_split_payment: boolean;
  payments: {
    method: 'account' | 'credit_card';
    account_id?: string;
    credit_card_id?: string;
    amount: number;
    installments?: number;
  }[];
}

interface TransactionFormProps {
  onSuccess: () => void;
  transactionToEdit?: Transaction | null;
  isDuplicate?: boolean;
}

// --- COMPONENTE 1: SMART COMBOBOX (Categorias On-The-Fly) ---

const SmartCombobox = ({ 
  value, 
  onChange, 
  type 
}: { 
  value: string | null, 
  onChange: (id: string, name: string) => void, 
  type: 'income' | 'expense' | 'transfer' 
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<{id: string, name: string}[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchCats = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .eq('type', type)
        .order('name');
      if (data) setOptions(data);
    };
    fetchCats();
  }, [type, user]);

  const selectedName = options.find(o => o.id === value)?.name || '';
  const filtered = options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));

  const handleCreate = async () => {
    if (!user || !query.trim()) return;
    setLoading(true);
    try {
      const payload = { name: query.trim(), type, user_id: user.id };
      const { data, error } = await supabase.from('categories').insert(payload).select().single();
      if (error) throw error;
      if (data) {
        setOptions(prev => [...prev, data]);
        onChange(data.id, data.name);
        setIsOpen(false);
        setQuery('');
      }
    } catch (err) {
      console.error("Erro ao criar categoria", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="flex items-center gap-2 w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-3 cursor-text focus-within:ring-2 focus-within:ring-olive/20"
        onClick={() => setIsOpen(true)}
      >
        <Tag size={16} className="text-stone-400 shrink-0" />
        <input 
          className="bg-transparent outline-none w-full text-sm text-coffee placeholder-stone-400"
          placeholder={selectedName || "Selecione..."}
          value={isOpen ? query : selectedName}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
        />
        {loading && <Loader2 size={14} className="animate-spin text-olive" />}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-stone-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map(opt => (
              <button
                key={opt.id}
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 text-coffee transition-colors flex justify-between"
                onClick={() => { onChange(opt.id, opt.name); setIsOpen(false); setQuery(''); }}
              >
                {opt.name}
                {value === opt.id && <Check size={14} className="text-olive" />}
              </button>
            ))
          ) : (
            <div className="p-2">
              <button 
                type="button"
                onClick={handleCreate}
                className="w-full bg-olive/10 text-olive text-xs font-bold py-2 rounded-lg hover:bg-olive/20 transition-colors"
              >
                + Criar "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- COMPONENT 2: TAG INPUT ---

const TagInput = ({ value = [], onChange }: { value: string[], onChange: (tags: string[]) => void }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        if (!value.includes(input.trim())) {
          onChange([...value, input.trim()]);
        }
        setInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(t => t !== tagToRemove));
  };

  return (
    <div className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 min-h-[46px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-olive/20 transition-all">
      <div className="mr-1 text-stone-400 shrink-0"><Tag size={16} /></div>
      {value.map(tag => (
        <span key={tag} className="bg-white border border-stone-200 text-stone-600 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10} /></button>
        </span>
      ))}
      <input 
        className="bg-transparent outline-none text-sm text-coffee flex-1 min-w-[80px]"
        placeholder={value.length === 0 ? "Tags..." : ""}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

// --- MAIN FORM COMPONENT ---

const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, transactionToEdit, isDuplicate }) => {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { cards } = useCards();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showItems, setShowItems] = useState(false);

  const { register, control, handleSubmit, setValue, watch, reset } = useForm<TransactionFormData>({
    defaultValues: {
      type: 'expense',
      date: getTodayLocal(),
      amount: '',
      status: 'paid',
      is_recurring: false,
      payment_method: 'account',
      items: [],
      payments: [],
      tags: [],
      use_split_payment: false,
      category_name: ''
    }
  });

  // Watchers
  const type = watch('type');
  const isRecurring = watch('is_recurring');
  const status = watch('status');
  const paymentMethod = watch('payment_method');
  const items = watch('items');
  const useSplitPayment = watch('use_split_payment');
  const watchedAmount = watch('amount');

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: 'items' });
  const { fields: splitFields, append: appendSplit, remove: removeSplit } = useFieldArray({ control, name: 'payments' });

  // Sincronizar total dos itens com o valor total (apenas se itens existirem)
  useEffect(() => {
    if (items.length > 0) {
      const total = items.reduce((acc, item) => acc + ((item.quantity || 1) * (item.unit_price || 0)), 0);
      if (total > 0) setValue('amount', parseFloat(total.toFixed(2)));
    }
  }, [items, setValue]);

  // Carregar dados na edição
  useEffect(() => {
    if (transactionToEdit) {
      reset({
        description: transactionToEdit.description,
        amount: transactionToEdit.amount,
        date: transactionToEdit.date.split('T')[0],
        type: transactionToEdit.type as TransactionType,
        category_id: transactionToEdit.category_id,
        category_name: transactionToEdit.category, // Carrega o nome existente
        location: transactionToEdit.location || '',
        tags: transactionToEdit.tags || [],
        status: transactionToEdit.status as StatusType,
        account_id: transactionToEdit.account_id,
        credit_card_id: transactionToEdit.credit_card_id,
        payment_method: transactionToEdit.credit_card_id ? 'credit_card' : 'account',
        items: transactionToEdit.items || [],
        payments: transactionToEdit.payments?.map(p => ({
            method: p.payment_method,
            account_id: p.account_id || undefined,
            credit_card_id: p.credit_card_id || undefined,
            amount: p.amount,
            installments: p.installments || 1
        })) || [],
        use_split_payment: (transactionToEdit.payments && transactionToEdit.payments.length > 1) || false
      });
      if (transactionToEdit.items && transactionToEdit.items.length > 0) {
        setShowItems(true);
      }
    }
  }, [transactionToEdit, reset]);

  // Função Bloqueio de Scroll
  const preventScroll = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const onSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    try {
        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData.user;
        
        if (!currentUser) throw new Error("Usuário não autenticado");

        // Helper para sanitizar UUIDs (string vazia vira null para evitar erro 22P02 no PostgreSQL)
        const sanitizeUUID = (id: string | null | undefined) => (id && id.trim() !== "") ? id : null;

        // Validação de Split (se aplicável)
        const amountVal = Number(data.amount);
        if (data.use_split_payment && data.type === 'expense' && data.status === 'paid') {
            const splitTotal = data.payments.reduce((acc, p) => acc + Number(p.amount), 0);
            if (Math.abs(splitTotal - amountVal) > 0.05) {
                throw new Error(`A soma dos pagamentos (R$ ${splitTotal.toFixed(2)}) difere do total (R$ ${amountVal.toFixed(2)}).`);
            }
        }

        // 1. Prepara o Payload Base
        const dateISO = toISOWithNoon(data.date);
        
        const payload: any = {
            description: data.description,
            amount: amountVal,
            type: data.type, // 'expense', 'income', 'transfer'
            date: dateISO, 
            category: data.category_name || 'Outros', // Usa o nome salvo da Combobox
            category_id: sanitizeUUID(data.category_id), 
            // Se for transferência, o account_id principal deve ser a origem
            account_id: data.type === 'transfer' ? sanitizeUUID(data.origin_account_id) : sanitizeUUID(data.account_id), 
            destination_account_id: data.type === 'transfer' ? sanitizeUUID(data.destination_account_id) : null, 
            status: data.status, 
            tags: data.tags || [], 
            user_id: currentUser.id,
            location: data.location || null,
            created_at: new Date().toISOString()
        };

        // Campos específicos de pagamento
        if (!data.use_split_payment && data.type !== 'transfer') {
            if (data.payment_method === 'credit_card') {
                payload.credit_card_id = sanitizeUUID(data.credit_card_id);
                payload.account_id = null; // Garante que não é conta
                payload.is_locked = false;
                
                const installmentsNum = Number(data.installments);
                if (installmentsNum > 1) {
                    payload.is_installment = true;
                    payload.installment_total = installmentsNum;
                    payload.installment_current = 1;
                }
            } else {
                payload.credit_card_id = null;
                // account_id já está definido no bloco base (como account_id)
            }
        } else if (data.type === 'transfer') {
            // Limpa campos de cartão em transferências
            payload.credit_card_id = null;
        }

        let transactionId = transactionToEdit?.id;
        const targetTable = data.status === 'pending' && data.type !== 'transfer' ? 'bills' : 'transactions';

        // Ajuste para tabela Bills (usa due_date)
        if (targetTable === 'bills') {
            payload.due_date = dateISO;
            payload.type = 'variable'; // Tipo padrão de conta
            delete payload.date; // Remove date se for bill
        }

        // --- LÓGICA DE BIFURCAÇÃO (EDITAR vs CRIAR) ---
        
        if (transactionToEdit && !isDuplicate) {
            // >>> MODO EDIÇÃO (UPDATE) <<<
            delete payload.created_at; // Não atualiza data de criação

            // 1. Atualiza a transação pai
            const { error: updateError } = await supabase
                .from(targetTable)
                .update(payload)
                .eq('id', transactionId);

            if (updateError) throw updateError;

            // 2. Limpa filhos antigos (Items e Payments) para recriar
            if (targetTable === 'transactions') { 
                await supabase.from('transaction_items').delete().eq('transaction_id', transactionId);
                await supabase.from('transaction_payments').delete().eq('transaction_id', transactionId);
            }

        } else {
            // >>> MODO CRIAÇÃO (INSERT) <<<
            
            const { data: newTrans, error: insertError } = await supabase
                .from(targetTable)
                .insert([payload])
                .select()
                .single();

            if (insertError) throw insertError;
            transactionId = newTrans.id;
        }

        // --- GRAVAÇÃO DOS FILHOS (Para Pagos/Transações) ---
        if (targetTable === 'transactions' && transactionId) {
            
            // A. Salvar Itens (se houver)
            if (data.items && data.items.length > 0) {
                const itemsPayload = data.items.map(item => ({
                    transaction_id: transactionId,
                    name: item.name,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    amount: Number(item.quantity) * Number(item.unit_price),
                    user_id: currentUser.id
                }));
                await supabase.from('transaction_items').insert(itemsPayload);
            }

            // B. Salvar Pagamentos (Split)
            if (data.use_split_payment && data.payments && data.payments.length > 0) {
                const paymentsPayload = data.payments.map(p => ({
                    transaction_id: transactionId,
                    payment_method: p.method,
                    amount: Number(p.amount),
                    account_id: p.method === 'account' ? sanitizeUUID(p.account_id) : null,
                    credit_card_id: p.method === 'credit_card' ? sanitizeUUID(p.credit_card_id) : null,
                    installments: p.method === 'credit_card' ? (Number(p.installments) || 1) : 1,
                    user_id: currentUser.id
                }));
                await supabase.from('transaction_payments').insert(paymentsPayload);
            }
        }

        // --- RECORRÊNCIA ---
        if (data.is_recurring && (!transactionToEdit?.is_recurring || isDuplicate)) {
             await supabase.from('recurrence_rules').insert([{
                 user_id: currentUser.id,
                 description: data.description,
                 amount: amountVal,
                 type: data.type,
                 day_of_month: new Date(dateISO).getDate(),
                 category_id: sanitizeUUID(data.category_id),
                 account_id: sanitizeUUID(data.account_id),
                 credit_card_id: sanitizeUUID(data.credit_card_id)
             }]);
        }

        if (onSuccess) onSuccess();

    } catch (error: any) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar: ' + error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {/* 1. SELETOR DE TIPO */}
      <div className="flex bg-stone-100 p-1 rounded-xl">
        <button type="button" onClick={() => setValue('type', 'expense')} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${type === 'expense' ? 'bg-white text-terracotta shadow-sm' : 'text-stone-400'}`}>
          <ArrowDownCircle size={16} /> Despesa
        </button>
        <button type="button" onClick={() => setValue('type', 'income')} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${type === 'income' ? 'bg-white text-olive shadow-sm' : 'text-stone-400'}`}>
          <ArrowUpCircle size={16} /> Receita
        </button>
        <button type="button" onClick={() => setValue('type', 'transfer')} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${type === 'transfer' ? 'bg-white text-blue-500 shadow-sm' : 'text-stone-400'}`}>
          <ArrowRightLeft size={16} /> Transferência
        </button>
      </div>

      {/* 2. DESCRIÇÃO */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Descrição</label>
        <div className="relative">
            <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              {...register('description')}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-base font-medium text-coffee outline-none focus:ring-2 focus:ring-olive/20 placeholder-stone-400"
              placeholder={type === 'transfer' ? "Motivo da transferência..." : "Ex: Supermercado Semanal"}
              autoFocus
            />
        </div>
      </div>

      {/* 3. CAMPOS ESPECÍFICOS POR TIPO */}
      
      {/* MODO TRANSFERÊNCIA */}
      {type === 'transfer' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div>
              <label className="text-xs font-bold text-red-400 uppercase block mb-2">Sai de (Origem)</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-red-300" size={16} />
                <select {...register('origin_account_id')} className="w-full bg-white border border-red-200 rounded-xl pl-9 pr-3 py-3 text-sm outline-none">
                  <option value="">Selecione...</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance})</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-emerald-500 uppercase block mb-2">Entra em (Destino)</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300" size={16} />
                <select {...register('destination_account_id')} className="w-full bg-white border border-emerald-200 rounded-xl pl-9 pr-3 py-3 text-sm outline-none">
                  <option value="">Selecione...</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>
            </div>
          </div>
      ) : (
          // MODO PADRÃO (DESPESA/RECEITA)
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Data</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input 
                      type="date" 
                      {...register('date')} 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-3 py-3 text-sm text-coffee outline-none focus:border-olive"
                    />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Categoria</label>
                <Controller 
                  name="category_id" 
                  control={control}
                  render={({ field }) => (
                    <SmartCombobox 
                      value={field.value} 
                      onChange={(id, name) => {
                        field.onChange(id);
                        setValue('category_name', name);
                      }} 
                      type={type} 
                    />
                  )}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Local / Tags</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input 
                      {...register('location')}
                      placeholder="Local (Opcional)"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-coffee outline-none focus:border-olive placeholder-stone-400"
                    />
                </div>
              </div>
          </div>
      )}

      {/* 4. ITENS DA COMPRA (Apenas Despesa) */}
      {type === 'expense' && (
        <div className="border-t border-stone-100 pt-4">
            <button 
                type="button" 
                onClick={() => setShowItems(!showItems)}
                className="flex items-center gap-2 text-xs font-bold text-olive uppercase tracking-widest hover:underline transition-colors mb-4"
            >
                <ShoppingBag size={14} /> {showItems ? 'Ocultar Itens' : 'Detalhar Itens da Compra'}
            </button>

            {showItems && (
                <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-100 animate-fade-in mb-6">
                    {itemFields.map((field, index) => {
                        const qty = watch(`items.${index}.quantity`) || 0;
                        const price = watch(`items.${index}.unit_price`) || 0;
                        const subtotal = qty * price;

                        return (
                            <div key={field.id} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-stone-200 shadow-sm flex-wrap sm:flex-nowrap">
                                {/* Quantidade (Decimal) */}
                                <div className="relative w-20">
                                    <input 
                                        {...register(`items.${index}.quantity`)}
                                        placeholder="Qtd"
                                        type="number"
                                        step="0.001"
                                        onWheel={preventScroll}
                                        className="w-full bg-stone-50 rounded-lg p-2 text-xs text-center outline-none border border-stone-100 focus:border-olive"
                                    />
                                </div>
                                
                                <input 
                                    {...register(`items.${index}.name`)}
                                    placeholder="Item..."
                                    className="flex-1 bg-stone-50 rounded-lg p-2 text-xs outline-none border border-stone-100 min-w-[120px]"
                                />
                                
                                <div className="relative w-24">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-stone-400">R$</span>
                                    <input 
                                        {...register(`items.${index}.unit_price`)}
                                        placeholder="Unit."
                                        type="number" step="0.01"
                                        onWheel={preventScroll}
                                        className="w-full bg-stone-50 rounded-lg p-2 pl-6 text-xs text-right outline-none border border-stone-100"
                                    />
                                </div>

                                <div className="w-20 text-right text-xs font-bold text-stone-500 pr-2">
                                    {subtotal.toFixed(2)}
                                </div>

                                <button type="button" onClick={() => removeItem(index)} className="p-2 text-stone-300 hover:text-red-500"><X size={14} /></button>
                            </div>
                        );
                    })}
                    <button 
                        type="button"
                        onClick={() => appendItem({ name: '', quantity: 1, unit_price: 0 })}
                        className="w-full py-2 border border-dashed border-olive/30 rounded-xl text-[10px] font-bold text-olive uppercase tracking-widest hover:bg-olive/5 flex items-center justify-center gap-1"
                    >
                        <Plus size={12} /> Adicionar Item
                    </button>
                </div>
            )}
        </div>
      )}

      {/* 5. VALOR TOTAL (Destaque) */}
      <div className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm text-center">
        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 block">Valor Total</label>
        <div className="relative inline-block w-full max-w-xs">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-stone-300">R$</span>
            <input 
              type="number" 
              step="0.01" 
              onWheel={preventScroll}
              {...register('amount')}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 text-3xl font-bold text-coffee text-center outline-none focus:ring-2 focus:ring-olive/20 placeholder-stone-200"
              placeholder="0.00"
            />
        </div>
      </div>

      {/* 6. FORMA DE PAGAMENTO */}
      {type === 'transfer' ? (
          /* Já renderizado acima */
          null 
      ) : (
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    {type === 'income' ? 'Destino do Recurso' : 'Forma de Pagamento'}
                  </label>
                  
                  {/* Status Toggles */}
                  <div className="flex gap-2">
                    <button 
                        type="button" 
                        onClick={() => setValue('status', status === 'pending' ? 'paid' : 'pending')}
                        className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${status === 'pending' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-stone-200 text-stone-400'}`}
                    >
                        <Clock size={12} /> Pendente
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setValue('is_recurring', !isRecurring)}
                        className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${isRecurring ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-stone-200 text-stone-400'}`}
                    >
                        <Repeat size={12} /> Repetir
                    </button>
                  </div>
              </div>
              
              {/* Seletor Simples vs Split (Apenas Despesa Paga) */}
              {type === 'expense' && status === 'paid' && (
                  <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="checkbox" 
                        id="use_split" 
                        {...register('use_split_payment')} 
                        className="w-4 h-4 accent-olive cursor-pointer"
                      />
                      <label htmlFor="use_split" className="text-xs font-bold text-olive cursor-pointer flex items-center gap-1">
                          <Split size={14} /> Dividir Pagamento (Split)
                      </label>
                  </div>
              )}

              {!useSplitPayment ? (
                  /* PAGAMENTO ÚNICO */
                  <>
                    <div className="flex gap-2">
                        <button 
                        type="button" 
                        onClick={() => setValue('payment_method', 'account')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all border ${paymentMethod === 'account' ? 'bg-white border-olive text-olive shadow-sm' : 'bg-stone-100 border-transparent text-stone-400'}`}
                        >
                        Conta / Pix
                        </button>
                        <button 
                        type="button" 
                        onClick={() => setValue('payment_method', 'credit_card')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all border ${paymentMethod === 'credit_card' ? 'bg-white border-terracotta text-terracotta shadow-sm' : 'bg-stone-100 border-transparent text-stone-400'}`}
                        >
                        Cartão Crédito
                        </button>
                    </div>

                    {paymentMethod === 'account' ? (
                        <div className="relative animate-fade-in">
                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                        <select {...register('account_id')} className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-3 py-3 text-sm text-coffee outline-none focus:border-olive appearance-none cursor-pointer">
                            <option value="">Selecione a Conta...</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance})</option>)}
                        </select>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-fade-in">
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                                <select {...register('credit_card_id')} className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-3 py-3 text-sm text-coffee outline-none focus:border-terracotta appearance-none cursor-pointer">
                                    <option value="">Selecione o Cartão...</option>
                                    {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <select {...register('installments')} className="w-full bg-white border border-stone-200 rounded-xl px-3 py-3 text-sm text-coffee outline-none focus:border-terracotta">
                                <option value="1">À vista (1x)</option>
                                {[2,3,4,5,6,10,12].map(i => <option key={i} value={i}>{i}x</option>)}
                            </select>
                        </div>
                    )}
                  </>
              ) : (
                  /* SPLIT PAYMENT */
                  <div className="space-y-3 animate-fade-in bg-white p-4 rounded-xl border border-stone-200">
                      {splitFields.map((field, index) => {
                          const method = watch(`payments.${index}.method`);
                          return (
                              <div key={field.id} className="p-3 bg-stone-50 rounded-lg border border-stone-100 space-y-2 relative">
                                  <button type="button" onClick={() => removeSplit(index)} className="absolute top-2 right-2 text-stone-300 hover:text-red-500"><X size={14}/></button>
                                  
                                  <div className="flex gap-2">
                                      <select {...register(`payments.${index}.method`)} className="bg-white border rounded text-xs p-1">
                                          <option value="account">Conta</option>
                                          <option value="credit_card">Cartão</option>
                                      </select>
                                      
                                      {method === 'account' ? (
                                          <select {...register(`payments.${index}.account_id`)} className="flex-1 bg-white border rounded text-xs p-1">
                                              <option value="">Conta...</option>
                                              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                          </select>
                                      ) : (
                                          <div className="flex-1 flex gap-1">
                                              <select {...register(`payments.${index}.credit_card_id`)} className="flex-1 bg-white border rounded text-xs p-1">
                                                  <option value="">Cartão...</option>
                                                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                              </select>
                                              <input type="number" placeholder="Parc." {...register(`payments.${index}.installments`)} className="w-12 bg-white border rounded text-xs p-1 text-center" onWheel={preventScroll} />
                                          </div>
                                      )}
                                  </div>
                                  
                                  <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">R$</span>
                                      <input 
                                          type="number" step="0.01" 
                                          {...register(`payments.${index}.amount`)}
                                          onWheel={preventScroll}
                                          className="w-full pl-6 p-1 bg-white border rounded text-sm font-bold"
                                      />
                                  </div>
                              </div>
                          );
                      })}
                      <button 
                          type="button" 
                          onClick={() => appendSplit({ method: 'account', amount: 0 })}
                          className="w-full py-2 border border-dashed border-olive/30 rounded-lg text-xs font-bold text-olive hover:bg-olive/5"
                      >
                          + Adicionar Meio de Pagamento
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* 7. FOOTER ACTIONS */}
      <div className="pt-6 border-t border-stone-100 flex justify-end gap-3">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-[#3C3633] hover:bg-black text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 w-full justify-center md:w-auto"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isRecurring ? 'Salvar Recorrência' : status === 'pending' ? 'Agendar Conta' : 'Salvar Transação'}
        </button>
      </div>

    </form>
  );
};

export default TransactionForm;
