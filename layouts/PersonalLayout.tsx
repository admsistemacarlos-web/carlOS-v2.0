import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, DollarSign, BookOpen, Church, PawPrint, Menu, Repeat, Activity, Briefcase, PieChart, Wine } from 'lucide-react';
import ModuleNavigation from '../shared/components/layout/ModuleNavigation';
import { ThemeToggle } from '../shared/ThemeToggle';

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string; end?: boolean; onClick?: () => void }> = ({ to, icon, label, end, onClick }) => (
  <NavLink 
    to={to} 
    end={end}
    onClick={onClick}
    className={({ isActive }) => `flex items-center gap-3 px-5 py-3 rounded-xl transition-all text-[11px] font-semibold tracking-tight ${isActive ? 'bg-accent text-accent-foreground border border-border' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

interface PersonalLayoutProps {
  children?: React.ReactNode;
}

const PersonalLayout: React.FC<PersonalLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const isFinance = location.pathname.includes('/finance');

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans personal-mode text-foreground">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col z-50 transition-transform duration-500 transform
        lg:translate-x-0 lg:static lg:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-semibold tracking-tighter text-foreground">carlOS</h2>
            <button 
              onClick={() => navigate('/professional')}
              className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              title="Ir para Profissional"
            >
              <Briefcase size={16} />
            </button>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Pessoal</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 py-4 overflow-y-auto">
          <SidebarItem to="/personal" icon={<LayoutGrid size={16} />} label="Painel Geral" end onClick={closeSidebar} />
          
          <div className="pt-8 pb-3 px-5">
             <p className="text-[9px] uppercase font-bold text-muted-foreground/50 tracking-[0.3em]">Ambientes</p>
          </div>
          <SidebarItem to="/personal/finance" icon={<DollarSign size={16} />} label="Financeiro" onClick={closeSidebar} />
          <SidebarItem to="/personal/health" icon={<Activity size={16} />} label="Saúde" onClick={closeSidebar} />
          <SidebarItem to="/personal/pet" icon={<PawPrint size={16} />} label="Pet Care" onClick={closeSidebar} />
          <SidebarItem to="/personal/studies" icon={<BookOpen size={16} />} label="Estudos" onClick={closeSidebar} />
          <SidebarItem to="/personal/spiritual" icon={<Church size={16} />} label="Espiritual" onClick={closeSidebar} />
          <SidebarItem to="/personal/sommelier" icon={<Wine size={16} />} label="Sommelier" onClick={closeSidebar} />

          {isFinance && (
            <div className="mt-8 mx-2 p-4 bg-secondary rounded-2xl border border-border animate-fade-in">
              <p className="text-[9px] font-bold text-muted-foreground/50 mb-4 tracking-[0.2em] uppercase px-2">Gestão</p>
              <div className="space-y-0.5">
                <NavLink 
                  end 
                  to="/personal/finance" 
                  onClick={closeSidebar} 
                  className={({ isActive }) => `block px-3 py-2 text-[10px] font-medium rounded-lg transition-colors ${isActive ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Panorama
                </NavLink>
                <NavLink 
                  to="/personal/finance/analytics" 
                  onClick={closeSidebar} 
                  className={({ isActive }) => `flex items-center gap-2 px-3 py-2 text-[10px] font-medium rounded-lg transition-colors ${isActive ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <PieChart size={14} />
                  Inteligência
                </NavLink>
                <NavLink 
                  to="/personal/finance/transactions" 
                  onClick={closeSidebar} 
                  className={({ isActive }) => `block px-3 py-2 text-[10px] font-medium rounded-lg transition-colors ${isActive ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Extrato
                </NavLink>
                <NavLink 
                  to="/personal/finance/accounts" 
                  onClick={closeSidebar} 
                  className={({ isActive }) => `block px-3 py-2 text-[10px] font-medium rounded-lg transition-colors ${isActive ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Contas
                </NavLink>
                <NavLink 
                  to="/personal/finance/cards" 
                  onClick={closeSidebar} 
                  className={({ isActive }) => `block px-3 py-2 text-[10px] font-medium rounded-lg transition-colors ${isActive ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Cartões
                </NavLink>
              </div>
            </div>
          )}
        </nav>

        <div className="p-6 space-y-3 border-t border-border">
          <div className="flex items-center justify-center">
            <ThemeToggle />
          </div>
          
          <button 
            onClick={() => navigate('/fork')}
            className="flex items-center gap-3 px-4 py-3 w-full bg-secondary hover:bg-accent rounded-xl transition-all text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <Repeat size={14} />
            Contexto
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-6 bg-background border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold tracking-tighter">carlOS</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={() => navigate('/professional')}
              className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Ir para Profissional"
            >
              <Briefcase size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-12 no-scrollbar">
          <div className="max-w-6xl mx-auto pb-20">
            <ModuleNavigation />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PersonalLayout;