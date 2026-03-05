import { Prescription, PrescriptionItem } from '../types/database';
import { formatDoctorName } from './formatDoctorName';

export interface PrescriptionExportData extends Prescription {
  items: PrescriptionItem[];
}

export function generateQRCodeData(prescription: Prescription): string {
  return JSON.stringify({
    id: prescription.id,
    number: prescription.prescription_number,
    patient: prescription.patient_id,
    doctor: prescription.doctor_id,
    date: prescription.prescription_date,
    expiry: prescription.expiration_date
  });
}

export function exportToPDF(prescription: PrescriptionExportData): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour imprimer la prescription');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Prescription ${prescription.prescription_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .hospital-name {
          font-size: 28px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }
        .hospital-details {
          font-size: 14px;
          color: #666;
        }
        .prescription-title {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin: 30px 0 20px;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .info-item {
          display: flex;
          gap: 8px;
        }
        .info-label {
          font-weight: 600;
          color: #374151;
          min-width: 120px;
        }
        .info-value {
          color: #6b7280;
        }
        .medication-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .medication-table th {
          background: #2563eb;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 14px;
        }
        .medication-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
          color: #374151;
        }
        .medication-table tr:hover {
          background: #f9fafb;
        }
        .notes-box {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
        }
        .notes-title {
          font-weight: bold;
          color: #92400e;
          margin-bottom: 8px;
        }
        .notes-content {
          color: #78350f;
          line-height: 1.6;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
        }
        .signature-block {
          text-align: center;
        }
        .signature-line {
          width: 200px;
          border-top: 2px solid #374151;
          margin: 40px auto 10px;
        }
        .signature-label {
          font-size: 14px;
          color: #6b7280;
        }
        .qr-code {
          position: absolute;
          top: 40px;
          right: 40px;
          padding: 10px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
        }
        .prescription-number {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          color: #2563eb;
          margin: 20px 0;
        }
        .validity-notice {
          background: #fef2f2;
          border: 1px solid #ef4444;
          border-radius: 8px;
          padding: 10px;
          margin-top: 20px;
          text-align: center;
          color: #991b1b;
          font-size: 12px;
        }
        @media print {
          body {
            padding: 20px;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="hospital-name">Hôpital Général</div>
        <div class="hospital-details">
          Avenue de la Libération, Kinshasa<br>
          Tél: +243 999 000 000 | Email: contact@hopital.cd
        </div>
      </div>

      ${prescription.qr_code ? `
      <div class="qr-code">
        <canvas id="qrcode"></canvas>
      </div>
      ` : ''}

      <div class="prescription-title">Ordonnance Médicale</div>

      <div class="prescription-number">
        N° ${prescription.prescription_number}
      </div>

      <div class="section">
        <div class="section-title">Informations Patient</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Nom:</span>
            <span class="info-value">${prescription.patient?.first_name} ${prescription.patient?.last_name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">N° Patient:</span>
            <span class="info-value">${prescription.patient?.patient_number}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Date de naissance:</span>
            <span class="info-value">${prescription.patient?.date_of_birth ? new Date(prescription.patient.date_of_birth).toLocaleDateString('fr-FR') : 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Téléphone:</span>
            <span class="info-value">${prescription.patient?.phone || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Informations Prescription</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Date:</span>
            <span class="info-value">${new Date(prescription.prescription_date).toLocaleDateString('fr-FR')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Valide jusqu'au:</span>
            <span class="info-value">${new Date(prescription.expiration_date).toLocaleDateString('fr-FR')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Médecin:</span>
            <span class="info-value">${formatDoctorName(prescription.doctor?.user_profile?.full_name)}</span>
          </div>
          ${prescription.diagnosis ? `
          <div class="info-item" style="grid-column: 1 / -1;">
            <span class="info-label">Diagnostic:</span>
            <span class="info-value">${prescription.diagnosis}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Médicaments Prescrits</div>
        <table class="medication-table">
          <thead>
            <tr>
              <th>Médicament</th>
              <th>Dosage</th>
              <th>Fréquence</th>
              <th>Durée</th>
              <th>Quantité</th>
            </tr>
          </thead>
          <tbody>
            ${prescription.items?.map(item => `
              <tr>
                <td>${item.medication?.brand_name || item.medication?.generic_name}</td>
                <td>${item.dosage}</td>
                <td>${item.frequency}</td>
                <td>${item.duration}</td>
                <td>${item.quantity}</td>
              </tr>
              ${item.instructions ? `
              <tr>
                <td colspan="5" style="padding-left: 30px; font-style: italic; color: #6b7280;">
                  <strong>Instructions:</strong> ${item.instructions}
                </td>
              </tr>
              ` : ''}
            `).join('')}
          </tbody>
        </table>
      </div>

      ${prescription.notes ? `
      <div class="notes-box">
        <div class="notes-title">Notes du Médecin</div>
        <div class="notes-content">${prescription.notes}</div>
      </div>
      ` : ''}

      <div class="validity-notice">
        Cette ordonnance est valide jusqu'au ${new Date(prescription.expiration_date).toLocaleDateString('fr-FR')}
      </div>

      <div class="footer">
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">Signature du Médecin</div>
          <div style="margin-top: 5px; font-weight: 600;">${formatDoctorName(prescription.doctor?.user_profile?.full_name)}</div>
        </div>
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">Cachet de l'Hôpital</div>
        </div>
      </div>

      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="padding: 12px 30px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
          Imprimer
        </button>
        <button onclick="window.close()" style="padding: 12px 30px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin-left: 10px;">
          Fermer
        </button>
      </div>

      <script>
        window.onload = function() {
          setTimeout(() => window.print(), 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function exportToExcel(prescriptions: PrescriptionExportData[]): void {
  let csvContent = 'data:text/csv;charset=utf-8,';

  csvContent += 'N° Prescription,Date,Patient,N° Patient,Médecin,Pharmacie,Diagnostic,Médicament,Dosage,Fréquence,Durée,Quantité,Instructions,Statut,Date Dispensation\n';

  prescriptions.forEach(prescription => {
    prescription.items?.forEach(item => {
      const row = [
        prescription.prescription_number,
        new Date(prescription.prescription_date).toLocaleDateString('fr-FR'),
        `${prescription.patient?.first_name} ${prescription.patient?.last_name}`,
        prescription.patient?.patient_number,
        prescription.doctor?.user_profile?.full_name,
        prescription.pharmacy?.name || 'N/A',
        prescription.diagnosis || '',
        item.medication?.brand_name || item.medication?.generic_name,
        item.dosage,
        item.frequency,
        item.duration,
        item.quantity,
        item.instructions || '',
        prescription.status,
        prescription.dispensed_at ? new Date(prescription.dispensed_at).toLocaleDateString('fr-FR') : ''
      ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');

      csvContent += row + '\n';
    });
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `prescriptions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSinglePrescriptionToExcel(prescription: PrescriptionExportData): void {
  exportToExcel([prescription]);
}
