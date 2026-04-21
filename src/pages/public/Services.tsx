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

// Pexels images: free, no download, linked directly per Pexels license
const CATEGORY_DATA: Record<string, CategoryEnrichment> = {
  'Consultation générale': {
    description:
      'Premier point de contact médical pour évaluer votre état de santé global, établir un diagnostic initial et coordonner votre parcours de soins. Nos médecins généralistes assurent un suivi personnalisé et la prévention des maladies chroniques.',
    subServices: ['Médecine générale', 'Bilans de santé', 'Suivi chronique', 'Médecine préventive'],
    defaultImage: 'https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Stethoscope,
  },
  'Radiologie diagnostique': {
    description:
      'Imagerie médicale de haute résolution pour visualiser les structures internes avec précision. Nos équipements de dernière génération (Échographie, Scanner, Radiographie) permettent un diagnostic rapide, fiable et non invasif.',
    subServices: ['Échographie', 'Scanner (TDM)', 'Radiographie', 'Mammographie'],
    defaultImage: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Scan,
  },
  Radiologie: {
    description:
      'Imagerie médicale de haute résolution pour visualiser les structures internes avec précision. Nos équipements de dernière génération permettent un diagnostic rapide, fiable et non invasif.',
    subServices: ['Échographie', 'Scanner (TDM)', 'Radiographie', 'Mammographie'],
    defaultImage: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Scan,
  },
  'Radiologie interventionnelle': {
    description:
      'Procédures mini-invasives guidées par imagerie en temps réel pour traiter des pathologies vasculaires, tumorales et kystiques sans chirurgie ouverte. Une alternative efficace qui réduit la douleur et accélère la récupération.',
    subServices: ['Biopsie guidée', 'Embolisation', 'Drainage percutané', 'Traitement des varices'],
    defaultImage: 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Activity,
  },
  'Consultation spécialisée': {
    description:
      'Accès à un large panel de spécialistes médicaux pour une prise en charge ciblée et approfondie selon votre pathologie. Chaque consultation débouche sur un plan thérapeutique personnalisé, en coordination avec votre médecin référent.',
    subServices: ['Cardiologie', 'Neurologie', 'Gynécologie', 'Pédiatrie'],
    defaultImage: 'https://images.pexels.com/photos/5407206/pexels-photo-5407206.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.UserCheck,
  },
  Dentisterie: {
    description:
      'Soins bucco-dentaires complets alliant prévention, restauration et esthétique dans un environnement clinique moderne. De la détartrage à la chirurgie implantaire, notre équipe prend en charge toute la sphère orale avec douceur et expertise.',
    subServices: ['Soins conservateurs', 'Chirurgie dentaire', 'Orthodontie', 'Esthétique dentaire'],
    defaultImage: 'https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Smile,
  },
  'Laboratoire médical': {
    description:
      'Plateforme d\'analyses biologiques certifiée offrant des résultats précis et rapides pour soutenir vos décisions cliniques. Du prélèvement au rapport, chaque étape est maîtrisée selon les standards internationaux de qualité.',
    subServices: ['Hématologie', 'Biochimie', 'Bactériologie', 'Immunologie'],
    defaultImage: 'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Microscope,
  },
  Laboratoire: {
    description:
      'Plateforme d\'analyses biologiques certifiée offrant des résultats précis et rapides pour soutenir vos décisions cliniques. Du prélèvement au rapport, chaque étape est maîtrisée selon les standards internationaux de qualité.',
    subServices: ['Hématologie', 'Biochimie', 'Bactériologie', 'Immunologie'],
    defaultImage: 'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Microscope,
  },
  'Explorations médicales': {
    description:
      'Bilans fonctionnels et explorations endoscopiques pour évaluer le fonctionnement de vos organes en profondeur. Ces examens complémentaires orientent le diagnostic et guident les décisions thérapeutiques des spécialistes.',
    subServices: ['Endoscopie digestive', 'Endoscopie bronchique', 'EEG', 'Explorations cardiaques'],
    defaultImage: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Search,
  },
  Kinésithérapie: {
    description:
      'Programme de rééducation sur mesure pour restaurer la mobilité, soulager les douleurs et prévenir les récidives après blessure, chirurgie ou maladie chronique. Nos kinésithérapeutes certifiés combinent techniques manuelles, exercices actifs et physiothérapie.',
    subServices: [
      'Rééducation orthopédique',
      'Kinésithérapie respiratoire',
      'Massage thérapeutique',
      'Rééducation sportive',
    ],
    defaultImage: 'https://images.pexels.com/photos/5473177/pexels-photo-5473177.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Icons.Activity,
  },
};

// ─── Per-service enrichment (by service name) ─────────────────────────────────
interface ServiceEnrichment {
  description: string;
  subServices: string[];
  image: string;
}

const SERVICE_DATA: Record<string, ServiceEnrichment> = {
  // Lab sub-services — each with a distinct description and relevant features
  Hématologie: {
    description:
      'Analyse complète de la composition du sang (numération formule sanguine, bilan de coagulation, groupage) pour détecter anémies, infections, troubles de la coagulation et hémopathies.',
    subServices: ['NFS / Hémogramme', 'Bilan de coagulation', 'Groupage sanguin', 'Électrophorèse'],
    image: 'https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  Biochimie: {
    description:
      'Dosage des marqueurs biologiques sanguins et urinaires (glycémie, bilan hépatique, rénal, lipidique) pour surveiller les fonctions vitales et ajuster les traitements en cours.',
    subServices: ['Glycémie / HbA1c', 'Bilan hépatique', 'Bilan rénal', 'Bilan lipidique'],
    image: 'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  Immunologie: {
    description:
      'Exploration du système immunitaire par la recherche d\'anticorps, de marqueurs d\'auto-immunité et d\'allergènes pour diagnostiquer maladies auto-immunes, infections chroniques et allergies.',
    subServices: ['Sérologies infectieuses', 'Auto-anticorps', 'Bilan allergologique', 'Marqueurs tumoraux'],
    image: 'https://images.pexels.com/photos/4031514/pexels-photo-4031514.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  Bactériologie: {
    description:
      'Identification et antibiogramme des agents bactériens responsables d\'infections (urinaires, pulmonaires, cutanées) pour orienter précisément l\'antibiothérapie et limiter la résistance.',
    subServices: ['Cultures et antibiogrammes', 'ECBU', 'Coproculture', 'Hémocultures'],
    image: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  Parasitologie: {
    description:
      'Détection microscopique et sérologique des parasites intestinaux, sanguins et tissulaires (paludisme, bilharziose, amibiase) avec rendu rapide pour une prise en charge antiparasitaire ciblée.',
    subServices: ['Goutte épaisse / Frottis', 'Examen parasitologique des selles', 'Sérologies parasitaires', 'Scotch-test'],
    image: 'https://images.pexels.com/photos/3938023/pexels-photo-3938023.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  // Radiology sub-services
  Échographie: {
    description:
      'Imagerie en temps réel par ultrasons pour explorer l\'abdomen, la thyroïde, les vaisseaux et les organes pelviens sans radiation ionisante. Examen doux, rapide et sans préparation spécifique dans la majorité des cas.',
    subServices: ['Échographie abdominale', 'Échographie pelvienne', 'Doppler vasculaire', 'Échographie obstétricale'],
    image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  Scanner: {
    description:
      'Tomodensitométrie (TDM) à coupes millimétriques pour une visualisation tridimensionnelle des organes thoraciques, abdominaux, cérébraux et osseux avec une précision diagnostique inégalée.',
    subServices: ['Scanner thoracique', 'Scanner abdomino-pelvien', 'Scanner cérébral', 'Scanner osseux'],
    image: 'https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  Radiographie: {
    description:
      'Clichés radiographiques numériques pour évaluer rapidement l\'état des poumons, du squelette et des articulations. Technique rapide et disponible en urgence, avec traitement numérique pour une meilleure lisibilité.',
    subServices: ['Radio pulmonaire', 'Radio osseuse', 'Radio articulaire', 'Radio digestive'],
    image: 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  // Interventional radiology sub-services
  'Biopsie guidée': {
    description:
      'Prélèvement tissulaire ciblé guidé par échographie ou scanner pour analyse anatomopathologique. La précision du guidage garantit un prélèvement représentatif tout en minimisant le risque de complication.',
    subServices: ['Biopsie hépatique', 'Biopsie pulmonaire', 'Biopsie rénale', 'Biopsie ganglionnaire'],
    image: 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  Embolisation: {
    description:
      'Occlusion sélective de vaisseaux sanguins pathologiques (fibromes, saignements, tumeurs) par cathétérisme artériel guidé par imagerie, évitant une intervention chirurgicale à ciel ouvert.',
    subServices: ['Embolisation utérine', 'Embolisation tumorale', 'Hémostase vasculaire', 'Embolisation prostatique'],
    image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  Drainage: {
    description:
      'Évacuation guidée par imagerie de collections liquidiennes (abcès, épanchements, kystes) à l\'aide d\'aiguilles et de drains de petit calibre pour un soulagement rapide sans chirurgie conventionnelle.',
    subServices: ['Drainage d\'abcès', 'Ponction pleurale', 'Ponction d\'ascite', 'Drainage biliaire'],
    image: 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  'Traitement des varices': {
    description:
      'Sclérothérapie et techniques endovasculaires pour éliminer les varices et télangiectasies avec un résultat esthétique et fonctionnel durable, sans hospitalisation ni anesthésie générale.',
    subServices: ['Sclérothérapie', 'Laser endoveineux', 'Phlébectomie ambulatoire', 'Ablation radiofréquence'],
    image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  // Explorations sub-services
  EEG: {
    description:
      'Enregistrement de l\'activité électrique cérébrale pour diagnostiquer épilepsies, troubles du sommeil et encéphalopathies. Examen indolore réalisé en ambulatoire avec une lecture spécialisée par notre neurologue.',
    subServices: ['EEG standard', 'EEG de sommeil', 'EEG vidéo', 'EEG de longue durée'],
    image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  'Endoscopie bronchique': {
    description:
      'Exploration visuelle directe des voies aériennes (trachée, bronches) pour diagnostiquer tumeurs, infections et corps étrangers, avec possibilité de prélèvement et de gestes thérapeutiques dans le même temps.',
    subServices: ['Bronchoscopie diagnostique', 'Lavage broncho-alvéolaire', 'Biopsie bronchique', 'Fibroscopie souple'],
    image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  'Endoscopie digestive': {
    description:
      'Examen endoscopique du tube digestif (œsophage, estomac, côlon) pour détecter ulcères, polypes, cancers et maladies inflammatoires, avec ablation des polypes et biopsies réalisées en même temps.',
    subServices: ['Gastroscopie', 'Coloscopie', 'Polypectomie', 'Biopsies digestives'],
    image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  'Explorations cardiaques': {
    description:
      'Bilan cardiovasculaire complet associant électrocardiogramme, épreuve d\'effort et échocardiographie pour évaluer la fonction cardiaque et dépister les pathologies coronariennes et valvulaires.',
    subServices: ['Électrocardiogramme (ECG)', 'Échocardiographie', 'Holter ECG', 'Épreuve d\'effort'],
    image: 'https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  // Dentistry sub-services
  'Soins dentaires': {
    description:
      'Soins bucco-dentaires complets alliant prévention, restauration et esthétique dans un environnement clinique moderne. De la détartrage à la chirurgie implantaire, notre équipe prend en charge toute la sphère orale avec douceur et expertise.',
    subServices: ['Détartrage & prophylaxie', 'Soins conservateurs', 'Chirurgie dentaire', 'Prothèses'],
    image: 'https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
};

const DEFAULT_ENRICHMENT: CategoryEnrichment = {
  description: 'Service médical de qualité supérieure pour votre santé.',
  subServices: [],
  defaultImage: 'https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=800',
  icon: Icons.Stethoscope,
};

function getEnrichment(categoryName: string): CategoryEnrichment {
  return CATEGORY_DATA[categoryName] ?? DEFAULT_ENRICHMENT;
}

function getServiceEnrichment(serviceName: string, categoryName: string): {
  description: string;
  subServices: string[];
  image: string;
} {
  if (SERVICE_DATA[serviceName]) {
    return SERVICE_DATA[serviceName];
  }
  const cat = getEnrichment(categoryName);
  return { description: cat.description, subServices: cat.subServices, image: cat.defaultImage };
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
                      const catEnrichment = getEnrichment(category.name);
                      const svcEnrichment = getServiceEnrichment(svc.name, category.name);
                      const ServiceIcon =
                        svc.icon ? (iconMap[svc.icon] ?? catEnrichment.icon) : catEnrichment.icon;

                      return (
                        <ServiceCard
                          key={svc.id}
                          id={svc.id}
                          title={getServiceName(svc)}
                          icon={ServiceIcon}
                          description={svc.description ?? svcEnrichment.description}
                          subServices={svcEnrichment.subServices}
                          imageUrl={svc.image_url ?? svcEnrichment.image}
                          defaultImageUrl={svcEnrichment.image}
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
