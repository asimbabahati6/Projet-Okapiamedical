import { useCallback, useRef } from 'react';
import { useNavigate, useLocation, type NavigateOptions } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Route constants — source unique de vérité pour les chemins de l'application
// ---------------------------------------------------------------------------

export const ROUTES = {
  // Public
  HOME: '/',
  SERVICES: '/services',
  DOCTORS: '/medecins',
  ABOUT: '/a-propos',
  CONTACT: '/contact',
  APPOINTMENTS: '/rendez-vous',
  NEWS: '/actualites',
  NEWS_DETAIL: (slugOrId: string) => `/actualites/${slugOrId}`,
  FEEDBACK: '/feedback',
  PATIENT_REGISTRATION: '/inscription-patient',

  // Auth
  STAFF_LOGIN: '/admin',
  STAFF_REGISTER: '/register',
  CHANGE_PASSWORD: '/changer-mot-de-passe',

  // Staff — dashboard racine par rôle
  DASHBOARD: '/staff/dashboard',
  DRC_DASHBOARD: '/staff/drc',

  // Patients
  PATIENTS: '/staff/patients',
  PATIENT_CHECKIN: '/staff/checkin',

  // Médical
  APPOINTMENTS_STAFF: '/staff/appointments',
  CONSULTATIONS: '/staff/consultations',
  CONSULTATION_HISTORY: '/staff/consultation-history',
  PRESCRIPTIONS: '/staff/prescriptions',
  DOCUMENTS: '/staff/documents',

  // Spécialités
  LABORATORY: '/staff/laboratory',
  RADIOLOGY: '/staff/radiology',
  PHARMACY: '/staff/pharmacy',

  // Facturation & Finance
  BILLING: '/staff/billing',
  BILLING_ANALYTICS: '/staff/billing/analytics',
  FINANCIAL_ANALYTICS: '/staff/finances',
  EXPENSES: '/staff/expenses',

  // Ressources humaines
  EMPLOYEES: '/staff/employees',
  PAYROLL: '/staff/payroll',
  CONTRACTS: '/staff/contracts',
  SHIFT_SCHEDULING: '/staff/shifts',
  SMART_PUNCH: '/staff/smart-punch',
  BREAK_COMPLIANCE: '/staff/break-compliance',

  // Logistique
  LOGISTICS: '/staff/logistics',
  TRANSPORT: '/staff/transport',
  SUPPLIERS: '/staff/suppliers',
  PURCHASE_ORDERS: '/staff/purchase-orders',

  // Communication
  OKAPIA_CONNECT: '/staff/connect',
  MESSAGING: '/staff/messaging',

  // Administration
  SETTINGS: '/staff/settings',
  ROLE_MANAGEMENT: '/staff/roles',
  POSTS: '/staff/posts',
  FEEDBACK_DASHBOARD: '/staff/feedback',
  DOCTORS_DASHBOARD: '/staff/doctors',
  INSURANCE: '/staff/insurance',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export interface NavigationHistoryEntry {
  path: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Hook principal : useNavigationService
// ---------------------------------------------------------------------------

/**
 * Hook de navigation encapsulant useNavigate de React Router.
 * Expose des méthodes nommées et typage fort sur les routes.
 *
 * @example
 * const nav = useNavigationService();
 * nav.goTo(ROUTES.PATIENTS);
 * nav.goBack();
 * nav.goToWithState(ROUTES.BILLING, { invoiceId: '123' });
 */
export function useNavigationService() {
  const navigate = useNavigate();
  const location = useLocation();

  const goTo = useCallback(
    (path: string, options?: NavigateOptions) => {
      navigate(path, options);
    },
    [navigate]
  );

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const goForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  const goToWithState = useCallback(
    (path: string, state: Record<string, unknown>, options?: NavigateOptions) => {
      navigate(path, { state, ...options });
    },
    [navigate]
  );

  const replace = useCallback(
    (path: string, options?: Omit<NavigateOptions, 'replace'>) => {
      navigate(path, { replace: true, ...options });
    },
    [navigate]
  );

  const isCurrentPath = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const isCurrentSection = useCallback(
    (sectionPrefix: string) => location.pathname.startsWith(sectionPrefix),
    [location.pathname]
  );

  return {
    currentPath: location.pathname,
    locationState: location.state as Record<string, unknown> | null,
    goTo,
    goBack,
    goForward,
    goToWithState,
    replace,
    isCurrentPath,
    isCurrentSection,
  };
}

// ---------------------------------------------------------------------------
// Hook : useNavigationHistory — historique interne côté client
// ---------------------------------------------------------------------------

/**
 * Maintient un historique des pages visitées dans la session courante.
 * Limité à maxEntries entrées pour éviter les fuites mémoire.
 *
 * @example
 * const { history, canGoBack, currentEntry } = useNavigationHistory();
 */
export function useNavigationHistory(maxEntries = 20) {
  const location = useLocation();
  const historyRef = useRef<NavigationHistoryEntry[]>([]);

  const current: NavigationHistoryEntry = {
    path: location.pathname,
    timestamp: Date.now(),
  };

  // Append only if path changed since last entry
  const last = historyRef.current[historyRef.current.length - 1];
  if (!last || last.path !== current.path) {
    historyRef.current = [...historyRef.current.slice(-(maxEntries - 1)), current];
  }

  return {
    history: historyRef.current,
    canGoBack: historyRef.current.length > 1,
    currentEntry: current,
  };
}

// ---------------------------------------------------------------------------
// Hook : useLocationState — accès typé à l'état de navigation
// ---------------------------------------------------------------------------

/**
 * Accède à l'état de navigation de React Router avec typage générique.
 *
 * @example
 * const state = useLocationState<{ invoiceId: string }>();
 * console.log(state?.invoiceId);
 */
export function useLocationState<T extends Record<string, unknown>>(): T | null {
  const location = useLocation();
  return (location.state as T) ?? null;
}
