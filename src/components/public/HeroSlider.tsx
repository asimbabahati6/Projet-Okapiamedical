import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeroSliderProps {
  onNavigate: (page: string) => void;
}

export function HeroSlider({ onNavigate }: HeroSliderProps) {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: 'https://images.pexels.com/photos/6303761/pexels-photo-6303761.jpeg?auto=compress&cs=tinysrgb&w=1920',
      title: 'Des Soins de Santé de Qualité pour Tous',
      subtitle: 'Services médicaux modernes au cœur de Kinshasa',
    },
    {
      image: 'https://images.pexels.com/photos/8460040/pexels-photo-8460040.jpeg?auto=compress&cs=tinysrgb&w=1920',
      title: 'Une Équipe Médicale Dévouée',
      subtitle: 'Professionnels qualifiés au service de votre santé',
    },
    {
      image: 'https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=1920',
      title: 'Technologie Médicale Avancée',
      subtitle: 'Équipements modernes pour des diagnostics précis',
    },
    {
      image: 'https://images.pexels.com/photos/6303665/pexels-photo-6303665.jpeg?auto=compress&cs=tinysrgb&w=1920',
      title: 'Soins Pédiatriques Spécialisés',
      subtitle: 'La santé de vos enfants est notre priorité',
    },
    {
      image: 'https://images.pexels.com/photos/7579871/pexels-photo-7579871.jpeg?auto=compress&cs=tinysrgb&w=1920',
      title: 'Service d\'Urgence 24/7',
      subtitle: 'Disponibles à tout moment pour vous servir',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);


  return (
    <section className="relative h-[600px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-900/40" style={{ backgroundImage: 'linear-gradient(to bottom, transparent 0%, transparent 80%, rgba(30, 58, 138, 0.4) 100%)' }}></div>
          </div>

          <div className="relative h-full flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
              <div className="max-w-3xl bg-white/40 backdrop-blur-sm p-8 rounded-lg">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg" style={{ color: '#0F4A77' }}>
                  {slide.title}
                </h1>
                <p className="text-xl md:text-2xl mb-8 drop-shadow-md" style={{ color: '#0F4A77' }}>
                  {slide.subtitle}
                </p>
                <button
                  onClick={() => onNavigate('appointments')}
                  className="text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-colors inline-flex items-center gap-2 shadow-lg"
                  style={{ backgroundColor: '#0F4A77' }}
                >
                  <Calendar className="w-5 h-5" />
                  {t.home.hero_cta}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
