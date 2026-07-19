import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell, Settings, LogOut, LucideIcon } from 'lucide-react';

/**
 * AppShell — coquille partagée des espaces internes OKAPIA.
 * Sidebar encre vert-profond, états actifs émeraude, header épuré.
 *
 * Utilisée par : DoctorLayout, PatientLayout, LaboratoryLayout, PharmacyLayout.
 */

export interface AppMenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface AppShellProps {
  /** Ex. "Espace Médecin" */
  spaceLabel: string;
  /** Titre du header, ex. "Bienvenue, Dr. Jean Kabila" */
  greeting: string;
  menuItems: AppMenuItem[];
  /** Lien Paramètres (optionnel) */
  settingsPath?: string;
  onSignOut: () => void;
  /** Initiales pour l'avatar */
  initials?: string;
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  spaceLabel,
  greeting,
  menuItems,
  settingsPath,
  onSignOut,
  initials,
  notifications,
  unreadCount,
  markAsRead,
}) => {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-sand font-sans">
      {/* ===== Sidebar ===== */}
      <aside className="w-64 bg-ink flex flex-col relative overflow-hidden">
        <div
          className="okapi-stripes absolute bottom-0 left-0 w-full h-24 text-white opacity-[0.04] pointer-events-none"
          aria-hidden="true"
        />

        <div className="p-6">
          <h1 className="font-display font-semibold text-lg text-white tracking-tight">
            OKAPIA <span className="text-brand-300">Medical</span>
          </h1>
          <p className="eyebrow eyebrow--light mt-2">{spaceLabel}</p>
        </div>

        <nav className="flex-1 px-3 space-y-1 relative">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`w-1 h-5 rounded-full transition-colors ${active ? 'bg-brand-400' : 'bg-transparent'}`} />
                <Icon className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1 relative">
          {settingsPath && (
            <Link
              to={settingsPath}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="w-1 h-5" />
              <Settings className="w-[18px] h-[18px]" />
              <span>Paramètres</span>
            </Link>
          )}
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <span className="w-1 h-5" />
            <LogOut className="w-[18px] h-[18px]" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ===== Contenu ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-line px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg text-ink">{greeting}</h2>
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mt-0.5">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-ink-muted hover:text-ink hover:bg-sand rounded-full transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-brand-600 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 card z-50 max-h-96 overflow-y-auto animate-fade-in">
                  <div className="px-4 py-3 border-b border-line">
                    <h3 className="font-display font-semibold text-sm text-ink">Notifications</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-ink-muted">
                      Aucune notification
                    </div>
                  ) : (
                    <div className="divide-y divide-line">
                      {notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-sand cursor-pointer transition-colors ${
                            !notification.read ? 'bg-brand-50/60' : ''
                          }`}
                          onClick={() => {
                            markAsRead(notification.id);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-ink">{notification.title}</h4>
                              <p className="text-sm text-ink-muted mt-0.5 line-clamp-2">{notification.message}</p>
                            </div>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-brand-600 rounded-full mt-1.5 shrink-0" />
                            )}
                          </div>
                          <p className="font-mono text-[10px] text-ink-muted/70 mt-1.5">
                            {new Date(notification.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Avatar */}
            {initials && (
              <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {initials}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
