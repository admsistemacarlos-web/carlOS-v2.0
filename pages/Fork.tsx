
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ContextCard: React.FC<{
  title: string;
  subtitle: string;
  theme: 'personal' | 'professional';
  onClick: () => void;
}> = ({ title, subtitle, theme, onClick }) => {
  const isPersonal = theme === 'personal';

  return (
    <button
      onClick={onClick}
      className={`
        relative group w-full h-full min-h-[140px] md:min-h-[350px] flex flex-col items-center justify-center 
        transition-all duration-700 ease-out overflow-hidden
        ${
          isPersonal
            ? 'bg-background text-foreground border border-border hover:border-primary/30 shadow-sm hover:shadow-xl'
            : 'bg-[#0f172a] text-blue-500 border border-slate-800 hover:border-blue-500/30 shadow-2xl hover:shadow-blue-500/10'
        }
      `}
    >
      <div className="relative z-10 flex flex-col items-center px-4">
        <h3
          className={`
          text-lg md:text-2xl font-medium tracking-[0.3em] uppercase mb-1 md:mb-4 transition-transform duration-700 group-hover:-translate-y-1
          ${isPersonal ? 'text-foreground' : 'text-blue-500'}
        `}
        >
          {title}
        </h3>
        <p
          className={`
          text-[8px] md:text-[10px] font-bold tracking-[0.4em] uppercase transition-all duration-700 delay-75 opacity-50 group-hover:opacity-100 group-hover:translate-y-1
          ${isPersonal ? 'text-muted-foreground' : 'text-muted-foreground'}
        `}
        >
          {subtitle}
        </p>
      </div>

      <div
        className={`
        absolute bottom-3 md:bottom-8 transition-all duration-700 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0
        ${isPersonal ? 'text-olive' : 'text-blue-400'}
      `}
      >
        <ArrowRight size={16} strokeWidth={1.5} />
      </div>
    </button>
  );
};

const Fork: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-black flex flex-col items-center justify-center p-4 md:p-12 overflow-hidden selection:bg-primary/20 relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[80px] md:blur-[150px] -translate-y-1/2"></div>
        <div className="absolute top-1/2 right-1/4 w-[40vw] h-[40vw] bg-blue-500/5 rounded-full blur-[80px] md:blur-[150px] -translate-y-1/2"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col h-full max-h-[800px]">
        {/* Minimalist Header */}
        <div className="text-center mb-6 md:mb-12 animate-fade-in flex-shrink-0">
          <h2 className="text-[9px] font-bold tracking-[0.8em] text-white/20 uppercase mb-2">
            Context Selection
          </h2>
          <div className="h-[1px] w-6 bg-card/10 mx-auto"></div>
          {user?.email && (
            <p className="text-[8px] text-zinc-700 mt-4 tracking-wider">
              Conectado como: {user.email}
            </p>
          )}
        </div>

        {/* Selection Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 items-stretch justify-items-center w-full px-2 overflow-hidden">
          <ContextCard
            title="Pessoal"
            subtitle="Gestão de Vida"
            theme="personal"
            onClick={() => navigate('/personal')}
          />

          <ContextCard
            title="Profissional"
            subtitle="gestão de trabalho"
            theme="professional"
            onClick={() => navigate('/professional')}
          />
        </div>

        {/* System Info & Logout */}
        <div className="mt-6 md:mt-12 flex flex-col items-center gap-4 md:gap-6 animate-fade-in animation-delay-500 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 text-[8px] font-bold tracking-[0.3em] uppercase text-zinc-600 hover:text-white transition-all py-1"
          >
            <LogOut
              size={10}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Sair do Sistema
          </button>

          <p className="text-[7px] md:text-[8px] font-bold tracking-[0.6em] text-zinc-800 uppercase">
            CarlOS OS • Build 2025.1.2 • Seguro
          </p>
        </div>
      </div>
    </div>
  );
};

export default Fork;
