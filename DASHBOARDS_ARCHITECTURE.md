# Architecture des Tableaux de Bord - Vue Technique

## Vue d'Ensemble du Système

```
┌─────────────────────────────────────────────────────────────────┐
│                    OKAPIA Medical ERP System                     │
│                    Tableaux de Bord Spécialisés                  │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────┐
│   User Login       │
│   /staff/login     │
└─────────┬──────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Layer                         │
│                   (Supabase Auth + RBAC)                        │
└─────────┬───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Role-Based Redirect                           │
│                   (RBACNavigation.tsx)                          │
└─┬───┬───┬───┬───┬─────────────────────────────────────────────┬─┘
  │   │   │   │   │                                             │
  ▼   ▼   ▼   ▼   ▼                                             ▼
┌───┐ ┌──┐ ┌──┐ ┌──┐ ┌────┐                                  ┌────┐
│PHR│ │LAB│ │RAD│ │DOC│ │PAT│                                  │ADM │
└─┬─┘ └┬─┘ └┬─┘ └┬─┘ └─┬──┘                                  └─┬──┘
  │    │    │    │     │                                        │
  ▼    ▼    ▼    ▼     ▼                                        ▼
```

---

## Module Pharmacie

```
┌──────────────────────────────────────────────────────────────┐
│                    Pharmacy Module                            │
└──────────────────────────────────────────────────────────────┘

Route: /pharmacy/*

┌──────────────────────┐
│  PharmacyLayout      │ ← Layout avec sidebar bleue/cyan
│  (Sidebar + Header)  │
└─────────┬────────────┘
          │
          ├─ /dashboard ──────────────┐
          │                           ▼
          │              ┌─────────────────────────────┐
          │              │  PharmacyDashboard          │
          │              ├─────────────────────────────┤
          │              │ • 8 KPI Cards:              │
          │              │   - Total Médicaments       │
          │              │   - Stock Bas               │
          │              │   - Expiration Prochaine    │
          │              │   - Ordonnances Attente     │
          │              │   - Valeur Stock            │
          │              │   - Dispensées Aujourd'hui  │
          │              │   - Commandes à Passer      │
          │              │   - Taux de Service         │
          │              │                             │
          │              │ • Bannière d'alerte         │
          │              │ • Tableau ordonnances       │
          │              │ • Actions rapides           │
          │              │ • Métriques performance     │
          │              └─────────────────────────────┘
          │
          ├─ /inventory ──────────────┐
          │                           ▼
          │              ┌─────────────────────────────┐
          │              │  PharmacyInventoryPage      │
          │              │  (Gestion des stocks)       │
          │              └─────────────────────────────┘
          │
          └─ /inventory-management ──┐
                                     ▼
                        ┌─────────────────────────────┐
                        │  EnhancedPharmacyPage       │
                        │  (Vue complète détaillée)   │
                        └─────────────────────────────┘

Data Sources:
┌────────────────┐  ┌──────────────┐  ┌─────────────────┐
│  medications   │  │prescriptions │  │prescription_items│
│  (Inventory)   │  │  (Orders)    │  │   (Details)      │
└────────────────┘  └──────────────┘  └─────────────────┘
         │                  │                   │
         └──────────────────┴───────────────────┘
                            │
                            ▼
                  [ PharmacyDashboard ]
```

---

## Module Laboratoire

```
┌──────────────────────────────────────────────────────────────┐
│                   Laboratory Module                           │
└──────────────────────────────────────────────────────────────┘

Route: /laboratory/*

┌──────────────────────┐
│  LaboratoryLayout    │ ← Layout avec sidebar verte
│  (Sidebar + Header)  │
└─────────┬────────────┘
          │
          ├─ /dashboard ──────────────┐
          │                           ▼
          │              ┌─────────────────────────────┐
          │              │  LabDashboard               │
          │              ├─────────────────────────────┤
          │              │ • 5 KPI Cards:              │
          │              │   - En Attente              │
          │              │   - En Cours                │
          │              │   - Terminés                │
          │              │   - Validés                 │
          │              │   - Urgents                 │
          │              │                             │
          │              │ • Actions rapides:          │
          │              │   - File d'attente          │
          │              │   - Saisir résultats        │
          │              │   - Valider rapports        │
          │              │                             │
          │              │ • Permissions RBAC          │
          │              └─────────────────────────────┘
          │
          ├─ /queue ─────────────────┐
          ├─ /results ────────────────┤
          ├─ /equipment ──────────────┤
          └─ /history ────────────────┘

Data Sources:
┌────────────────┐  ┌──────────────┐  ┌─────────────────┐
│  lab_orders    │  │ lab_results  │  │  lab_equipment  │
└────────────────┘  └──────────────┘  └─────────────────┘
         │                  │                   │
         └──────────────────┴───────────────────┘
                            │
                            ▼
                    [ LabDashboard ]

Permissions:
┌─────────────────────────┐
│ useLabPermissions()     │
├─────────────────────────┤
│ • canViewAll            │
│ • canPerformTests       │
│ • canEnterResults       │
│ • canValidateResults    │
│ • hasFullControl        │
└─────────────────────────┘
```

---

## Module Radiologie

```
┌──────────────────────────────────────────────────────────────┐
│                   Radiology Module                            │
└──────────────────────────────────────────────────────────────┘

Route: /staff/radiology/*

┌──────────────────────┐
│  RadiologyLayout     │ ← Layout avec sidebar cyan
│  (Sidebar collapse)  │
└─────────┬────────────┘
          │
          ├─ /dashboard ──────────────┐
          │                           ▼
          │              ┌─────────────────────────────┐
          │              │  RadiologyDashboard         │
          │              ├─────────────────────────────┤
          │              │ • 5 KPI Cards:              │
          │              │   - En Attente              │
          │              │   - En Cours                │
          │              │   - Terminés                │
          │              │   - Validés                 │
          │              │   - Urgents                 │
          │              │                             │
          │              │ • Actions rapides:          │
          │              │   - Prescrire (Médecins)    │
          │              │   - File d'attente          │
          │              │   - Workspace (Techniciens) │
          │              │   - Visualiseur             │
          │              │                             │
          │              │ • Permissions dynamiques    │
          │              └─────────────────────────────┘
          │
          ├─ /prescribe ──────────────┐ (Médecins seulement)
          ├─ /queue ──────────────────┤
          ├─ /workspace/:id ──────────┤ (Techniciens/Radiologues)
          ├─ /viewer/:id ─────────────┤
          └─ /history ────────────────┘

Data Sources:
┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│ radiology_exams│  │radiology_reports │  │ radiology_images│
└────────────────┘  └──────────────────┘  └─────────────────┘
         │                  │                       │
         └──────────────────┴───────────────────────┘
                            │
                            ▼
                 [ RadiologyDashboard ]

Permissions:
┌─────────────────────────────┐
│ useRadiologyPermissions()   │
├─────────────────────────────┤
│ • canPrescribe              │
│ • canPerformExams           │
│ • canValidateReports        │
│ • canViewAll                │
│ • hasFullControl            │
└─────────────────────────────┘
```

---

## Module Médecin

```
┌──────────────────────────────────────────────────────────────┐
│                     Doctor Module                             │
└──────────────────────────────────────────────────────────────┘

Route: /doctor/*

┌──────────────────────┐
│  DoctorLayout        │ ← Layout avec sidebar bleue
│  (Sidebar + Header)  │
└─────────┬────────────┘
          │
          ├─ /dashboard ──────────────┐
          │                           ▼
          │              ┌─────────────────────────────┐
          │              │  DoctorDashboard            │
          │              ├─────────────────────────────┤
          │              │ • 4 KPI Cards:              │
          │              │   - RDV Aujourd'hui         │
          │              │   - Consultations Semaine   │
          │              │   - Analyses en Attente     │
          │              │   - Prescriptions Actives   │
          │              │                             │
          │              │ • Agenda du jour:           │
          │              │   - Liste RDV avec patients │
          │              │   - Statuts et horaires     │
          │              │                             │
          │              │ • Actions rapides:          │
          │              │   - Nouvelle consultation   │
          │              │   - Nouvelle prescription   │
          │              │   - Prescrire analyse       │
          │              │                             │
          │              │ • Widget Performance:       │
          │              │   - Stats semaine           │
          │              │   - Taux satisfaction       │
          │              └─────────────────────────────┘
          │
          ├─ /consultations ──────────┐
          ├─ /patients ───────────────┤
          ├─ /prescriptions ──────────┤
          ├─ /lab-orders ─────────────┤
          └─ /schedule ───────────────┘

Data Sources:
┌────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│ doctors    │  │appointments │  │consultations │  │prescriptions│
└────────────┘  └─────────────┘  └──────────────┘  └─────────────┘
       │               │                 │                 │
       └───────────────┴─────────────────┴─────────────────┘
                                 │
                                 ▼
                        [ DoctorDashboard ]
```

---

## Module Patient

```
┌──────────────────────────────────────────────────────────────┐
│                    Patient Module                             │
└──────────────────────────────────────────────────────────────┘

Route: /patient/*

┌──────────────────────┐
│  PatientLayout       │ ← Layout avec sidebar teal
│  (Sidebar + Header)  │
└─────────┬────────────┘
          │
          ├─ /dashboard ──────────────┐
          │                           ▼
          │              ┌─────────────────────────────┐
          │              │  PatientDashboard           │
          │              ├─────────────────────────────┤
          │              │ • 4 KPI Cards:              │
          │              │   - Prochains RDV           │
          │              │   - Nouveaux Résultats      │
          │              │   - Ordonnances Actives     │
          │              │   - Consultations Totales   │
          │              │                             │
          │              │ • Prochains RDV:            │
          │              │   - Liste avec countdown    │
          │              │   - Info médecins           │
          │              │                             │
          │              │ • Résultats récents:        │
          │              │   - Badge "Nouveau" (<7j)   │
          │              │   - Téléchargement PDF      │
          │              │                             │
          │              │ • Section Aide:             │
          │              │   - Contact support         │
          │              │   - FAQ                     │
          │              └─────────────────────────────┘
          │
          ├─ /appointments ───────────┐
          ├─ /results ────────────────┤
          ├─ /prescriptions ──────────┤
          ├─ /history ────────────────┤
          └─ /profile ────────────────┘

Data Sources:
┌────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│ patients   │  │appointments │  │  lab_orders  │  │prescriptions│
└────────────┘  └─────────────┘  └──────────────┘  └─────────────┘
       │               │                 │                 │
       └───────────────┴─────────────────┴─────────────────┘
                                 │
                                 ▼
                        [ PatientDashboard ]

Security:
┌─────────────────────────────┐
│ RLS Policies (Patients)     │
├─────────────────────────────┤
│ • Voir uniquement ses       │
│   propres données           │
│ • Pas d'accès aux autres    │
│   patients                  │
│ • Lecture seule sur la      │
│   plupart des tables        │
└─────────────────────────────┘
```

---

## Flux de Données

```
┌─────────────────────────────────────────────────────────────────┐
│                      Data Flow Architecture                      │
└─────────────────────────────────────────────────────────────────┘

┌───────────────┐
│  User Action  │ (Click, Navigation, Form Submit)
└───────┬───────┘
        │
        ▼
┌───────────────────┐
│  React Component  │ (Dashboard Page)
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  useEffect Hook   │ (Component Mount)
└───────┬───────────┘
        │
        ▼
┌──────────────────────────────────────┐
│  fetchDashboardData()                │
│                                      │
│  Promise.all([                       │
│    fetchStats(),                     │
│    fetchRecentItems(),               │
│    fetchPermissions()                │
│  ])                                  │
└───────┬──────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│  Supabase Client                     │
│                                      │
│  supabase.from('table')              │
│    .select('columns')                │
│    .eq('condition')                  │
│    .order('field')                   │
└───────┬──────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│  Row Level Security (RLS)            │
│                                      │
│  • Check auth.uid()                  │
│  • Verify permissions                │
│  • Filter by ownership               │
└───────┬──────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│  PostgreSQL Database                 │
│                                      │
│  • Execute query                     │
│  • Apply filters                     │
│  • Return results                    │
└───────┬──────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│  Response Processing                 │
│                                      │
│  • Parse JSON data                   │
│  • Calculate aggregations            │
│  • Format for display                │
└───────┬──────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│  State Management                    │
│                                      │
│  setStats(calculatedStats)           │
│  setLoading(false)                   │
└───────┬──────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│  React Re-render                     │
│                                      │
│  • Update KPI cards                  │
│  • Refresh tables                    │
│  • Show alerts                       │
└──────────────────────────────────────┘
```

---

## Architecture de Sécurité

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Architecture                         │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────┐
│  Authentication   │
│  (Supabase Auth)  │
└────────┬──────────┘
         │
         ▼
┌─────────────────────────────────┐
│  User Profile Lookup            │
│                                 │
│  SELECT * FROM user_profiles    │
│  WHERE user_id = auth.uid()     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Role Resolution                │
│                                 │
│  role_id → roles table          │
│  Get role_name & permissions    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  RBAC Context Provider          │
│                                 │
│  <RBACContext.Provider>         │
│    currentRole                  │
│    permissions                  │
│    hasPermission()              │
│  </RBACContext.Provider>        │
└────────┬────────────────────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌──────────────────────┐          ┌──────────────────────┐
│  UI Level Security   │          │  Data Level Security │
│                      │          │                      │
│  ProtectedRoute      │          │  Row Level Security  │
│  AccessControl       │          │  (RLS Policies)      │
│  PermissionGuard     │          │                      │
│                      │          │  • auth.uid() check  │
│  if (!permission)    │          │  • Role-based rules  │
│    → Access Denied   │          │  • Data filtering    │
└──────────────────────┘          └──────────────────────┘
```

---

## Performance et Optimisation

```
┌─────────────────────────────────────────────────────────────────┐
│                   Performance Strategy                           │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────┐
│  Frontend Optimizations               │
├───────────────────────────────────────┤
│                                       │
│  1. Lazy Loading                      │
│     const Lab = React.lazy(...)       │
│                                       │
│  2. Code Splitting                    │
│     Dynamic imports per module        │
│                                       │
│  3. Memoization                       │
│     useMemo() for expensive calcs     │
│     useCallback() for functions       │
│                                       │
│  4. Parallel Data Fetching            │
│     Promise.all([...queries])         │
│                                       │
│  5. State Management                  │
│     React Context for global state    │
│     Local state for component data    │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│  Backend Optimizations                │
├───────────────────────────────────────┤
│                                       │
│  1. Database Indexes                  │
│     CREATE INDEX ON table(column)     │
│                                       │
│  2. Selective Queries                 │
│     SELECT specific_columns           │
│     vs SELECT *                       │
│                                       │
│  3. Query Limits                      │
│     .limit(10) for lists              │
│                                       │
│  4. Computed Fields                   │
│     Database functions for stats      │
│                                       │
│  5. Caching Strategy                  │
│     React Query (future)              │
│     Local storage for settings        │
└───────────────────────────────────────┘

Bundle Size Analysis:
┌──────────────────────────────┐
│ Total: 2.7 MB (676 KB gzip)  │
├──────────────────────────────┤
│ • index.js:    2.68 MB       │
│ • html2canvas: 201 KB        │
│ • d3/xlsx:     158 KB        │
│ • CSS:         82 KB         │
└──────────────────────────────┘
```

---

## Schéma de Déploiement

```
┌─────────────────────────────────────────────────────────────────┐
│                    Deployment Architecture                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  Development         │
│  npm run dev         │
│  localhost:5173      │
└──────────┬───────────┘
           │
           │ npm run build
           ▼
┌──────────────────────┐
│  Build Process       │
│  Vite + TypeScript   │
│  → dist/             │
└──────────┬───────────┘
           │
           │ Deploy
           ▼
┌──────────────────────────────┐
│  Production Hosting          │
│  (Netlify / Vercel / Other)  │
│                              │
│  dist/                       │
│  ├── index.html              │
│  ├── assets/                 │
│  │   ├── index-[hash].js     │
│  │   ├── index-[hash].css    │
│  │   └── ...                 │
│  └── _redirects (SPA)        │
└──────────┬───────────────────┘
           │
           │ API Calls
           ▼
┌──────────────────────────────┐
│  Supabase Backend            │
│  https://[project].supabase  │
│                              │
│  • PostgreSQL Database       │
│  • Authentication            │
│  • Row Level Security        │
│  • Real-time subscriptions   │
│  • Edge Functions (future)   │
└──────────────────────────────┘
```

---

## Monitoring et Analytics

```
┌─────────────────────────────────────────────────────────────────┐
│                    Monitoring Strategy                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│  Application Metrics    │
├─────────────────────────┤
│ • Page Load Time        │
│ • API Response Time     │
│ • Error Rate            │
│ • User Session Duration │
│ • Feature Usage         │
└─────────────────────────┘

┌─────────────────────────┐
│  Business Metrics       │
├─────────────────────────┤
│ • Daily Active Users    │
│ • Prescriptions/Day     │
│ • Lab Results/Day       │
│ • Average Wait Time     │
│ • Patient Satisfaction  │
└─────────────────────────┘

┌─────────────────────────┐
│  Error Tracking         │
├─────────────────────────┤
│ • Console Errors (F12)  │
│ • Network Failures      │
│ • Permission Denials    │
│ • Database Errors       │
│ • Authentication Issues │
└─────────────────────────┘
```

---

**Version**: 2.0
**Date**: 26 février 2026
**Statut**: ✅ Production Ready
