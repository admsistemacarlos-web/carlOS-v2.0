
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
    <div className="bg-card p-6 rounded-lg border border-secondary shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
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
            className="w-full h-24 bg-background border border-secondary rounded-md p-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary resize-none"
        />
        <button 
            onClick={() => handleSave()}
            disabled={!newNote.trim()}
            className="absolute bottom-3 right-3 p-1.5 bg-[hsl(var(--spiritual))] hover:bg-[hsl(var(--spiritual-dark))] text-white rounded-md transition-all disabled:opacity-0 shadow-lg border border-[hsl(var(--spiritual))]"
        >
            <Save size={14} />
        </button>
      </div>

      {/* Lista de Notas (Stream) */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px] custom-scrollbar">
        {isLoading ? (
            <div className="flex justify-center"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
        ) : notes?.length === 0 ? (
            <p className="text-center text-muted-foreground text-xs italic">Nenhuma nota registrada.</p>
        ) : (
            notes?.map(note => (
                <div key={note.id} className="group relative bg-secondary p-3 rounded-md border border-secondary hover:border-muted-foreground transition-all">
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    <div className="mt-2 flex justify-between items-center border-t border-secondary pt-2">
                        <span className="text-[9px] text-muted-foreground font-mono">
                            {formatDateBr(note.created_at)}
                        </span>
                        <button 
                            onClick={() => deleteNote.mutate(note.id)}
                            className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
