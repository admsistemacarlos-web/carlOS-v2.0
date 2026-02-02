
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../integrations/supabase/client';
import { ModuleHeader } from '../../../shared/components/Navigation/ModuleHeader';
import { AgencyServiceCatalog, AgencyQuoteItem } from '../types/agency.types';
import { useServices } from '../hooks/useServices'; 
import { useClients } from '../hooks/useClients';
import { Plus, Trash2, Save, FileText, Calculator, Search, Loader2, Layers, Tag, TrendingDown, TrendingUp, AlertCircle, Percent, DollarSign, X, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

// ----------------------------------------------------------------------
// TYPES EXTENSION (Local)
// ----------------------------------------------------------------------
interface UIQuoteItem extends AgencyQuoteItem {
  category?: string;
  tempId?: string;
}

const DISCOUNT_ITEM_TITLE = 'Desconto Comercial';

// ----------------------------------------------------------------------
// MAIN PAGE COMPONENT
// ----------------------------------------------------------------------

export default function QuoteBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  // --- HOOKS ---
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: servicesList, isLoading: loadingServices } = useServices();

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEditing);
  
  // Proposal Data
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [quoteTitle, setQuoteTitle] = useState('');
  
  const [quoteItems, setQuoteItems] = useState<UIQuoteItem[]>([]);
  const [notes, setNotes] = useState('');

  // --- EFFECT: LOAD EXISTING DATA ---
  useEffect(() => {
    if (!isEditing) return;

    if (loadingServices) return;

    const fetchQuote = async () => {
      try {
        const { data: quote, error } = await supabase
          .from('agency_quotes')
          .select(`
            *, 
            items:agency_quote_items(*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (quote) {
          setSelectedClientId(quote.client_id);
          setQuoteTitle(quote.title);
          setNotes(quote.notes || '');
          
          const loadedItems = (quote.items || [])
            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            .map((i: any) => {
              const catalogService = servicesList?.find(s => s.id === i.service_id);
              const resolvedCategory = i.title === DISCOUNT_ITEM_TITLE 
                ? 'Ajustes' 
                : (catalogService?.category || 'Serviços Gerais');

              return {
                id: i.id, 
                service_id: i.service_id,
                title: i.title || i.service_name, 
                description: i.description || '',
                unit_price: i.unit_price,
                quantity: i.quantity,
                charge_type: i.charge_type,
                order_index: i.order_index,
                category: resolvedCategory 
              };
            });
          setQuoteItems(loadedItems);
        }
      } catch (error) {
        console.error('Erro ao carregar proposta:', error);
        navigate('/professional/quotes');
      } finally {
        setInitializing(false);
      }
    };

    fetchQuote();
  }, [id, isEditing, navigate, servicesList, loadingServices]);

  // --- HANDLERS ---

  const handleAddService = (service: AgencyServiceCatalog) => {
    setQuoteItems(prevItems => {
      // 1. Verifica se o serviço já existe na lista
      const existingItemIndex = prevItems.findIndex(item => item.service_id === service.id);

      if (existingItemIndex >= 0) {
        // Cenário A: Já existe -> Incrementa quantidade
        return prevItems.map((item, index) => {
          if (index === existingItemIndex) {
            return {
              ...item,
              quantity: (item.quantity || 1) + 1
            };
          }
          return item;
        });
      } else {
        // Cenário B: Não existe -> Adiciona nova linha
        const newItem: UIQuoteItem = {
          id: crypto.randomUUID(), 
          service_id: service.id,
          title: service.name,
          description: service.description || '',
          unit_price: service.default_price,
          quantity: 1,
          charge_type: service.charge_type,
          category: service.category || 'Geral'
        };
        return [...prevItems, newItem];
      }
    });
  };

  const handleUpdateItem = (itemId: string, field: keyof UIQuoteItem, value: any) => {
    setQuoteItems(prev => prev.map(item => {
      if (item.id === itemId) return { ...item, [field]: value };
      return item;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setQuoteItems(prev => prev.filter(item => item.id !== itemId));
  };

  // --- LOGICA DE DESCONTO GLOBAL ---
  const handleApplyGlobalDiscount = (value: number, type: 'percent' | 'fixed') => {
    setQuoteItems(prev => {
        // 1. Calcular Subtotal (apenas itens positivos)
        const subtotal = prev
            .filter(i => i.unit_price > 0)
            .reduce((acc, i) => acc + (i.unit_price * i.quantity), 0);

        // 2. Calcular valor do desconto (sempre negativo)
        let discountAmount = 0;
        
        // Se o valor for 0, removemos o desconto
        if (!value || value === 0) {
           return prev.filter(i => i.title !== DISCOUNT_ITEM_TITLE);
        }

        if (type === 'percent') {
            discountAmount = subtotal * (value / 100);
        } else {
            discountAmount = value;
        }

        // Remover item de desconto antigo, se houver
        const cleanItems = prev.filter(i => i.title !== DISCOUNT_ITEM_TITLE);

        if (discountAmount <= 0) return cleanItems;

        // Criar novo item de desconto
        const discountItem: UIQuoteItem = {
            id: 'global-discount-item', // ID fixo para controle local
            title: DISCOUNT_ITEM_TITLE,
            description: type === 'percent' ? `Desconto de ${value}% sobre o subtotal` : 'Desconto fixo aplicado',
            unit_price: -Math.abs(discountAmount), // Garante negativo
            quantity: 1,
            charge_type: 'unique', // Descontos geralmente abatem no setup/total
            category: 'Ajustes'
        };

        return [...cleanItems, discountItem];
    });
  };

  const onSave = async () => {
    if (!selectedClientId || !quoteTitle || quoteItems.length === 0) {
      alert('Preencha o cliente, título e adicione pelo menos um item.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Calculate totals
      const totalOneTime = quoteItems
        .filter(i => i.charge_type === 'unique')
        .reduce((acc, item) => acc + (Number(item.unit_price) * Number(item.quantity)), 0);

      const totalMonthly = quoteItems
        .filter(i => i.charge_type === 'monthly')
        .reduce((acc, item) => acc + (Number(item.unit_price) * Number(item.quantity)), 0);

      const quoteData = {
        client_id: selectedClientId,
        title: quoteTitle,
        status: 'draft', 
        notes: notes,
        user_id: user.id,
        total_one_time: totalOneTime,
        total_monthly: totalMonthly
      };

      let quoteId = id;

      // 1. Upsert Quote Header
      if (isEditing && id) {
        const { error: updateError } = await supabase
          .from('agency_quotes')
          .update(quoteData)
          .eq('id', id);
        if (updateError) throw updateError;
        
        // Clean items to re-insert
        await supabase.from('agency_quote_items').delete().eq('quote_id', id);
      } else {
        const { data: newQuote, error: createError } = await supabase
          .from('agency_quotes')
          .insert(quoteData)
          .select()
          .single();
        if (createError) throw createError;
        quoteId = newQuote.id;
      }

      // 2. Insert Items
      if (quoteId) {
        const itemsToInsert = quoteItems.map((item, index) => ({
          quote_id: quoteId,
          service_id: item.service_id, // Pode ser null se for desconto criado manualmente
          title: item.title, 
          description: item.description,
          unit_price: item.unit_price,
          quantity: item.quantity,
          charge_type: item.charge_type,
          order_index: index,
          user_id: user.id
        }));

        const { error: itemsError } = await supabase.from('agency_quote_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      navigate('/professional/quotes');
    } catch (error: any) {
      console.error(error);
      alert('Erro ao salvar: ' + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  if (initializing || loadingClients || loadingServices) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#E09B6B]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191919] pb-32 text-[#D4D4D4]">
      
      <ModuleHeader 
        title={isEditing ? "Editar Proposta" : "Nova Proposta"}
        subtitle="Construtor de Orçamento Comercial"
        backLink="/professional/quotes"
      />

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-6 space-y-8">
        
        {/* 1. HEADER FIELDS */}
        <div className="bg-[#202020] p-6 rounded-2xl border border-[#404040] shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-2">Título do Projeto</label>
              <input
                type="text"
                value={quoteTitle}
                onChange={(e) => setQuoteTitle(e.target.value)}
                placeholder="Ex: Identidade Visual + Tráfego"
                className="w-full h-11 px-4 bg-[#37352F] border border-[#404040] rounded-lg text-sm text-[#D4D4D4] placeholder-[#737373] focus:border-[#E09B6B] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-2">Cliente</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full h-11 px-4 bg-[#37352F] border border-[#404040] rounded-lg text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="">Selecione um cliente...</option>
                {clients?.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company_name ? `// ${client.company_name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. CATALOG (ACCORDION STYLE) */}
        <QuoteCatalog 
          services={servicesList} 
          selectedItems={quoteItems} 
          onAddService={handleAddService} 
        />

        {/* 3. PROPOSAL ITEMS (WIDE CARDS) */}
        <QuoteItemsBuilder 
          items={quoteItems}
          catalog={servicesList || []}
          onUpdateItem={handleUpdateItem}
          onRemoveItem={handleRemoveItem}
          onApplyGlobalDiscount={handleApplyGlobalDiscount}
          notes={notes}
          setNotes={setNotes}
          onSave={onSave}
          isSaving={loading}
        />

      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENT: QUOTE CATALOG (Accordion Top)
// ----------------------------------------------------------------------

const QuoteCatalog: React.FC<{ 
  services?: AgencyServiceCatalog[], 
  selectedItems: UIQuoteItem[],
  onAddService: (s: AgencyServiceCatalog) => void 
}> = ({ services, selectedItems, onAddService }) => {
  
  // State para controlar quais categorias estão abertas
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const groupedServices = useMemo(() => {
    const groups: Record<string, AgencyServiceCatalog[]> = {};
    (services || []).forEach(service => {
      const cat = service.category || 'Geral';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(service);
    });
    return groups;
  }, [services]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
        const newSet = new Set(prev);
        if (newSet.has(category)) newSet.delete(category);
        else newSet.add(category);
        return newSet;
    });
  };

  return (
    <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#FFFFFF] flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-[#E09B6B]" /> Catálogo de Serviços
        </h3>

        {Object.keys(groupedServices).length === 0 ? (
            <div className="p-8 text-center bg-[#202020] rounded-lg border border-[#404040] border-dashed text-[#737373] text-sm">
                Catálogo vazio ou carregando...
            </div>
        ) : (
            <div className="space-y-2">
                {Object.entries(groupedServices).map(([category, items]) => {
                    const isExpanded = expandedCategories.has(category);
                    const serviceList = items as AgencyServiceCatalog[];
                    
                    return (
                        <div key={category} className="bg-[#202020] border border-[#404040] rounded-xl overflow-hidden shadow-sm transition-all">
                            {/* Accordion Header */}
                            <button 
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center justify-between px-5 py-4 bg-[#252525] hover:bg-[#2A2A2A] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Tag size={16} className="text-[#737373]" />
                                    <h4 className="text-sm font-bold text-[#D4D4D4] uppercase tracking-wider">{category}</h4>
                                    <span className="text-[10px] text-[#5c5c5c] bg-[#1e1e1e] px-2 py-0.5 rounded-full font-medium">
                                        {serviceList.length}
                                    </span>
                                </div>
                                <div className="text-[#737373]">
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </button>

                            {/* Accordion Body (Grid) */}
                            {isExpanded && (
                                <div className="p-4 bg-[#1e1e1e] border-t border-[#404040]">
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {serviceList.map(service => {
                                            const qty = selectedItems.find(i => i.service_id === service.id)?.quantity || 0;
                                            
                                            return (
                                                <button 
                                                    key={service.id}
                                                    onClick={() => onAddService(service)}
                                                    className={`
                                                        group flex flex-col justify-between p-3 rounded-lg border text-left transition-all hover:-translate-y-0.5
                                                        ${qty > 0 
                                                            ? 'bg-[#E09B6B]/10 border-[#E09B6B] shadow-[0_0_10px_rgba(224,155,107,0.1)]' 
                                                            : 'bg-[#252525] border-[#404040] hover:border-[#737373]'
                                                        }
                                                    `}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">
                                                                {service.charge_type === 'monthly' ? 'Mensal' : 'Setup'}
                                                            </span>
                                                            {qty > 0 && (
                                                                <span className="bg-[#E09B6B] text-[#191919] text-[9px] font-black px-1.5 rounded-sm">
                                                                    {qty}x
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h5 className="text-sm font-bold text-[#E5E5E5] leading-tight mb-3 line-clamp-2 min-h-[2.5em]">
                                                            {service.name}
                                                        </h5>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5 w-full">
                                                        <span className="text-sm font-mono font-medium text-[#E09B6B]">
                                                            R$ {service.default_price.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                        </span>
                                                        <div className={`p-1 rounded-md transition-colors ${qty > 0 ? 'bg-[#E09B6B] text-[#191919]' : 'bg-[#37352F] text-[#737373] group-hover:bg-[#404040]'}`}>
                                                            <Plus size={14} />
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};

// ----------------------------------------------------------------------
// SUB-COMPONENT: QUOTE BUILDER (Stacked Wide Rows)
// ----------------------------------------------------------------------

const QuoteItemsBuilder: React.FC<{
  items: UIQuoteItem[];
  catalog: AgencyServiceCatalog[];
  onUpdateItem: (id: string, field: keyof UIQuoteItem, value: any) => void;
  onRemoveItem: (id: string) => void;
  onApplyGlobalDiscount: (value: number, type: 'percent' | 'fixed') => void;
  notes: string;
  setNotes: (val: string) => void;
  onSave: () => void;
  isSaving: boolean;
}> = ({ items, catalog, onUpdateItem, onRemoveItem, onApplyGlobalDiscount, notes, setNotes, onSave, isSaving }) => {

  const [globalFixedDisc, setGlobalFixedDisc] = useState<string>('');
  const [globalPercentDisc, setGlobalPercentDisc] = useState<string>('');

  // --- CALCULA TOTAIS ---
  const subTotal = items
    .filter(i => i.unit_price > 0)
    .reduce((acc, i) => acc + (i.unit_price * i.quantity), 0);

  const totalDiscount = Math.abs(items
    .filter(i => i.unit_price < 0)
    .reduce((acc, i) => acc + (i.unit_price * i.quantity), 0));

  const finalTotal = subTotal - totalDiscount;

  const totalOneTime = items.filter(i => i.charge_type === 'unique').reduce((acc, i) => acc + (i.unit_price * i.quantity), 0);
  const totalMonthly = items.filter(i => i.charge_type === 'monthly').reduce((acc, i) => acc + (i.unit_price * i.quantity), 0);

  const handlePercentChange = (itemId: string, serviceId: string | undefined, percent: number) => {
    const service = catalog.find(s => s.id === serviceId);
    if (!service) return;
    const basePrice = service.default_price;
    const newPrice = basePrice + (basePrice * (percent / 100));
    onUpdateItem(itemId, 'unit_price', Number(newPrice.toFixed(2)));
  };

  const onFixedDiscountChange = (val: string) => {
    setGlobalFixedDisc(val);
    setGlobalPercentDisc(''); 
    const numVal = val === '' ? 0 : Number(val);
    onApplyGlobalDiscount(numVal, 'fixed');
  };

  const onPercentDiscountChange = (val: string) => {
    setGlobalPercentDisc(val);
    setGlobalFixedDisc('');
    const numVal = val === '' ? 0 : Number(val);
    onApplyGlobalDiscount(numVal, 'percent');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. LISTA DE ITENS */}
      <div className="space-y-4">
        <h3 className="font-bold text-[#FFFFFF] flex items-center gap-2 text-sm">
            <Calculator className="w-4 h-4 text-[#E09B6B]" />
            Composição da Proposta
        </h3>

        {items.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-[#404040] rounded-xl text-[#737373]">
                <p className="text-sm">Selecione serviços no catálogo acima para montar o orçamento.</p>
            </div>
        ) : (
            <div className="space-y-3">
                {items.map((item, index) => {
                    const isDiscountItem = item.title === DISCOUNT_ITEM_TITLE;
                    const service = catalog.find(s => s.id === item.service_id);
                    const listPrice = service ? service.default_price : 0;
                    
                    const currentDiffPercent = listPrice > 0 
                        ? ((item.unit_price - listPrice) / listPrice) * 100 
                        : 0;

                    // CARD DE DESCONTO
                    if (isDiscountItem) {
                        return (
                            <div key={item.id} className="flex items-center justify-between bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-900/20 rounded-lg text-red-400"><Tag size={18} /></div>
                                    <span className="font-bold text-red-300 text-sm">{item.title}</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-lg font-bold text-red-400 font-sans tabular-nums">
                                        - R$ {Math.abs(item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <button onClick={() => onRemoveItem(item.id!)} className="text-red-400 hover:text-red-200 transition-colors p-2"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        );
                    }

                    // CARD DE ITEM NORMAL (WIDE ROW)
                    return (
                        <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between bg-[#262626] border border-[#404040] p-4 rounded-xl gap-4 hover:border-[#737373] transition-all group">
                            
                            {/* SECTION 1: INFO */}
                            <div className="flex-1 min-w-0 flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                                        item.charge_type === 'monthly' 
                                        ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' 
                                        : 'bg-purple-900/20 text-purple-400 border-purple-900/30'
                                    }`}>
                                        {item.charge_type === 'monthly' ? 'Mensal' : 'Setup'}
                                    </span>
                                    <input 
                                        value={item.title}
                                        onChange={(e) => onUpdateItem(item.id!, 'title', e.target.value)}
                                        className="bg-transparent text-white font-bold text-sm w-full outline-none focus:text-[#E09B6B] transition-colors"
                                    />
                                </div>
                                <div className="text-[10px] text-[#737373] flex items-center gap-2 pl-1">
                                    <span className="uppercase font-bold tracking-wider">Tabela:</span>
                                    <span className="font-mono">R$ {listPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {/* SECTION 2: PRICING (Middle) */}
                            <div className="flex items-center gap-3 bg-[#1e1e1e] p-2 rounded-lg border border-[#333]">
                                {/* Preço Unitário */}
                                <div className="relative group/price">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#737373] text-xs">R$</span>
                                    <input 
                                        type="number"
                                        value={item.unit_price === 0 ? '' : item.unit_price}
                                        onChange={(e) => onUpdateItem(item.id!, 'unit_price', e.target.value === '' ? 0 : Number(e.target.value))}
                                        className="w-24 h-8 bg-[#2C2C2C] border border-[#404040] rounded text-sm text-right pr-2 pl-6 outline-none focus:border-[#E09B6B] font-sans tabular-nums text-[#D4D4D4] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />
                                </div>
                                
                                {/* Desconto % */}
                                <div className="relative">
                                    <input 
                                        type="number"
                                        value={currentDiffPercent === 0 ? '' : Number(currentDiffPercent.toFixed(1))}
                                        onChange={(e) => handlePercentChange(item.id!, item.service_id, e.target.value === '' ? 0 : Number(e.target.value))}
                                        className={`w-16 h-8 bg-[#2C2C2C] border border-[#404040] rounded text-xs text-center outline-none focus:border-[#E09B6B] font-sans tabular-nums font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                            currentDiffPercent < 0 ? 'text-red-400' : currentDiffPercent > 0 ? 'text-green-400' : 'text-[#737373]'
                                        }`}
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />
                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-[#5c5c5c]">%</span>
                                </div>
                            </div>

                            {/* SECTION 3: CLOSING (Right) */}
                            <div className="flex items-center gap-4 justify-end md:justify-start pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                                {/* Qty */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-[#737373] uppercase">Qtd</span>
                                    <input 
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => onUpdateItem(item.id!, 'quantity', Number(e.target.value))}
                                        className="w-12 h-8 bg-[#2C2C2C] border border-[#404040] rounded text-center text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        min="1"
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />
                                </div>

                                {/* Total */}
                                <div className="text-right min-w-[100px]">
                                    <span className="block text-[10px] text-[#737373] font-bold uppercase">Total</span>
                                    <span className="text-lg font-bold text-[#E09B6B] font-sans tabular-nums">
                                        R$ {((item.unit_price || 0) * (item.quantity || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <button 
                                    onClick={() => onRemoveItem(item.id!)}
                                    className="p-2 text-[#737373] hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* 2. FOOTER (TOTAIS) */}
      <div className="bg-[#202020] rounded-2xl border border-[#404040] p-6 space-y-6">
          
          {/* Condições Comerciais */}
          {items.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b border-[#404040]">
                <div className="flex items-center gap-2 text-[#737373]">
                    <AlertCircle size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Ajuste Global</span>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <DollarSign size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
                        <input 
                            type="number" placeholder="R$ Desconto" value={globalFixedDisc}
                            className="w-32 h-10 bg-[#1A1A1A] border border-[#404040] rounded-lg text-sm pl-8 pr-3 text-[#D4D4D4] outline-none focus:border-[#E09B6B] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onChange={(e) => onFixedDiscountChange(e.target.value)}
                            onWheel={(e) => e.currentTarget.blur()}
                        />
                    </div>
                    <div className="relative">
                        <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
                        <input 
                            type="number" placeholder="% Desconto" value={globalPercentDisc}
                            className="w-32 h-10 bg-[#1A1A1A] border border-[#404040] rounded-lg text-sm pl-8 pr-3 text-[#D4D4D4] outline-none focus:border-[#E09B6B] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onChange={(e) => onPercentDiscountChange(e.target.value)}
                            onWheel={(e) => e.currentTarget.blur()}
                        />
                    </div>
                </div>
            </div>
          )}

          {/* Totais Finais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              <div>
                 <p className="text-[10px] text-[#737373] font-bold uppercase tracking-widest mb-1">Subtotal</p>
                 <p className="text-2xl font-bold text-[#D4D4D4] font-sans tabular-nums">
                    R$ {subTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </p>
              </div>
              <div>
                 <p className="text-[10px] text-[#737373] font-bold uppercase tracking-widest mb-1">Setup (Único)</p>
                 <p className="text-2xl font-bold text-[#FFFFFF] font-sans tabular-nums">
                    R$ {totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </p>
              </div>
              <div>
                 <p className="text-[10px] text-[#737373] font-bold uppercase tracking-widest mb-1">Mensalidade Total</p>
                 <p className="text-3xl font-bold text-[#E09B6B] font-sans tabular-nums">
                    R$ {totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </p>
              </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-4 pt-2">
            <textarea
              placeholder="Observações internas sobre este orçamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 p-3 text-sm bg-[#1A1A1A] border border-[#404040] rounded-lg text-[#D4D4D4] outline-none focus:border-[#E09B6B] resize-none h-14 focus:h-24 transition-all"
            />
            <button 
              onClick={onSave}
              disabled={isSaving || items.length === 0}
              className="px-8 h-14 bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFFFF] font-bold uppercase tracking-widest text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-[#5D4037]"
            >
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Salvando...' : 'Salvar Proposta'}
            </button>
          </div>

      </div>

    </div>
  );
}
