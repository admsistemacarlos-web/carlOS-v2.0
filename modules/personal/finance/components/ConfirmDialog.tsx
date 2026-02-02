import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden transform transition-all">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-6 text-terracotta">
            <AlertTriangle size={32} />
          </div>
          
          <h3 className="text-xl font-semibold text-coffee tracking-tight mb-2">
            {title}
          </h3>
          
          <p className="text-cappuccino text-sm leading-relaxed mb-8 px-4">
            {message}
          </p>
          
          <div className="flex gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 px-4 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-cappuccino hover:bg-stone-50 transition-colors border border-stone-200"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 bg-terracotta text-white px-4 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:bg-red-700"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;