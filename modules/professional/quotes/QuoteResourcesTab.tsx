import React, { useState } from 'react';
import { 
  Link as LinkIcon, FileText, Trash2, Plus, 
  ExternalLink, Loader2, Save, X, Edit2 
} from 'lucide-react';
import { 
  useQuoteResources, 
  useCreateQuoteResource, 
  useDeleteQuoteResource,
  useUpdateQuoteResource,
  QuoteResource 
} from '../hooks/useQuoteResources';

// ============================================================================
// TYPES
// ============================================================================

interface QuoteResourcesTabProps {
  quoteId: string | undefined;
}

   type ResourceType = 'link' | 'file' | 'note';


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QuoteResourcesTab({ quoteId }: QuoteResourcesTabProps) {
  const { data: resources, isLoading } = useQuoteResources(quoteId);
  const createResource = useCreateQuoteResource();
  const deleteResource = useDeleteQuoteResource();
  const updateResource = useUpdateQuoteResource();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formType, setFormType] = useState<ResourceType>('link');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formNote, setFormNote] = useState('');

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    resetForm();
  };

  const handleStartEdit = (resource: QuoteResource) => {
    setEditingId(resource.id);
    setFormType(resource.resource_type);
    setFormTitle(resource.title);
    setFormDescription(resource.description || '');
    setFormUrl(resource.url || '');
    setFormNote(resource.note_content || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormUrl('');
    setFormNote('');
    setFormType('link');
  };

  const handleSubmit = async () => {
    if (!quoteId) return;
    if (!formTitle.trim()) {
      alert('Título é obrigatório');
      return;
    }

    if (formType === 'link' && !formUrl.trim()) {
      alert('URL é obrigatória para links');
      return;
    }

    try {
      if (editingId) {
        // UPDATE
        await updateResource.mutateAsync({
          id: editingId,
          quoteId,
          data: {
            title: formTitle,
            description: formDescription || undefined,
            url: formType === 'link' ? formUrl : undefined,
            note_content: formType === 'note' ? formNote : undefined,
          }
        });
        setEditingId(null);
      } else {
        // CREATE
        await createResource.mutateAsync({
          quote_id: quoteId,
          resource_type: formType,
          title: formTitle,
          description: formDescription || undefined,
          url: formType === 'link' ? formUrl : undefined,
          note_content: formType === 'note' ? formNote : undefined,
        });
        setIsAdding(false);
      }
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar recurso:', error);
      alert('Erro ao salvar recurso');
    }
  };

  const handleDelete = async (id: string) => {
    if (!quoteId) return;
    if (!confirm('Tem certeza que deseja excluir este recurso?')) return;

    try {
      await deleteResource.mutateAsync({ id, quoteId });
    } catch (error) {
      console.error('Erro ao deletar recurso:', error);
      alert('Erro ao deletar recurso');
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (!quoteId) {
    return (
      <div className="text-center py-12 text-[#737373]">
        <p>Salve a proposta primeiro para adicionar recursos.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-[#E09B6B]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pt-4">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Recursos da Proposta</h3>
          <p className="text-xs text-[#737373] mt-1">
            Links, arquivos e notas para organizar materiais relacionados
          </p>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={handleStartAdd}
            className="bg-[#E09B6B] hover:bg-[#E09B6B]/90 text-[#1a1a1a] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus size={16} /> Adicionar Recurso
          </button>
        )}
      </div>

      {/* ADD/EDIT FORM */}
      {(isAdding || editingId) && (
        <div className="bg-[#202020] border border-[#404040] rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {editingId ? 'Editar Recurso' : 'Novo Recurso'}
            </h4>
          </div>

          {/* TYPE SELECTOR (only for new resources) */}
          {!editingId && (
            <div className="flex gap-3">
              <button
                onClick={() => setFormType('link')}
                className={`flex-1 py-3 rounded-lg border text-sm font-bold uppercase tracking-wider transition-all ${
                  formType === 'link'
                    ? 'bg-[#E09B6B] text-[#1a1a1a] border-[#E09B6B]'
                    : 'bg-[#2C2C2C] text-[#737373] border-[#404040] hover:border-[#E09B6B]/50'
                }`}
              >
                <LinkIcon size={16} className="inline mr-2" />
                Link
              </button>
              <button
                onClick={() => setFormType('note')}
                className={`flex-1 py-3 rounded-lg border text-sm font-bold uppercase tracking-wider transition-all ${
                  formType === 'note'
                    ? 'bg-[#E09B6B] text-[#1a1a1a] border-[#E09B6B]'
                    : 'bg-[#2C2C2C] text-[#737373] border-[#404040] hover:border-[#E09B6B]/50'
                }`}
              >
                <FileText size={16} className="inline mr-2" />
                Nota
              </button>
            </div>
          )}

          {/* TITLE */}
          <div>
            <label className="block text-xs font-bold text-[#737373] uppercase tracking-wider mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Ex: Briefing do Cliente, Material de Referência"
              className="w-full bg-[#2C2C2C] border border-[#404040] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#E09B6B]"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-xs font-bold text-[#737373] uppercase tracking-wider mb-2">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Breve descrição do recurso"
              className="w-full bg-[#2C2C2C] border border-[#404040] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#E09B6B]"
            />
          </div>

          {/* URL (if link) */}
          {formType === 'link' && (
            <div>
              <label className="block text-xs font-bold text-[#737373] uppercase tracking-wider mb-2">
                URL *
              </label>
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#2C2C2C] border border-[#404040] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#E09B6B]"
              />
            </div>
          )}

          {/* NOTE CONTENT (if note) */}
          {formType === 'note' && (
            <div>
              <label className="block text-xs font-bold text-[#737373] uppercase tracking-wider mb-2">
                Conteúdo
              </label>
              <textarea
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="Escreva suas anotações aqui..."
                rows={6}
                className="w-full bg-[#2C2C2C] border border-[#404040] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#E09B6B] resize-none"
              />
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={createResource.isPending || updateResource.isPending}
              className="flex-1 bg-[#E09B6B] hover:bg-[#E09B6B]/90 text-[#1a1a1a] py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {(createResource.isPending || updateResource.isPending) ? (
                <><Loader2 size={16} className="animate-spin" /> Salvando...</>
              ) : (
                <><Save size={16} /> Salvar</>
              )}
            </button>
            <button
              onClick={editingId ? handleCancelEdit : handleCancelAdd}
              className="px-6 py-2.5 bg-[#2C2C2C] hover:bg-[#333] text-[#737373] rounded-lg text-sm font-bold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* RESOURCES LIST */}
      <div className="space-y-3">
        {!resources || resources.length === 0 ? (
          <div className="bg-[#202020] border border-[#404040] rounded-xl p-12 text-center">
            <div className="text-[#404040] mb-3">
              <LinkIcon size={48} className="mx-auto" />
            </div>
            <p className="text-[#737373] text-sm">
              Nenhum recurso adicionado ainda.
            </p>
            <p className="text-[#5c5c5c] text-xs mt-1">
              Use o botão acima para adicionar links, notas ou arquivos.
            </p>
          </div>
        ) : (
          resources.map((resource) => (
            <div
              key={resource.id}
              className="bg-[#202020] border border-[#404040] hover:border-[#E09B6B]/30 rounded-xl p-5 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* ICON & TYPE */}
                  <div className="flex items-center gap-2 mb-2">
                    {resource.resource_type === 'link' ? (
                      <LinkIcon size={16} className="text-[#E09B6B] flex-shrink-0" />
                    ) : (
                      <FileText size={16} className="text-[#E09B6B] flex-shrink-0" />
                    )}
                    <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
                      {resource.resource_type === 'link' ? 'Link' : 'Nota'}
                    </span>
                  </div>

                  {/* TITLE */}
                  <h4 className="text-white font-bold text-sm mb-1">
                    {resource.title}
                  </h4>

                  {/* DESCRIPTION */}
                  {resource.description && (
                    <p className="text-[#737373] text-xs mb-2">
                      {resource.description}
                    </p>
                  )}

                  {/* URL (if link) */}
                  {resource.resource_type === 'link' && resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E09B6B] hover:text-[#E09B6B]/80 text-xs flex items-center gap-1 mt-2 group/link"
                    >
                      <span className="truncate max-w-md">{resource.url}</span>
                      <ExternalLink size={12} className="flex-shrink-0 group-hover/link:translate-x-0.5 transition-transform" />
                    </a>
                  )}

                  {/* NOTE CONTENT (if note) */}
                  {resource.resource_type === 'note' && resource.note_content && (
                    <div className="mt-3 bg-[#2C2C2C] border border-[#404040] rounded-lg p-3">
                      <p className="text-[#D4D4D4] text-xs whitespace-pre-wrap leading-relaxed">
                        {resource.note_content}
                      </p>
                    </div>
                  )}

                  {/* TIMESTAMP */}
                  <p className="text-[#5c5c5c] text-[10px] mt-3">
                    Criado em {new Date(resource.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStartEdit(resource)}
                    className="p-2 hover:bg-[#2C2C2C] text-[#737373] hover:text-[#E09B6B] rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="p-2 hover:bg-red-900/20 text-[#737373] hover:text-red-400 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
