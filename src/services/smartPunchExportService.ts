import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DailySummaryRow } from './smartPunchService';

function formatTime(isoString: string | null): string {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatMinutes(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
  return `${m}min`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'present': return 'Présent';
    case 'on_break': return 'En pause';
    case 'departed': return 'Sorti';
    case 'absent': return 'Absent';
    default: return status;
  }
}

export interface ExportFilters {
  startDate: string;
  endDate: string;
  periodLabel: string;
}

export function exportSmartPunchToCSV(rows: DailySummaryRow[], filters: ExportFilters): void {
  const headers = [
    'Employé',
    'Rôle',
    'Date',
    'Arrivée',
    'Départ',
    'Début Pause',
    'Fin Pause',
    'Durée Pause',
    'Pause Dépassée',
    'Retard (min)',
    'Heures Travaillées',
    'Statut',
    'Fermeture Auto',
    'Note',
  ];

  const csvRows = rows.map(r => [
    `"${r.full_name}"`,
    `"${r.role_name}"`,
    `"${r.punch_date}"`,
    `"${formatTime(r.check_in_time)}"`,
    `"${formatTime(r.check_out_time)}"`,
    `"${formatTime(r.break_start_time)}"`,
    `"${formatTime(r.break_end_time)}"`,
    `"${formatMinutes(r.break_duration_minutes)}"`,
    `"${r.break_exceeded ? `Oui (+${r.break_exceeded_by_minutes}min)` : 'Non'}"`,
    `"${r.late_by_minutes ?? 0}"`,
    `"${formatMinutes(r.total_minutes_worked ? Math.round(r.total_minutes_worked) : null)}"`,
    `"${getStatusLabel(r.current_status)}"`,
    `"${r.auto_closed_checkout ? 'Oui' : 'Non'}"`,
    `""`,
  ]);

  const csvContent = [headers.join(';'), ...csvRows.map(r => r.join(';'))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `smart_punch_${filters.startDate}_${filters.endDate}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSmartPunchToPDF(rows: DailySummaryRow[], filters: ExportFilters): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const totalPresent = rows.filter(r => r.current_status !== 'absent').length;
  const totalAbsent = rows.filter(r => r.current_status === 'absent').length;
  const totalLate = rows.filter(r => r.is_late).length;
  const totalBreachBreak = rows.filter(r => r.break_exceeded).length;
  const totalAutoClosed = rows.filter(r => r.auto_closed_checkout).length;
  const presenceRate = rows.length > 0 ? Math.round((totalPresent / rows.length) * 100) : 0;

  // Header band
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 297, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('OKAPIA Medical', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Système Smart Punch — Rapport de Présence', 14, 20);
  doc.text(`Période : ${filters.periodLabel}  |  Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 14, 27);

  // KPI Cards
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  const kpis = [
    { label: 'Présents', value: String(totalPresent), color: [16, 185, 129] as [number, number, number] },
    { label: 'Absents', value: String(totalAbsent), color: [239, 68, 68] as [number, number, number] },
    { label: 'Retards', value: String(totalLate), color: [245, 158, 11] as [number, number, number] },
    { label: 'Pause Dépassée', value: String(totalBreachBreak), color: [249, 115, 22] as [number, number, number] },
    { label: 'Fermeture Auto', value: String(totalAutoClosed), color: [100, 116, 139] as [number, number, number] },
    { label: 'Taux Présence', value: `${presenceRate}%`, color: [59, 130, 246] as [number, number, number] },
  ];

  kpis.forEach((kpi, i) => {
    const x = 14 + i * 47;
    const y = 34;
    doc.setFillColor(...kpi.color);
    doc.roundedRect(x, y, 43, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, x + 21.5, y + 9, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label, x + 21.5, y + 14, { align: 'center' });
  });

  // Table
  const tableBody = rows.map(r => [
    r.full_name,
    r.role_name,
    r.punch_date,
    formatTime(r.check_in_time),
    r.is_late ? `Oui (${r.late_by_minutes}min)` : 'Non',
    formatTime(r.check_out_time),
    r.auto_closed_checkout ? 'Auto' : formatTime(r.check_out_time),
    formatTime(r.break_start_time),
    formatTime(r.break_end_time),
    r.break_duration_minutes ? `${r.break_duration_minutes}min` : '—',
    r.break_exceeded ? `+${r.break_exceeded_by_minutes}min` : '—',
    formatMinutes(r.total_minutes_worked ? Math.round(r.total_minutes_worked) : null),
    getStatusLabel(r.current_status),
  ]);

  autoTable(doc, {
    startY: 54,
    head: [[
      'Employé', 'Rôle', 'Date', 'Arrivée', 'Retard', 'Départ', 'Clôture',
      'Pause Début', 'Pause Fin', 'Durée', 'Dépassement', 'H. Trav.', 'Statut',
    ]],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { fontSize: 7, halign: 'center' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'left', cellWidth: 35 },
      1: { halign: 'left', cellWidth: 28 },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const row = rows[data.row.index];
        if (row?.current_status === 'absent') {
          data.cell.styles.textColor = [239, 68, 68];
        }
        if (data.column.index === 4 && row?.is_late) {
          data.cell.styles.textColor = [245, 158, 11];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 10 && row?.break_exceeded) {
          data.cell.styles.textColor = [249, 115, 22];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `OKAPIA Medical — Rapport confidentiel — Page ${i}/${pageCount}`,
      148.5,
      205,
      { align: 'center' }
    );
  }

  doc.save(`smart_punch_rapport_${filters.startDate}_${filters.endDate}.pdf`);
}
