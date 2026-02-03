import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Lock, Loader2, AlertTriangle, CheckCircle2, 
  Calendar, Wallet, Info
} from 'lucide-react';
import { useAccounts, usePeriodLocks } from '../../hooks/useFinanceData';

interface PeriodCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PeriodCloseModal: React.FC<PeriodCloseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { accounts, loading: loadingAccounts } = useAccounts();
  const { closePeriod } = usePeriodLocks();

  // Form State
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [periodEndDate, setPeriodEndDate] = useState<string>(() => {
    const now = new Date();
    const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    return lastDayPrevMonth.toISOString().split('T')[0];
  });
  const [confirmedBalance, setConfirmedBalance] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; adjustment?: number } | null>(null);

  const selectedAccount = useMemo(() => {
    return accounts.find(a => a.id === selectedAccountId);
  }, [accounts, selectedAccountId]);

  const calculatedBalance = selectedAccount?.balance || 0;

  const difference = useMemo(() => {
    const confirmed = parseFloat(confirmedBalance) || 0;
    return confirmed - calculatedBalance;
  }, [confirmedBalance, calculatedBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccountId || !periodEndDate || confirmedBalance === '') {
      alert('Preencha todos os campos');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await closePeriod(
        selectedAccountId,
        periodEndDate,
        parseFloat(confirmedBalance)
      );
      
      setResult({ success: true, adjustment: res.adjustment });
      
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Erro ao fechar período:', err);
      alert('Erro ao fechar período: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity" 
        onClick={!isSubmitting ? onClose : undefined} 
      />
      
      <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden animate-fade-in">
        
        <div className="flex justify-between items-center p-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-coffee tracking-tight">Fechar Período</h2>
              <p className="text-xs text-cappuccino">Reconciliar e travar transações</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-cappuccino disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {result?.success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-coffee mb-2">Período Fechado!</h3>
            <p className="text-cappuccino text-sm mb-4">
              Todas as transações até {new Date(periodEndDate + 'T12:00:00').toLocaleDateString('pt-BR')} foram travadas.
            </p>
            {result.adjustment !== undefined && Math.abs(result.adjustment) > 0.01 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <AlertTriangle size={16} className="inline mr-2" />
                Foi criado um ajuste de <strong>R$ {Math.abs(result.adjustment).toFixed(2)}</strong> para reconciliar o saldo.
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Ao fechar um período, todas as transações até a data selecionada serão <strong>travadas</strong> e não poderão ser editadas ou excluídas. 
                Se houver diferença entre o saldo calculado e o saldo real, um ajuste será criado automaticamente.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">
                <Wallet size={12} className="inline mr-1" />
                Conta
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={loadingAccounts || isSubmitting}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-coffee outline-none focus:ring-2 focus:ring-olive/20 focus:border-olive transition-all appearance-none cursor-pointer disabled:opacity-50"
                required
              >
                <option value="">Selecione uma conta...</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} (Saldo atual: R$ {account.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">
                <Calendar size={12} className="inline mr-1" />
                Data Final do Período
              </label>
              <input
                type="date"
                value={periodEndDate}
                onChange={(e) => setPeriodEndDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-coffee outline-none focus:ring-2 focus:ring-olive/20 focus:border-olive transition-all disabled:opacity-50"
                required
              />
              <p className="text-[10px] text-cappuccino mt-1.5 ml-1">
                Todas as transações até esta data (inclusive) serão travadas.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest mb-2 ml-1">
                Saldo Real (Extrato Bancário)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cappuccino text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={confirmedBalance}
                  onChange={(e) => setConfirmedBalance(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="0,00"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 pl-10 text-sm text-coffee outline-none focus:ring-2 focus:ring-olive/20 focus:border-olive transition-all disabled:opacity-50"
                  required
                />
              </div>
              <p className="text-[10px] text-cappuccino mt-1.5 ml-1">
                Informe o saldo exato do seu extrato bancário na data acima.
              </p>
            </div>

            {selectedAccountId && confirmedBalance !== '' && (
              <div className="bg-stone-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-cappuccino">Saldo Calculado (carlOS)</span>
                  <span className="font-medium text-coffee">R$ {calculatedBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-cappuccino">Saldo Informado (Extrato)</span>
                  <span className="font-medium text-coffee">R$ {(parseFloat(confirmedBalance) || 0).toFixed(2)}</span>
                </div>
                <div className="border-t border-stone-200 pt-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-coffee uppercase tracking-wider">Diferença</span>
                  <span className={`font-bold ${Math.abs(difference) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {difference >= 0 ? '+' : ''}R$ {difference.toFixed(2)}
                  </span>
                </div>
                {Math.abs(difference) > 0.01 && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 rounded-lg p-2 flex items-start gap-2">
                    <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                    Será criada uma transação de ajuste para corrigir a diferença.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting || !selectedAccountId || !periodEndDate || confirmedBalance === ''}
                className="flex-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    Fechar Período
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PeriodCloseModal;