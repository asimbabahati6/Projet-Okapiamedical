# Implémentation RBAC Sécurisée - Module Laboratoire

## Vue d'Ensemble

Ce document décrit l'implémentation complète du système de contrôle d'accès basé sur les rôles (RBAC) pour le module Laboratoire de l'application OKAPIA Medical.

## Matrice des Permissions

| Rôle | Création | Lecture | Modification | Suppression | Export | Menu Visible |
|------|----------|---------|--------------|-------------|--------|--------------|
| **Administrateur** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Médecin Directeur** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Personnel Laboratoire** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Médecin** | ✅ (Prescrire) | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Autres Rôles** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (Masqué) |

### Notes Importantes

- **Médecins**: Peuvent créer des ordres de laboratoire (prescrire des analyses) mais ne peuvent PAS modifier ou supprimer les résultats existants
- **Autres Rôles**: L'onglet Laboratoire est complètement masqué du menu de navigation
- **Accès Direct**: Tentative d'accès direct à `/staff/laboratory` redirige automatiquement vers le dashboard pour les rôles non autorisés

## Architecture de Sécurité

### 1. Protection Multi-Niveaux

```
┌─────────────────────────────────────────┐
│   Niveau 1: Configuration du Menu      │
│   (Masquage de l'onglet)               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Niveau 2: PermissionGuard             │
│   (Protection au niveau page)           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Niveau 3: Composants UI               │
│   (Boutons conditionnels)               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Niveau 4: Validation Client           │
│   (useLabOrderActions hook)             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Niveau 5: RLS Supabase                │
│   (Sécurité backend)                    │
└─────────────────────────────────────────┘
```

### 2. Composants Créés

#### `src/hooks/useRolePermissions.ts`
- **Modification**: Ajout de la propriété `canViewDetails`
- **Fonction**: `getLaboratoryPermissions()` implémente la matrice exacte
- **Mapping**: Ajout du rôle `medical_director`

#### `src/components/laboratory/LabOrderActions.tsx`
- **Fonction**: Affiche les boutons d'actions selon les permissions
- **Comportement**:
  - Bouton "Détails": Visible si `canViewDetails`
  - Bouton "Modifier": Visible si `canEdit`
  - Bouton "Supprimer": Visible si `canDelete`
  - Message "Accès limité": Affiché si aucune permission

#### `src/components/common/PermissionGuard.tsx`
- **Fonction**: Composant HOC pour protéger les pages entières
- **Options**:
  - Redirection automatique vers le dashboard
  - Affichage d'un message d'erreur
  - Masquage complet du contenu

#### `src/hooks/useLabOrderActions.ts`
- **Fonction**: Hook personnalisé pour valider toutes les actions
- **Méthodes**:
  - `validateCreate()`: Vérifie permission de création
  - `validateEdit()`: Vérifie permission de modification
  - `validateDelete()`: Vérifie permission de suppression
  - `validateView()`: Vérifie permission de consultation
  - `getErrorMessage()`: Messages contextuels par rôle

#### `src/services/laboratoryAuditService.ts`
- **Fonction**: Service d'audit complet pour traçabilité
- **Méthodes**:
  - `logAction()`: Enregistre une action
  - `logPermissionDenied()`: Enregistre tentative non autorisée
  - `logSuccessfulAction()`: Enregistre succès
  - `getAuditTrail()`: Récupère l'historique
  - `getDeniedAccessAttempts()`: Liste les violations

### 3. Modifications de Fichiers Existants

#### `src/config/rbac.ts`
```typescript
// Avant:
roles: ['admin', 'medical_director', 'doctor', 'laboratory', 'directeur_general', 'medecin_chef_staff']

// Après:
roles: ['admin', 'medical_director', 'doctor', 'laboratory']
```

#### `src/pages/staff/LaboratoryPage.tsx`
- Ajout du composant `PermissionGuard` englobant
- Remplacement du bouton "Voir détails" par `LabOrderActions`
- Message de bandeau consultation adaptatif selon le rôle

#### `src/components/laboratory/AddLabOrderModal.tsx`
- Ajout de validation avec `useLabOrderActions`
- Vérification des permissions avant soumission

## Politiques RLS Supabase

### Table: `lab_orders`

#### SELECT Policy
```sql
CREATE POLICY "lab_orders_select_authorized_roles"
ON lab_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'medical_director', 'lab_technician', 'doctor')
  )
);
```

#### INSERT Policy
```sql
CREATE POLICY "lab_orders_insert_authorized_roles"
ON lab_orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'medical_director', 'lab_technician', 'doctor')
  )
);
```

#### UPDATE Policy
```sql
CREATE POLICY "lab_orders_update_restricted_roles"
ON lab_orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'medical_director', 'lab_technician')
  )
);
```

#### DELETE Policy
```sql
CREATE POLICY "lab_orders_delete_restricted_roles"
ON lab_orders FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'medical_director', 'lab_technician')
  )
);
```

### Table: `laboratory_audit_logs`

Créée pour tracer toutes les actions du module:
- Types d'actions: create, update, delete, view, export, denied
- Indexée pour performances optimales
- RLS: Lecture réservée aux admins et médecins directeurs
- Insertion toujours autorisée (via service role)
- **Immuable**: Aucune mise à jour ou suppression possible

## Guide Utilisateur par Rôle

### Administrateur / Médecin Directeur / Personnel Laboratoire

**Accès Complet:**
1. L'onglet "Laboratoire" est visible dans le menu
2. Bouton "Nouvelle Analyse" actif et fonctionnel
3. Colonne Actions affiche: Détails, Modifier, Supprimer
4. Export CSV disponible
5. Aucun bandeau de restriction

**Workflow:**
```
Connexion → Menu Laboratoire visible → Créer/Modifier/Supprimer analyses → Export données
```

### Médecin

**Accès Consultation + Prescription:**
1. L'onglet "Laboratoire" est visible dans le menu
2. Bouton "Nouvelle Analyse" actif (pour prescrire)
3. Colonne Actions affiche uniquement: Détails
4. Export CSV disponible
5. Bandeau jaune: "Mode Consultation - Vous pouvez prescrire de nouvelles analyses mais pas modifier les résultats existants"

**Workflow:**
```
Connexion → Menu Laboratoire visible → Prescrire nouvelle analyse OU Consulter résultats → Export si nécessaire
```

**Limitations:**
- ❌ Ne peut pas modifier les résultats d'analyses existantes
- ❌ Ne peut pas supprimer d'analyses
- ✅ Peut prescrire de nouvelles analyses
- ✅ Peut consulter tous les résultats

### Autres Rôles (Réceptionniste, Infirmière, etc.)

**Aucun Accès:**
1. L'onglet "Laboratoire" est **masqué** du menu
2. Accès direct à `/staff/laboratory` → Redirection automatique vers `/staff/dashboard`
3. Message d'erreur: "Accès Refusé - Le module Laboratoire nécessite des permissions spécifiques"

**Workflow:**
```
Connexion → Onglet Laboratoire INVISIBLE → Tentative accès direct → Redirection dashboard
```

## Messages d'Erreur Contextuels

### Pour les Médecins

| Action | Message |
|--------|---------|
| Création | "Les médecins peuvent prescrire de nouvelles analyses via le formulaire 'Nouvelle Analyse'" |
| Modification | "Les médecins ne peuvent pas modifier les résultats d'analyse. Contactez le laboratoire." |
| Suppression | "Suppression réservée aux administrateurs et responsables de laboratoire" |

### Pour les Autres Rôles

| Action | Message |
|--------|---------|
| Création | "Seul le personnel de laboratoire peut créer des analyses" |
| Modification | "Modification réservée au personnel de laboratoire autorisé" |
| Suppression | "Suppression réservée aux administrateurs et responsables de laboratoire" |
| Accès général | "Accès au module Laboratoire refusé. Permissions insuffisantes." |

## Journalisation et Audit

### Types d'Événements Loggés

1. **create**: Création d'un ordre de laboratoire
2. **update**: Modification d'un ordre
3. **delete**: Suppression d'un ordre
4. **view**: Consultation des détails
5. **export**: Export de données
6. **denied**: Tentative d'accès non autorisée

### Exemple de Log

```typescript
{
  id: "uuid",
  user_id: "user-uuid",
  user_role: "doctor",
  action_type: "denied",
  order_id: "order-uuid",
  success: false,
  error_message: "Permission denied for action: update",
  timestamp: "2024-02-26T10:30:00Z"
}
```

### Consultation des Logs

```typescript
import { labAuditService } from '../services/laboratoryAuditService';

// Récupérer les tentatives refusées
const deniedAttempts = await labAuditService.getDeniedAccessAttempts(50);

// Récupérer l'activité d'un utilisateur
const userActivity = await labAuditService.getUserActivitySummary(userId);

// Filtrer par période
const auditTrail = await labAuditService.getAuditTrail({
  startDate: '2024-02-01',
  endDate: '2024-02-28',
  actionType: 'denied'
});
```

## Tests de Sécurité

### Checklist de Validation

#### Rôle Administrateur
- [ ] Onglet Laboratoire visible
- [ ] Bouton "Nouvelle Analyse" fonctionnel
- [ ] Actions: Détails, Modifier, Supprimer visibles
- [ ] Pas de bandeau consultation
- [ ] Export CSV fonctionnel
- [ ] RLS permet toutes opérations

#### Rôle Médecin Directeur
- [ ] Onglet Laboratoire visible
- [ ] Bouton "Nouvelle Analyse" fonctionnel
- [ ] Actions: Détails, Modifier, Supprimer visibles
- [ ] Pas de bandeau consultation
- [ ] Export CSV fonctionnel
- [ ] RLS permet toutes opérations

#### Rôle Personnel Laboratoire
- [ ] Onglet Laboratoire visible
- [ ] Bouton "Nouvelle Analyse" fonctionnel
- [ ] Actions: Détails, Modifier, Supprimer visibles
- [ ] Pas de bandeau consultation
- [ ] Export CSV fonctionnel
- [ ] RLS permet toutes opérations

#### Rôle Médecin
- [ ] Onglet Laboratoire visible
- [ ] Bouton "Nouvelle Analyse" fonctionnel
- [ ] Actions: Détails uniquement (pas Modifier/Supprimer)
- [ ] Bandeau consultation affiché
- [ ] Export CSV fonctionnel
- [ ] RLS bloque UPDATE et DELETE

#### Autres Rôles
- [ ] Onglet Laboratoire MASQUÉ
- [ ] Accès direct redirige vers dashboard
- [ ] Message d'erreur approprié
- [ ] RLS bloque toutes opérations

## Dépannage

### Problème: L'onglet Laboratoire est visible mais ne devrait pas l'être

**Solution:**
1. Vérifier le rôle de l'utilisateur: `SELECT role_id FROM user_profiles WHERE id = 'user-id'`
2. Vérifier la configuration du menu: `src/config/rbac.ts` ligne 89
3. Vider le cache du navigateur

### Problème: Erreur "Permission denied" même pour un admin

**Solution:**
1. Vérifier les politiques RLS: `SELECT * FROM pg_policies WHERE tablename = 'lab_orders'`
2. Vérifier le mapping du rôle dans `useRolePermissions.ts`
3. Tester avec un token d'authentification frais

### Problème: Les logs d'audit ne s'enregistrent pas

**Solution:**
1. Vérifier que la table existe: `SELECT * FROM laboratory_audit_logs LIMIT 1`
2. Vérifier les permissions d'insertion
3. Consulter la console pour les erreurs de réseau

## Performance

### Optimisations Implémentées

1. **Indexes sur lab_orders:**
   - `idx_lab_orders_doctor_id`
   - `idx_lab_orders_patient_id`
   - `idx_lab_orders_status`
   - `idx_lab_orders_created_at`

2. **Indexes sur laboratory_audit_logs:**
   - `idx_lab_audit_user_id`
   - `idx_lab_audit_timestamp`
   - `idx_lab_audit_action_type`
   - `idx_lab_audit_user_timestamp` (composite)

3. **React Optimizations:**
   - `useMemo` pour le calcul des permissions
   - Composants conditionnels évitent le rendu inutile

## Conformité et Sécurité

### Standards Respectés

- ✅ **Principe du moindre privilège**: Accès minimal par défaut
- ✅ **Défense en profondeur**: 5 niveaux de sécurité
- ✅ **Traçabilité**: Tous les accès loggés
- ✅ **Immutabilité des logs**: Audit trail non modifiable
- ✅ **Séparation des préoccupations**: Code modulaire
- ✅ **RGPD**: Pas de données patients dans les logs

### Recommandations

1. Réviser les logs d'audit mensuellement
2. Alerter sur les tentatives répétées d'accès non autorisé
3. Former les utilisateurs sur leurs permissions
4. Documenter tout changement de rôle

## Support

Pour toute question ou problème:
- Consulter cette documentation
- Vérifier les logs d'audit
- Contacter l'équipe DevOps

---

**Version:** 1.0
**Date:** 26 Février 2026
**Auteur:** Système RBAC OKAPIA Medical
