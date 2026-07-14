import { useState, useEffect } from 'react';
import { X, User, Phone, Calendar, FileText, CreditCard, CreditCard as Edit, MapPin, Droplets, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Consultation {
  id: string;
  consultation_number: string | null;
  diagnosis: string | null;
  created_at: string;
  status: string;
}

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  total_amount: number;
  status: string;
  created_at: string;
}

export function PatientDetailsModal({
  patient,
  onClose,
  onEdit,
}: {
  patient: any;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'medical' | 'consultations' | 'invoices'>('info');

  useEffect(() => {
    if (patient?.id) fetchRelatedData();
  }, [patient?.id]);

  async function fetchRelatedData() {
    setLoading(true);
    try {
      const [consultRes, invoiceRes] = await Promise.all([
        supabase
          .from('consultations')
          .select('id, consultation_number, diagnosis, created_at, status')
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('invoices')
          .select('id, invoice_number, total_amount, status, created_at')
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      setConsultations(consultRes.data || []);
      setInvoices(invoiceRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!patient) return null;

  const initials = `${(patient.first_name || '')[0] || ''}${(patient.last_name || '')[0] || ''}`.toUpperCase();
  const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 86400000))
    : null;

  const tabs = [
    { key: 'info' as const, label: 'Informations' },
    { key: 'medical' as const, label: 'Medical' },
    { key: 'consultations' as const, label: `Consultations (${consultations.length})` },
    { key: 'invoices' as const, label: `Factures (${invoices.length})` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{fullName}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
              {patient.patient_number && (
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{patient.patient_number}</span>
              )}
              {age !== null && <span>{age} ans</span>}
              {patient.gender && (
                <span className="capitalize">{patient.gender === 'male' ? 'Homme' : patient.gender === 'female' ? 'Femme' : 'Autre'}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100">
          <div className="flex gap-1 -mb-px">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === t.key
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
            </div>
          ) : (
            <>
              {activeTab === 'info' && <InfoTab patient={patient} />}
              {activeTab === 'medical' && <MedicalTab patient={patient} />}
              {activeTab === 'consultations' && <ConsultationsTab consultations={consultations} />}
              {activeTab === 'invoices' && <InvoicesTab invoices={invoices} />}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoTab({ patient }: { patient: any }) {
  const fields = [
    { icon: User, label: 'Nom complet', value: `${patient.first_name || ''} ${patient.last_name || ''}`.trim() },
    { icon: Calendar, label: 'Date de naissance', value: patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('fr-FR') : '-' },
    { icon: User, label: 'Genre', value: patient.gender === 'male' ? 'Homme' : patient.gender === 'female' ? 'Femme' : patient.gender || '-' },
    { icon: Droplets, label: 'Groupe sanguin', value: patient.blood_group || '-' },
    { icon: Phone, label: 'Telephone', value: patient.phone || '-' },
    { icon: FileText, label: 'Email', value: patient.email || '-' },
    { icon: MapPin, label: 'Adresse', value: patient.address || '-' },
    { icon: MapPin, label: 'Ville', value: patient.city || '-' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((f, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
            <f.icon className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{f.label}</p>
            <p className="text-sm text-gray-900 mt-0.5">{f.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MedicalTab({ patient }: { patient: any }) {
  const items = [
    { label: 'Allergies', value: patient.allergies || 'Aucune allergie connue', warn: !!patient.allergies },
    { label: 'Maladies chroniques', value: patient.chronic_conditions || 'Aucune', warn: !!patient.chronic_conditions },
    { label: 'Contact d\'urgence', value: patient.emergency_contact_name || '-' },
    { label: 'Tel. urgence', value: patient.emergency_contact_phone || '-' },
    { label: 'Assurance', value: patient.insurance_provider || 'Aucune' },
    { label: 'N assurance', value: patient.insurance_number || '-' },
  ];

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className={`p-4 rounded-xl border ${item.warn ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}>
          <div className="flex items-center gap-2">
            {item.warn && <AlertCircle className="w-4 h-4 text-orange-500" />}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{item.label}</p>
          </div>
          <p className={`text-sm mt-1 ${item.warn ? 'text-orange-800 font-medium' : 'text-gray-800'}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ConsultationsTab({ consultations }: { consultations: Consultation[] }) {
  if (consultations.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Aucune consultation recente</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">N</th>
            <th className="px-4 py-3 text-left">Diagnostic</th>
            <th className="px-4 py-3 text-left">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {consultations.map(c => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-600">
                {new Date(c.created_at).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.consultation_number || '-'}</td>
              <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{c.diagnosis || '-'}</td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvoicesTab({ invoices }: { invoices: InvoiceRow[] }) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Aucune facture recente</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">N Facture</th>
            <th className="px-4 py-3 text-right">Montant</th>
            <th className="px-4 py-3 text-left">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.map(inv => (
            <tr key={inv.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-600">
                {new Date(inv.created_at).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.invoice_number || '-'}</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                {Number(inv.total_amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={inv.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    partial: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    in_progress: 'bg-blue-100 text-blue-800',
  };
  const labels: Record<string, string> = {
    paid: 'Paye',
    completed: 'Termine',
    pending: 'En attente',
    partial: 'Partiel',
    cancelled: 'Annule',
    in_progress: 'En cours',
    draft: 'Brouillon',
  };

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}
