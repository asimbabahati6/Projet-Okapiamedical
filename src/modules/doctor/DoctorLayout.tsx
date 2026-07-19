import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/core/contexts/NotificationContext';
import { AppShell } from '@/components/ui/AppShell';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  FlaskConical,
  Calendar
} from 'lucide-react';

export const DoctorLayout: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const menuItems = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctor/patients', label: 'Dossiers Patients', icon: Users },
    { path: '/doctor/consultations', label: 'Consultations', icon: ClipboardList },
    { path: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
    { path: '/doctor/lab-orders', label: 'Analyses', icon: FlaskConical },
    { path: '/doctor/schedule', label: 'Agenda', icon: Calendar }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/staff/login');
  };

  return (
    <AppShell
      spaceLabel="Espace Médecin"
      greeting={`Bienvenue, Dr. ${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()}
      menuItems={menuItems}
      settingsPath="/doctor/settings"
      onSignOut={handleSignOut}
      initials={`${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`}
      notifications={notifications}
      unreadCount={unreadCount}
      markAsRead={markAsRead}
    />
  );
};
