
import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isDestructive = false,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
        onClick={!isLoading ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center border border-stone-100 animate-fade-in">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-stone-100 text-stone-500'}`}>
          <AlertTriangle size={32} />
        </div>
        
        <h3 className="text-xl font-bold text-stone-800 mb-2">
          {title}
        </h3>
        
        <p className="text-stone-500 text-sm leading-relaxed mb-8">
          {description}
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${isDestructive ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-stone-800 hover:bg-black'}`}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
