
import React, { useRef, useState } from 'react';
import { FileText, Image as ImageIcon, File, Trash2, UploadCloud, Download, Loader2 } from 'lucide-react';
import { useClientFiles, useUploadFile, useDeleteFile } from '../../hooks/useClientFiles';
import { formatDateBr } from '../../../personal/finance/utils/dateHelpers';

export default function ClientFilesManager({ clientId }: { clientId: string }) {
  const { data: files, isLoading } = useClientFiles(clientId);
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutate: deleteFile } = useDeleteFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile({ file: e.target.files[0], clientId });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="text-[#D4D4D4]" size={24} />;
    if (type.includes('pdf')) return <FileText className="text-[#E09B6B]" size={24} />;
    return <File className="text-[#737373]" size={24} />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-[#202020] p-6 rounded-lg border border-[#404040] shadow-sm">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#E09B6B] flex items-center gap-2">
          <FileText size={14} /> Arquivos
        </h3>
        <button 
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#37352F] hover:bg-[#404040] text-[#D4D4D4] text-[10px] font-bold px-3 py-1.5 rounded-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 border border-[#404040]"
        >
          {isUploading ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
          {isUploading ? '...' : 'Upload'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileSelect} 
        />
      </div>

      {/* Lista de Arquivos */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {files?.map(file => (
          <div key={file.id} className="group relative bg-[#1A1A1A] p-3 rounded-md border border-[#404040] hover:border-[#737373] transition-all flex items-center gap-3">
            <div className="p-1.5 bg-[#2C2C2C] rounded-md shrink-0">
              {getFileIcon(file.file_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-[#E5E5E5] truncate" title={file.file_name}>
                {file.file_name}
              </h4>
              <p className="text-[10px] text-[#9ca3af] mt-0.5">
                {formatSize(file.file_size)} • {formatDateBr(file.created_at)}
              </p>
            </div>

            {/* Ações */}
            <div className="flex gap-1 shrink-0">
               <a 
                 href={file.file_url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="p-1.5 text-[#737373] hover:text-[#E09B6B] transition-colors"
                 title="Baixar"
               >
                 <Download size={14} />
               </a>
               <button 
                 onClick={() => deleteFile({ fileId: file.id, fileUrl: file.file_url })}
                 className="p-1.5 text-[#737373] hover:text-red-400 transition-colors"
                 title="Excluir"
               >
                 <Trash2 size={14} />
               </button>
            </div>
          </div>
        ))}

        {(!files || files.length === 0) && !isLoading && (
          <div className="py-6 text-center border border-dashed border-[#404040] rounded-lg text-[#5c5c5c]">
            <p className="text-xs">Nenhum arquivo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
