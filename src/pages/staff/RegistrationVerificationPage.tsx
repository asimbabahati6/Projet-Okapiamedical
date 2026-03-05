import { useState, useEffect } from 'react';
import {
  FileCheck,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Clock,
  FileText,
  X,
  Save,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PatientRegistration, IdentityDocument } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

export function RegistrationVerificationPage() {
  const { profile } = useAuth();
  const [registrations, setRegistrations] = useState<PatientRegistration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<PatientRegistration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<PatientRegistration | null>(null);
  const [documents, setDocuments] = useState<IdentityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    filterRegistrations();
  }, [registrations, searchTerm, statusFilter]);

  async function fetchRegistrations() {
    try {
      const { data, error } = await supabase
        .from('patient_registrations')
        .select(
          `
          *,
          identity_documents(*),
          payments:registration_payments(*),
          verified_by_user:user_profiles!patient_registrations_verified_by_fkey(*)
        `
        )
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterRegistrations() {
    let filtered = registrations;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (reg) =>
          reg.first_name.toLowerCase().includes(term) ||
          reg.last_name.toLowerCase().includes(term) ||
          reg.primary_email.toLowerCase().includes(term) ||
          reg.primary_phone.includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((reg) => reg.registration_status === statusFilter);
    }

    setFilteredRegistrations(filtered);
  }

  async function handleViewDetails(registration: PatientRegistration) {
    setSelectedRegistration(registration);
    setVerificationNotes(registration.verification_notes || '');

    const { data } = await supabase
      .from('identity_documents')
      .select('*')
      .eq('registration_id', registration.id);

    setDocuments(data || []);
  }

  async function handleVerificationAction(action: 'verify' | 'reject' | 'request_documents') {
    if (!selectedRegistration || !profile) return;

    setProcessing(true);
    try {
      let newStatus: string;
      let actionType: string;

      switch (action) {
        case 'verify':
          newStatus = 'verified';
          actionType = 'verified';
          break;
        case 'reject':
          newStatus = 'rejected';
          actionType = 'rejected';
          break;
        case 'request_documents':
          newStatus = 'documents_requested';
          actionType = 'documents_requested';
          break;
      }

      const { error: updateError } = await supabase
        .from('patient_registrations')
        .update({
          registration_status: newStatus,
          verification_notes: verificationNotes,
          verified_by: profile.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', selectedRegistration.id);

      if (updateError) throw updateError;

      await supabase.from('registration_verification_history').insert([
        {
          registration_id: selectedRegistration.id,
          action_type: actionType,
          previous_status: selectedRegistration.registration_status,
          new_status: newStatus,
          performed_by: profile.id,
          notes: verificationNotes,
        },
      ]);

      for (const doc of documents) {
        if (action === 'verify') {
          await supabase
            .from('identity_documents')
            .update({
              verification_status: 'verified',
              verified_by: profile.id,
              verified_at: new Date().toISOString(),
            })
            .eq('id', doc.id);
        }
      }

      alert(`Registration ${action === 'verify' ? 'verified' : action === 'reject' ? 'rejected' : 'sent back for documents'} successfully!`);
      setSelectedRegistration(null);
      fetchRegistrations();
    } catch (error) {
      console.error('Error updating registration:', error);
      alert('Failed to update registration status');
    } finally {
      setProcessing(false);
    }
  }

  async function getDocumentUrl(path: string) {
    const { data } = await supabase.storage.from('identity-documents').createSignedUrl(path, 3600);
    return data?.signedUrl || '';
  }

  const statusColors = {
    pending_verification: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    documents_requested: 'bg-orange-100 text-orange-800 border-orange-300',
    verified: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    completed: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Registration Verification</h1>
          <p className="text-gray-600 mt-1">Review and verify new patient registrations</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="documents_requested">Documents Requested</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRegistrations.map((registration) => (
          <div
            key={registration.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleViewDetails(registration)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {registration.first_name} {registration.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{registration.primary_email}</p>
                </div>
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                statusColors[registration.registration_status]
              }`}
            >
              {registration.registration_status === 'verified' && <CheckCircle className="w-3 h-3" />}
              {registration.registration_status === 'rejected' && <XCircle className="w-3 h-3" />}
              {registration.registration_status === 'pending_verification' && (
                <Clock className="w-3 h-3" />
              )}
              {registration.registration_status.replace('_', ' ').toUpperCase()}
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Submitted: {new Date(registration.submitted_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                <span>{registration.identity_documents?.length || 0} document(s)</span>
              </div>
              {registration.payment_status && (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="capitalize">{registration.payment_status}</span>
                </div>
              )}
            </div>

            <button
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(registration);
              }}
            >
              <Eye className="w-4 h-4" />
              Review Details
            </button>
          </div>
        ))}
      </div>

      {filteredRegistrations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No registrations found matching your criteria</p>
        </div>
      )}

      {selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Registration Details</h2>
              <button
                onClick={() => setSelectedRegistration(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
                  statusColors[selectedRegistration.registration_status]
                }`}
              >
                Current Status: {selectedRegistration.registration_status.replace('_', ' ').toUpperCase()}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-600">Full Name</dt>
                      <dd className="font-medium">
                        {selectedRegistration.first_name} {selectedRegistration.last_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Date of Birth</dt>
                      <dd className="font-medium">{selectedRegistration.date_of_birth}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Gender</dt>
                      <dd className="font-medium capitalize">{selectedRegistration.gender}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Contact Information
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-600">Primary Phone</dt>
                      <dd className="font-medium">{selectedRegistration.primary_phone}</dd>
                    </div>
                    {selectedRegistration.secondary_phone && (
                      <div>
                        <dt className="text-gray-600">Secondary Phone</dt>
                        <dd className="font-medium">{selectedRegistration.secondary_phone}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-gray-600">Primary Email</dt>
                      <dd className="font-medium">{selectedRegistration.primary_email}</dd>
                    </div>
                    {selectedRegistration.backup_email && (
                      <div>
                        <dt className="text-gray-600">Backup Email</dt>
                        <dd className="font-medium">{selectedRegistration.backup_email}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Address
                  </h3>
                  <p className="text-sm">
                    {selectedRegistration.street_address}
                    <br />
                    {selectedRegistration.city}
                    {selectedRegistration.postal_code && `, ${selectedRegistration.postal_code}`}
                    <br />
                    {selectedRegistration.country}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Medical Information
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-600">Consultation Reason</dt>
                      <dd className="font-medium">{selectedRegistration.consultation_reason}</dd>
                    </div>
                    {selectedRegistration.insurance_provider && (
                      <div>
                        <dt className="text-gray-600">Insurance</dt>
                        <dd className="font-medium">{selectedRegistration.insurance_provider}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Identity Documents ({documents.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium capitalize">
                            {doc.document_type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-600">{doc.document_number}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            doc.verification_status === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {doc.verification_status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <button
                          className="w-full text-left px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm"
                          onClick={async () => {
                            const url = await getDocumentUrl(doc.front_image_path);
                            setSelectedImage(url);
                          }}
                        >
                          View Front Image
                        </button>
                        {doc.back_image_path && (
                          <button
                            className="w-full text-left px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm"
                            onClick={async () => {
                              const url = await getDocumentUrl(doc.back_image_path!);
                              setSelectedImage(url);
                            }}
                          >
                            View Back Image
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Notes
                </label>
                <textarea
                  rows={4}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add notes about this registration..."
                />
              </div>

              {selectedRegistration.registration_status === 'pending_verification' ||
              selectedRegistration.registration_status === 'documents_requested' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerificationAction('verify')}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Verify & Approve
                  </button>
                  <button
                    onClick={() => handleVerificationAction('request_documents')}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <AlertCircle className="w-5 h-5" />
                    Request More Documents
                  </button>
                  <button
                    onClick={() => handleVerificationAction('reject')}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    This registration has already been {selectedRegistration.registration_status}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Document"
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
