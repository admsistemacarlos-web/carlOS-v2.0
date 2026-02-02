
/**
 * Converte string de data (YYYY-MM-DD ou ISO) para string de data local (YYYY-MM-DD).
 * Uso: ao LER datas do banco para preencher o input type="date".
 * Remove a parte da hora para evitar conversões indesejadas de fuso horário na visualização.
 */
export function parseLocalDate(dateString: string): string {
  if (!dateString) return getTodayLocal();
  
  // Se já está no formato correto (YYYY-MM-DD), retorna
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  
  // Se tem hora (ISO string), extrai apenas a parte da data (YYYY-MM-DD)
  // Isso assume que a data foi salva com uma margem de segurança (ex: meio-dia)
  // ou que queremos apenas a data literal do UTC.
  return dateString.split('T')[0];
}

/**
 * Converte data do input (YYYY-MM-DD) para ISO String com hora fixa no MEIO-DIA (12:00:00).
 * Uso: ao SALVAR datas no banco.
 * Isso cria uma "âncora" segura. Mesmo que o fuso horário subtraia ou adicione algumas horas
 * ao converter para UTC, a data permanecerá no mesmo dia (ex: 12:00 Local -> 15:00 UTC).
 */
export function toISOWithNoon(dateString: string): string {
  if (!dateString) return new Date().toISOString();
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Cria data local no meio dia (12:00:00)
  // O mês no construtor Date começa em 0 (Janeiro = 0)
  const date = new Date(year, month - 1, day, 12, 0, 0);
  
  return date.toISOString();
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD baseada no locale 'en-CA' (padrão ISO para inputs).
 */
export function getTodayLocal(): string {
  return new Date().toLocaleDateString('en-CA');
}

/**
 * Formata uma data do banco (YYYY-MM-DD ou ISO) para o formato brasileiro (DD/MM/AAAA)
 * usando apenas manipulação de strings para evitar problemas de fuso horário (Off-by-one error).
 */
export function formatDateBr(dateString: string | null | undefined): string {
  if (!dateString) return '--';
  
  // Pega apenas a parte da data antes do 'T' se for ISO
  const datePart = dateString.split('T')[0];
  
  // Garante que temos YYYY-MM-DD
  const parts = datePart.split('-');
  if (parts.length !== 3) return datePart; // Retorna original se formato inválido
  
  const [year, month, day] = parts;
  
  return `${day}/${month}/${year}`;
}
