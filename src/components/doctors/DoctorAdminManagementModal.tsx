import { useState, useEffect } from 'react';
import { X, Users, TrendingUp, Calendar, BarChart3, FileText, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { DoctorWorkload } from '../../services/doctorAnalyticsService';

interface DoctorAdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorWorkload;
}

interface AdminData {
  hrInfo: {
    contractType: string;
    hireDate: string;
    contractEndDate: string | null;
    employmentStatus: string;
    workSchedule: string;
  };
  payrollInfo: {
    baseSalary: number;
    currency: string;
    lastPayment: string | null;
    totalEarnings: number;
  };
  scheduleInfo: {
    weeklyHours: number;
    onCallDuties: number;
    upcomingLeaves: any[];
    overtimeHours: number;
  };
  statsInfo: {
    monthlyConsultations: number;
    totalPatients: number;
    avgConsultationDuration: number;
    satisfactionScore: number;
  };
}

export default function DoctorAdminManagementModal({ isOpen, onClose, doctor }: DoctorAdminManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'hr' | 'payroll' | 'schedule' | 'stats'>('hr');
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen, doctor.doctorId]);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const { data: staffData, error: staffError } = await supabase
        .from('medical_staff')
        .select('*')
        .eq('user_id', doctor.doctorId)
        .single();

      if (staffError) throw staffError;

      const { count: monthlyConsults } = await supabase
        .from('consultations')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doctor.doctorId)
        .gte('consultation_date', new Date(new Date().setDate(1)).toISOString());

      const { data: payrollData } = await supabase
        .from('payroll')
        .select('*')
        .eq('employee_id', doctor.doctorId)
        .order('pay_period_end', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', doctor.doctorId)
        .eq('status', 'approved')
        .gte('end_date', new Date().toISOString())
        .order('start_date');

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('check_in, check_out')
        .eq('user_id', doctor.doctorId)
        .gte('check_in', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());

      let overtimeHours = 0;
      if (attendanceData) {
        attendanceData.forEach(att => {
          if (att.check_in && att.check_out) {
            const hours = (new Date(att.check_out).getTime() - new Date(att.check_in).getTime()) / (1000 * 60 * 60);
            if (hours > 8) overtimeHours += hours - 8;
          }
        });
      }

      const totalEarnings = payrollData
        ? payrollData.base_salary + (payrollData.bonuses || 0) + (payrollData.overtime_pay || 0)
        : staffData.base_salary || 0;

      setAdminData({
        hrInfo: {
          contractType: staffData.contract_type || 'Non renseigné',
          hireDate: staffData.hire_date || '',
          contractEndDate: staffData.contract_end_date || null,
          employmentStatus: staffData.employment_status || 'active',
          workSchedule: staffData.work_schedule || 'full_time'
        },
        payrollInfo: {
          baseSalary: staffData.base_salary || 0,
          currency: 'USD',
          lastPayment: payrollData?.pay_period_end || null,
          totalEarnings: totalEarnings
        },
        scheduleInfo: {
          weeklyHours: staffData.work_schedule === 'full_time' ? 40 : 20,
          onCallDuties: 0,
          upcomingLeaves: leaveRequests || [],
          overtimeHours: Math.round(overtimeHours)
        },
        statsInfo: {
          monthlyConsultations: monthlyConsults || 0,
          totalPatients: doctor.patientsAssigned,
          avgConsultationDuration: 30,
          satisfactionScore: doctor.averageRating
        }
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const tabs = [
    { id: 'hr', label: 'RH', icon: Users },
    { id: 'payroll', label: 'Paie', icon: DollarSign },
    { id: 'schedule', label: 'Horaires', icon: Calendar },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion Administrative - {doctor.doctorName}</h2>
            <p className="text-sm text-gray-600 mt-1">{doctor.specialization}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="border-b">
          <div className="flex">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Chargement des données...</p>
            </div>
          ) : adminData ? (
            <>
              {activeTab === 'hr' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-5 rounded-lg border">
                      <h3 className="font-semibold text-gray-900 mb-4">Informations Contractuelles</h3>
                      <dl className="space-y-3 text-sm">
                        <div>
                          <dt className="text-gray-600">Type de contrat</dt>
                          <dd className="font-medium text-gray-900 mt-1">
                            {adminData.hrInfo.contractType === 'CDI' ? 'CDI - Contrat à Durée Indéterminée' :
                             adminData.hrInfo.contractType === 'CDD' ? 'CDD - Contrat à Durée Déterminée' :
                             adminData.hrInfo.contractType}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Date d'embauche</dt>
                          <dd className="font-medium text-gray-900 mt-1">
                            {adminData.hrInfo.hireDate ? new Date(adminData.hrInfo.hireDate).toLocaleDateString('fr-FR') : 'Non renseignée'}
                          </dd>
                        </div>
                        {adminData.hrInfo.contractEndDate && (
                          <div>
                            <dt className="text-gray-600">Fin de contrat</dt>
                            <dd className="font-medium text-gray-900 mt-1">
                              {new Date(adminData.hrInfo.contractEndDate).toLocaleDateString('fr-FR')}
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-gray-600">Statut</dt>
                          <dd className="mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              adminData.hrInfo.employmentStatus === 'active' ? 'bg-green-100 text-green-700' :
                              adminData.hrInfo.employmentStatus === 'on_leave' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {adminData.hrInfo.employmentStatus === 'active' ? 'Actif' :
                               adminData.hrInfo.employmentStatus === 'on_leave' ? 'En congé' :
                               'Inactif'}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Horaires</dt>
                          <dd className="font-medium text-gray-900 mt-1">
                            {adminData.hrInfo.workSchedule === 'full_time' ? 'Temps plein' :
                             adminData.hrInfo.workSchedule === 'part_time' ? 'Temps partiel' :
                             'Sur appel'}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-lg border">
                      <h3 className="font-semibold text-gray-900 mb-4">Documents & Certifications</h3>
                      <div className="space-y-2">
                        <button className="w-full p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center justify-between">
                          <span className="text-sm font-medium">Contrat de travail</span>
                          <FileText className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="w-full p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center justify-between">
                          <span className="text-sm font-medium">Diplômes médicaux</span>
                          <FileText className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="w-full p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center justify-between">
                          <span className="text-sm font-medium">Certificat RPPS</span>
                          <FileText className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="w-full p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center justify-between">
                          <span className="text-sm font-medium">Assurance professionnelle</span>
                          <FileText className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payroll' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-700 mb-1">Salaire de base</div>
                      <div className="text-2xl font-bold text-blue-900">
                        ${adminData.payrollInfo.baseSalary.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">par mois</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border border-green-200">
                      <div className="text-sm text-green-700 mb-1">Rémunération totale</div>
                      <div className="text-2xl font-bold text-green-900">
                        ${adminData.payrollInfo.totalEarnings.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600 mt-1">dernier paiement</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg border border-purple-200">
                      <div className="text-sm text-purple-700 mb-1">Dernier versement</div>
                      <div className="text-lg font-bold text-purple-900">
                        {adminData.payrollInfo.lastPayment
                          ? new Date(adminData.payrollInfo.lastPayment).toLocaleDateString('fr-FR')
                          : 'Aucun'}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">date</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg border">
                    <h3 className="font-semibold text-gray-900 mb-4">Historique des paiements</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left py-2 px-3">Période</th>
                            <th className="text-right py-2 px-3">Salaire base</th>
                            <th className="text-right py-2 px-3">Primes</th>
                            <th className="text-right py-2 px-3">Heures sup.</th>
                            <th className="text-right py-2 px-3">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b hover:bg-gray-100">
                            <td className="py-2 px-3">Janvier 2026</td>
                            <td className="text-right py-2 px-3">${adminData.payrollInfo.baseSalary.toLocaleString()}</td>
                            <td className="text-right py-2 px-3">$0</td>
                            <td className="text-right py-2 px-3">$0</td>
                            <td className="text-right py-2 px-3 font-semibold">${adminData.payrollInfo.baseSalary.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Générer Fiche de Paie
                    </button>
                    <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                      Historique Complet
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-5 rounded-lg border">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Planning hebdomadaire
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Heures hebdomadaires</span>
                          <span className="font-semibold text-gray-900">{adminData.scheduleInfo.weeklyHours}h</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Heures supplémentaires (30j)</span>
                          <span className="font-semibold text-orange-600">{adminData.scheduleInfo.overtimeHours}h</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Gardes ce mois</span>
                          <span className="font-semibold text-gray-900">{adminData.scheduleInfo.onCallDuties}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-lg border">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        Congés à venir
                      </h3>
                      {adminData.scheduleInfo.upcomingLeaves.length > 0 ? (
                        <div className="space-y-2">
                          {adminData.scheduleInfo.upcomingLeaves.map((leave: any) => (
                            <div key={leave.id} className="p-3 bg-white border rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{leave.leave_type}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(leave.start_date).toLocaleDateString('fr-FR')} - {new Date(leave.end_date).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Aucun congé prévu</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Modifier Planning
                    </button>
                    <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                      Demander un Congé
                    </button>
                    <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                      Voir Historique Présence
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-700 mb-1">Consultations</div>
                      <div className="text-3xl font-bold text-blue-900">{adminData.statsInfo.monthlyConsultations}</div>
                      <div className="text-xs text-blue-600 mt-1">ce mois</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border border-green-200">
                      <div className="text-sm text-green-700 mb-1">Patients suivis</div>
                      <div className="text-3xl font-bold text-green-900">{adminData.statsInfo.totalPatients}</div>
                      <div className="text-xs text-green-600 mt-1">actifs</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg border border-purple-200">
                      <div className="text-sm text-purple-700 mb-1">Durée moyenne</div>
                      <div className="text-3xl font-bold text-purple-900">{adminData.statsInfo.avgConsultationDuration}</div>
                      <div className="text-xs text-purple-600 mt-1">minutes</div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-lg border border-orange-200">
                      <div className="text-sm text-orange-700 mb-1">Satisfaction</div>
                      <div className="text-3xl font-bold text-orange-900">{adminData.statsInfo.satisfactionScore.toFixed(1)}/5</div>
                      <div className="text-xs text-orange-600 mt-1">note moyenne</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg border">
                    <h3 className="font-semibold text-gray-900 mb-4">Performance mensuelle</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Taux d'occupation</span>
                          <span className="font-semibold">{doctor.occupancyRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              doctor.occupancyRate < 60 ? 'bg-green-500' :
                              doctor.occupancyRate < 80 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${doctor.occupancyRate}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Consultations / Objectif (100)</span>
                          <span className="font-semibold">{adminData.statsInfo.monthlyConsultations}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min((adminData.statsInfo.monthlyConsultations / 100) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Générer Rapport d'Activité
                    </button>
                    <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                      Évaluation Annuelle
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
