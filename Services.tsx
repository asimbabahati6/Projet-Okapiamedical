import { useState, useEffect } from 'react';
import { Search, Clock, Users, Monitor } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { Service, ServiceCategory } from '../../types/database';

interface ServicesProps {
  onNavigate: (page: string, param?: string) => void;
}

export function Services({ onNavigate }: ServicesProps) {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      const [catResult, svcResult] = await Promise.all([
        supabase.from('service_categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('services').select('*').eq('is_active', true).order('display_order'),
      ]);

      if (catResult.data) setCategories(catResult.data);
      if (svcResult.data) setServices(svcResult.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }

  function getLocalizedText(item: Record<string, unknown>, field: string): string {
    if (!item) return '';
    if (language === 'en' && item[`${field}_en`]) return item[`${field}_en`] as string;
    if (language === 'ar' && item[`${field}_ar`]) return item[`${field}_ar`] as string;
    return (item[field] as string) || '';
  }

  const filteredServices = services.filter((svc) => {
    const name = getLocalizedText(svc as unknown as Record<string, unknown>, 'name').toLowerCase();
    const desc = getLocalizedText(svc as unknown as Record<string, unknown>, 'description').toLowerCase();
    const matchesSearch = searchQuery === '' || name.includes(searchQuery.toLowerCase()) || desc.includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || svc.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand">
      <div className="relative bg-ink text-white py-16 lg:py-20 overflow-hidden">
        <div className="okapi-stripes absolute top-0 right-0 h-full w-24 text-white opacity-[0.05] pointer-events-none" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <p className="eyebrow eyebrow--light mb-4">Nos services</p>
          <h1 className="font-display font-semibold" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.08, letterSpacing: '-0.02em' }}>Des soins complets, en un seul lieu</h1>
          <p className="text-lg text-white/75 max-w-2xl mt-4">
            Découvrez l'ensemble de nos services médicaux et spécialités
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-muted/70 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-ink-muted hover:text-ink hover:bg-sand border border-line'
              }`}
            >
              Toutes
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-ink-muted hover:text-ink hover:bg-sand border border-line'
                }`}
              >
                {getLocalizedText(cat as unknown as Record<string, unknown>, 'name')}
              </button>
            ))}
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-ink-muted text-lg">Aucun service trouve</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="card card-hover overflow-hidden group"
              >
                {service.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={service.image_url}
                      alt={getLocalizedText(service as unknown as Record<string, unknown>, 'name')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="font-display text-lg font-semibold text-ink mb-2">
                    {getLocalizedText(service as unknown as Record<string, unknown>, 'name')}
                  </h3>
                  <p className="text-ink-muted text-sm mb-4 line-clamp-3">
                    {getLocalizedText(service as unknown as Record<string, unknown>, 'description')}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-ink-muted">
                    {service.estimated_duration_minutes > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {service.estimated_duration_minutes} min
                      </div>
                    )}
                    {service.telemedicine_available && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Monitor className="w-3.5 h-3.5" />
                        Teleconsultation
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onNavigate('appointments')}
                    className="mt-4 w-full py-2.5 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-50 transition-colors font-medium text-sm"
                  >
                    Prendre rendez-vous
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
