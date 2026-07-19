import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';

export function Contact() {
  const { t } = useLanguage();
  const { toasts, removeToast, success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: submitError } = await supabase
        .from('contact_messages')
        .insert([formData]);

      if (submitError) throw submitError;

      setSuccess(true);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });

      showSuccess(t.contact.success_message || 'Your message has been sent successfully! We will get back to you soon.');

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = t.contact.error_message || 'Failed to send message. Please try again or contact us directly.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sand py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="eyebrow mb-4">Contactez-nous</p>
          <h1 className="display-lg mb-4">{t.contact.title}</h1>
          <p className="text-lg text-ink-muted">Nous sommes là pour répondre à toutes vos questions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-8 lg:p-9">
            <h2 className="font-display text-2xl font-semibold text-ink mb-6">{t.contact.message_title}</h2>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                {t.contact.success_message}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  {t.contact.your_name}
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  {t.contact.your_email}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  {t.contact.your_phone}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  {t.contact.subject}
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  {t.contact.message}
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-3.5 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {loading ? t.common.loading : t.contact.send_message}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="card p-8 lg:p-9">
              <h2 className="font-display text-2xl font-semibold text-ink mb-6">Contact Information</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-brand-50 p-3 rounded-xl">
                    <Phone className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink mb-1">{t.contact.phone}</h3>
                    <p className="text-ink-muted"><strong>Direction:</strong> +243 817 659 057</p>
                    <p className="text-ink-muted"><strong>Réception:</strong> +243 823 800 104</p>
                    <p className="text-brand-700 font-medium mt-1">Services d'urgence 24/7</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-brand-50 p-3 rounded-xl">
                    <Mail className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink mb-1">{t.contact.email}</h3>
                    <p className="text-ink-muted">info@okapiahospital.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-brand-50 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink mb-1">Horaires d'ouverture</h3>
                    <p className="text-ink-muted">Lundi - Vendredi</p>
                    <p className="text-ink-muted font-semibold text-lg">08h00 - 17h00</p>
                    <p className="text-ink-muted mt-2">Samedi - Dimanche</p>
                    <p className="text-ink-muted font-semibold text-lg">08h00 - 14h00</p>
                    <p className="text-green-600 font-medium mt-2">Urgences: 24/7</p>
                  </div>
                </div>

                <a
                  href="https://maps.google.com/?q=OKAPIA+Medical,+Chaussée+Mzée+Kabila+16.881,+Galerie+Manfield,+Kinshasa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 hover:bg-brand-50 p-4 -m-4 rounded-lg transition-colors group cursor-pointer"
                  title="Voir OKAPIA Medical sur Google Maps"
                >
                  <div className="bg-brand-50 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <MapPin className="w-6 h-6 text-brand-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink mb-1 group-hover:text-brand-600 transition-colors">{t.contact.address}</h3>
                    <div className="text-ink-muted group-hover:text-gray-800 transition-colors">
                      <p>Chaussée Mzée Kabila n°16.881</p>
                      <p>Galerie Manfield Kinshasa-Ngaliema</p>
                      <p>Kinshasa, République Démocratique du Congo</p>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="aspect-video w-full">
                <iframe
                  src="https://www.google.com/maps?q=-4.3718314,15.2536347&hl=fr&z=16&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="OKAPIA Medical - Chaussée Mzée Kabila n°16.881, Galerie Manfield, Kinshasa-Ngaliema"
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="p-4 bg-sand border-t border-line">
                <p className="text-sm text-ink-muted text-center">
                  <MapPin className="w-4 h-4 inline mr-1 text-brand-600" />
                  Chaussée Mzée Kabila n°16.881, Galerie Manfield, Kinshasa-Ngaliema
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-sm p-8 text-white">
              <h3 className="text-xl font-bold mb-4">Services d'urgence</h3>
              <p className="mb-4">Pour toute urgence médicale, appelez immédiatement:</p>
              <p className="text-4xl font-bold mb-4">+243 817 659 057</p>
              <p className="text-white/75 text-sm">Notre service d'urgence est ouvert 24 heures sur 24, 7 jours sur 7.</p>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
