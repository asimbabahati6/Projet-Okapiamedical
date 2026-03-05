import { useState, useEffect } from 'react';
import { Users, Heart, Clock, Award, Shield } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { HeroSlider } from '../../components/public/HeroSlider';
import { ServiceMenuCard } from '../../components/public/ServiceMenuCard';
import { ServiceCardSkeleton } from '../../components/LoadingSkeleton';
import { supabase } from '../../lib/supabase';
import { Service, ServiceCategory } from '../../types/database';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedServices();
  }, []);

  async function fetchFeaturedServices() {
    try {
      const [categoriesResult, servicesResult] = await Promise.all([
        supabase
          .from('service_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('display_order')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (servicesResult.error) throw servicesResult.error;

      const featuredCategories = categoriesResult.data?.filter(cat => {
        return servicesResult.data?.some(s => s.category_id === cat.id && s.is_featured);
      }) || [];

      setCategories(featuredCategories);
      setServices(servicesResult.data || []);
    } catch (error) {
      console.error('Error fetching featured services:', error);
    } finally {
      setLoading(false);
    }
  }

  const features = [
    {
      icon: Users,
      title: t.home.why_choose_1,
      description: 'Médecins certifiés avec des années d’expérience',
    },
    {
      icon: Shield,
      title: t.home.why_choose_2,
      description: 'Équipements et installations médicaux de pointe',
    },
    {
      icon: Clock,
      title: t.home.why_choose_3,
      description: 'Soins d’urgence disponibles 24h/24 et 7j/7',
    },
    {
      icon: Heart,
      title: t.home.why_choose_4,
      description: 'Soins complets à des prix compétitifs',
    },
  ];


  return (
    <div className="min-h-screen bg-white">
      <HeroSlider onNavigate={onNavigate} />

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.home.mission_title}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.home.mission_text}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.home.services_title}</h2>
            <p className="text-lg text-gray-600">
              {language === 'fr' && 'Services de santé complets pour tous vos besoins'}
              {language === 'en' && 'Comprehensive healthcare services for all your needs'}
              {language === 'ar' && 'خدمات رعاية صحية شاملة لجميع احتياجاتك'}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, index) => (
                <ServiceCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {categories.map((category) => {
                  const categoryServices = services.filter(s => s.category_id === category.id);

                  return (
                    <ServiceMenuCard
                      key={category.id}
                      category={category}
                      services={categoryServices}
                      onNavigate={onNavigate}
                      showSubmenu={true}
                    />
                  );
                })}
              </div>
              <div className="text-center mt-8">
                <button
                  onClick={() => onNavigate('services')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {language === 'fr' && 'Voir tous les services'}
                  {language === 'en' && 'View all services'}
                  {language === 'ar' && 'عرض جميع الخدمات'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Award className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Excellence en soins de santé accréditée</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            OKAPIA Médical est accrédité selon les normes internationales de soins de santé et s'engage à fournir
            des services médicaux de classe mondiale.
          </p>
          <button
            onClick={() => onNavigate('about')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            {t.common.about}
          </button>
        </div>
      </section>
    </div>
  );
}
