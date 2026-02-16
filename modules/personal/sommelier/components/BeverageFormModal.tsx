
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Wine, Star, Link as LinkIcon } from 'lucide-react';
import { Beverage, BeverageType } from '../types';
import { ImageUpload } from '../../../../shared/components/ui/ImageUpload';

interface BeverageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Beverage>) => Promise<void>;
  beverageToEdit?: Beverage | null;
}

const BEVERAGE_TYPES: Record<BeverageType, string> = {
  red_wine: 'Vinho Tinto',
  white_wine: 'Vinho Branco',
  rose_wine: 'Vinho Rosé',
  sparkling: 'Espumante/Champagne',
  beer: 'Cerveja Artesanal',
  whisky: 'Whisky',
  gin: 'Gin',
  other: 'Outro'
};

export const BeverageFormModal: React.FC<BeverageFormModalProps> = ({ isOpen, onClose, onSave, beverageToEdit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [producer, setProducer] = useState('');
  const [type, setType] = useState<BeverageType>('red_wine');
  const [grape, setGrape] = useState('');
  const [price, setPrice] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (beverageToEdit) {
        setName(beverageToEdit.name);
        setProducer(beverageToEdit.producer || '');
        setType(beverageToEdit.type);
        setGrape(beverageToEdit.grape || '');
        setPrice(beverageToEdit.price.toString());
        setRating(beverageToEdit.rating);
        setReview(beverageToEdit.review || '');
        setDate(beverageToEdit.consumed_date.split('T')[0]);
        setImageUrl(beverageToEdit.image_url || '');
      } else {
        // Reset
        setName('');
        setProducer('');
        setType('red_wine');
        setGrape('');
        setPrice('');
        setRating(0);
        setReview('');
        setDate(new Date().toISOString().split('T')[0]);
        setImageUrl('');
      }
      setShowUrlInput(false);
    }
  }, [isOpen, beverageToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        producer,
        type,
        grape,
        price: parseFloat(price) || 0,
        rating,
        review,
        consumed_date: date,
        image_url: imageUrl
      });
      onClose();
    } catch (error) {
      alert('Erro ao salvar bebida.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-muted-foreground z-10">
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="p-3 bg-rose-50 rounded-full text-rose-800">
            <Wine size={24} />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {beverageToEdit ? 'Editar Rótulo' : 'Nova Degustação'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Seção da Imagem */}
            <div className="flex flex-col items-center gap-2 shrink-0">
                <ImageUpload 
                    value={imageUrl}
                    onChange={setImageUrl}
                    bucketName="cellar-images"
                    className="w-32 h-40"
                />
                <button 
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
                >
                    <LinkIcon size={10} /> {showUrlInput ? 'Ocultar Link' : 'Colar URL'}
                </button>
                {showUrlInput && (
                    <input 
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-32 bg-secondary border border-border rounded-lg px-2 py-1 text-[10px] outline-none focus:border-stone-400"
                    />
                )}
            </div>

            {/* Campos Principais */}
            <div className="flex-1 space-y-4">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome do Rótulo</label>
                    <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Angelica Zapata Malbec"
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground outline-none focus:ring-2 focus:ring-rose-200 font-semibold"
                    autoFocus
                    />
                </div>

                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Produtor / Marca</label>
                    <input 
                    value={producer}
                    onChange={e => setProducer(e.target.value)}
                    placeholder="Ex: Catena Zapata"
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground outline-none focus:ring-2 focus:ring-rose-200"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tipo</label>
                        <select 
                            value={type}
                            onChange={e => setType(e.target.value as BeverageType)}
                            className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground outline-none focus:ring-2 focus:ring-rose-200 appearance-none cursor-pointer"
                        >
                            {Object.entries(BEVERAGE_TYPES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Uva / Estilo</label>
                        <input 
                        value={grape}
                        onChange={e => setGrape(e.target.value)}
                        placeholder="Ex: Malbec"
                        className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground outline-none focus:ring-2 focus:ring-rose-200"
                        />
                    </div>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Preço Pago (R$)</label>
                <input 
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground outline-none focus:ring-2 focus:ring-rose-200"
                />
            </div>
            <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Data da Experiência</label>
                <input 
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground outline-none focus:ring-2 focus:ring-rose-200"
                />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Avaliação</label>
            <div className="flex gap-2 justify-center bg-secondary p-3 rounded-xl border border-border">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                    >
                        <Star 
                            size={28} 
                            className={star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} 
                            strokeWidth={1.5}
                        />
                    </button>
                ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Minha Opinião</label>
            <textarea 
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder="O que achou? Notas de sabor, harmonização..."
              rows={3}
              className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground outline-none focus:ring-2 focus:ring-rose-200 resize-none"
            />
          </div>

          <div className="pt-2">
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#3C3633] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
            >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                Salvar Rótulo
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
