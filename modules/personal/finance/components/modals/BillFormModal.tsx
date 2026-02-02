
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { X, Loader2, Save, FileText, Calendar, DollarSign, Tag, Repeat } from 'lucide-react';
import { supabase } from '../../../../../integrations/supabase/client';
import { Bill } from '../../types/finance.types';
import { parseLocalDate, toISOWithNoon, getTodayLocal } from '../../utils/dateHelpers';
import { useItemSuggestions, ItemSuggestion } from '../../hooks/useFinanceData';

interface BillFormData {
  description: string;
  amount: number | string;
  due_date: string;
  category: string;
  type: 'fixed' | 'variable' | 'temporary';
  is_recurring: boolean;
  is_installment: boolean;
  total_installments: number;
}

interface BillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  billToEdit?: Bill | null;
}

const BillFormModal: React.FC<BillFormModalProps> = ({ isOpen, onClose, onSuccess, billToEdit }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Hooks para Autocomplete
  const { suggestions } = useItemSuggestions();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<ItemSuggestion[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm<BillFormData>({
    defaultValues: {
      description: '',
      amount: '',
      due_date: getTodayLocal(),
      category: '',
      type: 'fixed',
      is_recurring: false,
      is_installment: false,
      total_installments: 1
    }
  });

  const isRecurring = watch('is_recurring');
  const isInstallment = watch('is_installment');
  const totalInstallments = watch('total_installments');
  const amount = watch('amount');

  // Calcular valor da parcela
  const installmentValue = isInstallment && totalInstallments > 0 
    ? (Number(amount) || 0) / totalInstallments 
    : 0;

  useEffect(() => {
    if (isOpen) {
      if (billToEdit) {
        setValue('description', billToEdit.description);
        setValue('amount', billToEdit.amount);
        setValue('due_date', parseLocalDate(billToEdit.due_date));
        setValue('category', billToEdit.category || '');
        setValue('type', billToEdit.type || 'fixed');
        setValue('is_recurring', billToEdit.is_recurring || false);
        // Desativa parcelamento na edição
        setValue('is_installment', false);
        setValue('total_installments', 1);
      } else {
        reset({
          description: '',
          amount: '',
          due_date: getTodayLocal(),
          category: '',
          type: 'fixed',
          is_recurring: false,
          is_installment: false,
          total_installments: 1
        });
      }
    }
  }, [isOpen, billToEdit, setValue, reset]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('description', value); // Atualiza form

    if (value.trim().length > 0) {
      const filtered = suggestions.filter(s => 
        s.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (s: ItemSuggestion) => {
    setValue('description', s.name);
    setValue('category', s.category);
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  const onSubmit = async (data: BillFormData) => {
    if (!data.description) return alert("Descrição necessária.");
    const amountVal = Number(data.amount);
    if (isNaN(amountVal) || amountVal <= 0) return alert("Valor inválido.");

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não identificado.");

      // FIX: Usando helper para ancorar data ao meio-dia
      const dateToSave = toISOWithNoon(data.due_date);

      const payload = {
        description: data.description,
        amount: amountVal,
        due_date: dateToSave,
        category: data.category || 'Outros',
        type: data.type,
        is_recurring: data.is_recurring,
        recurrence_period: data.is_recurring ? 'monthly' : null,
        user_id: user.id,
        status: billToEdit ? billToEdit.status : 'pending'
      };

      if (billToEdit) {
        // Modo edição - não permite alterar parcelamento
        const { error } = await supabase.from('bills').update(payload).eq('id', billToEdit.id);
        if (error) throw error;
      } else {
        // Modo criação
        if (data.is_installment && data.total_installments > 1) {
          // CRIAR PARCELAMENTO
          const installmentGroupId = crypto.randomUUID();
          const installmentAmount = amountVal / data.total_installments;
          
          const installments = [];
          for (let i = 1; i <= data.total_installments; i++) {
            const [year, month, day] = data.due_date.split('-').map(Number);
            // new Date(year, monthIndex, day)
            const installmentDate = new Date(year, month - 1 + (i - 1), day, 12, 0, 0);
            
            installments.push({
              ...payload,
              description: `${data.description} (${i}/${data.total_installments})`,
              amount: installmentAmount,
              due_date: installmentDate.toISOString(),
              is_installment: true,
              installment_number: i,
              total_installments: data.total_installments,
              installment_group_id: installmentGroupId,
              parent_installment_id: i === 1 ? null : installmentGroupId 
            });
          }
          
          const { error } = await supabase.from('bills').insert(installments);
          if (error) throw error;
        } else {
          // CRIAR CONTA SIMPLES
          const { error } = await supabase.from('bills').insert([payload]);
          if (error) throw error;
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] p-4">
        <div className="bg-white w-full rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden relative">
          <button 
             onClick={onClose}
             className="absolute top-6 right-6 p-2 hover:bg-stone-100 rounded-full transition-colors text-cappuccino z-10"
          >
             <X size={20} />
          </button>

          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-coffee tracking-tighter">
                {billToEdit ? 'Editar Conta' : 'Nova Conta'}
              </h2>
              <p className="text-cappuccino text-[10px] font-bold uppercase tracking-widest mt-1">
                {billToEdit ? 'Alterar detalhes do lançamento' : 'Adicionar compromisso financeiro'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div ref={suggestionsRef} className="relative">
                <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">Descrição</label>
                <div className="relative">
                  <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cappuccino" />
                  <input 
                    {...register('description')} 
                    onChange={handleDescriptionChange}
                    placeholder="Ex: Netflix, Aluguel..." 
                    autoComplete="off"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-9 pr-3 text-coffee text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all placeholder:text-stone-300" 
                  />
                </div>
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white border border-stone-200 rounded-xl shadow-lg mt-1 z-50 max-h-40 overflow-y-auto">
                    {filteredSuggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-stone-50 text-coffee flex justify-between items-center transition-colors border-b border-stone-50 last:border-0"
                        onClick={() => handleSelectSuggestion(s)}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-[9px] text-stone-400 uppercase bg-stone-100 px-1.5 py-0.5 rounded">{s.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">Valor Total (R$)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cappuccino" />
                    <input 
                      type="number" 
                      step="0.01" 
                      {...register('amount')} 
                      placeholder="0.00" 
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-9 pr-3 text-coffee font-semibold text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">Vencimento</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cappuccino" />
                    <input 
                      type="date" 
                      {...register('due_date')} 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-9 pr-3 text-coffee text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">Categoria</label>
                    <div className="relative">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cappuccino" />
                      <input 
                        {...register('category')} 
                        placeholder="Ex: Streaming" 
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-9 pr-3 text-coffee text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">Tipo</label>
                    <select 
                       {...register('type')}
                       className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 px-3 text-coffee text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="fixed">Fixo</option>
                      <option value="variable">Variável</option>
                      <option value="temporary">Temporário</option>
                    </select>
                  </div>
              </div>

              {/* Checkbox de Recorrência */}
              <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-100 cursor-pointer" onClick={() => !isInstallment && setValue('is_recurring', !isRecurring)}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isRecurring ? 'bg-olive border-olive text-white' : 'bg-white border-stone-300'} ${isInstallment ? 'opacity-50' : ''}`}>
                      {isRecurring && <Repeat size={12} />}
                  </div>
                  <div className={`flex-1 ${isInstallment ? 'opacity-50' : ''}`}>
                      <p className="text-xs font-bold text-coffee">Conta Recorrente</p>
                      <p className="text-sm text-cappuccino">Repetir mensalmente (Assinaturas)</p>
                  </div>
                  <input type="checkbox" {...register('is_recurring')} className="hidden" disabled={isInstallment} />
              </div>

              {/* Checkbox de Parcelamento */}
              <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-100 cursor-pointer" onClick={() => !billToEdit && !isRecurring && setValue('is_installment', !isInstallment)}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isInstallment ? 'bg-coffee border-coffee text-white' : 'bg-white border-stone-300'} ${isRecurring ? 'opacity-50' : ''}`}>
                  {isInstallment && <span className="text-xs">✓</span>}
                </div>
                <div className={`flex-1 ${isRecurring ? 'opacity-50' : ''}`}>
                  <p className="text-xs font-bold text-coffee">Parcelar este Compromisso</p>
                  <p className="text-sm text-cappuccino">Dividir em múltiplas contas mensais</p>
                </div>
                <input type="checkbox" {...register('is_installment')} className="hidden" disabled={!!billToEdit || isRecurring} />
              </div>

              {/* Campo de Número de Parcelas */}
              {isInstallment && !billToEdit && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">
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
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full bg-white border border-blue-200 rounded-xl py-3.5 px-4 text-coffee font-semibold text-sm focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="Ex: 12"
                    />
                    <p className="text-[9px] text-cappuccino mt-1 ml-1">
                      Entre 2 e 120 parcelas
                    </p>
                  </div>
                  
                  {/* Resumo do Parcelamento */}
                  {totalInstallments >= 2 && amount && (
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <p className="text-[9px] text-cappuccino uppercase tracking-wider mb-1">Resumo</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-coffee">Valor Total:</span>
                        <span className="text-sm font-bold text-coffee">
                          R$ {Number(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-coffee">{totalInstallments}x de:</span>
                        <span className="text-lg font-bold text-blue-600">
                          R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-[9px] text-cappuccino mt-2">
                        Serão criadas {totalInstallments} contas mensais automaticamente
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Aviso de Edição */}
              {billToEdit && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700">
                    ℹ️ Não é possível alterar o parcelamento ao editar uma conta existente.
                  </p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-olive hover:bg-black text-white px-6 py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSubmitting ? 'Salvando...' : 'Salvar Compromisso'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BillFormModal;
