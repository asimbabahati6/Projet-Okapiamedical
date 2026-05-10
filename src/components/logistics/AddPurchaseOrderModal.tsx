import { useState } from 'react';
import { X, FileCheck } from 'lucide-react';

interface AddPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPurchaseOrderModal({ isOpen, onClose, onSuccess }: AddPurchaseOrderModalProps) {
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierName.trim()) return;

    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      onSuccess();
      onClose();
      setSupplierName('');
      setNotes('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            Nouvelle commande
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving || !supplierName.trim()} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Creation...' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
