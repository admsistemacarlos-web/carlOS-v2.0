
/**
 * Helper to export data to CSV with Excel compatibility (BOM)
 */
export const exportToCSV = (data: any[], filename: string, headers: string[]) => {
  if (!data || !data.length) {
    alert("Sem dados para exportar.");
    return;
  }

  // Helper to format values for CSV
  const processValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    
    // Format Numbers to PT-BR (1.234,56)
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    // Escape quotes and wrap in quotes for string safety
    const stringValue = String(value);
    const escaped = stringValue.replace(/"/g, '""'); 
    return `"${escaped}"`;
  };

  // Construct CSV content
  // We use semicolon (;) as separator because it works better with Excel in PT-BR/European regions
  const headerRow = headers.join(';');
  
  const rows = data.map(row => {
    return Object.values(row).map(processValue).join(';');
  });

  const csvContent = [headerRow, ...rows].join('\n');

  // Create Blob with BOM (\uFEFF) to ensure Excel reads special characters (UTF-8) correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
