import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, Clock, MapPin, Link as LinkIcon, User } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { useCreateMeeting, useUpdateMeeting, useDeleteMeeting, useMeeting } from '../hooks/useMeetings';
import { MeetingStatus } from '../types/agency.types';

interface MeetingModalProps {
  selectedDate: Date | null;
  onClose: () => void;
  meetingId?: string;
}

export default function MeetingModal({ selectedDate, onClose, meetingId }: MeetingModalProps) {
  const { data: clients = [] } = useClients();
  const { data: existingMeeting } = useMeeting(meetingId);
  const { mutate: createMeeting, isPending: isCreating } = useCreateMeeting();
  const { mutate: updateMeeting, isPending: isUpdating } = useUpdateMeeting();
  const { mutate: deleteMeeting, isPending: isDeleting } = useDeleteMeeting();

  const isEditing = !!meetingId;
  const isSaving = isCreating || isUpdating;

  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    meeting_date: '',
    meeting_time: '',
    duration_minutes: 60,
    location: '',
    meeting_link: '',
    status: 'scheduled' as MeetingStatus,
  });

  useEffect(() => {
    if (existingMeeting) {
      const meetingDate = new Date(existingMeeting.meeting_date);
      setFormData({
        client_id: existingMeeting.client_id,
        title: existingMeeting.title,
        description: existingMeeting.description || '',
        meeting_date: meetingDate.toISOString().split('T')[0],
        meeting_time: meetingDate.toTimeString().slice(0, 5),
        duration_minutes: existingMeeting.duration_minutes || 60,
        location: existingMeeting.location || '',
        meeting_link: existingMeeting.meeting_link || '',
        status: existingMeeting.status,
      });
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        meeting_date: selectedDate.toISOString().split('T')[0],
        meeting_time: '10:00',
      }));
    }
  }, [existingMeeting, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id || !formData.title || !formData.meeting_date || !formData.meeting_time) {
      alert('Preencha os campos obrigatórios: Cliente, Título, Data e Horário');
      return;
    }

    const meetingDateTime = new Date(`${formData.meeting_date}T${formData.meeting_time}:00`);

    const payload = {
      client_id: formData.client_id,
      title: formData.title,
      description: formData.description,
      meeting_date: meetingDateTime.toISOString(),
      duration_minutes: formData.duration_minutes,
      location: formData.location,
      meeting_link: formData.meeting_link,
      status: formData.status,
    };

    if (isEditing && meetingId) {
      updateMeeting(
        { id: meetingId, ...payload },
        {
          onSuccess: () => {
            alert('Reunião atualizada com sucesso!');
            onClose();
          },
          onError: (error: any) => {
            alert('Erro ao atualizar reunião: ' + error.message);
          },
        }
      );
    } else {
      createMeeting(payload, {
        onSuccess: () => {
          alert('Reunião criada com sucesso!');
          onClose();
        },
        onError: (error: any) => {
          alert('Erro ao criar reunião: ' + error.message);
        },
      });
    }
  };

  const handleDelete = () => {
    if (!meetingId) return;
    if (!confirm('Deseja realmente excluir esta reunião?')) return;

    deleteMeeting(meetingId, {
      onSuccess: () => {
        alert('Reunião excluída com sucesso!');
        onClose();
      },
      onError: (error: any) => {
        alert('Erro ao excluir reunião: ' + error.message);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-2xl rounded-[2rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Editar Reunião' : 'Nova Reunião'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <User size={16} className="text-professional-accent" />
              Cliente *
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-professional-accent"
              required
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Título da Reunião *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Reunião de Alinhamento"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-professional-accent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o objetivo da reunião..."
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-professional-accent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-professional-accent" />
                Data *
              </label>
              <input
                type="date"
                value={formData.meeting_date}
                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-professional-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Clock size={16} className="text-professional-accent" />
                Horário *
              </label>
              <input
                type="time"
                value={formData.meeting_time}
                onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-professional-accent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Duração (minutos)
            </label>
            <select
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-professional-accent"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1h 30min</option>
              <option value={120}>2 horas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-professional-accent" />
              Local
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Presencial, Zoom, Google Meet"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-professional-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <LinkIcon size={16} className="text-professional-accent" />
              Link da Reunião
            </label>
            <input
              type="url"
              value={formData.meeting_link}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              placeholder="https://meet.google.com/..."
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-professional-accent"
            />
          </div>

          {isEditing && (
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MeetingStatus })}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-professional-accent"
              >
                <option value="scheduled">Agendada</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-6 py-3 bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={18} />
                Excluir
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-xl font-bold transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-professional-accent hover:opacity-90 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditing ? 'Atualizar' : 'Criar Reunião'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}