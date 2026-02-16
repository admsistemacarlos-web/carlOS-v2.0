import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Save, User, Building2, Phone, Tag } from 'lucide-react';
import { AgencyClient, AgencyStatus } from '../../types/agency.types';
import { useCreateClient, useUpdateClient } from '../../hooks/useClients';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: AgencyClient | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, clientToEdit }) => {
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    phone: '',
    status: 'lead' as AgencyStatus
  });

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setFormData({
          name: clientToEdit.name,
          company_name: clientToEdit.company_name || '',
          phone: clientToEdit.phone || '',
          status: clientToEdit.status
        });
      } else {
        // Reset form for new client
        setFormData({
          name: '',
          company_name: '',
          phone: '',
          status: 'lead'
        });
      }
    }
  }, [isOpen, clientToEdit]);

  if (!isOpen) return null;

  const isSubmitting = createClient.isPending || updateClient.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (clientToEdit) {
        await updateClient.mutateAsync({ 
          id: clientToEdit.id, 
          data: formData 
        });
      } else {
        await createClient.mutateAsync({ data: formData });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save client:", error);
      alert("Erro ao salvar cliente. Tente novamente.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Content - Notion Dark */}
      <div className="relative bg-[#2C2C2C] w-full max-w-md rounded-lg shadow-2xl border border-[#404040] flex flex-col overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#404040]">
          <h2 className="text-lg font-bold text-[#FFFFFF] tracking-tight">
            {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#37352F] rounded-md text-[#9ca3af] hover:text-[#FFFFFF] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Nome */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">
              <User size={12} /> Nome Completo <span className="text-red-400">*</span>
            </label>
            <input 
              required
              autoFocus={!clientToEdit}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: João Silva"
              className="w-full bg-[#37352F] border border-[#404040] rounded-md p-3 text-sm text-[#D4D4D4] placeholder-[#737373] outline-none focus:border-[#E09B6B] transition-all"
            />
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">
              <Building2 size={12} /> Empresa
            </label>
            <input 
              value={formData.company_name}
              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
              placeholder="Ex: Tech Solutions Ltda"
              className="w-full bg-[#37352F] border border-[#404040] rounded-md p-3 text-sm text-[#D4D4D4] placeholder-[#737373] outline-none focus:border-[#E09B6B] transition-all"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">
              <Phone size={12} /> Telefone / WhatsApp
            </label>
            <input 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="(11) 99999-9999"
              className="w-full bg-[#37352F] border border-[#404040] rounded-md p-3 text-sm text-[#D4D4D4] placeholder-[#737373] outline-none focus:border-[#E09B6B] transition-all"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">
              <Tag size={12} /> Status Inicial
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, status: 'lead'})}
                className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  formData.status === 'lead' 
                    ? 'bg-[#3d2d14]/40 border-[#523e20] text-[#E09B6B]' // Muted Amber
                    : 'bg-[#37352F] border-[#404040] text-[#737373] hover:text-[#D4D4D4]'
                }`}
              >
                Lead
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, status: 'active'})}
                className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  formData.status === 'active' 
                    ? 'bg-primary/40 border-[#20523e] text-[#60a887]' // Muted Emerald
                    : 'bg-[#37352F] border-[#404040] text-[#737373] hover:text-[#D4D4D4]'
                }`}
              >
                Ativo
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, status: 'churned'})}
                className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  formData.status === 'churned' 
                    ? 'bg-[#202020] border-[#404040] text-[#D4D4D4]' 
                    : 'bg-[#37352F] border-[#404040] text-[#737373] hover:text-[#D4D4D4]'
                }`}
              >
                Churned
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest text-[#9ca3af] hover:bg-[#37352F] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFFFF] py-2.5 rounded-md text-xs font-bold uppercase tracking-widest shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed border border-[#5D4037]"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};