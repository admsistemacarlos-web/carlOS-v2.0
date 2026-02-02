
import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Trash2, Plus, Copy, Check } from 'lucide-react';
import { useCredentials, useCreateCredential, useDeleteCredential } from '../../hooks/useCredentials';

export default function ClientCredentialsVault({ clientId }: { clientId: string }) {
  const { data: credentials } = useCredentials(clientId);
  const { mutate: addCredential } = useCreateCredential();
  const { mutate: deleteCredential } = useDeleteCredential();

  const [isAdding, setIsAdding] = useState(false);
  const [newCred, setNewCred] = useState({ platform: '', username: '', password_text: '' });
  
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const toggleVisibility = (id: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisiblePasswords(newSet);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCred.platform || !newCred.username || !newCred.password_text) return;
    
    addCredential({ ...newCred, client_id: clientId }, {
      onSuccess: () => {
        setIsAdding(false);
        setNewCred({ platform: '', username: '', password_text: '' });
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-[#202020] p-6 rounded-lg border border-[#404040] shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#E09B6B] flex items-center gap-2">
          <Shield size={14} /> Senhas
        </h3>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-[10px] font-bold text-[#737373] hover:text-[#D4D4D4] flex items-center gap-1 transition-colors bg-[#37352F] px-2 py-1 rounded border border-[#404040]"
          >
            <Plus size={10} /> Add
          </button>
        )}
      </div>

      {/* Formulário de Adição */}
      {isAdding && (
        <form onSubmit={handleAdd} className="bg-[#2C2C2C] p-3 rounded-md mb-4 border border-[#404040] animate-fade-in">
          <div className="space-y-2 mb-3">
            <input 
              placeholder="Plataforma (ex: Instagram)" 
              value={newCred.platform}
              onChange={e => setNewCred({...newCred, platform: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#404040] rounded-md px-2 py-1.5 text-xs text-[#D4D4D4] outline-none focus:border-[#E09B6B]"
            />
            <input 
              placeholder="Usuário" 
              value={newCred.username}
              onChange={e => setNewCred({...newCred, username: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#404040] rounded-md px-2 py-1.5 text-xs text-[#D4D4D4] outline-none focus:border-[#E09B6B]"
            />
            <input 
              placeholder="Senha" 
              value={newCred.password_text}
              onChange={e => setNewCred({...newCred, password_text: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#404040] rounded-md px-2 py-1.5 text-xs text-[#D4D4D4] outline-none focus:border-[#E09B6B]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="text-[10px] text-[#737373] px-2 py-1 hover:text-[#D4D4D4]">Cancelar</button>
            <button type="submit" className="bg-[#5D4037] hover:bg-[#4E342E] text-white text-[10px] font-bold px-3 py-1 rounded-md transition-colors border border-[#5D4037]">Salvar</button>
          </div>
        </form>
      )}

      {/* Lista de Credenciais */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {credentials?.map(cred => {
          const isVisible = visiblePasswords.has(cred.id);
          return (
            <div key={cred.id} className="group flex flex-col p-3 rounded-md bg-[#1A1A1A] border border-[#404040] hover:border-[#737373] transition-all gap-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-[#37352F] flex items-center justify-center text-[#E09B6B] shrink-0">
                  <Lock size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#E5E5E5] truncate">{cred.platform}</h4>
                  <p className="text-[10px] text-[#9ca3af] font-mono truncate">{cred.username}</p>
                </div>
                <button 
                  onClick={() => deleteCredential(cred.id)}
                  className="text-[#737373] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Excluir"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Campo de Senha */}
              <div className="bg-[#202020] px-2 py-1.5 rounded border border-[#404040] flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-[#D4D4D4] truncate">
                  {isVisible ? cred.password_text : '••••••••'}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleVisibility(cred.id)} className="text-[#737373] hover:text-[#D4D4D4]" title={isVisible ? "Esconder" : "Mostrar"}>
                    {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  {isVisible && (
                    <button onClick={() => copyToClipboard(cred.password_text)} className="text-[#737373] hover:text-[#E09B6B]" title="Copiar">
                      <Copy size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {(!credentials || credentials.length === 0) && !isAdding && (
          <div className="text-center py-4 text-[#5c5c5c] text-xs italic">
            Nenhuma credencial salva.
          </div>
        )}
      </div>
    </div>
  );
}
