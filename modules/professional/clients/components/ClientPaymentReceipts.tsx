import React, { useRef, useState } from 'react';
import { Receipt, Plus, Trash2, Download, Loader2, Paperclip, X, Check, TrendingUp } from 'lucide-react';
import { usePaymentReceipts, useCreatePaymentReceipt, useDeletePaymentReceipt } from '../../hooks/usePaymentReceipts';
import { PaymentMethodDoc } from '../../types/agency.types';

const METHOD_LABELS: Record<PaymentMethodDoc, string> = {
  pix: 'PIX',
  ted: 'TED',
  dinheiro: 'Dinheiro',
  cartão: 'Cartão',
  boleto: 'Boleto',
};

const METHOD_COLORS: Record<PaymentMethodDoc, string> = {
  pix: 'text-green-400 bg-green-400/10',
  ted: 'text-blue-400 bg-blue-400/10',
  dinheiro: 'text-yellow-400 bg-yellow-400/10',
  cartão: 'text-purple-400 bg-purple-400/10',
  boleto: 'text-orange-400 bg-orange-400/10',
};

const EMPTY_FORM = {
  description: '',
  amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: '' as PaymentMethodDoc | '',
  reference: '',
  notes: '',
};

export default function ClientPaymentReceipts({ clientId }: { clientId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: receipts, isLoading } = usePaymentReceipts(clientId);
  const { mutate: createReceipt, isPending: isCreating } = useCreatePaymentReceipt();
  const { mutate: deleteReceipt, isPending: isDeleting } = useDeletePaymentReceipt();

  const totalReceived = receipts?.reduce((sum, r) => sum + (r.amount ?? 0), 0) ?? 0;

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setIsAdding(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    if (!formData.description.trim() || !formData.amount || !formData.payment_date) return;

    createReceipt({
      receiptData: {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method || null,
        reference: formData.reference || null,
        notes: formData.notes || null,
        client_id: clientId,
      },
      clientId,
      file: selectedFile,
    }, { onSuccess: resetForm });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputCls = "w-full bg-background border border-secondary rounded-md px-3 py-2 text-sm text-foreground focus:border-primary outline-none transition-all placeholder-muted-foreground";

  return (
    <div className="bg-card p-6 rounded-xl border border-secondary shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
          <Receipt size={14} /> Recibos de Pagamento
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Plus size={14} /> Registrar
          </button>
        )}
      </div>

      {/* TOTAL RECEBIDO */}
      {receipts && receipts.length > 0 && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-lg bg-green-500/15 border border-green-500/30">
          <TrendingUp size={15} className="text-green-400 shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">Total recebido</span>
          <span className="ml-auto text-base font-bold text-green-400 font-mono tabular-nums">{formatCurrency(totalReceived)}</span>
        </div>
      )}

      {/* FORMULÁRIO INLINE */}
      {isAdding && (
        <div className="mb-5 p-4 rounded-lg bg-secondary/50 border border-secondary space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Descrição *</label>
            <input
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ex: Mensalidade março/2026"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Valor (R$) *</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0,00"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Data *</label>
              <input name="payment_date" type="date" value={formData.payment_date} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Forma de Pagamento</label>
              <select name="payment_method" value={formData.payment_method} onChange={handleChange} className={inputCls}>
                <option value="">Selecionar</option>
                <option value="pix">PIX</option>
                <option value="ted">TED</option>
                <option value="boleto">Boleto</option>
                <option value="cartão">Cartão</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Referência / NF</label>
              <input
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="Opcional"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Observações</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Opcional"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Upload de comprovante */}
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
            onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <Paperclip size={13} />
            {selectedFile ? selectedFile.name : 'Anexar comprovante (opcional)'}
          </button>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={resetForm} className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
            <button
              onClick={handleSave}
              disabled={isCreating || !formData.description.trim() || !formData.amount || !formData.payment_date}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 transition-all"
            >
              {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* LISTA */}
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : receipts?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 border-2 border-dashed border-secondary rounded-lg">
          <Receipt size={20} className="text-muted-foreground/40" />
          <p className="text-muted-foreground text-xs">Nenhum pagamento registrado.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {receipts?.map(r => {
            const method = r.payment_method as PaymentMethodDoc | null;
            return (
              <div key={r.id} className="group flex items-center justify-between p-3 rounded-lg bg-secondary border border-secondary hover:border-primary/30 transition-all">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">{r.description}</p>
                    {method && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${METHOD_COLORS[method]}`}>
                        {METHOD_LABELS[method]}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {new Date(r.payment_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    {r.reference ? ` · ${r.reference}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-base font-bold text-green-400 tabular-nums">{formatCurrency(r.amount)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {r.file_url && (
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Comprovante">
                        <Download size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => deleteReceipt({ id: r.id, fileUrl: r.file_url, clientId })}
                      disabled={isDeleting}
                      className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
