import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, X, Check, CheckCheck, Trash2, AlertCircle, FileText, TestTube,
  Pill, AlertTriangle, DollarSign, Receipt, CreditCard, Upload
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../../utils/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { useRBAC } from '../../contexts/RBACContext';
import { useExchangeRate } from '../../hooks/useExchangeRate';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  is_read: boolean;
  created_at: string;
  action_url?: string;
  related_document_id?: string;
  related_document_type?: string;
  metadata?: Record<string, unknown>;
}

interface PendingInvoice {
  id: string;
  invoice_number: string;
  patient_name: string;
  balance: number;
  net_to_pay: number;
  created_at: string;
  actes: string[];
}

const BILLING_ROLES = [
  'super_admin', 'hospital_admin', 'directeur_general',
  'caissiere', 'receptionist', 'administrative', 'gestionnaire',
  'accountant', 'finance_manager', 'medecin_chef_staff'
];

export function NotificationCenter() {
  const { profile } = useAuth();
  const { actualRole, isSimulationMode, userRole } = useRBAC();
  const { usdToCdf } = useExchangeRate();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [dbNotifications, setDbNotifications] = useState<Notification[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const effectiveRole = isSimulationMode ? userRole : actualRole;
  const canSeeBilling = BILLING_ROLES.includes(effectiveRole || '');

  const loadAll = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const [notifs, invoices] = await Promise.all([
        getAllNotifications(profile.id, 50),
        canSeeBilling ? loadPendingInvoices() : Promise.resolve([]),
      ]);
      setDbNotifications(notifs);
      setPendingInvoices(invoices);
      setUnreadCount(notifs.filter((n: Notification) => !n.is_read).length + invoices.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, canSeeBilling]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`notif-center-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'actor_notifications',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          const n = payload.new as Notification;
          setDbNotifications(prev => [n, ...prev]);
          setUnreadCount(prev => prev + 1);
          if (n.priority === 'critical') playNotificationSound();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  useEffect(() => {
    if (!isOpen || !canSeeBilling) return;
    loadPendingInvoices().then(invoices => {
      setPendingInvoices(invoices);
      setUnreadCount(prev => {
        const dbUnread = dbNotifications.filter(n => !n.is_read).length;
        return dbUnread + invoices.length;
      });
    });
  }, [isOpen, canSeeBilling]);

  async function loadPendingInvoices(): Promise<PendingInvoice[]> {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number, patient_id, balance, net_to_pay, total_amount, created_at, status, type_facture, patients(first_name, last_name)')
      .in('status', ['pending', 'partial'])
      .neq('type_facture', 'conventionne')
      .gt('balance', 0)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data) return [];

    const invoiceIds = data.map((inv: Record<string, unknown>) => inv.id as string);
    let itemsMap: Record<string, string[]> = {};
    if (invoiceIds.length > 0) {
      const { data: items } = await supabase
        .from('invoice_items')
        .select('invoice_id, description')
        .in('invoice_id', invoiceIds);
      if (items) {
        for (const item of items) {
          const iid = item.invoice_id as string;
          if (!itemsMap[iid]) itemsMap[iid] = [];
          if (item.description) itemsMap[iid].push(item.description as string);
        }
      }
    }

    return data.map((inv: Record<string, unknown>) => {
      const patient = inv.patients as { first_name: string; last_name: string } | null;
      return {
        id: inv.id as string,
        invoice_number: (inv.invoice_number as string) || `INV-${String(inv.id).slice(0, 6)}`,
        patient_name: patient ? `${patient.last_name} ${patient.first_name}` : 'Patient',
        balance: Number(inv.balance || 0),
        net_to_pay: Number(inv.net_to_pay || inv.total_amount || 0),
        created_at: inv.created_at as string,
        actes: itemsMap[inv.id as string] || [],
      };
    });
  }

  function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKjl8bhmHQU2k9n0z3krBSl+zPLaizsKGGS57OihUxMNTKXh8bllHgU1k9j0z3ksBS2AzvLYizoIHGm88Oiaca');
    audio.play().catch(() => {});
  }

  async function handleMarkAsRead(notificationId: string) {
    await markNotificationAsRead(notificationId);
    setDbNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function handleMarkAllAsRead() {
    if (!profile?.id) return;
    await markAllNotificationsAsRead(profile.id);
    setDbNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(pendingInvoices.length);
  }

  async function handleDelete(notificationId: string) {
    const notification = dbNotifications.find(n => n.id === notificationId);
    await deleteNotification(notificationId);
    setDbNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notification && !notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }

  function handleInvoiceClick(invoiceId: string) {
    setIsOpen(false);
    navigate('/staff/billing', { state: { encaisserInvoiceId: invoiceId } });
  }

  function handleNotificationClick(n: Notification) {
    if (!n.is_read) handleMarkAsRead(n.id);
    if (n.action_url) {
      setIsOpen(false);
      navigate(n.action_url);
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'invoice_pending': return <Receipt className="w-4 h-4" />;
      case 'payment_received': return <CreditCard className="w-4 h-4" />;
      case 'invoice_partial': return <DollarSign className="w-4 h-4" />;
      case 'tarifs_imported': return <Upload className="w-4 h-4" />;
      case 'new_prescription':
      case 'prescription_dispensed': return <Pill className="w-4 h-4" />;
      case 'lab_order_created':
      case 'lab_result_ready': return <TestTube className="w-4 h-4" />;
      case 'critical_lab_value':
      case 'drug_interaction_warning': return <AlertTriangle className="w-4 h-4" />;
      case 'document_shared':
      case 'signature_required': return <FileText className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-600 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-600 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'A l\'instant';
    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  }

  function truncateActes(actes: string[], max = 2): string {
    if (actes.length === 0) return '';
    const shown = actes.slice(0, max).join(', ');
    const remaining = actes.length - max;
    return remaining > 0 ? `${shown} +${remaining} autre${remaining > 1 ? 's' : ''}` : shown;
  }

  const totalPendingUSD = pendingInvoices.reduce((sum, inv) => sum + inv.balance, 0);
  const totalPendingCDF = usdToCdf > 0 ? Math.round(totalPendingUSD * usdToCdf) : 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {dbNotifications.some(n => !n.is_read) && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pending invoices summary banner */}
            {canSeeBilling && pendingInvoices.length > 0 && (
              <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900">
                      {pendingInvoices.length} facture{pendingInvoices.length > 1 ? 's' : ''} en attente
                    </p>
                    <p className="text-xs text-amber-700">
                      {totalPendingUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
                      {totalPendingCDF > 0 && ` / ${totalPendingCDF.toLocaleString('fr-FR')} CDF`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Chargement...</div>
              ) : (pendingInvoices.length === 0 && dbNotifications.length === 0) ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <div>
                  {/* Pending invoices as notification cards */}
                  {canSeeBilling && pendingInvoices.map((inv) => (
                    <button
                      key={`inv-${inv.id}`}
                      onClick={() => handleInvoiceClick(inv.id)}
                      className="w-full text-left p-3 hover:bg-blue-50/50 transition-colors border-b border-gray-100 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg border bg-amber-50 text-amber-600 border-amber-200 flex-shrink-0">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {inv.patient_name}
                            </p>
                            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                              {formatTime(inv.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            <span className="font-mono text-gray-600">{inv.invoice_number}</span>
                            {inv.actes.length > 0 && (
                              <span className="ml-1.5">— {truncateActes(inv.actes)}</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-red-600">
                              {inv.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
                            </span>
                            {usdToCdf > 0 && (
                              <span className="text-xs text-gray-400">
                                {Math.round(inv.balance * usdToCdf).toLocaleString('fr-FR')} CDF
                              </span>
                            )}
                            <span className="ml-auto text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                              Encaisser &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Divider between invoices and notifications */}
                  {canSeeBilling && pendingInvoices.length > 0 && dbNotifications.length > 0 && (
                    <div className="px-4 py-2 bg-gray-50 border-y border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Historique</p>
                    </div>
                  )}

                  {/* DB notifications */}
                  {dbNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        !n.is_read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg border flex-shrink-0 ${getPriorityColor(n.priority)}`}>
                          {getNotificationIcon(n.notification_type)}
                        </div>
                        <div
                          className={`flex-1 min-w-0 ${n.action_url ? 'cursor-pointer' : ''}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {!n.is_read && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                  title="Marquer comme lu"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
