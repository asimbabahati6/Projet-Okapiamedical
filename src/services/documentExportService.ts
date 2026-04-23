import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import QRCode from 'qrcode';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportOptions {
  filename: string;
  title: string;
  author?: string;
  subject?: string;
  language?: string;
}

export interface PdfSection {
  heading?: string;
  rows: Array<[string, string]>;
}

export interface PdfTableSection {
  heading: string;
  columns: string[];
  rows: string[][];
}

export interface ExcelSheet {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface DocxSection {
  heading?: string;
  paragraphs: string[];
}

export interface QRCodeOptions {
  size?: number;
  color?: string;
  backgroundColor?: string;
}

// Brand colors used consistently across all PDF exports in this project
const PDF_COLORS = {
  headerBg: [37, 99, 235] as [number, number, number],
  headerText: [255, 255, 255] as [number, number, number],
  sectionBg: [239, 246, 255] as [number, number, number],
  sectionText: [30, 64, 175] as [number, number, number],
  labelText: [107, 114, 128] as [number, number, number],
  valueText: [17, 24, 39] as [number, number, number],
  tableHeader: [37, 99, 235] as [number, number, number],
  tableAlt: [249, 250, 251] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
};

// ---------------------------------------------------------------------------
// PDF Export
// ---------------------------------------------------------------------------

/**
 * Crée un document PDF avec entête OKAPIA Medical, des sections clé-valeur
 * et des tableaux optionnels.
 *
 * @example
 * exportToPDF(
 *   { filename: 'rapport.pdf', title: 'Rapport Patient', author: 'Dr. Dupont' },
 *   [{ heading: 'Informations', rows: [['Nom', 'Jean Dupont']] }],
 *   [{ heading: 'Consultations', columns: ['Date', 'Motif'], rows: [['01/01/2026', 'Fièvre']] }]
 * );
 */
export function exportToPDF(
  options: ExportOptions,
  sections: PdfSection[] = [],
  tables: PdfTableSection[] = []
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // PDF metadata
  doc.setProperties({
    title: options.title,
    author: options.author ?? 'OKAPIA Medical',
    subject: options.subject ?? '',
    creator: 'OKAPIA Medical ERP',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Header banner
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(...PDF_COLORS.headerText);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('OKAPIA Medical', margin, 12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(options.title, margin, 21);

  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  doc.setFontSize(8);
  doc.text(`Généré le ${now}`, pageWidth - margin, 21, { align: 'right' });

  y = 38;

  // Key-value sections
  for (const section of sections) {
    if (section.heading) {
      doc.setFillColor(...PDF_COLORS.sectionBg);
      doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
      doc.setTextColor(...PDF_COLORS.sectionText);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(section.heading.toUpperCase(), margin + 3, y + 5.5);
      y += 12;
    }

    for (const [label, value] of section.rows) {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.setTextColor(...PDF_COLORS.labelText);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(label, margin + 2, y);

      doc.setTextColor(...PDF_COLORS.valueText);
      doc.setFont('helvetica', 'bold');
      doc.text(value || '—', margin + 55, y);
      y += 7;
    }

    y += 4;
  }

  // Table sections
  for (const table of tables) {
    if (y > 240) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(...PDF_COLORS.sectionBg);
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
    doc.setTextColor(...PDF_COLORS.sectionText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(table.heading.toUpperCase(), margin + 3, y + 5.5);
    y += 11;

    (doc as any).autoTable({
      startY: y,
      head: [table.columns],
      body: table.rows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: PDF_COLORS.tableHeader,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: PDF_COLORS.tableAlt },
      theme: 'grid',
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer on every page
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...PDF_COLORS.border);
    doc.rect(0, 287, pageWidth, 10, 'F');
    doc.setTextColor(...PDF_COLORS.labelText);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Document confidentiel — OKAPIA Medical', margin, 293);
    doc.text(`Page ${i} / ${totalPages}`, pageWidth - margin, 293, { align: 'right' });
  }

  doc.save(`${options.filename}.pdf`);
}

// ---------------------------------------------------------------------------
// Excel Export
// ---------------------------------------------------------------------------

/**
 * Génère un fichier Excel multi-feuilles avec en-têtes stylisées.
 *
 * @example
 * exportToExcel(
 *   { filename: 'patients', title: 'Liste des patients' },
 *   [{ name: 'Patients', headers: ['Nom', 'Date'], rows: [['Dupont', '01/01/2026']] }]
 * );
 */
export function exportToExcel(options: ExportOptions, sheets: ExcelSheet[]): void {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const wsData: (string | number)[][] = [sheet.headers, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths based on max content length
    const colWidths = sheet.headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...sheet.rows.map(r => String(r[i] ?? '').length)
      );
      return { wch: Math.min(maxLen + 4, 50) };
    });
    ws['!cols'] = colWidths;

    // Freeze header row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(workbook, ws, sheet.name.substring(0, 31));
  }

  // Metadata sheet
  const metaSheet = XLSX.utils.aoa_to_sheet([
    ['Document', options.title],
    ['Auteur', options.author ?? 'OKAPIA Medical'],
    ['Généré le', new Date().toLocaleDateString('fr-FR')],
  ]);
  XLSX.utils.book_append_sheet(workbook, metaSheet, 'Infos');

  XLSX.writeFile(workbook, `${options.filename}.xlsx`);
}

// ---------------------------------------------------------------------------
// Word (DOCX) Export
// ---------------------------------------------------------------------------

/**
 * Génère un document Word (.docx) avec sections structurées.
 *
 * @example
 * await exportToWord(
 *   { filename: 'compte-rendu', title: 'Compte-rendu de consultation' },
 *   [{ heading: 'Diagnostic', paragraphs: ['Le patient présente...'] }]
 * );
 */
export async function exportToWord(options: ExportOptions, sections: DocxSection[]): Promise<void> {
  const children: Paragraph[] = [];

  // Document title
  children.push(
    new Paragraph({
      text: options.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Généré le ${new Date().toLocaleDateString('fr-FR')} — OKAPIA Medical`,
          color: '6B7280',
          size: 18,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );

  for (const section of sections) {
    if (section.heading) {
      children.push(
        new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '2563EB', space: 4 },
          },
        })
      );
    }

    for (const text of section.paragraphs) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text, size: 22 })],
          spacing: { after: 120 },
        })
      );
    }
  }

  const doc = new Document({
    creator: 'OKAPIA Medical ERP',
    title: options.title,
    subject: options.subject ?? '',
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${options.filename}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// QR Code Generation
// ---------------------------------------------------------------------------

/**
 * Génère un QR code sous forme de data URL (base64 PNG).
 * Compatible avec les balises <img> et l'insertion dans jsPDF.
 *
 * @example
 * const dataUrl = await generateQRCode('https://okapia.medical/patient/123');
 * // <img src={dataUrl} />
 * // doc.addImage(dataUrl, 'PNG', x, y, width, height);
 */
export async function generateQRCode(
  content: string,
  options: QRCodeOptions = {}
): Promise<string> {
  return QRCode.toDataURL(content, {
    width: options.size ?? 200,
    color: {
      dark: options.color ?? '#1E3A5F',
      light: options.backgroundColor ?? '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
    margin: 2,
  });
}

/**
 * Insère un QR code dans un document jsPDF existant.
 *
 * @example
 * const doc = new jsPDF();
 * await addQRCodeToPDF(doc, 'https://okapia.medical', 160, 260, 25);
 */
export async function addQRCodeToPDF(
  doc: jsPDF,
  content: string,
  x: number,
  y: number,
  size = 25
): Promise<void> {
  const dataUrl = await generateQRCode(content, { size: size * 10 });
  doc.addImage(dataUrl, 'PNG', x, y, size, size);
}
