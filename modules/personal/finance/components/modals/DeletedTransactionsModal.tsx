import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Trash2, RotateCcw, Loader2, AlertCircle, 
  Calendar, ArrowDownLeft, ArrowUpRight, Search,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../../../../integrations/supabase/client';
import { Transaction } from '../../types/finance.types';

interface DeletedTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore?: () => void;
}

const DeletedTransactionsModal: React.FC<DeletedTransactionsModalProps> = ({ 
  isOpen, 
  onClose,
  onRestore 
}) => {
  const [deletedTransactions, setDeletedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [permanentlyDeletingId, setPermanentlyDeletingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const fetchDeletedTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setDeletedTransactions(data || []);
    } catch (err) {
      console.error('Erro ao buscar transações deletadas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDeletedTransactions();
    }
  }, [isOpen, fetchDeletedTransactions]);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;

      setDeletedTransactions(prev => prev.filter(t => t.id !== id));
      onRestore?.();
    } catch (err: any) {
      console.error('Erro ao restaurar:', err);
      alert('Erro ao restaurar: ' + err.message);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Tem certeza? Esta ação é IRREVERSÍVEL e apagará a transação permanentemente.')) {
      return;
    }

    setPermanentlyDeletingId(id);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDeletedTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Erro ao excluir permanentemente:', err);
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setPermanentlyDeletingId(null);
    }
  };

  const filteredTransactions = deletedTransactions.filter(t => 
    t.description.toLowerCase().includes(searchText.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchText.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDeletedAt = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-[2rem] shadow-2xl border border-stone-100 flex flex-col overflow-hidden animate-fade-in">
        
        <div className="flex justify-between items-center p-6 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-xl text-red-500">
              <Trash2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-coffee tracking-tight">Lixeira</h2>
              <p className="text-xs text-cappuccino">
                {deletedTransactions.length} transação(ões) deletada(s)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-cappuccino"
          >
            <X size={20} />
          </button>
        </div>

        {deletedTransactions.length > 0 && (
          <div className="px-6 py-4 border-b border-stone-100 flex-shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar na lixeira..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-stone-200 transition-all"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-cappuccino">
              <Loader2 size={32} className="animate-spin mb-3" />
              <p className="text-sm">Carregando...</p>
            </div>
          ) : deletedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-medium text-coffee mb-1">Lixeira vazia</h3>
              <p className="text-sm text-cappuccino">
                Nenhuma transação foi excluída recentemente.
              </p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle size={32} className="text-stone-300 mb-3" />
              <p className="text-sm text-cappuccino">
                Nenhuma transação encontrada para "{searchText}"
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="bg-stone-50 rounded-xl p-4 border border-stone-100 hover:border-stone-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        transaction.type === 'income' 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-red-100 text-red-500'
                      }`}>
                        {transaction.type === 'income' 
                          ? <ArrowDownLeft size={16} /> 
                          : <ArrowUpRight size={16} />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-coffee text-sm truncate">
                          {transaction.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span className="text-xs text-cappuccino flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDate(transaction.date)}
                          </span>
                          {transaction.category && (
                            <span className="text-xs text-cappuccino bg-stone-200 px-2 py-0.5 rounded-full">
                              {transaction.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1.5">
                          Deletado {formatDeletedAt(transaction.deleted_at!)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`font-bold text-sm ${
                        transaction.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        R$ {transaction.amount.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRestore(transaction.id)}
                          disabled={restoringId === transaction.id || permanentlyDeletingId === transaction.id}
                          className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Restaurar"
                        >
                          {restoringId === transaction.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RotateCcw size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(transaction.id)}
                          disabled={restoringId === transaction.id || permanentlyDeletingId === transaction.id}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Excluir permanentemente"
                        >
                          {permanentlyDeletingId === transaction.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {deletedTransactions.length > 0 && (
          <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex-shrink-0">
            <p className="text-[10px] text-stone-400 text-center">
              💡 Transações na lixeira ainda afetam relatórios de auditoria. 
              Para remover completamente, use "Excluir permanentemente".
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default DeletedTransactionsModal;