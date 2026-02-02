
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Calendar, DollarSign, Scale, Box, Divide, MapPin, Wallet, CreditCard } from 'lucide-react';
import { LogCategory, PetLog } from '../types';
import { useAccounts, useCreditCards } from '../../finance/hooks/useFinanceData';
import { supabase } from '../../../../integrations/supabase/client';
import { toISOWithNoon } from '../../finance/utils/dateHelpers';

interface PetLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: LogCategory | null;
  onSave: (data: any) => Promise<void>;
  categoryLabel: string;
  logToEdit?: PetLog | null; 
}

// Configuração de Unidades por Categoria
const UNIT_CONFIG: Partial<Record<LogCategory, { label: string; suffix: string; step: string; icon: React.ReactNode }>> = {
  food: { label: 'Peso do Pacote', suffix: 'kg', step: '0.1', icon: <Scale size={16} /> },
  cleaning: { label: 'Peso/Volume', suffix: 'g/ml', step: '1', icon: <Box size={16} /> },
  treats: { label: 'Peso', suffix: 'g', step: '0.1', icon: <Scale size={16} /> },
  pads: { label: 'Quantidade', suffix: 'un', step: '1', icon: <Box size={16} /> },
  medication: { label: 'Dose', suffix: 'mg/ml', step: '0.1', icon: <Divide size={16} /> },
  measurement: { label: 'Peso Atual', suffix: 'kg', step: '0.05', icon: <Scale size={16} /> }
};

// 1. Pega data YYYY-MM-DD local estrita
const getTodayString = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export const PetLogModal: React.FC<PetLogModalProps> = ({ 
  isOpen, 
  onClose, 
  category, 
  onSave, 
  categoryLabel, 
  logToEdit 
}) => {
  const { accounts } = useAccounts();
  const { cards } = useCreditCards();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    cost: '', 
    event_date: getTodayString(), 
    next_due_date: '',
    value: '',
    location: ''
  });

  // Finance Integration States
  const [addToFinance, setAddToFinance] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'card'>('account');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (logToEdit) {
        // MODO EDIÇÃO
        setFormData({
          title: logToEdit.title,
          cost: logToEdit.cost ? String(logToEdit.cost) : '',
          event_date: logToEdit.event_date.split('T')[0], 
          next_due_date: logToEdit.next_due_date ? logToEdit.next_due_date.split('T')[0] : '',
          value: logToEdit.value ? String(logToEdit.value) : '',
          location: logToEdit.location || ''
        });
        setAddToFinance(false); // Não cria transação financeira ao editar por padrão
      } else {
        // MODO CRIAÇÃO
        setFormData({ 
          title: '', 
          cost: '', 
          event_date: getTodayString(), 
          next_due_date: '',
          value: '',
          location: ''
        });
        setAddToFinance(true);
      }
    }
  }, [isOpen, category, logToEdit]);

  if (!isOpen || !category) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title && category !== 'measurement') return; 
    
    const costVal = formData.cost ? parseFloat(formData.cost) : 0;

    setIsSubmitting(true);
    try {
      // 1. Salvar Log do Pet (Chama o hook pai)
      const payload = {
        category,
        title: formData.title || (category === 'measurement' ? 'Pesagem' : categoryLabel),
        cost: costVal,
        event_date: formData.event_date,
        next_due_date: formData.next_due_date || null,
        value: formData.value ? parseFloat(formData.value) : null,
        location: formData.location || null
      };
      await onSave(payload);

      // 2. Salvar Transação Financeira (Se aplicável e não for edição)
      // Só cria se o usuário marcou a opção E se o valor for maior que 0
      if (!logToEdit && addToFinance && costVal > 0) {
         if ((paymentMethod === 'account' && !selectedAccountId) || (paymentMethod === 'card' && !selectedCardId)) {
             alert("Log salvo, mas transação financeira ignorada pois a conta/cartão não foi selecionada.");
         } else {
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
                 const transactionPayload = {
                     description: `[Pet] ${payload.title}`,
                     amount: costVal,
                     type: 'expense',
                     category: 'Pets',
                     date: toISOWithNoon(formData.event_date),
                     account_id: paymentMethod === 'account' ? selectedAccountId : null,
                     credit_card_id: paymentMethod === 'card' ? selectedCardId : null,
                     status: 'paid', // Assumimos pago (ou lançado no cartão)
                     location: formData.location,
                     user_id: user.id
                 };
                 await supabase.from('transactions').insert(transactionPayload);
             }
         }
      }

      onClose();
    } catch (error) {
      alert('Erro ao salvar registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMeasurement = category === 'measurement';
  const showDueDate = ['vaccine', 'medication', 'hygiene', 'health'].includes(category);
  const unitConfig = UNIT_CONFIG[category];
  
  // Agora mostramos sempre que não for medição e não for edição
  // O valor só será cobrado se cost > 0
  const showFinanceOption = !isMeasurement && !logToEdit;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-stone-400 hover:text-stone-600">
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-stone-800 mb-6">
          {logToEdit ? 'Editar: ' : 'Novo: '} 
          <span className="text-olive">{categoryLabel}</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isMeasurement && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Título / Detalhe</label>
              <input 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-700 outline-none focus:ring-2 focus:ring-olive/20"
                autoFocus={!logToEdit} 
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Data</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                  type="date"
                  value={formData.event_date}
                  onChange={e => setFormData({...formData, event_date: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-10 text-stone-700 outline-none focus:ring-2 focus:ring-olive/20"
                />
              </div>
            </div>
            
            {/* Campo Custo - Oculto se for Medição de Peso */}
            {!isMeasurement && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Custo (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={e => setFormData({...formData, cost: e.target.value})}
                    placeholder="0.00"
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-10 text-stone-700 outline-none focus:ring-2 focus:ring-olive/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Campo de Local */}
          {!isMeasurement && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Local / Fornecedor</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="Ex: Petz, Clínica Vet..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-10 text-stone-700 outline-none focus:ring-2 focus:ring-olive/20"
                />
              </div>
            </div>
          )}

          {/* Campo Dinâmico de Valor (Peso/Qtd) */}
          {unitConfig && (
            <div className={isMeasurement ? 'mt-0' : 'pt-2 border-t border-stone-50'}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">
                {unitConfig.label}
              </label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                  {unitConfig.icon}
                </div>
                <input 
                  type="number"
                  step={unitConfig.step}
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: e.target.value})}
                  placeholder="0"
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-10 pr-12 text-stone-700 outline-none focus:ring-2 focus:ring-olive/20"
                  autoFocus={isMeasurement && !logToEdit}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  {unitConfig.suffix}
                </span>
              </div>
            </div>
          )}

          {showDueDate && (
            <div className="pt-2 border-t border-stone-50">
               <label className="text-[10px] font-bold uppercase tracking-widest text-olive ml-1">Próximo Vencimento (Opcional)</label>
               <input 
                  type="date"
                  value={formData.next_due_date}
                  onChange={e => setFormData({...formData, next_due_date: e.target.value})}
                  className="w-full bg-olive/5 border border-olive/10 rounded-xl p-3 text-stone-700 outline-none focus:ring-2 focus:ring-olive/20 mt-1"
                />
            </div>
          )}

          {/* INTEGRACAO FINANCEIRA (SEMPRE VISÍVEL SE FOR POSSÍVEL TER CUSTO) */}
          {showFinanceOption && (
             <div className={`mt-4 bg-[#5F6F52]/5 border border-[#5F6F52]/10 rounded-xl p-4 transition-all ${!formData.cost || Number(formData.cost) === 0 ? 'opacity-50' : 'opacity-100'}`}>
                <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => setAddToFinance(!addToFinance)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${addToFinance ? 'bg-[#5F6F52] border-[#5F6F52] text-white' : 'bg-white border-stone-300'}`}>
                        {addToFinance && <span className="text-[10px]">✓</span>}
                    </div>
                    <span className="text-xs font-bold text-[#5F6F52] uppercase tracking-wide">Lançar no Financeiro?</span>
                </div>

                {addToFinance && (
                    <div className="space-y-3 animate-fade-in">
                        <div className="flex bg-white rounded-lg p-1 border border-[#5F6F52]/10">
                            <button 
                                type="button" 
                                onClick={() => { setPaymentMethod('account'); setSelectedCardId(''); }}
                                className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${paymentMethod === 'account' ? 'bg-[#5F6F52] text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                <Wallet size={12} /> Conta
                            </button>
                            <button 
                                type="button" 
                                onClick={() => { setPaymentMethod('card'); setSelectedAccountId(''); }}
                                className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${paymentMethod === 'card' ? 'bg-[#5F6F52] text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                <CreditCard size={12} /> Cartão
                            </button>
                        </div>

                        {paymentMethod === 'account' ? (
                            <select 
                                value={selectedAccountId} 
                                onChange={e => setSelectedAccountId(e.target.value)}
                                className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs outline-none focus:border-[#5F6F52]"
                            >
                                <option value="">Selecione a Conta...</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>)}
                            </select>
                        ) : (
                            <select 
                                value={selectedCardId} 
                                onChange={e => setSelectedCardId(e.target.value)}
                                className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs outline-none focus:border-[#5F6F52]"
                            >
                                <option value="">Selecione o Cartão...</option>
                                {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        )}
                        
                        {(!formData.cost || Number(formData.cost) === 0) && (
                            <p className="text-[10px] text-stone-400 italic text-center pt-1">
                                Preencha o campo "Custo" acima para habilitar o lançamento.
                            </p>
                        )}
                    </div>
                )}
             </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-olive text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#4a5740] transition-all mt-6 shadow-lg active:scale-95"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            {logToEdit ? 'Atualizar Registro' : 'Salvar Registro'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
