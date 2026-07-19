import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/core/contexts/NotificationContext';
import { AppShell } from '@/components/ui/AppShell';
import {
  LayoutDashboard,
  Calendar,
  FlaskConical,
  FileText,
  History,
  User
} from 'lucide-react';

export const PatientLayout: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const menuItems = [
    { path: '/patient/dashboard', label: 'Accueil', icon: LayoutDashboard },
    { path: '/patient/appointments', label: 'Rendez-vous', icon: Calendar },
    { path: '/patient/results', label: 'Résultats', icon: FlaskConical },
    { path: '/patient/prescriptions', label: 'Ordonnances', icon: FileText },
    { path: '/patient/history', label: 'Historique', icon: History },
    { path: '/patient/profile', label: 'Mon profil', icon: User }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/staff/login');
  };

  return (
    <AppShell
      spaceLabel="Espace Patient"
      greeting={`Bonjour, ${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()}
      menuItems={menuItems}
      onSignOut={handleSignOut}
      initials={`${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`}
      notifications={notifications}
      unreadCount={unreadCount}
      markAsRead={markAsRead}
    />
  );
};
