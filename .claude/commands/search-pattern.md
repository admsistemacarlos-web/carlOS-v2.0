# Padrão de Busca Abrangente - carlOS

Implemente ou audite o sistema de busca no contexto atual usando o padrão estabelecido no módulo Estudos.

## Princípio

Toda busca deve cobrir **todos os campos de texto relevantes** da entidade — nunca só o título. O usuário não sabe em qual campo está a informação; ele só sabe o que quer encontrar.

---

## Regras por tipo de busca

### 1. Client-side (dados já carregados em memória)

**Padrão:**
```typescript
const query = searchTerm.toLowerCase().trim();
const filtered = items.filter(item => {
  if (!query) return true;
  return (
    item.title.toLowerCase().includes(query) ||
    item.category?.toLowerCase().includes(query) ||
    item.description?.toLowerCase().includes(query) ||
    item.content?.toLowerCase().includes(query)
  );
});
```

**Checklist:**
- [ ] `title` — sempre
- [ ] `category` / `type` / `tag` — se existir
- [ ] `description` / `notes` / `summary` — se existir
- [ ] `content` / `body` / `text` — se existir **e estiver carregado na query**
- [ ] Se `content` não está no select, adicionar ao fetch antes de usar no filtro

---

### 2. Server-side Supabase (busca via `.ilike`)

**Padrão:**
```typescript
const pattern = `%${term}%`;

supabase
  .from('table')
  .select('id, title, category, description')
  .or(`title.ilike.${pattern},category.ilike.${pattern},description.ilike.${pattern}`)
```

**Checklist:**
- [ ] Usar `.or()` para múltiplos campos, nunca `.ilike()` simples
- [ ] Incluir `content` no `.or()` quando a tabela tiver esse campo
- [ ] Filtrar ownership via `user_id` direto **ou** via join com `!inner` se `user_id` pode estar ausente em registros antigos:

```typescript
// ✅ Seguro — filtra via curso pai (user_id sempre preenchido no pai)
supabase
  .from('lessons')
  .select(`id, title, content, modules!inner(title, courses!inner(id, title, user_id))`)
  .eq('modules.courses.user_id', user.id)
  .or(`title.ilike.${pattern},content.ilike.${pattern}`)
```

---

### 3. Busca híbrida — entidade pai + conteúdo filho via DB

Usado quando a lista mostra itens de nível superior (ex: cursos), mas o usuário pode buscar por conteúdo de sub-entidades (ex: aulas dentro do curso).

**Padrão:**
```typescript
// State adicional
const [contentMatchIds, setContentMatchIds] = useState<Set<string>>(new Set());

// Effect com debounce (400ms)
useEffect(() => {
  const query = searchTerm.trim();
  if (!query || !user) { setContentMatchIds(new Set()); return; }

  const timeout = setTimeout(async () => {
    const pattern = `%${query}%`;
    const { data } = await supabase
      .from('child_table')                           // ex: lessons
      .select(`parent!inner(grandparent!inner(id, user_id))`) // ex: modules!inner(courses!inner(...))
      .eq('parent.grandparent.user_id', user.id)
      .or(`title.ilike.${pattern},content.ilike.${pattern}`);

    if (data) {
      const ids = new Set<string>(
        data.map((row: any) => row.parent?.grandparent?.id).filter(Boolean)
      );
      setContentMatchIds(ids);
    }
  }, 400);

  return () => clearTimeout(timeout);
}, [searchTerm, user]);

// No filtro da lista principal
const filtered = items.filter(item => {
  if (!query) return true;
  return (
    item.title.toLowerCase().includes(query) ||
    item.description?.toLowerCase().includes(query) ||
    contentMatchIds.has(item.id)           // ← inclui itens com conteúdo filho matching
  );
});

// useMemo deve depender de contentMatchIds também
}, [items, searchTerm, contentMatchIds]);
```

---

## Checklist de auditoria para um novo módulo

Antes de implementar, responder:

1. **Quais entidades têm busca?** (listar todas as páginas com `<input>` de search)
2. **Para cada busca:**
   - Quais campos são buscados hoje?
   - Quais campos existem na tabela mas não são buscados?
   - O campo `content`/`body` está sendo carregado no select? Se não, adicionar.
   - O filtro de `user_id` é via campo direto ou precisa de join?
3. **Existe busca em lista de pai que deveria encontrar conteúdo filho?** → usar padrão híbrido

## Referência — módulo Estudos (implementação de referência)

| Página | Tipo | Campos buscados |
|--------|------|----------------|
| StudiesDashboard | Híbrido | curso: title+category+description / lesson(DB): title+content |
| CourseList (Biblioteca) | Client | title + category + description |
| CourseDetail | Client | módulo: title+description / aula: title+description+content |
| LessonDetail (sidebar) | Client | módulo: title+description / aula: title+content |
| SearchPage | Server (.ilike) | curso: title+description+category / módulo: title+description / aula: title+content |
