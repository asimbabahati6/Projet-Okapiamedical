import { useState, useEffect } from 'react';
import { FileCheck, Download, Plus, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { AdvancedDocumentGenerator } from '../../services/advancedDocumentGenerator';
import AddPurchaseOrderModal from '../../components/logistics/AddPurchaseOrderModal';

interface PurchaseOrder {
  po_number: string;
  supplier_name: string;
  supplier_contact: string;
  date: string;
  delivery_date?: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
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

export default function PurchaseOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const { data: posData, error: posError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(name, contact_person, phone, email),
          created_by_user:user_profiles!purchase_orders_created_by_fkey(
            id,
            employees(first_name, last_name, position)
          ),
          approved_by_user:user_profiles!purchase_orders_approved_by_fkey(
            id,
            employees(first_name, last_name, position)
          )
        `)
        .order('created_at', { ascending: false });

      if (posError) throw posError;

      const ordersWithItems = await Promise.all(
        (posData || []).map(async (po) => {
          const { data: items, error: itemsError } = await supabase
            .from('purchase_order_items')
            .select('*')
            .eq('purchase_order_id', po.id);

          if (itemsError) throw itemsError;

          const mappedItems = (items || []).map((item: any) => ({
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total_price || (item.quantity * item.unit_price)
          }));

          const createdByName = po.created_by_user?.employees
            ? `${po.created_by_user.employees.first_name} ${po.created_by_user.employees.last_name}`
            : 'N/A';

          const approvedByName = po.approved_by_user?.employees
            ? `${po.approved_by_user.employees.first_name} ${po.approved_by_user.employees.last_name}`
            : undefined;

          return {
            po_number: po.po_number,
            supplier_name: po.supplier?.name || 'N/A',
            supplier_contact: `${po.supplier?.email || ''} | ${po.supplier?.phone || ''}`,
            date: po.order_date,
            delivery_date: po.expected_delivery_date,
            status: po.status as PurchaseOrder['status'],
            items: mappedItems,
            subtotal: po.total_amount || 0,
            tax_amount: 0,
            total: po.total_amount || 0,
            notes: po.notes,
            prepared_by: createdByName,
            approved_by: approvedByName
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      showToast('Erreur lors du chargement des bons de commande', 'error');
    } finally {
      setLoading(false);
    }
  };

  const demoOrders: PurchaseOrder[] = orders.length > 0 ? orders : [
    {
      po_number: 'BC-2024-001',
      supplier_name: 'MediSupply RDC',
      supplier_contact: 'contact@medisupply.cd | +243 XXX XXX XXX',
      date: '2024-02-10',
      delivery_date: '2024-02-20',
      status: 'sent',
      items: [
        { item_name: 'Gants médicaux (boîte de 100)', quantity: 50, unit_price: 12.50, total: 625.00 },
        { item_name: 'Masques chirurgicaux (boîte de 50)', quantity: 100, unit_price: 8.00, total: 800.00 },
        { item_name: 'Seringues stériles 5ml (pack de 100)', quantity: 30, unit_price: 15.00, total: 450.00 },
        { item_name: 'Compresses stériles (pack de 100)', quantity: 40, unit_price: 10.00, total: 400.00 }
      ],
      subtotal: 2275.00,
      tax_amount: 227.50,
      total: 2502.50,
      notes: 'Livraison urgente. Paiement à 30 jours.',
      prepared_by: 'Jean Mukendi - Logisticien',
      approved_by: 'Dr. Kapinga - Directeur'
    },
    {
      po_number: 'BC-2024-002',
      supplier_name: 'Pharma Congo',
      supplier_contact: 'info@pharmacongo.cd | +243 YYY YYY YYY',
      date: '2024-02-12',
      delivery_date: '2024-02-25',
      status: 'draft',
      items: [
        { item_name: 'Paracétamol 500mg (boîte de 1000)', quantity: 20, unit_price: 25.00, total: 500.00 },
        { item_name: 'Amoxicilline 500mg (boîte de 100)', quantity: 15, unit_price: 35.00, total: 525.00 },
        { item_name: 'Ibuprofène 400mg (boîte de 500)', quantity: 10, unit_price: 30.00, total: 300.00 }
      ],
      subtotal: 1325.00,
      tax_amount: 132.50,
      total: 1457.50,
      prepared_by: 'Marie Tshiala - Pharmacienne'
    },
    {
      po_number: 'BC-2024-003',
      supplier_name: 'LabEquip International',
      supplier_contact: 'sales@labequip.com | +243 ZZZ ZZZ ZZZ',
      date: '2024-02-08',
      status: 'received',
      items: [
        { item_name: 'Tubes à essai (pack de 500)', quantity: 10, unit_price: 45.00, total: 450.00 },
        { item_name: 'Lames microscope (boîte de 100)', quantity: 20, unit_price: 18.00, total: 360.00 },
        { item_name: 'Réactifs analyse sanguine (kit)', quantity: 5, unit_price: 120.00, total: 600.00 }
      ],
      subtotal: 1410.00,
      tax_amount: 141.00,
      total: 1551.00,
      notes: 'Matériel reçu en bon état. Conforme à la commande.',
      prepared_by: 'Joseph Kabila - Responsable Labo',
      approved_by: 'Dr. Ngandu - Chef de Service'
    }
  ];

  const filteredOrders = demoOrders.filter(order => {
    const matchesSearch = order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDownloadPO = (order: PurchaseOrder) => {
    const doc = AdvancedDocumentGenerator.generatePurchaseOrder(order);
    doc.save(`${order.po_number}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
      sent: 'bg-blue-100 text-blue-800 border-blue-300',
      received: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };

    const labels = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      received: 'Reçu',
      cancelled: 'Annulé'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileCheck className="w-8 h-8 text-blue-600" />
            Bons de Commande
          </h1>
          <p className="text-gray-600 mt-1">Gestion des commandes fournisseurs</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau BC
        </button>
      </div>

      <AddPurchaseOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadPurchaseOrders}
      />

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total BCs</p>
            <p className="text-2xl font-bold text-gray-900">{demoOrders.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">En Attente</p>
            <p className="text-2xl font-bold text-blue-600">{demoOrders.filter(o => o.status === 'sent').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Reçus</p>
            <p className="text-2xl font-bold text-green-600">{demoOrders.filter(o => o.status === 'received').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Valeur Totale</p>
            <p className="text-2xl font-bold text-gray-900">
              ${demoOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par N° BC ou fournisseur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyé</option>
              <option value="received">Reçu</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">N° BC</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fournisseur</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Livraison</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.po_number} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{order.po_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.supplier_name}</p>
                      <p className="text-xs text-gray-500">{order.items.length} article{order.items.length > 1 ? 's' : ''}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(order.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-gray-900">${order.total.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDownloadPO(order)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Aucun bon de commande trouvé</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
