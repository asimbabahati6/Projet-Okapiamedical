import { MapPin, Phone, Mail } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SocialQRCode } from './SocialQRCode';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="okapia-logo-wrapper mb-4">
              <div className="okapia-logo-container">
                <img
                  src="/Logo-Okapi-Medical.jpg"
                  alt="OKAPIA Medical Logo"
                  className="okapia-logo okapia-logo-footer"
                />
              </div>
              <span className="text-xl font-bold text-white">OKAPIA Medical</span>
            </div>
            <p className="text-sm">
              {t.home.mission_text}
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t.common.contact}</h3>
            <div className="space-y-3">
              <a
                href="https://maps.google.com/?q=OKAPIA+Medical,+Chaussée+Mzée+Kabila+16.881,+Galerie+Manfield,+Kinshasa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 hover:text-blue-400 transition-colors group cursor-pointer"
                title="Voir OKAPIA Médical sur Google Maps"
              >
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="text-sm">
                  <p>Chaussée Mzée Kabila n°16.881</p>
                  <p>Galerie Manfield Kinshasa-Ngaliema</p>
                  <p>Kinshasa, République Démocratique du Congo</p>
                </div>
              </a>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <div className="text-sm">
                  <p>Direction: +243 817 659 057</p>
                  <p>Réception: +243 823 800 104</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">info@okapiahospital.com</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Horaires d'ouverture</h3>
            <div className="space-y-1 mb-2">
              <p className="text-sm">Lundi - Vendredi</p>
              <p className="text-2xl font-bold text-blue-400">08h00 - 17h00</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm">Samedi - Dimanche</p>
              <p className="text-2xl font-bold text-blue-400">08h00 - 14h00</p>
            </div>
            <p className="text-sm mt-4 text-gray-400">Services d'urgence 24/7</p>
          </div>

          <div className="flex justify-center md:justify-start lg:justify-center">
            <SocialQRCode
              variant="footer"
              size="medium"
              showTitle={true}
            />
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} OKAPIA Medical. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
