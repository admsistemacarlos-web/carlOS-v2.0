import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, Briefcase, Plus, ArrowRight, 
  Film, CheckCircle2, Clock, FileText, AlertCircle, 
  Loader2, Calendar, Video, Layout
} from 'lucide-react';
import { useAgencyDashboard } from '../hooks/useAgencyDashboard';
import { GlobalCalendarItem } from '../types/agency.types';
import ProfessionalCalendar from './components/ProfessionalCalendar';
import { useProfessionalCalendarEvents } from '../hooks/useProfessionalCalendarEvents';
import { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import CalendarEventsSidebar from './components/CalendarEventsSidebar';





// --- COMPONENTES VISUAIS ---

const KPICard = ({ label, value, icon, subtext, accentColor }: any) => (
  <div className="bg-[#202020] p-5 rounded-lg border border-[#404040] flex items-start justify-between relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-8 opacity-5 transition-transform group-hover:scale-110 ${accentColor}`}>
      {React.cloneElement(icon, { size: 64 })}
    </div>
    <div className="relative z-10">
      <p className="text-[#9ca3af] text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-[#FFFFFF] font-mono tracking-tight">{value}</h3>
      {subtext && <p className="text-[#737373] text-[10px] mt-1 font-medium">{subtext}</p>}
    </div>
    <div className={`p-2 rounded-md bg-[#2C2C2C] border border-[#404040] ${accentColor}`}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
  </div>
);

const ProjectStatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { color: string, label: string }> = {
    video_received: { color: 'text-stone-400 bg-stone-400/10 border-stone-400/20', label: 'Recebido' },
    editing: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'Em Edição' },
    approval: { color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', label: 'Aprovação' },
    changes: { color: 'text-red-400 bg-red-400/10 border-red-400/20', label: 'Alterações' },
  };
  const style = config[status] || config.video_received;
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style.color}`}>
      {style.label}
    </span>
  );
};

const CalendarItemBadge = ({ item }: { item: GlobalCalendarItem }) => {
  if (item.item_type === 'meeting') {
    return (
      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-400 flex items-center gap-1">
        <Video size={10} /> Reunião
      </span>
    );
  }

  const config: Record<string, { color: string, label: string }> = {
    todo: { color: 'text-stone-400 bg-stone-400/10 border-stone-400/20', label: 'A Fazer' },
    in_progress: { color: 'text-[#E09B6B] bg-[#E09B6B]/10 border-[#E09B6B]/20', label: 'Andamento' },
    approval: { color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', label: 'Aprovação' },
    ready_to_post: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'Agendar' },
  };
  
  const style = config[item.item_status] || { color: 'text-stone-400 bg-stone-400/10 border-stone-400/20', label: 'Tarefa' };

  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style.color} flex items-center gap-1 shrink-0`}>
      <CheckCircle2 size={10} /> {style.label}
    </span>
  );
};

// --- FUNÇÃO AUXILIAR DE DATA ---
const formatEventDate = (dateString: string, type: 'task' | 'meeting') => {
  const date = new Date(dateString);
  if (type === 'task') {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', ' •');
};

export default function HubProfessional() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useAgencyDashboard();

  // Estado do Calendário
const [selectedDate, setSelectedDate] = useState(new Date());
const [calendarMonth, setCalendarMonth] = useState(new Date());

// Range do mês para buscar eventos
const getMonthRange = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  return { startOfMonth, endOfMonth };
};

const { startOfMonth, endOfMonth } = getMonthRange(calendarMonth);

// Buscar eventos do calendário
const { data: calendarMarkers } = useProfessionalCalendarEvents({
  startDate: startOfMonth,
  endDate: endOfMonth,
userId: user?.id || ''
});

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#E09B6B]" size={32} />
      </div>
    );
  }

  const { activeProjects, globalCalendar, openQuotes, totalPipelineValue, activeClientsCount } = data || {};

  return (
    <div className="animate-fade-in pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E09B6B]"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]">Quattro9 Studio</span>
          </div>
          <h1 className="text-3xl font-bold text-[#FFFFFF] tracking-tight">Painel de Controle</h1>
</div>
<div className="flex gap-2">
    <button 
        onClick={() => navigate('/professional/crm')}
        className="bg-[#2C2C2C] hover:bg-[#37352F] text-[#D4D4D4] px-4 py-2.5 rounded-md flex items-center gap-2 text-xs font-bold uppercase tracking-wider border border-[#404040] transition-colors"
    >
        <Users size={14} /> Clientes
    </button>
    <button 
        onClick={() => navigate('/professional/projects')}
        className="bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFFFF] px-4 py-2.5 rounded-md flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm border border-[#5D4037] transition-all active:scale-95"
    >
        <Plus size={14} /> Novo Projeto
    </button>
</div>
      </header>

      {/* 🎯 CALENDÁRIO COMPLETO COM SIDEBAR */}
<div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Calendário - 2/3 da largura */}
  <div className="lg:col-span-2">
    <ProfessionalCalendar 
      selectedDate={selectedDate}
      onSelectDate={setSelectedDate}
      currentMonth={calendarMonth}
      onMonthChange={setCalendarMonth}
      markers={calendarMarkers || {}}
    />
  </div>

  {/* Sidebar de Eventos - 1/3 da largura */}
  <div className="lg:col-span-1">
    <CalendarEventsSidebar 
      selectedDate={selectedDate}
      events={(() => {
        const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        return calendarMarkers?.[dateKey]?.events || [];
      })()}
    />
  </div>
</div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"></div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard 
            label="Projetos em Andamento" 
            value={activeProjects?.length || 0} 
            subtext="Vídeos na esteira de produção"
            icon={<Film />}
            accentColor="text-blue-400"
        />
        <KPICard 
            label="Calendário Ativo" 
            value={globalCalendar?.length || 0} 
            subtext="Tarefas e Reuniões próximas"
            icon={<Calendar />}
            accentColor="text-[#E09B6B]"
        />
        <KPICard 
            label="Pipeline Comercial" 
            value={`R$ ${totalPipelineValue?.toLocaleString('pt-BR', { notation: 'compact' }) || 0}`} 
            subtext={`${openQuotes?.length || 0} propostas em aberto`}
            icon={<TrendingUp />}
            accentColor="text-emerald-500"
        />
        <KPICard 
            label="Clientes Ativos" 
            value={activeClientsCount || 0} 
            subtext="Base atual da agência"
            icon={<Users />}
            accentColor="text-[#D4D4D4]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA 1: PRODUÇÃO E CALENDÁRIO */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Seção: Calendário Global (Unificado) */}
            <div className="bg-[#202020] rounded-lg border border-[#404040] overflow-hidden">
                <div className="p-5 border-b border-[#404040] flex justify-between items-center bg-[#252525]">
                    <h3 className="text-sm font-bold text-[#D4D4D4] uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={16} className="text-[#E09B6B]" /> Agenda Global
                    </h3>
                </div>
                
                <div className="p-2">
                    {globalCalendar?.length === 0 ? (
                        <div className="text-center py-10 text-[#5c5c5c] text-xs">A agenda dos próximos dias está livre.</div>
                    ) : (
                        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                            {globalCalendar?.map((item: GlobalCalendarItem) => (
                                <div 
                                    key={`${item.item_type}-${item.item_id}`} 
                                    onClick={() => navigate(`/professional/crm/${item.client_id}`)}
                                    className="flex items-center justify-between p-3 hover:bg-[#2C2C2C] rounded-md cursor-pointer group transition-colors border border-transparent hover:border-[#404040]"
                                >
                                    <div className="flex items-center gap-3 min-w-0 pr-4">
                                        <div className="w-8 h-8 rounded bg-[#37352F] flex items-center justify-center text-[#9ca3af] shrink-0 font-bold text-[10px] overflow-hidden">
                                            {item.client_logo ? (
                                                <img src={item.client_logo} alt={item.client_name} className="w-full h-full object-cover" />
                                            ) : (
                                                item.client_name.substring(0,2).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-[#E5E5E5] truncate group-hover:text-[#E09B6B] transition-colors">
                                                {item.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[10px] text-[#737373] truncate">
                                                    {item.client_name}
                                                </p>
                                                <span className="text-[#5c5c5c]">•</span>
                                                <p className="text-[10px] text-[#737373] font-mono whitespace-nowrap">
                                                    {formatEventDate(item.event_date, item.item_type)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <CalendarItemBadge item={item} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Seção: Produção de Vídeo */}
            <div className="bg-[#202020] rounded-lg border border-[#404040] overflow-hidden">
                <div className="p-5 border-b border-[#404040] flex justify-between items-center bg-[#252525]">
                    <h3 className="text-sm font-bold text-[#D4D4D4] uppercase tracking-wider flex items-center gap-2">
                        <Film size={16} className="text-blue-400" /> Vídeos em Andamento
                    </h3>
                    <button onClick={() => navigate('/professional/video-editor')} className="text-[10px] font-bold text-[#737373] hover:text-[#E09B6B] uppercase tracking-wider flex items-center gap-1 transition-colors">
                        Ver Kanban <ArrowRight size={10} />
                    </button>
                </div>
                
                <div className="p-2">
                    {activeProjects?.length === 0 ? (
                        <div className="text-center py-10 text-[#5c5c5c] text-xs">Nenhum vídeo em produção no momento.</div>
                    ) : (
                        <div className="space-y-1">
                            {activeProjects?.map((project: any) => (
                                <div 
                                    key={project.id} 
                                    onClick={() => navigate(`/professional/video-editor/${project.id}`)}
                                    className="flex items-center justify-between p-3 hover:bg-[#2C2C2C] rounded-md cursor-pointer group transition-colors border border-transparent hover:border-[#404040]"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded bg-[#37352F] flex items-center justify-center text-[#9ca3af] shrink-0 font-bold text-[10px]">
                                            {project.client?.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-[#E5E5E5] truncate group-hover:text-blue-400 transition-colors">
                                                {project.title}
                                            </h4>
                                            <p className="text-[10px] text-[#737373] mt-0.5 flex items-center gap-1">
                                                <Clock size={10} /> Prazo: {new Date(project.deadline).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <ProjectStatusBadge status={project.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>

        {/* COLUNA 2: COMERCIAL & ATALHOS */}
        <div className="space-y-6">
            
            {/* Card Comercial */}
            <div className="bg-[#202020] rounded-lg border border-[#404040] p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                    <FileText size={100} />
                </div>
                
                <div className="relative z-10">
                    <h3 className="text-sm font-bold text-[#D4D4D4] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-emerald-500" /> Comercial
                    </h3>
                    
                    <div className="space-y-4">
                        {openQuotes?.length === 0 ? (
                            <p className="text-[#737373] text-xs italic">Nenhuma proposta em negociação.</p>
                        ) : (
                            <ul className="space-y-3">
                                {openQuotes?.slice(0, 3).map((quote: any) => (
                                    <li 
                                        key={quote.id} 
                                        onClick={() => navigate(`/professional/quotes/${quote.id}`)}
                                        className="flex justify-between items-center text-xs border-b border-[#404040] pb-2 last:border-0 cursor-pointer hover:text-emerald-400 transition-colors"
                                    >
                                        <span className="text-[#D4D4D4] font-medium truncate pr-2">{quote.client?.name || quote.title}</span>
                                        <span className="font-mono font-bold text-emerald-500 shrink-0">
                                            R$ {(quote.total_monthly + quote.total_one_time).toLocaleString('pt-BR', { notation: 'compact' })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        
                        <button 
                            onClick={() => navigate('/professional/quotes')}
                            className="w-full mt-4 bg-[#37352F] hover:bg-[#404040] text-[#D4D4D4] py-2 rounded text-xs font-bold uppercase tracking-widest border border-[#404040] transition-colors"
                        >
                            Gerenciar Propostas
                        </button>
                    </div>
                </div>
            </div>


            {/* Quick Links */}
            <div className="bg-[#2C2C2C] rounded-lg border border-[#404040] p-5">
                <h3 className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-4">Acesso Rápido</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => navigate('/professional/crm')} className="p-3 bg-[#202020] hover:bg-[#191919] border border-[#404040] rounded text-[#D4D4D4] hover:text-[#E09B6B] transition-colors text-xs font-bold flex flex-col items-center gap-2">
                        <Users size={18} />
                        Clientes
                    </button>
                    <button onClick={() => navigate('/professional/services')} className="p-3 bg-[#202020] hover:bg-[#191919] border border-[#404040] rounded text-[#D4D4D4] hover:text-[#E09B6B] transition-colors text-xs font-bold flex flex-col items-center gap-2">
                        <Briefcase size={18} />
                        Serviços
                    </button>
                    <button onClick={() => navigate('/professional/video-editor')} className="p-3 bg-[#202020] hover:bg-[#191919] border border-[#404040] rounded text-[#D4D4D4] hover:text-[#E09B6B] transition-colors text-xs font-bold flex flex-col items-center gap-2">
                        <Film size={18} />
                        Vídeos
                    </button>
                    <button onClick={() => navigate('/professional/quotes/new')} className="p-3 bg-[#202020] hover:bg-[#191919] border border-[#404040] rounded text-[#D4D4D4] hover:text-[#E09B6B] transition-colors text-xs font-bold flex flex-col items-center gap-2">
                        <Plus size={18} />
                        Proposta
                    </button>
                </div>

            </div>

        </div>

      </div>
    </div>
  );
}