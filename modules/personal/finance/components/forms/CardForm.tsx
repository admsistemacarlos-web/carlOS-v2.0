
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, CreditCard as CardIcon, Trash2 } from 'lucide-react';
import { supabase } from '../../../../../integrations/supabase/client';
import { CreditCard } from '../../types/finance.types';

interface CardFormData {
  name: string;
  limit: number | string;
  closing_day: number | string;
  due_day: number | string;
}

interface CardFormProps {
  onSuccess: () => void;
  cardToEdit?: CreditCard | null;
}

const CardForm: React.FC<CardFormProps> = ({ onSuccess, cardToEdit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    }
  }, [cardToEdit, reset]);

  const onSubmit = async (data: CardFormData) => {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Sessão expirada.");
        return;
      }

      const payload = {
        name: data.name,
        limit_amount: limitValue, 
        closing_day: closing,
        due_day: due,
        user_id: user.id
      };

      if (cardToEdit) {
        const { error } = await supabase.from('credit_cards').update(payload).eq('id', cardToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('credit_cards').insert([payload]);
        if (error) throw error;
      }

      onSuccess();
    } catch (err: any) {
      console.error("Erro:", err);
      alert('Erro ao salvar cartão: ' + (err.message || "Erro desconhecido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!cardToEdit) return;
    
    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', cardToEdit.id);
      
      if (error) throw error;
      
      alert('Cartão excluído com sucesso!');
      onSuccess();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
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

      {cardToEdit && (
        <>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full bg-red-100 hover:bg-red-200 text-red-600 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 mb-3"
          >
            <Trash2 size={16} />
            Excluir Cartão
          </button>

          {showDeleteConfirm && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800 font-medium mb-3">
                ⚠️ Tem certeza? Esta ação não pode ser desfeita!
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-bold uppercase"
                >
                  Sim, Excluir
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-stone-200 hover:bg-stone-300 text-coffee py-2 rounded-lg text-xs font-bold uppercase"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <button 
        type="submit" 
        disabled={isSubmitting} 
        className="w-full bg-olive hover:bg-black text-white px-6 py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CardIcon size={16} />}
        {isSubmitting ? 'Processando...' : 'Salvar Cartão'}
      </button>
    </form>
  );
};

export default CardForm;
