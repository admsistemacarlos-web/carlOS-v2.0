
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mic2, PenTool, Heart, ArrowRight, Music, Library } from 'lucide-react';

const HubCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, subtitle, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="group relative flex flex-col justify-between p-8 h-48 bg-[#FAF9F6] border border-[#E6E2DE] rounded-[2rem] hover:border-stone-400 hover:shadow-xl hover:shadow-stone-200/50 hover:-translate-y-1 transition-all duration-500 w-full text-left overflow-hidden"
  >
    {/* Efeito de aquecimento no hover (background sutil - Stone) */}
    <div className="absolute inset-0 bg-stone-50/0 group-hover:bg-stone-100/50 transition-colors duration-500"></div>

    <div className="relative z-10 flex justify-between items-start w-full">
       {/* Ícone Solto - Cor Marrom Couro -> Marrom Café */}
       <div className="text-[#8D6E63] group-hover:text-[#5D4037] transition-colors duration-300">
         {React.cloneElement(icon as React.ReactElement<any>, { size: 32, strokeWidth: 1.5 })}
       </div>

       {/* Seta indicativa discreta que aparece no hover */}
       <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-500 text-[#8D6E63]">
         <ArrowRight size={20} />
       </div>
    </div>

    <div className="relative z-10 mt-auto">
      {/* Tipografia Café */}
      <h3 className="text-xl font-bold text-stone-700 mb-1 tracking-tight group-hover:text-[#3E2723] transition-colors">{title}</h3>
      <p className="text-sm text-stone-500 font-medium group-hover:text-stone-600 transition-colors">{subtitle}</p>
    </div>
  </button>
);

export default function SpiritualHub() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen animate-fade-in font-sans pb-20 bg-[#FAF9F6]">
      
      {/* Header com Paleta Café */}
      <div className="w-full px-8 pt-10 pb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-1 bg-[#5D4037] rounded-full"></div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5D4037]">Vida Espiritual</p>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-800 tracking-tighter mb-3">
          Edificação & <span className="text-stone-400 font-serif italic">Propósito</span>
        </h1>
        <p className="text-stone-500 text-sm max-w-lg leading-relaxed">
          Gerencie sua jornada de fé, estudos e orações em um ambiente desenhado para a reflexão.
        </p>
      </div>

      {/* Grid Navigation - Expandido para comportar 6 itens */}
      <div className="w-full px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        
        <HubCard 
          title="Leitura Bíblica" 
          subtitle="Acompanhe seu progresso diário"
          icon={<BookOpen />}
          onClick={() => navigate('/personal/spiritual/reading')}
        />

        <HubCard 
          title="Pregações & Cultos" 
          subtitle="Anotações de mensagens"
          icon={<Mic2 />}
          onClick={() => navigate('/personal/spiritual/sermons')}
        />

        <HubCard 
          title="Meus Estudos" 
          subtitle="Aprofundamento teológico"
          icon={<PenTool />}
          onClick={() => navigate('/personal/spiritual/studies')}
        />

        <HubCard 
          title="Biblioteca de Oração" 
          subtitle="Modelos e inspirações"
          icon={<Heart />}
          onClick={() => navigate('/personal/spiritual/prayers')}
        />

        {/* Novos Cards */}
        <HubCard 
          title="Hinos & Louvores" 
          subtitle="Letras e repertório musical"
          icon={<Music />}
          onClick={() => navigate('/personal/spiritual/hymns')}
        />

        <HubCard 
          title="Biblioteca de Livros" 
          subtitle="Leituras e resumos cristãos"
          icon={<Library />}
          onClick={() => navigate('/personal/spiritual/books')}
        />

      </div>
    </div>
  );
}
