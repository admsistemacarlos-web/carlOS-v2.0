
import React from 'react';
import { Briefcase, Clock, CheckCircle } from 'lucide-react';

const StatBox: React.FC<{ 
  title: string; 
  value: string; 
  description: string; 
  icon: React.ReactNode; 
  accentColor: string 
}> = ({ title, value, description, icon, accentColor }) => (
  <div className="bg-[#2C2C2C] border border-[#404040] p-6 rounded-lg hover:bg-[#323232] transition-colors">
     <div className="flex items-center gap-4 mb-4">
        <div className={`p-2 rounded-md bg-[#37352F] ${accentColor}`}>
          {icon}
        </div>
        <h3 className="text-base font-bold text-[#FFFFFF]">{title}</h3>
     </div>
     <p className="text-[#9ca3af] text-sm leading-relaxed mb-6 h-10">{description}</p>
     <div className="pt-4 border-t border-[#404040] flex justify-between items-center">
       <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Total</span>
       <span className={`text-xl font-bold font-mono ${accentColor}`}>{value}</span>
     </div>
  </div>
);

const AgencyDashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <StatBox 
          title="Backlog" 
          value="08" 
          description="Tarefas pendentes de aprovação ou aguardando recursos para início imediato."
          icon={<Clock size={18} />}
          accentColor="text-[#E09B6B]" // Bronze
        />

        <StatBox 
          title="Em Execução" 
          value="04" 
          description="Foco atual da equipe. Projetos em fase de design e desenvolvimento."
          icon={<Briefcase size={18} />}
          accentColor="text-[#D4D4D4]" // Light Grey
        />

        <StatBox 
          title="Concluídos" 
          value="15" 
          description="Entregas de sucesso realizadas este mês. Histórico de performance."
          icon={<CheckCircle size={18} />}
          accentColor="text-[#5D4037]" // Coffee Brown (used text color here for contrast on icon, or keep light grey)
        />

      </div>
    </div>
  );
};

export default AgencyDashboard;
