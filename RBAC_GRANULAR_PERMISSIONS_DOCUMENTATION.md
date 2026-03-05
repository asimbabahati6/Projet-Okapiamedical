# Documentation des Permissions RBAC Granulaires - OKAPIA Medical

## Vue d'ensemble

Ce document décrit le système de permissions granulaires implémenté pour les modules Laboratoire, Pharmacie et Radiologie dans l'application OKAPIA Medical.

## Architecture du Système RBAC

### Composants Principaux

1. **Configuration des Permissions** (`src/config/rbac.ts`)
   - Définition centralisée de toutes les permissions
   - Attribution des permissions par rôle
   - Configuration du menu selon les rôles

2. **Composants de Contrôle d'Accès**
   - `AccessControl` : Composant wrapper pour contrôler l'affichage
   - `ProtectedAction` : Boutons et actions protégés par permissions
   - Badges de permissions : Indicateurs visuels du niveau d'accès

3. **Hooks de Permissions**
   - `useLabPermissions()` : Permissions du laboratoire
   - `usePharmacyPermissions()` : Permissions de la pharmacie
   - `useRadiologyPermissions()` : Permissions de la radiologie

---

## Matrice des Permissions par Module

### LABORATOIRE

#### Permissions Disponibles

| Permission | Description | Rôles autorisés |
|------------|-------------|-----------------|
| `lab_full_access` | Accès complet CRUD | Responsable Labo, Médecin Directeur, Super Admin |
| `lab_dashboard_view` | Vue dashboard uniquement | Médecins, tous les rôles labo |
| `lab_create_orders` | Créer des ordres d'analyse | Médecins, Responsable Labo |
| `lab_edit_results` | Saisir/modifier résultats | Techniciens Labo, Responsable Labo |
| `lab_validate_results` | Valider les résultats | Responsable Labo uniquement |
| `lab_manage_equipment` | Gérer les équipements | Responsable Labo |

#### Scénarios d'Utilisation

**Médecin**
- ✅ Consulter le dashboard laboratoire
- ✅ Prescrire des analyses
- ❌ Saisir ou modifier des résultats
- ❌ Valider des résultats

**Technicien Laboratoire**
- ✅ Accès complet au système
- ✅ Saisir et modifier les résultats
- ✅ Valider les résultats
- ✅ Gérer les équipements

**Responsable Laboratoire**
- ✅ Tous les droits (CRUD complet)
- ✅ Validation finale des résultats
- ✅ Gestion des équipements et du personnel

---

### PHARMACIE

#### Permissions Disponibles

| Permission | Description | Rôles autorisés |
|------------|-------------|-----------------|
| `pharmacy_full_access` | Gestion complète | Responsable Pharmacie, Super Admin |
| `pharmacy_dispense` | Dispenser médicaments | Pharmacien, Responsable |
| `pharmacy_view_availability` | Consultation disponibilité | Médecins |
| `pharmacy_manage_inventory` | Gérer l'inventaire | Responsable Pharmacie |
| `pharmacy_receive_orders` | Réceptionner commandes | Pharmacien, Responsable |

#### Scénarios d'Utilisation

**Médecin**
- ✅ Consulter la disponibilité des médicaments
- ✅ Vérifier les stocks avant prescription
- ❌ Dispenser des médicaments
- ❌ Modifier l'inventaire

**Pharmacien**
- ✅ Dispenser les médicaments
- ✅ Réceptionner les commandes
- ✅ Gérer l'inventaire
- ✅ Consulter l'historique

**Responsable Pharmacie**
- ✅ Tous les droits (CRUD complet)
- ✅ Gestion complète des stocks
- ✅ Validation des dispensations
- ✅ Gestion des fournisseurs

---

### RADIOLOGIE

#### Permissions Disponibles

| Permission | Description | Rôles autorisés |
|------------|-------------|-----------------|
| `radiology_prescribe` | Prescrire examens | Médecins |
| `radiology_perform_exams` | Réaliser examens | Chef Radio, Technicien Radio |
| `radiology_upload_images` | Upload clichés DICOM/images | Chef Radio, Technicien Radio |
| `radiology_write_reports` | Rédiger comptes-rendus | Chef Radio, Technicien Radio |
| `radiology_validate_reports` | Valider rapports finaux | Chef Radio uniquement |
| `radiology_view_all` | Voir tous les examens | Médecins, Personnel Radio |
| `radiology_full_control` | Contrôle total | Médecin Directeur, Super Admin |

#### Scénarios d'Utilisation

**Médecin**
- ✅ Prescrire des examens radiologiques
- ✅ Consulter les rapports validés
- ✅ Voir l'historique des examens du patient
- ❌ Réaliser les examens
- ❌ Modifier les rapports

**Technicien Radiologie**
- ✅ Réaliser les examens
- ✅ Upload des images DICOM
- ✅ Rédiger les comptes-rendus
- ✅ Voir tous les examens
- ❌ Valider les rapports (réservé au Chef)

**Chef Radiologie**
- ✅ Réaliser les examens
- ✅ Upload des images
- ✅ Rédiger les comptes-rendus
- ✅ **Valider les rapports finaux**
- ✅ Gérer le département
- ✅ Gérer les équipements d'imagerie

**Médecin Directeur**
- ✅ Contrôle total sur le module
- ✅ Validation des rapports
- ✅ Gestion complète du département
- ✅ Accès à toutes les fonctionnalités

---

## Composants de Contrôle d'Accès

### AccessControl Component

Composant wrapper pour contrôler l'affichage selon les permissions.

**Modes disponibles :**
- `hide` : Masque l'élément (défaut)
- `disable` : Affiche en grisé avec message
- `readonly` : Affiche avec badge "Lecture seule"
- `redirect` : Redirige vers une autre page

**Exemple d'utilisation :**

```tsx
<AccessControl
  permission="radiology_validate_reports"
  mode="hide"
>
  <ValidationPanel />
</AccessControl>
```

### ProtectedAction Component

Bouton protégé par permission avec tooltip informatif.

**Exemple d'utilisation :**

```tsx
<ProtectedAction
  permission="lab_edit_results"
  onClick={handleEdit}
  tooltip="Vous n'avez pas les droits pour modifier les résultats"
  className="btn btn-primary"
>
  Modifier
</ProtectedAction>
```

### Permission Badges

Badges visuels pour indiquer le niveau d'accès de l'utilisateur.

**Types disponibles :**
- `FullAccessBadge` : Accès complet
- `ReadOnlyBadge` : Lecture seule
- `RestrictedAccessBadge` : Accès restreint
- `LimitedAccessBadge` : Accès limité

**Exemple d'utilisation :**

```tsx
{permissions.hasFullAccess ? (
  <FullAccessBadge />
) : permissions.isViewOnly ? (
  <ReadOnlyBadge />
) : null}
```

---

## Hooks de Permissions

### useLabPermissions()

Retourne les permissions spécifiques au laboratoire.

**Propriétés retournées :**
```typescript
{
  canCreateOrders: boolean;
  canEditResults: boolean;
  canValidateResults: boolean;
  canManageEquipment: boolean;
  hasFullAccess: boolean;
  isDashboardOnly: boolean;
  canViewOnly: boolean;
  hasAnyAccess: boolean;
}
```

### usePharmacyPermissions()

Retourne les permissions spécifiques à la pharmacie.

**Propriétés retournées :**
```typescript
{
  canDispense: boolean;
  canManageInventory: boolean;
  canReceiveOrders: boolean;
  hasFullAccess: boolean;
  isViewOnly: boolean;
  canViewAvailability: boolean;
  canEditInventory: boolean;
  hasAnyAccess: boolean;
}
```

### useRadiologyPermissions()

Retourne les permissions spécifiques à la radiologie.

**Propriétés retournées :**
```typescript
{
  canPrescribe: boolean;
  canPerformExams: boolean;
  canUploadImages: boolean;
  canWriteReports: boolean;
  canValidateReports: boolean;
  canViewAll: boolean;
  hasFullControl: boolean;
  canManageDepartment: boolean;
  canDeleteRecords: boolean;
  canManageEquipment: boolean;
  canManageSchedule: boolean;
  isRadiologyStaff: boolean;
  hasAnyAccess: boolean;
}
```

---

## Messages d'Accès

### LimitedAccessNotice

Affiche un message informatif sur l'accès limité.

```tsx
<LimitedAccessNotice
  title="Accès en consultation uniquement"
  message="Vous pouvez consulter les données mais ne pouvez pas les modifier. Contactez un responsable pour effectuer des modifications."
  action={{
    label: "Contacter un responsable",
    onClick: handleContact
  }}
/>
```

### AccessDeniedMessage

Affiche un message d'erreur pour accès refusé.

```tsx
<AccessDeniedMessage
  title="Accès refusé"
  message="Vous n'avez pas les permissions nécessaires pour accéder à cette section."
/>
```

### ReadOnlyNotice

Affiche un message pour le mode lecture seule.

```tsx
<ReadOnlyNotice
  message="Vous pouvez consulter les données mais ne pouvez pas les modifier."
/>
```

---

## Module Radiologie - Guide Complet

### Structure du Module

```
src/modules/radiology/
├── RadiologyLayout.tsx           # Layout principal avec navigation
├── pages/
│   ├── RadiologyDashboard.tsx    # Dashboard avec statistiques
│   ├── ExamQueue.tsx              # File d'attente des examens
│   ├── ExamWorkspace.tsx          # Espace de travail (upload + rapport)
│   └── ReportViewer.tsx           # Visualiseur de rapports validés
└── components/
    ├── ImageUploader.tsx          # Upload DICOM et images
    ├── ReportEditor.tsx           # Éditeur de compte-rendu
    └── ImageViewer.tsx            # Visionneuse d'images avec zoom
```

### Fonctionnalités par Page

#### RadiologyDashboard
- Statistiques en temps réel
- Aperçu des examens (en attente, en cours, terminés, validés, urgents)
- Actions rapides selon le rôle
- Indicateurs de permissions (badges)

#### ExamQueue
- Liste complète des examens prescrits
- Filtres multiples (statut, urgence, type, patient)
- Actions contextuelles selon les permissions :
  - **Technicien** : "Démarrer examen"
  - **Chef** : "Valider rapport"
  - **Médecin** : "Voir rapport" (si validé)

#### ExamWorkspace
- **Section 1** : Informations patient
- **Section 2** : Upload des images
  - Support DICOM (.dcm), JPEG, PNG, PDF
  - Drag & drop
  - Preview miniatures
  - Métadonnées par image
- **Section 3** : Rédaction du compte-rendu
  - Sections structurées (Technique, Constatations, Conclusion)
  - Autosave toutes les 30 secondes
  - Templates prédéfinis
- **Section 4** : Panel de validation (Chef uniquement)

#### ReportViewer
- Affichage du rapport validé
- Visionneuse d'images avec :
  - Zoom (50% à 200%)
  - Rotation
  - Plein écran
  - Téléchargement (si autorisé)
  - Navigation entre images
- Historique des examens du patient

### Workflow Complet

1. **Prescription** (Médecin)
   - Le médecin prescrit un examen radiologique
   - Spécifie le type d'imagerie et l'urgence
   - Ajoute l'indication clinique

2. **Réalisation** (Technicien/Chef)
   - Démarrage de l'examen depuis la file d'attente
   - Upload des clichés DICOM/images
   - Rédaction du compte-rendu
   - Finalisation (statut "Terminé")

3. **Validation** (Chef Radio uniquement)
   - Revue du rapport et des images
   - Validation finale ou demande de révision
   - Statut "Validé"

4. **Consultation** (Médecin prescripteur)
   - Accès au rapport validé
   - Visualisation des images
   - Consultation de l'historique

---

## Sécurité et Bonnes Pratiques

### Niveaux de Contrôle

Le système RBAC implémente 3 niveaux de sécurité :

1. **Niveau UI** : Composants AccessControl et ProtectedAction
2. **Niveau Routing** : Routes protégées avec redirections
3. **Niveau Backend** : Row Level Security (RLS) dans Supabase

### Bonnes Pratiques

1. **Toujours vérifier les permissions côté backend**
   - Ne jamais se fier uniquement aux contrôles UI
   - RLS doit être configuré sur toutes les tables

2. **Utiliser les hooks de permissions**
   - Centralise la logique de vérification
   - Facilite la maintenance

3. **Messages clairs pour l'utilisateur**
   - Indiquer pourquoi l'accès est refusé
   - Proposer des alternatives quand possible

4. **Audit des actions**
   - Logger toutes les tentatives d'accès
   - Tracer les modifications importantes

---

## Tests et Validation

### Scénarios de Test

#### Laboratoire
1. Connexion en tant que Médecin → Vérifier accès lecture seule
2. Connexion en tant que Technicien Labo → Vérifier saisie résultats
3. Connexion en tant que Responsable → Vérifier validation

#### Pharmacie
1. Connexion en tant que Médecin → Vérifier consultation disponibilité
2. Connexion en tant que Pharmacien → Vérifier dispensation
3. Connexion en tant que Responsable → Vérifier gestion complète

#### Radiologie
1. Connexion en tant que Médecin → Vérifier prescription uniquement
2. Connexion en tant que Technicien → Vérifier réalisation sans validation
3. Connexion en tant que Chef Radio → Vérifier validation des rapports

### Checklist de Validation

- [ ] Les badges de permissions s'affichent correctement
- [ ] Les messages d'accès sont clairs et contextuels
- [ ] Les boutons protégés sont désactivés sans permissions
- [ ] Les routes redirigent correctement si accès refusé
- [ ] Les composants masquent les fonctionnalités non autorisées
- [ ] RLS empêche l'accès direct aux données

---

## Maintenance et Évolution

### Ajouter une Nouvelle Permission

1. Ajouter la permission dans `ROLE_PERMISSIONS` (`src/config/rbac.ts`)
2. Ajouter aux rôles concernés
3. Créer/mettre à jour le hook de permissions
4. Utiliser dans les composants avec `AccessControl` ou `ProtectedAction`

### Modifier une Permission Existante

1. Identifier tous les usages avec recherche globale
2. Mettre à jour la configuration RBAC
3. Tester avec tous les rôles concernés
4. Mettre à jour la documentation

---

## Support et Contact

Pour toute question ou problème concernant les permissions RBAC :
- Consulter cette documentation
- Vérifier les logs d'audit
- Contacter l'équipe technique

**Version :** 1.0
**Dernière mise à jour :** 2025-02-25
