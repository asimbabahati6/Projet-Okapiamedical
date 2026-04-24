import { useState } from 'react';
import { MedicalBookingSystem } from '../../components/booking/MedicalBookingSystem';
import { AppointmentLookup } from '../../components/appointments/AppointmentLookup';
import { JoinWaitingList } from '../../components/appointments/JoinWaitingList';
import { List, UserPlus } from 'lucide-react';

interface AppointmentsProps {
  preselectedDoctorId?: string | null;
}

export function Appointments({ preselectedDoctorId }: AppointmentsProps = {}) {
  const [showLookup, setShowLookup] = useState(false);
  const [showWaitingList, setShowWaitingList] = useState(false);

  return (
    <>
      {showLookup && <AppointmentLookup onClose={() => setShowLookup(false)} />}
      {showWaitingList && <JoinWaitingList onClose={() => setShowWaitingList(false)} />}

      {/* Quick actions bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setShowLookup(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Gerer un rendez-vous</span>
            <span className="sm:hidden">Existant</span>
          </button>
          <button
            onClick={() => setShowWaitingList(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Liste d'attente</span>
            <span className="sm:hidden">Attente</span>
          </button>
        </div>
      </div>

      <MedicalBookingSystem />
    </>
  );
}
