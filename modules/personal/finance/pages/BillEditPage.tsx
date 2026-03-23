
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, FileText, Calendar, DollarSign, Tag, Repeat, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../../../integrations/supabase/client';
import { Bill } from '../types/finance.types';
import { parseLocalDate, toISOWithNoon, getTodayLocal } from '../utils/dateHelpers';

interface BillFormData {
  description: string;
  amount: number | string;
  due_date: string;
  category: string;
  type: 'fixed' | 'variable' | 'temporary';
  is_recurring: boolean;
}

const BillEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm<BillFormData>({
    defaultValues: {
      description: '',
      amount: '',
      due_date: getTodayLocal(),
      category: '',
      type: 'fixed',
      is_recurring: false,
    },
  });

  const isRecurring = watch('is_recurring');

  useEffect(() => {
    if (!id) return;
    const fetchBill = async () => {
      try {
        const { data, error } = await supabase
          .from('bills')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setBill(data);
        setValue('description', data.description);
        setValue('amount', data.amount);
        setValue('due_date', parseLocalDate(data.due_date));
        setValue('category', data.category || '');
        setValue('type', data.type || 'fixed');
        setValue('is_recurring', data.is_recurring || false);
      } catch (err) {
        console.error(err);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [id, navigate, setValue]);

  const onSubmit = async (data: BillFormData) => {
    if (!bill) return;
    const amountVal = Number(data.amount);
    if (isNaN(amountVal) || amountVal <= 0) return alert('Valor inválido.');
    setIsSubmitting(true);
    try {
      const dateToSave = toISOWithNoon(data.due_date);
      const payload = {
        description: data.description,
        amount: amountVal,
        due_date: dateToSave,
        category: data.category || 'Outros',
        type: data.type,
        is_recurring: data.is_recurring,
        recurrence_period: data.is_recurring ? 'monthly' : null,
      };
      const { error } = await supabase.from('bills').update(payload).eq('id', bill.id);
      if (error) throw error;
      navigate(-1);
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary pb-24 animate-fade-in">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-card rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tighter">
              Editar Pendência
            </h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">
              Atualize os dados do compromisso financeiro
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-[2rem] border border-border shadow-premium p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Descrição */}
            <div>
              <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">
                Descrição
              </label>
              <div className="relative">
                <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  {...register('description')}
                  placeholder="Ex: Netflix, Aluguel..."
                  className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-9 pr-3 text-foreground text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Valor */}
              <div>
                <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">
                  Valor (R$)
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

              {/* Vencimento */}
              <div>
                <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">
                  Vencimento
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    {...register('due_date')}
                    className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-9 pr-3 text-foreground text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Categoria */}
              <div>
                <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">
                  Categoria
                </label>
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    {...register('category')}
                    placeholder="Ex: Streaming"
                    className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-9 pr-3 text-foreground text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-[10px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">
                  Tipo
                </label>
                <select
                  {...register('type')}
                  className="w-full bg-secondary border border-border rounded-xl py-3.5 px-3 text-foreground text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all cursor-pointer appearance-none"
                >
                  <option value="fixed">Fixo</option>
                  <option value="variable">Variável</option>
                  <option value="temporary">Temporário</option>
                </select>
              </div>
            </div>

            {/* Recorrência */}
            <div
              className="flex items-center gap-3 p-4 bg-secondary rounded-xl border border-border cursor-pointer"
              onClick={() => setValue('is_recurring', !isRecurring)}
            >
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  isRecurring ? 'bg-primary border-primary text-white' : 'bg-card border-border'
                }`}
              >
                {isRecurring && <Repeat size={12} />}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Conta Recorrente</p>
                <p className="text-sm text-muted-foreground">Repetir mensalmente</p>
              </div>
              <input type="checkbox" {...register('is_recurring')} className="hidden" />
            </div>

            {/* Aviso de parcelamento */}
            {bill?.is_installment && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700">
                  ℹ️ Não é possível alterar o parcelamento de uma conta existente.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-black text-white px-6 py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSubmitting ? 'Salvando...' : 'Salvar Pendência'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BillEditPage;
