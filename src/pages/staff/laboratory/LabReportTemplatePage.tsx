import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, CheckCircle, FlaskConical } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { downloadLabReportPDF, LabReportData, LabReportParameter } from '../../../utils/generateLabReportPDF';

interface OrderData {
  id: string;
  order_number: string;
  priority: string;
  status: string;
  result_value: string | null;
  is_abnormal: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient: {
    first_name: string;
    last_name: string;
    patient_number: string;
    date_of_birth: string;
    gender: string;
  };
  test: {
    test_name: string;
    test_code: string;
    category: string;
    specimen_type: string;
    normal_range: string;
    unit: string;
  };
  prescriber: {
    full_name: string;
  };
  performer: {
    full_name: string;
  } | null;
  approver: {
    full_name: string;
  } | null;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    normal: 'Normal',
    urgent: 'Urgent',
    stat: 'STAT (Immediat)',
  };
  return labels[priority] || priority;
}

function getPriorityClass(priority: string): string {
  const classes: Record<string, string> = {
    normal: 'bg-gray-100 text-gray-700',
    urgent: 'bg-orange-100 text-orange-700',
    stat: 'bg-red-100 text-red-700',
  };
  return classes[priority] || 'bg-gray-100 text-gray-700';
}

export default function LabReportTemplatePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [parameters, setParameters] = useState<LabReportParameter[]>([]);
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(!!orderId);

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_orders')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_number, date_of_birth, gender),
          test:lab_tests!lab_orders_test_id_fkey(test_name, test_code, category, specimen_type, normal_range, unit),
          prescriber:user_profiles!lab_orders_doctor_id_fkey(full_name),
          performer:user_profiles!lab_orders_performed_by_fkey(full_name),
          approver:user_profiles!lab_orders_approved_by_fkey(full_name)
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setOrder(data as unknown as OrderData);

        // Parse results if available
        if (data.result_value) {
          try {
            const parsed = typeof data.result_value === 'string'
              ? JSON.parse(data.result_value)
              : data.result_value;

            if (parsed.parameters) {
              setParameters(parsed.parameters.map((p: Record<string, string | boolean>) => ({
                name: p.name || p.parameter || '',
                value: p.value || '',
                unit: p.unit || '',
                reference: p.reference || p.reference_range || '',
                isAbnormal: !!p.isAbnormal,
              })));
            }
            if (parsed.interpretation) {
              setInterpretation(parsed.interpretation);
            }
          } catch {
            // Single value result
            if (data.test) {
              setParameters([{
                name: (data.test as { test_name: string }).test_name,
                value: data.result_value as string,
                unit: (data.test as { unit: string }).unit || '',
                reference: (data.test as { normal_range: string }).normal_range || '',
                isAbnormal: data.is_abnormal || false,
              }]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport Laboratoire${order ? ` - ${order.order_number}` : ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 40px; }
          .report-container { max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 3px solid #1e40af; }
          .logo-section { display: flex; align-items: center; gap: 12px; }
          .logo-section img { width: 60px; height: 60px; object-fit: contain; }
          .clinic-name { font-size: 22px; font-weight: 700; color: #1e40af; }
          .clinic-info { text-align: right; font-size: 11px; color: #555; line-height: 1.6; }
          .report-title { text-align: center; margin: 24px 0; }
          .report-title h2 { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; }
          .report-title .subtitle { font-size: 14px; color: #1e40af; font-weight: 600; }
          .report-meta { display: flex; justify-content: space-between; font-size: 11px; color: #666; margin-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
          .info-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; font-weight: 700; }
          .info-box p { font-size: 12px; color: #333; margin: 4px 0; }
          .info-box .label { font-weight: 600; }
          .intervenants { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-bottom: 24px; }
          .intervenants h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; font-weight: 700; }
          .intervenants p { font-size: 12px; color: #333; margin: 3px 0; }
          .section { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px; }
          .section h3 { font-size: 12px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          thead { background: #1e40af; }
          thead th { padding: 10px 12px; text-align: left; color: white; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          tbody tr { border-bottom: 1px solid #e5e7eb; }
          tbody tr:nth-child(even) { background: #f8fafc; }
          tbody td { padding: 10px 12px; font-size: 11px; }
          .value-normal { color: #166534; }
          .value-abnormal { color: #dc2626; font-weight: 700; }
          .status-normal { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
          .status-abnormal { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
          .interpretation { margin-top: 16px; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
          .interpretation h3 { font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase; margin-bottom: 8px; }
          .interpretation p { font-size: 12px; color: #333; line-height: 1.7; white-space: pre-wrap; }
          .signature-area { margin-top: 40px; display: flex; justify-content: flex-end; }
          .signature-block { text-align: center; min-width: 200px; }
          .signature-block p { font-size: 11px; color: #555; }
          .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 6px; }
          .validation-badge { margin-top: 16px; display: flex; align-items: center; gap: 6px; color: #166534; font-size: 11px; font-weight: 600; }
          .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; }
          .footer p { font-size: 9px; color: #999; margin: 3px 0; }
          .footer .confidential { font-style: italic; font-size: 10px; color: #666; margin-bottom: 6px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  };

  const handleDownloadPdf = () => {
    const reportData = buildReportData();
    if (reportData) {
      downloadLabReportPDF(reportData);
    }
  };

  const buildReportData = (): LabReportData | null => {
    if (!order) return null;

    return {
      orderNumber: order.order_number,
      reportDate: new Date().toLocaleDateString('fr-FR'),
      patient: {
        firstName: order.patient.first_name,
        lastName: order.patient.last_name,
        patientNumber: order.patient.patient_number,
        dateOfBirth: new Date(order.patient.date_of_birth).toLocaleDateString('fr-FR'),
        gender: order.patient.gender,
      },
      analysis: {
        testName: order.test.test_name,
        testCode: order.test.test_code,
        category: order.test.category,
        specimenType: order.test.specimen_type,
        priority: order.priority,
        requestedDate: new Date(order.created_at).toLocaleDateString('fr-FR'),
        completedDate: order.updated_at
          ? new Date(order.updated_at).toLocaleDateString('fr-FR')
          : undefined,
      },
      prescriber: order.prescriber.full_name,
      performer: order.performer?.full_name,
      approver: order.approver?.full_name,
      parameters,
      interpretation,
      status: order.status,
    };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="text-gray-600 mt-4">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  const isBlankTemplate = !orderId || !order;
  const today = new Date().toLocaleDateString('fr-FR');

  return (
    <div className="p-8">
      {/* Navigation */}
      <button
        onClick={() => navigate('/staff/laboratory')}
        className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 print:hidden"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour au Laboratoire
      </button>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border border-gray-200 bg-gray-50 rounded-t-xl mb-0 print:hidden">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-green-600" />
          <h2 className="text-sm font-semibold text-gray-700">
            {isBlankTemplate ? "Modele de rapport d'analyses" : "Rapport d'analyses medicales"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          {!isBlankTemplate && (
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          )}
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-gray-100 p-8 rounded-b-xl print:bg-white print:p-0">
        <div ref={printRef} className="bg-white rounded-xl shadow-sm max-w-[800px] mx-auto p-10 print:shadow-none print:rounded-none">
          {/* Header - same as invoice */}
          <div className="flex justify-between items-start pb-5 border-b-[3px] border-blue-700 mb-6">
            <div className="flex items-center gap-3">
              <img
                src="/Logo-Okapi-Medical.jpg"
                alt="OKAPIA Medical"
                className="w-14 h-14 object-contain"
              />
              <span className="text-2xl font-bold text-blue-700">OKAPIA Medical</span>
            </div>
            <div className="text-right text-xs text-gray-500 leading-relaxed">
              <p>Chaussee Mzee Kabila n16.881</p>
              <p>Galerie Manfield, Kinshasa-Ngaliema</p>
              <p>Kinshasa, Republique Democratique du Congo</p>
              <p>Direction : +243 817 659 057</p>
              <p>Reception : +243 823 800 104</p>
              <p>Email : info@okapiahospital.com</p>
              <p>RCCM : CD/KIN/RCCM/25-B-00412</p>
            </div>
          </div>

          {/* Report Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              RAPPORT D'ANALYSES MEDICALES
            </h2>
            {order && (
              <p className="text-sm font-semibold text-blue-700">
                {order.test.test_name} ({order.test.category})
              </p>
            )}
            {isBlankTemplate && (
              <p className="text-sm font-semibold text-blue-700">
                [Type d'analyse] - [Categorie]
              </p>
            )}
          </div>

          {/* Report meta */}
          <div className="flex justify-between text-xs text-gray-500 mb-6">
            <span>
              N Ordre: {order ? order.order_number : '_______________'}
            </span>
            <span>Date: {today}</span>
          </div>

          {/* Info boxes */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Patient box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">
                Informations Patient
              </h4>
              {order ? (
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Nom :</span> {order.patient.last_name} {order.patient.first_name}</p>
                  <p><span className="font-semibold">N Dossier :</span> {order.patient.patient_number}</p>
                  <p><span className="font-semibold">Date de naissance :</span> {new Date(order.patient.date_of_birth).toLocaleDateString('fr-FR')}</p>
                  <p><span className="font-semibold">Sexe :</span> {order.patient.gender === 'male' ? 'Masculin' : 'Feminin'}</p>
                </div>
              ) : (
                <div className="space-y-1 text-sm text-gray-400">
                  <p>Nom : ________________________________</p>
                  <p>N Dossier : __________________________</p>
                  <p>Date de naissance : ___________________</p>
                  <p>Sexe : _______________________________</p>
                </div>
              )}
            </div>

            {/* Analysis details box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">
                Details Analyse
              </h4>
              {order ? (
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Analyse :</span> {order.test.test_name}</p>
                  <p><span className="font-semibold">Echantillon :</span> {order.test.specimen_type}</p>
                  <p>
                    <span className="font-semibold">Priorite :</span>{' '}
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(order.priority)}`}>
                      {getPriorityLabel(order.priority)}
                    </span>
                  </p>
                  <p><span className="font-semibold">Demande le :</span> {new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              ) : (
                <div className="space-y-1 text-sm text-gray-400">
                  <p>Analyse : ____________________________</p>
                  <p>Echantillon : ________________________</p>
                  <p>Priorite : ___________________________</p>
                  <p>Demande le : _________________________</p>
                </div>
              )}
            </div>
          </div>

          {/* Intervenants */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">
              Intervenants
            </h4>
            {order ? (
              <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
                <p><span className="font-semibold">Prescripteur :</span> Dr. {order.prescriber.full_name}</p>
                {order.performer && (
                  <p><span className="font-semibold">Biologiste :</span> {order.performer.full_name}</p>
                )}
                {order.approver && (
                  <p><span className="font-semibold">Valide par :</span> {order.approver.full_name}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-gray-400">
                <p>Prescripteur : Dr. _____________________</p>
                <p>Biologiste : __________________________</p>
              </div>
            )}
          </div>

          {/* Results Table */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">
              Resultats
            </h3>

            {parameters.length > 0 ? (
              <table className="w-full mb-4">
                <thead>
                  <tr className="bg-blue-700 text-white text-[10px] uppercase tracking-wide">
                    <th className="py-2.5 px-3 text-left">Parametre</th>
                    <th className="py-2.5 px-3 text-center w-24">Valeur</th>
                    <th className="py-2.5 px-3 text-center w-20">Unite</th>
                    <th className="py-2.5 px-3 text-center w-28">Reference</th>
                    <th className="py-2.5 px-3 text-center w-20">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param, idx) => (
                    <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                      <td className="py-2.5 px-3 text-sm font-medium text-gray-800">{param.name}</td>
                      <td className={`py-2.5 px-3 text-center text-sm font-semibold ${param.isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>
                        {param.value}
                      </td>
                      <td className="py-2.5 px-3 text-center text-sm text-gray-600">{param.unit}</td>
                      <td className="py-2.5 px-3 text-center text-sm text-gray-500">{param.reference}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          param.isAbnormal
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {param.isAbnormal ? 'ANORMAL' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                {isBlankTemplate ? (
                  <div className="text-gray-400 text-sm space-y-2">
                    <p className="font-medium">Tableau des resultats d'analyses</p>
                    <p>Les parametres, valeurs, unites et references seront affiches ici</p>
                    <div className="mt-4 border border-gray-200 rounded overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-100 text-gray-500">
                            <th className="py-2 px-2 text-left">Parametre</th>
                            <th className="py-2 px-2 text-center">Valeur</th>
                            <th className="py-2 px-2 text-center">Unite</th>
                            <th className="py-2 px-2 text-center">Reference</th>
                            <th className="py-2 px-2 text-center">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-300">
                          <tr className="border-t border-gray-100">
                            <td className="py-2 px-2">Hemoglobine</td>
                            <td className="py-2 px-2 text-center">___</td>
                            <td className="py-2 px-2 text-center">g/dL</td>
                            <td className="py-2 px-2 text-center">13-17</td>
                            <td className="py-2 px-2 text-center">---</td>
                          </tr>
                          <tr className="border-t border-gray-100">
                            <td className="py-2 px-2">Leucocytes</td>
                            <td className="py-2 px-2 text-center">___</td>
                            <td className="py-2 px-2 text-center">/mm3</td>
                            <td className="py-2 px-2 text-center">4000-10000</td>
                            <td className="py-2 px-2 text-center">---</td>
                          </tr>
                          <tr className="border-t border-gray-100">
                            <td className="py-2 px-2">Plaquettes</td>
                            <td className="py-2 px-2 text-center">___</td>
                            <td className="py-2 px-2 text-center">/mm3</td>
                            <td className="py-2 px-2 text-center">150000-400000</td>
                            <td className="py-2 px-2 text-center">---</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Aucun resultat saisi pour cette analyse.</p>
                )}
              </div>
            )}
          </div>

          {/* Interpretation */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
              Interpretation du Biologiste
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[60px]">
              {interpretation ? (
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {interpretation}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  {isBlankTemplate
                    ? "Commentaires et interpretation des resultats par le biologiste..."
                    : "Aucune interpretation saisie."}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          {order?.notes && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
                Notes complementaires
              </h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {order.notes}
              </p>
            </div>
          )}

          {/* Signature Area */}
          <div className="mt-12 flex justify-end">
            <div className="text-center min-w-[200px]">
              <p className="text-sm text-gray-600 mb-10">Le Biologiste,</p>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm text-gray-700">
                  {order?.performer?.full_name || '________________________'}
                </p>
              </div>
            </div>
          </div>

          {/* Validation badge */}
          {order?.status === 'completed' && order?.approver && (
            <div className="mt-4 flex items-center gap-2 text-green-700 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              Valide par {order.approver.full_name}
              {order.updated_at && (
                <span className="font-normal text-gray-500">
                  le {new Date(order.updated_at).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-gray-200 text-center">
            <p className="text-[10px] italic text-gray-500 mb-2">
              Ce rapport est un document medical confidentiel. Les resultats doivent etre interpretes par un medecin.
            </p>
            <p className="text-[10px] text-gray-400">
              OKAPIA Medical - Chaussee Mzee Kabila n16.881, Kinshasa-Ngaliema - Tel. +243 817 659 057
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Genere le {today} a {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
