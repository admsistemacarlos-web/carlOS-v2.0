
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Dog } from 'lucide-react';

interface PetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

// 1. Pega data YYYY-MM-DD local estrita
const getTodayString = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export const PetFormModal: React.FC<PetFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', breed: '', birth_date: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setIsSubmitting(true);
    try {
      // Envia os dados como estão (strings)
      await onSave(formData);
      onClose();
      setFormData({ name: '', breed: '', birth_date: '' });
    } catch (error) {
      alert('Erro ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-stone-400 hover:text-stone-600">
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-stone-100 rounded-full text-stone-500">
            <Dog size={24} />
          </div>
          <h2 className="text-xl font-bold text-stone-800">Novo Pet</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Nome</label>
            <input 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-700 outline-none focus:ring-2 focus:ring-stone-200"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Raça</label>
            <input 
              value={formData.breed}
              onChange={e => setFormData({...formData, breed: e.target.value})}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-700 outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Data de Nascimento</label>
            <input 
              type="date"
              value={formData.birth_date}
              onChange={e => setFormData({...formData, birth_date: e.target.value})}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-700 outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#3C3633] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black transition-all mt-4"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            Salvar Pet
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
