
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { X, Loader2, CreditCard as CardIcon } from 'lucide-react';
import { supabase } from '../../../../../integrations/supabase/client';
import { CreditCard } from '../../types/finance.types';

interface CardFormData {
  name: string;
  limit: number | string;
  closing_day: number | string;
  due_day: number | string;
}

interface CardFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cardToEdit?: CreditCard | null;
}

const CardFormDialog: React.FC<CardFormDialogProps> = ({ isOpen, onClose, onSuccess, cardToEdit }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, handleSubmit, reset } = useForm<CardFormData>({
    defaultValues: {
      name: '',
      limit: '',
      closing_day: 1,
      due_day: 10,
    }
  });

  useEffect(() => {
    if (cardToEdit) {
      reset({
        name: cardToEdit.name,
        limit: cardToEdit.limit_amount,
        closing_day: cardToEdit.closing_day,
        due_day: cardToEdit.due_day,
      });
    } else {
      reset({ name: '', limit: '', closing_day: 1, due_day: 10 });
    }
  }, [cardToEdit, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: CardFormData) => {
    // Validação Manual
    if (!data.name || data.name.length < 3) {
      alert("O nome deve ter pelo menos 3 caracteres.");
      return;
    }

    const limitValue = Number(data.limit);
    if (isNaN(limitValue) || limitValue < 0) {
      alert("Limite inválido.");
      return;
    }

    const closing = Number(data.closing_day);
    const due = Number(data.due_day);
    if (closing < 1 || closing > 31 || due < 1 || due > 31) {
      alert("Os dias devem ser entre 1 e 31.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      const payload = {
        name: data.name,
        limit_amount: limitValue, 
        closing_day: closing,
        due_day: due,
        user_id: user.id
      };

      let error;
      if (cardToEdit) {
        const { error: updateError } = await supabase.from('credit_cards').update(payload).eq('id', cardToEdit.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('credit_cards').insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro:", err);
      alert('Erro ao salvar cartão: ' + (err.message || "Erro desconhecido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-coffee/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-stone-100 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-coffee tracking-tighter">
              {cardToEdit ? 'Editar Cartão' : 'Novo Cartão'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-cream rounded-full transition-colors text-cappuccino">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">Nome do Cartão</label>
              <input 
                {...register('name')} 
                placeholder="Ex: Nubank Ultravioleta" 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-coffee focus:ring-2 focus:ring-olive/10 outline-none" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">Limite Total (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                {...register('limit')} 
                placeholder="0.00" 
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-coffee focus:ring-2 focus:ring-olive/10 outline-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">Dia Fechamento</label>
                <input 
                  type="number" 
                  min="1" 
                  max="31" 
                  {...register('closing_day')} 
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-coffee focus:ring-2 focus:ring-olive/10 outline-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">Dia Vencimento</label>
                <input 
                  type="number" 
                  min="1" 
                  max="31" 
                  {...register('due_day')} 
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-coffee focus:ring-2 focus:ring-olive/10 outline-none" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full bg-olive hover:bg-black text-white px-6 py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CardIcon size={16} />}
              {isSubmitting ? 'Processando...' : 'Salvar Cartão'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CardFormDialog;
