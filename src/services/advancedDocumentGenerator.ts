import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface PatientData {
  id: string;
  full_name: string;
  gender: string;
  blood_type: string;
  phone: string;
  email: string;
  date_of_birth: string;
  address?: string;
  medical_history?: any[];
  allergies?: string[];
  consultations?: any[];
}

interface InvoiceData {
  invoice_number: string;
  patient_name: string;
  patient_id: string;
  date: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue';
  payment_method?: string;
  payment_date?: string;
}

interface PurchaseOrderData {
  po_number: string;
  supplier_name: string;
  supplier_contact: string;
  date: string;
  delivery_date?: string;
  items: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes?: string;
  prepared_by: string;
  approved_by?: string;
}

export class AdvancedDocumentGenerator {
  private static readonly BRAND_COLOR = '#0066CC';
  private static readonly BRAND_NAME = 'Okapi Medical';
  private static readonly BRAND_TAGLINE = 'Excellence en Soins de Santé';
  private static readonly LOGO_URL = '/okapia-logo.png';

  private static addBrandHeader(doc: jsPDF, documentType: string) {
    doc.setFillColor(0, 102, 204);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(this.BRAND_NAME, 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(this.BRAND_TAGLINE, 105, 22, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(documentType, 105, 32, { align: 'center' });

    doc.setTextColor(0, 0, 0);
  }

  private static addWatermark(doc: jsPDF, text: string, color: string = '#CCCCCC') {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.saveGraphicsState();
    doc.setTextColor(color);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');

    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    const y = pageHeight / 2;

    doc.text(text, x, y, {
      angle: 45,
      opacity: 0.1
    });

    doc.restoreGraphicsState();
  }

  private static addFooter(doc: jsPDF, pageNumber: number = 1) {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Okapi Medical - www.okapiamedical.com', 105, pageHeight - 10, { align: 'center' });
    doc.text('Email: contact@okapiamedical.com | Tél: +243 XXX XXX XXX', 105, pageHeight - 6, { align: 'center' });
    doc.text(`Page ${pageNumber}`, 105, pageHeight - 2, { align: 'center' });

    doc.setDrawColor(0, 102, 204);
    doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);
  }

  static generatePatientFile(patient: PatientData): jsPDF {
    const doc = new jsPDF();

    this.addBrandHeader(doc, 'FICHE PATIENT');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS PERSONNELLES', 15, 50);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const personalInfo = [
      ['Nom Complet:', patient.full_name],
      ['ID Patient:', patient.id],
      ['Sexe:', patient.gender === 'male' ? 'Masculin' : 'Féminin'],
      ['Date de Naissance:', new Date(patient.date_of_birth).toLocaleDateString('fr-FR')],
      ['Groupe Sanguin:', patient.blood_type || 'Non spécifié'],
      ['Téléphone:', patient.phone],
      ['Email:', patient.email],
      ['Adresse:', patient.address || 'Non spécifiée']
    ];

    let yPosition = 58;
    personalInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 15, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 60, yPosition);
      yPosition += 7;
    });

    if (patient.allergies && patient.allergies.length > 0) {
      yPosition += 5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ALLERGIES', 15, yPosition);

      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      patient.allergies.forEach(allergy => {
        doc.setTextColor(220, 53, 69);
        doc.text(`• ${allergy}`, 20, yPosition);
        yPosition += 6;
      });
      doc.setTextColor(0, 0, 0);
    }

    if (patient.medical_history && patient.medical_history.length > 0) {
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('HISTORIQUE MÉDICAL', 15, yPosition);

      yPosition += 8;
      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Condition', 'Traitement']],
        body: patient.medical_history.map(history => [
          new Date(history.date).toLocaleDateString('fr-FR'),
          history.condition,
          history.treatment || 'N/A'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204] },
        margin: { left: 15, right: 15 }
      });
    }

    if (patient.consultations && patient.consultations.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50;

      if (finalY > 250) {
        doc.addPage();
        this.addBrandHeader(doc, 'FICHE PATIENT (Suite)');
        yPosition = 50;
      } else {
        yPosition = finalY + 10;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSULTATIONS RÉCENTES', 15, yPosition);

      yPosition += 8;
      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Médecin', 'Diagnostic', 'Notes']],
        body: patient.consultations.slice(0, 10).map(consultation => [
          new Date(consultation.date).toLocaleDateString('fr-FR'),
          consultation.doctor_name,
          consultation.diagnosis || 'N/A',
          consultation.notes ? consultation.notes.substring(0, 40) + '...' : 'N/A'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [0, 102, 204] },
        margin: { left: 15, right: 15 }
      });
    }

    this.addFooter(doc);

    return doc;
  }

  static generateInvoice(invoice: InvoiceData): jsPDF {
    const doc = new jsPDF();

    this.addBrandHeader(doc, 'FACTURE');

    if (invoice.status === 'paid') {
      this.addWatermark(doc, 'PAYÉ', '#28a745');
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`N° Facture: ${invoice.invoice_number}`, 15, 50);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, 15, 56);

    doc.text(`Patient: ${invoice.patient_name}`, 15, 68);
    doc.text(`ID Patient: ${invoice.patient_id}`, 15, 74);

    const statusColor = invoice.status === 'paid' ? [40, 167, 69] :
                        invoice.status === 'pending' ? [255, 193, 7] :
                        [220, 53, 69];

    doc.setFillColor(...statusColor);
    doc.roundedRect(140, 50, 55, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    const statusText = invoice.status === 'paid' ? 'PAYÉE' :
                       invoice.status === 'pending' ? 'EN ATTENTE' :
                       'EN RETARD';
    doc.text(statusText, 167.5, 57, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      startY: 85,
      head: [['Description', 'Qté', 'Prix Unitaire', 'Total']],
      body: invoice.items.map(item => [
        item.description,
        item.quantity.toString(),
        `${item.unit_price.toFixed(2)} $`,
        `${item.total.toFixed(2)} $`
      ]),
      foot: [
        ['', '', 'Sous-total:', `${invoice.subtotal.toFixed(2)} $`],
        ['', '', `TVA (${(invoice.tax_rate * 100).toFixed(0)}%):`, `${invoice.tax_amount.toFixed(2)} $`],
        ['', '', 'TOTAL:', `${invoice.total.toFixed(2)} $`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: 15, right: 15 }
    });

    if (invoice.status === 'paid' && invoice.payment_method) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Mode de paiement: ${invoice.payment_method}`, 15, finalY);
      if (invoice.payment_date) {
        doc.text(`Date de paiement: ${new Date(invoice.payment_date).toLocaleDateString('fr-FR')}`, 15, finalY + 6);
      }
    }

    this.addFooter(doc);

    return doc;
  }

  static generatePurchaseOrder(po: PurchaseOrderData): jsPDF {
    const doc = new jsPDF();

    this.addBrandHeader(doc, 'BON DE COMMANDE');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`N° BC: ${po.po_number}`, 15, 50);
    doc.text(`Date: ${new Date(po.date).toLocaleDateString('fr-FR')}`, 15, 57);

    doc.setFont('helvetica', 'normal');
    doc.text('FOURNISSEUR:', 15, 70);
    doc.setFont('helvetica', 'bold');
    doc.text(po.supplier_name, 15, 76);
    doc.setFont('helvetica', 'normal');
    doc.text(po.supplier_contact, 15, 82);

    if (po.delivery_date) {
      doc.text(`Date de livraison souhaitée: ${new Date(po.delivery_date).toLocaleDateString('fr-FR')}`, 130, 70);
    }

    autoTable(doc, {
      startY: 95,
      head: [['Article', 'Quantité', 'Prix Unitaire', 'Total']],
      body: po.items.map(item => [
        item.item_name,
        item.quantity.toString(),
        `${item.unit_price.toFixed(2)} $`,
        `${item.total.toFixed(2)} $`
      ]),
      foot: [
        ['', '', 'Sous-total:', `${po.subtotal.toFixed(2)} $`],
        ['', '', 'TVA:', `${po.tax_amount.toFixed(2)} $`],
        ['', '', 'TOTAL:', `${po.total.toFixed(2)} $`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: 15, right: 15 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    if (po.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES:', 15, finalY);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(po.notes, 180);
      doc.text(splitNotes, 15, finalY + 6);
    }

    const signatureY = finalY + (po.notes ? 30 : 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.line(15, signatureY + 20, 80, signatureY + 20);
    doc.text('Préparé par:', 15, signatureY + 26);
    doc.text(po.prepared_by, 15, signatureY + 32);

    if (po.approved_by) {
      doc.line(120, signatureY + 20, 185, signatureY + 20);
      doc.text('Approuvé par:', 120, signatureY + 26);
      doc.text(po.approved_by, 120, signatureY + 32);
    }

    this.addFooter(doc);

    return doc;
  }

  static exportPatientsToExcel(patients: PatientData[]): void {
    const worksheet = XLSX.utils.json_to_sheet(
      patients.map(patient => ({
        'ID': patient.id,
        'Nom Complet': patient.full_name,
        'Sexe': patient.gender === 'male' ? 'Masculin' : 'Féminin',
        'Date de Naissance': new Date(patient.date_of_birth).toLocaleDateString('fr-FR'),
        'Groupe Sanguin': patient.blood_type || 'N/A',
        'Téléphone': patient.phone,
        'Email': patient.email,
        'Adresse': patient.address || 'N/A'
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');

    const fileName = `patients_okapi_medical_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  static exportRevenueToExcel(revenueData: any[]): void {
    const worksheet = XLSX.utils.json_to_sheet(
      revenueData.map(item => ({
        'Mois': item.month,
        'Recettes ($)': item.revenue,
        'Dépenses ($)': item.expenses || 0,
        'Bénéfice ($)': (item.revenue - (item.expenses || 0)),
        'Nombre de Factures': item.invoice_count || 0,
        'Taux de Recouvrement (%)': item.collection_rate || 0
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recettes Mensuelles');

    const fileName = `recettes_okapi_medical_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}
