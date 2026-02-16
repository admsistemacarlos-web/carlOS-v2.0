
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Scale, Activity, Frown, Smile, Loader2, Zap, ZapOff, Check, X } from 'lucide-react';
import { supabase } from '../../../../integrations/supabase/client';
import { useAuth } from '../../../../contexts/AuthContext';

export default function WellnessEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const queryParams = new URLSearchParams(location.search);
  const initialDate = queryParams.get('date');

  const [date, setDate] = useState(initialDate || new Date().toLocaleDateString('en-CA'));
  
  // Controle de Pesagem
  const [weighedToday, setWeighedToday] = useState(false);
  const [weight, setWeight] = useState('');
  
  const [workoutDone, setWorkoutDone] = useState(false);
  const [workoutType, setWorkoutType] = useState('Futevôlei');
  const [headache, setHeadache] = useState(false);
  const [energyDrinkConsumed, setEnergyDrinkConsumed] = useState(false);
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    const fetchEntry = async () => {
      try {
        const { data, error } = await supabase
          .from('health_wellness_logs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setDate(new Date(data.date).toISOString().split('T')[0]);
          
          if (data.weight) {
            setWeighedToday(true);
            setWeight(String(data.weight));
          } else {
            setWeighedToday(false);
            setWeight('');
          }

          setWorkoutDone(data.workout_done);
          setWorkoutType(data.workout_type || 'Futevôlei');
          setHeadache(data.headache);
          setEnergyDrinkConsumed(data.energy_drink_consumed);
          setNotes(data.notes || '');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao carregar registro.');
        navigate('/personal/health/wellness');
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [id, user, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    const [year, month, day] = date.split('-').map(Number);
    const dateToSave = new Date(year, month - 1, day, 12, 0, 0).toISOString();

    const payload = {
      date: dateToSave,
      weight: weighedToday && weight ? parseFloat(weight) : null,
      workout_done: workoutDone,
      workout_type: workoutDone ? workoutType : null,
      headache: headache,
      energy_drink_consumed: energyDrinkConsumed,
      notes: notes,
      user_id: user.id
    };

    try {
      if (id) {
        const { error } = await supabase
          .from('health_wellness_logs')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('health_wellness_logs')
          .insert(payload);
        if (error) throw error;
      }
      navigate('/personal/health/wellness');
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-sans text-foreground animate-fade-in flex flex-col items-center">
      
      <div className="w-full max-w-md p-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/personal/health/wellness')}
            className="p-2 -ml-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-foreground">{id ? 'Editar Registro' : 'Novo Registro'}</h1>
          <div className="w-8" />
        </div>

        <div className="mb-8 flex justify-center">
            <div className="relative">
                <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-card border border-border rounded-xl px-4 py-2 text-foreground font-bold outline-none focus:border-primary shadow-sm cursor-pointer"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={16} />
            </div>
        </div>

        <div className="space-y-6">
            <div 
                className={`p-6 rounded-[1.5rem] border shadow-sm transition-all duration-500 cursor-pointer ${
                    !energyDrinkConsumed 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'bg-card border-border'
                }`}
                onClick={() => setEnergyDrinkConsumed(!energyDrinkConsumed)}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-1 ${!energyDrinkConsumed ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                           {energyDrinkConsumed ? <Zap size={14} className="text-yellow-600" /> : <ZapOff size={14} className="text-primary-foreground" />} 
                           Energético
                        </label>
                        <p className={`text-sm font-medium ${!energyDrinkConsumed ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                            {energyDrinkConsumed ? 'Recaída no dia (- R$ 9,00)' : 'Não tomei no dia (+ R$ 9,00)'}
                        </p>
                    </div>
                    <div className={`w-12 h-7 rounded-full relative transition-colors ${energyDrinkConsumed ? 'bg-accent' : 'bg-black/30'}`}>
                        <div className={`w-5 h-5 bg-card rounded-full absolute top-1 transition-transform shadow-sm ${energyDrinkConsumed ? 'left-6' : 'left-1'}`} />
                    </div>
                </div>
            </div>

            <div className="bg-card p-6 rounded-[1.5rem] border border-border shadow-sm space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            <Scale size={14} /> Controle de Peso
                        </label>
                        
                        <button 
                            onClick={() => setWeighedToday(!weighedToday)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                weighedToday 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-secondary text-muted-foreground'
                            }`}
                        >
                            {weighedToday ? (
                                <><Check size={12} /> Me Pesei</>
                            ) : (
                                <><X size={12} /> Não me Pesei</>
                            )}
                        </button>
                    </div>

                    {weighedToday ? (
                        <div className="animate-fade-in">
                            <input 
                                type="number" 
                                step="0.1" 
                                value={weight} 
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="0.0" 
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-full text-4xl font-bold text-primary placeholder-stone-200 bg-transparent outline-none text-center"
                                autoFocus
                            />
                            <p className="text-center text-[10px] text-muted-foreground font-bold uppercase mt-1">Quilogramas</p>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm italic border-2 border-dashed border-border rounded-xl">
                            Registro de peso ignorado hoje.
                        </div>
                    )}
                </div>

                <div className="h-px bg-secondary" />
                
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dor de Cabeça?</label>
                    <div className="flex bg-secondary rounded-xl p-1 border border-border">
                        <button 
                            onClick={() => setHeadache(false)}
                            className={`p-3 rounded-lg transition-all ${!headache ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}
                        >
                            <Smile size={24} />
                        </button>
                        <button 
                            onClick={() => setHeadache(true)}
                            className={`p-3 rounded-lg transition-all ${headache ? 'bg-card text-red-500 shadow-sm' : 'text-muted-foreground'}`}
                        >
                            <Frown size={24} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-card p-6 rounded-[1.5rem] border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <Activity size={14} /> Treino Realizado?
                    </label>
                    <button 
                        onClick={() => setWorkoutDone(!workoutDone)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${workoutDone ? 'bg-primary' : 'bg-accent'}`}
                    >
                        <div className={`w-5 h-5 bg-card rounded-full absolute top-1 transition-transform shadow-sm ${workoutDone ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
                {workoutDone && (
                    <div className="animate-fade-in">
                        <input 
                            value={workoutType}
                            onChange={(e) => setWorkoutType(e.target.value)}
                            className="w-full bg-secondary border border-border rounded-xl p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#143d2d]/20 transition-all"
                            placeholder="Qual atividade?"
                        />
                    </div>
                )}
            </div>

            <div className="bg-card p-6 rounded-[1.5rem] border border-border shadow-sm">
                <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações do dia..."
                    className="w-full bg-transparent outline-none text-sm text-muted-foreground placeholder-stone-300 resize-none h-24"
                />
            </div>

            <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl text-sm font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {id ? 'Atualizar Registro' : 'Salvar Registro'}
            </button>
        </div>
      </div>
    </div>
  );
}
