import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Video,
  User,
  Phone,
  FileText,
  Stethoscope,
  ArrowRight,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RegistrationData {
  patientName: string;
  patientPhone: string;
  consultationType: 'presentiel' | 'visioconference';
  specialty: string;
  departmentId: string;
  doctorId: string;
  doctorName: string;
  reason: string;
  consultationFee: number;
}

interface BookingRegistrationStepProps {
  onSubmit: (data: RegistrationData) => void;
  loading: boolean;
}

interface ServiceOption {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
}

interface DoctorOption {
  id: string;
  name: string;
  specialization: string;
  consultationFee: number;
}

export function BookingRegistrationStep({ onSubmit, loading }: BookingRegistrationStepProps) {
  const [consultationType, setConsultationType] = useState<'presentiel' | 'visioconference'>('presentiel');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [reason, setReason] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const isPhoneValid = patientPhone.length === 9 && /^\d{9}$/.test(patientPhone);
  const fullPhone = `+243${patientPhone}`;

  const isFormValid = useMemo(
    () => patientName.trim().length > 0 && isPhoneValid && serviceId !== '' && doctorId !== '',
    [patientName, isPhoneValid, serviceId, doctorId]
  );

  const groupedServices = useMemo(() => {
    const groups: Record<string, { categoryName: string; items: ServiceOption[] }> = {};
    for (const svc of services) {
      if (!groups[svc.categoryId]) {
        groups[svc.categoryId] = { categoryName: svc.categoryName, items: [] };
      }
      groups[svc.categoryId].items.push(svc);
    }
    return Object.values(groups).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [services]);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (serviceId) {
      setDoctorId('');
      fetchDoctors();
    } else {
      setDoctors([]);
    }
  }, [serviceId, consultationType]);

  async function fetchServices() {
    try {
      const { data } = await supabase
        .from('services')
        .select('id, name, category_id, service_categories(name)')
        .eq('is_active', true)
        .order('name');

      if (data) {
        const mapped: ServiceOption[] = data.map((s: Record<string, unknown>) => {
          const cat = s.service_categories as { name: string } | null;
          return {
            id: s.id as string,
            name: s.name as string,
            categoryId: s.category_id as string,
            categoryName: cat?.name || 'Autre',
          };
        });
        setServices(mapped);
      }
    } finally {
      setLoadingServices(false);
    }
  }

  async function fetchDoctors() {
    setLoadingDoctors(true);
    try {
      let query = supabase
        .from('medical_staff')
        .select('id, display_name, specialization, consultation_fee, telemedicine_enabled, user_profiles!inner(full_name)')
        .eq('is_accepting_patients', true);

      if (consultationType === 'visioconference') {
        query = query.eq('telemedicine_enabled', true);
      }

      const { data: staff } = await query;

      if (staff && staff.length > 0) {
        const mapped = staff.map((s: Record<string, unknown>) => {
          const profile = s.user_profiles as { full_name: string } | null;
          return {
            id: s.id as string,
            name: profile?.full_name || (s.display_name as string) || '',
            specialization: (s.specialization as string) || '',
            consultationFee: Number(s.consultation_fee) || 50,
          };
        });
        setDoctors(mapped);
      } else {
        setDoctors([]);
      }
    } finally {
      setLoadingDoctors(false);
    }
  }

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    setPatientPhone(digits);
    if (!phoneTouched) setPhoneTouched(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || loading) return;

    const selectedDoctor = doctors.find((d) => d.id === doctorId);
    const selectedService = services.find((s) => s.id === serviceId);

    onSubmit({
      patientName: patientName.trim(),
      patientPhone: fullPhone,
      consultationType,
      specialty: selectedService?.name || '',
      departmentId: selectedService?.categoryId || '',
      doctorId,
      doctorName: selectedDoctor?.name || '',
      reason,
      consultationFee: selectedDoctor?.consultationFee || 50,
    });
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Consultation Type */}
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-medical-500" />
          Type de consultation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              type: 'presentiel' as const,
              label: 'Présentiel',
              desc: 'Consultation en personne à la clinique',
              icon: MapPin,
              gradient: 'from-medical-500 to-medical-600',
              light: 'bg-medical-50 border-medical-200',
            },
            {
              type: 'visioconference' as const,
              label: 'Visioconférence',
              desc: 'Consultation vidéo à distance',
              icon: Video,
              gradient: 'from-teal-500 to-teal-600',
              light: 'bg-teal-50 border-teal-200',
            },
          ].map((opt) => (
            <motion.button
              key={opt.type}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setConsultationType(opt.type);
                setDoctorId('');
              }}
              className={`relative p-6 rounded-2xl border-2 text-left transition-all overflow-hidden ${
                consultationType === opt.type
                  ? `${opt.light} shadow-lg`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {consultationType === opt.type && (
                <motion.div
                  layoutId="consultation-indicator"
                  className={`absolute inset-0 bg-gradient-to-br ${opt.gradient} opacity-[0.06]`}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative z-10">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    consultationType === opt.type
                      ? `bg-gradient-to-br ${opt.gradient} text-white shadow-md`
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <opt.icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-lg text-navy-800 mb-1">{opt.label}</h4>
                <p className="text-sm text-gray-600">{opt.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Patient Info */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-navy-800 mb-2">
            <User className="w-4 h-4 text-medical-500" />
            Nom complet *
          </label>
          <input
            type="text"
            required
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Jean Dupont"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 outline-none transition-all bg-white/80"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-navy-800 mb-2">
            <Phone className="w-4 h-4 text-medical-500" />
            Téléphone *
          </label>
          <div className="flex">
            <span className="flex items-center px-3 rounded-l-xl border-2 border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500 font-medium select-none">
              +243
            </span>
            <input
              type="tel"
              required
              value={patientPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              placeholder="812 345 678"
              maxLength={11}
              className={`flex-1 px-4 py-3 rounded-r-xl border-2 outline-none transition-all bg-white/80 ${
                !phoneTouched
                  ? 'border-gray-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20'
                  : isPhoneValid
                  ? 'border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                  : 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              }`}
            />
            {phoneTouched && (
              <div className="flex items-center pl-2">
                {isPhoneValid ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            )}
          </div>
          <p className={`text-xs mt-1.5 ${phoneTouched && !isPhoneValid ? 'text-red-500' : 'text-gray-400'}`}>
            Format : +243 XXX XXX XXX (9 chiffres)
          </p>
        </div>
      </motion.div>

      {/* Specialty & Doctor */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-navy-800 mb-2">
            <Stethoscope className="w-4 h-4 text-medical-500" />
            Spécialité *
          </label>
          {loadingServices ? (
            <div className="flex items-center gap-2 py-3 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement...
            </div>
          ) : (
            <select
              required
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 outline-none transition-all bg-white/80 appearance-none"
            >
              <option value="">Sélectionnez une spécialité</option>
              {groupedServices.map((group) => (
                <optgroup key={group.categoryName} label={group.categoryName}>
                  {group.items.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-navy-800 mb-2">
            <User className="w-4 h-4 text-medical-500" />
            Médecin *
          </label>
          <AnimatePresence mode="wait">
            {loadingDoctors ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 py-3 text-gray-400 text-sm"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement des médecins...
              </motion.div>
            ) : (
              <motion.select
                key="select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                required
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 outline-none transition-all bg-white/80 appearance-none"
              >
                <option value="">
                  {serviceId
                    ? doctors.length === 0
                      ? 'Aucun médecin disponible'
                      : 'Sélectionnez un médecin'
                    : 'Choisissez la spécialité d\'abord'}
                </option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.name} - {doc.specialization || 'Généraliste'} ({doc.consultationFee} USD)
                  </option>
                ))}
              </motion.select>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Reason */}
      <motion.div variants={itemVariants}>
        <label className="flex items-center gap-2 text-sm font-semibold text-navy-800 mb-2">
          <FileText className="w-4 h-4 text-medical-500" />
          Motif de consultation
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Décrivez brièvement le motif de votre visite..."
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 outline-none transition-all bg-white/80 resize-none"
        />
      </motion.div>

      {/* Submit */}
      <motion.div variants={itemVariants}>
        <motion.button
          type="submit"
          disabled={!isFormValid || loading}
          whileHover={isFormValid && !loading ? { scale: 1.01 } : {}}
          whileTap={isFormValid && !loading ? { scale: 0.99 } : {}}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 ${
            isFormValid && !loading
              ? 'bg-gradient-to-r from-navy-800 to-navy-700 text-white hover:shadow-xl cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Enregistrement en cours...</span>
            </>
          ) : (
            <>
              Confirmer l'inscription
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.form>
  );
}
