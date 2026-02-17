import React, { useState } from 'react';
import { 
  Link as LinkIcon, FileText, Trash2, Plus, 
  ExternalLink, Loader2, Save, X, Edit2, Folder 
} from 'lucide-react';
import { 
  useProfessionalResources, 
  useCreateProfessionalResource, 
  useDeleteProfessionalResource,
  useUpdateProfessionalResource,
  ProfessionalResource 
} from '../hooks/useProfessionalResources';

// ============================================================================
// TYPES
// ============================================================================

type ResourceType = 'link' | 'note';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProfessionalResourcesWidget() {
  const { data: resources, isLoading } = useProfessionalResources();
  const createResource = useCreateProfessionalResource();
  const deleteResource = useDeleteProfessionalResource();
  const updateResource = useUpdateProfessionalResource();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ProfessionalResource | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  
  // Form State
  const [formType, setFormType] = useState<ResourceType>('link');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formNote, setFormNote] = useState('');

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleOpenModal = (resource?: ProfessionalResource) => {
    if (resource) {
      setEditingResource(resource);
      setFormType(resource.resource_type);
      setFormTitle(resource.title);
      setFormDescription(resource.description || '');
      setFormUrl(resource.url || '');
      setFormNote(resource.note_content || '');
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
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
    if (!formTitle.trim()) {
      alert('Título é obrigatório');
      return;
    }

    if (formType === 'link' && !formUrl.trim()) {
      alert('URL é obrigatória para links');
      return;
    }

    try {
      if (editingResource) {
        // UPDATE
        await updateResource.mutateAsync({
          id: editingResource.id,
          data: {
            title: formTitle,
            description: formDescription || undefined,
            url: formType === 'link' ? formUrl : undefined,
            note_content: formType === 'note' ? formNote : undefined,
          }
        });
      } else {
        // CREATE
        await createResource.mutateAsync({
          resource_type: formType,
          title: formTitle,
          description: formDescription || undefined,
          url: formType === 'link' ? formUrl : undefined,
          note_content: formType === 'note' ? formNote : undefined,
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar recurso:', error);
      alert('Erro ao salvar recurso');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este recurso?')) return;

    try {
      await deleteResource.mutateAsync(id);
    } catch (error) {
      console.error('Erro ao deletar recurso:', error);
      alert('Erro ao deletar recurso');
    }
  };

  const toggleNote = (id: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <>
      {/* CARD WIDGET */}
      <div className="bg-[#2C2C2C] rounded-lg border border-[#404040] p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Folder size={18} className="text-[#E09B6B]" />
            <h3 className="text-[10px] font-bold text-[#D4D4D4] uppercase tracking-widest">
              Central de Recursos
            </h3>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="p-1.5 hover:bg-[#404040] text-[#E09B6B] rounded transition-colors"
            title="Adicionar Recurso"
          >
            <Plus size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#737373]" size={20} />
          </div>
        ) : !resources || resources.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#737373] text-xs mb-2">Nenhum recurso adicionado</p>
            <button
              onClick={() => handleOpenModal()}
              className="text-[#E09B6B] hover:text-[#E09B6B]/80 text-xs font-bold"
            >
              + Adicionar primeiro recurso
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="group bg-[#202020] border border-[#404040] hover:border-[#E09B6B]/30 rounded-lg p-3 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* ICON & TITLE */}
                    <div className="flex items-center gap-2 mb-1">
                      {resource.resource_type === 'link' ? (
                        <LinkIcon size={14} className="text-[#E09B6B] flex-shrink-0" />
                      ) : (
                        <FileText size={14} className="text-[#E09B6B] flex-shrink-0" />
                      )}
                      <span className="text-white font-bold text-sm truncate">
                        {resource.title}
                      </span>
                    </div>

                    {/* DESCRIPTION */}
                    {resource.description && (
                      <p className="text-[#737373] text-xs mb-2 line-clamp-1">
                        {resource.description}
                      </p>
                    )}

                    {/* URL (if link) */}
                    {resource.resource_type === 'link' && resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#E09B6B] hover:text-[#E09B6B]/80 text-xs flex items-center gap-1 group/link"
                      >
                        <span className="truncate">{resource.url}</span>
                        <ExternalLink size={10} className="flex-shrink-0 group-hover/link:translate-x-0.5 transition-transform" />
                      </a>
                    )}

                    {/* NOTE PREVIEW (if note) */}
                    {resource.resource_type === 'note' && resource.note_content && (
                      <div>
                        <button
                          onClick={() => toggleNote(resource.id)}
                          className="text-[#737373] hover:text-[#D4D4D4] text-xs transition-colors"
                        >
                          {expandedNotes.has(resource.id) ? '▼ Recolher' : '▶ Ver nota'}
                        </button>
                        {expandedNotes.has(resource.id) && (
                          <div className="mt-2 bg-[#1A1A1A] border border-[#333] rounded p-2">
                            <p className="text-[#D4D4D4] text-xs whitespace-pre-wrap leading-relaxed">
                              {resource.note_content}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(resource)}
                      className="p-1.5 hover:bg-[#2C2C2C] text-[#737373] hover:text-[#E09B6B] rounded transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="p-1.5 hover:bg-red-900/20 text-[#737373] hover:text-red-400 rounded transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#202020] border border-[#404040] rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">
                {editingResource ? 'Editar Recurso' : 'Novo Recurso'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-[#2C2C2C] text-[#737373] hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* TYPE SELECTOR (only for new resources) */}
              {!editingResource && (
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
                  placeholder="Ex: Proposta Comercial HTML, PDF Institucional"
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
                  placeholder="Breve descrição"
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
                    rows={8}
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
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 bg-[#2C2C2C] hover:bg-[#333] text-[#737373] rounded-lg text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}