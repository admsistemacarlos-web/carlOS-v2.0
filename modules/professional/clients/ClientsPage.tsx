import React, { useState } from 'react';
import { 
  Plus, Search, MessageCircle, Instagram,
  Folder, Edit, Users, Building2, MapPin, Trash2, X, AlertTriangle, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClients, useDeleteClient } from '../hooks/useClients'; // Adicionado useDeleteClient
import { AgencyStatus } from '../types/agency.types';

// --- COMPONENTES AUXILIARES ---

const StatusBadge: React.FC<{ status: AgencyStatus }> = ({ status }) => {
  const styles: Record<string, string> = {
    active: 'bg-primary/20 text-[#60a887] border-[#20523e]', // Muted Emerald
    lead: 'bg-[#3d2d14]/20 text-[#a88760] border-[#523e20]',   // Muted Amber
    churned: 'bg-[#2C2C2C] text-[#737373] border-[#404040]',
    archived: 'bg-[#191919] text-[#5c5c5c] border-[#2C2C2C]'
  };

  const labels: Record<string, string> = {
    active: 'Ativo',
    lead: 'Lead',
    churned: 'Churned',
    archived: 'Arquivado'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.lead}`}>
      {labels[status] || status}
    </span>
  );
};

// --- PÁGINA PRINCIPAL ---

export default function ClientsPage() {
  const navigate = useNavigate();
  const { data: clients, isLoading } = useClients();
  const deleteClient = useDeleteClient(); // Hook de deleção
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para controlar o Modal de Exclusão
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const handleNewClient = () => navigate('new');

  // Abre o modal ao invés do window.confirm
  const handleRequestDelete = (id: string) => {
    setClientToDelete(id);
  };

  // Executa a exclusão de fato
  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      try {
        await deleteClient.mutateAsync(clientToDelete);
        setClientToDelete(null); // Fecha o modal
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir cliente."); // Fallback simples para erro de API
      }
    }
  };

  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Skeleton Loading
  if (isLoading) {
    return (
      <div className="w-full min-h-screen p-6 animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-48 bg-[#2C2C2C] rounded-lg"></div>
          <div className="h-10 w-32 bg-[#2C2C2C] rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-[#2C2C2C] rounded-lg border border-[#404040]"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen animate-fade-in pb-20 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#FFFFFF] tracking-tight">Carteira de Clientes</h1>
          <p className="text-[#9ca3af] text-sm mt-1">Gerencie relacionamentos e dados comerciais.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={16} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-[#2C2C2C] border border-[#404040] rounded-md pl-9 pr-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#737373] outline-none focus:border-[#E09B6B] transition-colors"
            />
          </div>
          <button 
            onClick={handleNewClient}
            className="bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFFFF] px-4 py-2.5 rounded-md flex items-center gap-2 text-sm font-medium border border-[#5D4037] active:scale-95 transition-all whitespace-nowrap"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* EMPTY STATE */}
      {(!clients || clients.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#202020] border border-dashed border-[#404040] rounded-lg">
          <div className="w-12 h-12 bg-[#2C2C2C] rounded-full flex items-center justify-center mb-4 text-[#737373]">
            <Users size={24} />
          </div>
          <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">Sua carteira está vazia</h3>
          <p className="text-[#9ca3af] text-sm mb-6 max-w-xs text-center">
            Cadastre seu primeiro cliente para começar a gerenciar projetos.
          </p>
          <button 
            onClick={handleNewClient}
            className="text-[#E09B6B] font-bold text-xs uppercase tracking-widest hover:underline"
          >
            + Cadastrar Cliente
          </button>
        </div>
      ) : (
        /* CLIENTS LIST */
        <div className="space-y-4">
          {filteredClients?.map((client) => (
            <div 
              key={client.id}
              onClick={() => navigate(`${client.id}`)}
              className="group bg-[#2C2C2C] rounded-lg border border-[#404040] hover:border-[#737373] transition-all flex flex-col sm:flex-row overflow-hidden cursor-pointer"
            >
              {/* --- ESQUERDA: LOGO (1/4 Width) --- */}
              <div className="relative w-full sm:w-48 bg-[#202020] border-b sm:border-b-0 sm:border-r border-[#404040] flex items-center justify-center shrink-0 h-40 sm:h-auto">
                {client.logo_url ? (
                  <img 
                    src={client.logo_url} 
                    alt={client.name}
                    className="w-full h-full object-cover absolute inset-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      e.currentTarget.nextElementSibling?.classList.add('flex');
                    }}
                  />
                ) : null}
                
                {/* Fallback Display */}
                <div className={`w-full h-full flex items-center justify-center text-[#404040] font-black text-4xl group-hover:text-[#525252] transition-colors ${client.logo_url ? 'hidden' : 'flex'}`}>
                    {client.company_name 
                      ? client.company_name.substring(0, 2).toUpperCase() 
                      : client.name.substring(0, 2).toUpperCase()}
                </div>
              </div>

              {/* --- DIREITA: CONTEÚDO --- */}
              <div className="flex-1 flex flex-col p-5 min-w-0 justify-between">
                
                <div className="space-y-3">
                  <div className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-[#E5E5E5] group-hover:text-[#E09B6B] transition-colors truncate">
                          {client.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-[#9ca3af] mt-1 font-mono">
                          <Building2 size={12} className="shrink-0" />
                          <span className="truncate">{client.company_name || 'Cliente Particular'}</span>
                      </div>
                    </div>
                    <div className="self-start">
                      <StatusBadge status={client.status} />
                    </div>
                  </div>

                  {client.address && (
                    <div className="flex items-start gap-2 text-xs text-[#737373] max-w-lg">
                      <MapPin size={10} className="shrink-0 mt-0.5" /> 
                      <span className="line-clamp-1">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Footer: Ações */}
                <div className="mt-5 pt-3 border-t border-[#404040] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        {client.phone && (
                            <a 
                                href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded bg-[#37352F] text-[#9ca3af] hover:text-[#E09B6B] transition-all"
                                title="WhatsApp"
                            >
                                <MessageCircle size={16} />
                            </a>
                        )}

                        {client.instagram && (
                            <a 
                                href={client.instagram.startsWith('http') ? client.instagram : `https://instagram.com/${client.instagram.replace('@', '')}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded bg-[#37352F] text-[#9ca3af] hover:text-[#E09B6B] transition-all"
                                title="Instagram"
                            >
                                <Instagram size={16} />
                            </a>
                        )}
                        
                        {client.drive_folder_url ? (
                            <a 
                                href={client.drive_folder_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded bg-[#37352F] text-[#9ca3af] hover:text-[#E09B6B] transition-all"
                                title="Drive"
                            >
                                <Folder size={16} />
                            </a>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`${client.id}`); }}
                            className="p-1.5 text-[#9ca3af] hover:text-[#E09B6B] transition-colors"
                            title="Editar"
                        >
                            <Edit size={16} />
                        </button>

                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRequestDelete(client.id); }}
                            className="p-1.5 text-[#9ca3af] hover:text-red-400 transition-colors"
                            title="Excluir"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL DE CONFIRMAÇÃO (CUSTOMIZADO) --- */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md bg-[#1e1e1e] border border-[#404040] rounded-xl shadow-2xl p-6 transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-full shrink-0">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Excluir Cliente?</h3>
                <p className="text-[#9ca3af] text-sm leading-relaxed">
                  Esta ação não pode ser desfeita. Todos os dados associados a este cliente serão removidos permanentemente.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-[#D4D4D4] hover:text-white hover:bg-[#2C2C2C] rounded-lg transition-colors"
                disabled={deleteClient.isPending}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmDelete}
                disabled={deleteClient.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-900/20 transition-all flex items-center gap-2"
              >
                {deleteClient.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Excluindo...
                  </>
                ) : (
                  'Sim, Excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}