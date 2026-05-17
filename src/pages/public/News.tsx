import { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Eye, Tag, ArrowRight, Newspaper, Mail, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { Post, PostCategory } from '../../types/database';
import { SocialShareButtons } from '../../components/posts/SocialShareButtons';

interface NewsProps {
  onNavigate: (page: string, slug?: string) => void;
}

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url;
  const { data } = supabase.storage.from('post-images').getPublicUrl(url);
  return data?.publicUrl || null;
}

function getPostImage(post: Post): string | null {
  return resolveImageUrl(post.featured_image_url) || resolveImageUrl(post.image_url);
}

function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]+>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const CATEGORY_COLORS: Record<string, string> = {
  innovation: 'bg-emerald-100 text-emerald-800',
  sante: 'bg-red-100 text-red-700',
  actualite: 'bg-blue-100 text-blue-800',
  evenement: 'bg-orange-100 text-orange-800',
  produit: 'bg-teal-100 text-teal-800',
};

function getCategoryColor(name?: string): string {
  if (!name) return 'bg-blue-100 text-blue-800';
  const normalized = name.toLowerCase().replace(/[éè]/g, 'e').replace(/[à]/g, 'a');
  return CATEGORY_COLORS[normalized] || 'bg-blue-100 text-blue-800';
}

const SOCIAL_LINKS = [
  { id: 'facebook', url: 'https://www.facebook.com/OkapiaMedical', color: '#1877F2', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { id: 'x', url: 'https://twitter.com/OkapiaMedical', color: '#000000', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { id: 'instagram', url: 'https://www.instagram.com/okapiamedical', color: '#E1306C', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { id: 'tiktok', url: 'https://www.tiktok.com/@okapiamedical', color: '#010101', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
  { id: 'youtube', url: 'https://www.youtube.com/@OkapiaMedical', color: '#FF0000', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
  { id: 'whatsapp', url: 'https://wa.me/243817659057', color: '#25D366', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
];

export function News({ onNavigate }: NewsProps) {
  const { language } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    fetchNewsData();
  }, []);

  async function fetchNewsData() {
    try {
      const [categoriesResult, postsResult] = await Promise.all([
        supabase.from('post_categories').select('*').order('name'),
        supabase
          .from('posts')
          .select(`
            *,
            author:user_profiles(id, full_name, avatar_url),
            category:post_categories(*)
          `)
          .eq('status', 'publié')
          .order('published_at', { ascending: false }),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (postsResult.error) throw postsResult.error;

      setCategories(categoriesResult.data || []);
      const allPosts = postsResult.data || [];
      setPosts(allPosts);

      const featured = allPosts.find((p) => p.is_featured);
      setFeaturedPost(featured || allPosts[0] || null);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleNewsletterSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      const { error } = await supabase.from('newsletter_subscribers').upsert(
        { email: newsletterEmail.trim().toLowerCase(), is_active: true, subscribed_at: new Date().toISOString() },
        { onConflict: 'email' }
      );
      if (error) throw error;

      const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'newsletter_subscribe', email: newsletterEmail.trim() }),
        }).catch(() => {});
      }

      setSubscribed(true);
      setNewsletterEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
    } finally {
      setSubscribing(false);
    }
  }

  function getLocalizedText(item: Record<string, unknown>, field: string): string {
    if (!item) return '';
    if (language === 'en' && item[`${field}_en`]) return item[`${field}_en`] as string;
    if (language === 'ar' && item[`${field}_ar`]) return item[`${field}_ar`] as string;
    return (item[field] as string) || '';
  }

  function getExcerpt(post: Post): string {
    const excerpt = getLocalizedText(post as unknown as Record<string, unknown>, 'excerpt');
    if (excerpt) return excerpt;
    const content = getLocalizedText(post as unknown as Record<string, unknown>, 'content');
    if (!content) return '';
    const plain = content.replace(/<[^>]+>/g, '');
    return plain.length > 180 ? plain.substring(0, 180) + '...' : plain;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (language === 'fr') return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    if (language === 'ar') return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function getArticleUrl(post: Post): string {
    return `${window.location.origin}/#news/${post.slug || post.id}`;
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchQuery === '' ||
      getLocalizedText(post as unknown as Record<string, unknown>, 'title').toLowerCase().includes(searchQuery.toLowerCase()) ||
      getExcerpt(post).toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = !selectedCategory || post.category_id === selectedCategory;

    return matchesSearch && matchesCategory && post.id !== featuredPost?.id;
  });

  const tr: Record<string, Record<string, string>> = {
    title: { fr: 'Actualites & Nouveautes', en: 'News & Updates', ar: '\u0627\u0644\u0623\u062e\u0628\u0627\u0631 \u0648\u0627\u0644\u062a\u062d\u062f\u064a\u062b\u0627\u062a' },
    subtitle: { fr: "Restez informe des dernieres actualites, evenements et innovations d'OKAPIA Medical", en: 'Stay informed about the latest news, events and innovations from OKAPIA Medical', ar: '' },
    search: { fr: 'Rechercher un article...', en: 'Search articles...', ar: '' },
    all_categories: { fr: 'Toutes les categories', en: 'All categories', ar: '' },
    featured: { fr: 'A la une', en: 'Featured', ar: '' },
    read_more: { fr: 'Lire la suite', en: 'Read more', ar: '' },
    min_read: { fr: 'min de lecture', en: 'min read', ar: '' },
    views: { fr: 'vues', en: 'views', ar: '' },
    no_articles: { fr: 'Aucun article trouve', en: 'No articles found', ar: '' },
    latest_news: { fr: 'Dernieres actualites', en: 'Latest news', ar: '' },
  };
  const t = (key: string) => tr[key]?.[language] || tr[key]?.['fr'] || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-blue-100 max-w-3xl mb-6">{t('subtitle')}</p>
          {/* Social links */}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                title={s.id}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {t('all_categories')}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {getLocalizedText(category as unknown as Record<string, unknown>, 'name')}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-12">
            <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full mb-4">
              {t('featured')}
            </div>
            <div
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => onNavigate('news-detail', featuredPost.slug || featuredPost.id)}
            >
              <div className={`grid ${getPostImage(featuredPost) ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-0`}>
                {getPostImage(featuredPost) ? (
                  <div className="h-64 md:h-full min-h-[280px] bg-gray-100 relative">
                    <img
                      src={getPostImage(featuredPost)!}
                      alt={getLocalizedText(featuredPost as unknown as Record<string, unknown>, 'title')}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 md:hidden bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 flex items-center justify-center">
                    <Newspaper className="w-20 h-20 text-blue-200" />
                  </div>
                )}
                <div className="p-8 flex flex-col justify-center">
                  {featuredPost.category && (
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-4 w-fit ${getCategoryColor((featuredPost.category as any).name)}`}>
                      {getLocalizedText(featuredPost.category as unknown as Record<string, unknown>, 'name')}
                    </span>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {getLocalizedText(featuredPost as unknown as Record<string, unknown>, 'title')}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">{getExcerpt(featuredPost)}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                    {featuredPost.author && (
                      <div className="flex items-center gap-2">
                        {(featuredPost.author as any).avatar_url ? (
                          <img src={(featuredPost.author as any).avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : null}
                        <span>{(featuredPost.author as any).full_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(featuredPost.published_at || featuredPost.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {featuredPost.reading_time || calculateReadingTime(getLocalizedText(featuredPost as unknown as Record<string, unknown>, 'content'))} {t('min_read')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {featuredPost.view_count || 0} {t('views')}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="mb-4">
                    <SocialShareButtons
                      url={getArticleUrl(featuredPost)}
                      title={getLocalizedText(featuredPost as unknown as Record<string, unknown>, 'title')}
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all">
                    {t('read_more')}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('latest_news')}</h2>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{t('no_articles')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => {
              const imgUrl = getPostImage(post);
              const readingTime = post.reading_time || calculateReadingTime(getLocalizedText(post as unknown as Record<string, unknown>, 'content'));
              return (
                <article
                  key={post.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group flex flex-col"
                  onClick={() => onNavigate('news-detail', post.slug || post.id)}
                >
                  <div className="h-48 overflow-hidden bg-gray-100 relative">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={getLocalizedText(post as unknown as Record<string, unknown>, 'title')}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                        <Newspaper className="w-12 h-12 text-blue-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    {post.category && (
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-3 w-fit ${getCategoryColor((post.category as any).name)}`}>
                        {getLocalizedText(post.category as unknown as Record<string, unknown>, 'name')}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {getLocalizedText(post as unknown as Record<string, unknown>, 'title')}
                    </h3>

                    {/* Author */}
                    {post.author && (
                      <div className="flex items-center gap-2 mb-3">
                        {(post.author as any).avatar_url ? (
                          <img src={(post.author as any).avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-gray-500">
                              {(post.author as any).full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-gray-600">{(post.author as any).full_name}</span>
                      </div>
                    )}

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{getExcerpt(post)}</p>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(post.published_at || post.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {readingTime} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {post.view_count || 0}
                      </div>
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        <Tag className="w-3.5 h-3.5 text-gray-400" />
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Social sharing */}
                    <div onClick={(e) => e.stopPropagation()} className="pt-3 border-t border-gray-100">
                      <SocialShareButtons url={getArticleUrl(post)} title={getLocalizedText(post as unknown as Record<string, unknown>, 'title')} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Newsletter subscription */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h3 className="text-2xl font-bold mb-2">Restez informe</h3>
            <p className="text-blue-100 mb-6">
              Abonnez-vous a notre newsletter pour recevoir les dernieres actualites d'OKAPIA Medical
            </p>
            {subscribed ? (
              <div className="flex items-center justify-center gap-2 text-green-200">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Vous etes maintenant abonne aux actualites d'Okapia Medical</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubscribe} className="flex gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-6 py-3 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {subscribing ? '...' : "S'abonner"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
