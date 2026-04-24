import { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Eye, Tag, ArrowRight, Newspaper } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { Post, PostCategory } from '../../types/database';

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

export function News({ onNavigate }: NewsProps) {
  const { language } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null);

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
    title: { fr: 'Actualités & Nouveautés', en: 'News & Updates', ar: 'الأخبار والتحديثات' },
    subtitle: { fr: "Restez informé des dernières actualités, événements et innovations d'OKAPIA Médical", en: 'Stay informed about the latest news, events and innovations from OKAPIA Médical', ar: 'ابق على اطلاع بآخر الأخبار والفعاليات والابتكارات' },
    search: { fr: 'Rechercher un article...', en: 'Search articles...', ar: 'بحث في المقالات...' },
    all_categories: { fr: 'Toutes les catégories', en: 'All categories', ar: 'كل الفئات' },
    featured: { fr: 'À la une', en: 'Featured', ar: 'مميز' },
    read_more: { fr: 'Lire la suite', en: 'Read more', ar: 'اقرأ المزيد' },
    min_read: { fr: 'min de lecture', en: 'min read', ar: 'دقيقة قراءة' },
    views: { fr: 'vues', en: 'views', ar: 'مشاهدة' },
    no_articles: { fr: 'Aucun article trouvé', en: 'No articles found', ar: 'لم يتم العثور على مقالات' },
    latest_news: { fr: 'Dernières actualités', en: 'Latest news', ar: 'آخر الأخبار' },
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-blue-100 max-w-3xl">{t('subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {/* Image column */}
                {getPostImage(featuredPost) ? (
                  <div className="h-64 md:h-full min-h-[280px] bg-gray-100 relative">
                    <img
                      src={getPostImage(featuredPost)!}
                      alt={getLocalizedText(featuredPost as unknown as Record<string, unknown>, 'title')}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gradient-to-br', 'from-blue-50', 'to-blue-100');
                          const fallback = document.createElement('div');
                          fallback.className = 'text-blue-200';
                          fallback.innerHTML = '<svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-48 md:hidden bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 flex items-center justify-center">
                    <Newspaper className="w-20 h-20 text-blue-200" />
                  </div>
                )}

                {/* Content column */}
                <div className="p-8 flex flex-col justify-center">
                  {featuredPost.category && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mb-4 w-fit">
                      {getLocalizedText(featuredPost.category as unknown as Record<string, unknown>, 'name')}
                    </span>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {getLocalizedText(featuredPost as unknown as Record<string, unknown>, 'title')}
                  </h2>
                  <p className="text-gray-600 mb-6 line-clamp-4">
                    {getExcerpt(featuredPost)}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(featuredPost.published_at || featuredPost.created_at)}
                    </div>
                    {featuredPost.reading_time > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {featuredPost.reading_time} {t('min_read')}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      {featuredPost.view_count} {t('views')}
                    </div>
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
              return (
                <article
                  key={post.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
                  onClick={() => onNavigate('news-detail', post.slug || post.id)}
                >
                  <div className="h-48 overflow-hidden bg-gray-100 relative">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={getLocalizedText(post as unknown as Record<string, unknown>, 'title')}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gradient-to-br', 'from-blue-50', 'to-blue-100');
                            const fallback = document.createElement('div');
                            fallback.className = 'text-blue-200';
                            fallback.innerHTML = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                        <Newspaper className="w-12 h-12 text-blue-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {post.category && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-3">
                        {getLocalizedText(post.category as unknown as Record<string, unknown>, 'name')}
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {getLocalizedText(post as unknown as Record<string, unknown>, 'title')}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {getExcerpt(post)}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(post.published_at || post.created_at)}
                      </div>
                      {post.reading_time > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.reading_time} {t('min_read')}
                        </div>
                      )}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-4 h-4 text-gray-400" />
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
