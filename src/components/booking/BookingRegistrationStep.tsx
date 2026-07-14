import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Video, User, Phone, FileText, Stethoscope,
  ArrowRight, Loader2, CheckCircle, AlertCircle, Calendar, Clock, Mail,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RegistrationData {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientGender: string;
  patientBloodType: string;
  consultationType: 'presentiel' | 'visioconference';
  specialty: string;
  departmentId: string;
  doctorId: string;
  doctorName: string;
  reason: string;
  consultationFee: number;
  appointmentDate: string;
  appointmentTime: string;
}

interface BookingRegistrationStepProps {
  onSubmit: (data: RegistrationData) => void;
  loading: boolean;
}

interface DepartmentOption { id: string; name: string; }
interface DoctorOption { id: string; name: string; specialization: string; consultationFee: number; source: 'okapia' | 'visiteur'; }

// Créneaux horaires disponibles
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

export function BookingRegistrationStep({ onSubmit, loading }: BookingRegistrationStepProps) {
  const [consultationType, setConsultationType] = useState<'presentiel' | 'visioconference'>('presentiel');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [patientBloodType, setPatientBloodType] = useState('');
  const [reason, setReason] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPhoneValid = patientPhone.length === 9 && /^\d{9}$/.test(patientPhone);
  const fullPhone = `+243${patientPhone}`;

  // Date minimum = aujourd'hui
  const today = new Date().toISOString().split('T')[0];

  const isFormValid = useMemo(
    () => patientName.trim().length > 0 && isPhoneValid && appointmentDate !== '' && appointmentTime !== '',
    [patientName, isPhoneValid, appointmentDate, appointmentTime]
  );

  useEffect(() => { fetchDepartments(); }, []);

  useEffect(() => {
    if (departmentId) { setDoctorId(''); fetchDoctors(); }
    else { setDoctors([]); }
  }, [departmentId, consultationType]);

  async function fetchDepartments() {
    try {
      const { data, error: err } = await supabase
        .from('departments').select('id, name').eq('is_public', true).order('name');
      if (err) { setError('Impossible de charger les specialites.'); return; }
      if (data) setDepartments(data);
    } finally { setLoadingDepartments(false); }
  }

  function matchesDepartment(spec: string, deptName: string): boolean {
    if (!deptName) return true;
    const s = spec.toLowerCase();
    const d = deptName.toLowerCase();
    if (d.includes('general') && s.includes('general')) return true;
    if (d.includes('chirurgie') && s.includes('chirurgie')) return true;
    if (d.includes('cardiologie') && (s.includes('cardiologie') || s.includes('cardiologue'))) return true;
    if (d.includes('gynecol') && (s.includes('gyn') || s.includes('gynecol'))) return true;
    if (d.includes('pediatr') && s.includes('pediatr')) return true;
    if (d.includes('dentist') && (s.includes('dentist') || s.includes('dentaire'))) return true;
    if (d.includes('kinesither') && s.includes('kinesither')) return true;
    if (d.includes('medecine interne') && (s.includes('interne') || s.includes('interniste'))) return true;
    if (d.includes('radiologie') && (s.includes('radiologie') || s.includes('echographie'))) return true;
    if (d.includes('orthopedie') && (s.includes('orthopedie') || s.includes('orthop'))) return true;
    if (d === s) return true;
    return d.includes(s) || s.includes(d);
  }

  async function fetchDoctors() {
    setLoadingDoctors(true);
    setError(null);
    try {
      const selectedDept = departments.find(d => d.id === departmentId);
      const deptName = selectedDept?.name || '';

      // 1. Medecins employes Okapia
      let staffQuery = supabase
        .from('medical_staff')
        .select('id, display_name, specialization, consultation_fee, telemedicine_enabled, user_profiles!inner(full_name)')
        .eq('is_accepting_patients', true);
      if (consultationType === 'visioconference') staffQuery = staffQuery.eq('telemedicine_enabled', true);

      // 2. Medecins visiteurs
      const visiteurQuery = supabase
        .from('medecins_prestataires')
        .select('id, nom_complet, specialite')
        .eq('actif', true)
        .in('type', ['visiteur', 'les_deux']);

      const [staffRes, visiteurRes] = await Promise.all([staffQuery, visiteurQuery]);

      if (staffRes.error && visiteurRes.error) {
        setError('Impossible de charger les medecins.');
        return;
      }

      const okaDocs: DoctorOption[] = (staffRes.data || []).map((s: Record<string, unknown>) => {
        const profile = s.user_profiles as { full_name: string } | null;
        return {
          id: s.id as string,
          name: profile?.full_name || (s.display_name as string) || '',
          specialization: (s.specialization as string) || '',
          consultationFee: Number(s.consultation_fee) || 50,
          source: 'okapia' as const,
        };
      }).filter(doc => matchesDepartment(doc.specialization, deptName));

      const visiteurDocs: DoctorOption[] = (visiteurRes.data || []).map((v: Record<string, unknown>) => ({
        id: v.id as string,
        name: (v.nom_complet as string) || '',
        specialization: (v.specialite as string) || '',
        consultationFee: 50,
        source: 'visiteur' as const,
      })).filter(doc => matchesDepartment(doc.specialization, deptName));

      setDoctors([...okaDocs, ...visiteurDocs]);
    } finally { setLoadingDoctors(false); }
  }

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    setPatientPhone(digits);
    if (!phoneTouched) setPhoneTouched(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || loading) return;
    setError(null);
    const selectedDoctor = doctors.find((d) => d.id === doctorId);
    const selectedDept = departments.find((d) => d.id === departmentId);
    onSubmit({
      patientName: patientName.trim(),
      patientPhone: fullPhone,
      patientEmail: patientEmail.trim(),
      patientGender,
      patientBloodType,
      consultationType,
      specialty: selectedDept?.name || '',
      departmentId,
      doctorId,
      doctorName: selectedDoctor?.name || '',
      reason,
      consultationFee: selectedDoctor?.consultationFee || 50,
      appointmentDate,
      appointmentTime,
    });
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.form onSubmit={handleSubmit} variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Consultation Type */}
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-blue-600" />
          Type de consultation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { type: 'presentiel' as const, label: 'Presentiel', desc: 'Consultation en personne a la clinique', icon: MapPin },
            { type: 'visioconference' as const, label: 'Visioconference', desc: 'Consultation video a distance', icon: Video },
          ].map((opt) => (
            <motion.button key={opt.type} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setConsultationType(opt.type); setDoctorId(''); }}
              className={`relative p-6 rounded-2xl border-2 text-left transition-all overflow-hidden ${
                consultationType === opt.type ? 'border-blue-300 bg-blue-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
              {consultationType === opt.type && (
                <motion.div layoutId="consultation-indicator"
                  className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-[0.06]"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
              )}
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  consultationType === opt.type ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'
                }`}>
                  <opt.icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-lg text-gray-800 mb-1">{opt.label}</h4>
                <p className="text-sm text-gray-600">{opt.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Patient Info */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
            <User className="w-4 h-4 text-blue-600" />Nom complet *
          </label>
          <input type="text" required value={patientName} onChange={(e) => setPatientName(e.target.value)}
            placeholder="Jean Dupont"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white/80" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
            <Phone className="w-4 h-4 text-blue-600" />Telephone *
          </label>
          <div className="flex">
            <span className="flex items-center px-3 rounded-l-xl border-2 border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500 font-medium select-none">
              +243
            </span>
            <input type="tel" required value={patientPhone} onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => setPhoneTouched(true)} placeholder="812 345 678" maxLength={11}
              className={`flex-1 px-4 py-3 rounded-r-xl border-2 outline-none transition-all bg-white/80 ${
                !phoneTouched ? 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  : isPhoneValid ? 'border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                  : 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              }`} />
            {phoneTouched && (
              <div className="flex items-center pl-2">
                {isPhoneValid ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
              </div>
            )}
          </div>
          <p className={`text-xs mt-1.5 ${phoneTouched && !isPhoneValid ? 'text-red-500' : 'text-gray-400'}`}>
            Format : +243 XXX XXX XXX (9 chiffres)
          </p>
        </div>
      </motion.div>

      {/* Email, Gender & Blood Type */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
            <Mail className="w-4 h-4 text-blue-600" />Adresse email
          </label>
          <input type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)}
            placeholder="exemple@mail.com"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white/80" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
            <User className="w-4 h-4 text-blue-600" />Sexe
          </label>
          <select value={patientGender} onChange={(e) => setPatientGender(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white/80 appearance-none">
            <option value="">Selectionnez</option>
            <option value="male">Masculin</option>
            <option value="female">Feminin</option>
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
            <Stethoscope className="w-4 h-4 text-blue-600" />Groupe sanguin
          </label>
          <select value={patientBloodType} onChange={(e) => setPatientBloodType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white/80 appearance-none">
            <option value="">Selectionnez</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </motion.div>

      {/* Date & Heure */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />Date du rendez-vous *
          </label>
          <input type="date" required value={appointmentDate} min={today}
            onChange={(e) => setAppointmentDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white/80" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />Heure du rendez-vous *
          </label>
          <select required value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white/80 appearance-none">
            <option value="">Selectionnez une heure</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Department & Doctor */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
            <Stethoscope className="w-4 h-4 text-blue-600" />Specialite
          </label>
          {loadingDepartments ? (
            <div className="flex items-center gap-2 py-3 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />Chargement...
            </div>
          ) : (
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white/80 appearance-none">
              <option value="">Selectionnez une specialite</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
            <User className="w-4 h-4 text-blue-600" />Medecin
          </label>
          <AnimatePresence mode="wait">
            {loadingDoctors ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 py-3 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />Chargement des medecins...
              </motion.div>
            ) : (
              <motion.select key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white/80 appearance-none">
                <option value="">
                  {departmentId ? (doctors.length === 0 ? 'Aucun medecin disponible' : 'Selectionnez un medecin')
                    : "Choisissez la specialite d'abord"}
                </option>
                {doctors.filter(d => d.source === 'okapia').length > 0 && (
                  <optgroup label="Medecins Okapia">
                    {doctors.filter(d => d.source === 'okapia').map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.name} — {doc.specialization || 'Generaliste'}
                      </option>
                    ))}
                  </optgroup>
                )}
                {doctors.filter(d => d.source === 'visiteur').length > 0 && (
                  <optgroup label="Medecins Visiteurs">
                    {doctors.filter(d => d.source === 'visiteur').map((doc) => (
                      <option key={`v-${doc.id}`} value={doc.id}>
                        {doc.name} — {doc.specialization || 'Generaliste'}
                      </option>
                    ))}
                  </optgroup>
                )}
              </motion.select>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Reason */}
      <motion.div variants={itemVariants}>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
          <FileText className="w-4 h-4 text-blue-600" />Motif de consultation
        </label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          placeholder="Decrivez brievement le motif de votre visite..."
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white/80 resize-none" />
      </motion.div>

      {/* Submit */}
      <motion.div variants={itemVariants}>
        <motion.button type="submit" disabled={!isFormValid || loading}
          whileHover={isFormValid && !loading ? { scale: 1.01 } : {}}
          whileTap={isFormValid && !loading ? { scale: 0.99 } : {}}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 ${
            isFormValid && !loading
              ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white hover:shadow-xl cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}>
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /><span>Enregistrement en cours...</span></>
          ) : (
            <>Confirmer l'inscription<ArrowRight className="w-5 h-5" /></>
          )}
        </motion.button>
      </motion.div>
    </motion.form>
  );
}