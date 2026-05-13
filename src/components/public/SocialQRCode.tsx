import { useState } from 'react';
import { Link2, CheckCheck } from 'lucide-react';

interface SocialQRCodeProps {
  variant?: 'footer' | 'floating' | 'inline';
  size?: 'small' | 'medium' | 'large';
  showTitle?: boolean;
  className?: string;
  socialLink?: string;
  siteUrl?: string;
}

export function SocialQRCode({
  size = 'medium',
  showTitle = true,
  className = '',
  socialLink = 'https://facebook.com/okapiamedical',
  siteUrl = 'https://www.okapiamedical.com',
}: SocialQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const qrSize = size === 'small' ? 96 : size === 'large' ? 160 : 140;

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(siteUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = siteUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div
      className={`flex flex-col items-center bg-[#0f172a] rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-blue-900/40 hover:border-slate-600 w-fit ${className}`}
    >
      {showTitle && (
        <div className="w-full px-6 pt-5 pb-3 text-center">
          <span className="text-white font-bold tracking-[0.22em] text-sm uppercase">
            SUIVEZ-NOUS
          </span>
          <div className="mt-2 mx-auto w-8 h-0.5 rounded-full bg-blue-500/60" />
        </div>
      )}

      <div className="px-6 pb-2 flex flex-col items-center gap-4">
        <a
          href={socialLink}
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
          title="Suivez-nous sur les réseaux sociaux"
        >
          <div className="bg-white p-3 rounded-xl shadow-inner ring-2 ring-white/20 transition-transform duration-300 group-hover:scale-105">
            <img
              src="/WhatsApp_Image_2026-02-15_at_13.30.08.jpeg"
              alt="QR Code Okapia Medical"
              style={{ width: qrSize, height: qrSize }}
              className="object-contain block"
            />
          </div>
        </a>

        <p className="text-blue-400 text-sm font-semibold text-center leading-snug hidden md:block">
          Scannez pour nous suivre<br />sur les réseaux sociaux
        </p>
        <p className="text-blue-400 text-sm font-semibold text-center leading-snug block md:hidden animate-pulse">
          Cliquez pour nous suivre<br />sur les réseaux sociaux
        </p>
      </div>

      <div className="w-full px-6 pb-5">
        <div className="h-px bg-slate-700/50 mb-4" />
        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 select-none
            ${copied
              ? 'bg-green-500/20 text-green-400 border border-green-500/40'
              : 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 hover:text-blue-200 hover:border-blue-400/50 active:scale-95'
            }`}
        >
          {copied
            ? <><CheckCheck className="w-4 h-4" />Lien copié !</>
            : <><Link2 className="w-4 h-4" />Copier le lien</>
          }
        </button>
      </div>
    </div>
  );
}
