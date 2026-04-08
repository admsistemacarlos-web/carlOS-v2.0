
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend,
} from 'recharts';
import {
  ArrowLeft, Search, TrendingUp, TrendingDown, Minus,
  DollarSign, MapPin, ShoppingBag, Filter, ChevronRight,
  X, Calendar, BarChart2, Tag, Package,
} from 'lucide-react';
import {
  useAnalyticsData, DEFAULT_FILTERS, CHART_COLORS,
  AnalyticsFilters, CategoryStat, ItemStat, SupplierStat,
} from '../hooks/useAnalyticsData';
import { formatDateBr } from '../utils/dateHelpers';
import { supabase } from '../../../../integrations/supabase/client';

// ─── Utility ─────────────────────────────────────────────────────────────────
const fmt = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const ptPeriods: Record<string, string> = {
  month: 'Este mês', quarter: 'Trimestre', semester: 'Semestre', year: 'Este ano', all: 'Tudo', custom: 'Custom',
};

// ─── Small reusable components ────────────────────────────────────────────────
const TrendBadge = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
    trend === 'up' ? 'bg-red-50 text-red-500' :
    trend === 'down' ? 'bg-emerald-50 text-emerald-500' :
    'bg-secondary text-muted-foreground'
  }`}>
    {trend === 'up' ? <TrendingUp size={9} /> : trend === 'down' ? <TrendingDown size={9} /> : <Minus size={9} />}
    {trend === 'up' ? 'Alta' : trend === 'down' ? 'Baixa' : 'Estável'}
  </span>
);

const KPICard = ({ title, value, subtext, icon, accent }: {
  title: string; value: string; subtext?: string; icon: React.ReactNode; accent?: string;
}) => (
  <div className="bg-card p-5 rounded-[1.75rem] border border-border shadow-sm flex items-start justify-between min-h-[110px]">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
      <h3 className="text-xl font-bold text-foreground mb-1">{value}</h3>
      {subtext && <p className="text-xs text-muted-foreground font-medium">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-xl ${accent ?? 'bg-secondary text-muted-foreground'}`}>
      {icon}
    </div>
  </div>
);

const TabBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
      active ? 'bg-foreground text-background shadow-md' : 'bg-card text-muted-foreground border border-border hover:bg-secondary'
    }`}
  >
    {children}
  </button>
);

const PillBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
      active ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:bg-card hover:border border-border'
    }`}
  >
    {children}
  </button>
);

// ─── Filter Chip ──────────────────────────────────────────────────────────────
const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-full text-xs font-semibold">
    {label}
    <button onClick={onRemove} className="hover:opacity-70 transition-opacity"><X size={11} /></button>
  </span>
);

// ─── TABS ─────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'categories' | 'items' | 'suppliers';

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [drillCategoryId, setDrillCategoryId] = useState<string | null>(null);
  const [drillItemName, setDrillItemName] = useState<string | null>(null);
  const [itemLocalSearch, setItemLocalSearch] = useState('');
  const [itemSort, setItemSort] = useState<'totalSpent' | 'purchaseCount' | 'avgPrice' | 'lastDate'>('totalSpent');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string; color: string }[]>([]);

  const analytics = useAnalyticsData(filters);

  // Fetch categories for filter dropdown
  useEffect(() => {
    supabase.from('categories').select('id, name, color').eq('type', 'expense').then(({ data }) => {
      if (data) setAvailableCategories(data);
    });
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setDrillCategoryId(null);
    setDrillItemName(null);
  };

  const setFilter = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
    setFilters(f => ({ ...f, [key]: value }));
  };

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: { label: string; clear: () => void }[] = [];
    if (filters.period !== 'month') chips.push({ label: ptPeriods[filters.period], clear: () => setFilter('period', 'month') });
    if (filters.categoryIds.length > 0) {
      const names = filters.categoryIds.map(id => availableCategories.find(c => c.id === id)?.name ?? id);
      chips.push({ label: `Cat: ${names.slice(0, 2).join(', ')}${names.length > 2 ? ` +${names.length - 2}` : ''}`, clear: () => setFilter('categoryIds', []) });
    }
    if (filters.subcategorySearch) chips.push({ label: `Subcat: ${filters.subcategorySearch}`, clear: () => setFilter('subcategorySearch', '') });
    if (filters.itemNameSearch) chips.push({ label: `Item: ${filters.itemNameSearch}`, clear: () => setFilter('itemNameSearch', '') });
    if (filters.amountMin !== null || filters.amountMax !== null) {
      const min = filters.amountMin !== null ? fmt(filters.amountMin) : '—';
      const max = filters.amountMax !== null ? fmt(filters.amountMax) : '—';
      chips.push({ label: `Valor: ${min} – ${max}`, clear: () => { setFilter('amountMin', null); setFilter('amountMax', null); } });
    }
    if (filters.supplierSearch) chips.push({ label: `Loja: ${filters.supplierSearch}`, clear: () => setFilter('supplierSearch', '') });
    return chips;
  }, [filters, availableCategories]);

  // Drill targets
  const drilledCategory = drillCategoryId ? analytics.categories.find(c => c.id === drillCategoryId) : null;
  const drilledItem = drillItemName ? analytics.items.find(i => i.name === drillItemName) : null;

  // Filtered + sorted items for Itens tab
  const visibleItems = useMemo(() => {
    let list = analytics.items;
    if (itemLocalSearch) {
      const t = itemLocalSearch.toLowerCase();
      list = list.filter(i => i.displayName.toLowerCase().includes(t) || i.subcategories.some(s => s.toLowerCase().includes(t)));
    }
    return [...list].sort((a, b) => {
      if (itemSort === 'totalSpent') return b.totalSpent - a.totalSpent;
      if (itemSort === 'purchaseCount') return b.purchaseCount - a.purchaseCount;
      if (itemSort === 'avgPrice') return b.avgPrice - a.avgPrice;
      return b.lastDate.localeCompare(a.lastDate);
    });
  }, [analytics.items, itemLocalSearch, itemSort]);

  // Filtered suppliers
  const visibleSuppliers = useMemo(() => {
    if (!supplierSearch) return analytics.suppliers;
    const t = supplierSearch.toLowerCase();
    return analytics.suppliers.filter(s => s.name.toLowerCase().includes(t));
  }, [analytics.suppliers, supplierSearch]);

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in font-sans">

      {/* ── Header ── */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/personal/finance')}
              className="p-2 -ml-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Inteligência</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Analytics Financeiro</p>
            </div>
          </div>
          <button
            onClick={() => setIsFilterOpen(o => !o)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
              isFilterOpen || activeChips.length > 0
                ? 'bg-foreground text-background'
                : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Filter size={14} />
            Filtros {activeChips.length > 0 ? `(${activeChips.length})` : ''}
          </button>
        </div>

        {/* ── Filter Panel ── */}
        {isFilterOpen && (
          <div className="bg-card border border-border rounded-[2rem] p-5 mb-5 space-y-5 animate-fade-in">
            {/* Period */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Período</p>
              <div className="flex flex-wrap gap-2">
                {(['month', 'quarter', 'semester', 'year', 'all'] as const).map(p => (
                  <PillBtn key={p} active={filters.period === p} onClick={() => setFilter('period', p)}>
                    {ptPeriods[p]}
                  </PillBtn>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Categorias</p>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      const ids = filters.categoryIds.includes(cat.id)
                        ? filters.categoryIds.filter(id => id !== cat.id)
                        : [...filters.categoryIds, cat.id];
                      setFilter('categoryIds', ids);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      filters.categoryIds.includes(cat.id)
                        ? 'text-white border-transparent'
                        : 'bg-secondary text-muted-foreground border-border hover:border-foreground/20'
                    }`}
                    style={filters.categoryIds.includes(cat.id) ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Row: Subcategoria + Item */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Subcategoria</p>
                <input
                  value={filters.subcategorySearch}
                  onChange={e => setFilter('subcategorySearch', e.target.value)}
                  placeholder="Ex: bebidas, proteína..."
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30 placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Item / Produto</p>
                <input
                  value={filters.itemNameSearch}
                  onChange={e => setFilter('itemNameSearch', e.target.value)}
                  placeholder="Ex: Netflix, Omo..."
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Row: Valor + Fornecedor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Valor (R$)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.amountMin ?? ''}
                    onChange={e => setFilter('amountMin', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Min"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30 placeholder:text-muted-foreground"
                  />
                  <span className="text-muted-foreground text-xs">–</span>
                  <input
                    type="number"
                    value={filters.amountMax ?? ''}
                    onChange={e => setFilter('amountMax', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Max"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30 placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Local / Estabelecimento</p>
                <input
                  value={filters.supplierSearch}
                  onChange={e => setFilter('supplierSearch', e.target.value)}
                  placeholder="Ex: Mercadão, iFood..."
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Clear all */}
            {activeChips.length > 0 && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="w-full py-2.5 rounded-xl border border-dashed border-border text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        )}

        {/* ── Active filter chips ── */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeChips.map((chip, i) => (
              <FilterChip key={i} label={chip.label} onRemove={chip.clear} />
            ))}
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <TabBtn active={activeTab === 'overview'} onClick={() => handleTabChange('overview')}>
            <BarChart2 size={13} /> Visão Geral
          </TabBtn>
          <TabBtn active={activeTab === 'categories'} onClick={() => handleTabChange('categories')}>
            <Tag size={13} /> Categorias
          </TabBtn>
          <TabBtn active={activeTab === 'items'} onClick={() => handleTabChange('items')}>
            <Package size={13} /> Itens
          </TabBtn>
          <TabBtn active={activeTab === 'suppliers'} onClick={() => handleTabChange('suppliers')}>
            <MapPin size={13} /> Locais & Lojas
          </TabBtn>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: VISÃO GERAL
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="px-6 space-y-6 animate-fade-in">
          {analytics.loading ? (
            <LoadingState />
          ) : (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 gap-3">
                <KPICard
                  title="Total Gastos"
                  value={fmt(analytics.summary.totalExpense)}
                  subtext={`${analytics.summary.transactionCount} transações`}
                  icon={<DollarSign size={18} />}
                  accent="bg-red-50 text-red-500"
                />
                <KPICard
                  title="Total Receitas"
                  value={fmt(analytics.summary.totalIncome)}
                  subtext={ptPeriods[filters.period]}
                  icon={<TrendingUp size={18} />}
                  accent="bg-emerald-50 text-emerald-500"
                />
                <KPICard
                  title="Saldo do Período"
                  value={fmt(analytics.summary.netBalance)}
                  icon={analytics.summary.netBalance >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  accent={analytics.summary.netBalance >= 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}
                />
                <KPICard
                  title="Média Diária"
                  value={fmt(analytics.summary.dailyAverage)}
                  subtext={`${analytics.summary.periodDays} dias`}
                  icon={<Calendar size={18} />}
                />
              </div>

              {/* Monthly Bar Chart */}
              <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Evolução — Últimos 6 Meses</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.monthlyEvolution} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }}
                        formatter={(val: number, name: string) => [fmt(val), name === 'income' ? 'Receitas' : 'Gastos']}
                      />
                      <Legend formatter={(v) => v === 'income' ? 'Receitas' : 'Gastos'} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="income" fill="#A8D5A2" radius={[4, 4, 0, 0]} barSize={18} />
                      <Bar dataKey="expense" fill="#F5A0A0" radius={[4, 4, 0, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Categories Donut */}
              {analytics.categories.length > 0 && (
                <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Distribuição por Categoria</h3>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-1/2 h-[240px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.categories.slice(0, 6)}
                            cx="50%" cy="50%"
                            innerRadius={55} outerRadius={90}
                            paddingAngle={4} dataKey="total" stroke="none"
                          >
                            {analytics.categories.slice(0, 6).map((entry, i) => (
                              <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(val: number) => fmt(val)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Total</span>
                        <span className="text-base font-bold text-foreground">{fmt(analytics.summary.totalExpense)}</span>
                      </div>
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      {analytics.categories.slice(0, 6).map((cat, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                          onClick={() => { handleTabChange('categories'); setDrillCategoryId(cat.id); }}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-sm font-medium text-muted-foreground">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{cat.percentage.toFixed(0)}%</span>
                            <span className="text-sm font-bold text-foreground">{fmt(cat.total)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: CATEGORIAS
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'categories' && (
        <div className="px-6 space-y-4 animate-fade-in">
          {analytics.loading ? <LoadingState /> : (
            <>
              {/* Breadcrumb */}
              {drilledCategory && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <button onClick={() => setDrillCategoryId(null)} className="hover:text-foreground transition-colors font-medium">
                    Categorias
                  </button>
                  <ChevronRight size={14} />
                  <span className="font-bold text-foreground">{drilledCategory.name}</span>
                </div>
              )}

              {!drilledCategory ? (
                /* Category List */
                <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
                  {analytics.categories.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">Nenhum gasto encontrado no período.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {analytics.categories.map((cat, i) => (
                        <CategoryRow key={cat.id} cat={cat} index={i} onClick={() => setDrillCategoryId(cat.id)} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Drill-down */
                <CategoryDrillDown cat={drilledCategory} />
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: ITENS
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'items' && (
        <div className="px-6 space-y-4 animate-fade-in">
          {analytics.loading ? <LoadingState /> : (
            <>
              {drilledItem && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <button onClick={() => setDrillItemName(null)} className="hover:text-foreground transition-colors font-medium">
                    Itens
                  </button>
                  <ChevronRight size={14} />
                  <span className="font-bold text-foreground">{drilledItem.displayName}</span>
                </div>
              )}

              {!drilledItem ? (
                <>
                  {/* Search + Sort */}
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <input
                        value={itemLocalSearch}
                        onChange={e => setItemLocalSearch(e.target.value)}
                        placeholder="Buscar produto ou subcategoria..."
                        className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3 text-sm text-foreground outline-none focus:border-foreground/30 placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  {/* Sort controls */}
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {(['totalSpent', 'purchaseCount', 'avgPrice', 'lastDate'] as const).map(s => (
                      <PillBtn key={s} active={itemSort === s} onClick={() => setItemSort(s)}>
                        {{ totalSpent: 'Total Gasto', purchaseCount: 'Frequência', avgPrice: 'Preço Médio', lastDate: 'Mais Recente' }[s]}
                      </PillBtn>
                    ))}
                  </div>

                  {/* Items grid */}
                  {visibleItems.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">
                      <ShoppingBag size={40} className="mx-auto mb-3 opacity-20" />
                      <p>Nenhum item encontrado.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {visibleItems.map((item, i) => (
                        <ItemCard key={i} item={item} onClick={() => setDrillItemName(item.name)} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <ItemDetailView item={drilledItem} />
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: FORNECEDORES
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'suppliers' && (
        <div className="px-6 space-y-5 animate-fade-in">
          {analytics.loading ? <LoadingState /> : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  value={supplierSearch}
                  onChange={e => setSupplierSearch(e.target.value)}
                  placeholder="Buscar fornecedor..."
                  className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3 text-sm text-foreground outline-none focus:border-foreground/30 placeholder:text-muted-foreground"
                />
              </div>

              {/* Bar chart — top 10 */}
              {analytics.suppliers.length > 0 && (
                <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Top 10 por Valor Gasto</h3>
                  <div style={{ height: Math.min(analytics.suppliers.slice(0, 10).length * 44 + 40, 480) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={analytics.suppliers.slice(0, 10)} margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name" type="category" width={110}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                          axisLine={false} tickLine={false}
                        />
                        <RechartsTooltip
                          cursor={{ fill: 'hsl(var(--secondary))' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                          formatter={(val: number) => [fmt(val), 'Total Gasto']}
                        />
                        <Bar dataKey="total" fill="#3C3633" radius={[0, 4, 4, 0]} barSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Detail list */}
              <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
                {visibleSuppliers.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p className="text-sm">Nenhum local encontrado.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Preencha o campo "Local" ao criar transações para ver esta análise.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {visibleSuppliers.map((s, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-secondary transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {s.transactionCount} visita{s.transactionCount !== 1 ? 's' : ''} · Último: {formatDateBr(s.lastDate)}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {s.categories.slice(0, 3).map((c, ci) => (
                              <span key={ci} className="text-[10px] px-1.5 py-0.5 bg-secondary rounded-full text-muted-foreground font-medium">{c}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="font-bold text-sm text-foreground">{fmt(s.total)}</p>
                          <p className="text-[11px] text-muted-foreground">~{fmt(s.avgTicket)}/visita</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
      <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      <p className="text-sm">Carregando dados...</p>
    </div>
  );
}

function CategoryRow({ cat, index, onClick }: { cat: CategoryStat; index: number; onClick: () => void }) {
  const fmt = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary transition-colors text-left"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 font-bold"
        style={{ backgroundColor: (cat.color || CHART_COLORS[index % CHART_COLORS.length]) + '20', color: cat.color || CHART_COLORS[index % CHART_COLORS.length] }}
      >
        {cat.icon || cat.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-sm font-semibold text-foreground truncate">{cat.name}</span>
          <span className="text-sm font-bold text-foreground ml-2 flex-shrink-0">{fmt(cat.total)}</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: cat.color || CHART_COLORS[index % CHART_COLORS.length] }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          {cat.percentage.toFixed(1)}% · {cat.transactionCount} transaç{cat.transactionCount !== 1 ? 'ões' : 'ão'}
        </span>
      </div>
      <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
    </button>
  );
}

function CategoryDrillDown({ cat }: { cat: CategoryStat }) {
  const fmt = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header card */}
      <div className="bg-card p-5 rounded-[2rem] border border-border shadow-sm flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: cat.color + '20', color: cat.color }}
        >
          {cat.icon || cat.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-lg text-foreground">{cat.name}</p>
          <p className="text-sm text-muted-foreground">{fmt(cat.total)} · {cat.transactionCount} transações</p>
        </div>
      </div>

      {/* Subcategories */}
      {cat.subcategories.length > 0 && (
        <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subcategorias</p>
          </div>
          <div className="divide-y divide-border">
            {cat.subcategories.map((sub, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary transition-colors">
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-medium text-foreground">{sub.name}</span>
                    <span className="text-sm font-bold text-foreground">{fmt(sub.total)}</span>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-muted-foreground/40 rounded-full" style={{ width: `${sub.percentage}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 block">{sub.count} ite{sub.count !== 1 ? 'ns' : 'm'} · {sub.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items in this category */}
      {cat.items.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Produtos nesta categoria</p>
          <div className="grid grid-cols-2 gap-3">
            {cat.items.slice(0, 8).map((item, i) => (
              <ItemCard key={i} item={item} onClick={() => {}} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, onClick }: { item: ItemStat; onClick: () => void }) {
  const fmt = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  return (
    <button
      onClick={onClick}
      className="bg-card p-4 rounded-[1.5rem] border border-border shadow-sm text-left hover:bg-secondary/60 transition-colors duration-150 w-full"
    >
      <div className="flex justify-between items-start mb-2.5">
        <span className="text-sm font-bold text-foreground truncate flex-1 pr-2">{item.displayName}</span>
        <TrendBadge trend={item.priceTrend} />
      </div>
      <p className="text-lg font-bold text-foreground mb-1">{fmt(item.totalSpent)}</p>
      <div className="flex gap-3 text-[11px] text-muted-foreground font-medium">
        <span>{item.purchaseCount}× comprado</span>
        <span>~{fmt(item.avgPrice)}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 truncate">
        {formatDateBr(item.lastDate)} · {item.lastLocation}
      </p>
      {item.subcategories.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.subcategories.slice(0, 2).map((s, i) => (
            <span key={i} className="text-[9px] px-1.5 py-0.5 bg-secondary rounded-full text-muted-foreground">{s}</span>
          ))}
        </div>
      )}
    </button>
  );
}

function ItemDetailView({ item }: { item: ItemStat }) {
  const fmt = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="bg-card p-5 rounded-[2rem] border border-border shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xl font-bold text-foreground">{item.displayName}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <TrendBadge trend={item.priceTrend} />
            {item.subcategories.map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 bg-secondary rounded-full text-muted-foreground font-medium">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card p-4 rounded-[1.5rem] border border-border text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Preço Médio</p>
          <p className="text-base font-bold text-foreground">{fmt(item.avgPrice)}</p>
        </div>
        <div className="bg-card p-4 rounded-[1.5rem] border border-border text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Total Gasto</p>
          <p className="text-base font-bold text-foreground">{fmt(item.totalSpent)}</p>
        </div>
        <div className="bg-card p-4 rounded-[1.5rem] border border-border text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Compras</p>
          <p className="text-base font-bold text-foreground">{item.purchaseCount}×</p>
        </div>
      </div>

      {/* Price history chart */}
      {item.priceHistory.length >= 2 && (
        <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Histórico de Preço</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={item.priceHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDateBr(d).slice(0, 5)}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `R$${v}`}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false} tickLine={false} domain={['auto', 'auto']}
                />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                  formatter={(val: number) => [fmt(val), 'Preço Unit.']}
                  labelFormatter={(l) => formatDateBr(l)}
                />
                <Line
                  type="monotone" dataKey="price" stroke="#3C3633"
                  strokeWidth={2.5}
                  dot={{ fill: '#3C3633', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Purchase history */}
      <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Histórico de Compras</p>
        </div>
        <div className="divide-y divide-border">
          {[...item.priceHistory].reverse().map((p, i) => (
            <div key={i} className="flex justify-between items-center px-5 py-3.5 hover:bg-secondary transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">{formatDateBr(p.date)}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  <MapPin size={10} /> {p.location}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{fmt(p.price)}</p>
                {p.quantity > 1 && <p className="text-[11px] text-muted-foreground">Qtd: {p.quantity}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
