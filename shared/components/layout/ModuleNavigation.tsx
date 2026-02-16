
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, RefreshCcw } from 'lucide-react';

const ModuleNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPersonal = location.pathname.startsWith('/personal');
  
  // Only show navigation if not on the main hub pages
  const isHub = isPersonal 
    ? (location.pathname === '/personal' || location.pathname === '/personal/')
    : (location.pathname === '/professional' || location.pathname === '/professional/');

  if (isHub) return null;

  const hubPath = isPersonal ? '/personal' : '/professional';

  return (
    <div className="flex items-center justify-between py-4 mb-8">
      <button 
        onClick={() => navigate(hubPath)}
        className="flex items-center gap-1.5 text-[11px] font-bold tracking-tight text-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Voltar ao Hub
      </button>

      <button 
        onClick={() => navigate('/fork')}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card shadow-sm text-[10px] font-bold uppercase tracking-wider text-foreground hover:text-primary hover:border-border transition-all active:scale-95"
      >
        <RefreshCcw size={12} className="text-olive" />
        Profissional
      </button>
    </div>
  );
};

export default ModuleNavigation;
