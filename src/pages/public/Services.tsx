import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Service, ServiceCategory } from '../../types/database';
import { ServiceCard } from '../../components/public/ServiceCard';
import { useImageManager } from '../../hooks/useImageManager';

// ─── Icon map ─────────────────────────────────────────────────────────────────
const iconMap: Record<string, LucideIcon> = {
  Stethoscope: Icons.Stethoscope,
  Scan: Icons.Scan,
  UserCheck: Icons.UserCheck,
  Activity: Icons.Activity,
  Smile: Icons.Smile,
  TestTube: Icons.TestTube,
  Search: Icons.Search,
  Dumbbell: Icons.Dumbbell,
  Microscope: Icons.Microscope,
  HeartPulse: Icons.HeartPulse,
  Syringe: Icons.Syringe,
  ClipboardList: Icons.ClipboardList,
};

// ─── Static enrichment data per category name ────────────────────────────────
interface CategoryEnrichment {
  description: string;
  subServices: string[];
  defaultImage: string;
  icon: LucideIcon;
}

const CATEGORY_DATA: Record<string, CategoryEnrichment> = {
  'Consultation générale': {
    description:
      'Votre premier point de contact pour un bilan complet et un suivi de santé personnalisé.',
    subServices: ['Médecine générale', 'Bilans de santé', 'Suivi chronique', 'Médecine préventive'],
    defaultImage:
      'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Stethoscope,
  },
  'Radiologie diagnostique': {
    description:
      'Imagerie de haute précision (Échographie, Scanner) pour un diagnostic rapide et des interventions minimalement invasives.',
    subServices: ['Échographie', 'Scanner', 'IRM', 'Radiologie interventionnelle'],
    defaultImage:
      'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Scan,
  },
  Radiologie: {
    description:
      'Imagerie de haute précision (Échographie, Scanner) pour un diagnostic rapide et des interventions minimalement invasives.',
    subServices: ['Échographie', 'Scanner', 'IRM', 'Radiologie interventionnelle'],
    defaultImage:
      'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Scan,
  },
  'Radiologie interventionnelle': {
    description:
      'Interventions guidées par imagerie pour des procédures précises et minimalement invasives.',
    subServices: ['Biopsie guidée', 'Embolisation', 'Drainage', 'Traitement des varices'],
    defaultImage:
      'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Activity,
  },
  'Consultation spécialisée': {
    description:
      'Consultations avec des spécialistes expérimentés pour une prise en charge adaptée à chaque pathologie.',
    subServices: ['Cardiologie', 'Neurologie', 'Gynécologie', 'Pédiatrie'],
    defaultImage:
      'https://images.pexels.com/photos/5452268/pexels-photo-5452268.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.UserCheck,
  },
  Dentisterie: {
    description:
      'Des soins bucco-dentaires complets, de la prévention esthétique aux traitements complexes.',
    subServices: ['Soins conservateurs', 'Chirurgie dentaire', 'Orthodontie', 'Esthétique dentaire'],
    defaultImage:
      'https://images.pexels.com/photos/3845625/pexels-photo-3845625.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Smile,
  },
  'Laboratoire médical': {
    description:
      'Analyses biologiques rigoureuses pour soutenir vos diagnostics médicaux avec fiabilité.',
    subServices: ['Hématologie', 'Biochimie', 'Microbiologie', 'Sérologie'],
    defaultImage:
      'https://images.pexels.com/photos/3938023/pexels-photo-3938023.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Microscope,
  },
  Laboratoire: {
    description:
      'Analyses biologiques rigoureuses pour soutenir vos diagnostics médicaux avec fiabilité.',
    subServices: ['Hématologie', 'Biochimie', 'Microbiologie', 'Sérologie'],
    defaultImage:
      'https://images.pexels.com/photos/3938023/pexels-photo-3938023.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Microscope,
  },
  'Explorations médicales': {
    description:
      'Examens approfondis (Endoscopie, EEG) pour une évaluation précise de vos organes internes.',
    subServices: ['Endoscopie', 'EEG', 'ECG', 'Explorations fonctionnelles'],
    defaultImage:
      'https://images.pexels.com/photos/4226219/pexels-photo-4226219.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Search,
  },
  Kinésithérapie: {
    description:
      'Rééducation adaptée et soins personnalisés pour retrouver votre mobilité et soulager vos douleurs.',
    subServices: [
      'Rééducation orthopédique',
      'Kinésithérapie respiratoire',
      'Massage thérapeutique',
      'Rééducation sportive',
    ],
    defaultImage:
      'https://images.pexels.com/photos/5473184/pexels-photo-5473184.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Activity,
  },
};

const DEFAULT_ENRICHMENT: CategoryEnrichment = {
  description: 'Service médical de qualité supérieure pour votre santé.',
  subServices: [],
  defaultImage:
    'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
  icon: Icons.Stethoscope,
};

function getEnrichment(categoryName: string): CategoryEnrichment {
  return CATEGORY_DATA[categoryName] ?? DEFAULT_ENRICHMENT;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface ServicesProps {
  onNavigate?: (page: string) => void;
}

export function Services({ onNavigate }: ServicesProps = {}) {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const isAdmin =
    profile?.role?.name === 'super_admin' || profile?.role?.name === 'hospital_admin';

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, svcRes] = await Promise.all([
        supabase
          .from('service_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('services')
          .select('*, category:service_categories(*)')
          .eq('is_active', true)
          .order('display_order'),
      ]);
      setCategories(catRes.data ?? []);
      setServices(svcRes.data ?? []);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const imageManager = useImageManager(fetchData);

  const lang = language as string;

  function getCategoryName(cat: ServiceCategory): string {
    if (lang === 'en') return cat.name_en;
    if (lang === 'ar') return cat.name_ar;
    return cat.name;
  }

  function getServiceName(svc: Service): string {
    if (lang === 'en') return svc.name_en;
    if (lang === 'ar') return svc.name_ar;
    return svc.name;
  }

  const filteredServices = services.filter((svc) => {
    const name = getServiceName(svc).toLowerCase();
    const desc = (svc.description ?? '').toLowerCase();
    const matchesSearch =
      !searchTerm ||
      name.includes(searchTerm.toLowerCase()) ||
      desc.includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || svc.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedServices = categories
    .map((cat) => ({
      category: cat,
      services: filteredServices.filter((s) => s.category_id === cat.id),
    }))
    .filter((g) => g.services.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">Chargement des services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <span className="inline-block text-blue-600 text-sm font-semibold tracking-widest uppercase mb-3">
            Nos services
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Des soins d'excellence
            <br className="hidden sm:block" />
            <span className="text-blue-600"> pour chaque besoin</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            {lang === 'en'
              ? 'Discover our comprehensive range of high-quality medical services'
              : lang === 'ar'
              ? 'اكتشف مجموعتنا الشاملة من الخدمات الطبية عالية الجودة'
              : 'Découvrez notre gamme complète de services médicaux de qualité supérieure'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search + filter bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-10 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={
                lang === 'en'
                  ? 'Search for a service...'
                  : lang === 'ar'
                  ? 'ابحث عن خدمة...'
                  : 'Rechercher un service...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={selectedCategory ?? ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="sm:w-56 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          >
            <option value="">
              {lang === 'en' ? 'All categories' : lang === 'ar' ? 'كل الفئات' : 'Toutes les catégories'}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {getCategoryName(cat)}
              </option>
            ))}
          </select>
        </div>

        {/* Services grouped by category */}
        {groupedServices.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              {lang === 'en' ? 'No services found' : lang === 'ar' ? 'لم يتم العثور على خدمات' : 'Aucun service trouvé'}
            </p>
            <p className="text-gray-400 text-sm mt-1">Essayez un autre terme de recherche</p>
          </div>
        ) : (
          <div className="space-y-14">
            {groupedServices.map(({ category, services: catServices }) => {
              const enrichment = getEnrichment(category.name);
              const CategoryIcon =
                category.icon ? (iconMap[category.icon] ?? enrichment.icon) : enrichment.icon;

              return (
                <section key={category.id}>
                  {/* Category header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                      <CategoryIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900">{getCategoryName(category)}</h2>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{category.description}</p>
                      )}
                    </div>
                    <div className="hidden sm:block h-px flex-1 bg-gray-200 max-w-xs" />
                  </div>

                  {/* Service cards grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catServices.map((svc) => {
                      const svcEnrichment = getEnrichment(category.name);
                      const ServiceIcon =
                        svc.icon ? (iconMap[svc.icon] ?? svcEnrichment.icon) : svcEnrichment.icon;

                      return (
                        <ServiceCard
                          key={svc.id}
                          id={svc.id}
                          title={getServiceName(svc)}
                          icon={ServiceIcon}
                          description={svc.description ?? svcEnrichment.description}
                          subServices={svcEnrichment.subServices}
                          imageUrl={svc.image_url ?? svcEnrichment.defaultImage}
                          defaultImageUrl={svcEnrichment.defaultImage}
                          isAdmin={isAdmin}
                          isEditing={imageManager.editingId === svc.id}
                          isSaving={imageManager.saving}
                          onBook={() => onNavigate?.('appointments')}
                          onOpenEditor={isAdmin ? imageManager.openEditor : undefined}
                          onCloseEditor={imageManager.closeEditor}
                          onSaveImage={isAdmin ? imageManager.saveImage : undefined}
                          onResetImage={isAdmin ? imageManager.resetImage : undefined}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Bottom CTA banner */}
        <div className="mt-20 relative overflow-hidden bg-blue-600 rounded-3xl px-8 py-12 text-center text-white shadow-xl">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/5 rounded-full" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {lang === 'en' ? 'Need a consultation?' : lang === 'ar' ? 'هل تحتاج إلى استشارة؟' : "Besoin d'une consultation ?"}
            </h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto text-base">
              {lang === 'en'
                ? 'Our medical team is available to answer all your questions and guide you to the right specialist.'
                : lang === 'ar'
                ? 'فريقنا الطبي متاح للإجابة على جميع أسئلتك وتوجيهك إلى المختص المناسب.'
                : 'Notre équipe médicale est disponible pour répondre à toutes vos questions et vous orienter vers le bon spécialiste.'}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {onNavigate && (
                <button
                  onClick={() => onNavigate('appointments')}
                  className="bg-white text-blue-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-lg shadow-blue-800/20"
                >
                  {lang === 'en' ? 'Book Appointment' : lang === 'ar' ? 'حجز موعد' : 'Prendre rendez-vous'}
                </button>
              )}
              {onNavigate && (
                <button
                  onClick={() => onNavigate('contact')}
                  className="border-2 border-white/40 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  {lang === 'en' ? 'Contact Us' : lang === 'ar' ? 'اتصل بنا' : 'Nous contacter'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
