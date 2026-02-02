
import React, { useState, useRef } from 'react';
import { Image, Loader2, Upload, X, Camera } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucketName?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  value, 
  onChange, 
  bucketName = 'book-covers',
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);

      // Obter usuário atual para o caminho do storage (RLS Requirement)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // FIX: Prefixar com o ID do usuário para satisfazer a política de RLS do Storage
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
    } catch (error: any) {
      console.error('Erro no upload:', error);
      alert('Erro no upload: ' + (error.message || 'Verifique as permissões de acesso.'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative group cursor-pointer overflow-hidden transition-all duration-300
          ${value 
            ? 'border-0' 
            : 'border-2 border-dashed border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100'
          }
          w-32 h-48 md:w-40 md:h-56 rounded-xl flex flex-col items-center justify-center text-center
        `}
      >
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleUpload}
          ref={fileInputRef}
          disabled={uploading}
        />

        {value ? (
          <>
            <img 
              src={value} 
              alt="Capa" 
              className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105" 
            />
            {/* Overlay de Hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <Camera className="text-white" size={24} />
            </div>
            {/* Botão Remover */}
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-md hover:bg-red-50 transition-colors z-10 opacity-0 group-hover:opacity-100"
              title="Remover imagem"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="p-4 flex flex-col items-center gap-3 text-stone-400 group-hover:text-stone-600">
            {uploading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <div className="p-3 bg-white rounded-full shadow-sm">
                   <Image size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Adicionar Imagem
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
