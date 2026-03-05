export type UserRole = 'admin' | 'medical_director' | 'doctor' | 'administrative' | 'hr_admin' | 'accountant' | 'operations' | 'receptionist' | 'laboratory' | 'pharmacist' | 'logistician' | 'directeur_general' | 'medecin_chef_staff' | 'gestionnaire' | 'radio_chef' | 'radio_tech' | 'caissiere' | 'technique' | 'hygiene' | 'super_admin' | 'hospital_admin' | 'administrative_staff' | 'nurse' | 'lab_technician' | 'dentist' | 'physical_therapist' | 'hr_manager' | 'finance_manager' | 'operations_manager' | 'administrative_director' | 'administrative_officer' | 'administrative_assistant' | 'information_systems_coordinator';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
  roles: UserRole[];
  category?: 'medical' | 'administrative' | 'commercial';
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  medical_director: 'Médecin Directeur',
  doctor: 'Médecin',
  administrative: 'Administratif/RH',
  hr_admin: 'Responsable RH',
  accountant: 'Comptable',
  operations: 'Responsable Opérations',
  receptionist: 'Réceptionniste',
  laboratory: 'Laboratoire',
  pharmacist: 'Pharmacien',
  logistician: 'Logisticien',
  directeur_general: 'Directeur Général',
  medecin_chef_staff: 'Médecin Chef de Staff',
  gestionnaire: 'Gestionnaire',
  radio_chef: 'Chef Radiologie',
  radio_tech: 'Technicien Radiologie',
  caissiere: 'Caissière',
  technique: 'Technicien',
  hygiene: 'Agent d\'Hygiène',
  super_admin: 'Super Administrateur',
  hospital_admin: 'Administrateur Hôpital',
  administrative_staff: 'Personnel Administratif',
  nurse: 'Infirmier(ère)',
  lab_technician: 'Technicien Laboratoire',
  dentist: 'Dentiste',
  physical_therapist: 'Kinésithérapeute',
  hr_manager: 'Responsable RH',
  finance_manager: 'Responsable Finances',
  operations_manager: 'Responsable Opérations',
  administrative_director: 'Directeur Administratif',
  administrative_officer: 'Agent Administratif',
  administrative_assistant: 'Assistant Administratif',
  information_systems_coordinator: 'Coordinateur Systèmes d\'Information'
};

export const MENU_STRUCTURE: MenuItem[] = [
  {
    id: 'medical_pole',
    label: 'Pôle Médical',
    icon: 'Activity',
    category: 'medical',
    roles: ['admin', 'medical_director', 'doctor', 'receptionist', 'directeur_general', 'medecin_chef_staff', 'radio_chef', 'radio_tech'],
    children: [
      {
        id: 'patients',
        label: 'Gestion des Patients',
        icon: 'Users',
        path: '/staff/patients',
        roles: ['admin', 'medical_director', 'doctor', 'receptionist']
      },
      {
        id: 'appointments',
        label: 'Rendez-vous',
        icon: 'Calendar',
        path: '/staff/appointments',
        roles: ['admin', 'medical_director', 'doctor', 'receptionist']
      },
      {
        id: 'consultations',
        label: 'Consultations',
        icon: 'Stethoscope',
        path: '/staff/consultations',
        roles: ['admin', 'medical_director', 'doctor']
      },
      {
        id: 'medical_staff',
        label: 'Personnel Médical',
        icon: 'UserCog',
        path: '/staff/doctors-dashboard',
        roles: ['admin', 'medical_director']
      },
      {
        id: 'prescriptions',
        label: 'Ordonnances',
        icon: 'FileText',
        path: '/staff/prescriptions',
        roles: ['admin', 'medical_director', 'doctor']
      },
      {
        id: 'medical_services',
        label: 'Services Médicaux',
        icon: 'Briefcase',
        roles: ['admin', 'medical_director', 'doctor', 'laboratory', 'pharmacist', 'directeur_general', 'medecin_chef_staff', 'radio_chef', 'radio_tech'],
        children: [
          {
            id: 'laboratory',
            label: 'Laboratoire',
            icon: 'FlaskConical',
            path: '/staff/laboratory',
            roles: ['admin', 'medical_director', 'doctor', 'laboratory']
          },
          {
            id: 'radiology',
            label: 'Radiologie',
            icon: 'Activity',
            path: '/staff/radiology',
            roles: ['admin', 'medical_director', 'doctor', 'directeur_general', 'medecin_chef_staff', 'radio_chef', 'radio_tech']
          },
          {
            id: 'pharmacy',
            label: 'Pharmacie',
            icon: 'Pill',
            path: '/staff/pharmacy',
            roles: ['admin', 'medical_director', 'doctor', 'pharmacist', 'directeur_general']
          },
          {
            id: 'pharmacy_inventory',
            label: 'Stock Pharmacie',
            icon: 'Package',
            path: '/staff/pharmacy-inventory',
            roles: ['admin', 'pharmacist', 'directeur_general']
          }
        ]
      }
    ]
  },
  {
    id: 'administrative_pole',
    label: 'Pôle Administratif',
    icon: 'Building2',
    category: 'administrative',
    roles: ['admin', 'administrative', 'hr_admin', 'operations', 'receptionist'],
    children: [
      {
        id: 'admin_staff',
        label: 'Personnel Administratif',
        icon: 'Users',
        path: '/staff/employees',
        roles: ['admin', 'administrative', 'hr_admin']
      },
      {
        id: 'reception',
        label: 'Réception & Accueil',
        icon: 'DoorOpen',
        path: '/staff/patient-checkin',
        roles: ['admin', 'administrative', 'hr_admin', 'receptionist']
      },
      {
        id: 'hr_services',
        label: 'Ressources Humaines',
        icon: 'UserCheck',
        roles: ['admin', 'administrative', 'hr_admin'],
        children: [
          {
            id: 'unified_personnel',
            label: 'Annuaire du Personnel',
            icon: 'BookUser',
            path: '/staff/unified-personnel',
            roles: ['admin', 'administrative', 'hr_admin']
          },
          {
            id: 'shift_scheduling',
            label: 'Planning des Équipes',
            icon: 'CalendarClock',
            path: '/staff/shift-scheduling',
            roles: ['admin', 'administrative', 'hr_admin']
          },
          {
            id: 'smart_punch_dashboard',
            label: 'Tableau Pointage RH',
            icon: 'BarChart3',
            path: '/staff/smart-punch-dashboard',
            roles: ['admin', 'super_admin', 'hospital_admin', 'administrative', 'hr_admin', 'hr_manager', 'administrative_staff', 'administrative_director', 'directeur_general', 'medecin_chef_staff']
          },
          {
            id: 'hr_contracts',
            label: 'Contrats Personnel',
            icon: 'FileText',
            path: '/staff/contracts',
            roles: ['admin', 'administrative', 'hr_admin']
          }
        ]
      }
    ]
  },
  {
    id: 'logistics_pole',
    label: 'Pôle Logistique',
    icon: 'Package',
    category: 'administrative',
    roles: ['admin', 'logistician'],
    children: [
      {
        id: 'logistics',
        label: 'Logistique & Stocks',
        icon: 'Warehouse',
        path: '/staff/logistics',
        roles: ['admin', 'logistician']
      },
      {
        id: 'suppliers',
        label: 'Fournisseurs',
        icon: 'Store',
        path: '/staff/suppliers',
        roles: ['admin', 'logistician']
      },
      {
        id: 'transport',
        label: 'Transport',
        icon: 'Truck',
        path: '/staff/transport',
        roles: ['admin', 'logistician']
      },
      {
        id: 'facilities',
        label: 'Installations',
        icon: 'Building',
        path: '/staff/facilities',
        roles: ['admin', 'logistician']
      },
      {
        id: 'purchase_orders',
        label: 'Bons de Commande',
        icon: 'FileCheck',
        path: '/staff/purchase-orders',
        roles: ['admin', 'logistician']
      }
    ]
  },
  {
    id: 'commercial_pole',
    label: 'Pôle Commercial & Finance',
    icon: 'DollarSign',
    category: 'commercial',
    roles: ['admin', 'accountant'],
    children: [
      {
        id: 'billing',
        label: 'Facturation',
        icon: 'FileText',
        path: '/staff/billing',
        roles: ['admin', 'accountant', 'operations']
      },
      {
        id: 'financial_analytics',
        label: 'Tableau de Bord Financier',
        icon: 'LayoutDashboard',
        path: '/staff/financial-analytics',
        roles: ['admin', 'accountant', 'operations']
      },
      {
        id: 'expenses',
        label: 'Gestion des Dépenses',
        icon: 'Receipt',
        path: '/staff/expenses',
        roles: ['admin', 'accountant', 'operations']
      },
      {
        id: 'insurance',
        label: 'Assurances',
        icon: 'Shield',
        path: '/staff/insurance',
        roles: ['admin', 'accountant', 'operations']
      },
      {
        id: 'payroll',
        label: 'Paie',
        icon: 'Wallet',
        path: '/staff/payroll',
        roles: ['admin', 'administrative', 'hr_admin', 'accountant']
      }
    ]
  },
  {
    id: 'feedback_dashboard',
    label: 'Satisfaction Patients',
    icon: 'Star',
    path: '/staff/feedback',
    category: 'administrative',
    roles: ['admin', 'super_admin', 'hospital_admin', 'medical_director', 'medecin_chef_staff', 'directeur_general']
  },
  {
    id: 'smart_punch',
    label: 'Smart Punch',
    icon: 'Fingerprint',
    path: '/staff/smart-punch',
    category: 'administrative',
    roles: ['admin', 'super_admin', 'hospital_admin', 'medical_director', 'administrative_director', 'administrative_staff', 'administrative_officer', 'administrative_assistant', 'administrative', 'hr_admin', 'hr_manager', 'finance_manager', 'operations_manager', 'information_systems_coordinator', 'doctor', 'dentist', 'physical_therapist', 'nurse', 'receptionist', 'laboratory', 'lab_technician', 'pharmacist', 'logistician', 'directeur_general', 'medecin_chef_staff', 'gestionnaire', 'radio_chef', 'radio_tech', 'caissiere', 'technique', 'hygiene', 'accountant', 'operations']
  },
  {
    id: 'okapia_connect',
    label: 'OKAPIA Connect',
    icon: 'MessageSquare',
    path: '/staff/okapia-connect',
    category: 'administrative',
    roles: ['admin', 'medical_director', 'doctor', 'administrative', 'hr_admin', 'accountant', 'operations', 'receptionist', 'laboratory', 'pharmacist', 'logistician', 'directeur_general', 'medecin_chef_staff', 'gestionnaire', 'radio_chef', 'radio_tech', 'caissiere', 'technique', 'hygiene']
  },
  {
    id: 'system',
    label: 'Système',
    icon: 'Settings',
    category: 'administrative',
    roles: ['admin', 'medical_director'],
    children: [
      {
        id: 'settings',
        label: 'Paramètres',
        icon: 'Settings',
        path: '/staff/settings',
        roles: ['admin', 'medical_director']
      },
      {
        id: 'doctor_visibility',
        label: 'Visibilité Médecins',
        icon: 'Eye',
        path: '/staff/doctor-visibility',
        roles: ['admin', 'medical_director']
      },
      {
        id: 'drc_dashboard',
        label: 'Tableau de Bord RDC',
        icon: 'LayoutDashboard',
        path: '/staff/drc-dashboard',
        roles: ['admin', 'medical_director']
      },
      {
        id: 'posts',
        label: 'Gestion des Actualités',
        icon: 'Newspaper',
        path: '/staff/posts',
        roles: ['admin', 'medical_director']
      },
      {
        id: 'role_management',
        label: 'Gestion des Rôles',
        icon: 'Shield',
        path: '/staff/role-management',
        roles: ['admin', 'medical_director', 'hr_admin']
      }
    ]
  }
];

export function hasAccess(userRole: UserRole, menuItem: MenuItem): boolean {
  return menuItem.roles.includes(userRole) || userRole === 'admin';
}

export function filterMenuByRole(menu: MenuItem[], userRole: UserRole): MenuItem[] {
  return menu
    .filter(item => hasAccess(userRole, item))
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: filterMenuByRole(item.children, userRole)
        };
      }
      return item;
    })
    .filter(item => !item.children || item.children.length > 0);
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  medical_director: [
    '*_medical',
    'view_patients',
    'edit_patients',
    'view_appointments',
    'create_appointments',
    'edit_appointments',
    'view_consultations',
    'create_consultations',
    'edit_consultations',
    'view_prescriptions',
    'create_prescriptions',
    'edit_all_prescriptions',
    'view_lab_orders',
    'create_lab_orders',
    'view_medical_staff',
    'manage_medical_staff',
    'view_doctor_visibility',
    'edit_doctor_visibility',
    'view_posts',
    'edit_posts',
    'simulate_roles',
    'view_role_management',
    'lab_full_access',
    'lab_edit_results',
    'lab_validate_results',
    'lab_manage_equipment',
    'pharmacy_full_access',
    'pharmacy_manage_inventory',
    'radiology_full_control',
    'radiology_validate_reports',
    'radiology_view_all'
  ],
  doctor: [
    'view_patients',
    'edit_patients',
    'view_appointments',
    'create_appointments',
    'view_consultations',
    'create_consultations',
    'view_prescriptions',
    'create_prescriptions',
    'edit_own_prescriptions',
    'view_lab_orders',
    'create_lab_orders',
    'lab_dashboard_view',
    'lab_create_orders',
    'pharmacy_view_availability',
    'radiology_prescribe',
    'radiology_view_all'
  ],
  administrative: [
    'view_employees',
    'edit_employees',
    'view_hr',
    'edit_hr',
    'view_reception',
    'view_payroll'
  ],
  hr_admin: [
    'view_employees',
    'edit_employees',
    'create_employees',
    'delete_employees',
    'view_hr',
    'edit_hr',
    'view_reception',
    'view_payroll',
    'edit_payroll',
    'view_contracts',
    'edit_contracts',
    'view_shift_scheduling',
    'edit_shift_scheduling',
    'view_break_compliance',
    'edit_break_compliance',
    'simulate_roles',
    'view_role_management'
  ],
  accountant: [
    'view_billing',
    'edit_billing',
    'view_analytics',
    'view_contracts',
    'edit_contracts',
    'view_insurance',
    'edit_insurance',
    'view_payroll',
    'edit_payroll',
    'view_exchange_rates',
    'edit_exchange_rates',
    'view_expenses',
    'edit_expenses'
  ],
  operations: [
    'view_logistics',
    'view_facilities',
    'view_transport',
    'view_suppliers',
    'view_billing',
    'view_analytics',
    'view_expenses',
    'edit_expenses',
    'view_contracts'
  ],
  receptionist: [
    'view_patients',
    'create_patients',
    'view_appointments',
    'create_appointments',
    'checkin_patients'
  ],
  laboratory: [
    'view_lab_orders',
    'edit_lab_orders',
    'view_results',
    'create_results',
    'lab_full_access',
    'lab_edit_results',
    'lab_validate_results',
    'lab_manage_equipment',
    'lab_create_orders'
  ],
  pharmacist: [
    'view_prescriptions',
    'dispense_medications',
    'view_pharmacy_inventory',
    'edit_pharmacy_inventory',
    'pharmacy_full_access',
    'pharmacy_dispense',
    'pharmacy_manage_inventory',
    'pharmacy_receive_orders'
  ],
  logistician: [
    'view_logistics',
    'edit_logistics',
    'view_inventory',
    'edit_inventory',
    'view_suppliers',
    'edit_suppliers',
    'view_transport',
    'edit_transport',
    'view_facilities',
    'edit_facilities',
    'view_purchase_orders',
    'create_purchase_orders',
    'edit_purchase_orders'
  ],
  directeur_general: [
    '*',
    'simulate_roles',
    'modify_invoices',
    'cancel_invoices',
    'access_all_financial_reports',
    'modify_consultation_rates',
    'view_all_medical_services',
    'manage_all_departments',
    'force_end_simulation'
  ],
  medecin_chef_staff: [
    '*_medical',
    'view_all_medical_services',
    'generate_medical_reports',
    'manage_medical_quality',
    'view_medical_statistics',
    'manage_medical_planning',
    'validate_radiology_reports',
    'view_patients',
    'edit_patients',
    'view_appointments',
    'create_appointments',
    'view_consultations',
    'create_consultations',
    'view_prescriptions',
    'edit_all_prescriptions',
    'view_lab_orders',
    'view_medical_staff',
    'manage_medical_staff',
    'view_doctor_visibility',
    'edit_doctor_visibility',
    'lab_full_access',
    'lab_validate_results',
    'pharmacy_full_access',
    'radiology_full_control',
    'radiology_validate_reports',
    'radiology_view_all'
  ],
  gestionnaire: [
    'simulate_roles',
    'view_billing',
    'view_treasury',
    'manage_operational_budget',
    'manage_expenses',
    'view_expenses',
    'edit_expenses',
    'view_hr',
    'edit_hr',
    'approve_supply_orders',
    'view_global_balance_sheets',
    'view_cash_flow',
    'view_employees',
    'edit_employees',
    'view_payroll',
    'edit_payroll',
    'view_contracts',
    'edit_contracts',
    'view_analytics'
  ],
  caissiere: [
    'manage_transactions',
    'validate_payments',
    'access_cash_register',
    'view_daily_transactions',
    'view_billing',
    'create_invoices',
    'view_patients'
  ],
  technique: [
    'manage_equipment_maintenance',
    'manage_infrastructure',
    'view_technical_inventory',
    'create_maintenance_tickets',
    'update_equipment_status',
    'view_facilities',
    'edit_facilities'
  ],
  radio_chef: [
    'manage_radiology_department',
    'validate_radiology_reports',
    'manage_exam_schedule',
    'delete_radiology_records',
    'manage_imaging_equipment',
    'view_patients',
    'view_appointments',
    'upload_radiology_images',
    'create_technical_notes',
    'edit_radiology_reports',
    'radiology_perform_exams',
    'radiology_upload_images',
    'radiology_write_reports',
    'radiology_validate_reports',
    'radiology_view_all'
  ],
  radio_tech: [
    'upload_radiology_images',
    'create_technical_notes',
    'view_exam_schedule',
    'view_patients',
    'view_appointments',
    'radiology_perform_exams',
    'radiology_upload_images',
    'radiology_write_reports',
    'radiology_view_all'
  ],
  hygiene: [
    'view_hygiene_protocols',
    'create_cleaning_checklists',
    'submit_restock_requests',
    'view_hygiene_logs',
    'create_hygiene_reports'
  ]
};
