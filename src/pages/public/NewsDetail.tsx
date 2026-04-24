import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Calendar, User, Clock, Eye, Tag, Share2, Facebook, Twitter, Linkedin, Mail, ImageOff, Newspaper } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { Post, PostMedia } from '../../types/database';

interface NewsDetailProps {
  slug: string;
  onNavigate: (page: string, slug?: string) => void;
}

export function NewsDetail({ slug, onNavigate }: NewsDetailProps) {
  const { language } = useLanguage();
  const [post, setPost] = useState<Post | null>(null);
  const [media, setMedia] = useState<PostMedia[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const fetchPostDetail = useCallback(async () => {
    setLoading(true);
    setError(false);
    setPost(null);
    setMedia([]);
    setRelatedPosts([]);

    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          author:user_profiles(id, full_name, avatar_url),
          category:post_categories(*)
        `)
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .eq('status', 'publié')
        .maybeSingle();

      if (postError) {
        console.error('NewsDetail: Supabase query error:', postError);
        throw postError;
      }

      if (!postData) {
        console.warn('NewsDetail: No post found for slug/id:', slug);
        setError(true);
        setLoading(false);
        return;
      }

      console.log('NewsDetail: Post loaded:', postData.id, postData.title);
      setPost(postData);

      supabase.rpc('increment_post_views', { post_id_param: postData.id }).catch(() => {});

      const [mediaResult, relatedResult] = await Promise.all([
        supabase
          .from('post_media')
          .select('*')
          .eq('post_id', postData.id)
          .order('display_order'),
        postData.category_id
          ? supabase
              .from('posts')
              .select(`
                *,
                author:user_profiles(id, full_name, avatar_url),
                category:post_categories(*)
              `)
              .eq('status', 'publié')
              .eq('category_id', postData.category_id)
              .neq('id', postData.id)
              .limit(3)
              .order('published_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (mediaResult.data) setMedia(mediaResult.data);
      if (relatedResult.data) setRelatedPosts(relatedResult.data);
    } catch (err) {
      console.error('NewsDetail: Error fetching post:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  useEffect(() => {
    if (!loading && error && !post) {
      const timer = setTimeout(() => onNavigate('news'), 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, error, post, onNavigate]);

  function getLocalizedText(item: Record<string, unknown>, field: string): string {
    if (!item) return '';
    if (language === 'en' && item[`${field}_en`]) return item[`${field}_en`] as string;
    if (language === 'ar' && item[`${field}_ar`]) return item[`${field}_ar`] as string;
    return (item[field] as string) || '';
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (language === 'fr') return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    if (language === 'ar') return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function renderContent(content: string): string {
    if (!content) return '';
    if (content.includes('<p>') || content.includes('<div>') || content.includes('<br')) {
      return content;
    }
    return content
      .split(/\n\n+/)
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        const lines = trimmed.split('\n');
        if (lines.length === 1 && lines[0].length < 100 && !lines[0].includes('.')) {
          return `<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">${lines[0]}</h3>`;
        }
        return `<p class="mb-4">${lines.join('<br />')}</p>`;
      })
      .join('');
  }

  function resolveImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url;
    const { data } = supabase.storage.from('post-images').getPublicUrl(url);
    return data?.publicUrl || null;
  }

  function shareOnSocial(platform: string) {
    const url = window.location.href;
    const title = post ? getLocalizedText(post as unknown as Record<string, unknown>, 'title') : '';
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
    };
    if (shareUrls[platform]) window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  }

  const tr: Record<string, Record<string, string>> = {
    back: { fr: 'Retour aux actualités', en: 'Back to news', ar: 'العودة إلى الأخبار' },
    by: { fr: 'Par', en: 'By', ar: 'بواسطة' },
    min_read: { fr: 'min de lecture', en: 'min read', ar: 'دقيقة قراءة' },
    views: { fr: 'vues', en: 'views', ar: 'مشاهدة' },
    share: { fr: 'Partager', en: 'Share', ar: 'مشاركة' },
    related_articles: { fr: 'Articles connexes', en: 'Related articles', ar: 'مقالات ذات صلة' },
    read_more: { fr: 'Lire la suite', en: 'Read more', ar: 'اقرأ المزيد' },
    not_found: { fr: 'Article non trouvé', en: 'Article not found', ar: 'المقال غير موجود' },
    redirecting: { fr: 'Redirection vers les actualités...', en: 'Redirecting to news...', ar: 'إعادة التوجيه...' },
  };
  const t = (key: string) => tr[key]?.[language] || tr[key]?.['fr'] || '';

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('not_found')}</h2>
          <p className="text-gray-500 text-sm mb-6">{t('redirecting')}</p>
          <button
            onClick={() => onNavigate('news')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  const featuredImgUrl = resolveImageUrl(post.featured_image_url) || resolveImageUrl(post.image_url);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => onNavigate('news')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('back')}
          </button>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {post.category && (
            <div className="px-8 pt-8">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {getLocalizedText(post.category as unknown as Record<string, unknown>, 'name')}
              </span>
            </div>
          )}

          <div className="px-8 pt-6 pb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              {getLocalizedText(post as unknown as Record<string, unknown>, 'title')}
            </h1>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-600 mb-6 pb-6 border-b">
              {post.author && (
                <div className="flex items-center gap-3">
                  {post.author.avatar_url ? (
                    <img
                      src={post.author.avatar_url}
                      alt={post.author.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">{t('by')}</p>
                    <p className="font-medium text-gray-900">{post.author.full_name}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                </div>
                {post.reading_time > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{post.reading_time} {t('min_read')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{post.view_count} {t('views')}</span>
                </div>
              </div>

              <div className="relative ml-auto">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  {t('share')}
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                    {[
                      { key: 'facebook', Icon: Facebook, color: 'text-blue-600', label: 'Facebook' },
                      { key: 'twitter', Icon: Twitter, color: 'text-sky-500', label: 'Twitter' },
                      { key: 'linkedin', Icon: Linkedin, color: 'text-blue-700', label: 'LinkedIn' },
                      { key: 'email', Icon: Mail, color: 'text-gray-600', label: 'Email' },
                    ].map(({ key, Icon, color, label }) => (
                      <button
                        key={key}
                        onClick={() => shareOnSocial(key)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <Icon className={`w-5 h-5 ${color}`} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {featuredImgUrl ? (
            <div className="w-full h-72 md:h-96 overflow-hidden bg-gray-100 relative">
              <img
                src={featuredImgUrl}
                alt={getLocalizedText(post as unknown as Record<string, unknown>, 'title')}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.classList.add('flex', 'items-center', 'justify-center');
                    const fallback = document.createElement('div');
                    fallback.className = 'text-center text-gray-400';
                    fallback.innerHTML = '<svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-sm">Image non disponible</p>';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <div className="text-center text-blue-300">
                <Newspaper className="w-16 h-16 mx-auto mb-2" />
              </div>
            </div>
          )}

          {/* Article Content */}
          <div className="px-6 md:px-8 py-8">
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed overflow-y-auto"
              dangerouslySetInnerHTML={{
                __html: renderContent(getLocalizedText(post as unknown as Record<string, unknown>, 'content')),
              }}
            />

            {post.video_url && (
              <div className="mt-8 aspect-video">
                <iframe
                  src={post.video_url}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title="Video"
                />
              </div>
            )}

            {media.length > 0 && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {media.map((item) => (
                  <div key={item.id} className="rounded-lg overflow-hidden">
                    {item.media_type === 'image' && (
                      <div>
                        <div className="h-64 bg-gray-100 relative">
                          <img
                            src={resolveImageUrl(item.media_url) || item.media_url}
                            alt={getLocalizedText(item as unknown as Record<string, unknown>, 'caption')}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.classList.add('flex', 'items-center', 'justify-center');
                                const icon = document.createElement('div');
                                icon.className = 'text-gray-300';
                                icon.textContent = 'Image non disponible';
                                parent.appendChild(icon);
                              }
                            }}
                          />
                        </div>
                        {item.caption && (
                          <p className="text-sm text-gray-600 mt-2 px-2">
                            {getLocalizedText(item as unknown as Record<string, unknown>, 'caption')}
                          </p>
                        )}
                      </div>
                    )}
                    {item.media_type === 'video' && (
                      <div className="aspect-video">
                        <iframe
                          src={item.media_url}
                          className="w-full h-full"
                          allowFullScreen
                          title={getLocalizedText(item as unknown as Record<string, unknown>, 'caption')}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-8 pt-8 border-t">
                <Tag className="w-5 h-5 text-gray-400" />
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('related_articles')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => {
                const relImg = resolveImageUrl(relatedPost.featured_image_url) || resolveImageUrl(relatedPost.image_url);
                return (
                  <div
                    key={relatedPost.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => onNavigate('news-detail', relatedPost.slug || relatedPost.id)}
                  >
                    <div className="h-40 overflow-hidden bg-gray-100">
                      {relImg ? (
                        <img
                          src={relImg}
                          alt={getLocalizedText(relatedPost as unknown as Record<string, unknown>, 'title')}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                          <Newspaper className="w-10 h-10 text-blue-200" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                        {getLocalizedText(relatedPost as unknown as Record<string, unknown>, 'title')}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {getLocalizedText(relatedPost as unknown as Record<string, unknown>, 'excerpt') ||
                         getLocalizedText(relatedPost as unknown as Record<string, unknown>, 'content').substring(0, 120) + '...'}
                      </p>
                      <span className="text-blue-600 text-sm font-medium hover:text-blue-700">
                        {t('read_more')} &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
