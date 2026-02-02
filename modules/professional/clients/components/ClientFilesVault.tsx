
import React, { useRef } from 'react';
import { FileText, Trash2, Plus, Download, Loader2, Image as ImageIcon, Paperclip } from 'lucide-react';
import { useClientFiles, useUploadFile, useDeleteFile } from '../../hooks/useClientFiles';

export default function ClientFilesVault({ clientId }: { clientId: string }) {
  const { data: files, isLoading } = useClientFiles(clientId);
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutate: deleteFile, isPending: isDeleting } = useDeleteFile();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile({ file, clientId });
    }
    // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon size={14} />;
    if (type.includes('pdf')) return <FileText size={14} />;
    return <Paperclip size={14} />;
  };

  return (
    <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-700/50 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
          <Paperclip size={14} /> Arquivos & Contratos
        </h3>
        
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} 
          {isUploading ? 'Enviando...' : 'Upload'}
        </button>
      </div>

      {/* Lista de Arquivos */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
        {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-600" /></div>
        ) : files?.map(file => (
          <div key={file.id} className="group flex items-center justify-between p-3 rounded-xl bg-[#1e293b] border border-slate-800 hover:border-slate-600 transition-all">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                {getFileIcon(file.file_type)}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-200 truncate pr-2">{file.file_name}</h4>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a 
                href={file.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-slate-500 hover:text-amber-400 transition-colors"
                title="Baixar / Visualizar"
              >
                <Download size={14} />
              </a>

              <button 
                onClick={() => deleteFile({ fileId: file.id, fileUrl: file.file_url })}
                disabled={isDeleting}
                className="p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        
        {(!files || files.length === 0) && !isLoading && (
          <div className="text-center py-8 text-slate-500 text-xs italic border-2 border-dashed border-slate-800 rounded-xl">
            Nenhum arquivo anexado.
          </div>
        )}
      </div>
    </div>
  );
}