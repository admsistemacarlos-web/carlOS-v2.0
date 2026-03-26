import React, { useRef, useState } from 'react';
import { FileSignature, Plus, Trash2, Download, Pencil, Loader2, Paperclip, X, Check } from 'lucide-react';
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract } from '../../hooks/useContracts';
import { AgencyContract, ContractStatus } from '../../types/agency.types';

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'text-muted-foreground bg-secondary' },
  enviado:  { label: 'Enviado',  color: 'text-blue-400 bg-blue-400/10' },
  assinado: { label: 'Assinado', color: 'text-green-400 bg-green-400/10' },
  vencido:  { label: 'Vencido',  color: 'text-red-400 bg-red-400/10' },
};

const EMPTY_FORM = {
  title: '',
  status: 'rascunho' as ContractStatus,
  value: '',
  start_date: '',
  end_date: '',
  notes: '',
};

export default function ClientContracts({ clientId }: { clientId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: contracts, isLoading } = useContracts(clientId);
  const { mutate: createContract, isPending: isCreating } = useCreateContract();
  const { mutate: updateContract, isPending: isUpdating } = useUpdateContract();
  const { mutate: deleteContract, isPending: isDeleting } = useDeleteContract();

  const isSaving = isCreating || isUpdating;

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setIsAdding(false);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (c: AgencyContract) => {
    setEditingId(c.id);
    setFormData({
      title: c.title,
      status: c.status,
      value: c.value?.toString() ?? '',
      start_date: c.start_date ?? '',
      end_date: c.end_date ?? '',
      notes: c.notes ?? '',
    });
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;

    const contractData = {
      title: formData.title.trim(),
      status: formData.status,
      value: formData.value ? parseFloat(formData.value) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      notes: formData.notes || null,
      client_id: clientId,
    };

    if (editingId) {
      updateContract(
        { id: editingId, clientId, updates: contractData, file: selectedFile },
        { onSuccess: resetForm }
      );
    } else {
      createContract(
        { contractData, clientId, file: selectedFile },
        { onSuccess: resetForm }
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputCls = "w-full bg-background border border-secondary rounded-md px-3 py-2 text-sm text-foreground focus:border-primary outline-none transition-all placeholder-muted-foreground";

  return (
    <div className="bg-card p-6 rounded-xl border border-secondary shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
          <FileSignature size={14} /> Contratos
        </h3>
        {!isAdding && !editingId && (
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setFormData(EMPTY_FORM); }}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Plus size={14} /> Adicionar
          </button>
        )}
      </div>

      {/* FORMULÁRIO INLINE */}
      {(isAdding || editingId) && (
        <div className="mb-5 p-4 rounded-lg bg-secondary/50 border border-secondary space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Título *</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Contrato de Gestão de Tráfego"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputCls}>
                <option value="rascunho">Rascunho</option>
                <option value="enviado">Enviado</option>
                <option value="assinado">Assinado</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Valor (R$)</label>
              <input
                name="value"
                type="number"
                value={formData.value}
                onChange={handleChange}
                placeholder="0,00"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Início</label>
              <input name="start_date" type="date" value={formData.start_date} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Fim</label>
              <input name="end_date" type="date" value={formData.end_date} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Observações</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Cláusulas especiais, condições, etc."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Upload de arquivo */}
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <Paperclip size={13} />
            {selectedFile ? selectedFile.name : 'Anexar arquivo (PDF/DOC)'}
          </button>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={resetForm} className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.title.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 transition-all"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* LISTA */}
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : contracts?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 border-2 border-dashed border-secondary rounded-lg">
          <FileSignature size={20} className="text-muted-foreground/40" />
          <p className="text-muted-foreground text-xs">Nenhum contrato cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {contracts?.map(c => {
            const cfg = STATUS_CONFIG[c.status];
            return (
              <div key={c.id} className="group flex items-center justify-between p-3 rounded-lg bg-secondary border border-secondary hover:border-primary/30 transition-all">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {c.value ? `R$ ${c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                    {c.start_date ? ` · ${new Date(c.start_date + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}
                    {c.end_date ? ` → ${new Date(c.end_date + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {c.file_url && (
                    <a href={c.file_url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Baixar">
                      <Download size={14} />
                    </a>
                  )}
                  <button onClick={() => startEdit(c)}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteContract({ id: c.id, fileUrl: c.file_url, clientId })}
                    disabled={isDeleting}
                    className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50" title="Excluir">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
