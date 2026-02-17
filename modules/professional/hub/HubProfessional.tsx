import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, Briefcase, Plus, ArrowRight, 
  Film, CheckCircle2, Clock, FileText, AlertCircle, 
  Loader2, Play, Layout
} from 'lucide-react';
import { useAgencyDashboard } from '../hooks/useAgencyDashboard';
import ProfessionalResourcesWidget from './ProfessionalResourcesWidget';

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
    video_received: { color: 'text-muted-foreground bg-stone-400/10 border-stone-400/20', label: 'Recebido' },
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

export default function HubProfessional() {
  const navigate = useNavigate();
  const { data, isLoading } = useAgencyDashboard();

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#E09B6B]" size={32} />
      </div>
    );
  }

  const { activeProjects, pendingTasks, openQuotes, totalPipelineValue, activeClientsCount } = data || {};

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
            label="Demandas Pendentes" 
            value={pendingTasks?.length || 0} 
            subtext="Tarefas ativas de clientes"
            icon={<CheckCircle2 />}
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
        
        {/* COLUNA 1: PRODUÇÃO (VÍDEOS) */}
        <div className="lg:col-span-2 space-y-8">
            
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

            {/* Seção: Demandas de Clientes */}
            <div className="bg-[#202020] rounded-lg border border-[#404040] overflow-hidden">
                <div className="p-5 border-b border-[#404040] flex justify-between items-center bg-[#252525]">
                    <h3 className="text-sm font-bold text-[#D4D4D4] uppercase tracking-wider flex items-center gap-2">
                        <Layout size={16} className="text-[#E09B6B]" /> Demandas dos Clientes
                    </h3>
                </div>
                
                <div className="p-2">
                    {pendingTasks?.length === 0 ? (
                        <div className="text-center py-10 text-[#5c5c5c] text-xs">Tudo limpo por aqui!</div>
                    ) : (
                        <div className="space-y-1">
                            {pendingTasks?.map((task: any) => (
                                <div 
                                    key={task.id} 
                                    onClick={() => navigate(`/professional/crm`)} // Idealmente levaria para o cliente específico
                                    className="flex items-center justify-between p-3 hover:bg-[#2C2C2C] rounded-md cursor-pointer group transition-colors border border-transparent hover:border-[#404040]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-[#E09B6B]'}`}></div>
                                        <div>
                                            <h4 className="text-sm font-medium text-[#E5E5E5] group-hover:text-[#E09B6B] transition-colors">
                                                {task.title}
                                            </h4>
                                            <p className="text-[10px] text-[#737373] mt-0.5">
                                                {task.client?.name} • {task.due_date ? `Vence: ${new Date(task.due_date).toLocaleDateString('pt-BR')}` : 'Sem prazo'}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-[#404040] group-hover:text-[#E09B6B] transition-colors" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>

        {/* COLUNA 2: COMERCIAL & ATALHOS */}
        <div className="space-y-6">
            
            {/* NOVO: Central de Recursos */}
            <ProfessionalResourcesWidget />

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
                                        <span className="text-[#D4D4D4] font-medium">{quote.client?.name || quote.title}</span>
                                        <span className="font-mono font-bold text-emerald-500">
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