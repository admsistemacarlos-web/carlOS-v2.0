import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Bill } from '../../types/finance.types';
import { parseLocalDate } from '../../utils/dateHelpers';

interface InstallmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  installments: Bill[];
  onPayInstallment?: (installmentId: string) => void;
}

const InstallmentDetailsModal: React.FC<InstallmentDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  installments,
  onPayInstallment 
}) => {
  if (!isOpen || installments.length === 0) return null;

  const sortedInstallments = [...installments].sort((a, b) => 
    (a.installment_number || 0) - (b.installment_number || 0)
  );

  const firstInstallment = sortedInstallments[0];
  const totalAmount = sortedInstallments.reduce((acc, i) => acc + i.amount, 0);
  const paidCount = sortedInstallments.filter(i => i.status === 'paid').length;
  const paidAmount = sortedInstallments.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-xl rounded-[1.5rem] shadow-2xl border border-stone-100 overflow-hidden max-h-[85vh] flex flex-col">
        
        {/* Header Compacto */}
        <div className="px-5 py-4 border-b border-stone-100 flex-shrink-0 bg-white z-10">
          <div className="flex justify-between items-start mb-3">
            <div className="pr-4 min-w-0">
              <h2 className="text-lg font-bold text-coffee tracking-tight truncate leading-tight">
                {firstInstallment.description.split('(')[0].trim()}
              </h2>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">
                {sortedInstallments.length}x Parcelas
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-stone-100 rounded-full transition-colors text-stone-400 flex-shrink-0 -mr-2"
            >
              <X size={18} />
            </button>
          </div>

          {/* Resumo em Linha (Grid Ultra Compacto) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-stone-50 px-2 py-2 rounded-lg border border-stone-100 flex flex-col justify-center">
              <p className="text-[8px] text-stone-400 uppercase tracking-wider font-bold mb-0.5 truncate">Total</p>
              <p className="text-[11px] min-[375px]:text-xs sm:text-sm font-bold text-coffee break-words leading-tight">
                {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="bg-emerald-50/50 px-2 py-2 rounded-lg border border-emerald-100/50 flex flex-col justify-center">
              <p className="text-[8px] text-emerald-600 uppercase tracking-wider font-bold mb-0.5 truncate">Pago ({paidCount})</p>
              <p className="text-[11px] min-[375px]:text-xs sm:text-sm font-bold text-emerald-600 break-words leading-tight">
                {paidAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="bg-blue-50/50 px-2 py-2 rounded-lg border border-blue-100/50 flex flex-col justify-center">
              <p className="text-[8px] text-blue-600 uppercase tracking-wider font-bold mb-0.5 truncate">Falta ({sortedInstallments.length - paidCount})</p>
              <p className="text-[11px] min-[375px]:text-xs sm:text-sm font-bold text-blue-600 break-words leading-tight">
                {pendingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Parcelas (Scrollável) */}
        <div className="flex-1 overflow-y-auto px-2 py-2 bg-stone-50/30">
          <div className="space-y-1.5">
            {sortedInstallments.map((installment) => {
              const isPaid = installment.status === 'paid';
              const isOverdue = installment.status === 'overdue';
              
              return (
                <div 
                  key={installment.id}
                  className={`px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                    isPaid ? 'bg-white border-stone-100 opacity-60' :
                    isOverdue ? 'bg-red-50 border-red-100' :
                    'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${
                        isPaid ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 
                        isOverdue ? 'bg-red-100 text-red-600 border-red-200' :
                        'bg-stone-100 text-stone-400 border-stone-200'
                    }`}>
                      {isPaid ? <CheckCircle2 size={12} /> : 
                       isOverdue ? <AlertCircle size={12} /> : 
                       <span className="text-[9px] font-bold">{installment.installment_number}</span>}
                    </div>
                    
                    <div className="min-w-0 flex flex-col">
                      <span className={`text-xs font-bold truncate ${isPaid ? 'text-stone-400 line-through' : 'text-coffee'}`}>
                        {installment.installment_number}ª Parcela
                      </span>
                      <span className="text-[9px] text-stone-400 font-medium">
                        {parseLocalDate(installment.due_date).split('-').reverse().slice(0, 2).join('/')} • {new Date(installment.due_date).getFullYear()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 flex items-center gap-3">
                    <span className={`text-xs font-bold whitespace-nowrap ${
                      isPaid ? 'text-emerald-600' :
                      isOverdue ? 'text-red-600' :
                      'text-coffee'
                    }`}>
                      {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    
                    {!isPaid && onPayInstallment && (
                      <button
                        onClick={() => onPayInstallment(installment.id)}
                        className="h-6 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[9px] font-bold uppercase tracking-wide border border-blue-100 transition-colors"
                      >
                        Pagar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Compacto */}
        <div className="p-3 border-t border-stone-100 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-600 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InstallmentDetailsModal;