
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../../integrations/supabase/client";
import { useAuth } from "../../../../contexts/AuthContext";
import { bibleBooks, TOTAL_CHAPTERS } from "../data/bibleBooks";

export type ReadingProgress = Record<string, number[]>;

export function useReadingProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ReadingProgress>({});
  const [loading, setLoading] = useState(true);

  // Carregar progresso do Supabase
  useEffect(() => {
    if (!user) return;

    const fetchProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('bible_progress')
          .select('book_name, chapters');

        if (error) throw error;

        // Converter array do banco para objeto Map { "Gênesis": [1, 2], ... }
        const progressMap: ReadingProgress = {};
        data?.forEach((row) => {
          if (row.chapters && row.chapters.length > 0) {
            progressMap[row.book_name] = row.chapters;
          }
        });

        setProgress(progressMap);
      } catch (error) {
        console.error("Erro ao carregar leitura bíblica:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

  // Salvar no Banco (Upsert)
  const saveToDb = useCallback(async (bookName: string, chapters: number[]) => {
    if (!user) return;
    
    // Optimistic Update já aconteceu no estado local, agora persistimos
    try {
      const { error } = await supabase
        .from('bible_progress')
        .upsert(
          { 
            user_id: user.id, 
            book_name: bookName, 
            chapters: chapters,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id, book_name' }
        );

      if (error) throw error;
    } catch (err) {
      console.error("Erro ao salvar progresso:", err);
    }
  }, [user]);

  const toggleChapter = useCallback((bookName: string, chapter: number) => {
    setProgress((prev) => {
      const bookProgress = prev[bookName] || [];
      const isRead = bookProgress.includes(chapter);
      
      const newChapters = isRead
        ? bookProgress.filter((c) => c !== chapter)
        : [...bookProgress, chapter].sort((a, b) => a - b); // Manter ordenado

      // Disparar salvamento assíncrono
      saveToDb(bookName, newChapters);

      return {
        ...prev,
        [bookName]: newChapters,
      };
    });
  }, [saveToDb]);

  const isChapterRead = useCallback(
    (bookName: string, chapter: number) => {
      return progress[bookName]?.includes(chapter) || false;
    },
    [progress]
  );

  const getBookProgress = useCallback(
    (bookName: string, totalChapters: number) => {
      const read = progress[bookName]?.length || 0;
      return {
        read,
        total: totalChapters,
        percentage: totalChapters > 0 ? Math.round((read / totalChapters) * 100) : 0,
      };
    },
    [progress]
  );

  const getTotalProgress = useCallback(() => {
    const totalRead = Object.values(progress).reduce<number>(
      (acc, chapters) => acc + (Array.isArray(chapters) ? chapters.length : 0),
      0
    );
    return {
      read: totalRead,
      total: TOTAL_CHAPTERS,
      percentage: TOTAL_CHAPTERS > 0 ? Math.round((totalRead / TOTAL_CHAPTERS) * 100) : 0,
    };
  }, [progress]);

  const resetProgress = useCallback(async () => {
    if (!user) return;
    
    setProgress({});
    
    try {
      // Deletar todos os registros desse usuário na tabela
      await supabase.from('bible_progress').delete().eq('user_id', user.id);
    } catch (err) {
      console.error("Erro ao resetar:", err);
    }
  }, [user]);

  const resetBookProgress = useCallback(async (bookName: string) => {
    setProgress((prev) => {
      const { [bookName]: _, ...rest } = prev;
      return rest;
    });
    saveToDb(bookName, []);
  }, [saveToDb]);

  const markBookComplete = useCallback(async (bookName: string, totalChapters: number) => {
    const allChapters = Array.from({ length: totalChapters }, (_, i) => i + 1);
    
    setProgress((prev) => ({
      ...prev,
      [bookName]: allChapters,
    }));
    
    saveToDb(bookName, allChapters);
  }, [saveToDb]);

  return {
    loading,
    progress,
    toggleChapter,
    isChapterRead,
    getBookProgress,
    getTotalProgress,
    resetProgress,
    resetBookProgress,
    markBookComplete,
  };
}
