
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { X, Loader2, ShoppingBag, Calendar, CreditCard as CardIcon, DollarSign, List, Save, Pencil } from 'lucide-react';
import { supabase } from '../../../../../integrations/supabase/client';
import { CreditCard, Transaction } from '../../types/finance.types';
import { parseLocalDate, toISOWithNoon, getTodayLocal } from '../../utils/dateHelpers';

interface TransactionFormData {
  description: string;
  amount: number | string;
  category: string;
  date: string;
  installments: number | string;
}

interface CreditTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  card?: CreditCard;
  transactionToEdit?: Transaction | null;
}

const CreditTransactionModal: React.FC<CreditTransactionDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  card, 
  transactionToEdit 
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, handleSubmit, reset, setValue } = useForm<TransactionFormData>({
    defaultValues: {
      description: '',
      amount: '',
      category: '',
      date: getTodayLocal(),
      installments: 1,
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setValue('description', transactionToEdit.description);
        setValue('amount', transactionToEdit.amount);
        setValue('category', transactionToEdit.category);
        setValue('date', parseLocalDate(transactionToEdit.date));
        setValue('installments', 1); 
      } else {
        reset({
          description: '',
          amount: '',
          category: '',
          date: getTodayLocal(),
          installments: 1,
        });
      }
    }
  }, [isOpen, transactionToEdit, setValue, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: TransactionFormData) => {
    // Validação Manual
    if (!data.description || data.description.length < 3) return alert("Descrição necessária.");
    if (!data.category) return alert("Categoria necessária.");
    if (!data.date) return alert("Data necessária.");
    
    const amountVal = Number(data.amount);
    if (isNaN(amountVal) || amountVal <= 0) return alert("Valor inválido.");

    const installmentsVal = Number(data.installments) || 1;

    setIsSubmitting(true);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Usuário não identificado.");

      // FIX: Usando helper para ancorar data ao meio-dia
      // Recuperar ano/mês/dia para calcular parcelas
      const [year, month, day] = data.date.split('-').map(Number);
      
      // --- EDIÇÃO ---
      if (transactionToEdit) {
        const dateToSave = toISOWithNoon(data.date);
        
        const updatePayload = {
          description: data.description,
          amount: amountVal,
          category: data.category,
          date: dateToSave,
        };

        const { error } = await supabase
          .from('transactions')
          .update(updatePayload)
          .eq('id', transactionToEdit.id);

        if (error) throw error;
        
      } else {
        // --- NOVA COMPRA (COM LÓGICA DE PARCELAMENTO) ---
        if (!card) throw new Error("Cartão não selecionado.");

        const transactionsToInsert = [];
        // Usa 12:00:00 para baseDate também para garantir estabilidade
        const baseDate = new Date(year, month - 1, day, 12, 0, 0); 
        
        const totalAmount = amountVal;
        const installments = installmentsVal;

        // CÁLCULO DE DIVISÃO
        const rawInstallmentValue = totalAmount / installments;
        const installmentValue = Math.floor(rawInstallmentValue * 100) / 100;
        const remainder = Number((totalAmount - (installmentValue * installments)).toFixed(2));

        for (let i = 0; i < installments; i++) {
          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(baseDate.getMonth() + i);

          const currentAmount = i === 0 
            ? Number((installmentValue + remainder).toFixed(2)) 
            : Number(installmentValue.toFixed(2));

          const payload = {
            description: installments > 1 
              ? `${data.description} (${i + 1}/${installments})` 
              : data.description,
            amount: currentAmount,
            type: 'expense',
            category: data.category,
            date: installmentDate.toISOString(),
            credit_card_id: card.id,
            user_id: user.id,
            installment_current: i + 1,
            installment_total: installments,
            is_locked: false 
          };
          transactionsToInsert.push(payload);
        }

        const { error } = await supabase.from('transactions').insert(transactionsToInsert);
        if (error) throw error;
      }

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro:", err);
      alert("Erro ao salvar: " + (err.message || JSON.stringify(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!transactionToEdit;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* OVERLAY: Full Screen, Fixed, Dark */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* CONTENT: Centered Absoluted */}
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] p-4">
        <div className="bg-card w-full rounded-[2rem] shadow-2xl border border-border overflow-hidden transform transition-all relative">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-2 rounded-full ${isEditing ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-olive'}`}>
                    {isEditing ? <Pencil size={18} /> : <ShoppingBag size={18} />}
                  </div>
                  <h2 className="text-xl font-semibold text-foreground tracking-tighter">
                    {isEditing ? 'Editar Transação' : 'Nova Compra'}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">
                  <CardIcon size={12} />
                  {card ? card.name : 'Cartão'}
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">Descrição</label>
                <input 
                  {...register('description')} 
                  placeholder="Ex: Jantar, Uber, Mercado..." 
                  className="w-full bg-secondary border border-border rounded-xl p-3.5 text-foreground text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all placeholder:text-muted-foreground" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">
                    {isEditing ? 'Valor (R$)' : 'Valor Total (R$)'}
                  </label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="number" 
                      step="0.01" 
                      {...register('amount')} 
                      placeholder="0.00" 
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-9 pr-3 text-foreground font-semibold text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">Data</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="date" 
                      {...register('date')} 
                      className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-9 pr-3 text-foreground text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={isEditing ? 'col-span-2' : ''}>
                  <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">Categoria</label>
                  <input 
                    {...register('category')} 
                    placeholder="Ex: Lazer" 
                    className="w-full bg-secondary border border-border rounded-xl p-3.5 text-foreground text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all" 
                  />
                </div>
                
                {!isEditing && (
                  <div>
                    <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">Parcelas</label>
                    <div className="relative">
                      <List size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <select 
                        {...register('installments')} 
                        className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-9 pr-3 text-foreground text-sm focus:ring-2 focus:ring-olive/10 outline-none cursor-pointer appearance-none bg-card"
                      >
                        <option value="1">À vista (1x)</option>
                        {[...Array(23)].map((_, i) => (
                          <option key={i} value={i + 2}>{i + 2}x</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting} 
                className={`w-full text-white px-6 py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed ${isEditing ? 'bg-coffee hover:bg-black' : 'bg-primary hover:bg-black'}`}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? <Save size={16} /> : <ShoppingBag size={16} />)}
                {isSubmitting ? 'Processando...' : (isEditing ? 'Salvar Alterações' : 'Lançar no Cartão')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreditTransactionModal;
