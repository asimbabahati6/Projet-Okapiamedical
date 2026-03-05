import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, XCircle, Clock, RefreshCw, Search, Calendar } from 'lucide-react';
import { getSMSNotifications, retrySMS } from '../../services/smsService';

interface SMSNotificationLogProps {
  labOrderId?: string;
  recipientId?: string;
}

export function SMSNotificationLog({ labOrderId, recipientId }: SMSNotificationLogProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [labOrderId, recipientId, statusFilter]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const filters: any = {};

      if (recipientId) {
        filters.recipientId = recipientId;
      }

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (labOrderId) {
        filters.relatedRecordId = labOrderId;
        filters.relatedRecordType = 'lab_order';
      }

      const data = await getSMSNotifications(filters);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching SMS notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRetry(smsId: string) {
    setRetrying(smsId);
    try {
      const result = await retrySMS(smsId);
      if (result.success) {
        alert('SMS renvoyé avec succès !');
        fetchNotifications();
      } else {
        alert(`Erreur lors du renvoi: ${result.error}`);
      }
    } catch (error) {
      console.error('Error retrying SMS:', error);
      alert('Une erreur est survenue lors du renvoi');
    } finally {
      setRetrying(null);
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      notif.recipient_phone?.toLowerCase().includes(searchLower) ||
      notif.message?.toLowerCase().includes(searchLower) ||
      notif.patient?.first_name?.toLowerCase().includes(searchLower) ||
      notif.patient?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
      case 'queued':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      queued: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      queued: 'En file',
      sent: 'Envoyé',
      delivered: 'Délivré',
      failed: 'Échec',
      cancelled: 'Annulé'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              Journal des Notifications SMS
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {notifications.length} notification{notifications.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par téléphone, patient, message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="sent">Envoyé</option>
            <option value="delivered">Délivré</option>
            <option value="failed">Échec</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification SMS</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all'
                ? 'Aucun résultat pour ces critères de recherche'
                : 'Les notifications SMS apparaîtront ici'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNotifications.map((notif) => (
                <tr key={notif.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(notif.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(notif.status)}`}>
                        {getStatusLabel(notif.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {notif.patient ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {notif.patient.first_name} {notif.patient.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {notif.patient.patient_number}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {notif.recipient_phone}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900 truncate" title={notif.message}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notif.message.length} caractères
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                      {notif.notification_type === 'lab_result_ready' ? 'Résultat labo' :
                       notif.notification_type === 'lab_result_ready_urgent' ? 'Résultat urgent' :
                       notif.notification_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(notif.created_at)}
                    </div>
                    {notif.sent_at && (
                      <div className="text-xs text-gray-400 mt-1">
                        Envoyé: {formatDate(notif.sent_at)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {notif.status === 'failed' && notif.retry_count < 3 && (
                      <button
                        onClick={() => handleRetry(notif.id)}
                        disabled={retrying === notif.id}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className={`w-4 h-4 ${retrying === notif.id ? 'animate-spin' : ''}`} />
                        {retrying === notif.id ? 'Renvoi...' : 'Réessayer'}
                      </button>
                    )}
                    {notif.error_message && (
                      <div className="mt-2 text-xs text-red-600 max-w-xs truncate" title={notif.error_message}>
                        Erreur: {notif.error_message}
                      </div>
                    )}
                    {notif.retry_count > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        {notif.retry_count} tentative{notif.retry_count > 1 ? 's' : ''}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
