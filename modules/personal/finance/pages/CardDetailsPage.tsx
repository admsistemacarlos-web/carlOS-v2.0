
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../../integrations/supabase/client';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  CreditCard as CreditCardIcon,
  Pencil,
  Settings,
  FileText,
  X,
  Copy
} from 'lucide-react';
import CreditTransactionModal from '../components/modals/CreditTransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import CardForm from '../components/forms/CardForm';
import { CreditCard, Transaction } from '../types/finance.types';
import { formatDateBr } from '../utils/dateHelpers';

export default function CardDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Dados
  const [card, setCard] = useState<CreditCard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Estados dos Modais
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);

  // Estado Modal Confirmação
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    transactionId: string | null;
  }>({ isOpen: false, transactionId: null });

  // Helper Functions para datas
  const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  // --- 1. Carregar Dados ---
  useEffect(() => {
    fetchCardDetails();
    fetchTransactions();
  }, [id, currentDate]);

  async function fetchCardDetails() {
    if (!id) return;
    const { data } = await supabase.from('credit_cards').select('*').eq('id', id).single();
    if (data) setCard(data);
  }

  async function fetchTransactions() {
    if (!id) return;
    setLoading(true);

    const start = startOfMonth(currentDate).toISOString();
    const end = endOfMonth(currentDate).toISOString();

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('credit_card_id', id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });

    if (!error) {
      setTransactions(data || []);
    }
    setLoading(false);
  }

  // --- 2. Handlers de Ação ---

  const handleOpenNewTransaction = () => {
    setTransactionToEdit(null);
    setIsTransactionDialogOpen(true);
  };

  const handleOpenEditTransaction = (t: Transaction) => {
    setTransactionToEdit(t);
    setIsTransactionDialogOpen(true);
  };

  const handleDuplicate = (t: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    // No caso do cartão de crédito, usamos o formulário de página para duplicação para permitir parcelamento etc.
    navigate(`/personal/finance/transactions/new?duplicateId=${t.id}`);
  };

  const handleDeleteTransaction = (transactionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirm({ isOpen: true, transactionId });
  };

  const confirmDeleteTransaction = async () => {
    const transactionId = deleteConfirm.transactionId;
    if (!transactionId) return;

    setDeleteConfirm({ isOpen: false, transactionId: null });
    const backup = [...transactions];

    try {
      // 1. Remover da tela
      setTransactions(prev => prev.filter(t => t.id !== transactionId));

      // 2. Deletar
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      // 3. Garantir consistência
      fetchTransactions();

    } catch (err: any) {
      console.error(err);
      alert('Erro: ' + err.message);
      setTransactions(backup);
    }
  };

  // Navegação de Datas
  function prevMonth() { 
    const d = new Date(currentDate);
    d.setDate(1); 
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  }
  
  function nextMonth() { 
    const d = new Date(currentDate);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  }

  // Cálculos
  const totalInvoice = transactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#4A4036] p-4 pb-24 font-sans">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold truncate max-w-[200px]">{card?.name || 'Carregando...'}</h1>
          {card && (
            <button 
              onClick={() => setIsCardFormOpen(true)}
              className="p-2 text-gray-400 hover:text-olive hover:bg-olive/10 rounded-full transition-all"
              title="Editar Cartão"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="w-10" /> 
      </div>

      {/* NAV DE MÊS */}
      <div className="flex items-center justify-center space-x-4 mb-8 bg-white p-3 rounded-2xl shadow-sm border border-stone-100">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-lg capitalize text-coffee">
          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* TOTAL DA FATURA */}
      <div className="text-center mb-8 animate-fade-in relative">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
          Fatura Estimada do Mês
        </p>
        <h2 className="text-4xl font-bold text-[#2C3E50]">
          {totalInvoice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </h2>
        <div className="flex items-center justify-center gap-3 mt-3 text-xs font-medium text-gray-400">
          <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-stone-100">
            <Calendar className="w-3 h-3 text-olive" />
            <span>Fecha dia {card?.closing_day}</span>
          </div>
          <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-stone-100">
             <CreditCardIcon className="w-3 h-3 text-terracotta" />
             <span>Vence dia {card?.due_day}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button 
            onClick={() => navigate(`/personal/finance/cards/${id}/invoices`)}
            className="flex items-center gap-2 bg-cream border border-olive/20 text-olive px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-olive hover:text-white transition-all shadow-sm"
          >
            <FileText size={14} /> Gerenciar Faturas
          </button>
        </div>
      </div>

      {/* AÇÕES */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={handleOpenNewTransaction}
          className="flex-1 bg-[#4A4036] text-white py-4 rounded-2xl font-semibold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-[#3E352D]"
        >
          <Plus className="w-5 h-5" />
          NOVA COMPRA
        </button>
      </div>

      {/* LISTA DE TRANSAÇÕES */}
      <div className="bg-white rounded-[2rem] p-6 shadow-premium border border-stone-100 min-h-[300px]">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-coffee">
          <CreditCardIcon className="w-5 h-5 text-olive" />
          Extrato
        </h3>

        {loading ? (
          <div className="flex justify-center py-10">
             <div className="w-6 h-6 border-2 border-olive border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Nenhuma compra encontrada neste mês.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((t) => (
              <div 
                key={t.id} 
                className="group relative flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-stone-50/50 rounded-xl px-2 -mx-2 transition-colors cursor-pointer"
                onClick={() => handleOpenEditTransaction(t)}
              >
                {/* Info da Compra */}
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-semibold text-[#4A4036] truncate">{t.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-stone-300 px-1.5 rounded-md">
                      {formatDateBr(t.date)}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{t.category}</span>
                    {t.installment_total && t.installment_total > 1 && (
                      <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-1.5 rounded-md">
                        {t.installment_current}/{t.installment_total}
                      </span>
                    )}
                  </div>
                </div>

                {/* Valor e Ações */}
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="font-bold text-red-500 whitespace-nowrap text-sm md:text-base">
                    - {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  
                  {/* Container de Botões */}
                  <div className="flex items-center gap-1 z-50 relative isolate" onClick={(e) => e.stopPropagation()}>
                    <button 
                      type="button"
                      onClick={(e) => handleDuplicate(t, e)}
                      className="p-2 text-gray-300 hover:text-stone-500 hover:bg-stone-100 rounded-full transition-all cursor-pointer"
                      title="Duplicar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditTransaction(t);
                      }}
                      className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all cursor-pointer"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4 pointer-events-none" />
                    </button>
                    
                    <button 
                      type="button"
                      onClick={(e) => handleDeleteTransaction(t.id, e)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 pointer-events-none" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL TRANSAÇÃO (CRIAR/EDITAR) */}
      {card && (
        <CreditTransactionModal 
          isOpen={isTransactionDialogOpen}
          onClose={() => setIsTransactionDialogOpen(false)}
          onSuccess={() => {
            fetchTransactions();
            setIsTransactionDialogOpen(false);
          }}
          card={card}
          transactionToEdit={transactionToEdit}
        />
      )}

      {/* MODAL EDITAR CARTÃO */}
      {isCardFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative">
            <button 
              onClick={() => setIsCardFormOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-stone-100 rounded-full transition-colors text-cappuccino"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-coffee mb-6">
              Editar Cartão
            </h2>
            <CardForm 
              onSuccess={() => {
                fetchCardDetails();
                setIsCardFormOpen(false);
              }}
              cardToEdit={card}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Excluir Lançamento?"
        message="Deseja realmente excluir este lançamento? O valor será removido da fatura."
        onConfirm={confirmDeleteTransaction}
        onCancel={() => setDeleteConfirm({ isOpen: false, transactionId: null })}
      />
    </div>
  );
}
