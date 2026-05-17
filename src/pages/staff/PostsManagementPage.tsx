import { useState, useEffect } from 'react';
import {
  Plus, RefreshCw, Edit, Trash2, Search, Filter,
  Image as ImageIcon, Calendar, User, Tag, FileText, Upload,
  Share2, CheckCircle, Globe
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';
import { PostForm } from '../../components/posts/PostForm';
import { ImportNewsModal } from '../../components/posts/ImportNewsModal';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  category_id: string;
  category?: {
    name: string;
    description: string;
  };
  tags: string[];
  author_id: string;
  author?: {
    full_name: string;
  };
  status: 'brouillon' | 'publié' | 'archivé';
  published_at: string | null;
  shared_networks?: string[];
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

function fireWebhook(post: Post, categories: Category[]) {
  const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;
  if (!webhookUrl) return Promise.resolve(false);

  const plain = post.content.replace(/<[^>]+>/g, '');
  const summary = plain.length > 280 ? plain.substring(0, 280) : plain;
  const payload = {
    title: post.title,
    summary,
    image_url: post.image_url || null,
    article_url: `https://www.okapiamedical.com/#news/${post.id}`,
    category: categories.find(c => c.id === post.category_id)?.name || '',
    published_at: new Date().toISOString(),
    networks: ['facebook', 'x', 'linkedin', 'whatsapp', 'instagram', 'tiktok', 'youtube'],
  };

  return fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(() => true).catch(() => false);
}

export function PostsManagementPage() {
  const { profile } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const postsPerPage = 20;

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('post_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      showError('Erreur lors du chargement des categories');
    }
  }

  async function fetchPosts() {
    try {
      setLoading(true);

      let query = supabase
        .from('posts')
        .select(`
          *,
          category:post_categories(name, description),
          author:user_profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      showError('Erreur lors du chargement des publications');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
    success('Publications actualisees');
  }

  async function handleDelete(postId: string) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      success('Publication supprimee avec succes');
      setShowDeleteModal(false);
      setSelectedPost(null);
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      showError('Erreur lors de la suppression de la publication');
    }
  }

  async function handleStatusChange(post: Post, newStatus: string) {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'publié' && !post.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', post.id);

      if (error) throw error;

      if (newStatus === 'publié') {
        await fireWebhook(post, categories);
        success('Article publie et partage sur les reseaux sociaux');
      } else {
        success(`Statut change en "${newStatus}"`);
      }
      fetchPosts();
    } catch (err) {
      showError('Erreur lors du changement de statut');
    }
  }

  async function handleRepublish(post: Post) {
    setSharingId(post.id);
    try {
      const sent = await fireWebhook(post, categories);
      if (sent) {
        success('Article repartage sur les reseaux sociaux');
      } else {
        showError('Webhook non configure (VITE_MAKE_WEBHOOK_URL manquant)');
      }
    } catch {
      showError('Erreur lors du partage');
    } finally {
      setSharingId(null);
    }
  }

  const filteredPosts = posts;
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    const styles = {
      brouillon: 'bg-gray-100 text-gray-700',
      'publié': 'bg-green-100 text-green-700',
      'archivé': 'bg-orange-100 text-orange-700',
    };
    return styles[status as keyof typeof styles] || styles.brouillon;
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Publications</h1>
            <p className="text-gray-600">Creez et gerez les publications du site web</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium">Actualiser</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Importer LinkedIn</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Nouvelle Publication</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyUp={(e) => {
                  if (e.key === 'Enter') fetchPosts();
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
                fetchPosts();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="publié">Publie</option>
              <option value="archivé">Archive</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
                fetchPosts();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <button
              onClick={fetchPosts}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filtrer</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des publications...</p>
          </div>
        </div>
      ) : currentPosts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune publication</h3>
          <p className="text-gray-600 mb-6">
            Commencez par creer votre premiere publication
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Creer une publication</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {currentPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{post.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {post.content.replace(/<[^>]+>/g, '').substring(0, 150)}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {post.status === 'publié' && (
                          <button
                            onClick={() => handleRepublish(post)}
                            disabled={sharingId === post.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Republier sur les reseaux"
                          >
                            <Share2 className={`w-5 h-5 ${sharingId === post.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-3">
                      {/* Status with change dropdown */}
                      <div className="relative group">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${getStatusBadge(post.status)}`}>
                          {post.status === 'publié' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </span>
                        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block min-w-[140px]">
                          {['brouillon', 'publié', 'archivé'].filter(s => s !== post.status).map(status => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(post, status)}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                            >
                              {status === 'publié' ? 'Publier' : status === 'archivé' ? 'Archiver' : 'Brouillon'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {post.status === 'publié' && (
                        <span className="flex items-center gap-1 text-green-600 text-xs">
                          <Globe className="w-3.5 h-3.5" />
                          Partage
                        </span>
                      )}

                      {post.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {post.category.name}
                        </span>
                      )}

                      {post.author && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.author.full_name}
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Precedent
              </button>

              <span className="px-4 py-2 text-gray-700">
                Page {currentPage} sur {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <PostForm
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            success('Publication creee avec succes');
            fetchPosts();
          }}
          onError={showError}
        />
      )}

      {showEditModal && selectedPost && (
        <PostForm
          post={selectedPost}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPost(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedPost(null);
            success('Publication modifiee avec succes');
            fetchPosts();
          }}
          onError={showError}
        />
      )}

      {showDeleteModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Etes-vous sur de vouloir supprimer la publication "{selectedPost.title}"?
              Cette action est irreversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPost(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(selectedPost.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer definitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportNewsModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            success('Contenu importe avec succes comme brouillon');
            fetchPosts();
          }}
          onError={showError}
          categories={categories}
        />
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
