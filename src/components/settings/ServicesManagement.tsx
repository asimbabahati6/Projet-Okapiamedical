import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Service, ServiceCategory } from '../../types/database';
import { AddServiceModal } from './AddServiceModal';
import { EditServiceModal } from './EditServiceModal';

export function ServicesManagement() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [categoriesResult, servicesResult] = await Promise.all([
        supabase
          .from('service_categories')
          .select('*')
          .order('display_order'),
        supabase
          .from('services')
          .select('*, category:service_categories(*)')
          .order('display_order'),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (servicesResult.error) throw servicesResult.error;

      setCategories(categoriesResult.data || []);
      setServices(servicesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleServiceStatus(service: Service) {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error toggling service status:', error);
      alert('Échec de la mise à jour du service');
    }
  }

  async function toggleFeatured(service: Service) {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_featured: !service.is_featured })
        .eq('id', service.id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      alert('Échec de la mise à jour du service');
    }
  }

  const filteredServices = selectedCategory
    ? services.filter((s) => s.category_id === selectedCategory)
    : services;

  const groupedServices = categories.map((category) => ({
    category,
    services: filteredServices.filter((s) => s.category_id === category.id),
  }));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestion des Services</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gérer les services médicaux offerts par l'hôpital
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un Service
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrer par catégorie
        </label>
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-6">
        {groupedServices.map(({ category, services: categoryServices }) => {
          if (categoryServices.length === 0) return null;

          return (
            <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <span className="text-sm text-gray-600">
                    {categoryServices.length} service(s)
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  {categoryServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          {service.is_featured && (
                            <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                              En vedette
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              service.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {service.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">EN:</span> {service.name_en} |{' '}
                          <span className="font-medium">AR:</span> {service.name_ar}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFeatured(service)}
                          className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                            service.is_featured
                              ? 'text-yellow-700 hover:bg-yellow-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          title={service.is_featured ? 'Retirer de la vedette' : 'Mettre en vedette'}
                        >
                          {service.is_featured ? '★' : '☆'}
                        </button>
                        <button
                          onClick={() => setEditingService(service)}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleServiceStatus(service)}
                          className={`px-3 py-1 rounded-lg transition-colors text-sm font-medium ${
                            service.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {service.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucun service trouvé
        </div>
      )}

      <AddServiceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchData}
      />

      <EditServiceModal
        isOpen={!!editingService}
        service={editingService}
        onClose={() => setEditingService(null)}
        onSuccess={fetchData}
      />
    </div>
  );
}
