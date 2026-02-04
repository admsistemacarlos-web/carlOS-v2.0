import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '../hooks/useFinanceData';
import { Plus, Landmark, MoreHorizontal, Pencil, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import AccountForm from '../components/forms/AccountForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { Account } from '../types/finance.types';
import EditAccountModal from '../components/modals/EditAccountModal';

const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const { accounts, loading, deleteAccount, refresh } = useAccounts();
  
  // Controle do "Modal" local
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingAccountForModal, setEditingAccountForModal] = useState<Account | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Controle do Modal de Confirmação
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    accountId: string | null;
  }>({ isOpen: false, accountId: null });

  const handleOpenForm = (acc?: Account) => {
    setEditingAccount(acc || null);
    setIsFormOpen(true);
    setActiveMenuId(null);
  };

  const handleDeleteClick = (id: string) => {
    setActiveMenuId(null);
    setDeleteConfirm({ isOpen: true, accountId: id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirm.accountId;
    if (!id) return;

    // Fecha modal imediatamente
    setDeleteConfirm({ isOpen: false, accountId: null });

    try {
      await deleteAccount(id);
    } catch (error) {
      alert("Erro ao excluir conta.");
      refresh(); // Recarrega em caso de erro para garantir consistência
    }
  };

  const handleAccountClick = (id: string) => {
    navigate(`/personal/finance/transactions?accountId=${id}`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20" onClick={() => setActiveMenuId(null)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors text-cappuccino"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-coffee tracking-tighter">Minhas Contas</h1>
            <p className="text-cappuccino text-xs font-bold uppercase tracking-widest mt-1">Patrimônio Líquido</p>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); handleOpenForm(); }}
          className="bg-olive hover:bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          <Plus size={14} /> Nova Conta
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-stone-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div 
              key={acc.id} 
              onClick={() => handleAccountClick(acc.id)}
              className="group bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm relative hover:shadow-lg hover:border-olive/30 transition-all cursor-pointer overflow-hidden"
            >
              {/* Efeito de hover decorativo */}
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={20} className="text-stone-300" />
              </div>

              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-cream rounded-2xl text-olive group-hover:bg-olive group-hover:text-white transition-colors">
                  <Landmark size={24} />
                </div>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === acc.id ? null : acc.id); }}
                    className="p-2 hover:bg-stone-50 rounded-full text-stone-300 hover:text-coffee transition-colors"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  
                  {activeMenuId === acc.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-stone-100 z-10 overflow-hidden animate-fade-in">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingAccountForModal(acc); }} 
                        className="w-full text-left px-4 py-3 text-xs font-bold text-coffee hover:bg-stone-50 flex items-center gap-2"
                      >
                        <Pencil size={12} /> Editar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(acc.id); }} 
                        className="w-full text-left px-4 py-3 text-xs font-bold text-terracotta hover:bg-terracotta/5 flex items-center gap-2"
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-[10px] font-bold uppercase tracking-widest text-cappuccino mb-1">
                {acc.type === 'checking' ? 'Corrente' : acc.type === 'investment' ? 'Investimento' : 'Espécie'}
              </p>
              <h3 className="text-xl font-semibold text-coffee mb-6">{acc.name}</h3>
              
              <div className="pt-6 border-t border-stone-50">
                <p className="text-[10px] text-cappuccino font-medium uppercase tracking-widest mb-1">Saldo Atual</p>
                <p className="text-2xl font-medium text-coffee tracking-tighter">
                  R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overlay Modal para o Form */}
      {isFormOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-coffee mb-6">
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </h2>
            <AccountForm 
              onSuccess={() => { setIsFormOpen(false); refresh(); }}
              onCancel={() => setIsFormOpen(false)}
              accountToEdit={editingAccount}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Dialogo de Confirmação */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Excluir Conta?"
        message="Tem certeza que deseja excluir esta conta? Todas as transações vinculadas a ela também serão removidas permanentemente."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, accountId: null })}
      />

      {/* Modal de Edição */}
      {editingAccountForModal && (
        <EditAccountModal
          isOpen={true}
          onClose={() => setEditingAccountForModal(null)}
          account={editingAccountForModal}
          onSuccess={() => {
            refresh();
            setEditingAccountForModal(null);
          }}
        />
      )}

      {/* Botão Flutuante */}
      <button
        onClick={() => navigate('/personal/finance/transactions/new')}
        className="fixed bottom-8 right-8 bg-coffee hover:bg-black text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-95 transition-all animate-bounce-slow"
        title="Nova Movimentação"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default AccountsPage;