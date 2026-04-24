import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Clock, Eye, Tag, Share2, Facebook, Twitter, Linkedin, Mail } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { Post, PostMedia } from '../../types/database';

interface NewsDetailProps {
  slug: string;
  onNavigate: (page: string, slug?: string) => void;
}

export function NewsDetail({ slug, onNavigate }: NewsDetailProps) {
  const { t, language } = useLanguage();
  const [post, setPost] = useState<Post | null>(null);
  const [media, setMedia] = useState<PostMedia[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    fetchPostDetail();
  }, [slug]);

  async function fetchPostDetail() {
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

      if (postError) throw postError;
      if (!postData) {
        console.error('Post not found');
        setLoading(false);
        return;
      }

      setPost(postData);

      await supabase.rpc('increment_post_views', { post_id_param: postData.id });

      const [mediaResult, relatedResult] = await Promise.all([
        supabase
          .from('post_media')
          .select('*')
          .eq('post_id', postData.id)
          .order('display_order'),
        supabase
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
      ]);

      if (mediaResult.data) setMedia(mediaResult.data);
      if (relatedResult.data) setRelatedPosts(relatedResult.data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  }

  function getLocalizedText(item: any, field: string): string {
    if (!item) return '';
    if (language === 'en' && item[`${field}_en`]) return item[`${field}_en`];
    if (language === 'ar' && item[`${field}_ar`]) return item[`${field}_ar`];
    return item[field] || '';
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (language === 'fr') {
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    } else if (language === 'ar') {
      return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  }

  function shareOnSocial(platform: string) {
    const url = window.location.href;
    const title = getLocalizedText(post, 'title');

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  }

  const getTranslation = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      back: {
        fr: 'Retour aux actualités',
        en: 'Back to news',
        ar: 'العودة إلى الأخبار'
      },
      by: {
        fr: 'Par',
        en: 'By',
        ar: 'بواسطة'
      },
      min_read: {
        fr: 'min de lecture',
        en: 'min read',
        ar: 'دقيقة قراءة'
      },
      views: {
        fr: 'vues',
        en: 'views',
        ar: 'مشاهدة'
      },
      share: {
        fr: 'Partager',
        en: 'Share',
        ar: 'مشاركة'
      },
      related_articles: {
        fr: 'Articles connexes',
        en: 'Related articles',
        ar: 'مقالات ذات صلة'
      },
      read_more: {
        fr: 'Lire la suite',
        en: 'Read more',
        ar: 'اقرأ المزيد'
      }
    };
    return translations[key]?.[language] || translations[key]?.['fr'] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  useEffect(() => {
    if (!loading && !post) {
      onNavigate('news');
    }
  }, [loading, post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => onNavigate('news')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {getTranslation('back')}
          </button>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {post.category && (
            <div className="px-8 pt-8">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {getLocalizedText(post.category, 'name')}
              </span>
            </div>
          )}

          <div className="px-8 pt-6 pb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {getLocalizedText(post, 'title')}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6 pb-6 border-b">
              {post.author && (
                <div className="flex items-center gap-3">
                  {post.author.avatar_url ? (
                    <img
                      src={post.author.avatar_url}
                      alt={post.author.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">{getTranslation('by')}</p>
                    <p className="font-medium text-gray-900">{post.author.full_name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{post.reading_time} {getTranslation('min_read')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span>{post.view_count} {getTranslation('views')}</span>
                </div>
              </div>

              <div className="relative ml-auto">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  {getTranslation('share')}
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                    <button
                      onClick={() => shareOnSocial('facebook')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Facebook className="w-5 h-5 text-blue-600" />
                      <span>Facebook</span>
                    </button>
                    <button
                      onClick={() => shareOnSocial('twitter')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Twitter className="w-5 h-5 text-sky-500" />
                      <span>Twitter</span>
                    </button>
                    <button
                      onClick={() => shareOnSocial('linkedin')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Linkedin className="w-5 h-5 text-blue-700" />
                      <span>LinkedIn</span>
                    </button>
                    <button
                      onClick={() => shareOnSocial('email')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Mail className="w-5 h-5 text-gray-600" />
                      <span>Email</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {post.featured_image_url && (
            <div className="w-full h-96 overflow-hidden">
              <img
                src={post.featured_image_url}
                alt={getLocalizedText(post, 'title')}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="px-8 py-8">
            <div className="prose prose-lg max-w-none">
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: getLocalizedText(post, 'content') }}
              />
            </div>

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
              <div className="mt-8 grid grid-cols-2 gap-4">
                {media.map((item) => (
                  <div key={item.id} className="rounded-lg overflow-hidden">
                    {item.media_type === 'image' && (
                      <div>
                        <img
                          src={item.media_url}
                          alt={getLocalizedText(item, 'caption')}
                          className="w-full h-64 object-cover"
                        />
                        {item.caption && (
                          <p className="text-sm text-gray-600 mt-2 px-2">
                            {getLocalizedText(item, 'caption')}
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
                          title={getLocalizedText(item, 'caption')}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{getTranslation('related_articles')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <div
                  key={relatedPost.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onNavigate('news-detail', relatedPost.slug || relatedPost.id)}
                >
                  {relatedPost.featured_image_url && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={relatedPost.featured_image_url}
                        alt={getLocalizedText(relatedPost, 'title')}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                      {getLocalizedText(relatedPost, 'title')}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {getLocalizedText(relatedPost, 'excerpt')}
                    </p>
                    <span className="text-blue-600 text-sm font-medium hover:text-blue-700">
                      {getTranslation('read_more')} →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
