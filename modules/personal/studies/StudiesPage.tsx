
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Library, ArrowRight } from 'lucide-react';
import ModuleHeader from '../../../shared/components/Navigation/ModuleHeader';

const HubCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}> = ({ title, subtitle, icon, onClick, color = "text-[#3C3633]" }) => (
  <button 
    onClick={onClick}
    className="group relative flex flex-col justify-between p-8 h-56 bg-[#FAF9F6] border border-[#E6E2DE] rounded-[2rem] hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/50 hover:-translate-y-1 transition-all duration-500 w-full text-left overflow-hidden"
  >
    <div className="absolute inset-0 bg-stone-50/0 group-hover:bg-stone-100/50 transition-colors duration-500"></div>

    <div className="relative z-10 flex justify-between items-start w-full">
       <div className={`${color} group-hover:opacity-80 transition-opacity duration-300`}>
         {React.cloneElement(icon as React.ReactElement<any>, { size: 32, strokeWidth: 1.5 })}
       </div>

       <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-500 text-[#8D6E63]">
         <ArrowRight size={20} />
       </div>
    </div>

    <div className="relative z-10 mt-auto">
      <h3 className="text-xl font-bold text-stone-700 mb-1 tracking-tight group-hover:text-[#3E2723] transition-colors">{title}</h3>
      <p className="text-sm text-stone-500 font-medium group-hover:text-stone-600 transition-colors">{subtitle}</p>
    </div>
  </button>
);

export default function StudiesPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen animate-fade-in font-sans pb-20 bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-8 pt-8">
        <ModuleHeader 
          title="Biblioteca de Estudos" 
          subtitle="Gestão de Conhecimento e Aprendizado"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <HubCard 
            title="Meus Cursos" 
            subtitle="Acompanhe aulas, módulos e progresso."
            icon={<Library />}
            onClick={() => navigate('/personal/studies/courses')}
            color="text-[#5F6F52]"
          />

          <HubCard 
            title="Buscar no Fichário" 
            subtitle="Encontre anotações em todo o acervo."
            icon={<Search />}
            onClick={() => navigate('/personal/studies/search')}
            color="text-[#8D6E63]"
          />

          {/* Placeholder para futuras features ou livros */}
          <button 
            className="flex flex-col items-center justify-center p-8 h-56 border-2 border-dashed border-stone-200 rounded-[2rem] hover:bg-stone-50 hover:border-stone-300 transition-all group"
            onClick={() => {}}
          >
            <div className="p-4 bg-stone-50 rounded-full text-stone-300 group-hover:text-stone-400 mb-4 transition-colors">
               <BookOpen size={24} />
            </div>
            <p className="text-stone-400 text-sm font-bold uppercase tracking-widest group-hover:text-stone-500">Em Breve: Leitura</p>
          </button>
        </div>
      </div>
    </div>
  );
};
