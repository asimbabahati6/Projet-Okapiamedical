import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Printer, Download, MessageCircle, Mail } from 'lucide-react';
import { Invoice, InvoiceItem } from '../../types/database';
import { downloadInvoicePDF, printInvoice } from '../../utils/printInvoice';
import { getWhatsAppLink, getEmailLink } from '../../utils/invoiceCommunication';
import { supabase } from '../../lib/supabase';

interface InvoiceActionsMenuProps {
  invoice: Invoice;
  onView: () => void;
}

export function InvoiceActionsMenu({ invoice, onView }: InvoiceActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isDraft = invoice.status === 'draft';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchItems(): Promise<InvoiceItem[]> {
    const { data } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id);
    return data ?? [];
  }

  async function handlePrint() {
    setOpen(false);
    setLoadingPdf(true);
    try {
      const items = await fetchItems();
      await printInvoice(invoice, items, invoice.patient as any);
    } finally {
      setLoadingPdf(false);
    }
  }

  async function handleDownload() {
    setOpen(false);
    setLoadingPdf(true);
    try {
      const items = await fetchItems();
      await downloadInvoicePDF(invoice, items, invoice.patient as any);
    } finally {
      setLoadingPdf(false);
    }
  }

  function handleWhatsApp() {
    setOpen(false);
    const link = getWhatsAppLink(invoice, invoice.patient as any);
    if (link) window.open(link, '_blank');
  }

  function handleEmail() {
    setOpen(false);
    const link = getEmailLink(invoice, invoice.patient as any);
    if (link) window.location.href = link;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loadingPdf}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 disabled:opacity-50"
        title="Actions"
      >
        {loadingPdf ? (
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <MoreVertical className="w-4 h-4" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); onView(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4 text-blue-600 flex-shrink-0" />
              Visualiser
            </button>

            <button
              onClick={handlePrint}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4 text-gray-600 flex-shrink-0" />
              Imprimer
            </button>

            <button
              onClick={handleDownload}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 text-gray-600 flex-shrink-0" />
              Télécharger PDF
            </button>

            <div className="border-t border-gray-100 my-1" />

            <div className="relative group">
              <button
                onClick={handleWhatsApp}
                disabled={isDraft}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                Envoyer par WhatsApp
              </button>
              {isDraft && (
                <div className="absolute left-0 bottom-full mb-1 w-52 bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Passez la facture en "En attente" avant d'envoyer
                </div>
              )}
            </div>

            <div className="relative group">
              <button
                onClick={handleEmail}
                disabled={isDraft}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                Envoyer par Email
              </button>
              {isDraft && (
                <div className="absolute left-0 bottom-full mb-1 w-52 bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Passez la facture en "En attente" avant d'envoyer
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
