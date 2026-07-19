import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/core/contexts/NotificationContext';
import { AppShell } from '@/components/ui/AppShell';
import {
  LayoutDashboard,
  Package,
  FileText,
  AlertTriangle,
  ShoppingCart,
  BarChart3
} from 'lucide-react';

export const PharmacyLayout: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const menuItems = [
    { path: '/pharmacy/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { path: '/pharmacy/inventory', label: 'Inventaire', icon: Package },
    { path: '/pharmacy/prescriptions', label: 'Ordonnances', icon: FileText },
    { path: '/pharmacy/low-stock', label: 'Stock Bas', icon: AlertTriangle },
    { path: '/pharmacy/orders', label: 'Commandes', icon: ShoppingCart },
    { path: '/pharmacy/analytics', label: 'Analyses', icon: BarChart3 }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/staff/login');
  };

  return (
    <AppShell
      spaceLabel="Espace Pharmacie"
      greeting={`Pharmacie — ${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()}
      menuItems={menuItems}
      settingsPath="/pharmacy/settings"
      onSignOut={handleSignOut}
      initials={`${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`}
      notifications={notifications}
      unreadCount={unreadCount}
      markAsRead={markAsRead}
    />
  );
};
