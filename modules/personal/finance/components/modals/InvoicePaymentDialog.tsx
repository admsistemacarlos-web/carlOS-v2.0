
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccounts, useCards } from '../../hooks/useFinanceData';
import { InvoiceService } from '../../../../../services/InvoiceService';
import { Bill } from '../../types/finance.types';
import { X, Loader2, Wallet, CheckCircle2, AlertCircle, Calendar, AlertTriangle, CreditCard, List } from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { getTodayLocal } from '../../utils/dateHelpers';

interface InvoicePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill;
  onSuccess: () => void;
}

const InvoicePaymentDialog: React.FC<InvoicePaymentDialogProps> = ({ isOpen, onClose, bill, onSuccess }) => {
  const { user } = useAuth();
  
  // Hooks de Dados
  // FIX: Fixed destructuring from useAccounts and useCards as they return the direct state, not a wrapper 'data' property.
  const { accounts, loading: loadingAccounts } = useAccounts();
  const { cards, loading: loadingCards } = useCards();
  
  // Estados Locais
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [selectedSourceType, setSelectedSourceType] = useState<'account' | 'card'>('account');
  const [installments, setInstallments] = useState(1); // Novo estado
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayLocal());

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!selectedSourceId) {
      setError('Selecione uma forma de pagamento.');
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    setError('');

    try {
      await InvoiceService.payInvoice(
        bill.id,
        bill.amount,
        selectedSourceId,
        bill.description,
        user.id,
        paymentDate,
        bill.category, // Passa a categoria original (ex: Streaming)
        bill.description, // Passa a descrição original como raw (ex: Netflix)
        selectedSourceType, // Passa o tipo (account ou card)
        installments // Passa o número de parcelas
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verificação de Saldo (Apenas para Contas Bancárias)
  let hasBalance = true;
  if (selectedSourceType === 'account') {
    const account = accounts?.find(a => a.id === selectedSourceId);
    if (account) {
      hasBalance = account.balance >= bill.amount;
    }
  }

  const isLoading = loadingAccounts || loadingCards;
  
  // Cálculo do valor da parcela (apenas visual)
  const installmentValue = installments > 1 ? (bill.amount / installments) : bill.amount;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-coffee/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-coffee tracking-tighter">Pagar Conta</h2>
              <p className="text-cappuccino text-[10px] font-bold uppercase tracking-widest mt-1">{bill.description}</p>
              <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded mt-1 inline-block">{bill.category}</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-cream rounded-full transition-colors text-cappuccino">
              <X size={20} />
            </button>
          </div>

          <div className="bg-stone-50 rounded-xl p-6 mb-6 text-center border border-stone-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cappuccino mb-2">Valor do Pagamento</p>
            <p className="text-3xl font-bold text-coffee">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            {installments > 1 && (
                <p className="text-xs text-olive font-bold mt-2 bg-olive/10 inline-block px-3 py-1 rounded-lg">
                    {installments}x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest ml-1">Forma de Pagamento</label>
            
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-olive" /></div>
            ) : (
              <div className="space-y-4">
                
                {/* LISTA DE CONTAS */}
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Contas Bancárias</p>
                  {accounts?.filter(a => a.type !== 'investment').map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => { setSelectedSourceId(acc.id); setSelectedSourceType('account'); setInstallments(1); setError(''); }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        selectedSourceId === acc.id 
                          ? 'bg-olive/5 border-olive ring-1 ring-olive' 
                          : 'bg-white border-stone-200 hover:border-olive/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${selectedSourceId === acc.id ? 'bg-olive text-white' : 'bg-stone-100 text-stone-400'}`}>
                          <Wallet size={16} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-coffee">{acc.name}</p>
                          <p className="text-[10px] text-cappuccino">Saldo: R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      {selectedSourceId === acc.id && <CheckCircle2 size={18} className="text-olive" />}
                    </button>
                  ))}
                </div>

                {/* LISTA DE CARTÕES */}
                {cards && cards.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Cartões de Crédito</p>
                    {cards.map(card => (
                      <button
                        key={card.id}
                        onClick={() => { setSelectedSourceId(card.id); setSelectedSourceType('card'); setError(''); }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          selectedSourceId === card.id 
                            ? 'bg-blue-500/5 border-blue-500 ring-1 ring-blue-500' 
                            : 'bg-white border-stone-200 hover:border-blue-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${selectedSourceId === card.id ? 'bg-blue-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                            <CreditCard size={16} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-coffee">{card.name}</p>
                            <p className="text-[10px] text-cappuccino">
                                Vence dia {card.due_day}
                            </p>
                          </div>
                        </div>
                        {selectedSourceId === card.id && <CheckCircle2 size={18} className="text-blue-500" />}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Seletor de Parcelas (Apenas se for Cartão) */}
          {selectedSourceType === 'card' && selectedSourceId && (
             <div className="mt-4 animate-fade-in">
                <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest ml-1 mb-2">
                  Parcelamento
                </label>
                <div className="relative">
                    <List size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cappuccino" />
                    <select
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full bg-white border border-stone-200 rounded-xl py-3.5 pl-9 pr-4 text-coffee text-sm focus:ring-2 focus:ring-blue-500/10 outline-none transition-all cursor-pointer appearance-none"
                    >
                        <option value={1}>À vista (1x)</option>
                        {[...Array(11)].map((_, i) => (
                            <option key={i} value={i + 2}>
                                {i + 2}x de {(bill.amount / (i + 2)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </option>
                        ))}
                    </select>
                </div>
             </div>
          )}

          <div className="mt-4">
            <label className="block text-[10px] font-bold text-coffee uppercase tracking-widest ml-1 mb-2">
              Data do Pagamento
            </label>
            <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cappuccino" />
                <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-9 pr-4 text-coffee text-sm focus:ring-2 focus:ring-olive/10 outline-none transition-all"
                />
            </div>
          </div>

          {selectedSourceType === 'account' && selectedSourceId && !hasBalance && (
             <div className="mt-4 flex items-center gap-2 text-terracotta text-xs font-bold bg-terracotta/5 p-3 rounded-lg border border-terracotta/10">
                <AlertTriangle size={14} />
                <span>Saldo insuficiente nesta conta.</span>
             </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg text-center">
              {error}
            </div>
          )}

          <button 
            onClick={handlePayment}
            disabled={isSubmitting || !selectedSourceId || (selectedSourceType === 'account' && !hasBalance)}
            className="w-full mt-6 bg-olive hover:bg-black text-white py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {isSubmitting ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InvoicePaymentDialog;
