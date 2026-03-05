# Système RBAC Okapi Medical - Documentation Complète

## Vue d'Ensemble

Le système RBAC (Role-Based Access Control) d'Okapi Medical est un système complet de gestion des permissions basé sur les rôles utilisateurs. Il contrôle l'accès aux différentes parties de l'application selon le profil de chaque utilisateur.

---

## 📋 Profils Utilisateurs Définis

### 1. **ADMIN (Administrateur)**
- **Accès** : Accès total à tous les modules
- **Permissions** : Toutes (`*`)
- **Description** : Gestion complète du système, configuration, supervision

### 2. **MÉDECIN (Doctor)**
- **Accès** : Pôle Médical + Rendez-vous
- **Modules accessibles** :
  - Gestion des Patients
  - Rendez-vous
  - Consultations
  - Ordonnances
  - Laboratoire (consultation et prescription)
  - Pharmacie (consultation)
- **Permissions** : `view_patients`, `edit_patients`, `view_appointments`, `create_appointments`, `view_consultations`, `create_consultations`, `view_prescriptions`, `create_prescriptions`, `view_lab_orders`, `create_lab_orders`

### 3. **ADMINISTRATIF/RH (Administrative)**
- **Accès** : Services Administratifs + Personnel Admin + Paie
- **Modules accessibles** :
  - Personnel Administratif
  - Ressources Humaines
  - Annuaire du Personnel
  - Planning des Équipes
  - Gestion des Pauses
  - Logistique & Stocks
  - Transport
  - Installations
  - Réception & Accueil
  - Paie (consultation)
- **Permissions** : `view_employees`, `edit_employees`, `view_hr`, `edit_hr`, `view_reception`, `view_logistics`, `edit_logistics`, `view_transport`, `edit_transport`, `view_payroll`

### 4. **COMPTABLE (Accountant)**
- **Accès** : Services Commerciaux + Ressources Financières + Taux de Change
- **Modules accessibles** :
  - Facturation
  - Analyses Financières
  - Contrats
  - Assurances
  - Paie (complète)
  - Taux de Change (widget dynamique)
- **Permissions** : `view_billing`, `edit_billing`, `view_analytics`, `view_contracts`, `edit_contracts`, `view_insurance`, `edit_insurance`, `view_payroll`, `edit_payroll`

### 5. **RÉCEPTIONNISTE (Receptionist)**
- **Accès** : Réception + Gestion Patients
- **Modules accessibles** :
  - Gestion des Patients (lecture + création)
  - Rendez-vous (lecture + création)
  - Réception & Accueil (check-in patients)
- **Permissions** : `view_patients`, `create_patients`, `view_appointments`, `create_appointments`, `checkin_patients`

### 6. **LABORATOIRE (Laboratory)**
- **Accès** : Module Laboratoire
- **Modules accessibles** :
  - Laboratoire (gestion complète)
  - Résultats d'analyses
- **Permissions** : `view_lab_orders`, `edit_lab_orders`, `view_results`, `create_results`

### 7. **PHARMACIEN (Pharmacist)**
- **Accès** : Module Pharmacie
- **Modules accessibles** :
  - Pharmacie (gestion complète)
  - Stock Pharmacie
  - Dispensation médicaments
- **Permissions** : `view_prescriptions`, `dispense_medications`, `view_pharmacy_inventory`, `edit_pharmacy_inventory`

---

## 🏗️ Structure du Menu Hiérarchisée

### Pôle Médical (Medical Pole)
**Icône** : Activity
**Accessible par** : Admin, Médecin, Réceptionniste

- **Gestion des Patients**
- **Rendez-vous**
- **Consultations** (Admin, Médecin)
- **Personnel Médical** (Admin seulement)
- **Ordonnances** (Admin, Médecin)
- **Services Médicaux** ▼
  - Laboratoire
  - Pharmacie
  - Stock Pharmacie

### Pôle Administratif (Administrative Pole)
**Icône** : Building2
**Accessible par** : Admin, Administratif, Réceptionniste

- **Personnel Administratif** (Admin, Administratif)
- **Réception & Accueil**
- **Ressources Humaines** ▼
  - Annuaire du Personnel
  - Planning des Équipes
  - Gestion des Pauses
- **Logistique & Stocks**
- **Transport**
- **Installations**

### Pôle Commercial & Finance
**Icône** : DollarSign
**Accessible par** : Admin, Comptable

- **Facturation**
- **Analyses Financières**
- **Contrats**
- **Assurances**
- **Paie** (Admin, Administratif, Comptable)

### Système
**Icône** : Settings
**Accessible par** : Admin seulement

- **Paramètres**
- **Tableau de Bord RDC**
- **Gestion des Actualités**

---

## 🔐 Fonctionnalités de Sécurité

### 1. **Masquage UI (UI Masking)**
- Les menus non autorisés sont **invisibles** pour les utilisateurs sans permission
- Les menus verrouillés affichent une **icône de cadenas** 🔒
- Filtrage automatique du menu selon le rôle

### 2. **Sélecteur de Rôle (Simulateur)**
Situé en **haut de la Sidebar**, permet aux développeurs/administrateurs de :
- **Tester** différentes vues selon les rôles
- **Activer/Désactiver** le mode simulation
- **Changer** de rôle à la volée
- Affiche le **badge du rôle actif**

**États** :
- 🟢 **Activé** : Sélecteur dropdown visible
- 🔴 **Désactivé** : Affichage du rôle réel de l'utilisateur

### 3. **Vérification des Permissions**
```typescript
function hasPermission(permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.includes('*') || permissions.includes(permission);
}
```

### 4. **Filtrage Automatique du Menu**
```typescript
function filterMenuByRole(menu: MenuItem[], userRole: UserRole): MenuItem[] {
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
```

---

## 🎨 Design & Interface

### Thème
- **Mode Clair** : Fond blanc, texte sombre, accents bleus
- **Mode Sombre** : Fond gris foncé, texte clair, accents bleus (en développement)
- **Transitions** : Animations fluides avec durée 300ms
- **Icônes** : Lucide React (cohérence visuelle)

### Accordéons (Collapsible Menus)
- **Indicateurs visuels** : Chevron Down ▼ / Chevron Right ►
- **Animation** : Expansion/collapse fluide
- **Couleurs par catégorie** :
  - 🔵 **Médical** : Bleu (bg-blue-50, text-blue-600, border-blue-200)
  - 🟣 **Administratif** : Violet (bg-purple-50, text-purple-600, border-purple-200)
  - 🟢 **Commercial** : Vert (bg-green-50, text-green-600, border-green-200)

### Widget Taux de Change
**Position** : Bas de la sidebar
**Accessible par** : Admin, Comptable

**Contenu** :
- Badge **"Live"** animé (pulse)
- USD/CDF : 2,850 FC
- EUR/CDF : 3,120 FC
- Bouton "Mettre à jour les taux"

**Design** :
- Gradient vert (from-green-50 to-emerald-50)
- Bordure verte (border-green-200)
- Icône TrendingUp
- Police de petite taille (text-xs, text-sm)

---

## 📂 Architecture Fichiers

```
src/
├── config/
│   └── rbac.ts                    # Configuration RBAC, rôles, permissions
├── contexts/
│   └── RBACContext.tsx            # Provider pour gestion du rôle utilisateur
├── components/
│   └── layout/
│       └── RBACNavigation.tsx     # Composant navigation avec RBAC
└── pages/
    └── staff/
        └── StaffLayout.tsx        # Layout principal avec sidebar RBAC
```

### Fichiers Clés

#### `rbac.ts`
Définit :
- Types `UserRole`
- Interface `MenuItem`
- Structure `MENU_STRUCTURE`
- Fonction `hasAccess()`
- Fonction `filterMenuByRole()`
- Dictionnaire `ROLE_PERMISSIONS`

#### `RBACContext.tsx`
Fournit :
- Hook `useRBAC()`
- État `userRole`
- État `isSimulationMode`
- Fonction `setUserRole()`
- Fonction `hasPermission()`
- Chargement automatique du rôle depuis Supabase

#### `RBACNavigation.tsx`
Composant de navigation avec :
- Sélecteur de rôle
- Menu hiérarchisé avec accordéons
- Filtrage automatique selon le rôle
- Widget taux de change
- Support mode sombre/clair (en développement)

---

## 🔄 Workflow d'Utilisation

### 1. **Connexion Utilisateur**
```
Utilisateur se connecte
    ↓
AuthContext récupère l'utilisateur
    ↓
RBACContext charge le rôle depuis Supabase
    ↓
Menu filtré automatiquement selon le rôle
```

### 2. **Navigation**
```
Utilisateur clique sur un menu
    ↓
Vérification: hasAccess(userRole, menuItem)
    ↓
Si autorisé: Navigation vers la route
Si non autorisé: Rien ne se passe (menu verrouillé/invisible)
```

### 3. **Simulation de Rôle**
```
Admin active le mode simulation
    ↓
Sélectionne un rôle à tester
    ↓
RBACContext met à jour userRole
    ↓
Menu se réorganise instantanément
    ↓
Admin peut tester l'UX de chaque profil
```

---

## 🧪 Tests & Validation

### Checklist de Tests

- [ ] Admin voit tous les menus
- [ ] Médecin voit uniquement Pôle Médical + Rendez-vous
- [ ] Administratif voit Pôle Administratif + Paie
- [ ] Comptable voit Pôle Commercial & Finance
- [ ] Réceptionniste voit Réception + Patients + Rendez-vous
- [ ] Laboratoire voit uniquement le module Laboratoire
- [ ] Pharmacien voit uniquement Pharmacie + Stock
- [ ] Sélecteur de rôle fonctionne correctement
- [ ] Widget taux de change visible pour Admin/Comptable uniquement
- [ ] Transitions d'accordéons fluides
- [ ] Mode sombre/clair fonctionne
- [ ] Aucun menu interdit n'est cliquable

---

## 🚀 Prochaines Étapes

### À Implémenter
1. ✅ Mode sombre complet
2. ✅ Animations Framer Motion pour accordéons
3. ✅ Taux de change en temps réel (API externe)
4. ✅ Notifications par rôle
5. ✅ Logs d'accès par utilisateur
6. ✅ Gestion fine des permissions par action
7. ✅ Dashboard personnalisé par rôle
8. ✅ Onboarding selon le profil

### Extensions Possibles
- Multi-tenancy (plusieurs cliniques)
- Permissions temporaires
- Délégation de permissions
- Audit trail détaillé
- Alertes de sécurité
- 2FA par rôle

---

## 📞 Support & Assistance

Pour toute question sur le système RBAC :
- Consulter ce document
- Vérifier les fichiers `config/rbac.ts` et `contexts/RBACContext.tsx`
- Tester avec le simulateur de rôle
- Contacter l'équipe de développement

---

**Version** : 2.0
**Dernière mise à jour** : 2026-02-13
**Auteur** : Équipe Okapi Medical
**License** : Propriétaire
