import { useState, useEffect } from 'react';
import { Search, Calendar, Video, MapPin, Award, Star, User } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { Service, ServiceCategory, MedicalStaff, UserProfile } from '../../types/database';
import { formatDoctorName } from '../../utils/formatDoctorName';
import * as Icons from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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

interface ServicesProps {
  onNavigate?: (page: string) => void;
}

type DoctorWithProfile = MedicalStaff & { user_profile?: UserProfile };

export function Services({ onNavigate }: ServicesProps = {}) {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [doctorsByDepartment, setDoctorsByDepartment] = useState<Record<string, DoctorWithProfile[]>>({});
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  useEffect(() => {
    fetchServicesData();
  }, []);

  async function fetchServicesData() {
    try {
      const [categoriesResult, servicesResult] = await Promise.all([
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

      if (categoriesResult.error) throw categoriesResult.error;
      if (servicesResult.error) throw servicesResult.error;

      setCategories(categoriesResult.data || []);
      setServices(servicesResult.data || []);

      if (servicesResult.data) {
        await fetchDoctorsForServices(servicesResult.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDoctorsForServices(services: Service[]) {
    try {
      setLoadingDoctors(true);
      const departmentIds = [...new Set(services.map(s => s.department_id).filter(Boolean))] as string[];

      if (departmentIds.length === 0) return;

      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, department_id, avatar_url')
        .in('department_id', departmentIds);

      if (profilesError) throw profilesError;

      const userIds = userProfiles?.map(p => p.id) || [];

      if (userIds.length === 0) {
        setDoctorsByDepartment({});
        return;
      }

      const { data: doctors, error } = await supabase
        .from('medical_staff')
        .select('*')
        .eq('is_accepting_patients', true)
        .in('id', userIds);

      if (error) throw error;

      const groupedDoctors: Record<string, DoctorWithProfile[]> = {};

      doctors?.forEach((doctor) => {
        const userProfile = userProfiles?.find(p => p.id === doctor.id);
        if (userProfile) {
          const deptId = userProfile.department_id;
          if (deptId) {
            if (!groupedDoctors[deptId]) {
              groupedDoctors[deptId] = [];
            }
            groupedDoctors[deptId].push({ ...doctor, user_profile: userProfile });
          }
        }
      });

      setDoctorsByDepartment(groupedDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  }

  function getServiceName(service: Service): string {
    if (language === 'en') return service.name_en;
    if (language === 'ar') return service.name_ar;
    return service.name;
  }

  function getCategoryName(category: ServiceCategory): string {
    if (language === 'en') return category.name_en;
    if (language === 'ar') return category.name_ar;
    return category.name;
  }

  function getServiceDescription(service: Service): string {
    if (language === 'en' && service.description_en) return service.description_en;
    if (language === 'ar' && service.description_ar) return service.description_ar;
    return service.description || '';
  }

  function getDoctorsForService(service: Service): DoctorWithProfile[] {
    if (!service.department_id) return [];
    return doctorsByDepartment[service.department_id] || [];
  }

  function handleBookWithDoctor(doctorId: string, serviceId: string) {
    if (onNavigate) {
      window.location.hash = `appointments?doctor=${doctorId}&service=${serviceId}`;
      onNavigate('appointments');
    }
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      getServiceName(service).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !selectedCategory || service.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const groupedServices = categories.map((category) => ({
    category,
    services: filteredServices.filter((s) => s.category_id === category.id),
  })).filter((group) => group.services.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.home.services_title}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {language === 'fr' && 'Découvrez notre gamme complète de services médicaux de qualité supérieure'}
            {language === 'en' && 'Discover our comprehensive range of high-quality medical services'}
            {language === 'ar' && 'اكتشف مجموعتنا الشاملة من الخدمات الطبية عالية الجودة'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={
                  language === 'fr' ? 'Rechercher un service...' :
                  language === 'en' ? 'Search for a service...' :
                  'ابحث عن خدمة...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:w-64">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">
                  {language === 'fr' && 'Toutes les catégories'}
                  {language === 'en' && 'All categories'}
                  {language === 'ar' && 'كل الفئات'}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {groupedServices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {language === 'fr' && 'Aucun service trouvé'}
              {language === 'en' && 'No services found'}
              {language === 'ar' && 'لم يتم العثور على خدمات'}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {groupedServices.map(({ category, services: categoryServices }) => {
              const IconComponent = category.icon ? iconMap[category.icon] : Icons.Stethoscope;

              return (
                <div key={category.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 relative overflow-hidden">
                    {category.image_url && (
                      <div
                        className="absolute inset-0 opacity-20 bg-cover bg-center"
                        style={{ backgroundImage: `url(${category.image_url})` }}
                      />
                    )}
                    <div className="relative z-10">
                      <div className="flex items-center gap-3">
                        {IconComponent && <IconComponent className="w-6 h-6 text-white" />}
                        <h2 className="text-2xl font-bold text-white">
                          {getCategoryName(category)}
                        </h2>
                      </div>
                      {category.description && (
                        <p className="text-blue-100 mt-2">{category.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryServices.map((service) => {
                        const ServiceIcon = service.icon ? iconMap[service.icon] : null;
                        const isExpanded = expandedService === service.id;
                        const description = getServiceDescription(service);

                        return (
                          <div
                            key={service.id}
                            className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
                          >
                            <div
                              className="cursor-pointer"
                              onClick={() => setExpandedService(isExpanded ? null : service.id)}
                            >
                              {service.image_url && (
                                <div className="relative h-32 overflow-hidden">
                                  <img
                                    src={service.image_url}
                                    alt={getServiceName(service)}
                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </div>
                              )}
                              <div className="p-4">
                                <div className="flex items-start gap-3">
                                  {ServiceIcon && (
                                    <div className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                                      isExpanded ? 'bg-blue-600' : 'bg-blue-100'
                                    }`}>
                                      <ServiceIcon className={`w-5 h-5 transition-colors ${
                                        isExpanded ? 'text-white' : 'text-blue-600'
                                      }`} />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <h3 className={`font-semibold mb-1 transition-colors ${
                                        isExpanded ? 'text-blue-600' : 'text-gray-900'
                                      }`}>
                                        {getServiceName(service)}
                                      </h3>
                                      <Icons.ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50 animate-fade-in">
                                {description && (
                                  <div className="pt-4 pb-3 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                    {description}
                                  </div>
                                )}

                                <div className="mt-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      {language === 'fr' && 'Médecins disponibles'}
                                      {language === 'en' && 'Available Doctors'}
                                      {language === 'ar' && 'الأطباء المتاحون'}
                                    </h4>
                                    {(() => {
                                      const availableDoctors = getDoctorsForService(service);
                                      return availableDoctors.length > 0 && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                          {availableDoctors.length} {language === 'fr' ? 'disponible(s)' : language === 'en' ? 'available' : 'متاح'}
                                        </span>
                                      );
                                    })()}
                                  </div>

                                  {loadingDoctors ? (
                                    <div className="text-center py-4">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                      <p className="text-sm text-gray-600 mt-2">
                                        {language === 'fr' ? 'Chargement des médecins...' : language === 'en' ? 'Loading doctors...' : 'تحميل الأطباء...'}
                                      </p>
                                    </div>
                                  ) : (() => {
                                    const availableDoctors = getDoctorsForService(service);

                                    if (availableDoctors.length === 0) {
                                      return (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                                          <p className="text-sm text-yellow-800">
                                            {language === 'fr' && 'Aucun médecin disponible pour ce service.'}
                                            {language === 'en' && 'No doctors available for this service.'}
                                            {language === 'ar' && 'لا يوجد أطباء متاحون لهذه الخدمة.'}
                                          </p>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {availableDoctors.map((doctor) => (
                                          <div
                                            key={doctor.id}
                                            className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all"
                                          >
                                            <div className="flex items-start gap-3">
                                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                {doctor.user_profile?.full_name?.charAt(0) || 'D'}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                  <div>
                                                    <h5 className="font-semibold text-gray-900 text-sm">
                                                      {formatDoctorName(doctor.user_profile?.full_name || 'Unknown')}
                                                    </h5>
                                                    <p className="text-xs text-gray-600">{doctor.specialization}</p>
                                                  </div>
                                                  <div className="flex gap-1">
                                                    {doctor.telemedicine_enabled && (
                                                      <div className="bg-green-100 p-1 rounded" title="Telemedicine available">
                                                        <Video className="w-3 h-3 text-green-600" />
                                                      </div>
                                                    )}
                                                    <div className="bg-blue-100 p-1 rounded" title="In-person available">
                                                      <MapPin className="w-3 h-3 text-blue-600" />
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                  {doctor.years_of_experience > 0 && (
                                                    <span className="flex items-center">
                                                      <Award className="w-3 h-3 mr-1" />
                                                      {doctor.years_of_experience} ans
                                                    </span>
                                                  )}
                                                  {doctor.average_rating && (
                                                    <span className="flex items-center">
                                                      <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                                      {doctor.average_rating}
                                                    </span>
                                                  )}
                                                </div>
                                                {onNavigate && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleBookWithDoctor(doctor.id, service.id);
                                                    }}
                                                    className="mt-2 w-full bg-blue-600 text-white py-1.5 px-3 rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                                                  >
                                                    <Calendar className="w-3 h-3" />
                                                    {language === 'fr' && 'Réserver'}
                                                    {language === 'en' && 'Book'}
                                                    {language === 'ar' && 'احجز'}
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {onNavigate && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onNavigate('appointments');
                                    }}
                                    className="w-full mt-4 bg-gray-600 text-white py-2.5 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                                  >
                                    <Calendar className="w-4 h-4" />
                                    {language === 'fr' && 'Voir tous les rendez-vous'}
                                    {language === 'en' && 'View All Appointments'}
                                    {language === 'ar' && 'عرض جميع المواعيد'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 bg-blue-600 rounded-xl shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            {language === 'fr' && 'Besoin de plus d\'informations ?'}
            {language === 'en' && 'Need more information?'}
            {language === 'ar' && 'هل تحتاج إلى مزيد من المعلومات؟'}
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            {language === 'fr' && 'Notre équipe est disponible pour répondre à toutes vos questions sur nos services médicaux'}
            {language === 'en' && 'Our team is available to answer all your questions about our medical services'}
            {language === 'ar' && 'فريقنا متاح للإجابة على جميع أسئلتك حول خدماتنا الطبية'}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {onNavigate && (
              <button
                onClick={() => onNavigate('appointments')}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                {language === 'fr' && 'Prendre rendez-vous'}
                {language === 'en' && 'Book Appointment'}
                {language === 'ar' && 'حجز موعد'}
              </button>
            )}
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              {t.contact.title}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
