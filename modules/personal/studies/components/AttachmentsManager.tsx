import React, { useState, useRef } from 'react';
import { Paperclip, FileText, Image as ImageIcon, Trash2, Download, Loader2, Eye } from 'lucide-react';
import { useAttachments, Attachment } from '../hooks/useAttachments';
import { supabase } from '../../../../integrations/supabase/client';

interface AttachmentsManagerProps {
  lessonId: string;
  userId: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

export default function AttachmentsManager({ 
  lessonId, 
  userId, 
  attachments = [], // Default para array vazio
  onAttachmentsChange 
}: AttachmentsManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, deleteFile, getSignedUrl, uploading, uploadProgress } = useAttachments(lessonId, userId);

  // Garante que attachments seja sempre um array
  const safeAttachments = Array.isArray(attachments) ? attachments : [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const newAttachment = await uploadFile(file);
      if (!newAttachment) return;

      const updatedAttachments = [...safeAttachments, newAttachment];
      
      // Atualiza no banco de dados
      await supabase
        .from('lessons')
        .update({ attachments: updatedAttachments })
        .eq('id', lessonId);

      onAttachmentsChange(updatedAttachments);
      
      // Limpa o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao fazer upload do arquivo');
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Tem certeza que deseja excluir "${attachment.name}"?`)) return;

    try {
      await deleteFile(attachment.url);
      
      const updatedAttachments = safeAttachments.filter(a => a.id !== attachment.id);
      
      await supabase
        .from('lessons')
        .update({ attachments: updatedAttachments })
        .eq('id', lessonId);

      onAttachmentsChange(updatedAttachments);
    } catch (error: any) {
      alert('Erro ao excluir arquivo: ' + error.message);
    }
  };

  const handlePreview = async (attachment: Attachment) => {
  try {
    const url = await getSignedUrl(attachment.url);
    window.open(url, '_blank'); // Abre em nova aba
  } catch (error: any) {
    alert('Erro ao carregar preview: ' + error.message);
  }
};

  const handleDownload = async (attachment: Attachment) => {
    try {
      const url = await getSignedUrl(attachment.url);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      link.click();
    } catch (error: any) {
      alert('Erro ao baixar arquivo: ' + error.message);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
<div>
        <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Paperclip size={16} className="text-muted-foreground" />
          Anexos ({safeAttachments.length})
        </h3>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Enviando... {uploadProgress}%
            </>
          ) : (
            <>
              <Paperclip size={14} />
              Adicionar Arquivo
            </>
          )}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Lista de Anexos */}
      {safeAttachments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          Nenhum anexo adicionado. Clique em "Adicionar Arquivo" para começar.
        </p>
      ) : (
        <div className="space-y-2">
          {safeAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border hover:border-gray-300 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {attachment.type === 'pdf' ? (
                  <FileText size={20} className="text-red-500 flex-shrink-0" />
                ) : (
                  <ImageIcon size={20} className="text-blue-500 flex-shrink-0" />
                )}
                
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handlePreview(attachment)}
                  className="p-2 hover:bg-card rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  title="Visualizar"
                >
                  <Eye size={16} />
                </button>
                
                <button
                  onClick={() => handleDownload(attachment)}
                  className="p-2 hover:bg-card rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  title="Baixar"
                >
                  <Download size={16} />
                </button>
                
                <button
                  onClick={() => handleDelete(attachment)}
                  className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
  
    </div>
  );
}