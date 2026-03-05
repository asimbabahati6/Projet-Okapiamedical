import { useState } from 'react';
import { Package, TrendingUp, AlertTriangle, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import StocksDashboard from '../../components/logistics/StocksDashboard';
import InventoryList from '../../components/logistics/InventoryList';
import AddInventoryItemModal from '../../components/logistics/AddInventoryItemModal';
import EditInventoryItemModal from '../../components/logistics/EditInventoryItemModal';
import InventoryItemDetailsModal from '../../components/logistics/InventoryItemDetailsModal';
import StockMovementsList from '../../components/logistics/StockMovementsList';
import StockMovementModal from '../../components/logistics/StockMovementModal';
import StockAlertsPanel from '../../components/logistics/StockAlertsPanel';
import SuppliersManagement from '../../components/logistics/SuppliersManagement';
import AddSupplierModal from '../../components/logistics/AddSupplierModal';
import { InventoryItem } from '../../types/logistics';
import { useLogisticsAlerts } from '../../hooks/useLogisticsAlerts';

export function LogisticsPage() {
  const { isRole } = useAuth();
  const { activeAlertsCount } = useLogisticsAlerts();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'movements' | 'alerts' | 'suppliers'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const canAccessLogistics = isRole(['logistician', 'super_admin']);

  if (!canAccessLogistics) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Accès refusé</h3>
              <p className="text-red-700 mt-1">
                Vous n'avez pas les permissions nécessaires pour accéder à la gestion logistique.
                Seuls les logisticiens et les super administrateurs peuvent accéder à cette section.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', name: 'Vue d\'ensemble', icon: BarChart3, badge: null },
    { id: 'inventory', name: 'Inventaire', icon: Package, badge: null },
    { id: 'movements', name: 'Mouvements', icon: TrendingUp, badge: null },
    { id: 'alerts', name: 'Alertes', icon: AlertTriangle, badge: activeAlertsCount },
    { id: 'suppliers', name: 'Fournisseurs', icon: Users, badge: null },
  ];

  function handleAddItem() {
    setShowAddModal(true);
  }

  function handleEditItem(item: InventoryItem) {
    setSelectedItem(item);
    setShowEditModal(true);
  }

  function handleViewDetails(item: InventoryItem) {
    setSelectedItem(item);
    setShowDetailsModal(true);
  }

  function handleAddMovement() {
    setShowMovementModal(true);
  }

  function handleSuccess() {
    setRefreshKey(prev => prev + 1);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion Logistique</h1>
        <p className="text-gray-600">
          Gestion complète des stocks, inventaire, mouvements et fournisseurs
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors relative
                  ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
                {tab.badge !== null && tab.badge > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'dashboard' && (
          <StocksDashboard
            onNavigate={(tab) => setActiveTab(tab)}
            onAddItem={handleAddItem}
            onAddMovement={handleAddMovement}
            onAddSupplier={() => setShowAddSupplierModal(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryList
            key={refreshKey}
            onAddItem={handleAddItem}
            onEditItem={handleEditItem}
            onViewDetails={handleViewDetails}
          />
        )}

        {activeTab === 'movements' && (
          <StockMovementsList key={refreshKey} onAddMovement={handleAddMovement} />
        )}

        {activeTab === 'alerts' && (
          <StockAlertsPanel
            key={refreshKey}
            onViewItem={(itemId) => {
              const item = { id: itemId } as InventoryItem;
              setSelectedItem(item);
              setShowDetailsModal(true);
            }}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersManagement
            onAddSupplier={() => setShowAddSupplierModal(true)}
          />
        )}
      </div>

      {/* Modals */}
      <AddInventoryItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />

      <EditInventoryItemModal
        isOpen={showEditModal}
        item={selectedItem}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        onSuccess={handleSuccess}
      />

      <InventoryItemDetailsModal
        isOpen={showDetailsModal}
        item={selectedItem}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedItem(null);
        }}
      />

      <StockMovementModal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        onSuccess={handleSuccess}
      />

      <AddSupplierModal
        isOpen={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default LogisticsPage;
