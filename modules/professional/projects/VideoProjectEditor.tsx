
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Calendar, Film, User, Link as LinkIcon, HardDrive, Trash2 } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { useCreateProject, useUpdateProject, useProject, useDeleteProject } from '../hooks/useProjects';
import { ConfirmModal } from '../../../shared/components/ui/ConfirmModal';

export default function VideoProjectEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: existingProject, isLoading: loadingProject } = useProject(id);
  
  const { mutate: createProject, isPending: isCreating } = useCreateProject();
  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();

  const isSaving = isCreating || isUpdating || isDeleting;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    title: '', client_id: '', deadline: '', received_date: '', approval_sent_date: '',
    priority: 'medium', description: '', status: 'video_received', category: 'video',
    preview_link: '', drive_link: ''
  });

  useEffect(() => {
    if (existingProject) {
      setFormData({
        title: existingProject.title,
        client_id: existingProject.client_id,
        deadline: existingProject.deadline ? existingProject.deadline.split('T')[0] : '',
        received_date: existingProject.received_date ? existingProject.received_date.split('T')[0] : '',
        approval_sent_date: existingProject.approval_sent_date ? existingProject.approval_sent_date.split('T')[0] : '',
        priority: existingProject.priority,
        description: existingProject.description || '',
        status: existingProject.status,
        category: existingProject.category,
        preview_link: existingProject.preview_link || '',
        drive_link: existingProject.drive_link || ''
      });
    }
  }, [existingProject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || !formData.title || !formData.deadline) return;

    const deadlineISO = new Date(formData.deadline + 'T12:00:00').toISOString();
    const receivedISO = formData.received_date ? new Date(formData.received_date + 'T12:00:00').toISOString() : null;
    const approvalISO = formData.approval_sent_date ? new Date(formData.approval_sent_date + 'T12:00:00').toISOString() : null;

    const dataToSend = { ...formData, deadline: deadlineISO, received_date: receivedISO, approval_sent_date: approvalISO };

    const onSuccess = () => navigate('/professional/video-editor');
    if (isEditing && id) updateProject({ id, ...dataToSend }, { onSuccess });
    else createProject(dataToSend, { onSuccess });
  };

  const handleDelete = () => {
    if (id) {
      deleteProject(id, { onSuccess: () => navigate('/professional/video-editor') });
    }
  };

  if (isEditing && loadingProject) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-[#E09B6B]" /></div>;

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-8 pt-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-[#2C2C2C] text-[#737373] hover:text-[#D4D4D4] transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold text-[#FFFFFF] tracking-tight">{isEditing ? 'Editar Projeto' : 'Novo Projeto'}</h1>
            <p className="text-[#9ca3af] text-xs font-mono">{isEditing ? 'Atualize as informações.' : 'Cadastre a demanda.'}</p>
          </div>
        </div>
        {isEditing && (
          <button 
            type="button" 
            onClick={() => setShowDeleteConfirm(true)} 
            className="p-2 rounded-full hover:bg-[#3d1414] text-[#737373] hover:text-red-400 transition-colors" 
            title="Excluir"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#202020] p-6 rounded-lg border border-[#404040] shadow-sm space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Cliente *</label>
            <div className="relative">
              <select value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})} className="w-full bg-[#37352F] border border-[#404040] rounded-md px-4 py-3 pl-10 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none appearance-none cursor-pointer" required>
                <option value="">Selecione...</option>
                {clients?.map(client => <option key={client.id} value={client.id}>{client.name} {client.company_name ? `(${client.company_name})` : ''}</option>)}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]"><User size={16} /></div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Título do Vídeo *</label>
            <div className="relative">
              <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Reels Institucional" className="w-full bg-[#37352F] border border-[#404040] rounded-md px-4 py-3 pl-10 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none" required />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]"><Film size={16} /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Recebimento</label>
              <div className="relative">
                <input type="date" value={formData.received_date} onChange={e => setFormData({...formData, received_date: e.target.value})} className="w-full bg-[#37352F] border border-[#404040] rounded-md px-4 py-3 pl-10 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none [color-scheme:dark]" />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]"><Calendar size={16} /></div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Envio Aprovação</label>
              <div className="relative">
                <input type="date" value={formData.approval_sent_date} onChange={e => setFormData({...formData, approval_sent_date: e.target.value})} className="w-full bg-[#37352F] border border-[#404040] rounded-md px-4 py-3 pl-10 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none [color-scheme:dark]" />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]"><Calendar size={16} /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Prazo Entrega *</label>
              <div className="relative">
                <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full bg-[#37352F] border border-[#404040] rounded-md px-4 py-3 pl-10 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none [color-scheme:dark]" required />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]"><Calendar size={16} /></div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Prioridade</label>
              <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full bg-[#37352F] border border-[#404040] rounded-md px-4 py-3 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none appearance-none cursor-pointer">
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta 🔥</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Link Preview</label>
              <div className="relative">
                <input value={formData.preview_link} onChange={e => setFormData({...formData, preview_link: e.target.value})} placeholder="Frame.io..." className="w-full bg-[#37352F] border border-[#404040] rounded-md px-4 py-3 pl-10 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none" />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]"><LinkIcon size={16} /></div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Link Arquivo Final</label>
              <div className="relative">
                <input value={formData.drive_link} onChange={e => setFormData({...formData, drive_link: e.target.value})} placeholder="Drive/Dropbox..." className="w-full bg-[#37352F] border border-[#404040] rounded-md px-4 py-3 pl-10 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none" />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]"><HardDrive size={16} /></div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Detalhes / Roteiro</label>
            <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descreva o que precisa ser feito..." className="w-full bg-[#37352F] border border-[#404040] rounded-md px-4 py-3 text-sm text-[#D4D4D4] focus:border-[#E09B6B] outline-none resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-md text-sm font-bold text-[#9ca3af] hover:bg-[#37352F] transition-colors uppercase tracking-widest">Cancelar</button>
          <button type="submit" disabled={isSaving} className="bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFFFF] px-8 py-3 rounded-md text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 active:scale-95 border border-[#5D4037] uppercase tracking-widest">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEditing ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Projeto?"
        description="Tem certeza que deseja excluir este projeto de vídeo? Esta ação não pode ser desfeita."
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
}
