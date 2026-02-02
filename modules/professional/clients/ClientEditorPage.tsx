
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, User, MapPin, Globe, Upload, Image as ImageIcon, Layout } from 'lucide-react';
import { useCreateClient, useUpdateClient, useClients } from '../hooks/useClients';
import { AgencyStatus } from '../types/agency.types';
import ClientCredentialsVault from './components/ClientCredentialsVault';
import ClientFilesManager from './components/ClientFilesManager';
import ClientContractedServices from './components/ClientContractedServices';
import ClientTaskBoard from './components/ClientTaskBoard';
import ClientNotesLog from './components/ClientNotesLog';

const InputGroup = ({ label, name, value, onChange, type = "text", icon }: any) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">{label}</label>
    <div className="relative group">
      <input 
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full bg-[#37352F] border border-[#404040] rounded-md px-4 py-3 pl-10 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none transition-all placeholder-[#5c5c5c]"
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] group-focus-within:text-[#E09B6B] transition-colors">
        {icon}
      </div>
    </div>
  </div>
);

export default function ClientEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutate: createClient, isPending: isCreating } = useCreateClient();
  const { mutate: updateClient, isPending: isUpdating } = useUpdateClient();
  const { data: clients } = useClients();
  
  const isEditing = !!id;
  const isLoading = isCreating || isUpdating;

  // --- STATE DO FORM ---
  const [formData, setFormData] = useState({
    name: '', company_name: '', email: '', phone: '', cpf_cnpj: '',
    address: '', instagram: '', website: '', drive_folder_url: '', notes: '',
    status: 'active' as AgencyStatus, logo_url: ''
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // --- STATE DAS ABAS ---
  const [activeTab, setActiveTab] = useState<'workspace' | 'data'>('workspace');

  useEffect(() => {
    if (isEditing && clients) {
      const client = clients.find(c => c.id === id);
      if (client) {
        setFormData({
          name: client.name || '',
          company_name: client.company_name || '',
          email: client.email || '',
          phone: client.phone || '',
          cpf_cnpj: client.cpf_cnpj || '',
          address: client.address || '',
          instagram: client.instagram || '',
          website: client.website || '',
          drive_folder_url: client.drive_folder_url || '',
          notes: client.notes || '',
          status: client.status || 'active',
          logo_url: client.logo_url || ''
        });
        if (client.logo_url) setPreviewUrl(client.logo_url);
        if (!id) setActiveTab('data');
      }
    } else if (!isEditing) {
        setActiveTab('data');
    }
  }, [id, clients, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mutationData = { data: formData, logoFile: logoFile };
    const onSuccess = () => navigate('/professional/crm');
    if (isEditing && id) updateClient({ id, ...mutationData }, { onSuccess });
    else createClient(mutationData, { onSuccess });
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-fade-in px-4 md:px-0">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6 pt-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-[#2C2C2C] text-[#737373] hover:text-[#D4D4D4] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#FFFFFF] tracking-tight">{isEditing ? formData.name || 'Cliente' : 'Novo Cliente'}</h1>
          <p className="text-[#9ca3af] text-xs font-mono">{formData.company_name || 'Cadastro'}</p>
        </div>
      </div>

      {/* --- MENU DE ABAS --- */}
      <div className="flex gap-1 border-b border-[#404040] mb-8">
        <button 
            onClick={() => setActiveTab('workspace')}
            disabled={!isEditing}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'workspace' 
                ? 'border-[#E09B6B] text-[#E09B6B]' 
                : 'border-transparent text-[#737373] hover:text-[#D4D4D4] disabled:opacity-30'
            }`}
        >
            <Layout size={14} /> Workspace
        </button>
        <button 
            onClick={() => setActiveTab('data')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'data' 
                ? 'border-[#E09B6B] text-[#E09B6B]' 
                : 'border-transparent text-[#737373] hover:text-[#D4D4D4]'
            }`}
        >
            <User size={14} /> Dados Cadastrais
        </button>
      </div>

      {/* --- CONTEÚDO --- */}
      
      {/* ABA 1: WORKSPACE (NOVO LAYOUT) */}
      {activeTab === 'workspace' && id && (
        <div className="space-y-6 animate-fade-in">
            
            {/* ROW 1: TAREFAS (Full Width) */}
            <div className="w-full">
                <ClientTaskBoard clientId={id} />
            </div>

            {/* ROW 2: GRID DE 3 COLUNAS PARA UTILITÁRIOS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Coluna 1: Notas (Altura total para preencher) */}
                <div className="h-full min-h-[400px]">
                    <ClientNotesLog clientId={id} />
                </div>

                {/* Coluna 2: Ativos (Arquivos + Senhas) */}
                <div className="space-y-6">
                    <ClientFilesManager clientId={id} />
                    <ClientCredentialsVault clientId={id} />
                </div>

                {/* Coluna 3: Serviços Contratados */}
                <div>
                    <ClientContractedServices clientId={id} />
                </div>
            </div>
        </div>
      )}

      {/* ABA 2: DADOS CADASTRAIS (Formulário Original) */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Logo Upload */}
                    <div className="bg-[#2C2C2C] p-6 rounded-lg border border-[#404040] shadow-sm flex flex-col items-center justify-center">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" className="hidden" />
                        <div onClick={() => fileInputRef.current?.click()} className={`relative w-64 h-40 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden group ${previewUrl ? 'border-[#E09B6B]/50 bg-black/20' : 'border-[#404040] hover:border-[#E09B6B] hover:bg-[#37352F]'}`}>
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                        <Upload size={24} className="mb-1" />
                                        <span className="text-[10px] font-bold uppercase">Alterar Logo</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center text-[#737373] group-hover:text-[#E09B6B] transition-colors">
                                    <ImageIcon size={32} className="mb-2 opacity-50" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Logo da Empresa</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Identidade */}
                    <div className="bg-[#2C2C2C] p-6 rounded-lg border border-[#404040] shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#E09B6B] mb-6 flex items-center gap-2">
                            <User size={14} /> Identidade
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputGroup label="Nome Completo *" name="name" value={formData.name} onChange={handleChange} icon={<User size={16}/>} />
                            <InputGroup label="Empresa" name="company_name" value={formData.company_name} onChange={handleChange} icon={<Globe size={16}/>} />
                            <InputGroup label="CPF / CNPJ" name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} icon={<User size={16}/>} />
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Status</label>
                                <div className="relative">
                                    <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-[#37352F] border border-[#404040] rounded-md px-4 py-3 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none appearance-none cursor-pointer">
                                        <option value="active">Ativo (Cliente)</option>
                                        <option value="lead">Lead (Negociação)</option>
                                        <option value="churned">Churned (Ex-Cliente)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contato */}
                    <div className="bg-[#2C2C2C] p-6 rounded-lg border border-[#404040] shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#E09B6B] mb-6 flex items-center gap-2">
                            <Globe size={14} /> Contato Digital
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputGroup label="Email Principal" name="email" type="email" value={formData.email} onChange={handleChange} icon={<Globe size={16}/>} />
                            <InputGroup label="WhatsApp / Celular" name="phone" value={formData.phone} onChange={handleChange} icon={<Globe size={16}/>} />
                            <InputGroup label="Instagram" name="instagram" value={formData.instagram} onChange={handleChange} icon={<Globe size={16}/>} />
                            <InputGroup label="Website" name="website" value={formData.website} onChange={handleChange} icon={<Globe size={16}/>} />
                        </div>
                    </div>

                    {/* Operacional */}
                    <div className="bg-[#2C2C2C] p-6 rounded-lg border border-[#404040] shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#E09B6B] mb-6 flex items-center gap-2">
                            <MapPin size={14} /> Operacional
                        </h3>
                        <div className="space-y-5">
                            <InputGroup label="Pasta do Drive (Link)" name="drive_folder_url" value={formData.drive_folder_url} onChange={handleChange} icon={<Globe size={16}/>} />
                            <InputGroup label="Endereço Completo" name="address" value={formData.address} onChange={handleChange} icon={<MapPin size={16}/>} />
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Notas Internas</label>
                                <textarea name="notes" rows={4} value={formData.notes || ''} onChange={handleChange} className="w-full bg-[#37352F] border border-[#404040] rounded-md px-4 py-3 text-sm text-[#D4D4D4] placeholder-[#5c5c5c] focus:border-[#E09B6B] outline-none transition-all resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-md text-xs font-bold uppercase tracking-widest text-[#9ca3af] hover:bg-[#37352F] transition-colors">Cancelar</button>
                        <button type="submit" disabled={isLoading} className="bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFFFF] px-8 py-3 rounded-md text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm border border-[#5D4037] transition-all disabled:opacity-50 active:scale-95">
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Salvar Dados
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
