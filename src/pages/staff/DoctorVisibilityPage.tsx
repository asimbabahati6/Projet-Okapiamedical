import { DoctorVisibilityTroubleshooter } from '../../components/admin/DoctorVisibilityTroubleshooter';

export default function DoctorVisibilityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion de la Visibilité des Médecins</h1>
        <p className="text-gray-600 mt-2">
          Diagnostiquez et corrigez les problèmes de visibilité des médecins sur le site public
        </p>
      </div>

      <DoctorVisibilityTroubleshooter />
    </div>
  );
}
