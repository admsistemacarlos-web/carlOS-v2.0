---
name: commit-summary
description: Gera summary e description prontos para commit e push no GitHub, baseado nas mudanças da sessão atual.
---

# Commit Summary — carlOS

Analise as mudanças feitas nesta sessão e gere um resumo pronto para commit e push no GitHub.

## O que fazer

1. Execute `git diff HEAD` e `git status` para ver todas as mudanças staged e unstaged.
2. Execute `git log --oneline -5` para entender o estilo dos commits recentes do projeto.
3. Com base nas mudanças, gere:

---

### Summary (título do commit — max 72 caracteres)

- Imperativo, em português, sem ponto final
- Formato: `<tipo>: <descrição curta>`
- Tipos: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`
- Exemplo: `feat: adiciona filtro por data nas contas a pagar`

### Description (corpo do PR / commit detalhado)

- Liste em bullets o que foi alterado e **por quê**
- Agrupe por arquivo ou funcionalidade
- Máximo 5 bullets — seja direto
- Exemplo:
  ```
  - Adiciona campo `due_date` no filtro de contas (BillsPage)
  - Corrige bug onde contas pagas apareciam na listagem de vencidas
  - Padroniza o botão "Pagar" para usar o componente ButtonAction
  ```

---

## Output esperado

Apresente assim ao usuário:

```
**Summary:**
feat: adiciona filtro por data nas contas a pagar

**Description:**
- ...
- ...
- ...
```

Não crie o commit automaticamente. Apenas apresente o summary e a description para o usuário revisar antes de commitar.
