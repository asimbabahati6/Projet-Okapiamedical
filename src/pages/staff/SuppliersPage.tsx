import { useState } from 'react';
import { Package } from 'lucide-react';
import SuppliersManagement from '../../components/logistics/SuppliersManagement';
import AddSupplierModal from '../../components/logistics/AddSupplierModal';

export default function SuppliersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fournisseurs</h1>
            <p className="text-gray-600 mt-1">
              Gérez vos partenaires et fournisseurs
            </p>
          </div>
        </div>
      </div>

      <SuppliersManagement
        key={refreshKey}
        onAddSupplier={() => setShowAddModal(true)}
      />

      <AddSupplierModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          setRefreshKey(prev => prev + 1);
        }}
      />
    </div>
  );
}
