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
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">{t.common.about}</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
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
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Eye className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">Notre Vision</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Être le centre médical de référence en République Démocratique du Congo,
                reconnu pour l'excellence de nos soins, l'innovation de nos services et
                notre engagement envers la santé de notre communauté.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">Notre Mission</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Fournir des soins de santé accessibles, de haute qualité et centrés sur le patient,
                en utilisant des technologies médicales avancées et en maintenant les plus hauts
                standards professionnels et éthiques.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Nos Valeurs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-12">
          <div className="text-center max-w-3xl mx-auto">
            <Award className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Excellence et Accréditation
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              OKAPIA Medical est accrédité selon les normes internationales de soins de santé.
              Notre équipe de professionnels hautement qualifiés s'engage à maintenir les plus
              hauts standards de qualité et de sécurité pour tous nos patients.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white px-6 py-3 rounded-lg shadow-sm">
                <p className="font-semibold text-gray-900">Équipements Modernes</p>
              </div>
              <div className="bg-white px-6 py-3 rounded-lg shadow-sm">
                <p className="font-semibold text-gray-900">Personnel Qualifié</p>
              </div>
              <div className="bg-white px-6 py-3 rounded-lg shadow-sm">
                <p className="font-semibold text-gray-900">Services 24/7</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Notre Localisation
          </h2>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  OKAPIA Medical
                </h3>
                <div className="space-y-3 text-gray-600">
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
                  <p className="text-green-600 font-semibold text-lg">
                    Urgences: Disponibles 24/7
                  </p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
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
