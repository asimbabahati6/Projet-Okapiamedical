import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Video, MapPin, CircleCheck as CheckCircle, Briefcase, Star, Award, Languages, Phone, Mail, ArrowRight, ArrowLeft, Search, ListFilter as Filter, X, List, UserPlus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Language } from '../../i18n/translations';
import { supabase } from '../../lib/supabase';
import { Department, MedicalStaff, Service } from '../../types/database';
import { AppointmentLookup } from '../../components/appointments/AppointmentLookup';
import { JoinWaitingList } from '../../components/appointments/JoinWaitingList';
import { formatDoctorName } from '../../utils/formatDoctorName';

interface AppointmentConfirmation {
  confirmationCode: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  serviceName: string;
  appointmentType: string;
  qrCodeData: string;
}

interface AppointmentsProps {
  preselectedDoctorId?: string | null;
}

export function Appointments({ preselectedDoctorId }: AppointmentsProps = {}) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(preselectedDoctorId ? 2 : 1);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<(MedicalStaff & { user_profile?: any })[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [confirmation, setConfirmation] = useState<AppointmentConfirmation | null>(null);
  const [showLookup, setShowLookup] = useState(false);
  const [showWaitingList, setShowWaitingList] = useState(false);

  const [formData, setFormData] = useState({
    appointment_type: 'in-person' as 'in-person' | 'telemedicine',
    service_id: '',
    department_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    reason: '',
    special_requirements: '',
    preferred_language: language || 'fr',
  });

  useEffect(() => {
    fetchServices();
    fetchDepartments();

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const doctorId = params.get('doctor');
    const serviceId = params.get('service');

    if (doctorId && serviceId) {
      loadPreselectedDoctorAndService(doctorId, serviceId);
    } else if (doctorId) {
      loadPreselectedDoctor(doctorId);
    }
  }, []);

  useEffect(() => {
    if (preselectedDoctorId) {
      loadPreselectedDoctor(preselectedDoctorId);
    }
  }, [preselectedDoctorId]);

  useEffect(() => {
    filterServices();
  }, [searchTerm, services]);

  useEffect(() => {
    if (formData.department_id) {
      fetchDoctorsByDepartment(formData.department_id);
    }
  }, [formData.department_id, formData.appointment_type]);

  useEffect(() => {
    if (formData.doctor_id && formData.appointment_date) {
      fetchAvailableSlots(formData.doctor_id, formData.appointment_date);
    }
  }, [formData.doctor_id, formData.appointment_date]);

  function filterServices() {
    if (!searchTerm.trim()) {
      setFilteredServices(services);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = services.filter(service => {
      const serviceName = getServiceName(service).toLowerCase();
      const serviceDesc = getServiceDescription(service).toLowerCase();
      return serviceName.includes(term) || serviceDesc.includes(term);
    });
    setFilteredServices(filtered);
  }

  async function fetchServices() {
    try {
      setLoadingServices(true);
      const { data, error } = await supabase
        .from('services')
        .select('*, department:departments(id, name), category:service_categories(*)')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('Error fetching services:', error);
        return;
      }

      if (data) {
        setServices(data);
        setFilteredServices(data);
      }
    } catch (err) {
      console.error('Exception fetching services:', err);
    } finally {
      setLoadingServices(false);
    }
  }

  async function fetchDepartments() {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching departments:', error);
    }
    if (data) {
      setDepartments(data);
    }
  }

  async function loadPreselectedDoctor(doctorId: string) {
    try {
      setLoadingDoctors(true);

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, department_id, avatar_url')
        .eq('id', doctorId)
        .maybeSingle();

      if (profileError || !userProfile) {
        console.error('Error loading user profile:', profileError);
        setStep(1);
        return;
      }

      const { data: doctorData, error: doctorError } = await supabase
        .from('medical_staff')
        .select('*')
        .eq('id', doctorId)
        .eq('is_accepting_patients', true)
        .maybeSingle();

      if (doctorError || !doctorData) {
        console.error('Error loading preselected doctor:', doctorError);
        setStep(1);
        return;
      }

      const departmentId = userProfile.department_id;

      if (departmentId) {
        setFormData(prev => ({
          ...prev,
          doctor_id: doctorId,
          department_id: departmentId
        }));

        await fetchDoctorsByDepartment(departmentId);
      }
    } catch (error) {
      console.error('Exception loading preselected doctor:', error);
      setStep(1);
    } finally {
      setLoadingDoctors(false);
    }
  }

  async function loadPreselectedDoctorAndService(doctorId: string, serviceId: string) {
    try {
      setLoadingDoctors(true);

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, department_id, avatar_url')
        .eq('id', doctorId)
        .maybeSingle();

      if (profileError || !userProfile) {
        console.error('Error loading user profile:', profileError);
        setStep(1);
        return;
      }

      const { data: doctorData, error: doctorError } = await supabase
        .from('medical_staff')
        .select('*')
        .eq('id', doctorId)
        .eq('is_accepting_patients', true)
        .maybeSingle();

      if (doctorError || !doctorData) {
        console.error('Error loading preselected doctor:', doctorError);
        setStep(1);
        return;
      }

      const departmentId = userProfile.department_id;

      if (departmentId) {
        setFormData(prev => ({
          ...prev,
          doctor_id: doctorId,
          department_id: departmentId,
          service_id: serviceId
        }));

        await fetchDoctorsByDepartment(departmentId);
        setStep(2);
      }
    } catch (error) {
      console.error('Exception loading preselected doctor and service:', error);
      setStep(1);
    } finally {
      setLoadingDoctors(false);
    }
  }

  function getServiceName(service: Service): string {
    if (language === 'ar' && service.name_ar) return service.name_ar;
    if (language === 'en' && service.name_en) return service.name_en;
    return service.name;
  }

  function getServiceDescription(service: Service): string {
    if (language === 'ar' && service.description_ar) return service.description_ar;
    if (language === 'en' && service.description_en) return service.description_en;
    return service.description || '';
  }

  function getDepartmentName(department: Department): string {
    return department.name;
  }

  async function fetchDoctorsByDepartment(departmentId: string) {
    setLoadingDoctors(true);

    try {
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, department_id, avatar_url')
        .eq('department_id', departmentId);

      if (profilesError) throw profilesError;

      const userIds = userProfiles?.map(p => p.id) || [];

      if (userIds.length === 0) {
        setDoctors([]);
        setLoadingDoctors(false);
        return;
      }

      let query = supabase
        .from('medical_staff')
        .select('*')
        .eq('is_accepting_patients', true)
        .in('id', userIds);

      if (formData.appointment_type === 'telemedicine') {
        query = query.eq('telemedicine_enabled', true);
      }

      const { data: doctors, error } = await query;

      if (error) throw error;

      const doctorsWithProfiles = doctors?.map(doctor => {
        const userProfile = userProfiles?.find(p => p.id === doctor.id);
        return { ...doctor, user_profile: userProfile };
      }) || [];

      setDoctors(doctorsWithProfiles);
    } catch (error) {
      console.error('Error fetching doctors by department:', error);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  }

  async function fetchAvailableSlots(doctorId: string, date: string) {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    const { data: slots } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (slots && slots.length > 0) {
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .in('status', ['pending', 'confirmed', 'in_progress']);

      const bookedTimes = new Set(existingAppointments?.map(a => a.appointment_time) || []);

      const availableTimes: string[] = [];
      slots.forEach(slot => {
        const [startHour, startMinute] = slot.start_time.split(':').map(Number);
        const [endHour, endMinute] = slot.end_time.split(':').map(Number);
        const duration = slot.slot_duration || 30;

        let currentTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        while (currentTime < endTime) {
          const hour = Math.floor(currentTime / 60);
          const minute = currentTime % 60;
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;

          if (!bookedTimes.has(timeString)) {
            availableTimes.push(timeString);
          }

          currentTime += duration;
        }
      });

      setAvailableSlots(availableTimes);
    } else {
      setAvailableSlots([]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let patientId = null;

      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert([{
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            email: formData.email,
            date_of_birth: '2000-01-01',
            gender: 'other',
            patient_number: `PAT${Date.now()}`,
          }])
          .select()
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
      }

      const selectedService = services.find(s => s.id === formData.service_id);
      const estimatedDuration = selectedService?.estimated_duration_minutes || 30;

      const { data: newAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          patient_id: patientId,
          doctor_id: formData.doctor_id,
          department_id: formData.department_id,
          service_id: formData.service_id || null,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          appointment_type: formData.appointment_type,
          reason: formData.reason,
          special_requirements: formData.special_requirements,
          preferred_language: formData.preferred_language,
          estimated_duration: estimatedDuration,
          status: 'pending',
          appointment_number: `APT${Date.now()}`,
        }])
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      const selectedDoctor = doctors.find(d => d.id === formData.doctor_id);
      const serviceName = selectedService ? getServiceName(selectedService) : '';

      setConfirmation({
        confirmationCode: newAppointment.confirmation_code || 'N/A',
        appointmentDate: formData.appointment_date,
        appointmentTime: formData.appointment_time,
        doctorName: selectedDoctor?.user_profile?.full_name || 'Unknown',
        serviceName: serviceName,
        appointmentType: formData.appointment_type,
        qrCodeData: newAppointment.qr_code_data || '',
      });

      setStep(1);
      setFormData({
        appointment_type: 'in-person',
        service_id: '',
        department_id: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        reason: '',
        special_requirements: '',
        preferred_language: language || 'fr',
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert(t.appointments.error_message);
    } finally {
      setLoading(false);
    }
  }

  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (confirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-green-500">
            <div className="text-center mb-6">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.common.success}</h2>
              <p className="text-lg text-gray-600">{t.appointments.success_message}</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mb-6 border border-blue-200">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">Confirmation Code</p>
                <p className="text-3xl font-bold text-blue-600 tracking-wider">{confirmation.confirmationCode}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center text-gray-700 mb-2">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="font-semibold">Date</span>
                  </div>
                  <p className="text-gray-900">{new Date(confirmation.appointmentDate).toLocaleDateString(language)}</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center text-gray-700 mb-2">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="font-semibold">Time</span>
                  </div>
                  <p className="text-gray-900">{confirmation.appointmentTime.slice(0, 5)}</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center text-gray-700 mb-2">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="font-semibold">Doctor</span>
                  </div>
                  <p className="text-gray-900">{formatDoctorName(confirmation.doctorName)}</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center text-gray-700 mb-2">
                    {confirmation.appointmentType === 'telemedicine' ? (
                      <Video className="w-5 h-5 mr-2 text-blue-600" />
                    ) : (
                      <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    )}
                    <span className="font-semibold">Motif</span>
                  </div>
                  <p className="text-gray-900 capitalize">{confirmation.appointmentType}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You will receive a confirmation email with appointment details and calendar invite.
                {confirmation.appointmentType === 'in-person'
                  ? ' Please arrive 15 minutes early for check-in.'
                  : ' You will receive a video consultation link 1 hour before your appointment.'}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setConfirmation(null)}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {t.appointments.book_another}
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                Print Confirmation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      {showLookup && <AppointmentLookup onClose={() => setShowLookup(false)} />}
      {showWaitingList && <JoinWaitingList onClose={() => setShowWaitingList(false)} />}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.appointments.title}</h1>
          <p className="text-lg text-gray-600">{t.appointments.subtitle}</p>

          {/* Ligne descriptive */}
          <div className="mt-6 mb-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-600 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Choisissez votre situation
              </h3>
              <p className="text-sm text-gray-700">
                Sélectionnez l'option qui correspond à votre statut pour continuer la prise de rendez-vous
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center mt-4">
            <button
              onClick={() => setShowLookup(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium shadow-sm hover:shadow-md"
            >
              <List className="w-5 h-5" />
              <span className="hidden sm:inline">Gérer un rendez-vous existant</span>
              <span className="sm:hidden">Patient Existant</span>
            </button>

            <button
              onClick={() => window.location.hash = 'register'}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white border-2 border-orange-600 rounded-lg hover:bg-orange-700 transition-all font-medium shadow-sm hover:shadow-md"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Enregistrer (Nouveau Patient)</span>
              <span className="sm:hidden">Enregistrer</span>
            </button>

            <button
              onClick={() => setShowWaitingList(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 transition-all font-medium shadow-sm hover:shadow-md"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Rejoindre la liste d'attente</span>
              <span className="sm:hidden">Liste d'attente</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-blue-500">
          <div className="flex items-center justify-between mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                      step >= s
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg scale-110'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${step >= s ? 'text-blue-600' : 'text-gray-500'}`}>
                    {s === 1 ? 'Service & Doctor' : s === 2 ? 'Date & Time' : 'Patient Info'}
                  </span>
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 flex-1 mx-4 rounded-full transition-all duration-300 ${
                      step > s ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {preselectedDoctorId && step === 1 && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg animate-slideDown">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Doctor Pre-Selected</h4>
                    <p className="text-sm text-green-700">
                      You've selected a doctor from their profile. Choose a service to continue, or select a different doctor below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    {t.appointments.consultation_type_title}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, appointment_type: 'in-person', doctor_id: '' })}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        formData.appointment_type === 'in-person'
                          ? 'border-blue-600 bg-blue-50 shadow-lg transform scale-105'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <MapPin className={`w-10 h-10 mx-auto mb-3 ${formData.appointment_type === 'in-person' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <h3 className="font-bold text-lg mb-2">{t.appointments.in_person_visit}</h3>
                      <p className="text-sm text-gray-600">{t.appointments.in_person_description}</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, appointment_type: 'telemedicine', doctor_id: '' })}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        formData.appointment_type === 'telemedicine'
                          ? 'border-green-600 bg-green-50 shadow-lg transform scale-105'
                          : 'border-gray-200 bg-white hover:border-green-300'
                      }`}
                    >
                      <Video className={`w-10 h-10 mx-auto mb-3 ${formData.appointment_type === 'telemedicine' ? 'text-green-600' : 'text-gray-400'}`} />
                      <h3 className="font-bold text-lg mb-2">{t.appointments.telemedicine}</h3>
                      <p className="text-sm text-gray-600">{t.appointments.telemedicine_description}</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    <Briefcase className="w-5 h-5 inline mr-2" />
                    {t.appointments.select_service}
                  </label>

                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search for a service..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {loadingServices ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading services...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                      {filteredServices.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => {
                            const departmentId = service.department_id || '';
                            setFormData({
                              ...formData,
                              service_id: service.id,
                              department_id: departmentId,
                              doctor_id: ''
                            });
                          }}
                          className={`p-5 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                            formData.service_id === service.id
                              ? 'border-blue-600 bg-blue-50 shadow-lg'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-gray-900">{getServiceName(service)}</h3>
                            {service.telemedicine_available && formData.appointment_type === 'telemedicine' && (
                              <Video className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          {getServiceDescription(service) && (
                            <p className="text-sm text-gray-600 line-clamp-2">{getServiceDescription(service)}</p>
                          )}
                          {service.estimated_duration_minutes && (
                            <p className="text-xs text-gray-500 mt-2">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {service.estimated_duration_minutes} min
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {formData.department_id && (
                  <div className="animate-slideDown">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      <User className="w-5 h-5 inline mr-2" />
                      {t.appointments.select_doctor}
                    </label>

                    {loadingDoctors ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading doctors...</p>
                      </div>
                    ) : doctors.length === 0 ? (
                      <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-yellow-800">No doctors available for {formData.appointment_type} appointments in this department.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doctors.map((doctor) => (
                          <button
                            key={doctor.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, doctor_id: doctor.id })}
                            className={`p-5 rounded-xl border-2 text-left transition-all hover:shadow-md relative ${
                              formData.doctor_id === doctor.id
                                ? 'border-blue-600 bg-blue-50 shadow-lg'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                            aria-label={`Select ${formatDoctorName(doctor.user_profile?.full_name)}`}
                          >
                            {preselectedDoctorId === doctor.id && (
                              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md flex items-center gap-1 animate-pulse">
                                <CheckCircle className="w-3 h-3" />
                                Recommended
                              </div>
                            )}
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                {doctor.user_profile?.full_name?.charAt(0) || 'D'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 mb-1">
                                  {formatDoctorName(doctor.user_profile?.full_name)}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">{doctor.specialization}</p>

                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  {doctor.years_of_experience > 0 && (
                                    <span className="flex items-center">
                                      <Award className="w-3 h-3 mr-1" />
                                      {doctor.years_of_experience} yrs
                                    </span>
                                  )}
                                  {doctor.average_rating && (
                                    <span className="flex items-center">
                                      <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                      {doctor.average_rating} ({doctor.total_ratings})
                                    </span>
                                  )}
                                  {doctor.telemedicine_enabled && (
                                    <span className="flex items-center text-green-600">
                                      <Video className="w-3 h-3 mr-1" />
                                      Video
                                    </span>
                                  )}
                                </div>

                                {doctor.consultation_fee && (
                                  <p className="text-sm font-semibold text-blue-600 mt-2">
                                    ${doctor.consultation_fee}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {formData.doctor_id && (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    {t.appointments.continue}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    <Calendar className="w-5 h-5 inline mr-2" />
                    {t.appointments.select_date}
                  </label>
                  <input
                    type="date"
                    required
                    min={minDate}
                    max={maxDate}
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value, appointment_time: '' })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>

                {formData.appointment_date && availableSlots.length > 0 && (
                  <div className="animate-slideDown">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      <Clock className="w-5 h-5 inline mr-2" />
                      {t.appointments.select_time}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-80 overflow-y-auto p-2">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setFormData({ ...formData, appointment_time: time })}
                          className={`py-3 px-2 rounded-lg text-sm font-semibold transition-all ${
                            formData.appointment_time === time
                              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                          }`}
                        >
                          {time.slice(0, 5)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.appointment_date && availableSlots.length === 0 && (
                  <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800">{t.appointments.no_slots_available}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    {t.appointments.back}
                  </button>
                  {formData.appointment_time && (
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      {t.appointments.continue}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t.appointments.patient_info}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.appointments.first_name} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.appointments.last_name} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      {t.appointments.phone} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      {t.appointments.email} *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Languages className="w-4 h-4 inline mr-1" />
                    Preferred Language for Consultation
                  </label>
                  <select
                    value={formData.preferred_language}
                    onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value as Language })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.appointments.reason}
                  </label>
                  <textarea
                    rows={4}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Brief description of your concern..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requirements or Accessibility Needs
                  </label>
                  <textarea
                    rows={3}
                    value={formData.special_requirements}
                    onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Wheelchair access, interpreter needed, etc."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Payment will be processed at the facility. Please bring a valid ID and insurance card if applicable.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    {t.appointments.back}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {t.common.loading}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirm Appointment
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
