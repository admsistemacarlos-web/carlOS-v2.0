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
  category_name?: string;
  location: string;
  tags: string[];
  
  is_recurring: boolean;
  status: StatusType;

  origin_account_id: string | null;
  destination_account_id: string | null;

  payment_method: 'account' | 'credit_card';
  account_id: string | null;
  credit_card_id: string | null;
  installments: number;

  // Para Bills (contas pendentes)
  is_installment: boolean;
  total_installments: number;

  items: { 
    name: string; 
    quantity: number; 
    unit_price: number; 
  }[];

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
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          {filtered.length === 0 && query.trim() ? (
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="w-full px-4 py-3 text-left text-sm hover:bg-stone-50 flex items-center gap-2 text-olive font-medium"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Criar "{query}"
            </button>
          ) : (
            filtered.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id, opt.name);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="w-full px-4 py-3 text-left text-sm hover:bg-stone-50 flex items-center gap-2"
              >
                {value === opt.id && <Check size={14} className="text-olive" />}
                <span>{opt.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE 2: TAG INPUT ---

const TagInput = ({ value, onChange }: { value: string[], onChange: (tags: string[]) => void }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!value.includes(input.trim())) {
        onChange([...value, input.trim()]);
      }
      setInput('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  return (
    <div className="flex flex-wrap gap-2 bg-stone-50 border border-stone-200 rounded-xl p-3 min-h-[44px]">
      {value.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 bg-olive/10 text-olive text-xs px-2 py-1 rounded-lg">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
            <X size={12} />
          </button>
        </span>
      ))}
      <input 
        className="flex-1 bg-transparent outline-none text-sm min-w-[120px] placeholder-stone-400"
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
      category_name: '',
      installments: 1,
      is_installment: false,
      total_installments: 2
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
  const installments = watch('installments');
  const isInstallment = watch('is_installment');
  const totalInstallments = watch('total_installments');

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: 'items' });
  const { fields: splitFields, append: appendSplit, remove: removeSplit } = useFieldArray({ control, name: 'payments' });

  // Sincronizar total dos itens com o valor total
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
        category_name: transactionToEdit.category,
        location: transactionToEdit.location || '',
        tags: transactionToEdit.tags || [],
        status: transactionToEdit.status as StatusType,
        account_id: transactionToEdit.account_id,
        credit_card_id: transactionToEdit.credit_card_id,
        origin_account_id: transactionToEdit.account_id,
        destination_account_id: transactionToEdit.destination_account_id,
        payment_method: transactionToEdit.credit_card_id ? 'credit_card' : 'account',
        installments: 1,
        is_installment: false,
        total_installments: 2,
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

  const preventScroll = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const onSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    try {
        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData.user;
        
        if (!currentUser) throw new Error("Usuário não autenticado");

        const sanitizeUUID = (id: string | null | undefined) => (id && id.trim() !== "") ? id : null;

        const amountVal = Number(data.amount);
        if (data.use_split_payment && data.type === 'expense' && data.status === 'paid') {
            const splitTotal = data.payments.reduce((acc, p) => acc + Number(p.amount), 0);
            if (Math.abs(splitTotal - amountVal) > 0.05) {
                throw new Error(`A soma dos pagamentos (R$ ${splitTotal.toFixed(2)}) difere do total (R$ ${amountVal.toFixed(2)}).`);
            }
        }

        const dateISO = toISOWithNoon(data.date);
        
        const payload: any = {
            description: data.description,
            amount: amountVal,
            type: data.type,
            date: dateISO, 
            category: data.category_name || 'Outros',
            category_id: sanitizeUUID(data.category_id), 
            account_id: data.type === 'transfer' ? sanitizeUUID(data.origin_account_id) : sanitizeUUID(data.account_id), 
            destination_account_id: data.type === 'transfer' ? sanitizeUUID(data.destination_account_id) : null, 
            status: data.status, 
            tags: data.tags || [], 
            user_id: currentUser.id,
            location: data.location || null
        };

        if (!data.use_split_payment && data.type !== 'transfer') {
            if (data.payment_method === 'credit_card') {
                payload.credit_card_id = sanitizeUUID(data.credit_card_id);
                payload.account_id = null;
                payload.is_locked = false;
            } else {
                payload.credit_card_id = null;
            }
        } else if (data.type === 'transfer') {
            payload.credit_card_id = null;
        }

        const isEditMode = transactionToEdit && transactionToEdit.id && !isDuplicate;

        if (isEditMode) {
            // MODO EDIÇÃO
            const transactionId = transactionToEdit.id;

            const { error: updateError } = await supabase
                .from('transactions')
                .update(payload)
                .eq('id', transactionId);

            if (updateError) throw updateError;

            await supabase.from('transaction_items').delete().eq('transaction_id', transactionId);
            
            if (data.items && data.items.length > 0) {
                const itemsPayload = data.items.map(item => ({
                    transaction_id: transactionId,
                    name: item.name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    amount: item.quantity * item.unit_price,
                    user_id: currentUser.id
                }));
                await supabase.from('transaction_items').insert(itemsPayload);
            }

            await supabase.from('transaction_payments').delete().eq('transaction_id', transactionId);
            
            if (data.use_split_payment && data.payments && data.payments.length > 0) {
                const paymentsPayload = data.payments.map(p => ({
                    transaction_id: transactionId,
                    amount: p.amount,
                    payment_method: p.method,
                    account_id: p.method === 'account' ? sanitizeUUID(p.account_id) : null,
                    credit_card_id: p.method === 'credit_card' ? sanitizeUUID(p.credit_card_id) : null,
                    installments: p.method === 'credit_card' ? (Number(p.installments) || 1) : 1,
                    user_id: currentUser.id
                }));
                await supabase.from('transaction_payments').insert(paymentsPayload);
            }

        } else {
            // MODO CRIAÇÃO
            const targetTable = data.status === 'pending' && data.type !== 'transfer' ? 'bills' : 'transactions';

            // ╔══════════════════════════════════════════════════════════════╗
            // ║  PARCELAMENTO EM CARTÃO (Transactions)                       ║
            // ╚══════════════════════════════════════════════════════════════╝
            
            const installmentsNum = Number(data.installments) || 1;
            const shouldParcelCard = (
                targetTable === 'transactions' && 
                data.payment_method === 'credit_card' && 
                installmentsNum > 1
            );

            // ╔══════════════════════════════════════════════════════════════╗
            // ║  PARCELAMENTO EM BILLS (Contas Pendentes)                    ║
            // ╚══════════════════════════════════════════════════════════════╝
            
            const billInstallments = Number(data.total_installments) || 1;
            const shouldParcelBill = (
                targetTable === 'bills' && 
                data.is_installment && 
                billInstallments > 1
            );

            if (shouldParcelCard) {
                // CRIAR MÚLTIPLAS PARCELAS NO CARTÃO
                const [year, month, day] = data.date.split('-').map(Number);
                const baseDate = new Date(year, month - 1, day, 12, 0, 0);
                
                const rawInstallmentValue = amountVal / installmentsNum;
                const installmentValue = Math.floor(rawInstallmentValue * 100) / 100;
                const remainder = Number((amountVal - (installmentValue * installmentsNum)).toFixed(2));

                const installmentsToCreate = [];

                for (let i = 0; i < installmentsNum; i++) {
                    const installmentDate = new Date(baseDate);
                    installmentDate.setMonth(baseDate.getMonth() + i);

                    const currentAmount = i === 0 
                        ? Number((installmentValue + remainder).toFixed(2)) 
                        : Number(installmentValue.toFixed(2));

                    const installmentPayload = {
                        ...payload,
                        description: `${data.description} (${i + 1}/${installmentsNum})`,
                        amount: currentAmount,
                        date: installmentDate.toISOString(),
                        payment_date: installmentDate.toISOString(),
                        is_installment: true,
                        installment_current: i + 1,
                        installment_total: installmentsNum,
                        created_at: new Date().toISOString()
                    };

                    installmentsToCreate.push(installmentPayload);
                }

                const { error: installmentsError } = await supabase
                    .from('transactions')
                    .insert(installmentsToCreate);

                if (installmentsError) throw installmentsError;

            } else if (shouldParcelBill) {
                // CRIAR MÚLTIPLAS BILLS (Contas Parceladas)
                const [year, month, day] = data.date.split('-').map(Number);
                const baseDate = new Date(year, month - 1, day, 12, 0, 0);
                
                const rawInstallmentValue = amountVal / billInstallments;
                const installmentValue = Math.floor(rawInstallmentValue * 100) / 100;
                const remainder = Number((amountVal - (installmentValue * billInstallments)).toFixed(2));

                const installmentGroupId = crypto.randomUUID();
                const billsToCreate = [];

                for (let i = 0; i < billInstallments; i++) {
                    const installmentDate = new Date(baseDate);
                    installmentDate.setMonth(baseDate.getMonth() + i);

                    const currentAmount = i === 0 
                        ? Number((installmentValue + remainder).toFixed(2)) 
                        : Number(installmentValue.toFixed(2));

                    const billPayload = {
                        description: `${data.description} (${i + 1}/${billInstallments})`,
                        amount: currentAmount,
                        due_date: installmentDate.toISOString(),
                        category: data.category_name || 'Outros',
                        type: 'variable',
                        status: 'pending',
                        user_id: currentUser.id,
                        is_installment: true,
                        installment_number: i + 1,
                        total_installments: billInstallments,
                        installment_group_id: installmentGroupId,
                        parent_installment_id: i === 0 ? null : undefined,
                        created_at: new Date().toISOString()
                    };

                    billsToCreate.push(billPayload);
                }

                const { error: billsError } = await supabase
                    .from('bills')
                    .insert(billsToCreate);

                if (billsError) throw billsError;

            } else {
                // TRANSAÇÃO/BILL ÚNICA (sem parcelamento)
                
                if (targetTable === 'bills') {
                    payload.due_date = dateISO;
                    payload.type = 'variable';
                    delete payload.date;
                }

                payload.created_at = new Date().toISOString();

                const { data: newTransaction, error: insertError } = await supabase
                    .from(targetTable)
                    .insert([payload])
                    .select()
                    .single();

                if (insertError) throw insertError;
                
                const transactionId = newTransaction.id;

                if (targetTable === 'transactions' && data.items && data.items.length > 0) {
                    const itemsPayload = data.items.map(item => ({
                        transaction_id: transactionId,
                        name: item.name,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        amount: item.quantity * item.unit_price,
                        user_id: currentUser.id
                    }));
                    await supabase.from('transaction_items').insert(itemsPayload);
                }

                if (targetTable === 'transactions' && data.use_split_payment && data.payments && data.payments.length > 0) {
                    const paymentsPayload = data.payments.map(p => ({
                        transaction_id: transactionId,
                        amount: p.amount,
                        payment_method: p.method,
                        account_id: p.method === 'account' ? sanitizeUUID(p.account_id) : null,
                        credit_card_id: p.method === 'credit_card' ? sanitizeUUID(p.credit_card_id) : null,
                        installments: p.method === 'credit_card' ? (Number(p.installments) || 1) : 1,
                        user_id: currentUser.id
                    }));
                    await supabase.from('transaction_payments').insert(paymentsPayload);
                }

                if (data.is_recurring) {
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
            }
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
          <div className="space-y-4 animate-fade-in">
            {/* LINHA 1: Data e Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Data da Transferência</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input 
                      type="date" 
                      {...register('date')} 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-3 py-3 text-sm text-coffee outline-none focus:border-blue-500"
                    />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Valor Total</label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input 
                      type="number" 
                      step="0.01" 
                      onWheel={preventScroll}
                      {...register('amount')}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-3 py-3 text-sm font-semibold text-coffee outline-none focus:border-blue-500 placeholder-stone-300"
                      placeholder="0.00"
                    />
                </div>
              </div>
            </div>

            {/* LINHA 2: Origem e Destino */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div>
                <label className="text-xs font-bold text-red-400 uppercase block mb-2">Sai de (Origem)</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-red-300" size={16} />
                  <select {...register('origin_account_id')} className="w-full bg-white border border-red-200 rounded-xl pl-9 pr-3 py-3 text-sm outline-none">
                    <option value="">Selecione...</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-emerald-500 uppercase block mb-2">Entra em (Destino)</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300" size={16} />
                  <select {...register('destination_account_id')} className="w-full bg-white border border-emerald-200 rounded-xl pl-9 pr-3 py-3 text-sm outline-none">
                    <option value="">Selecione...</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>)}
                  </select>
                </div>
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
                <div className="space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <div className="grid grid-cols-[1fr_80px_100px_80px_40px] gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                        <div>Item</div>
                        <div className="text-center">Qtd</div>
                        <div className="text-right pr-2">Preço Unit.</div>
                        <div className="text-right pr-2">Subtotal</div>
                        <div></div>
                    </div>
                    {itemFields.map((field, index) => {
                        const item = items[index];
                        const subtotal = (item?.quantity || 0) * (item?.unit_price || 0);
                        
                        return (
                            <div key={field.id} className="grid grid-cols-[1fr_80px_100px_80px_40px] gap-2 items-center">
                                <input 
                                    {...register(`items.${index}.name`)}
                                    placeholder="Nome do item"
                                    className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-stone-100"
                                />

                                <input 
                                    {...register(`items.${index}.quantity`)}
                                    type="number" min="1" step="1"
                                    onWheel={preventScroll}
                                    className="w-full bg-white rounded-lg p-2 text-xs text-center outline-none border border-stone-100"
                                />

                                <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400">R$</span>
                                    <input 
                                        {...register(`items.${index}.unit_price`)}
                                        type="number" step="0.01"
                                        onWheel={preventScroll}
                                        className="w-full bg-white rounded-lg p-2 pl-6 text-xs text-right outline-none border border-stone-100"
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

      {/* 5. VALOR TOTAL (Destaque) - Apenas para Despesa/Receita */}
      {type !== 'transfer' && (
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
      )}

      {/* 6. FORMA DE PAGAMENTO (Apenas para Despesa/Receita) */}
      {type !== 'transfer' && (
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    {type === 'income' ? 'Destino do Recurso' : 'Forma de Pagamento'}
                  </label>
                  
                  <div className="flex gap-2">
                    <button 
                        type="button" 
                        onClick={() => setValue('status', status === 'pending' ? 'paid' : 'pending')}
                        className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${status === 'paid' ? 'bg-olive/20 text-olive' : 'bg-yellow-100 text-yellow-700'}`}
                    >
                        {status === 'paid' ? 'Pago' : 'Pendente'}
                    </button>
                  </div>
              </div>

              {status === 'paid' && (
                  <>
                      <div className="flex bg-white p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                                setValue('payment_method', 'account');
                                setValue('use_split_payment', false);
                            }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${paymentMethod === 'account' && !useSplitPayment ? 'bg-olive text-white' : 'text-stone-400'}`}
                          >
                            <Wallet size={14} /> Conta
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                                setValue('payment_method', 'credit_card');
                                setValue('use_split_payment', false);
                            }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${paymentMethod === 'credit_card' && !useSplitPayment ? 'bg-olive text-white' : 'text-stone-400'}`}
                          >
                            <CreditCard size={14} /> Cartão
                          </button>
                          {type === 'expense' && (
                            <button
                              type="button"
                              onClick={() => setValue('use_split_payment', true)}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${useSplitPayment ? 'bg-olive text-white' : 'text-stone-400'}`}
                            >
                              <Split size={14} /> Dividir
                            </button>
                          )}
                      </div>

                      {!useSplitPayment ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {paymentMethod === 'account' ? (
                                  <div className="space-y-1 md:col-span-2">
                                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Conta</label>
                                      <select {...register('account_id')} className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm outline-none">
                                          <option value="">Selecione...</option>
                                          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                      </select>
                                  </div>
                              ) : (
                                  <>
                                      <div className="space-y-1">
                                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Cartão</label>
                                          <select {...register('credit_card_id')} className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm outline-none">
                                              <option value="">Selecione...</option>
                                              {cards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                                          </select>
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Parcelas</label>
                                          <select {...register('installments')} className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm outline-none">
                                              <option value="1">À vista (1x)</option>
                                              {[...Array(23)].map((_, i) => (
                                                  <option key={i} value={i + 2}>{i + 2}x</option>
                                              ))}
                                          </select>
                                      </div>
                                      
                                      {/* PREVIEW DO PARCELAMENTO CARTÃO */}
                                      {Number(installments) > 1 && Number(watchedAmount) > 0 && (
                                          <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4">
                                              <p className="text-xs font-bold text-blue-700 mb-2">💳 Resumo do Parcelamento no Cartão</p>
                                              <div className="flex justify-between items-center">
                                                  <span className="text-xs text-blue-600">Valor Total:</span>
                                                  <span className="text-sm font-bold text-blue-700">
                                                      R$ {Number(watchedAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                  </span>
                                              </div>
                                              <div className="flex justify-between items-center mt-1">
                                                  <span className="text-xs text-blue-600">{installments}x de:</span>
                                                  <span className="text-lg font-bold text-blue-700">
                                                      R$ {(Number(watchedAmount) / Number(installments)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                  </span>
                                              </div>
                                              <p className="text-[10px] text-blue-600 mt-2">
                                                  ✓ Serão criadas {installments} transações mensais automaticamente
                                              </p>
                                          </div>
                                      )}
                                  </>
                              )}
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {splitFields.map((field, index) => (
                                  <div key={field.id} className="grid grid-cols-[1fr_2fr_1fr_40px] gap-2 items-end bg-white p-3 rounded-xl border border-stone-100">
                                      <select {...register(`payments.${index}.method`)} className="bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs">
                                          <option value="account">Conta</option>
                                          <option value="credit_card">Cartão</option>
                                      </select>

                                      {watch(`payments.${index}.method`) === 'account' ? (
                                          <select {...register(`payments.${index}.account_id`)} className="bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs">
                                              <option value="">Selecione...</option>
                                              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                          </select>
                                      ) : (
                                          <select {...register(`payments.${index}.credit_card_id`)} className="bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs">
                                              <option value="">Selecione...</option>
                                              {cards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                                          </select>
                                      )}

                                      <input 
                                          {...register(`payments.${index}.amount`)}
                                          type="number" step="0.01"
                                          onWheel={preventScroll}
                                          placeholder="R$ 0.00"
                                          className="bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-right"
                                      />

                                      <button type="button" onClick={() => removeSplit(index)} className="p-2 text-stone-300 hover:text-red-500">
                                          <X size={14} />
                                      </button>
                                  </div>
                              ))}
                              <button 
                                  type="button"
                                  onClick={() => appendSplit({ method: 'account', amount: 0 })}
                                  className="w-full py-2 border border-dashed border-olive/30 rounded-xl text-[10px] font-bold text-olive uppercase tracking-widest hover:bg-olive/5"
                              >
                                  <Plus size={12} className="inline mr-1" /> Adicionar Meio de Pagamento
                              </button>
                          </div>
                      )}
                  </>
              )}

              {/* PENDENTE - Opção de Parcelamento em Bills */}
              {status === 'pending' && (
                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                              {type === 'income' ? 'Conta Destino' : 'Conta para Débito Futuro'}
                          </label>
                          <select {...register('account_id')} className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm outline-none">
                              <option value="">Selecione...</option>
                              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                          </select>
                      </div>

                      {/* CHECKBOX PARCELAR */}
                      <div 
                          onClick={() => setValue('is_installment', !isInstallment)}
                          className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${isInstallment ? 'bg-blue-50 border-2 border-blue-300' : 'bg-white border-2 border-stone-200'}`}
                      >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isInstallment ? 'bg-blue-500 border-blue-500' : 'border-stone-300'}`}>
                              {isInstallment && <Check size={14} className="text-white" />}
                          </div>
                          <div className="flex-1">
                              <p className="text-xs font-bold text-coffee">Parcelar este Compromisso</p>
                              <p className="text-[10px] text-stone-500">Dividir em múltiplas contas mensais</p>
                          </div>
                          <input type="checkbox" {...register('is_installment')} className="hidden" />
                      </div>

                      {/* CAMPO DE PARCELAS */}
                      {isInstallment && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 animate-fade-in">
                              <div>
                                  <label className="text-[10px] font-bold text-blue-700 uppercase tracking-widest ml-1 block mb-2">
                                      Número de Parcelas
                                  </label>
                                  <input
                                      type="number"
                                      min="2"
                                      max="120"
                                      {...register('total_installments', { 
                                          required: isInstallment,
                                          min: 2,
                                          max: 120 
                                      })}
                                      onWheel={preventScroll}
                                      className="w-full bg-white border border-blue-200 rounded-xl py-3 px-4 text-coffee font-semibold text-sm focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                      placeholder="Ex: 12"
                                  />
                                  <p className="text-[9px] text-blue-600 mt-1 ml-1">
                                      Entre 2 e 120 parcelas
                                  </p>
                              </div>
                              
                              {/* PREVIEW DO PARCELAMENTO BILLS */}
                              {Number(totalInstallments) >= 2 && Number(watchedAmount) > 0 && (
                                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                                      <p className="text-[9px] text-blue-600 uppercase tracking-wider mb-1">📊 Resumo</p>
                                      <div className="flex justify-between items-center">
                                          <span className="text-xs text-coffee">Valor Total:</span>
                                          <span className="text-sm font-bold text-coffee">
                                              R$ {Number(watchedAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </span>
                                      </div>
                                      <div className="flex justify-between items-center mt-1">
                                          <span className="text-xs text-coffee">{totalInstallments}x de:</span>
                                          <span className="text-lg font-bold text-blue-600">
                                              R$ {(Number(watchedAmount) / Number(totalInstallments)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </span>
                                      </div>
                                      <p className="text-[9px] text-blue-600 mt-2">
                                          ✓ Serão criadas {totalInstallments} contas mensais automaticamente
                                      </p>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              )}
          </div>
      )}

      {/* 7. TAGS */}
      <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Tags (Opcional)</label>
          <Controller 
              name="tags"
              control={control}
              render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
          />
      </div>

      {/* 8. RECORRÊNCIA */}
      {type !== 'transfer' && !isInstallment && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 p-4 rounded-xl">
            <input 
                type="checkbox" 
                {...register('is_recurring')}
                id="is_recurring"
                className="w-5 h-5 accent-amber-600"
            />
            <label htmlFor="is_recurring" className="flex items-center gap-2 text-sm font-medium text-amber-900 cursor-pointer">
                <Repeat size={16} />
                Marcar como recorrente (mensal)
            </label>
        </div>
      )}

      {/* 9. BOTÃO SUBMIT */}
      <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-coffee text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
          {isSubmitting ? (
              <>
                  <Loader2 size={18} className="animate-spin" />
                  Processando...
              </>
          ) : (
              <>
                  <Save size={18} />
                  {transactionToEdit && !isDuplicate ? 'Salvar Alterações' : 'Salvar Transação'}
              </>
          )}
      </button>

    </form>
  );
};

export default TransactionForm;