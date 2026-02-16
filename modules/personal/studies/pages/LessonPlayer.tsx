import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronRight, MessageSquare, Paperclip, ChevronLeft } from 'lucide-react';

const LessonPlayer: React.FC = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [isCompleted, setIsCompleted] = useState(false);

  // Mock Data
  const lesson = {
    id: lessonId,
    title: 'Variáveis no Figma',
    description: 'Nesta aula vamos aprender como criar e gerenciar variáveis de cor, número e string para criar tokens semânticos.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    courseId: '1',
    nextLessonId: 'l4',
    prevLessonId: 'l2'
  };

  return (
    <div className="min-h-screen bg-[#1e1b19] text-stone-200 -m-6 md:-m-12 relative">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#2A2522]">
        <button 
          onClick={() => navigate(`/personal/studies/courses/${lesson.courseId}`)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Voltar ao Curso
        </button>
        <div className="hidden md:block text-sm font-medium text-white/80">{lesson.title}</div>
        <div className="w-24"></div> {/* Spacer */}
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        {/* Main Content (Video) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center">
          <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
            <iframe 
              width="100%" 
              height="100%" 
              src={lesson.videoUrl} 
              title="Video Player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="absolute inset-0"
            ></iframe>
          </div>

          <div className="w-full max-w-5xl mt-8">
            <div className="flex justify-between items-start gap-4 mb-6">
              <h1 className="text-2xl font-bold text-white">{lesson.title}</h1>
              <button 
                onClick={() => setIsCompleted(!isCompleted)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isCompleted ? 'bg-emerald-600 text-white' : 'bg-card/10 text-muted-foreground hover:bg-card/20'}`}
              >
                <CheckCircle2 size={16} />
                {isCompleted ? 'Concluída' : 'Marcar como Vista'}
              </button>
            </div>
            
            <p className="text-muted-foreground leading-relaxed text-sm mb-8 pb-8 border-b border-white/5">
              {lesson.description}
            </p>

            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-3 bg-card/5 rounded-xl text-muted-foreground text-xs font-bold uppercase tracking-wide hover:bg-card/10 transition-colors">
                <Paperclip size={16} /> Materiais (2)
              </button>
              <button className="flex items-center gap-2 px-4 py-3 bg-card/5 rounded-xl text-muted-foreground text-xs font-bold uppercase tracking-wide hover:bg-card/10 transition-colors">
                <MessageSquare size={16} /> Comentários
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation (Next/Prev) */}
        <div className="w-full lg:w-80 bg-[#241F1C] border-l border-white/5 p-6 flex flex-col justify-between">
           <div>
             <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Navegação</h3>
             <div className="space-y-4">
                {/* Mock List */}
                <div className="p-4 rounded-xl bg-card/5 border border-white/5 cursor-not-allowed opacity-50">
                  <p className="text-xs text-muted-foreground mb-1">Aula Anterior</p>
                  <p className="text-sm font-semibold text-white">Atomic Design</p>
                </div>
                
                <div className="p-4 rounded-xl bg-primary/20 border border-primary/30 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl"></div>
                  <p className="text-[10px] font-bold text-olive uppercase tracking-widest mb-1">Assistindo Agora</p>
                  <p className="text-sm font-semibold text-white">Variáveis no Figma</p>
                </div>

                <div 
                   onClick={() => navigate('/personal/studies/lessons/l4')}
                   className="p-4 rounded-xl bg-card/5 border border-white/5 hover:bg-card/10 cursor-pointer transition-colors group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-muted-foreground">Próxima Aula</p>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-white">Sincronização com Código</p>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;