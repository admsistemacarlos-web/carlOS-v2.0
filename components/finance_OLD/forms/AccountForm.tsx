
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { Account } from '../../../types';

interface AccountFormData {
  name: string;
  type: 'checking' | 'investment' | 'cash';
  balance: number | string;
}

interface AccountFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  accountToEdit?: Account | null;
}

const AccountForm: React.FC<AccountFormProps> = ({ onSuccess, onCancel, accountToEdit }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, handleSubmit, reset } = useForm<AccountFormData>({
    defaultValues: {
      name: '',
      type: 'checking',
      balance: ''
    }
  });

  useEffect(() => {
    if (accountToEdit) {
      reset({
        name: accountToEdit.name,
        type: accountToEdit.type as any,
        balance: accountToEdit.balance,
      });
    }
  }, [accountToEdit, reset]);

  const onSubmit = async (data: AccountFormData) => {
    if (!data.name || data.name.length < 3) {
      alert("O nome da conta deve ter pelo menos 3 caracteres.");
      return;
    }

    const balanceValue = Number(data.balance);
    if (isNaN(balanceValue) && data.balance !== '') {
      alert("Saldo inválido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      const payload = {
        name: data.name,
        type: data.type,
        balance: balanceValue || 0,
        user_id: user.id,
      };

      if (accountToEdit) {
        const { error } = await supabase
          .from('accounts')
          .update(payload)
          .eq('id', accountToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accounts')
          .insert([payload]);
        if (error) throw error;
      }

      onSuccess();
    } catch (err: any) {
      console.error("Erro ao salvar conta:", err);
      alert('Erro ao salvar conta: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">Nome da Conta</label>
        <input
          {...register('name')}
          placeholder="Ex: Nubank, Investimentos..."
          className="w-full bg-secondary border border-border rounded-2xl p-4 text-foreground placeholder-stone-300 focus:ring-2 focus:ring-olive/10 focus:border-primary/30 outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">Tipo de Conta</label>
        <select
          {...register('type')}
          className="w-full bg-secondary border border-border rounded-2xl p-4 text-foreground focus:ring-2 focus:ring-olive/10 focus:border-primary/30 outline-none transition-all cursor-pointer"
        >
          <option value="checking">Conta Corrente</option>
          <option value="investment">Investimentos</option>
          <option value="cash">Dinheiro em Espécie</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">Saldo Inicial (R$)</label>
        <input
          type="number"
          step="0.01"
          {...register('balance')}
          placeholder="0.00"
          onWheel={(e) => e.currentTarget.blur()}
          className="w-full bg-secondary border border-border rounded-2xl p-4 text-foreground font-semibold placeholder-stone-300 focus:ring-2 focus:ring-olive/10 focus:border-primary/30 outline-none transition-all"
        />
      </div>

      <div className="pt-4 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-secondary transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary hover:bg-black text-white px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSubmitting ? 'Salvando...' : 'Salvar Conta'}
        </button>
      </div>
    </form>
  );
};

export default AccountForm;
