import { useState } from 'react';
import { supabase } from '../../../../integrations/supabase/client';

export interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  url: string;
  size: number;
  uploaded_at: string;
}

export function useAttachments(lessonId: string, userId: string) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File): Promise<Attachment | null> => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Validação de tipo
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp',
        'image/gif'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido. Use PDF ou imagens (JPG, PNG, WEBP, GIF)');
      }

      // Validação de tamanho (50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 50MB');
      }

      // Gera nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${userId}/${lessonId}/${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('lesson-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter URL pública (signed URL para bucket privado)
      const { data: urlData } = await supabase.storage
        .from('lesson-attachments')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10); // 10 anos

      if (!urlData?.signedUrl) throw new Error('Erro ao gerar URL do arquivo');

      // Criar objeto de attachment
      const attachment: Attachment = {
        id: `${timestamp}`,
        name: file.name,
        type: file.type === 'application/pdf' ? 'pdf' : 'image',
        url: filePath, // Salvamos o path, não a signed URL
        size: file.size,
        uploaded_at: new Date().toISOString()
      };

      setUploadProgress(100);
      return attachment;

    } catch (error: any) {
      console.error('Erro no upload:', error);
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteFile = async (filePath: string): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from('lesson-attachments')
        .remove([filePath]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao deletar arquivo:', error);
      throw error;
    }
  };

  const getSignedUrl = async (filePath: string): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from('lesson-attachments')
        .createSignedUrl(filePath, 60 * 60); // 1 hora

      if (error || !data?.signedUrl) throw new Error('Erro ao gerar URL');
      return data.signedUrl;
    } catch (error: any) {
      console.error('Erro ao gerar URL:', error);
      throw error;
    }
  };

  return {
    uploadFile,
    deleteFile,
    getSignedUrl,
    uploading,
    uploadProgress
  };
}