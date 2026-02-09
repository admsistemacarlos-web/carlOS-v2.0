import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { 
  X, Check, Calendar, CreditCard, Wallet, ArrowUpCircle, ArrowDownCircle, 
  Plus, Trash2, Save, Loader2, ListPlus, DollarSign
} from 'lucide-react';
import { useAccounts, useCards } from '../hooks/useFinanceData';
import { supabase } from '../../../../integrations/supabase/client';
import { TransactionItem, Transaction } from '../types/finance.types';
import { parseLocalDate, toISOWithNoon, getTodayLocal } from '../utils/dateHelpers';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  transactionToEdit?: Transaction | null;
}

interface TransactionFormData {
  description: string;
  amount: number | string;
  category: string;
  date: string;
  type: 'income' | 'expense';
  originType: 'account' | 'card';
  account_id: string;
  credit_card_id: string;
  status: 'paid' | 'pending';
  installments: number;
}

const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ isOpen, onClose, onSuccess, transactionToEdit }) => {
  const { accounts } = useAccounts();
  const { cards } = useCards();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'simple' | 'items'>('simple');
  
  const [items, setItems] = useState<Partial<TransactionItem>[]>([]);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  const { register, handleSubmit, watch, setValue, reset } = useForm<TransactionFormData>({
    defaultValues: {
      type: 'expense',
      originType: 'account',
      status: 'paid',
      date: getTodayLocal(),
      amount: '',
      installments: 1
    }
  });

  const type = watch('type');
  const originType = watch('originType');
  const status = watch('status');
  const formAmount = watch('amount');

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        reset({
          description: transactionToEdit.description,
          amount: transactionToEdit.amount,
          category: transactionToEdit.category,
          date: parseLocalDate(transactionToEdit.date),
          type: transactionToEdit.type as 'income' | 'expense',
          originType: transactionToEdit.credit_card_id ? 'card' : 'account',
          account_id: transactionToEdit.account_id || '',
          credit_card_id: transactionToEdit.credit_card_id || '',
          status: transactionToEdit.status,
          installments: 1 
        });
        
        if (transactionToEdit.items && transactionToEdit.items.length > 0) {
           setItems(transactionToEdit.items);
           setActiveTab('items');
        } else {
           setItems([]);
           setActiveTab('simple');
        }

      } else {
        reset({
          description: '',
          amount: '',
          category: '',
          date: getTodayLocal(),
          type: 'expense',
          originType: 'account',
          status: 'paid',
          installments: 1,
          account_id: '',
          credit_card_id: ''
        });
        setItems([]);
        setActiveTab('simple');
      }
      setNewItemName('');
      setNewItemPrice(0);
      setNewItemQty(1);
    }
  }, [isOpen, reset, transactionToEdit]);

  useEffect(() => {
    if (type === 'income') {
      setValue('originType', 'account');
      setValue('status', 'paid');
    }
  }, [type, setValue]);

  useEffect(() => {
    if (originType === 'card') {
      setValue('status', 'pending');
    }
  }, [originType, setValue]);

  useEffect(() => {
    if (activeTab === 'items') {
      const total = items.reduce((acc, item) => acc + (item.amount || 0), 0);
      setValue('amount', parseFloat(total.toFixed(2)));
    }
  }, [items, activeTab, setValue]);

  const handleAddItem = () => {
    if (!newItemName || newItemPrice <= 0) return;
    
    const totalItem = newItemQty * newItemPrice;
    const newItem: Partial<TransactionItem> = {
      id: crypto.randomUUID(), 
      name: newItemName,
      quantity: newItemQty,
      unit_price: newItemPrice,
      amount: totalItem, 
    };

    // Atualiza o array de itens
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    
    // ✅ CORREÇÃO: Calcula e atualiza o total IMEDIATAMENTE
    const newTotal = updatedItems.reduce((acc, item) => acc + (item.amount || 0), 0);
    setValue('amount', parseFloat(newTotal.toFixed(2)));
    
    // Limpa os campos
    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice(0);
  };

  const handleRemoveItem = (id: string) => {
    // Remove o item
    const updatedItems = items.filter(i => i.id !== id);
    setItems(updatedItems);
    
    // ✅ CORREÇÃO: Recalcula o total IMEDIATAMENTE após remover
    const newTotal = updatedItems.reduce((acc, item) => acc + (item.amount || 0), 0);
    setValue('amount', parseFloat(newTotal.toFixed(2)));
  };

  const onSubmit = async (data: TransactionFormData) => {
    if (!data.description) return alert("Informe uma descrição.");
    const amountVal = Number(data.amount);
    if (isNaN(amountVal) || amountVal <= 0) return alert("Valor inválido.");
    if (!data.category) return alert("Informe uma categoria.");
    
    if (data.originType === 'account' && !data.account_id) return alert("Selecione uma conta.");
    if (data.originType === 'card' && !data.credit_card_id) return alert("Selecione um cartão.");

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const dateToSave = toISOWithNoon(data.date);

      const transactionPayload: any = {
        description: data.description,
        amount: amountVal,
        type: data.type,
        category: data.category,
        date: dateToSave,
        status: data.status,
        user_id: user.id,
      };

      if (data.originType === 'account') {
        transactionPayload.account_id = data.account_id;
        transactionPayload.credit_card_id = null;
      } else {
        transactionPayload.credit_card_id = data.credit_card_id;
        transactionPayload.account_id = null;
        transactionPayload.is_locked = false;
      }

      let transactionId = transactionToEdit?.id;

      if (transactionToEdit) {
        const { error } = await supabase
          .from('transactions')
          .update(transactionPayload)
          .eq('id', transactionToEdit.id);
        if (error) throw error;
      } else {
        const { data: newTrans, error } = await supabase
          .from('transactions')
          .insert([transactionPayload])
          .select()
          .single();
        
        if (error) throw error;
        transactionId = newTrans.id;
      }

      if (activeTab === 'items' && items.length > 0 && transactionId) {
        if (transactionToEdit) {
           await supabase.from('transaction_items').delete().eq('transaction_id', transactionId);
        }

        const itemsPayload = items.map(item => ({
          transaction_id: transactionId,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          user_id: user.id
        }));

        const { error: itemsError } = await supabase
          .from('transaction_items')
          .insert(itemsPayload);

        if (itemsError) console.error("Erro ao salvar itens:", itemsError);
      }

      if (onSuccess) onSuccess();
      onClose();

    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const themeHex = type === 'expense' ? '#A34343' : '#5F6F52';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* OVERLAY: Full Screen, Fixed, Dark */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* CONTENT: Centered Absoluted */}
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] p-4">
        <div className="bg-white w-full rounded-[2rem] shadow-2xl border border-stone-100 flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
          
          <div className="flex justify-between items-center p-6 border-b border-stone-50">
            <h2 className="text-xl font-semibold text-coffee tracking-tight">
              {transactionToEdit ? 'Editar Movimentação' : 'Nova Movimentação'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full text-cappuccino transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="flex gap-4">
              <div className="flex bg-stone-50 p-1 rounded-xl flex-1">
                <button
                  type="button"
                  onClick={() => setValue('type', 'expense')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${type === 'expense' ? 'bg-white text-terracotta shadow-sm' : 'text-stone-400'}`}
                >
                  <ArrowDownCircle size={14} /> Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setValue('type', 'income')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${type === 'income' ? 'bg-white text-olive shadow-sm' : 'text-stone-400'}`}
                >
                  <ArrowUpCircle size={14} /> Receita
                </button>
              </div>
              
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                  type="date"
                  {...register('date')}
                  className="w-full h-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 text-sm text-coffee outline-none focus:ring-2 focus:ring-black/5 font-medium"
                />
              </div>
            </div>

            {type === 'expense' && (
              <div className="flex border-b border-stone-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('simple')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'simple' ? 'border-olive text-olive' : 'border-transparent text-stone-400'}`}
                >
                  <DollarSign size={14} /> Valor Único
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('items')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'items' ? 'border-olive text-olive' : 'border-transparent text-stone-400'}`}
                >
                  <ListPlus size={14} /> Detalhar Itens
                </button>
              </div>
            )}

            {activeTab === 'simple' ? (
              <div className="text-center py-4 animate-fade-in">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Valor da Transação</label>
                <div className="relative inline-block w-full max-w-[200px]">
                  <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-medium opacity-40`} style={{ color: themeHex }}>R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    {...register('amount')}
                    placeholder="0.00"
                    className={`w-full bg-transparent text-4xl font-bold text-center outline-none placeholder-stone-200`}
                    style={{ color: themeHex }}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 space-y-4 animate-fade-in">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase ml-1">Produto</label>
                    <input 
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      placeholder="Ex: Gasolina..."
                      className="w-full p-2 rounded-lg border border-stone-200 text-sm outline-none focus:ring-1 focus:ring-olive/20"
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    />
                  </div>
                  <div className="w-16">
                    <label className="text-[9px] font-bold text-stone-400 uppercase ml-1">Qtd</label>
                    <input 
                      type="number"
                      value={newItemQty}
                      onChange={e => setNewItemQty(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-stone-200 text-sm text-center outline-none"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[9px] font-bold text-stone-400 uppercase ml-1">Unitário</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={newItemPrice}
                      onChange={e => setNewItemPrice(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-stone-200 text-sm outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="bg-coffee text-white p-2.5 rounded-lg hover:bg-black transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-stone-100 shadow-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-stone-100 text-xs font-bold rounded text-stone-500">{item.quantity}x</span>
                        <span className="text-sm font-medium text-coffee truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-bold text-olive">R$ {(item.amount || 0).toFixed(2)}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveItem(item.id!)} 
                          className="text-stone-300 hover:text-terracotta"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-center text-xs text-stone-400 py-4 italic border-2 border-dashed border-stone-200 rounded-lg">Adicione itens.</p>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-stone-200">
                  <span className="text-xs font-bold uppercase text-stone-400">Total</span>
                  <span className="text-xl font-bold text-coffee">R$ {formAmount || '0.00'}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-coffee uppercase tracking-widest ml-1">Descrição</label>
                <input 
                  {...register('description')}
                  placeholder="Ex: Supermercado..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-coffee outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-coffee uppercase tracking-widest ml-1">Categoria</label>
                <input 
                  {...register('category')}
                  placeholder="Ex: Alimentação..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-coffee outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-coffee uppercase tracking-widest ml-1">Origem</label>
                
                {type === 'expense' && (
                  <div className="flex bg-stone-100 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setValue('originType', 'account')}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${originType === 'account' ? 'bg-white shadow-sm text-coffee' : 'text-stone-400'}`}
                    >
                      Conta
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('originType', 'card')}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${originType === 'card' ? 'bg-white shadow-sm text-coffee' : 'text-stone-400'}`}
                    >
                      Cartão
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  {originType === 'account' ? (
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                      <select 
                        {...register('account_id')}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-coffee outline-none focus:ring-2 focus:ring-black/5 appearance-none"
                      >
                        <option value="">Selecione a Conta...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                      <select 
                        {...register('credit_card_id')}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-coffee outline-none focus:ring-2 focus:ring-black/5 appearance-none"
                      >
                        <option value="">Selecione o Cartão...</option>
                        {cards.map(card => (
                          <option key={card.id} value={card.id}>{card.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </form>

          <div className="p-6 border-t border-stone-50 bg-white">
            <button 
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl text-white font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
              style={{ backgroundColor: themeHex }}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSubmitting ? 'Salvando...' : 'Salvar Transação'}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default NewTransactionModal;