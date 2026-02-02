# 🏗️ Arquitetura Técnica do carlOS

> **Documentação técnica completa da arquitetura, padrões e decisões de design**

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Alto Nível](#arquitetura-de-alto-nível)
3. [Gerenciamento de Estado](#gerenciamento-de-estado)
4. [Padrões de Código](#padrões-de-código)
5. [Estrutura de Módulos](#estrutura-de-módulos)
6. [Fluxo de Dados](#fluxo-de-dados)
7. [Estilização e UI](#estilização-e-ui)
8. [Segurança](#segurança)
9. [Performance](#performance)
10. [Roadmap Técnico](#roadmap-técnico)

---

## 1. Visão Geral

### 1.1 Conceito Arquitetural

O carlOS é construído como um **Monorepo Lógico** onde:
- Módulos são **independentes** em funcionalidade
- Compartilham apenas **autenticação** e **infraestrutura base**
- Permitem **isolamento total** de contexto

### 1.2 Princípios Fundamentais

```
✅ Separação de Responsabilidades (SoC)
✅ Don't Repeat Yourself (DRY)
✅ Single Source of Truth (SSOT)
✅ Composition over Inheritance
✅ Progressive Enhancement
```

---

## 2. Arquitetura de Alto Nível

### 2.1 Diagrama de Fluxo

```
┌─────────────────────────────────────────┐
│           index.html (Entry)            │
│   ┌─────────────────────────────────┐   │
│   │   Tailwind CSS (CDN)            │   │
│   │   :root & .dark CSS Variables   │   │
│   └─────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│            App.tsx (Router)             │
│   ┌─────────────────────────────────┐   │
│   │   HashRouter (React Router)     │   │
│   │   AuthContext Provider          │   │
│   │   QueryClient Provider          │   │
│   └─────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────┴────────┐
         │                 │
    /login              /fork
         │                 │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
    /personal       /professional
         │                 │
         ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│ PersonalLayout  │ │ProfessionalLayout│
│                 │ │                 │
│ ┌─────────────┐ │ │ ┌─────────────┐ │
│ │  Sidebar    │ │ │ │  Sidebar    │ │
│ │  (Stone)    │ │ │ │  (Dark)     │ │
│ └─────────────┘ │ │ └─────────────┘ │
│                 │ │                 │
│ ┌─────────────┐ │ │ ┌─────────────┐ │
│ │   Outlet    │ │ │ │   Outlet    │ │
│ │  (Modules)  │ │ │ │  (Modules)  │ │
│ └─────────────┘ │ │ └─────────────┘ │
└─────────────────┘ └─────────────────┘
```

### 2.2 Tecnologias Core

| Camada | Tecnologia | Versão | Propósito |
|--------|-----------|--------|-----------|
| **Framework** | React | 18.3+ | UI Library |
| **Linguagem** | TypeScript | 5.5+ | Type Safety |
| **Build Tool** | Vite | 5.0+ | Dev Server & Bundler |
| **Routing** | React Router | 6.x | SPA Navigation |
| **State (Server)** | TanStack Query | 5.x | Server State Management |
| **State (Auth)** | Context API | - | Authentication State |
| **Backend** | Supabase | Latest | BaaS (Auth + DB + Storage) |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **Icons** | Lucide React | Latest | Icon System |
| **Charts** | Recharts | 2.x | Data Visualization |

---

## 3. Gerenciamento de Estado

### 3.1 Estratégia de Estado

O carlOS utiliza uma abordagem **híbrida** para estado:

```typescript
┌─────────────────────────────────────────┐
│          CAMADAS DE ESTADO              │
├─────────────────────────────────────────┤
│ 1. Server State (TanStack Query)        │
│    → Dados do Supabase                  │
│    → Cache automático                   │
│    → Refetch & Invalidation             │
├─────────────────────────────────────────┤
│ 2. Auth State (Context API)             │
│    → Sessão do usuário                  │
│    → Proteção de rotas                  │
├─────────────────────────────────────────┤
│ 3. UI State (useState/useReducer)       │
│    → Estados de modais                  │
│    → Formulários                        │
│    → Filtros temporários                │
└─────────────────────────────────────────┘
```

### 3.2 TanStack Query (React Query)

**Por que React Query?**
- ✅ Cache automático e inteligente
- ✅ Refetch em segundo plano
- ✅ Invalidação granular
- ✅ Otimistic Updates
- ✅ Menos código boilerplate

**Exemplo de Implementação:**

```typescript
// Hook customizado para transações
export function useTransactions(filters: DateFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', filters.startDate)
        .lte('date', filters.endDate);
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Uso no componente
function TransactionsPage() {
  const { data, isLoading } = useTransactions({ 
    startDate, 
    endDate 
  });
  // Interface atualiza automaticamente quando filtros mudam
}
```

### 3.3 Context API para Auth

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

// Uso em rotas protegidas
<ProtectedRoute>
  <PersonalLayout />
</ProtectedRoute>
```

---

## 4. Padrões de Código

### 4.1 Custom Hooks Pattern

**Objetivo:** Abstrair completamente o Supabase dos componentes

```typescript
// ❌ ERRADO (Acoplamento direto)
function MyComponent() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    supabase.from('table').select('*').then(...)
  }, []);
}

// ✅ CORRETO (Hook customizado)
function MyComponent() {
  const { data, isLoading } = useMyData();
  // Componente não sabe que Supabase existe
}
```

### 4.2 Factory Pattern para Hooks Genéricos

**Caso de Uso:** Módulo Espiritual

```typescript
// Hook genérico reutilizável
export function useSpiritual<T>(tableName: string) {
  const queryClient = useQueryClient();

  const { data: items } = useQuery({
    queryKey: [tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      if (error) throw error;
      return data as T[];
    },
  });

  const createItem = useMutation({
    mutationFn: async (item: Partial<T>) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
    },
  });

  return { items, createItem, /* deleteItem, updateItem */ };
}

// Reutilização para diferentes entidades
const { items: prayers, createItem: createPrayer } = useSpiritual<Prayer>('prayers');
const { items: sermons, createItem: createSermon } = useSpiritual<Sermon>('sermons');
```

### 4.3 Service Layer Pattern

**Objetivo:** Extrair lógica de negócio complexa

```typescript
// services/InvoiceService.ts
export class InvoiceService {
  static calculateDueDate(closingDay: number, dueDay: number): Date {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    let dueMonth = currentDay > closingDay 
      ? currentMonth + 1 
      : currentMonth;
    
    return new Date(today.getFullYear(), dueMonth, dueDay);
  }

  static shouldCloseInvoice(
    invoice: Invoice, 
    closingDay: number
  ): boolean {
    // Lógica complexa isolada
  }
}

// Uso nos hooks
const dueDate = InvoiceService.calculateDueDate(
  card.closing_day, 
  card.due_day
);
```

---

## 5. Estrutura de Módulos

### 5.1 Anatomia de um Módulo

Cada módulo segue esta estrutura consistente:

```
module-name/
├── types.ts              # Tipagem TypeScript
├── hooks/                # Custom Hooks (Data Layer)
│   ├── useModuleData.ts
│   └── useModuleLogic.ts
├── components/           # Componentes específicos
│   ├── forms/
│   ├── modals/
│   └── widgets/
├── pages/                # Páginas (Rotas)
│   ├── Dashboard.tsx
│   └── DetailPage.tsx
├── utils/                # Funções auxiliares
│   └── helpers.ts
└── data/                 # Dados estáticos (se aplicável)
    └── constants.ts
```

### 5.2 Módulo Finance (Exemplo Completo)

O módulo mais complexo do sistema:

```
finance/
├── types/
│   └── finance.types.ts      # Account, Card, Transaction, Invoice
├── hooks/
│   ├── useFinanceData.ts     # Hook principal (CRUD)
│   └── useAnalyticsData.ts   # Dados para gráficos
├── components/
│   ├── forms/
│   │   ├── AccountForm.tsx
│   │   ├── CardForm.tsx
│   │   └── TransactionForm.tsx
│   ├── modals/
│   │   ├── BillFormModal.tsx
│   │   ├── CardFormDialog.tsx
│   │   ├── CreditTransactionModal.tsx
│   │   ├── InstallmentDetailsModal.tsx
│   │   ├── InvoicePaymentDialog.tsx
│   │   └── TransactionModal.tsx
│   ├── InvoiceView.tsx
│   └── ConfirmDialog.tsx
├── pages/
│   ├── FinanceDashboard.tsx
│   ├── AccountsPage.tsx
│   ├── CardsPage.tsx
│   ├── CardDetailsPage.tsx
│   ├── CardInvoicesPage.tsx
│   ├── TransactionsPage.tsx
│   ├── BillsPage.tsx
│   ├── AvailableLimitsPage.tsx
│   └── AnalyticsPage.tsx
└── utils/
    ├── dateHelpers.ts        # Manipulação de datas
    └── exportHelper.ts       # Exportação de dados
```

**Funcionalidades Principais:**

1. **Gestão de Contas Bancárias**
   - Múltiplas contas
   - Saldo atualizado em tempo real
   - Histórico de transações

2. **Sistema de Cartões de Crédito**
   - Gerenciamento de limites
   - Fechamento automático de faturas
   - Parcelamento inteligente
   - Visualização de fatura mês a mês

3. **Transações**
   - Receitas e despesas
   - Categorização
   - Filtros avançados (data, tipo, categoria)
   - Transferências entre contas

4. **Analytics**
   - Gráficos de receitas vs despesas
   - Evolução de saldo
   - Distribuição por categoria
   - Relatórios exportáveis

---

## 6. Fluxo de Dados

### 6.1 Ciclo de Vida de uma Transação

```
┌─────────────────────────────────────────────────┐
│  1. Usuário clica "Nova Transação"              │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│  2. Modal renderizado via Portal                │
│     <TransactionModal isOpen={true} />          │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│  3. Formulário preenchido (React Hook Form)     │
│     Validação com Zod Schema                    │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│  4. Submit → useMutation (React Query)          │
│     mutationFn: async (data) => {               │
│       await supabase.from('transactions')       │
│         .insert(data)                           │
│     }                                           │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│  5. onSuccess: Invalidate Queries               │
│     queryClient.invalidateQueries({             │
│       queryKey: ['transactions']                │
│     })                                          │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│  6. UI Atualiza Automaticamente                 │
│     - Lista de transações refetch               │
│     - Saldo da conta atualiza                   │
│     - Gráficos recalculam                       │
└─────────────────────────────────────────────────┘
```

### 6.2 Otimistic Updates

Para operações que devem parecer instantâneas:

```typescript
const updateTransaction = useMutation({
  mutationFn: async (updated: Transaction) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updated)
      .eq('id', updated.id);
    if (error) throw error;
    return data;
  },
  onMutate: async (newTransaction) => {
    // Cancela refetches em progresso
    await queryClient.cancelQueries({ 
      queryKey: ['transactions'] 
    });

    // Snapshot do estado anterior
    const previous = queryClient.getQueryData(['transactions']);

    // Atualiza cache otimisticamente
    queryClient.setQueryData(['transactions'], (old: any) =>
      old.map((t: Transaction) =>
        t.id === newTransaction.id ? newTransaction : t
      )
    );

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback em caso de erro
    if (context?.previous) {
      queryClient.setQueryData(
        ['transactions'], 
        context.previous
      );
    }
  },
});
```

---

## 7. Estilização e UI

### 7.1 Sistema de Design Tokens

**Variáveis CSS (index.html):**

```css
:root {
  /* Módulo Pessoal - Paleta Stone/Cream/Olive */
  --personal-primary: #78716c;
  --personal-accent: #84cc16;
  --personal-bg: #fafaf9;
  
  /* Módulo Profissional - Paleta Dark/Orange */
  --professional-primary: #1c1917;
  --professional-accent: #f97316;
  --professional-bg: #0c0a09;
}

.dark {
  --personal-bg: #292524;
  --professional-bg: #000000;
}
```

**Mapeamento Tailwind:**

```javascript
// tailwind.config.js (conceitual)
module.exports = {
  theme: {
    extend: {
      colors: {
        personal: {
          primary: 'var(--personal-primary)',
          accent: 'var(--personal-accent)',
        },
        professional: {
          primary: 'var(--professional-primary)',
          accent: 'var(--professional-accent)',
        },
      },
    },
  },
};
```

### 7.2 Componentes UI Premium

**Características:**

- Bordas arredondadas agressivas: `rounded-[2rem]`
- Sombras suaves: `shadow-2xl`
- Transições suaves: `transition-all duration-300`
- Hover effects: `hover:shadow-lg hover:scale-[1.02]`
- Active states: `active:scale-95`

**Exemplo de Cartão:**

```tsx
<div className="
  bg-white dark:bg-stone-900
  rounded-[2rem]
  shadow-xl hover:shadow-2xl
  transition-all duration-300
  hover:scale-[1.02] active:scale-95
  p-8
  border border-stone-200 dark:border-stone-800
">
  {children}
</div>
```

### 7.3 Responsividade

**Breakpoints Tailwind:**

```
sm:  640px  (mobile landscape)
md:  768px  (tablet)
lg:  1024px (laptop)
xl:  1280px (desktop)
2xl: 1536px (large desktop)
```

**Padrão Mobile-First:**

```tsx
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-4
">
  {/* Automaticamente adapta o layout */}
</div>
```

---

## 8. Segurança

### 8.1 Row Level Security (RLS) no Supabase

**Todas as tabelas implementam RLS:**

```sql
-- Exemplo: Transações devem pertencer ao usuário
CREATE POLICY "Users can only see their own transactions"
ON transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own transactions"
ON transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 8.2 Proteção de Rotas

```tsx
<ProtectedRoute>
  <PersonalLayout />
</ProtectedRoute>

// ProtectedRoute.tsx
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}
```

### 8.3 Sanitização de Inputs

- Todos os formulários usam **Zod** para validação
- Proteção contra XSS via React (escaping automático)
- Validação server-side no Supabase

---

## 9. Performance

### 9.1 Otimizações Implementadas

| Técnica | Implementação | Benefício |
|---------|---------------|-----------|
| **Code Splitting** | React.lazy() + Suspense | Lazy load de rotas |
| **Memoização** | useMemo, useCallback | Evita re-renders |
| **Virtualização** | (Futuro) react-window | Listas grandes |
| **Image Optimization** | WebP, lazy loading | Carregamento rápido |
| **Cache Agressivo** | React Query staleTime | Menos requests |

### 9.2 Métricas Alvo

```
First Contentful Paint (FCP):  < 1.5s
Largest Contentful Paint (LCP): < 2.5s
Time to Interactive (TTI):      < 3.5s
Cumulative Layout Shift (CLS):  < 0.1
```

---

## 10. Roadmap Técnico

### 10.1 Curto Prazo (1-3 meses)

- [ ] Substituir `window.alert()` por Toast System
- [ ] Implementar Error Boundaries
- [ ] Adicionar testes unitários (Vitest)
- [ ] Documentar schema SQL do Supabase
- [ ] PWA (Progressive Web App)

### 10.2 Médio Prazo (3-6 meses)

- [ ] Migração para React Query v5
- [ ] Implementar Storybook
- [ ] CI/CD com GitHub Actions
- [ ] Testes E2E (Playwright)
- [ ] Internacionalização (i18n)

### 10.3 Longo Prazo (6-12 meses)

- [ ] Mobile app (React Native)
- [ ] Real-time collaboration (Supabase Realtime)
- [ ] AI-powered insights
- [ ] API pública para integrações
- [ ] Marketplace de extensões

---

## 📚 Recursos Adicionais

- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Última atualização:** Fevereiro 2026  
**Versão da Arquitetura:** 1.0.0