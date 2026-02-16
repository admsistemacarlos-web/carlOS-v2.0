
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Heart, CheckCircle2, Loader2, X, Trash2, Clock } from 'lucide-react';
import { useSpiritual } from '../hooks/useSpiritual';
import { formatDateBr } from '../../finance/utils/dateHelpers';

interface Prayer {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'answered' | 'archived';
  created_at: string;
  answered_at?: string;
}

export default function PrayersPage() {
  const navigate = useNavigate();
  const { data: prayers, loading, fetchData, createItem, deleteItem, updateItem } = useSpiritual<Prayer>('prayer_requests');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  useEffect(() => { fetchData(); }, [fetchData]);

  const activePrayers = prayers.filter(p => p.status === 'active');
  const answeredPrayers = prayers.filter(p => p.status === 'answered');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createItem({ ...form, status: 'active' });
    setForm({ title: '', description: '' });
    setIsModalOpen(false);
  };

  const markAsAnswered = async (id: string) => {
    await updateItem(id, { 
        status: 'answered', 
        answered_at: new Date().toISOString() 
    });
  };

  return (
    <div className="w-full min-h-screen pb-20 animate-fade-in font-sans">
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <button onClick={() => navigate('/personal/spiritual')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-blue-600 transition-colors mb-4">
            <ArrowLeft size={14} /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Heart className="text-rose-500 fill-rose-500" /> Lista de Oração
          </h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-rose-200 transition-all active:scale-95">
          <Plus size={18} /> Novo Pedido
        </button>
      </div>

      <div className="px-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Ativas */}
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} /> Em Oração ({activePrayers.length})
            </h2>
            
            {loading ? <Loader2 className="animate-spin text-rose-500" /> : activePrayers.map(prayer => (
                <div key={prayer.id} className="bg-card p-5 rounded-2xl border border-border shadow-sm flex gap-4 group">
                    <button 
                        onClick={() => markAsAnswered(prayer.id)}
                        className="w-6 h-6 mt-1 rounded-full border-2 border-border hover:border-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all shrink-0"
                        title="Marcar como respondida"
                    >
                        <CheckCircle2 size={14} className="text-transparent hover:text-rose-500" />
                    </button>
                    <div className="flex-1">
                        <h3 className="font-bold text-foreground">{prayer.title}</h3>
                        {prayer.description && <p className="text-sm text-muted-foreground mt-1">{prayer.description}</p>}
                        <p className="text-[10px] text-slate-300 mt-3 font-medium uppercase tracking-wider">{formatDateBr(prayer.created_at)}</p>
                    </div>
                    <button onClick={() => deleteItem(prayer.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all h-fit"><Trash2 size={16} /></button>
                </div>
            ))}
            {!loading && activePrayers.length === 0 && <p className="text-muted-foreground text-sm italic">Sua lista de oração está vazia.</p>}
        </div>

        {/* Respondidas */}
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={16} /> Respondidas ({answeredPrayers.length})
            </h2>
            
            {answeredPrayers.map(prayer => (
                <div key={prayer.id} className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 flex gap-4 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 mt-1 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={14} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-foreground line-through decoration-emerald-300">{prayer.title}</h3>
                        {prayer.description && <p className="text-sm text-muted-foreground mt-1">{prayer.description}</p>}
                        <p className="text-[10px] text-emerald-600 mt-3 font-medium uppercase tracking-wider">
                            Respondida em {formatDateBr(prayer.answered_at)}
                        </p>
                    </div>
                    <button onClick={() => deleteItem(prayer.id)} className="text-slate-300 hover:text-red-500 transition-all h-fit"><Trash2 size={16} /></button>
                </div>
            ))}
        </div>

      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl animate-fade-in p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-foreground">Novo Pedido</h2>
                <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input required autoFocus placeholder="Motivo da oração..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-50 border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-200 outline-none" />
                <textarea rows={4} placeholder="Detalhes (opcional)..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-50 border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-200 outline-none resize-none" />
                <button type="submit" className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">Adicionar à Lista</button>
            </form>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
