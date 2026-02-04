import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Save, Wallet, DollarSign } from 'lucide-react';
import { Account } from '../../types/finance.types';
import { supabase } from '../../../../../integrations/supabase/client';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  onSuccess: () => void;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onSuccess,
}) => {
  const [name, setName] = useState(account.name);
  const [balance, setBalance] = useState(account.balance.toString());
  const [type, setType] = useState<'checking' | 'investment' | 'cash'>(account.type);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          name: name.trim(),
          balance: parseFloat(balance),
          type: type,
        })
        .eq('id', account.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-cream rounded-[2rem] shadow-2xl w-full max-w-md border border-stone-200 animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-coffee tracking-tight">Editar Conta</h2>
            <p className="text-xs text-cappuccino mt-1">Atualize as informações da conta</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={20} className="text-cappuccino" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Nome da Conta */}
          <div>
            <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">
              <Wallet size={12} className="inline mr-1" />
              Nome da Conta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank, Investimentos..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-coffee placeholder-stone-300 focus:ring-2 focus:ring-olive/20 focus:border-olive outline-none transition-all"
              required
            />
          </div>

          {/* Tipo de Conta */}
          <div>
            <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">
              Tipo de Conta
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-coffee focus:ring-2 focus:ring-olive/20 focus:border-olive outline-none transition-all cursor-pointer appearance-none"
            >
              <option value="checking">Conta Corrente</option>
              <option value="investment">Investimentos</option>
              <option value="cash">Dinheiro em Espécie</option>
            </select>
          </div>

          {/* Saldo Inicial */}
          <div>
            <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">
              <DollarSign size={12} className="inline mr-1" />
              Saldo Inicial (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              onWheel={(e) => e.currentTarget.blur()}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-coffee font-semibold placeholder-stone-300 focus:ring-2 focus:ring-olive/20 focus:border-olive outline-none transition-all"
              required
            />
            <p className="text-[10px] text-cappuccino mt-1.5 ml-1">
              ⚠️ Alterar este valor afetará o saldo atual da conta
            </p>
          </div>

          {/* Botões */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-cappuccino hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-olive hover:bg-black text-white px-6 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditAccountModal;