import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Eye, Tag, User } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { Post } from '../../types/database';
import { SocialShareButtons } from '../../components/posts/SocialShareButtons';

interface NewsDetailProps {
  slug: string;
  onNavigate: (page: string, param?: string) => void;
}

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url;
  const { data } = supabase.storage.from('post-images').getPublicUrl(url);
  return data?.publicUrl || null;
}

function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]+>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function updateMetaTags(title: string, description: string, image: string | null, url: string) {
  document.title = `${title} | OKAPIA Medical`;

  function setMeta(property: string, content: string) {
    let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      if (property.startsWith('og:') || property.startsWith('twitter:')) {
        el.setAttribute('property', property);
      } else {
        el.setAttribute('name', property);
      }
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  setMeta('og:title', title);
  setMeta('og:description', description);
  setMeta('og:url', url);
  setMeta('og:type', 'article');
  if (image) setMeta('og:image', image);
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  if (image) setMeta('twitter:image', image);
}

export function NewsDetail({ slug, onNavigate }: NewsDetailProps) {
  const { language } = useLanguage();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  useEffect(() => {
    return () => { document.title = 'OKAPIA Medical'; };
  }, []);

  async function fetchPost() {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:user_profiles(id, full_name, avatar_url),
          category:post_categories(*)
        `);

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (isUuid) {
        query = query.eq('id', slug);
      } else {
        query = query.eq('slug', slug);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      setPost(data);

      if (data) {
        supabase
          .from('posts')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', data.id)
          .then();

        const title = getLocalizedText(data as unknown as Record<string, unknown>, 'title');
        const content = getLocalizedText(data as unknown as Record<string, unknown>, 'content');
        const excerpt = content.replace(/<[^>]+>/g, '').substring(0, 160);
        const imageUrl = resolveImageUrl(data.featured_image_url) || resolveImageUrl(data.image_url);
        const articleUrl = `${window.location.origin}/#news/${data.slug || data.id}`;
        updateMetaTags(title, excerpt, imageUrl, articleUrl);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  }

  function getLocalizedText(item: Record<string, unknown>, field: string): string {
    if (!item) return '';
    if (language === 'en' && item[`${field}_en`]) return item[`${field}_en`] as string;
    if (language === 'ar' && item[`${field}_ar`]) return item[`${field}_ar`] as string;
    return (item[field] as string) || '';
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (language === 'fr') return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-muted text-lg mb-4">Article introuvable</p>
          <button
            onClick={() => onNavigate('news')}
            className="text-brand-600 hover:text-blue-800 font-medium flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux actualites
          </button>
        </div>
      </div>
    );
  }

  const imageUrl = resolveImageUrl(post.featured_image_url) || resolveImageUrl(post.image_url);
  const title = getLocalizedText(post as unknown as Record<string, unknown>, 'title');
  const content = getLocalizedText(post as unknown as Record<string, unknown>, 'content');
  const readingTime = post.reading_time || calculateReadingTime(content);
  const articleUrl = `${window.location.origin}/#news/${post.slug || post.id}`;

  return (
    <div className="min-h-screen bg-sand">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate('news')}
          className="flex items-center gap-2 text-brand-600 hover:text-blue-800 font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux actualites
        </button>

        <article className="card overflow-hidden">
          {imageUrl && (
            <div className="h-64 md:h-96 overflow-hidden">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8 md:p-12">
            {post.category && (
              <span className="inline-block px-3 py-1 bg-brand-50 text-blue-800 text-sm font-medium rounded-full mb-4">
                {getLocalizedText(post.category as unknown as Record<string, unknown>, 'name')}
              </span>
            )}

            <h1 className="font-display font-semibold text-ink mb-6" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', lineHeight: 1.12, letterSpacing: '-0.015em' }}>{title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-ink-muted mb-6 pb-6 border-b border-line">
              {post.author && (
                <div className="flex items-center gap-2">
                  {post.author.avatar_url ? (
                    <img src={post.author.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  {post.author.full_name}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(post.published_at || post.created_at)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {readingTime} min
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {post.view_count || 0} vues
              </div>
            </div>

            {/* Social sharing */}
            <div className="mb-8 pb-8 border-b border-line">
              <p className="text-sm font-medium text-ink mb-3">Partager cet article</p>
              <SocialShareButtons url={articleUrl} title={title} size="md" />
            </div>

            <div
              className="prose prose-lg max-w-none text-ink"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t border-line">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-ink-muted/70" />
                  {post.tags.map((tag, index) => (
                    <span key={index} className="text-sm text-ink-muted bg-sand-dark px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom sharing */}
            <div className="mt-8 pt-8 border-t border-line">
              <p className="text-sm font-medium text-ink mb-3">Vous avez aime cet article ? Partagez-le !</p>
              <SocialShareButtons url={articleUrl} title={title} size="md" />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
