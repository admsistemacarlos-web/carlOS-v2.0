
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wine, Plus, Search, Star, Calendar, 
  Trash2, Pencil, GlassWater 
} from 'lucide-react';
import ModuleHeader from '../../../shared/components/Navigation/ModuleHeader';
import { useCellar } from './hooks/useCellar';
import { BeverageFormModal } from './components/BeverageFormModal';
import { Beverage } from './types';
import { ConfirmModal } from '../../../shared/components/ui/ConfirmModal';

// Map de cores/icones por tipo
const TYPE_CONFIG: Record<string, { label: string, color: string, bg: string }> = {
  red_wine: { label: 'Tinto', color: 'text-rose-900', bg: 'bg-rose-100' },
  white_wine: { label: 'Branco', color: 'text-amber-600', bg: 'bg-amber-100' },
  rose_wine: { label: 'Rosé', color: 'text-pink-600', bg: 'bg-pink-100' },
  sparkling: { label: 'Espumante', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  beer: { label: 'Cerveja', color: 'text-orange-700', bg: 'bg-orange-100' },
  whisky: { label: 'Whisky', color: 'text-amber-800', bg: 'bg-amber-200' },
  gin: { label: 'Gin', color: 'text-cyan-700', bg: 'bg-cyan-100' },
  other: { label: 'Outro', color: 'text-stone-600', bg: 'bg-stone-200' },
};

export default function CellarPage() {
  const navigate = useNavigate();
  const { beverages, loading, addBeverage, updateBeverage, deleteBeverage } = useCellar();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBeverage, setEditingBeverage] = useState<Beverage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredBeverages = beverages.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.producer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || b.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleSave = async (data: Partial<Beverage>) => {
    if (editingBeverage) {
      await updateBeverage(editingBeverage.id, data);
    } else {
      await addBeverage(data);
    }
  };

  const handleEdit = (beverage: Beverage) => {
    setEditingBeverage(beverage);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteBeverage(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
  };

  const openNew = () => {
    setEditingBeverage(null);
    setIsModalOpen(true);
  };

  // Stats Rápidos
  const totalSpent = beverages.reduce((acc, b) => acc + b.price, 0);
  const avgRating = beverages.length > 0 
    ? (beverages.reduce((acc, b) => acc + b.rating, 0) / beverages.length).toFixed(1) 
    : '0.0';

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-8 pt-8">
        
        <ModuleHeader 
          title="Sommelier" 
          subtitle="Minha Adega de Experiências"
          actions={
            <button 
              onClick={openNew}
              className="bg-[#3C3633] hover:bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95"
            >
              <Plus size={14} /> Novo Rótulo
            </button>
          }
        />

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Rótulos Provados</p>
                <p className="text-2xl font-bold text-stone-800">{beverages.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Investimento Total</p>
                <p className="text-2xl font-bold text-stone-800">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Nota Média</p>
                <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-stone-800">{avgRating}</p>
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                </div>
            </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, produtor..."
                    className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                <button 
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all border ${filterType === 'all' ? 'bg-[#3C3633] text-white border-[#3C3633]' : 'bg-white text-stone-500 border-stone-200'}`}
                >
                    Todos
                </button>
                <button 
                    onClick={() => setFilterType('red_wine')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all border ${filterType === 'red_wine' ? 'bg-rose-900 text-white border-rose-900' : 'bg-white text-stone-500 border-stone-200'}`}
                >
                    Tintos
                </button>
                <button 
                    onClick={() => setFilterType('white_wine')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all border ${filterType === 'white_wine' ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-stone-500 border-stone-200'}`}
                >
                    Brancos
                </button>
            </div>
        </div>

        {/* Grid */}
        {loading ? (
            <div className="text-center py-20 text-stone-400">Carregando adega...</div>
        ) : filteredBeverages.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-stone-200">
                <Wine className="mx-auto text-stone-300 mb-4" size={48} />
                <p className="text-stone-500 font-medium">Nenhum rótulo encontrado.</p>
                <button onClick={openNew} className="text-rose-900 font-bold text-xs uppercase tracking-widest mt-2 hover:underline">
                    Adicionar o primeiro
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBeverages.map(bev => {
                    const typeStyle = TYPE_CONFIG[bev.type] || TYPE_CONFIG['other'];
                    
                    return (
                        <div key={bev.id} className="group bg-white p-5 rounded-[2rem] border border-[#E6E2DE] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all relative flex flex-col h-full">
                            
                            <div className="flex gap-4 mb-4">
                                {/* Imagem ou Placeholder */}
                                <div className="w-20 h-28 shrink-0 rounded-2xl overflow-hidden bg-stone-50 border border-stone-100 flex items-center justify-center relative">
                                    {bev.image_url ? (
                                        <img src={bev.image_url} alt={bev.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Wine size={24} className="text-stone-300 opacity-50" />
                                    )}
                                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-1.5 py-0.5 shadow-sm">
                                        <div className="flex items-center gap-0.5">
                                            <span className="font-bold text-amber-400 text-[10px]">{bev.rating}</span>
                                            <Star size={8} className="fill-amber-400 text-amber-400" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${typeStyle.bg} ${typeStyle.color}`}>
                                            {typeStyle.label}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-base font-bold text-stone-800 leading-tight mb-1 line-clamp-2">{bev.name}</h3>
                                    {bev.producer && (
                                        <p className="text-xs text-stone-500 font-medium uppercase tracking-wide truncate mb-1">{bev.producer}</p>
                                    )}
                                    {bev.grape && (
                                        <div className="flex items-center gap-1.5 text-xs text-stone-400">
                                            <GlassWater size={10} />
                                            <span className="truncate">{bev.grape}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {bev.review && (
                                <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 mb-4 flex-1">
                                    <p className="text-xs text-stone-500 italic line-clamp-3 leading-relaxed">"{bev.review}"</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-stone-50 mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Pago</span>
                                    <span className="text-sm font-bold text-stone-700">R$ {bev.price.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-stone-400 mr-2 flex items-center gap-1">
                                        <Calendar size={10} /> {new Date(bev.consumed_date).toLocaleDateString('pt-BR')}
                                    </span>
                                    
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(bev)} className="p-1.5 bg-stone-100 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={(e) => handleDeleteRequest(bev.id, e)} className="p-1.5 bg-stone-100 rounded-lg text-stone-500 hover:text-red-500 hover:bg-red-50 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        <BeverageFormModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            beverageToEdit={editingBeverage}
        />

        <ConfirmModal 
            isOpen={!!deleteId}
            onClose={() => setDeleteId(null)}
            onConfirm={confirmDelete}
            title="Excluir Rótulo?"
            description="Tem certeza que deseja excluir este rótulo da sua adega? Esta ação não pode ser desfeita."
            isDestructive
            isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
