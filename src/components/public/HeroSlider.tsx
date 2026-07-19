import { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ShieldCheck, Clock, Stethoscope } from 'lucide-react';
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
      title: "Service d'Urgence 24/7",
      subtitle: 'Disponibles à tout moment pour vous servir',
    },
  ];

  const next = useCallback(() => setCurrentSlide((p) => (p + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative h-[560px] lg:h-[620px] overflow-hidden bg-ink">
      {/* Images */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={index !== currentSlide}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          {/* Voile navy : lisibilité premium */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-ink/10" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink/70 to-transparent" />
        </div>
      ))}

      {/* Contenu */}
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <p className="eyebrow eyebrow--light mb-5">Clinique privée · Kinshasa</p>
            <h1
              key={`title-${currentSlide}`}
              className="font-display font-semibold text-white rise"
              style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
            >
              {slides[currentSlide].title}
            </h1>
            <p
              key={`sub-${currentSlide}`}
              className="rise rise-1 text-lg lg:text-xl text-white/80 leading-relaxed mt-5 mb-9 max-w-xl"
            >
              {slides[currentSlide].subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => onNavigate('appointments')} className="btn-on-dark !px-7 !py-3.5 text-base !text-brand-800">
                <Calendar className="w-5 h-5" />
                {t.home.hero_cta}
              </button>
              <button onClick={() => onNavigate('services')} className="btn-ghost-dark !px-7 !py-3.5 text-base">
                Découvrir nos services
              </button>
            </div>

            {/* Bandeau de confiance */}
            <div className="mt-12 pt-6 border-t border-white/20 grid grid-cols-3 gap-4 max-w-md">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-brand-300 shrink-0" />
                <span className="text-xs font-medium text-white/80 leading-tight">Urgences 24h/24</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-4 h-4 text-brand-300 shrink-0" />
                <span className="text-xs font-medium text-white/80 leading-tight">Médecins certifiés</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brand-300 shrink-0" />
                <span className="text-xs font-medium text-white/80 leading-tight">Normes internationales</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contrôles */}
      <button
        onClick={prev}
        aria-label="Slide précédent"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white flex items-center justify-center transition-colors hidden md:flex"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label="Slide suivant"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white flex items-center justify-center transition-colors hidden md:flex"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicateurs */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Aller au slide ${index + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
