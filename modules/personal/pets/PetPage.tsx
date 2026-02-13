import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Dog, Plus, Calendar, Activity, Syringe, Bone, 
  Scissors, Pill, Scale, Stethoscope, DollarSign, 
  Trash2, History, ArrowRight, CheckCircle2,
  Cookie, Layers, Sparkles, Filter, X, Pencil, Loader2, AlertTriangle, Clock, CalendarDays, MapPin, ArrowDown,
  ReceiptText, Check, Circle
} from 'lucide-react';
import { usePetData } from './hooks/usePetData';
import { LogCategory, PetLog } from './types';
import { PetFormModal } from './components/PetFormModal';
import { PetLogModal } from './components/PetLogModal';
import ModuleHeader from '../../../shared/components/Navigation/ModuleHeader';
import { formatDateBr } from '../finance/utils/dateHelpers';

// --- DATE HELPERS ---
export const getTodayString = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const getDaysSince = (dateString: string) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const [y, m, d] = dateString.split('T')[0].split('-').map(Number);
  const eventDate = new Date(y, m - 1, d);
  const diffTime = today.getTime() - eventDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

type PeriodFilter = 'today' | 'all' | 'month' | 'quarter' | 'semester' | 'year';

const isInPeriod = (dateString: string, period: PeriodFilter): boolean => {
  if (period === 'all') return true;
  
  const [y, m, d] = dateString.split('T')[0].split('-').map(Number);
  const eventDate = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0,0,0,0);
  eventDate.setHours(0,0,0,0);

  if (period === 'today') {
    return eventDate.getTime() === now.getTime();
  }

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  if (eventDate.getFullYear() !== currentYear) return false;
  
  const eventMonth = eventDate.getMonth();
  switch (period) {
    case 'month': return eventMonth === currentMonth;
    case 'quarter': return Math.floor(eventMonth / 3) === Math.floor(currentMonth / 3);
    case 'semester': return Math.floor(eventMonth / 6) === Math.floor(currentMonth / 6);
    case 'year': return true;
    default: return true;
  }
};

const getPeriodLabel = (p: PeriodFilter) => {
  switch (p) {
    case 'today': return 'Hoje';
    case 'month': return 'Este Mês';
    case 'quarter': return 'Este Trimestre';
    case 'semester': return 'Este Semestre';
    case 'year': return 'Este Ano';
    case 'all': return 'Todo o Período';
  }
};

// --- CONFIGURAÇÃO VISUAL ---
const CATEGORY_CONFIG: Record<LogCategory, { label: string; icon: React.ReactNode; color: string; bg: string; unitSuffix?: string }> = {
  food: { label: 'Ração', icon: <Bone size={18} />, color: 'text-orange-600', bg: 'bg-orange-50', unitSuffix: 'kg' },
  treats: { label: 'Petiscos', icon: <Cookie size={18} />, color: 'text-amber-500', bg: 'bg-amber-50', unitSuffix: 'un' },
  pads: { label: 'Tapetes', icon: <Layers size={18} />, color: 'text-cyan-600', bg: 'bg-cyan-50', unitSuffix: 'un' },
  cleaning: { label: 'Seca Xixi', icon: <Sparkles size={18} />, color: 'text-teal-500', bg: 'bg-teal-50', unitSuffix: 'g' },
  hygiene: { label: 'Banho & Tosa', icon: <Scissors size={18} />, color: 'text-blue-500', bg: 'bg-blue-50' },
  health: { label: 'Veterinário', icon: <Stethoscope size={18} />, color: 'text-red-500', bg: 'bg-red-50' },
  vaccine: { label: 'Vacina', icon: <Syringe size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  medication: { label: 'Remédio', icon: <Pill size={18} />, color: 'text-purple-500', bg: 'bg-purple-50', unitSuffix: 'mg' },
  measurement: { label: 'Peso', icon: <Scale size={18} />, color: 'text-stone-500', bg: 'bg-stone-100', unitSuffix: 'kg' },
};

const getCategoryStyle = (category: string) => {
  return CATEGORY_CONFIG[category as LogCategory] || {
    label: category || 'Outro',
    icon: <Activity size={18} />,
    color: 'text-stone-500',
    bg: 'bg-stone-100'
  };
};

export default function PetPage() {
  const { pets, logs, fetchLogs, addPet, addLog, updateLog, deleteLog, loading } = usePetData();
  const [activePetId, setActivePetId] = useState<string | null>(null);
  
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [activeModalCategory, setActiveModalCategory] = useState<LogCategory | null>(null);
  const [filterCategory, setFilterCategory] = useState<LogCategory | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  
  const [editingLog, setEditingLog] = useState<PetLog | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingDoneId, setUpdatingDoneId] = useState<string | null>(null);

  useEffect(() => {
    if (pets.length > 0 && !activePetId) {
      setActivePetId(pets[0].id);
    }
  }, [pets, activePetId]);

  useEffect(() => {
    if (activePetId) {
      fetchLogs(activePetId);
    }
  }, [activePetId, fetchLogs]);

  const activePet = pets.find(p => p.id === activePetId);

  // Filtragem
  const filteredLogs = useMemo(() => {
    let result = logs;
    result = result.filter(l => isInPeriod(l.event_date, periodFilter));
    if (filterCategory !== 'all') {
      result = result.filter(l => l.category === filterCategory);
    }
    return result;
  }, [logs, filterCategory, periodFilter]);

  const stats = useMemo(() => {
    if (!activePet) return null;
    const now = new Date();
    const birth = new Date(activePet.birth_date);
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) { years--; months += 12; }

    const weightLogs = logs.filter(l => l.category === 'measurement' && l.value);
    const weightLog = weightLogs.length > 0 ? weightLogs[0] : null;

    const periodLogs = logs.filter(l => isInPeriod(l.event_date, periodFilter));
    const periodCost = periodLogs.reduce((acc, l) => acc + l.cost, 0);

    let categoryStats = null;
    if (filterCategory !== 'all' && filterCategory !== 'measurement') {
        const totalSpent = filteredLogs.reduce((acc, l) => acc + l.cost, 0);
        const allCatLogs = logs.filter(l => l.category === filterCategory);
        const lastPurchase = allCatLogs.length > 0 ? allCatLogs[0] : null; 
        
        categoryStats = {
            totalSpent,
            lastDate: lastPurchase ? formatDateBr(lastPurchase.event_date) : 'Nunca',
            count: filteredLogs.length
        };
    }

    const todayStr = getTodayString();
    const upcomingTasks = logs
      .filter(l => l.next_due_date && l.next_due_date.split('T')[0] >= todayStr)
      .sort((a, b) => a.next_due_date!.localeCompare(b.next_due_date!))
      .slice(0, 2);

    return {
      age: `${years}a ${months}m`,
      weight: weightLog ? weightLog.value : '--',
      periodCost,
      upcomingTasks,
      categoryStats
    };
  }, [activePet, logs, filterCategory, periodFilter, filteredLogs]);

  // Handlers
  const handleSavePet = async (data: any) => {
    await addPet({ ...data, birth_date: data.birth_date });
  };

  const handleSaveLog = async (data: any) => {
    if (!activePetId) return;
    const payload = {
        ...data,
        pet_id: activePetId,
        event_date: data.event_date,
        next_due_date: data.next_due_date || null,
        location: data.location || null
    };
    if (editingLog) {
        await updateLog(editingLog.id, payload);
    } else {
        await addLog(payload);
    }
  };

  const handleEditClick = (log: PetLog) => {
    setEditingLog(log);
    setActiveModalCategory(log.category);
  };

  const handleDeleteClick = (logId: string) => {
    setDeleteConfirmationId(logId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmationId || !activePetId) return;
    setIsDeleting(true);
    try {
        await deleteLog(deleteConfirmationId, activePetId);
        setDeleteConfirmationId(null);
    } catch (error) {
        alert('Erro ao excluir registro');
    } finally {
        setIsDeleting(false);
    }
  };

  // Handler para toggle do status "done"
  const handleToggleDone = async (logId: string, currentDone: boolean) => {
    if (!activePetId) return;
    setUpdatingDoneId(logId);
    try {
      const logToUpdate = logs.find(l => l.id === logId);
      if (!logToUpdate) return;
      
      await updateLog(logId, {
        ...logToUpdate,
        done: !currentDone
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    } finally {
      setUpdatingDoneId(null);
    }
  };

  if (!pets.length && !loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-8 bg-[#FAF9F6]">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 text-stone-300 border border-stone-200 shadow-sm">
          <Dog size={48} />
        </div>
        <h2 className="text-3xl font-bold text-[#3C3633] mb-3 tracking-tight">Pet Care</h2>
        <p className="text-stone-500 mb-10 text-center max-w-xs text-sm leading-relaxed">
          Gerencie a saúde, higiene e custos dos seus companheiros em um só lugar.
        </p>
        <button 
          onClick={() => setIsPetModalOpen(true)}
          className="bg-[#5F6F52] hover:bg-[#4a5740] text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} /> Adicionar Pet
        </button>
        <PetFormModal isOpen={isPetModalOpen} onClose={() => setIsPetModalOpen(false)} onSave={handleSavePet} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-8 pt-8">
        
        <ModuleHeader 
          title="Meus Pets" 
          subtitle="Gestão de Saúde e Custos"
          actions={
            <button 
              onClick={() => setIsPetModalOpen(true)}
              className="bg-[#3C3633] hover:bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95"
            >
              <Plus size={14} /> Novo Pet
            </button>
          }
        />

        {/* Tabs de Pets */}
        <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
          {pets.map(pet => (
            <button
              key={pet.id}
              onClick={() => { setActivePetId(pet.id); setFilterCategory('all'); }}
              className={`
                px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border shadow-sm
                ${activePetId === pet.id 
                  ? 'bg-[#5F6F52] text-white border-[#5F6F52] shadow-md' 
                  : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'
                }
              `}
            >
              <Dog size={14} />
              {pet.name}
            </button>
          ))}
        </div>

        {activePet && stats && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Bento Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card Dinâmico */}
              {stats.categoryStats ? (
                  <div className={`col-span-2 p-6 rounded-[2rem] border shadow-sm flex items-center justify-between transition-all ${getCategoryStyle(filterCategory as string).bg} border-opacity-50`}>
                      <div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${getCategoryStyle(filterCategory as string).color}`}>
                              Gasto com {getCategoryStyle(filterCategory as string).label}
                          </p>
                          <p className="text-4xl font-bold text-[#3C3633] tracking-tighter">R$ {stats.categoryStats.totalSpent.toFixed(2)}</p>
                          <p className="text-xs text-stone-500 mt-2 font-medium">
                              <span className="opacity-70">{getPeriodLabel(periodFilter)}</span> • Última: <span className="font-bold">{stats.categoryStats.lastDate}</span>
                          </p>
                      </div>
                      <div className={`p-5 bg-white rounded-2xl shadow-sm ${getCategoryStyle(filterCategory as string).color}`}>
                          {getCategoryStyle(filterCategory as string).icon}
                      </div>
                  </div>
              ) : (
                  <>
                      {/* Idade */}
                      <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col justify-between h-40">
                          <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#747264]">Idade</span>
                              <Calendar size={18} className="text-stone-300" />
                          </div>
                          <div>
                              <span className="text-3xl font-bold text-[#3C3633] tracking-tight">{stats.age.split(' ')[0]}</span>
                              <span className="text-sm text-stone-400 ml-1 font-medium">{stats.age.split(' ')[1]}</span>
                          </div>
                      </div>

                      {/* Peso */}
                      <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col justify-between h-40">
                          <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#747264]">Peso</span>
                              <Scale size={18} className="text-stone-300" />
                          </div>
                          <div>
                              <span className="text-3xl font-bold text-[#3C3633] tracking-tight">{stats.weight}</span>
                              <span className="text-sm text-stone-400 ml-1 font-medium">kg</span>
                          </div>
                      </div>
                  </>
              )}

              {/* Gasto do Período */}
              <div className="col-span-2 bg-[#5F6F52]/5 p-6 rounded-[2rem] border border-[#5F6F52]/10 flex flex-col justify-between h-40">
                 <div className="flex justify-between items-start">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-[#5F6F52]">
                      Gasto ({getPeriodLabel(periodFilter)})
                   </p>
                   <div className="p-2 bg-white rounded-full shadow-sm text-[#5F6F52]">
                     <DollarSign size={16} />
                   </div>
                 </div>
                 <p className="text-3xl font-bold text-[#3C3633] tracking-tighter">R$ {stats.periodCost.toFixed(2)}</p>
              </div>

              {/* Próximas Tarefas */}
              {stats.upcomingTasks.length > 0 && (
                  <div className="col-span-2 bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Próximos Cuidados</span>
                          <Activity size={16} className="text-stone-300" />
                      </div>
                      <div className="space-y-3">
                          {stats.upcomingTasks.map(task => {
                              const style = getCategoryStyle(task.category);
                              return (
                                  <div key={task.id} className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
                                      <div className={`p-2 rounded-lg ${style.bg} ${style.color}`}>
                                          {style.icon}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-[#3C3633] truncate">{task.title}</p>
                                          <p className="text-[10px] text-stone-500">
                                          Vence em {formatDateBr(task.next_due_date)}
                                          </p>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}
            </div>

            {/* Quick Actions Grid */}
            <div>
              <h3 className="text-xs font-bold text-[#747264] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Plus size={14} /> Registro Rápido
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                {(Object.keys(CATEGORY_CONFIG) as LogCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setEditingLog(null);
                      setActiveModalCategory(cat);
                    }}
                    className="flex flex-col items-center justify-center gap-2 bg-white border border-stone-100 p-4 rounded-2xl hover:border-[#5F6F52]/30 hover:shadow-md transition-all active:scale-95 group h-24"
                  >
                    <div className={`p-2 rounded-xl transition-colors ${CATEGORY_CONFIG[cat].bg} ${CATEGORY_CONFIG[cat].color} group-hover:scale-110 duration-300`}>
                      {CATEGORY_CONFIG[cat].icon}
                    </div>
                    <span className="text-[9px] font-bold uppercase text-stone-400 group-hover:text-[#3C3633] truncate w-full text-center tracking-wide">
                      {CATEGORY_CONFIG[cat].label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h3 className="text-xs font-bold text-[#747264] uppercase tracking-widest flex items-center gap-2">
                      <History size={14} /> Histórico
                  </h3>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <select
                            value={periodFilter}
                            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                            className="w-full appearance-none bg-white border border-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-wider py-2.5 pl-9 pr-8 rounded-xl focus:outline-none focus:border-[#5F6F52]/50 cursor-pointer shadow-sm"
                        >
                            <option value="today">Hoje</option>
                            <option value="month">Este Mês</option>
                            <option value="quarter">Este Trimestre</option>
                            <option value="semester">Este Semestre</option>
                            <option value="year">Este Ano</option>
                            <option value="all">Todo o Período</option>
                        </select>
                        <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                    </div>
                    
                    {filterCategory !== 'all' && (
                        <button 
                            onClick={() => setFilterCategory('all')} 
                            className="text-[10px] font-bold text-red-400 bg-red-50 border border-red-100 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
                        >
                            <X size={12} /> Limpar
                        </button>
                    )}
                  </div>
              </div>

              {/* Filtros de Categoria */}
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-2">
                  <button
                      onClick={() => setFilterCategory('all')}
                      className={`
                          px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap
                          ${filterCategory === 'all' ? 'bg-[#3C3633] text-white border-[#3C3633] shadow-sm' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'}
                      `}
                  >
                      Todos
                  </button>
                  {(Object.keys(CATEGORY_CONFIG) as LogCategory[]).map(cat => (
                      <button
                          key={cat}
                          onClick={() => setFilterCategory(cat)}
                          className={`
                              px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-2
                              ${filterCategory === cat 
                                  ? `${CATEGORY_CONFIG[cat].bg} ${CATEGORY_CONFIG[cat].color} border-transparent ring-1 ring-inset ring-black/5 shadow-sm` 
                                  : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'
                              }
                          `}
                      >
                          {CATEGORY_CONFIG[cat].label}
                      </button>
                  ))}
              </div>
              
              <div className="relative border-l-2 border-stone-200 ml-4 space-y-6 pb-10">
                {filteredLogs.map((log, index) => {
                  const config = getCategoryStyle(log.category);
                  const suffix = CATEGORY_CONFIG[log.category].unitSuffix;
                  const daysSince = ['food', 'cleaning', 'pads', 'treats'].includes(log.category) ? getDaysSince(log.event_date) : null;
                  const unitCost = (log.cost > 0 && log.value && log.value > 0) ? (log.cost / log.value).toFixed(2) : null;
                  const nextLog = filteredLogs[index + 1];
                  let intervalDays: number | null = null;
                  
                  if (nextLog) {
                      if (filterCategory !== 'all' || nextLog.category === log.category) {
                          const currentDate = new Date(log.event_date.split('T')[0]);
                          const prevDate = new Date(nextLog.event_date.split('T')[0]);
                          const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          if (diffDays > 0) intervalDays = diffDays;
                      }
                  }

                  return (
                    <React.Fragment key={log.id}>
                      <div className="relative pl-8 group animate-fade-in">
                          <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 border-[#FAF9F6] shadow-sm z-10 ${config.bg}`}></div>
                          
                          <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-all gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${config.bg} ${config.color}`}>
                                        {config.label}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                        {formatDateBr(log.event_date)}
                                    </span>
                                    {daysSince !== null && daysSince >= 0 && (
                                        <span className="text-[9px] text-stone-500 font-bold bg-stone-50 px-2 py-0.5 rounded border border-stone-100 flex items-center gap-1">
                                            <Clock size={10} /> 
                                            {daysSince === 0 ? 'Hoje' : `Há ${daysSince} dias`}
                                        </span>
                                    )}
                                    {log.location && (
                                        <span className="text-[9px] text-stone-500 font-bold flex items-center gap-1 bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
                                            <MapPin size={10} /> {log.location}
                                        </span>
                                    )}
                                </div>
                                <h4 className="font-bold text-[#3C3633] text-sm">
                                    {log.title}
                                    {log.value && suffix && <span className="ml-1 text-stone-500 font-normal">({log.value} {suffix})</span>}
                                </h4>
                                
                                {unitCost && suffix && (
                                    <p className="text-[10px] text-stone-400 mt-1 font-mono">
                                        (R$ {unitCost} / {suffix})
                                    </p>
                                )}

                                {log.next_due_date && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <p className="text-[10px] text-[#5F6F52] flex items-center gap-1 font-bold uppercase tracking-wider">
                                        <ArrowRight size={10} /> Próximo: {formatDateBr(log.next_due_date)}
                                      </p>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleDone(log.id, log.done || false);
                                        }}
                                        disabled={updatingDoneId === log.id}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                          log.done 
                                            ? 'bg-emerald-500 text-white shadow-sm' 
                                            : 'bg-white border-2 border-stone-300 text-stone-400 hover:border-emerald-400'
                                        } ${updatingDoneId === log.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
                                        title={log.done ? 'Marcar como não feito' : 'Marcar como feito'}
                                      >
                                        {updatingDoneId === log.id ? (
                                          <Loader2 size={10} className="animate-spin" />
                                        ) : log.done ? (
                                          <Check size={12} strokeWidth={3} />
                                        ) : (
                                          <Circle size={10} strokeWidth={2} />
                                        )}
                                      </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 w-full md:w-auto justify-between md:justify-start">
                                {log.cost > 0 && (
                                    <div className="flex items-center gap-1.5" title="Lançado no Financeiro">
                                        <span className="text-base font-bold text-stone-700">R$ {log.cost.toFixed(2)}</span>
                                        <div className="w-5 h-5 rounded-full bg-[#5F6F52]/10 flex items-center justify-center text-[#5F6F52]">
                                            <ReceiptText size={12} />
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEditClick(log)}
                                        className="p-2 text-stone-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClick(log.id)}
                                        className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                          </div>
                      </div>

                      {intervalDays !== null && (
                          <div className="pl-8 pb-2 pt-2 relative -my-2 z-0">
                              <div className="flex items-center gap-2">
                                  <div className="text-[9px] font-bold text-stone-400 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit shadow-sm">
                                      <ArrowDown size={10} /> {intervalDays} dias depois
                                  </div>
                              </div>
                          </div>
                      )}
                    </React.Fragment>
                  );
                })}
                
                {filteredLogs.length === 0 && (
                  <div className="pl-8 py-12 text-center">
                      <div className="bg-white border-2 border-dashed border-stone-200 rounded-2xl p-8">
                        <p className="text-stone-400 text-sm font-medium">Nenhum registro encontrado para este período.</p>
                      </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Modals */}
        <PetFormModal isOpen={isPetModalOpen} onClose={() => setIsPetModalOpen(false)} onSave={handleSavePet} />
        
        <PetLogModal 
          isOpen={!!activeModalCategory} 
          category={activeModalCategory}
          categoryLabel={activeModalCategory ? CATEGORY_CONFIG[activeModalCategory].label : ''}
          logToEdit={editingLog}
          onClose={() => { setActiveModalCategory(null); setEditingLog(null); }} 
          onSave={handleSaveLog} 
        />

        {deleteConfirmationId && createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative border border-stone-100">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100">
                          <AlertTriangle size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-stone-800 mb-2">Excluir registro?</h3>
                      <p className="text-sm text-stone-500 leading-relaxed mb-6">
                          Tem certeza que deseja remover este item do histórico? Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex gap-3 w-full">
                          <button 
                              onClick={() => setDeleteConfirmationId(null)}
                              disabled={isDeleting}
                              className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-xl transition-colors text-xs uppercase tracking-widest"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={handleConfirmDelete}
                              disabled={isDeleting}
                              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                          >
                              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>,
          document.body
        )}

      </div>
    </div>
  );
}