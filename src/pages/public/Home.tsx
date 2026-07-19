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

      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <p className="eyebrow mb-4">Notre mission</p>
            <h2 className="display-lg mb-5">{t.home.mission_title}</h2>
            <p className="text-lg text-ink-muted leading-relaxed">
              {t.home.mission_text}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card card-hover p-6">
                <div className="bg-brand-50 w-11 h-11 rounded-xl flex items-center justify-center mb-5">
                  <feature.icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-display font-semibold text-ink mb-2">{feature.title}</h3>
                <p className="text-ink-muted text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <p className="eyebrow mb-4">Nos services</p>
            <h2 className="display-lg mb-5">{t.home.services_title}</h2>
            <p className="text-lg text-ink-muted">
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
              <div className="mt-10">
                <button
                  onClick={() => onNavigate('services')}
                  className="btn-secondary !px-7"
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

      <section className="relative py-20 lg:py-24 bg-ink text-white overflow-hidden">
        <div className="okapi-stripes absolute top-0 right-0 h-full w-24 text-white opacity-[0.05] pointer-events-none" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <p className="eyebrow eyebrow--light mb-4 inline-flex items-center gap-2">
              <Award className="w-4 h-4" />
              Accréditation internationale
            </p>
            <h2 className="font-display font-semibold text-white mb-5" style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)', lineHeight: 1.1, letterSpacing: '-0.015em' }}>
              Excellence en soins de santé accréditée
            </h2>
            <p className="text-lg text-white/70 leading-relaxed mb-9">
              OKAPIA Médical est accrédité selon les normes internationales de soins de santé et s'engage à fournir
              des services médicaux de classe mondiale.
            </p>
            <button onClick={() => onNavigate('about')} className="btn-on-dark !px-7">
              {t.common.about}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
