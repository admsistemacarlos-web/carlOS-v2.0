
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useCards, useTransactions } from '../hooks/useFinanceData';
import CardForm from '../components/forms/CardForm';
import { CreditCard } from '../types/finance.types';
import { CreditCard as CardIcon, Plus, X, ArrowLeft, Pencil } from 'lucide-react';

const CardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { cards, loading, refresh } = useCards();
  const { transactions } = useTransactions(); // Para calcular fatura parcial
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const handleOpenForm = (card?: CreditCard) => {
    setEditingCard(card || null);
    setIsFormOpen(true);
  };

  // Helper para calcular gasto atual (fatura aberta simplificada)
  const getCardSpend = (cardId: string) => {
    // Pega todas as despesas não fechadas (is_locked = false) deste cartão
    return transactions
      .filter(t => t.credit_card_id === cardId && !t.is_locked && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tighter">Cartões de Crédito</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Gestão de Limites</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="bg-primary hover:bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          <Plus size={14} /> Novo Cartão
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2].map(i => <div key={i} className="h-56 bg-secondary rounded-3xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => {
            const currentSpend = getCardSpend(card.id);
            const available = card.limit_amount - currentSpend;
            const progress = Math.min((currentSpend / card.limit_amount) * 100, 100);

            return (
              <div 
                key={card.id} 
                onClick={() => navigate(`/personal/finance/cards/${card.id}`)}
                className="group relative h-64 bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[2rem] p-8 shadow-xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform border border-white/5"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-card/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col justify-between h-full text-white">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Cartão</span>
                      <h3 className="text-xl font-bold tracking-tight">{card.name}</h3>
                    </div>
                    <CardIcon size={24} className="text-white/80" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Fatura Atual</p>
                        <p className="text-2xl font-bold tracking-tight">R$ {currentSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Disponível</p>
                        <p className="text-sm font-medium text-white/80">R$ {available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-card/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${progress > 80 ? 'bg-terracotta' : 'bg-primary'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-white/30">
                      <span>Fecha dia {card.closing_day}</span>
                      <span>Vence dia {card.due_day}</span>
                    </div>
                  </div>
                </div>

                {/* Botão de Editar (hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenForm(card);
                  }}
                  className="absolute top-4 right-4 p-2 bg-card/10 hover:bg-card/20 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"
                  title="Editar Cartão"
                >
                  <Pencil size={16} className="text-white" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Overlay Modal para o Form */}
      {isFormOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-foreground mb-6">
              {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
            </h2>
            <CardForm 
              onSuccess={() => { setIsFormOpen(false); refresh(); }}
              cardToEdit={editingCard}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CardsPage;
