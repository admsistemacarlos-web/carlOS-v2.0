
import React, { useState } from 'react';
import { FileText, Save, Pin, Trash2, Loader2 } from 'lucide-react';
import { useClientNotes, useNoteOperations } from '../../hooks/useClientWorkspace';
import { formatDateBr } from '../../../personal/finance/utils/dateHelpers';

export default function ClientNotesLog({ clientId }: { clientId: string }) {
  const { data: notes, isLoading } = useClientNotes(clientId);
  const { createNote, deleteNote } = useNoteOperations();
  const [newNote, setNewNote] = useState('');

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newNote.trim()) return;
    createNote.mutate({ client_id: clientId, content: newNote, is_pinned: false });
    setNewNote('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSave();
    }
  };

  return (
    <div className="bg-[#202020] p-6 rounded-lg border border-[#404040] shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#E09B6B] flex items-center gap-2">
          <FileText size={14} /> Notas & Obs
        </h3>
      </div>

      {/* Editor Rápido */}
      <div className="relative mb-6 shrink-0">
        <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma observação rápida... (Ctrl+Enter para salvar)"
            className="w-full h-24 bg-[#1A1A1A] border border-[#404040] rounded-md p-3 text-sm text-[#D4D4D4] placeholder-[#5c5c5c] outline-none focus:border-[#E09B6B] resize-none"
        />
        <button 
            onClick={() => handleSave()}
            disabled={!newNote.trim()}
            className="absolute bottom-3 right-3 p-1.5 bg-[#5D4037] hover:bg-[#4E342E] text-white rounded-md transition-all disabled:opacity-0 shadow-lg border border-[#5D4037]"
        >
            <Save size={14} />
        </button>
      </div>

      {/* Lista de Notas (Stream) */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px] custom-scrollbar">
        {isLoading ? (
            <div className="flex justify-center"><Loader2 className="animate-spin text-[#737373]" size={20} /></div>
        ) : notes?.length === 0 ? (
            <p className="text-center text-[#5c5c5c] text-xs italic">Nenhuma nota registrada.</p>
        ) : (
            notes?.map(note => (
                <div key={note.id} className="group relative bg-[#2C2C2C] p-3 rounded-md border border-[#404040] hover:border-[#737373] transition-all">
                    <p className="text-xs text-[#D4D4D4] whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    <div className="mt-2 flex justify-between items-center border-t border-[#404040] pt-2">
                        <span className="text-[9px] text-[#737373] font-mono">
                            {formatDateBr(note.created_at)}
                        </span>
                        <button 
                            onClick={() => deleteNote.mutate(note.id)}
                            className="text-[#737373] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
