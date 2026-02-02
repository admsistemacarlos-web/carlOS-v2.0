
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import TransactionForm from '../components/forms/TransactionForm';
import { Transaction } from '../types/finance.types';

const NewTransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicateId');
  
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(!!(id || duplicateId));

  useEffect(() => {
    const targetId = id || duplicateId;
    if (targetId) {
      const fetchTransaction = async () => {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('*, items:transaction_items(*)')
            .eq('id', targetId)
            .single();

          if (error) throw error;
          setTransactionToEdit(data);
        } catch (error) {
          console.error("Erro ao buscar transação:", error);
          alert("Erro ao carregar os dados da transação.");
          navigate(-1);
        } finally {
          setLoading(false);
        }
      };
      fetchTransaction();
    }
  }, [id, duplicateId, navigate]);

  const handleSuccess = () => {
    navigate(-1); // Volta para a página anterior
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-coffee" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 animate-fade-in">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-cappuccino" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-coffee tracking-tighter">
              {id ? 'Editar Movimentação' : duplicateId ? 'Duplicar Movimentação' : 'Nova Movimentação'}
            </h1>
            <p className="text-cappuccino text-xs font-bold uppercase tracking-widest mt-1">
              {id ? 'Atualize os dados do lançamento' : duplicateId ? 'Revise os dados para o novo lançamento' : 'Registre suas entradas e saídas'}
            </p>
          </div>
        </div>

        {/* Formulário em card branco */}
        <div className="bg-white rounded-[2rem] border border-stone-100 shadow-premium p-8">
          <TransactionForm 
            onSuccess={handleSuccess} 
            transactionToEdit={transactionToEdit}
            isDuplicate={!!duplicateId}
          />
        </div>
      </div>
    </div>
  );
};

export default NewTransactionPage;
