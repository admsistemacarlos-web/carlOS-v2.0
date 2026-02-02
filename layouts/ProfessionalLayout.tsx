
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Briefcase, Users, TrendingUp, BarChart3, ArrowLeft, Menu, X, RefreshCcw, Film, FileText, Tag } from 'lucide-react';
import ModuleHeader from '../shared/components/Navigation/ModuleHeader';

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string; end?: boolean; onClick?: () => void }> = ({ to, icon, label, end, onClick }) => (
  <NavLink 
    to={to} 
    end={end}
    onClick={onClick}
    className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-md transition-all text-sm font-medium tracking-wide ${isActive ? 'bg-[#37352F] text-[#E09B6B] shadow-sm' : 'text-[#9ca3af] hover:bg-[#2C2C2C] hover:text-[#D4D4D4]'}`}
  >
    {({ isActive }) => (
      <>
        {React.cloneElement(icon as React.ReactElement<any>, { 
          size: 16, 
          className: isActive ? 'text-[#E09B6B]' : 'text-[#737373]' 
        })}
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

interface ProfessionalLayoutProps {
  children?: React.ReactNode;
}

const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const isHub = location.pathname === '/professional' || location.pathname === '/professional/';

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-[#191919] overflow-hidden font-sans text-[#D4D4D4]">
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Notion Dark Gray */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#202020] border-r border-[#404040] flex flex-col z-50 transition-transform duration-300 ease-in-out transform
        lg:translate-x-0 lg:static lg:inset-auto shadow-xl lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 pb-4 flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-sm bg-[#E09B6B]"></div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9ca3af]">Quattro9</span>
            </div>
            
            <div className="flex items-center justify-between pr-2">
              <h2 className="text-lg font-bold tracking-tight text-[#FFFFFF]">Agency OS</h2>
              <button 
                onClick={() => navigate('/personal')}
                className="p-1.5 rounded-md hover:bg-[#37352F] text-[#9ca3af] hover:text-[#E09B6B] transition-all"
                title="Mudar para Pessoal"
              >
                <RefreshCcw size={14} />
              </button>
            </div>
          </div>
          <button className="lg:hidden text-[#9ca3af] mt-1 ml-2" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-3 space-y-0.5 py-4 overflow-y-auto custom-scrollbar">
          <SidebarItem to="/professional" icon={<LayoutGrid />} label="Hub Agência" end onClick={closeSidebar} />
          
          <div className="pt-6 pb-2 px-4">
             <p className="text-[10px] uppercase font-bold text-[#5c5c5c] tracking-widest">Operação</p>
          </div>
          
          <SidebarItem to="/professional/crm" icon={<Users />} label="Clientes" onClick={closeSidebar} />
          <SidebarItem to="/professional/quotes" icon={<FileText />} label="Propostas" onClick={closeSidebar} />
          <SidebarItem to="/professional/services" icon={<Tag />} label="Serviços" onClick={closeSidebar} />
          <SidebarItem to="/professional/projects" icon={<Briefcase />} label="Projetos" onClick={closeSidebar} />
          <SidebarItem to="/professional/video-editor" icon={<Film />} label="Vídeos" onClick={closeSidebar} />
          <SidebarItem to="/professional/traffic" icon={<TrendingUp />} label="Tráfego" onClick={closeSidebar} />
          <SidebarItem to="/professional/finance" icon={<BarChart3 />} label="Financeiro" onClick={closeSidebar} />
        </nav>

        <div className="p-4 border-t border-[#404040]">
          <button 
            onClick={() => { closeSidebar(); navigate('/fork'); }}
            className="flex items-center gap-2 px-3 py-2 w-full text-[#737373] hover:text-[#E09B6B] hover:bg-[#37352F] rounded-md transition-colors text-xs font-medium uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Sair do Contexto
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#191919]">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-[#404040] bg-[#202020]">
          <div className="flex items-center gap-3">
            <button className="text-[#9ca3af] hover:text-white transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-bold text-white">Agency OS</h2>
          </div>
        </header>

        <main className="flex-1 overflow-auto relative selection:bg-[#E09B6B]/30 selection:text-white">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 pb-20">
            {/* Show ModuleHeader if not on Hub */}
            {!isHub && <ModuleHeader />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfessionalLayout;
