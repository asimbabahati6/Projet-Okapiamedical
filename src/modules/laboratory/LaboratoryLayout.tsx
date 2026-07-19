import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/core/contexts/NotificationContext';
import { AppShell } from '@/components/ui/AppShell';
import {
  LayoutDashboard,
  ListChecks,
  FlaskConical,
  History,
  Package
} from 'lucide-react';

export const LaboratoryLayout: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const menuItems = [
    { path: '/laboratory/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/laboratory/queue', label: 'File d\'attente', icon: ListChecks },
    { path: '/laboratory/results', label: 'Saisie résultats', icon: FlaskConical },
    { path: '/laboratory/history', label: 'Historique', icon: History },
    { path: '/laboratory/equipment', label: 'Équipements', icon: Package }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/staff/login');
  };

  return (
    <AppShell
      spaceLabel="Espace Laboratoire"
      greeting={`Laboratoire — ${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()}
      menuItems={menuItems}
      settingsPath="/laboratory/settings"
      onSignOut={handleSignOut}
      initials={`${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`}
      notifications={notifications}
      unreadCount={unreadCount}
      markAsRead={markAsRead}
    />
  );
};
