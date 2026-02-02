
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, ChevronRight, Plus, 
  Clock, CheckCircle2, Film, Send, Folder, ExternalLink, Trash2, AlertTriangle, ChevronDown 
} from 'lucide-react';
import { useProjects, useUpdateProjectStatus, useDeleteProject } from '../hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { formatDateBr } from '../../personal/finance/utils/dateHelpers';

const COLUMNS = [
  { id: 'video_received', label: 'Recebido', icon: <Clock size={14} className="text-[#9ca3af]" />, color: 'border-[#737373]' },
  { id: 'editing', label: 'Em Edição', icon: <Film size={14} className="text-[#60a5fa]" />, color: 'border-[#60a5fa]/50' },
  { id: 'approval', label: 'Aprovação', icon: <Send size={14} className="text-[#fbbf24]" />, color: 'border-[#fbbf24]/50' },
  { id: 'posted', label: 'Postado', icon: <CheckCircle2 size={14} className="text-[#34d399]" />, color: 'border-[#34d399]/50' },
];

export default function VideoManagerPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [openColumns, setOpenColumns] = useState<string[]>(['video_received']);
  
  const { data: projects } = useProjects('video');
  const { mutate: moveCard } = useUpdateProjectStatus();
  const { mutate: deleteProject } = useDeleteProject();

  const filteredProjects = projects?.filter(p => {
    if (!p.deadline) return false;
    const projectDate = new Date(p.deadline);
    return projectDate.getMonth() === currentDate.getMonth() && 
           projectDate.getFullYear() === currentDate.getFullYear();
  });

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const toggleColumn = (id: string) => {
    setOpenColumns(prev => prev.includes(id) ? prev.filter(colId => colId !== id) : [...prev, id]);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault(); 

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedId) {
      moveCard({ id: draggedId, status });
      setDraggedId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setProjectToDelete(id);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  const renderProjectCard = (project: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(project.deadline);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    const diff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isDone = project.status === 'posted';
    const isLate = diff < 0 && !isDone;
    const isWarning = diff >= 0 && diff <= 2 && !isDone;

    let cardStyle = "bg-[#2C2C2C] border-[#404040] hover:border-[#E09B6B]/50";
    if (isLate) cardStyle = "bg-[#3d1414] border-[#522020] hover:border-red-500/50";
    else if (isWarning) cardStyle = "bg-[#3d2d14] border-[#523e20] hover:border-amber-500/50";

    return (
      <div 
        key={project.id} 
        draggable
        onDragStart={(e) => handleDragStart(e, project.id)}
        onClick={() => navigate(project.id)}
        className={`${cardStyle} p-3 rounded-md border shadow-sm transition-all cursor-grab active:cursor-grabbing group relative hover:shadow-md mb-3`}
      >
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
              {project.client?.logo_url ? (
                  <img src={project.client.logo_url} className="w-4 h-4 rounded-full object-cover" />
              ) : (
                  <div className="w-4 h-4 rounded-full bg-[#37352F] text-[#9ca3af] flex items-center justify-center text-[8px] font-bold">
                      {project.client?.name?.[0] || '?'}
                  </div>
              )}
              <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider truncate max-w-[100px]">
                  {project.client?.name}
              </span>
           </div>
           
           <div className="flex items-center gap-1">
             {project.drive_link && (
               <a href={project.drive_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#737373] hover:text-[#E09B6B] transition-colors" title="Abrir Drive">
                 <Folder size={12} />
               </a>
             )}
             {project.preview_link && (
               <a href={project.preview_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#737373] hover:text-[#E09B6B] transition-colors" title="Ver Preview">
                 <ExternalLink size={12} />
               </a>
             )}
             <button onClick={(e) => handleDeleteClick(e, project.id)} className="text-[#737373] hover:text-red-500 transition-colors p-1 rounded opacity-0 group-hover:opacity-100" title="Excluir">
                  <Trash2 size={12} />
             </button>
           </div>
        </div>
  
        <h4 className={`text-xs font-bold leading-tight mb-2 line-clamp-2 ${isLate ? 'text-red-200' : 'text-[#E5E5E5]'}`}>
          {project.title}
        </h4>
        
        <div className="flex items-center justify-between text-[10px] pt-2 mt-1 border-t border-[#FFFFFF]/5">
          <span className={`${isLate ? 'text-red-400 font-bold' : isWarning ? 'text-amber-400 font-bold' : 'text-[#737373] font-mono'}`}>
            {formatDateBr(project.deadline)}
            {isLate && " (!)"}
          </span>
          
          <div className="hidden md:block">
            {project.priority === 'high' && <span className="text-red-400 font-bold bg-red-900/20 px-1 rounded">Alta</span>}
            {project.priority === 'medium' && <span className="text-amber-400 font-bold bg-amber-900/20 px-1 rounded">Média</span>}
            {project.priority === 'low' && <span className="text-[#737373] font-bold bg-[#37352F] px-1 rounded">Baixa</span>}
          </div>

          <div className="md:hidden" onClick={(e) => e.stopPropagation()}>
            <select
              value={project.status}
              onChange={(e) => moveCard({ id: project.id, status: e.target.value })}
              className="bg-[#191919] text-[9px] font-bold uppercase text-[#9ca3af] border border-[#404040] rounded px-1 py-0.5 outline-none focus:border-[#E09B6B]"
            >
              {COLUMNS.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6 shrink-0">
        <div className="w-full md:w-auto">
          <h1 className="text-2xl font-bold text-[#FFFFFF] flex items-center gap-2">
            <Film className="text-[#E09B6B]" /> Edição de Vídeo
          </h1>
          <p className="text-[#9ca3af] text-sm">Gerencie o fluxo de produção mensal.</p>
        </div>

        <div className="flex items-center gap-2 bg-[#202020] p-1 rounded-md border border-[#404040]">
          <button onClick={handlePrevMonth} className="p-1.5 hover:bg-[#37352F] rounded text-[#9ca3af] hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="px-3 py-1 text-center min-w-[120px]">
            <span className="text-[10px] uppercase tracking-widest text-[#5c5c5c] font-bold block">Visualizando</span>
            <span className="text-xs font-bold text-[#E5E5E5] capitalize">
              {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate)}
            </span>
          </div>
          <button onClick={handleNextMonth} className="p-1.5 hover:bg-[#37352F] rounded text-[#9ca3af] hover:text-white transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        <button 
          onClick={() => navigate('new')}
          className="w-full md:w-auto bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFFFF] px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-all border border-[#5D4037]"
        >
          <Plus size={16} /> Novo Vídeo
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-4 md:gap-4 pb-24 md:pb-0 md:overflow-hidden h-auto md:h-full">
        {COLUMNS.map(col => {
          const columnProjects = filteredProjects?.filter(p => p.status === col.id) || [];
          const isOpen = openColumns.includes(col.id);
          
          return (
            <div 
              key={col.id} 
              className="flex flex-col h-auto md:h-full flex-1 min-w-full md:min-w-0 bg-[#202020] rounded-lg border border-[#404040] overflow-hidden transition-all duration-300"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <button 
                onClick={() => toggleColumn(col.id)}
                className={`w-full p-3 flex items-center justify-between border-b-2 ${col.color} bg-[#2C2C2C] cursor-pointer md:cursor-default transition-colors`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#E5E5E5] uppercase tracking-wide">
                  {col.icon}
                  {col.label}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#737373] bg-[#191919] px-1.5 py-0.5 rounded">
                    {columnProjects.length}
                  </span>
                  <ChevronDown size={14} className={`text-[#5c5c5c] transition-transform duration-300 md:hidden ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <div className={`px-2 pt-2 pb-16 space-y-2 transition-all ${isOpen ? 'block' : 'hidden'} md:block md:overflow-y-auto md:flex-1 custom-scrollbar`}>
                {columnProjects.map(project => renderProjectCard(project))}
                <div className="h-full min-h-[50px] flex items-center justify-center">
                    {columnProjects.length === 0 && <span className="text-[10px] text-[#404040] uppercase font-bold">Vazio</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {projectToDelete && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#202020] border border-[#404040] w-full max-w-sm rounded-lg p-6 shadow-2xl animate-fade-in relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-900/30">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-[#FFFFFF] mb-2">Excluir Projeto?</h3>
              <p className="text-[#9ca3af] text-xs mb-6 leading-relaxed">
                Tem certeza? Essa ação é irreversível.
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setProjectToDelete(null)} className="flex-1 py-2 rounded-md bg-[#37352F] text-[#D4D4D4] font-bold text-xs uppercase tracking-wider hover:bg-[#404040] transition-colors">Cancelar</button>
                <button onClick={confirmDelete} className="flex-1 py-2 rounded-md bg-red-900/50 text-red-200 font-bold text-xs uppercase tracking-wider hover:bg-red-900/70 border border-red-900 transition-colors">Confirmar</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
