
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { Exercise } from '../types';

interface WorkoutTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, items: { exerciseId: string }[]) => Promise<any>;
  exercises: Exercise[];
}

export const WorkoutTemplateForm: React.FC<WorkoutTemplateFormProps> = ({
  isOpen,
  onClose,
  onSave,
  exercises
}) => {
  const [name, setName] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ tempId: string, exerciseId: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para o select de adicionar exercício
  const [currentExerciseId, setCurrentExerciseId] = useState('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!currentExerciseId) return;
    setSelectedItems(prev => [...prev, { tempId: crypto.randomUUID(), exerciseId: currentExerciseId }]);
    setCurrentExerciseId('');
  };

  const handleRemoveItem = (tempId: string) => {
    setSelectedItems(prev => prev.filter(i => i.tempId !== tempId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || selectedItems.length === 0) return alert("Preencha o nome e adicione exercícios.");
    
    setIsSubmitting(true);
    try {
        await onSave(name, selectedItems);
        onClose();
        // Reset
        setName('');
        setSelectedItems([]);
    } catch (err) {
        alert("Erro ao salvar.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const getExerciseName = (id: string) => exercises.find(e => e.id === id)?.name || 'Desconhecido';

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-stone-800">Novo Modelo de Treino</h2>
            <button onClick={onClose} className="p-2 bg-stone-100 rounded-full text-stone-400 hover:text-stone-600">
                <X size={20} />
            </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div>
                <label className="text-xs font-bold uppercase text-stone-400 tracking-widest ml-1">Nome do Modelo</label>
                <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Treino A - Superiores"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800 outline-none focus:border-[#143d2d] transition-colors"
                    autoFocus
                />
            </div>

            <div>
                <label className="text-xs font-bold uppercase text-stone-400 tracking-widest ml-1 mb-2 block">Exercícios da Rotina</label>
                
                {/* Lista de Selecionados */}
                <div className="space-y-2 mb-4">
                    {selectedItems.map((item, index) => (
                        <div key={item.tempId} className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100 group">
                            <span className="text-xs font-bold text-stone-300 w-4">{index + 1}</span>
                            <span className="flex-1 text-sm font-semibold text-stone-700">{getExerciseName(item.exerciseId)}</span>
                            <button onClick={() => handleRemoveItem(item.tempId)} className="text-stone-300 hover:text-red-500">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {selectedItems.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 text-xs italic">
                            Adicione exercícios abaixo para montar a rotina.
                        </div>
                    )}
                </div>

                {/* Adicionar Novo */}
                <div className="flex gap-2">
                    <select 
                        value={currentExerciseId}
                        onChange={e => setCurrentExerciseId(e.target.value)}
                        className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 outline-none focus:border-[#143d2d]"
                    >
                        <option value="">Selecione um exercício...</option>
                        {exercises.map(ex => (
                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleAddItem}
                        disabled={!currentExerciseId}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-600 p-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
        </div>

        <div className="pt-6 mt-2 border-t border-stone-100">
            <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-[#143d2d] hover:bg-[#0f2e22] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isSubmitting ? 'Salvando...' : 'Salvar Modelo'} <Save size={18} />
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
