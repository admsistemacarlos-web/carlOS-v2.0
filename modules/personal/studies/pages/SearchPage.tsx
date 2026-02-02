import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  Search, ArrowLeft, BookOpen, Layers, FileText, 
  Loader2, ChevronRight, X 
} from 'lucide-react';

// --- TYPES ---
interface SearchResultCourse {
  id: string;
  title: string;
  category: string | null;
  type: 'course';
}

interface SearchResultModule {
  id: string;
  title: string;
  course_id: string;
  courses: { title: string } | null; // Join
  type: 'module';
}

interface SearchResultLesson {
  id: string;
  title: string;
  content: string | null;
  module_id: string;
  modules: {
    title: string;
    courses: { title: string } | null;
  } | null;
  type: 'lesson';
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    courses: SearchResultCourse[];
    modules: SearchResultModule[];
    lessons: SearchResultLesson[];
  }>({ courses: [], modules: [], lessons: [] });

  // --- LOGIC: Snippet Generator ---
  const getHighlightSnippet = (text: string | null, term: string) => {
    if (!text || !term) return null;
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);

    if (index === -1) return null; // Termo encontrado apenas no título, não no conteúdo

    const start = Math.max(0, index - 40);
    const end = Math.min(text.length, index + term.length + 60);
    
    let snippet = text.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  };

  // --- LOGIC: Search Engine ---
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!user || !searchTerm.trim()) {
      setResults({ courses: [], modules: [], lessons: [] });
      return;
    }

    setLoading(true);
    const term = searchTerm.trim();
    const searchPattern = `%${term}%`;

    try {
      // 1. Search Courses (Title or Description)
      const coursesPromise = supabase
        .from('courses')
        .select('id, title, category')
        .eq('user_id', user.id)
        .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .limit(5);

      // 2. Search Modules (Title)
      const modulesPromise = supabase
        .from('modules')
        .select(`
          id, title, course_id,
          courses (title)
        `)
        .eq('user_id', user.id)
        .ilike('title', searchPattern)
        .limit(5);

      // 3. Search Lessons (Title OR Content)
      const lessonsPromise = supabase
        .from('lessons')
        .select(`
          id, title, content, module_id,
          modules (
            title,
            courses (title)
          )
        `)
        .eq('user_id', user.id)
        .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
        .limit(20); // Mais limite para encontrar anotações

      const [coursesRes, modulesRes, lessonsRes] = await Promise.all([
        coursesPromise,
        modulesPromise,
        lessonsPromise
      ]);

      setResults({
        courses: (coursesRes.data as any[])?.map(c => ({ ...c, type: 'course' })) || [],
        modules: (modulesRes.data as any[])?.map(m => ({ ...m, type: 'module' })) || [],
        lessons: (lessonsRes.data as any[])?.map(l => ({ ...l, type: 'lesson' })) || [],
      });

    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // --- EFFECT: Debounce ---
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  // --- RENDER HELPERS ---
  const hasResults = results.courses.length > 0 || results.modules.length > 0 || results.lessons.length > 0;
  const isIdle = !query.trim();

  return (
    <div className="min-h-screen w-full bg-cream text-coffee font-sans animate-fade-in pb-20">
      
      {/* HEADER & INPUT AREA (Static flow) */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        
        {/* Navigation */}
        <div className="flex items-center gap-2 mb-6">
          <button 
            onClick={() => navigate('/personal/studies')}
            className="p-2 -ml-2 rounded-full hover:bg-stone-100 text-cappuccino transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-cappuccino">Voltar para Biblioteca</span>
        </div>

        {/* Page Title */}
        <h1 className="text-3xl font-serif italic text-coffee mb-6 tracking-tight">Buscar no Fichário</h1>
        
        {/* Search Input Container */}
        <div className="relative group mb-10">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-olive transition-colors">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          </div>
          <input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por títulos, módulos ou conteúdo..."
            className="w-full bg-white border border-stone-200 rounded-[1.5rem] pl-14 pr-12 py-5 text-lg text-coffee placeholder-stone-300 outline-none focus:ring-2 focus:ring-olive/10 focus:border-olive/30 transition-all shadow-sm"
          />
          {query && (
            <button 
              onClick={() => { setQuery(''); setResults({ courses: [], modules: [], lessons: [] }); }}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-100 text-stone-300 hover:text-coffee transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="max-w-4xl mx-auto px-6 space-y-10">

        {/* Estado Inicial */}
        {isIdle && (
          <div className="flex flex-col items-center justify-center py-12 text-stone-300 border-2 border-dashed border-stone-100 rounded-[2rem]">
            <Search size={48} className="mb-4 opacity-50" />
            <p className="text-sm font-medium text-center">
              Digite acima para buscar em<br/>toda sua base de conhecimento.
            </p>
          </div>
        )}

        {/* Sem Resultados */}
        {!isIdle && !loading && !hasResults && (
          <div className="text-center py-12">
            <p className="text-stone-400 text-sm">Nenhum resultado encontrado para "{query}".</p>
          </div>
        )}

        {/* --- SECTION: COURSES --- */}
        {results.courses.length > 0 && (
          <section className="animate-fade-in">
            <h2 className="text-sm font-bold text-coffee uppercase tracking-widest mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-olive" /> Cursos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.courses.map(course => (
                <button 
                  key={course.id}
                  onClick={() => navigate(`/personal/studies/courses/${course.id}`)}
                  className="flex flex-col items-start p-6 bg-white hover:bg-stone-50 rounded-[1.5rem] border border-stone-100 shadow-sm hover:shadow-md transition-all text-left group w-full"
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1 bg-stone-100 px-2 py-0.5 rounded-md">
                    {course.category || 'Geral'}
                  </span>
                  <h3 className="text-lg font-bold text-coffee group-hover:text-olive transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* --- SECTION: MODULES --- */}
        {results.modules.length > 0 && (
          <section className="animate-fade-in">
            <h2 className="text-sm font-bold text-coffee uppercase tracking-widest mb-4 flex items-center gap-2">
              <Layers size={16} className="text-olive" /> Módulos
            </h2>
            <div className="space-y-3">
              {results.modules.map(module => (
                <button 
                  key={module.id}
                  onClick={() => navigate(`/personal/studies/courses/${module.course_id}`)}
                  className="flex items-center justify-between w-full p-5 bg-white hover:bg-stone-50 rounded-[1.5rem] border border-stone-100 shadow-sm transition-all text-left group"
                >
                  <div>
                    <h3 className="font-bold text-coffee group-hover:text-olive transition-colors">{module.title}</h3>
                    <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                      Em: <span className="font-medium text-stone-500">{module.courses?.title}</span>
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-stone-300 group-hover:text-olive transition-colors" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* --- SECTION: LESSONS (ANNOTATIONS) --- */}
        {results.lessons.length > 0 && (
          <section className="animate-fade-in">
            <h2 className="text-sm font-bold text-coffee uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={16} className="text-olive" /> Aulas & Anotações
            </h2>
            <div className="space-y-4">
              {results.lessons.map(lesson => {
                const snippet = getHighlightSnippet(lesson.content, query);
                
                return (
                  <button 
                    key={lesson.id}
                    onClick={() => navigate(`/personal/studies/lessons/${lesson.id}`)}
                    className="flex flex-col w-full p-6 bg-white rounded-[1.5rem] border border-stone-100 shadow-sm hover:shadow-lg transition-all text-left group hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between w-full mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-coffee group-hover:text-olive transition-colors">
                          {lesson.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-stone-400 mt-1">
                          <span className="font-medium">{lesson.modules?.courses?.title}</span>
                          <span>•</span>
                          <span>{lesson.modules?.title}</span>
                        </div>
                      </div>
                      <div className="bg-cream p-2 rounded-xl text-olive group-hover:bg-olive group-hover:text-white transition-colors">
                        <FileText size={18} />
                      </div>
                    </div>

                    {/* Content Snippet */}
                    {snippet && (
                      <div className="w-full mt-2 p-3 bg-stone-50 rounded-xl border-l-2 border-olive/30 text-sm text-stone-600 font-serif italic leading-relaxed">
                        "{snippet}"
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}