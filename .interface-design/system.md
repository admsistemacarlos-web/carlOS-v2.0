# carlOS — Design System

**Produto:** Sistema Operacional Pessoal de Cadu. Um cockpit para uma pessoa gerenciar sua vida real — finanças, fé, saúde, pets, vinho, trabalho. Não é SaaS. Não é genérico. É pessoal.

**Sensação alvo:** Quente como um caderno de couro numa mesa de madeira. Mínimo como uma gaveta bem organizada. Pessoal — construído à mão, não industrializado.

---

## Foundation

| Token | Valor | Uso |
|-------|-------|-----|
| Font | Inter / Plus Jakarta Sans | Toda a interface |
| Base unit | 4px | Espaçamento |
| Radius cards | `rounded-[2rem]` | Cards hero e containers principais |
| Radius elementos | `rounded-2xl` / `rounded-xl` | Cards secundários, botões, inputs |
| Radius pequeno | `rounded-lg` | Botões inline, badges |

---

## Paleta

### Base (tema claro)
```
background:  hsl(0 0% 98%)      → quase branco, levemente aquecido
foreground:  hsl(0 0% 10%)      → quase preto
card:        hsl(0 0% 100%)     → branco puro
border:      hsl(0 0% 90%)      → cinza claro
muted:       hsl(0 0% 96%)      → fundo secundário
muted-fg:    hsl(0 0% 45%)      → texto de apoio
```

### Base (tema escuro)
```
background:  hsl(0 0% 10%)
foreground:  hsl(0 0% 98%)
card:        hsl(0 0% 14%)
border:      hsl(0 0% 25%)
muted:       hsl(0 0% 18%)
muted-fg:    hsl(0 0% 60%)
```

### Cores semânticas (use SEMPRE tokens, nunca raw Tailwind)
```
primary / primary-foreground    → invertido automático em dark mode
destructive                     → vermelho, erros, despesas, exclusão
```

### Cores por módulo
```
Espiritual:   hsl(16 45% 23%)   marrom terroso (#5D4037 family)
Saúde:        hsl(158 57% 18%)  verde profundo
Profissional: hsl(24 100% 54%)  laranja (#F97316) sobre fundo neutro-escuro
Sommelier:    #3C3633            marrom café
```

### Regra de ouro de cores
- **Nunca usar** `text-blue-600`, `text-emerald-600`, `text-green-500` ou similares raw
- **Usar sempre** `text-primary`, `text-destructive`, `text-muted-foreground`, `text-foreground`
- Cores de módulo ficam nas CSS variables, não inline

---

## Tipografia

| Papel | Classes | Uso |
|-------|---------|-----|
| Hero / Título | `text-3xl font-semibold tracking-tighter` | H1 de página |
| Valor herói | `text-4xl lg:text-5xl font-medium tracking-tighter` | Número principal do card herói |
| Label de seção | `text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground` | Rótulos acima de valores |
| Label de nav | `text-[9px] uppercase font-bold tracking-[0.3em]` | Seções na sidebar |
| Corpo nav | `text-[11px] font-semibold tracking-tight` | Itens da sidebar |
| Valor card | `text-base font-bold tracking-tight` | Cards secundários |
| Subtítulo | `text-xs font-medium tracking-wide text-muted-foreground` | Linhas de apoio |

**Assinatura do sistema:** Labels em ALL CAPS com `tracking-[0.2em]` a `tracking-[0.3em]` — é a voz visual do carlOS.

---

## Superfícies e Elevação

Elevação via **borda**, não sombra. Shadow é sparingly usado.

| Nível | Classes | Uso |
|-------|---------|-----|
| Base | `bg-background` | Canvas da página |
| Card padrão | `bg-card border border-border shadow-sm` | Containers de conteúdo |
| Card hover | `+ hover:shadow-md hover:-translate-y-0.5` | Cards clicáveis secundários |
| Hero invertido | `bg-primary text-primary-foreground` | Card principal de uma seção |
| Secundário | `bg-secondary border border-border` | Fundo alternativo dentro de cards |

---

## Padrões de Componente

### Card Herói (métricas principais)
```tsx
// Superfície invertida — domina visualmente, lida imediatamente
// bg-primary em light = escuro; em dark = claro → sempre contrasta
<div className="bg-primary text-primary-foreground p-8 rounded-[2rem]">
  <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-60">Label</p>
  <h2 className="text-4xl lg:text-5xl font-medium tracking-tighter">Valor</h2>
  <p className="text-[11px] opacity-50 mt-3">Subtítulo</p>
  {/* Ícone decorativo: absolute right, opacity-[0.07], strokeWidth: 1, size: 96 */}
</div>
```

### Card Secundário (métricas de apoio)
```tsx
// Nunca competem com o herói — menores, mais densos
<div className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">Label</p>
  <p className="text-base font-bold text-foreground tracking-tight">Valor</p>
  {/* Ícone: p-2 rounded-xl bg-secondary border border-border, size: 16 */}
</div>
```

### Cash Flow Summary
```tsx
// Linha fina entre o herói e os cards secundários
// Mostra os dados derivados que já existem mas não estavam visíveis
<div className="flex items-center gap-6">
  <div>
    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Label</p>
    <p className="text-sm font-bold text-foreground">Valor</p>
  </div>
  <span className="text-border text-lg">·</span>
  {/* repetir */}
</div>
```

### Item de Lista (transações, registros)
```tsx
// py-3 px-4, divide-y divide-border, hover:bg-accent
// Ícone: p-2 rounded-full, bg-primary/10 ou bg-destructive/10
// Valor positivo: text-foreground | negativo: text-destructive
// Ações (edit/delete): hidden group-hover:flex
```

### Separador de Data
```tsx
// Header de grupo de transações — peso baixo, não compete com conteúdo
<div className="flex items-center gap-3 mb-2 ml-2">
  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data</h3>
  <div className="h-[1px] flex-1 bg-border" />
</div>
```

---

## Navegação (Sidebar)

```
Sidebar: w-64, bg-card, border-r border-border
Header: p-8 pb-4
  - Título "carlOS": text-2xl font-semibold tracking-tighter
  - Subtítulo: text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground

Item ativo:   bg-accent text-accent-foreground border border-border
Item hover:   bg-accent/50 text-foreground
Label de seção: text-[9px] uppercase font-bold text-muted-foreground/50 tracking-[0.3em]

Sub-nav contextual (ex: finanças): aparece com animate-fade-in no bg-secondary rounded-2xl
```

---

## Interações

| Padrão | Classe |
|--------|--------|
| Hover card | `hover:-translate-y-0.5 hover:shadow-md` |
| Press card | `active:scale-[0.98]` |
| Press botão | `active:scale-95` |
| Fade in de página | `animate-fade-in` (keyframe: opacity 0→1, translateY 10px→0, 0.6s) |
| Loading skeleton | `bg-secondary animate-pulse rounded-*` |
| **Nunca usar** | `animate-bounce` em elementos funcionais |

---

## Módulos e Contextos

### Módulo Pessoal
- Tema: neutro quente (stone/zinc base)
- Sidebar: `bg-card` com borda
- Sensação: caderno pessoal

### Módulo Profissional
- `.professional-theme` class no container root
- Accent: laranja `#F97316` sobre fundo quase-preto
- Sensação: agência, trabalho, resultado

---

## Anti-padrões (nunca fazer)

- Usar cores raw do Tailwind (`blue-600`, `emerald-500`, `green-400`) — sempre usar tokens CSS
- Shadows como único diferenciador de elevação — usar borda + shadow juntos
- FAB ou botões com `animate-bounce` — contexto de produtividade, não gamificação
- Todos os cards com o mesmo peso visual — definir hierarquia clara (1 herói, N secundários)
- Títulos de cards com dados dinâmicos embutidos (ex: `"Gasto Cartão (março 2026)"`) — o contexto de data já existe no header da página
