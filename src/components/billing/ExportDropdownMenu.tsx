import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Invoice } from '../../types/database';
import { exportInvoicesToDetailedCSV } from '../../utils/billingExport';

interface ExportDropdownMenuProps {
  invoices: Invoice[];
  periodLabel: string;
}

export function ExportDropdownMenu({ invoices, periodLabel }: ExportDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportBasicCSV = () => {
    const headers = ['Numéro Facture', 'Patient', 'Date', 'Montant Total', 'Montant Payé', 'Solde', 'Méthode', 'Statut'];
    const rows = invoices.map(inv => [
      inv.invoice_number,
      inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : '',
      new Date(inv.created_at).toLocaleDateString('fr-FR'),
      inv.total_amount,
      inv.paid_amount,
      inv.balance,
      inv.payment_method || 'N/A',
      getStatusLabel(inv.status)
    ]);

    const BOM = '\uFEFF';
    const csv = BOM + [headers, ...rows].map(row => row.join(',')).join('\n');
    downloadFile(csv, `factures-${periodLabel}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    setIsOpen(false);
  };

  const handleExportDetailedCSV = () => {
    exportInvoicesToDetailedCSV(invoices);
    setIsOpen(false);
  };

  const handleExportExcel = () => {
    alert('Export Excel sera disponible prochainement');
    setIsOpen(false);
  };

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      partial: 'Partiel',
      paid: 'Payé',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  }

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
      >
        <Download className="w-4 h-4" />
        Exporter
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={handleExportBasicCSV}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <FileText className="w-4 h-4 text-gray-500" />
            <span>CSV Basique</span>
          </button>

          <button
            onClick={handleExportDetailedCSV}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <span>CSV Détaillé</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-500" />
            <span>Excel (.xlsx)</span>
          </button>

          <div className="border-t border-gray-200 my-1"></div>

          <div className="px-4 py-2 text-xs text-gray-500">
            {invoices.length} facture{invoices.length > 1 ? 's' : ''} à exporter
          </div>
        </div>
      )}
    </div>
  );
}
