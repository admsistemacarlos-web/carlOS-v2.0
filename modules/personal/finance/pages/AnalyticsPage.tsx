
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  ArrowLeft, Search, TrendingUp, TrendingDown, Clock, 
  DollarSign, MapPin, ShoppingBag, AlertCircle, Filter, Calendar 
} from 'lucide-react';
import { useAnalyticsData, AnalyticsPeriod, CHART_COLORS } from '../hooks/useAnalyticsData';
import { formatDateBr } from '../utils/dateHelpers';

const KPICard = ({ title, value, subtext, icon, trend }: { title: string, value: string, subtext?: string, icon: React.ReactNode, trend?: 'up' | 'down' | 'stable' }) => (
  <div className="bg-card p-5 rounded-[2rem] border border-border shadow-sm flex items-start justify-between min-h-[120px]">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
      <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
      {subtext && <p className="text-xs text-muted-foreground font-medium">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-xl ${
      trend === 'up' ? 'bg-red-50 text-red-500' : 
      trend === 'down' ? 'bg-emerald-50 text-emerald-500' : 
      'bg-secondary text-muted-foreground'
    }`}>
      {icon}
    </div>
  </div>
);

const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children?: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
      active 
        ? 'bg-coffee text-white shadow-lg scale-105' 
        : 'bg-card text-muted-foreground border border-border hover:bg-secondary'
    }`}
  >
    {children}
  </button>
);

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const { loading, macroData, analyzeItemHistory } = useAnalyticsData(period);
  
  const [activeTab, setActiveTab] = useState<'categories' | 'items' | 'locations'>('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [itemData, setItemData] = useState<any>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    const result = await analyzeItemHistory(searchTerm);
    setItemData(result);
    setIsSearching(false);
  };

  useEffect(() => {
    if (activeTab !== 'items') {
      setSearchTerm('');
      setItemData(null);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/personal/finance')}
            className="p-2 -ml-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics & Inteligência</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Insights Financeiros</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')}>Categorias</TabButton>
          <TabButton active={activeTab === 'items'} onClick={() => setActiveTab('items')}>Explorador de Itens</TabButton>
          <TabButton active={activeTab === 'locations'} onClick={() => setActiveTab('locations')}>Fornecedores</TabButton>
        </div>
      </div>

      {/* --- ABA 1: CATEGORIAS --- */}
      {activeTab === 'categories' && (
        <div className="px-6 space-y-6 animate-fade-in">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando dados...</div>
          ) : macroData.categoryData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum dado financeiro encontrado.</div>
          ) : (
            <>
              {/* Gráfico de Rosca */}
              <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2 h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroData.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {macroData.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centro da Rosca */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Total</span>
                    <span className="text-lg font-bold text-foreground">{formatCurrency(macroData.totalExpense)}</span>
                  </div>
                </div>

                {/* Legenda Lateral */}
                <div className="w-full md:w-1/2 space-y-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Top Categorias</h3>
                  {macroData.categoryData.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm font-medium text-muted-foreground">{cat.name}</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* --- ABA 2: EXPLORADOR DE ITENS --- */}
      {activeTab === 'items' && (
        <div className="px-6 space-y-8 animate-fade-in">
          
          {/* Busca */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite um item (ex: Netflix, Omo, Gasolina)..."
              className="w-full bg-card border-2 border-border rounded-2xl pl-14 pr-4 py-4 text-lg text-foreground font-medium outline-none focus:border-coffee/20 transition-all shadow-sm placeholder:text-muted-foreground"
              autoFocus
            />
            <button type="submit" className="hidden">Buscar</button>
          </form>

          {isSearching ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse">Analisando histórico de compras...</div>
          ) : !itemData ? (
            <div className="py-20 text-center text-muted-foreground">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
              <p>Digite algo acima para descobrir padrões de consumo.</p>
            </div>
          ) : !itemData.found ? (
            <div className="py-12 text-center bg-card rounded-[2rem] border border-dashed border-border">
              <AlertCircle className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum registro encontrado para "{searchTerm}".</p>
            </div>
          ) : (
            /* RESULTADOS DA BUSCA */
            <div className="space-y-6 animate-fade-in">
              
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard 
                  title="Preço Médio" 
                  value={formatCurrency(itemData.averagePrice)} 
                  subtext={itemData.priceTrend === 'up' ? 'Tendência de alta' : 'Preço estável'}
                  trend={itemData.priceTrend}
                  icon={itemData.priceTrend === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                />
                <KPICard 
                  title="Intervalo de Compra" 
                  value={itemData.averageDurationDays ? `${itemData.averageDurationDays} dias` : 'N/A'} 
                  subtext={itemData.averageDurationDays ? 'Média de reposição' : 'Dados insuficientes'}
                  icon={<Clock size={20} />}
                />
                <KPICard 
                  title="Total Gasto (Histórico)" 
                  value={formatCurrency(itemData.totalSpent)} 
                  subtext={`${itemData.history.length} compras registradas`}
                  icon={<DollarSign size={20} />}
                />
              </div>

              {/* Gráfico de Tendência */}
              <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-6">Tendência de Preço</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...itemData.history].reverse()}> {/* Reverte para cronológico no gráfico */}
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => formatDateBr(str).slice(0, 5)} // Mostra apenas DD/MM
                        tick={{fontSize: 10, fill: '#a8a29e'}}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tickFormatter={(val) => `R$${val}`}
                        tick={{fontSize: 10, fill: '#a8a29e'}}
                        axisLine={false}
                        tickLine={false}
                        domain={['auto', 'auto']}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), 'Preço Unit.']}
                        labelFormatter={(label) => formatDateBr(label)}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#5F6F52" 
                        strokeWidth={3} 
                        dot={{fill: '#5F6F52', strokeWidth: 0, r: 4}} 
                        activeDot={{r: 6}}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Histórico Recente */}
              <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Últimas Aquisições</h3>
                <div className="space-y-3">
                  {itemData.history.slice(0, 5).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 hover:bg-secondary rounded-xl transition-colors border-b border-stone-50 last:border-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={12} className="text-olive" />
                          <span className="text-xs font-bold text-muted-foreground">
                            {formatDateBr(item.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
                          <MapPin size={10} /> {item.location}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{formatCurrency(item.price)}</p>
                        {item.quantity > 1 && <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* --- ABA 3: FORNECEDORES --- */}
      {activeTab === 'locations' && (
        <div className="px-6 space-y-6 animate-fade-in">
           {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando dados...</div>
          ) : macroData.locationData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Sem dados de localização.</div>
          ) : (
            <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm h-[600px] flex flex-col">
               <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-6">Top 10 Fornecedores (Por Valor)</h3>
               <div className="flex-1 w-full min-h-0">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={macroData.locationData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        tick={{fontSize: 11, fill: '#57534e', fontWeight: 600}} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip 
                        cursor={{fill: '#fafaf9'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), 'Total Gasto']}
                      />
                      <Bar dataKey="value" fill="#8D6E63" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
