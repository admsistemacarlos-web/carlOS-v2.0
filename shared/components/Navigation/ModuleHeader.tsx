
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, ArrowLeft, ArrowRightLeft } from 'lucide-react';

interface ModuleHeaderProps {
  title?: string;
  subtitle?: string;
  backLink?: string;
  actions?: React.ReactNode;
}

export function ModuleHeader({ title, subtitle, backLink, actions }: ModuleHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isPersonal = location.pathname.startsWith('/personal');

  // Determine the section name based on path if not provided
  const getSectionName = () => {
    if (title) return title;
    const path = location.pathname;
    if (path.includes('/finance')) return 'Financeiro';
    if (path.includes('/pet')) return 'Pet Care';
    if (path.includes('/studies')) return 'Biblioteca';
    if (path.includes('/spirituality')) return 'Vida Espiritual';
    if (path.includes('/health')) return 'Saúde & Wellness';
    if (path.includes('/projects')) return 'Projetos';
    if (path.includes('/crm')) return 'CRM & Clientes';
    if (path.includes('/quotes')) return 'Comercial';
    if (path.includes('/traffic')) return 'Tráfego Pago';
    if (path.includes('/services')) return 'Catálogo';
    if (path.includes('/video-editor')) return 'Vídeos';
    return isPersonal ? 'Hub Pessoal' : 'Hub Agência';
  };

  const hubPath = isPersonal ? '/personal' : '/professional';
  const sectionName = getSectionName();

  // --- MODO PESSOAL (Quiet Luxury - Light - Stone/Cream) ---
  if (isPersonal) {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-border">
        <div>
          <h2 className="text-3xl font-serif italic text-foreground tracking-tight">{sectionName}</h2>
          {subtitle ? (
            <p className="text-sm text-muted-foreground mt-1 font-medium">{subtitle}</p>
          ) : (
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground mt-1">Ambiente Privado</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {actions}
          
          <button 
            onClick={() => backLink ? navigate(backLink) : navigate('/fork')}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            {backLink ? <ArrowLeft size={14} /> : <ArrowRightLeft size={14} />} 
            {backLink ? 'Voltar' : 'Trocar Contexto'}
          </button>
          
          {!backLink && (
            <button 
              onClick={() => navigate(hubPath)}
              className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-full shadow-sm text-foreground text-[10px] font-bold uppercase tracking-widest hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <LayoutGrid size={14} className="text-primary" /> Módulos
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- MODO PROFISSIONAL (Sophistication - Dark Mode for Agency) ---
  return (
    <div className="mb-10 pb-6 border-b border-[#404040] flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E09B6B]"></span>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#9ca3af]">Quattro9 Studio</p>
        </div>
        <h2 className="text-3xl font-bold text-[#FFFFFF] tracking-tight leading-none">{sectionName}</h2>
        {subtitle && <p className="text-sm text-[#9ca3af] mt-2 font-medium">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-3">
        {actions}

        <button 
          onClick={() => backLink ? navigate(backLink) : navigate(hubPath)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2C2C2C] border border-[#404040] rounded-lg text-[#D4D4D4] text-xs font-bold uppercase tracking-wider hover:bg-[#37352F] hover:text-[#E09B6B] transition-all shadow-sm"
        >
          {backLink ? <ArrowLeft size={14} /> : <LayoutGrid size={14} />}
          {backLink ? 'Voltar' : 'Dashboard'}
        </button>
      </div>
    </div>
  );
}

export default ModuleHeader;
