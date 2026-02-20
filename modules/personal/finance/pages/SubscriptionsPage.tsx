import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Search, Filter, Pause, Play, Trash2,
  CreditCard, Building2, QrCode, Edit2, ExternalLink,
  CalendarClock, TrendingUp, Loader2, X, ChevronDown,
  Repeat, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useCards } from '../hooks/useFinanceData';
import { Subscription } from '../types/finance.types';
import { createPortal } from 'react-dom';
import { supabase } from '../../../../integrations/supabase/client';

// ============================================
// CONSTANTES
// ============================================

const CATEGORIES = [
  { value: 'streaming', label: 'Streaming' },
  { value: 'music', label: 'Música' },
  { value: 'gaming', label: 'Games' },
  { value: 'productivity', label: 'Produtividade' },
  { value: 'ai', label: 'Inteligência Artificial' },
  { value: 'cloud', label: 'Cloud / Storage' },
  { value: 'education', label: 'Educação' },
  { value: 'news', label: 'Notícias' },
  { value: 'health', label: 'Saúde / Fitness' },
  { value: 'finance', label: 'Finanças' },
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Desenvolvimento' },
  { value: 'communication', label: 'Comunicação' },
  { value: 'security', label: 'Segurança' },
  { value: 'other', label: 'Outros' },
];

const BILLING_CYCLES: { value: Subscription['billing_cycle']; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semi_annual', label: 'Semestral' },
  { value: 'yearly', label: 'Anual' },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Ativa', color: 'text-emerald-400 bg-emerald-400/10', icon: <CheckCircle2 size={12} /> },
  paused: { label: 'Pausada', color: 'text-amber-400 bg-amber-400/10', icon: <Pause size={12} /> },
  cancelled: { label: 'Cancelada', color: 'text-red-400 bg-red-400/10', icon: <X size={12} /> },
  trial: { label: 'Trial', color: 'text-blue-400 bg-blue-400/10', icon: <Clock size={12} /> },
};

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  credit_card: <CreditCard size={14} />,
  account: <Building2 size={14} />,
  pix: <QrCode size={14} />,
  other: <Repeat size={14} />,
};

const getCategoryLabel = (value: string) => CATEGORIES.find(c => c.value === value)?.label || value;
const getCycleLabel = (value: string) => BILLING_CYCLES.find(c => c.value === value)?.label || value;

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDaysUntil = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// ============================================
// COMPONENTE: MODAL DE FORMULÁRIO
// ============================================

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Subscription>) => Promise<void>;
  editingItem?: Subscription | null;
  cards: any[];
}

const SubscriptionFormModal: React.FC<FormModalProps> = ({ isOpen, onClose, onSave, editingItem, cards }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    service_name: '',
    description: '',
    category: 'other',
    service_url: '',
    amount: '',
    billing_cycle: 'monthly' as Subscription['billing_cycle'],
    start_date: new Date().toISOString().split('T')[0],
    next_billing_date: '',
    status: 'active' as Subscription['status'],
    payment_method: 'credit_card' as NonNullable<Subscription['payment_method']>,
    credit_card_id: '',
    notes: '',
    notify_before_days: 3,
  });

  React.useEffect(() => {
    if (editingItem) {
      setForm({
        service_name: editingItem.service_name,
        description: editingItem.description || '',
        category: editingItem.category,
        service_url: editingItem.service_url || '',
        amount: String(editingItem.amount),
        billing_cycle: editingItem.billing_cycle,
        start_date: editingItem.start_date,
        next_billing_date: editingItem.next_billing_date,
        status: editingItem.status,
        payment_method: editingItem.payment_method || 'credit_card',
        credit_card_id: editingItem.credit_card_id || '',
        notes: editingItem.notes || '',
        notify_before_days: editingItem.notify_before_days || 3,
      });
    } else {
      setForm({
        service_name: '',
        description: '',
        category: 'other',
        service_url: '',
        amount: '',
        billing_cycle: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        next_billing_date: '',
        status: 'active',
        payment_method: 'credit_card',
        credit_card_id: '',
        notes: '',
        notify_before_days: 3,
      });
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service_name.trim() || !form.amount || !form.next_billing_date) return;
    setSaving(true);
    try {
      await onSave({
        service_name: form.service_name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        service_url: form.service_url.trim() || null,
        amount: parseFloat(form.amount),
        billing_cycle: form.billing_cycle,
        start_date: form.start_date,
        next_billing_date: form.next_billing_date,
        status: form.status,
        payment_method: form.payment_method,
        credit_card_id: form.payment_method === 'credit_card' && form.credit_card_id ? form.credit_card_id : null,
        account_id: null,
        notes: form.notes.trim() || null,
        notify_before_days: form.notify_before_days,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-3 bg-coffee/5 border border-stone-200 rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-olive/30 focus:border-olive transition-all";
  const labelClass = "block text-[11px] font-semibold text-coffee/60 mb-1.5 uppercase tracking-wider";
  const selectClass = `${inputClass} appearance-none`;

  return createPortal(
    <div className="fixed inset-0 bg-coffee/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-cream border border-stone-200 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold tracking-tight text-coffee">
            {editingItem ? 'Editar Assinatura' : 'Nova Assinatura'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
            <X size={18} className="text-coffee/40" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Nome e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nome do Serviço *</label>
              <input
                type="text"
                value={form.service_name}
                onChange={e => setForm({ ...form, service_name: e.target.value })}
                placeholder="Ex: Netflix, Spotify..."
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Categoria</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className={selectClass}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Valor e Ciclo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="29.90"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Ciclo de Cobrança *</label>
              <select
                value={form.billing_cycle}
                onChange={e => setForm({ ...form, billing_cycle: e.target.value as Subscription['billing_cycle'] })}
                className={selectClass}
              >
                {BILLING_CYCLES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Data de Início</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Próxima Cobrança *</label>
              <input
                type="date"
                value={form.next_billing_date}
                onChange={e => setForm({ ...form, next_billing_date: e.target.value })}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Status e Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as Subscription['status'] })}
                className={selectClass}
              >
                <option value="active">Ativa</option>
                <option value="trial">Trial / Teste</option>
                <option value="paused">Pausada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Forma de Pagamento</label>
              <select
                value={form.payment_method}
                onChange={e => setForm({ ...form, payment_method: e.target.value as NonNullable<Subscription['payment_method']> })}
                className={selectClass}
              >
                <option value="credit_card">Cartão de Crédito</option>
                <option value="account">Débito em Conta</option>
                <option value="pix">PIX</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          {/* Cartão (condicional) */}
          {form.payment_method === 'credit_card' && cards.length > 0 && (
            <div>
              <label className={labelClass}>Cartão</label>
              <select
                value={form.credit_card_id}
                onChange={e => setForm({ ...form, credit_card_id: e.target.value })}
                className={selectClass}
              >
                <option value="">Selecione um cartão</option>
                {cards.map((card: any) => (
                  <option key={card.id} value={card.id}>{card.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* URL do Serviço */}
          <div>
            <label className={labelClass}>URL do Serviço</label>
            <input
              type="url"
              value={form.service_url}
              onChange={e => setForm({ ...form, service_url: e.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {/* Descrição / Notas */}
          <div>
            <label className={labelClass}>Notas</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Plano família, compartilhado com..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Botão Salvar */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-coffee text-cream rounded-xl font-semibold text-sm tracking-wide hover:bg-coffee/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {editingItem ? 'Salvar Alterações' : 'Adicionar Assinatura'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ============================================
// COMPONENTE: CARD DE ASSINATURA
// ============================================

interface SubCardProps {
  sub: Subscription;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

const SubscriptionCard: React.FC<SubCardProps> = ({ sub, onEdit, onToggle, onDelete }) => {
  const status = STATUS_MAP[sub.status] || STATUS_MAP.active;
  const daysUntil = getDaysUntil(sub.next_billing_date);
  const isUpcoming = daysUntil >= 0 && daysUntil <= (sub.notify_before_days || 3);
  const isOverdue = daysUntil < 0 && sub.status === 'active';

  return (
    <div className={`group bg-white border rounded-2xl p-5 transition-all hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50/30' : isUpcoming ? 'border-amber-200 bg-amber-50/30' : 'border-stone-100'}`}>
      
      {/* Layout Horizontal - Linha Principal */}
      <div className="flex items-center gap-6">
        
        {/* Coluna 1: Status + Nome do Serviço */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex-shrink-0 ${status.color}`}>
            {status.icon}
          </span>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-coffee text-sm truncate">{sub.service_name}</h3>
              {sub.service_url && (
                <a href={sub.service_url} target="_blank" rel="noopener noreferrer" className="text-olive/50 hover:text-olive transition-colors flex-shrink-0">
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-coffee/40">
              <span>{getCategoryLabel(sub.category)}</span>
            </div>
          </div>
        </div>

        {/* Coluna 2: Próxima Cobrança */}
        <div className="hidden md:flex items-center gap-2 min-w-[180px]">
          {sub.status !== 'cancelled' && (
            <div className={`flex items-center gap-1.5 text-[11px] font-medium ${isOverdue ? 'text-red-500' : isUpcoming ? 'text-amber-600' : 'text-coffee/40'}`}>
              {isOverdue ? <AlertCircle size={12} /> : <CalendarClock size={12} />}
              <span className="whitespace-nowrap">
                {isOverdue
                  ? `Há ${Math.abs(daysUntil)}d atrás`
                  : daysUntil === 0
                    ? 'Hoje'
                    : daysUntil === 1
                      ? 'Amanhã'
                      : `Em ${daysUntil} dias`
                }
              </span>
            </div>
          )}
        </div>

        {/* Coluna 3: Forma de Pagamento */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-coffee/40 min-w-[140px]">
          <span className="flex-shrink-0">{PAYMENT_ICONS[sub.payment_method || 'other']}</span>
          <span className="truncate">
            {sub.credit_card?.name || (sub.payment_method === 'pix' ? 'PIX' : sub.payment_method === 'account' ? 'Conta' : 'Outro')}
          </span>
        </div>

        {/* Coluna 4: Ciclo */}
        <div className="hidden sm:block text-[10px] text-coffee/40 font-medium min-w-[70px] text-center">
          {getCycleLabel(sub.billing_cycle)}
        </div>

        {/* Coluna 5: Valor */}
        <div className="text-right flex-shrink-0 min-w-[100px]">
          <p className="text-lg font-bold text-coffee tracking-tight">{formatCurrency(sub.amount)}</p>
          <p className="text-[10px] text-coffee/40 font-medium">/{getCycleLabel(sub.billing_cycle).toLowerCase().slice(0, 3)}</p>
        </div>

        {/* Coluna 6: Ações (visível no hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button 
            onClick={onEdit} 
            className="p-2 text-coffee/40 hover:text-coffee hover:bg-stone-50 rounded-lg transition-all"
            title="Editar"
          >
            <Edit2 size={14} />
          </button>
          {sub.status !== 'cancelled' && (
            <button 
              onClick={onToggle}
              className="p-2 text-coffee/40 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
              title={sub.status === 'paused' ? 'Retomar' : 'Pausar'}
            >
              {sub.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
            </button>
          )}
          <button 
            onClick={onDelete}
            className="p-2 text-coffee/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Notas (se houver) */}
      {sub.notes && (
        <div className="mt-3 pt-3 border-t border-stone-50">
          <p className="text-[11px] text-coffee/40 italic">{sub.notes}</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const {
    subscriptions, loading, refresh,
    addSubscription, updateSubscription, deleteSubscription, toggleStatus,
    activeSubscriptions, monthlyTotal, yearlyTotal
  } = useSubscriptions();
  const { cards } = useCards();

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filtragem
  const filteredSubs = useMemo(() => {
    return subscriptions.filter(sub => {
      const matchSearch = sub.service_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || sub.status === filterStatus;
      const matchCategory = filterCategory === 'all' || sub.category === filterCategory;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [subscriptions, searchTerm, filterStatus, filterCategory]);

  // Categorias presentes (para filtro dinâmico)
  const usedCategories = useMemo(() => {
    const cats = new Set(subscriptions.map(s => s.category));
    return CATEGORIES.filter(c => cats.has(c.value));
  }, [subscriptions]);

  const handleSave = async (data: Partial<Subscription>) => {
    if (editingItem) {
      await updateSubscription(editingItem.id, data);
    } else {
      await addSubscription(data);
    }
  };

  const handleEdit = (sub: Subscription) => {
    setEditingItem(sub);
    setModalOpen(true);
  };

  const handleDelete = async (sub: Subscription) => {
    if (window.confirm(`Excluir "${sub.service_name}"?`)) {
      await deleteSubscription(sub.id);
    }
  };

  const openNewModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-olive" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/personal/finance')} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-coffee/40" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-coffee">Assinaturas</h1>
            <p className="text-xs text-coffee/40 mt-0.5">Controle seus serviços recorrentes</p>
          </div>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-coffee text-cream rounded-xl text-xs font-semibold hover:bg-coffee/90 active:scale-95 transition-all"
        >
          <Plus size={14} /> Nova Assinatura
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-coffee/40 mb-2">
            <Repeat size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Ativas</span>
          </div>
          <p className="text-2xl font-bold text-coffee">{activeSubscriptions.length}</p>
          <p className="text-[10px] text-coffee/30 mt-1">de {subscriptions.length} total</p>
        </div>

        <div className="bg-white border border-stone-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-coffee/40 mb-2">
            <CalendarClock size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Custo Mensal</span>
          </div>
          <p className="text-2xl font-bold text-coffee">{formatCurrency(monthlyTotal)}</p>
          <p className="text-[10px] text-coffee/30 mt-1">equivalente mensal</p>
        </div>

        <div className="bg-white border border-stone-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-coffee/40 mb-2">
            <TrendingUp size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Custo Anual</span>
          </div>
          <p className="text-2xl font-bold text-coffee">{formatCurrency(yearlyTotal)}</p>
          <p className="text-[10px] text-coffee/30 mt-1">projeção 12 meses</p>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-coffee/30" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar assinatura..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-100 rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-olive/20 transition-all"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-stone-100 rounded-xl text-xs font-medium text-coffee/60 focus:outline-none focus:ring-2 focus:ring-olive/20 appearance-none"
        >
          <option value="all">Todos os Status</option>
          <option value="active">Ativas</option>
          <option value="trial">Trial</option>
          <option value="paused">Pausadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        {usedCategories.length > 1 && (
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-white border border-stone-100 rounded-xl text-xs font-medium text-coffee/60 focus:outline-none focus:ring-2 focus:ring-olive/20 appearance-none"
          >
            <option value="all">Todas as Categorias</option>
            {usedCategories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Lista de Assinaturas */}
      {filteredSubs.length === 0 ? (
        <div className="text-center py-16">
          <Repeat size={40} className="mx-auto text-coffee/10 mb-4" />
          <h3 className="text-sm font-semibold text-coffee/40 mb-1">
            {subscriptions.length === 0 ? 'Nenhuma assinatura cadastrada' : 'Nenhum resultado encontrado'}
          </h3>
          <p className="text-xs text-coffee/30">
            {subscriptions.length === 0 ? 'Comece adicionando seus serviços recorrentes.' : 'Tente ajustar os filtros.'}
          </p>
          {subscriptions.length === 0 && (
            <button onClick={openNewModal} className="mt-4 px-5 py-2.5 bg-coffee text-cream rounded-xl text-xs font-semibold hover:bg-coffee/90 transition-all">
              <Plus size={14} className="inline mr-1" /> Adicionar primeira
            </button>
          )}
        </div>
      ) : (
            <div className="space-y-3">
          {filteredSubs.map(sub => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              onEdit={() => handleEdit(sub)}
              onToggle={() => toggleStatus(sub.id, sub.status)}
              onDelete={() => handleDelete(sub)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <SubscriptionFormModal
        isOpen={isModalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        editingItem={editingItem}
        cards={cards}
      />
    </div>
  );
}