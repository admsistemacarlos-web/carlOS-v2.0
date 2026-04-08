
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../../integrations/supabase/client';

// ─── Chart Colors ────────────────────────────────────────────────────────────
export const CHART_COLORS = [
  '#3C3633', '#747264', '#A0522D', '#5C6BC0',
  '#B9B4C7', '#E5C3A6', '#7FB3D5', '#D2B4DE', '#F5CBA7', '#A8D5A2',
];

// ─── Filter Types ─────────────────────────────────────────────────────────────
export type AnalyticsPeriod = 'month' | 'quarter' | 'semester' | 'year' | 'all' | 'custom';

export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  customDateStart: string;
  customDateEnd: string;
  categoryIds: string[];
  subcategorySearch: string;
  itemNameSearch: string;
  amountMin: number | null;
  amountMax: number | null;
  supplierSearch: string;
}

export const DEFAULT_FILTERS: AnalyticsFilters = {
  period: 'month',
  customDateStart: '',
  customDateEnd: '',
  categoryIds: [],
  subcategorySearch: '',
  itemNameSearch: '',
  amountMin: null,
  amountMax: null,
  supplierSearch: '',
};

// ─── Output Types ─────────────────────────────────────────────────────────────
export interface SummaryStats {
  totalExpense: number;
  totalIncome: number;
  netBalance: number;
  dailyAverage: number;
  transactionCount: number;
  periodDays: number;
}

export interface SubcategoryStat {
  name: string;
  total: number;
  count: number;
  percentage: number;
}

export interface PricePoint {
  date: string;
  price: number;
  location: string;
  quantity: number;
}

export interface ItemStat {
  name: string;
  displayName: string;
  totalSpent: number;
  purchaseCount: number;
  avgPrice: number;
  lastDate: string;
  lastLocation: string;
  priceTrend: 'up' | 'down' | 'stable';
  priceHistory: PricePoint[];
  subcategories: string[];
}

export interface CategoryStat {
  id: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
  transactionCount: number;
  subcategories: SubcategoryStat[];
  items: ItemStat[];
}

export interface SupplierStat {
  name: string;
  total: number;
  transactionCount: number;
  lastDate: string;
  categories: string[];
  avgTicket: number;
}

export interface MonthlyBar {
  month: string;
  monthKey: string;
  income: number;
  expense: number;
  net: number;
}

// ─── Raw types from Supabase ──────────────────────────────────────────────────
interface RawItemRow {
  id: string;
  name: string;
  amount: number;
  quantity: number;
  unit_price: number | null;
  item_category: string[] | string | null;
  specification: string | null;
}

interface RawTransactionRow {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  location: string | null;
  category: string;
  category_id: string | null;
  items: RawItemRow[];
}

interface RawCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeItemCategories(raw: string[] | string | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [raw];
}

function buildDateRange(filters: AnalyticsFilters): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();

  if (filters.period === 'custom' && filters.customDateStart && filters.customDateEnd) {
    return {
      start: new Date(filters.customDateStart + 'T00:00:00').toISOString(),
      end: new Date(filters.customDateEnd + 'T23:59:59').toISOString(),
    };
  }

  const start = new Date();
  switch (filters.period) {
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'quarter':
      start.setDate(now.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      break;
    case 'semester':
      start.setDate(now.getDate() - 180);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'all':
      start.setFullYear(2000, 0, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }
  return { start: start.toISOString(), end };
}

function applyClientFilters(rows: RawTransactionRow[], filters: AnalyticsFilters): RawTransactionRow[] {
  return rows.filter(row => {
    if (filters.amountMin !== null && row.amount < filters.amountMin) return false;
    if (filters.amountMax !== null && row.amount > filters.amountMax) return false;
    if (filters.supplierSearch) {
      const term = filters.supplierSearch.toLowerCase();
      if (!row.location?.toLowerCase().includes(term)) return false;
    }
    if (filters.itemNameSearch) {
      const term = filters.itemNameSearch.toLowerCase();
      if (!row.items.some(i => i.name.toLowerCase().includes(term))) return false;
    }
    if (filters.subcategorySearch) {
      const term = filters.subcategorySearch.toLowerCase();
      const hasMatch = row.items.some(i => {
        const cats = normalizeItemCategories(i.item_category);
        return cats.some(c => c.toLowerCase().includes(term));
      });
      if (!hasMatch) return false;
    }
    return true;
  });
}

// ─── Pure Aggregation Functions ───────────────────────────────────────────────
function computeSummary(rows: RawTransactionRow[], periodDays: number): SummaryStats {
  let totalExpense = 0;
  let totalIncome = 0;
  let transactionCount = 0;

  rows.forEach(r => {
    const amt = Number(r.amount);
    if (r.type === 'expense') { totalExpense += amt; transactionCount++; }
    else if (r.type === 'income') { totalIncome += amt; transactionCount++; }
  });

  return {
    totalExpense,
    totalIncome,
    netBalance: totalIncome - totalExpense,
    dailyAverage: totalExpense / Math.max(periodDays, 1),
    transactionCount,
    periodDays,
  };
}

function computeItems(rows: RawTransactionRow[]): ItemStat[] {
  const map: Record<string, {
    displayName: string;
    totalSpent: number;
    count: number;
    priceHistory: PricePoint[];
    subcategories: Set<string>;
  }> = {};

  rows.forEach(row => {
    if (row.type !== 'expense') return;
    row.items.forEach(item => {
      const key = item.name.trim().toLowerCase();
      if (!map[key]) {
        map[key] = { displayName: item.name.trim(), totalSpent: 0, count: 0, priceHistory: [], subcategories: new Set() };
      }
      const price = item.unit_price ?? (item.amount / Math.max(item.quantity, 1));
      map[key].totalSpent += item.amount;
      map[key].count++;
      map[key].priceHistory.push({
        date: row.date.split('T')[0],
        price,
        location: row.location || '?',
        quantity: item.quantity,
      });
      normalizeItemCategories(item.item_category).forEach(c => map[key].subcategories.add(c));
    });
  });

  return Object.entries(map).map(([, v]) => {
    // Sort chronologically
    const sortedHistory = [...v.priceHistory].sort((a, b) => a.date.localeCompare(b.date));
    const prices = sortedHistory.map(p => p.price);
    const last = sortedHistory[sortedHistory.length - 1];

    // Trend: compare last price to avg of earlier prices
    let priceTrend: 'up' | 'down' | 'stable' = 'stable';
    if (prices.length >= 2) {
      const recent = prices[prices.length - 1];
      const prev = prices.slice(0, -1).reduce((a, b) => a + b, 0) / (prices.length - 1);
      const delta = (recent - prev) / Math.max(prev, 0.01);
      if (delta > 0.05) priceTrend = 'up';
      else if (delta < -0.05) priceTrend = 'down';
    }

    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      name: v.displayName.toLowerCase(),
      displayName: v.displayName,
      totalSpent: v.totalSpent,
      purchaseCount: v.count,
      avgPrice,
      lastDate: last?.date ?? '',
      lastLocation: last?.location ?? '?',
      priceTrend,
      priceHistory: sortedHistory,
      subcategories: Array.from(v.subcategories),
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);
}

function computeCategories(
  rows: RawTransactionRow[],
  totalExpense: number,
  catMap: Record<string, RawCategory>
): CategoryStat[] {
  const map: Record<string, {
    id: string; name: string; color: string; icon: string;
    total: number; count: number;
    subcatMap: Record<string, { total: number; count: number }>;
    itemRows: RawTransactionRow[];
  }> = {};

  rows.forEach(row => {
    if (row.type !== 'expense') return;
    const id = row.category_id ?? ('legacy_' + (row.category || 'outros').trim().toLowerCase());
    const resolved = row.category_id ? catMap[row.category_id] : null;
    const name = resolved?.name ?? row.category ?? 'Outros';
    const color = resolved?.color ?? CHART_COLORS[Object.keys(map).length % CHART_COLORS.length];
    const icon = resolved?.icon ?? '';

    if (!map[id]) {
      map[id] = { id, name, color, icon, total: 0, count: 0, subcatMap: {}, itemRows: [] };
    }
    map[id].total += Number(row.amount);
    map[id].count++;
    map[id].itemRows.push(row);

    row.items.forEach(item => {
      normalizeItemCategories(item.item_category).forEach(sub => {
        if (!sub) return;
        if (!map[id].subcatMap[sub]) map[id].subcatMap[sub] = { total: 0, count: 0 };
        map[id].subcatMap[sub].total += item.amount;
        map[id].subcatMap[sub].count++;
      });
    });
  });

  return Object.values(map)
    .sort((a, b) => b.total - a.total)
    .map((cat, i) => {
      const subcategories: SubcategoryStat[] = Object.entries(cat.subcatMap)
        .map(([name, s]) => ({
          name,
          total: s.total,
          count: s.count,
          percentage: cat.total > 0 ? (s.total / cat.total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

      const items = computeItems(cat.itemRows);

      return {
        id: cat.id,
        name: cat.name,
        color: cat.color || CHART_COLORS[i % CHART_COLORS.length],
        icon: cat.icon,
        total: cat.total,
        percentage: totalExpense > 0 ? (cat.total / totalExpense) * 100 : 0,
        transactionCount: cat.count,
        subcategories,
        items,
      };
    });
}

function computeSuppliers(rows: RawTransactionRow[]): SupplierStat[] {
  const map: Record<string, { total: number; count: number; lastDate: string; categories: Set<string> }> = {};

  rows.forEach(row => {
    if (row.type !== 'expense' || !row.location) return;
    const loc = row.location.trim();
    if (!map[loc]) map[loc] = { total: 0, count: 0, lastDate: '', categories: new Set() };
    map[loc].total += Number(row.amount);
    map[loc].count++;
    if (!map[loc].lastDate || row.date > map[loc].lastDate) map[loc].lastDate = row.date;
    const catName = row.category ?? 'Outros';
    map[loc].categories.add(catName);
  });

  return Object.entries(map)
    .map(([name, s]) => ({
      name,
      total: s.total,
      transactionCount: s.count,
      lastDate: s.lastDate.split('T')[0],
      categories: Array.from(s.categories),
      avgTicket: s.total / Math.max(s.count, 1),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);
}

function computeMonthlyEvolution(monthlyRaw: { amount: number; type: string; date: string }[]): MonthlyBar[] {
  const ptMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const map: Record<string, { income: number; expense: number }> = {};

  // Pre-populate last 6 calendar months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map[key] = { income: 0, expense: 0 };
  }

  monthlyRaw.forEach(r => {
    const key = r.date.substring(0, 7);
    if (!map[key]) return; // outside our 6-month window
    const amt = Number(r.amount);
    if (r.type === 'income') map[key].income += amt;
    else if (r.type === 'expense') map[key].expense += amt;
  });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        monthKey: key,
        month: ptMonths[month - 1],
        income: v.income,
        expense: v.expense,
        net: v.income - v.expense,
      };
    });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAnalyticsData(filters: AnalyticsFilters) {
  const [rawRows, setRawRows] = useState<RawTransactionRow[]>([]);
  const [rawCategories, setRawCategories] = useState<RawCategory[]>([]);
  const [monthlyRaw, setMonthlyRaw] = useState<{ amount: number; type: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateRange = useMemo(() => buildDateRange(filters), [
    filters.period, filters.customDateStart, filters.customDateEnd
  ]);

  const periodDays = useMemo(() => {
    const diff = new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [dateRange]);

  // Categories fetch (once — categories rarely change)
  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name, color, icon');
      setRawCategories((data as RawCategory[]) ?? []);
    } catch (err) {
      console.error('Categories fetch error:', err);
    }
  }, []);

  // Main fetch (server-side filtered by date + optional category)
  const fetchMain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('transactions')
        .select(`
          id, description, amount, type, date, location, category, category_id,
          items:transaction_items(id, name, amount, quantity, unit_price, item_category, specification)
        `)
        .is('deleted_at', null)
        .neq('type', 'transfer')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });

      if (filters.categoryIds.length > 0) {
        query = query.in('category_id', filters.categoryIds);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setRawRows((data as unknown as RawTransactionRow[]) ?? []);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.message ?? 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [dateRange, JSON.stringify(filters.categoryIds)]);

  // Monthly evolution fetch (independent — always last 6 months)
  const fetchMonthly = useCallback(async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    try {
      const { data } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .is('deleted_at', null)
        .neq('type', 'transfer')
        .gte('date', sixMonthsAgo.toISOString())
        .order('date', { ascending: true });
      setMonthlyRaw(data ?? []);
    } catch (err) {
      console.error('Monthly fetch error:', err);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchMain(); }, [fetchMain]);
  useEffect(() => { fetchMonthly(); }, [fetchMonthly]);

  const catLookup = useMemo(() => {
    const m: Record<string, RawCategory> = {};
    rawCategories.forEach(c => { m[c.id] = c; });
    return m;
  }, [rawCategories]);

  const filteredRows = useMemo(
    () => applyClientFilters(rawRows, filters),
    [rawRows, filters.amountMin, filters.amountMax, filters.supplierSearch, filters.itemNameSearch, filters.subcategorySearch]
  );

  const summary = useMemo(() => computeSummary(filteredRows, periodDays), [filteredRows, periodDays]);
  const categories = useMemo(() => computeCategories(filteredRows, summary.totalExpense, catLookup), [filteredRows, summary.totalExpense, catLookup]);
  const items = useMemo(() => computeItems(filteredRows), [filteredRows]);
  const suppliers = useMemo(() => computeSuppliers(filteredRows), [filteredRows]);
  const monthlyEvolution = useMemo(() => computeMonthlyEvolution(monthlyRaw), [monthlyRaw]);

  return {
    loading,
    error,
    summary,
    categories,
    items,
    suppliers,
    monthlyEvolution,
    refetch: fetchMain,
  };
}
