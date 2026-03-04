import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, FileText, Layout, ShieldCheck } from 'lucide-react';
import { useProposalTemplate, useSaveProposalTemplate } from '../hooks/useQuotes';

export default function ProposalTemplatePage() {
  const navigate = useNavigate();
  const { data: template, isLoading } = useProposalTemplate();
const saveTemplate = useSaveProposalTemplate();

  const [formData, setFormData] = useState({
    name: 'Modelo Padrão QuattroNove',
    intro_default: '',
    strategy_default: '',
    terms_default: ''
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || 'Modelo Padrão QuattroNove',
        intro_default: template.intro_default || '',
        strategy_default: template.strategy_default || '',
        terms_default: template.terms_default || ''
      });
    }
  }, [template]);

  const handleSave = async () => {
    try {
    await saveTemplate.mutateAsync({
  proposal_intro_default: formData.intro_default,
  proposal_strategy_default: formData.strategy_default,
  proposal_terms_default: formData.terms_default
});
      alert("Modelo comercial atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o modelo.");
    }
  };

  if (isLoading) return <div className="p-10 text-muted-foreground flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-8 pt-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Modelo de Proposta</h1>
            <p className="text-muted-foreground text-xs">Defina a estrutura padrão para seus orçamentos.</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saveTemplate.isPending}
          className="bg-[hsl(var(--spiritual))] hover:bg-[hsl(var(--spiritual-dark))] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
        >
          {saveTemplate.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Salvar Modelo
        </button>
      </div>

      <div className="space-y-6">
        {/* Seção Apresentação */}
        <div className="bg-card border border-secondary rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Layout size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Texto de Apresentação</h3>
          </div>
          <p className="text-muted-foreground text-xs mb-3">Este texto aparece logo após a foto no início da proposta.</p>
          <textarea 
            rows={6}
            value={formData.intro_default}
            onChange={e => setFormData({...formData, intro_default: e.target.value})}
            className="w-full bg-background border border-secondary rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary outline-none resize-none font-sans leading-relaxed"
            placeholder="Ex: Olá! Tudo bem? Meu nome é Cadu..."
          />
        </div>

        {/* Seção Estratégia */}
        <div className="bg-card border border-secondary rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <FileText size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Diagnóstico Estratégico</h3>
          </div>
          <p className="text-muted-foreground text-xs mb-3">Explique como a agência ajudará o cliente (aparece antes dos preços).</p>
          <textarea 
            rows={6}
            value={formData.strategy_default}
            onChange={e => setFormData({...formData, strategy_default: e.target.value})}
            className="w-full bg-background border border-secondary rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary outline-none resize-none font-sans leading-relaxed"
            placeholder="Ex: Identificamos que sua presença digital precisa de..."
          />
        </div>

        {/* Seção Condições */}
        <div className="bg-card border border-secondary rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <ShieldCheck size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Termos e Condições</h3>
          </div>
          <p className="text-muted-foreground text-xs mb-3">Validade, formas de pagamento e prazos finais.</p>
          <textarea 
            rows={6}
            value={formData.terms_default}
            onChange={e => setFormData({...formData, terms_default: e.target.value})}
            className="w-full bg-background border border-secondary rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary outline-none resize-none font-sans leading-relaxed"
            placeholder="Ex: Forma de pagamento: PIX. Condições: 50% no início..."
          />
        </div>
      </div>
    </div>
  );
}