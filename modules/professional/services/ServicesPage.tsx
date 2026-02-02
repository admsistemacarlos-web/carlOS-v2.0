
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Edit, Trash2, 
  Layers, X, Loader2, Package, Save, Zap, Check, AlertCircle
} from 'lucide-react';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '../hooks/useServices';
import { AgencyServiceCatalog, ChargeType } from '../types/agency.types';
import { supabase } from '../../../integrations/supabase/client';

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const { data: services, isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<AgencyServiceCatalog | null>(null);
  
  // Seed State Machine
  const [seedStatus, setSeedStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // CORREÇÃO 1: State usando 'name'
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    default_price: 0,
    charge_type: 'unique' as ChargeType
  });

  const groupedServices = useMemo(() => {
    const groups: Record<string, AgencyServiceCatalog[]> = {};
    if (!services || !Array.isArray(services)) return groups;
    
    const filtered = services.filter(s => 
      // Cast para any para acessar 'name' caso a tipagem ainda esteja desatualizada
      ((s as any).name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.forEach(s => {
      const cat = s.category || 'Geral';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [services, searchTerm]);

  // CORREÇÃO 2: Preenchimento correto na edição
  const handleOpenModal = (service?: AgencyServiceCatalog) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: (service as any).name, // Usando 'name' do objeto vindo do banco
        category: service.category,
        description: service.description || '',
        default_price: service.default_price,
        charge_type: service.charge_type
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        category: '',
        description: '',
        default_price: 0,
        charge_type: 'unique'
      });
    }
    setIsModalOpen(true);
  };

  // CORREÇÃO 4: Submit Sanitizado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validação básica
    if (!formData.name || !formData.category) return;

    try {
      // Payload estrito para o Supabase (Sanitização)
      const payload = {
          name: formData.name, // Garante que enviamos 'name'
          category: formData.category,
          description: formData.description,
          default_price: Number(formData.default_price),
          charge_type: formData.charge_type
          // Não inclua 'title' ou 'active' aqui
      };

      if (editingService) {
        // Update (usando cast any no hook se necessário para bypassar tipagem antiga)
        await updateService.mutateAsync({ id: editingService.id, ...payload } as any);
      } else {
        // Create
        await createService.mutateAsync(payload as any);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao salvar: ${error.message || error}`);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteService.mutateAsync(id);
  };

  // --- SEED FUNCTIONALITY ---
  const handleSeed = async () => {
    if (seedStatus !== 'idle') return;
    
    setSeedStatus('loading');
    
    const servicesToSeed = [
      // Branding & Design
      { name: "Logotipo Principal", category: "Branding & Design", description: "Criação da logo principal e versões complementares", default_price: 400, charge_type: "unique" },
      { name: "Paleta + Tipografia", category: "Branding & Design", description: "Estudo e definição de cores oficiais e família tipográfica", default_price: 300, charge_type: "unique" },
      { name: "Mockups de Aplicação", category: "Branding & Design", description: "Simulação visual em camisas, cartões, fachadas, etc.", default_price: 200, charge_type: "unique" },
      { name: "PACOTE COMPLETO ID VISUAL", category: "Branding & Design", description: "Soma de todos os itens de identidade visual", default_price: 900, charge_type: "unique" },
      
      // Social Media
      { name: "Análise de Perfil", category: "Social Media", description: "Diagnóstico completo de bio, destaques e posicionamento", default_price: 250, charge_type: "unique" },
      { name: "Planejamento de Conteúdo", category: "Social Media", description: "Estrutura mensal de postagens e linha editorial", default_price: 300, charge_type: "unique" },
      { name: "Captação de Vídeo", category: "Social Media", description: "Filmagem presencial (Smartphone/Profissional)", default_price: 350, charge_type: "unique" },
      { name: "Edição de Reels", category: "Social Media", description: "Montagem, cortes dinâmicos e legendas (valor por vídeo)", default_price: 200, charge_type: "unique" },
      { name: "Design de Carrossel", category: "Social Media", description: "Criação de 1 carrossel completo (valor por unidade)", default_price: 150, charge_type: "unique" },
      { name: "Design de Capa (Thumb)", category: "Social Media", description: "Miniatura personalizada para Reels", default_price: 80, charge_type: "unique" },
      { name: "Roteiro de Vídeo", category: "Social Media", description: "Roteirização com foco em retenção (valor por roteiro)", default_price: 120, charge_type: "unique" },
      { name: "Copywriting", category: "Social Media", description: "Legenda estratégica + CTA (valor por post)", default_price: 90, charge_type: "unique" },
      { name: "Relatório Mensal", category: "Social Media", description: "Análise de métricas e desempenho do mês", default_price: 200, charge_type: "unique" },

      // Tráfego Pago & Performance
      { name: "Setup de Implementação", category: "Tráfego Pago", description: "Configuração técnica total: Google Ads + Analytics + Pixel + BM + Verificação de Domínio", default_price: 900, charge_type: "unique" },
      { name: "Landing Page", category: "Tráfego Pago", description: "Página de alta conversão (Design + Implementação simples)", default_price: 800, charge_type: "unique" },
      { name: "Gestão Mensal Full", category: "Tráfego Pago", description: "Criação de campanhas + Gestão de Públicos + Otimização de ROAS + Testes A/B", default_price: 1000, charge_type: "monthly" }
    ];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      for (const service of servicesToSeed) {
          const cleanPayload = {
              name: service.name, // Correção: name para name
              category: service.category,
              description: service.description,
              default_price: service.default_price,
              charge_type: service.charge_type,
              is_active: true,
              user_id: user.id
          };

          const { error } = await supabase.from('agency_services').insert(cleanPayload);
          
          if (error) {
              console.error(`Erro ao inserir ${service.name}:`, error);
              throw error;
          }
      }

      queryClient.invalidateQueries({ queryKey: ['agency_services'] });
      setSeedStatus('success');
    } catch (err: any) {
      console.error(err);
      setSeedStatus('error');
    } finally {
      setTimeout(() => {
        setSeedStatus('idle');
      }, 3000);
    }
  };

  if (isLoading) return <div className="p-10 text-[#737373] flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#FFFFFF] tracking-tight">Catálogo de Serviços</h1>
          <p className="text-[#9ca3af] text-sm mt-1">Gerencie preços base e escopo.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={16} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar serviço..."
              className="w-full bg-[#2C2C2C] border border-[#404040] rounded-md pl-9 pr-4 py-2 text-sm text-[#D4D4D4] placeholder-[#737373] outline-none focus:border-[#E09B6B] transition-colors"
            />
          </div>
          
          {/* Seed Button */}
          <button 
            onClick={handleSeed}
            disabled={seedStatus !== 'idle'}
            className={`
              px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium border transition-all whitespace-nowrap
              ${seedStatus === 'success' 
                ? 'bg-[#143d2d] text-[#60a887] border-[#20523e]' 
                : seedStatus === 'error'
                  ? 'bg-[#3d1414] text-[#a86060] border-[#522020]'
                  : 'bg-[#2C2C2C] text-[#9ca3af] border-[#404040] hover:bg-[#37352F] hover:text-[#E09B6B]'
              }
            `}
            title="Inserir dados de exemplo"
          >
            {seedStatus === 'idle' && <><Zap size={16} /><span className="hidden sm:inline">Povoar Catálogo</span></>}
            {seedStatus === 'loading' && <><Loader2 size={16} className="animate-spin" /><span>Processando...</span></>}
            {seedStatus === 'success' && <><Check size={16} /><span>Sucesso!</span></>}
            {seedStatus === 'error' && <><AlertCircle size={16} /><span>Erro (Ver Console)</span></>}
          </button>

          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFFFF] px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium border border-[#5D4037] active:scale-95 transition-all whitespace-nowrap"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-8">
        {Object.entries(groupedServices).length === 0 ? (
             <div className="text-center py-20 border border-dashed border-[#404040] rounded-lg bg-[#202020]">
                <Package className="mx-auto text-[#404040] mb-4" size={32} />
                <p className="text-[#737373] text-sm">Nenhum serviço encontrado.</p>
            </div>
        ) : (
            Object.entries(groupedServices).map(([category, items]) => (
            <div key={category} className="bg-[#2C2C2C] border border-[#404040] rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-[#202020] border-b border-[#404040] flex items-center gap-2">
                    <Layers size={14} className="text-[#E09B6B]" />
                    <h3 className="text-xs font-bold text-[#E09B6B] uppercase tracking-widest">
                        {category}
                    </h3>
                </div>
                
                <div className="divide-y divide-[#404040]">
                    {(items as AgencyServiceCatalog[]).map(service => (
                        <div key={service.id} className="group flex items-center justify-between p-4 hover:bg-[#323232] transition-colors">
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-3">
                                    {/* Exibindo 'name' corretamente */}
                                    <h4 className="text-sm font-bold text-[#E5E5E5] truncate">{(service as any).name}</h4>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                        service.charge_type === 'monthly' 
                                        ? 'bg-[#202020] text-[#9ca3af] border-[#404040]' 
                                        : 'bg-[#37352F] text-[#D4D4D4] border-[#404040]'
                                    }`}>
                                        {service.charge_type === 'monthly' ? 'Mensal' : 'Setup'}
                                    </span>
                                </div>
                                <p className="text-xs text-[#737373] mt-1 truncate max-w-2xl font-mono">
                                    {service.description || 'Sem descrição.'}
                                </p>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className="text-[10px] text-[#737373] block uppercase tracking-wide">Base</span>
                                    <span className="text-sm font-mono font-bold text-[#E09B6B]">
                                        R$ {service.default_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleOpenModal(service)}
                                        className="p-2 text-[#737373] hover:text-[#D4D4D4] hover:bg-[#404040] rounded transition-colors"
                                        title="Editar"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(service.id)}
                                        className="p-2 text-[#737373] hover:text-red-400 hover:bg-[#404040] rounded transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#202020] w-full max-w-md rounded-lg border border-[#404040] shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-[#404040]">
                    <h2 className="text-base font-bold text-[#FFFFFF]">
                        {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-[#737373] hover:text-[#D4D4D4]"><X size={18} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* CORREÇÃO 3: Input de Nome */}
                    <div>
                        <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1.5 block">Nome do Serviço</label>
                        <input 
                            required
                            value={formData.name} // Usando formData.name
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-[#37352F] border border-[#404040] rounded-md px-3 py-2 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none"
                            placeholder="Ex: Gestão de Tráfego"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1.5 block">Categoria</label>
                            <input 
                                required
                                list="categories"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                                className="w-full bg-[#37352F] border border-[#404040] rounded-md px-3 py-2 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none"
                                placeholder="Ex: Tráfego"
                            />
                            <datalist id="categories">
                                <option value="Tráfego Pago" />
                                <option value="Social Media" />
                                <option value="Design" />
                                <option value="Web" />
                                <option value="Consultoria" />
                            </datalist>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1.5 block">Tipo de Cobrança</label>
                            <select 
                                value={formData.charge_type}
                                onChange={e => setFormData({...formData, charge_type: e.target.value as ChargeType})}
                                className="w-full bg-[#37352F] border border-[#404040] rounded-md px-3 py-2 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none appearance-none"
                            >
                                <option value="monthly">Mensal (Recorrente)</option>
                                <option value="unique">Único (Projeto)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1.5 block">Preço Base (R$)</label>
                        <input 
                            type="number"
                            required
                            value={formData.default_price}
                            onChange={e => setFormData({...formData, default_price: parseFloat(e.target.value)})}
                            className="w-full bg-[#37352F] border border-[#404040] rounded-md px-3 py-2 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none no-spin font-mono"
                            placeholder="0.00"
                            onWheel={(e) => e.currentTarget.blur()}
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1.5 block">Descrição (Escopo Base)</label>
                        <textarea 
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full bg-[#37352F] border border-[#404040] rounded-md px-3 py-2 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none resize-none"
                            placeholder="O que está incluso?"
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={createService.isPending || updateService.isPending}
                            className="w-full bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFFFF] font-bold py-2.5 rounded-md transition-all shadow-sm flex items-center justify-center gap-2 text-sm border border-[#5D4037]"
                        >
                            {(createService.isPending || updateService.isPending) ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Salvar Serviço
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
}
