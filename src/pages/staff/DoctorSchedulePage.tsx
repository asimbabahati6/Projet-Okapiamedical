import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Edit, Trash2, Save, X, Copy, CalendarDays, Video, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MedicalStaff } from '../../types/database';
import { formatDoctorName } from '../../utils/formatDoctorName';

interface ScheduleTemplate {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  max_appointments_per_slot: number;
  is_telemedicine_available: boolean;
  is_active: boolean;
}

interface ScheduleOverride {
  id: string;
  doctor_id: string;
  override_date: string;
  is_available: boolean;
  custom_start_time: string | null;
  custom_end_time: string | null;
  reason: string | null;
}

export function DoctorSchedulePage() {
  const [doctors, setDoctors] = useState<(MedicalStaff & { user_profile?: any })[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [scheduleTemplates, setScheduleTemplates] = useState<ScheduleTemplate[]>([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showAddOverride, setShowAddOverride] = useState(false);

  const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchScheduleData();
    }
  }, [selectedDoctor]);

  async function fetchDoctors() {
    try {
      const { data, error } = await supabase
        .from('medical_staff')
        .select('*, user_profile:user_profiles(id, full_name)')
        .eq('is_accepting_patients', true);

      if (error) throw error;
      setDoctors(data || []);
      if (data && data.length > 0) {
        setSelectedDoctor(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchScheduleData() {
    if (!selectedDoctor) return;

    const [templatesResult, overridesResult] = await Promise.all([
      supabase
        .from('doctor_schedule_templates')
        .select('*')
        .eq('doctor_id', selectedDoctor)
        .order('day_of_week')
        .order('start_time'),
      supabase
        .from('doctor_schedule_overrides')
        .select('*')
        .eq('doctor_id', selectedDoctor)
        .gte('override_date', new Date().toISOString().split('T')[0])
        .order('override_date')
    ]);

    if (templatesResult.data) setScheduleTemplates(templatesResult.data);
    if (overridesResult.data) setScheduleOverrides(overridesResult.data);
  }

  async function saveTemplate(template: Partial<ScheduleTemplate>) {
    if (!selectedDoctor) return;

    const data = {
      ...template,
      doctor_id: selectedDoctor
    };

    if (template.id) {
      const { error } = await supabase
        .from('doctor_schedule_templates')
        .update(data)
        .eq('id', template.id);

      if (error) {
        console.error('Error updating template:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('doctor_schedule_templates')
        .insert([data]);

      if (error) {
        console.error('Error creating template:', error);
        return;
      }
    }

    fetchScheduleData();
    setEditingTemplate(null);
    setShowAddTemplate(false);
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this schedule template?')) return;

    const { error } = await supabase
      .from('doctor_schedule_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      return;
    }

    fetchScheduleData();
  }

  async function saveOverride(override: Partial<ScheduleOverride>) {
    if (!selectedDoctor) return;

    const data = {
      ...override,
      doctor_id: selectedDoctor
    };

    const { error } = await supabase
      .from('doctor_schedule_overrides')
      .insert([data]);

    if (error) {
      console.error('Error creating override:', error);
      return;
    }

    fetchScheduleData();
    setShowAddOverride(false);
  }

  async function deleteOverride(id: string) {
    if (!confirm('Delete this schedule override?')) return;

    const { error } = await supabase
      .from('doctor_schedule_overrides')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting override:', error);
      return;
    }

    fetchScheduleData();
  }

  async function copyWeekSchedule(fromDay: number) {
    if (!selectedDoctor || !confirm('Copy this day schedule to all weekdays?')) return;

    const dayTemplates = scheduleTemplates.filter(t => t.day_of_week === fromDay);

    const newTemplates = [];
    for (let day = 1; day <= 5; day++) {
      if (day === fromDay) continue;

      for (const template of dayTemplates) {
        newTemplates.push({
          doctor_id: selectedDoctor,
          day_of_week: day,
          start_time: template.start_time,
          end_time: template.end_time,
          slot_duration: template.slot_duration,
          max_appointments_per_slot: template.max_appointments_per_slot,
          is_telemedicine_available: template.is_telemedicine_available,
          is_active: true
        });
      }
    }

    if (newTemplates.length > 0) {
      const { error } = await supabase
        .from('doctor_schedule_templates')
        .insert(newTemplates);

      if (error) {
        console.error('Error copying schedule:', error);
        return;
      }

      fetchScheduleData();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Horaires Médecins</h1>
          <p className="text-gray-600">Configurer les disponibilités et les horaires de consultation</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Sélectionner un médecin</label>
        <select
          value={selectedDoctor || ''}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="w-full md:w-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {formatDoctorName(doctor.user_profile?.full_name)} - {doctor.specialization}
            </option>
          ))}
        </select>
      </div>

      {selectedDoctorData && (
        <>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Horaires hebdomadaires</h2>
              <button
                onClick={() => setShowAddTemplate(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Plus className="w-5 h-5" />
                Ajouter horaire
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {daysOfWeek.map((day, dayIndex) => {
                const dayTemplates = scheduleTemplates.filter(t => t.day_of_week === dayIndex && t.is_active);

                return (
                  <div key={dayIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{day}</h3>
                      {dayTemplates.length > 0 && (
                        <button
                          onClick={() => copyWeekSchedule(dayIndex)}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          title="Copier vers tous les jours ouvrables"
                        >
                          <Copy className="w-3 h-3" />
                          Copier
                        </button>
                      )}
                    </div>

                    {dayTemplates.length === 0 ? (
                      <p className="text-sm text-gray-500">Aucun horaire défini</p>
                    ) : (
                      <div className="space-y-2">
                        {dayTemplates.map((template) => (
                          <div key={template.id} className="bg-gray-50 rounded p-3 text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">
                                  {template.start_time.slice(0, 5)} - {template.end_time.slice(0, 5)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingTemplate(template)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteTemplate(template.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span>Durée: {template.slot_duration} min</span>
                              {template.is_telemedicine_available ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Video className="w-3 h-3" />
                                  Télémédecine
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  Présentiel
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Exceptions et fermetures</h2>
              <button
                onClick={() => setShowAddOverride(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Plus className="w-5 h-5" />
                Ajouter exception
              </button>
            </div>

            {scheduleOverrides.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune exception programmée</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduleOverrides.map((override) => (
                  <div key={override.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">{new Date(override.override_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <button
                        onClick={() => deleteOverride(override.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm">
                      {override.is_available ? (
                        <div className="text-green-600">
                          <p className="font-medium">Ouvert</p>
                          {override.custom_start_time && override.custom_end_time && (
                            <p>{override.custom_start_time.slice(0, 5)} - {override.custom_end_time.slice(0, 5)}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-red-600 font-medium">Fermé</p>
                      )}
                      {override.reason && (
                        <p className="text-gray-600 mt-2">{override.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {(showAddTemplate || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          onSave={saveTemplate}
          onClose={() => {
            setEditingTemplate(null);
            setShowAddTemplate(false);
          }}
        />
      )}

      {showAddOverride && (
        <OverrideModal
          onSave={saveOverride}
          onClose={() => setShowAddOverride(false)}
        />
      )}
    </div>
  );
}

function TemplateModal({
  template,
  onSave,
  onClose
}: {
  template: ScheduleTemplate | null;
  onSave: (template: Partial<ScheduleTemplate>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    day_of_week: template?.day_of_week ?? 1,
    start_time: template?.start_time ?? '09:00',
    end_time: template?.end_time ?? '17:00',
    slot_duration: template?.slot_duration ?? 30,
    max_appointments_per_slot: template?.max_appointments_per_slot ?? 1,
    is_telemedicine_available: template?.is_telemedicine_available ?? false,
    is_active: template?.is_active ?? true
  });

  const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">{template ? 'Modifier' : 'Ajouter'} horaire</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jour de la semaine</label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {daysOfWeek.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heure de début</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heure de fin</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durée des créneaux (minutes)</label>
            <select
              value={formData.slot_duration}
              onChange={(e) => setFormData({ ...formData, slot_duration: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="telemedicine"
              checked={formData.is_telemedicine_available}
              onChange={(e) => setFormData({ ...formData, is_telemedicine_available: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="telemedicine" className="text-sm text-gray-700">Disponible en télémédecine</label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(template ? { ...formData, id: template.id } : formData)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function OverrideModal({
  onSave,
  onClose
}: {
  onSave: (override: Partial<ScheduleOverride>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    override_date: '',
    is_available: false,
    custom_start_time: '09:00',
    custom_end_time: '17:00',
    reason: ''
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Ajouter exception</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.override_date}
              onChange={(e) => setFormData({ ...formData, override_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="available"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="available" className="text-sm text-gray-700">Disponible ce jour (horaires personnalisés)</label>
          </div>

          {formData.is_available && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Début</label>
                <input
                  type="time"
                  value={formData.custom_start_time}
                  onChange={(e) => setFormData({ ...formData, custom_start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fin</label>
                <input
                  type="time"
                  value={formData.custom_end_time}
                  onChange={(e) => setFormData({ ...formData, custom_end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Raison (optionnel)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              placeholder="Ex: Congé, Formation, Événement spécial..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
