import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SocialQRCode } from './SocialQRCode';
import { useLanguage } from '../../contexts/LanguageContext';

export function FloatingSocialQR() {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`
        fixed right-0 top-1/2 -translate-y-1/2 z-50
        hidden lg:block
        transition-transform duration-300 ease-in-out
        ${isExpanded ? 'translate-x-0' : 'translate-x-[calc(100%-40px)]'}
      `}
      style={{ maxWidth: '300px' }}
    >
      <div className="relative bg-[#0f172a] shadow-2xl rounded-l-2xl border-l-4 border-slate-700">
        <button
          onClick={toggleExpanded}
          className="
            absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full
            bg-slate-700 text-white
            w-10 h-20
            rounded-l-lg
            flex items-center justify-center
            hover:bg-slate-600
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
            shadow-lg border border-slate-800
          "
          aria-label={isExpanded ? 'Fermer le QR code' : 'Ouvrir le QR code'}
          title={isExpanded ? 'Fermer' : 'Ouvrir'}
        >
          {isExpanded ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>

        <div className="p-4 overflow-hidden">
          <div
            className={`
              transition-opacity duration-300
              ${isExpanded ? 'opacity-100' : 'opacity-0'}
            `}
          >
            <SocialQRCode
              variant="floating"
              size="large"
              showTitle={true}
              className="!p-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
