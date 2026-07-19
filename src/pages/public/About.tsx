import { Award, Heart, Users, Shield, Target, Eye } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export function About() {
  const { t } = useLanguage();

  const values = [
    {
      icon: Heart,
      title: 'Excellence des soins',
      description: 'Nous nous engageons à fournir des soins de la plus haute qualité à tous nos patients.',
    },
    {
      icon: Users,
      title: 'Approche centrée sur le patient',
      description: 'Chaque patient est unique et mérite une attention personnalisée et des soins sur mesure.',
    },
    {
      icon: Shield,
      title: 'Intégrité et éthique',
      description: 'Nous maintenons les plus hauts standards d\'éthique médicale dans toutes nos pratiques.',
    },
    {
      icon: Target,
      title: 'Innovation continue',
      description: 'Nous adoptons les dernières technologies et méthodes pour améliorer les résultats des patients.',
    },
  ];

  const stats = [
    { number: '10+', label: 'Années d\'expérience' },
    { number: '50+', label: 'Professionnels de santé' },
    { number: '10,000+', label: 'Patients satisfaits' },
    { number: '24/7', label: 'Services d\'urgence' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="relative bg-ink text-white py-16 lg:py-20 overflow-hidden">
        <div className="okapi-stripes absolute top-0 right-0 h-full w-24 text-white opacity-[0.05] pointer-events-none" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <p className="eyebrow eyebrow--light mb-4">Qui sommes-nous</p>
            <h1 className="font-display font-semibold mb-5" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.08, letterSpacing: '-0.02em' }}>{t.common.about}</h1>
            <p className="text-lg text-white/75">
              OKAPIA Medical est un établissement de santé moderne situé au cœur de Kinshasa,
              dédié à fournir des soins médicaux de qualité supérieure à notre communauté.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-display font-semibold text-brand-600 mb-2" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}>
                {stat.number}
              </div>
              <div className="text-sm text-ink-muted font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-brand-50 w-11 h-11 rounded-xl flex items-center justify-center"><Eye className="w-5 h-5 text-brand-600" /></span>
                <h2 className="display-lg">Notre Vision</h2>
              </div>
              <p className="text-lg text-ink-muted leading-relaxed mb-6">
                Être le centre médical de référence en République Démocratique du Congo,
                reconnu pour l'excellence de nos soins, l'innovation de nos services et
                notre engagement envers la santé de notre communauté.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-brand-50 w-11 h-11 rounded-xl flex items-center justify-center"><Target className="w-5 h-5 text-brand-600" /></span>
                <h2 className="display-lg">Notre Mission</h2>
              </div>
              <p className="text-lg text-ink-muted leading-relaxed mb-6">
                Fournir des soins de santé accessibles, de haute qualité et centrés sur le patient,
                en utilisant des technologies médicales avancées et en maintenant les plus hauts
                standards professionnels et éthiques.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-20">
          <div className="text-center mb-12"><p className="eyebrow mb-3">Ce qui nous guide</p><h2 className="display-lg">Nos Valeurs</h2></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="card card-hover p-6">
                <div className="bg-brand-50 w-12 h-12 rounded-xl flex items-center justify-center mb-5">
                  <value.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-display text-xl font-semibold text-ink mb-3">{value.title}</h3>
                <p className="text-ink-muted leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-12">
          <div className="text-center max-w-3xl mx-auto">
            <Award className="w-12 h-12 text-brand-300 mx-auto mb-6" />
            <h2 className="font-display font-semibold text-white mb-6" style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)', lineHeight: 1.1 }}>
              Excellence et Accréditation
            </h2>
            <p className="text-lg text-white/75 leading-relaxed mb-8">
              OKAPIA Medical est accrédité selon les normes internationales de soins de santé.
              Notre équipe de professionnels hautement qualifiés s'engage à maintenir les plus
              hauts standards de qualité et de sécurité pour tous nos patients.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/10 border border-white/15 px-6 py-3 rounded-full">
                <p className="font-medium text-white text-sm">Équipements Modernes</p>
              </div>
              <div className="bg-white/10 border border-white/15 px-6 py-3 rounded-full">
                <p className="font-medium text-white text-sm">Personnel Qualifié</p>
              </div>
              <div className="bg-white/10 border border-white/15 px-6 py-3 rounded-full">
                <p className="font-medium text-white text-sm">Services 24/7</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <div className="text-center mb-12"><p className="eyebrow mb-3">Nous trouver</p><h2 className="display-lg">Notre Localisation</h2></div>
          <div className="card p-8 lg:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="font-display text-2xl font-semibold text-ink mb-4">
                  OKAPIA Medical
                </h3>
                <div className="space-y-3 text-ink-muted">
                  <p className="text-lg">
                    <strong>Adresse:</strong><br />
                    Chaussée Mzée Kabila n°16.881<br />
                    Galerie Manfield, Kinshasa-Ngaliema<br />
                    République Démocratique du Congo
                  </p>
                  <p className="text-lg">
                    <strong>Téléphone:</strong> +243 817 659 057
                  </p>
                  <p className="text-lg">
                    <strong>Email:</strong> info@okapiahospital.com
                  </p>
                  <div className="text-lg">
                    <strong>Horaires:</strong><br />
                    Lundi - Vendredi: 08h00 - 17h00<br />
                    Samedi - Dimanche: 08h00 - 14h00
                  </div>
                  <p className="text-brand-700 font-semibold text-lg">
                    Urgences: Disponibles 24/7
                  </p>
                </div>
              </div>
              <div className="bg-sand rounded-2xl p-6">
                <img
                  src="/Logo-Okapi-Medical.jpg"
                  alt="OKAPIA Medical"
                  className="okapia-logo okapia-logo-xlarge mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
