import { useState } from 'react';
import { MedicalBookingSystem } from '../../components/booking/MedicalBookingSystem';
import { AppointmentLookup } from '../../components/appointments/AppointmentLookup';
import { List } from 'lucide-react';

interface AppointmentsProps {
  preselectedDoctorId?: string | null;
}

export function Appointments({ preselectedDoctorId }: AppointmentsProps = {}) {
  const [showLookup, setShowLookup] = useState(false);

  return (
    <>
      {showLookup && <AppointmentLookup onClose={() => setShowLookup(false)} />}

      {/* Quick actions bar — bouton liste d'attente supprimé */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setShowLookup(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Gérer un rendez-vous</span>
            <span className="sm:hidden">Existant</span>
          </button>
        </div>
      </div>

      {/* Formulaire uniquement — pas de liste */}
      <MedicalBookingSystem />
    </>
  );
}