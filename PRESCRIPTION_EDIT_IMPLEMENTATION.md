# Implémentation de la Modification de Prescriptions avec RBAC

## Vue d'ensemble

Cette implémentation ajoute la fonctionnalité de modification de prescriptions avec un contrôle d'accès strict basé sur les rôles (RBAC) dans le système OKAPIA Medical.

## Fonctionnalités implémentées

### 1. Nouveau composant EditPrescriptionModal

**Fichier créé**: `/src/components/prescriptions/EditPrescriptionModal.tsx`

#### Caractéristiques principales:

- **Verrouillage des champs critiques** (conformité médico-légale):
  - Numéro de prescription (lecture seule)
  - Identité du patient (sélecteur désactivé)
  - Date de création (lecture seule)
  - Médecin prescripteur (lecture seule)

- **Champs modifiables** (uniquement si statut = 'pending'):
  - Diagnostic
  - Date d'expiration
  - Notes additionnelles
  - Liste des médicaments (ajouter, modifier, supprimer)
  - Instructions par médicament
  - Autorisation de substitution

- **Sécurité stricte**:
  - Modification autorisée uniquement pour les prescriptions avec statut "pending"
  - Blocage total des prescriptions dispensées, expirées ou annulées
  - Messages d'erreur contextuels clairs
  - Confirmation avant suppression de médicaments

- **Traçabilité complète**:
  - Enregistrement dans `prescription_audit_log` avec action='edited'
  - Capture des valeurs avant/après modification (old_values/new_values)
  - Détails des changements (champs modifiés, items ajoutés/supprimés)

### 2. Système de permissions RBAC

**Fichier modifié**: `/src/config/rbac.ts`

#### Nouvelles permissions ajoutées:

- **`edit_own_prescriptions`**: Permet aux médecins de modifier uniquement leurs propres prescriptions en attente
- **`edit_all_prescriptions`**: Permet aux administrateurs/directeurs médicaux de modifier toutes les prescriptions en attente

#### Attribution des permissions par rôle:

| Rôle | Permissions |
|------|-------------|
| **Médecin (doctor)** | ✓ `create_prescriptions`<br>✓ `edit_own_prescriptions`<br>❌ `edit_all_prescriptions` |
| **Directeur Médical (medical_director)** | ✓ `create_prescriptions`<br>✓ `edit_own_prescriptions`<br>✓ `edit_all_prescriptions` |
| **Médecin Chef de Staff (medecin_chef_staff)** | ✓ `view_prescriptions`<br>✓ `edit_all_prescriptions`<br>❌ `create_prescriptions` |
| **Pharmacien (pharmacist)** | ✓ `view_prescriptions`<br>✓ `dispense_medications`<br>❌ Aucune modification |
| **Administrateur (admin)** | ✓ Accès complet (toutes permissions) |

### 3. Interface utilisateur enrichie

**Fichier modifié**: `/src/pages/staff/PrescriptionsPage.tsx`

#### Ajouts dans l'interface:

1. **Bouton "Modifier" dans la colonne Actions**
   - Icône crayon (Pencil de lucide-react)
   - Style conditionnel selon les permissions:
     - Bleu actif: `text-blue-600 hover:text-blue-700` si modifiable
     - Gris désactivé: `text-gray-300 cursor-not-allowed` si non modifiable
   - Tooltip explicatif au survol

2. **Logique de contrôle d'accès**
   ```typescript
   function canEditPrescription(prescription: Prescription): boolean {
     // Vérification du statut
     if (prescription.status !== 'pending') return false;

     // Admins: accès complet
     if (canEditAllPrescriptions || isAdmin) return true;

     // Médecins: seulement leurs propres prescriptions
     if (canEditOwnPrescriptions && isDoctor) {
       return prescription.doctor_id === user?.id;
     }

     return false;
   }
   ```

3. **Messages d'aide contextuels**
   - "Prescription déjà dispensée" (si status = dispensed)
   - "Prescription expirée" (si status = expired)
   - "Prescription annulée" (si status = cancelled)
   - "Vous n'avez pas les droits de modification" (si non autorisé)
   - "Modifier cette prescription" (si autorisé)

## Règles de modification strictes

### Matrice de modification

| Statut de la prescription | Médecin créateur | Autre médecin | Admin | Pharmacien |
|---------------------------|------------------|---------------|-------|------------|
| **pending** | ✅ Oui | ❌ Non | ✅ Oui | ❌ Non |
| **dispensed** | ❌ Non | ❌ Non | ❌ Non | ❌ Non |
| **expired** | ❌ Non | ❌ Non | ❌ Non | ❌ Non |
| **cancelled** | ❌ Non | ❌ Non | ❌ Non | ❌ Non |

### Restrictions de modification par champ

| Type de champ | Statut | Raison de verrouillage |
|---------------|--------|------------------------|
| ID / Numéro de prescription | 🔒 **Verrouillé** | Identifiant unique pour la base de données et l'audit |
| Identité du Patient | 🔒 **Verrouillé** | Empêche d'attribuer par erreur un traitement au mauvais dossier |
| Date de création initiale | 🔒 **Verrouillé** | Preuve de l'antériorité du soin |
| Médecin prescripteur | 🔒 **Verrouillé** | Responsabilité médicale claire |
| Diagnostic | ✏️ **Modifiable** | Uniquement si statut = 'pending' |
| Médicaments / Posologie | ✏️ **Modifiable** | Uniquement si statut = 'pending' |
| Date d'expiration | ✏️ **Modifiable** | Uniquement si statut = 'pending' |
| Notes additionnelles | ✏️ **Modifiable** | Uniquement si statut = 'pending' |

## Audit et traçabilité

### Structure du log d'audit

Chaque modification est enregistrée dans la table `prescription_audit_log` avec:

```json
{
  "prescription_id": "uuid-prescription",
  "action": "edited",
  "performed_by": "uuid-user",
  "performed_at": "2025-01-27T10:30:00Z",
  "details": {
    "fields_modified": ["diagnosis", "notes", "items"],
    "items_added": 1,
    "items_removed": 0,
    "items_modified": 2
  },
  "old_values": {
    "diagnosis": "Grippe saisonnière",
    "notes": "Repos recommandé",
    "items": [...]
  },
  "new_values": {
    "diagnosis": "Grippe saisonnière avec complications",
    "notes": "Repos strict recommandé pendant 5 jours",
    "items": [...]
  }
}
```

### Informations capturées

- **Qui**: Utilisateur ayant effectué la modification (`performed_by`)
- **Quand**: Timestamp exact (`performed_at`)
- **Quoi**: Champs modifiés avec valeurs avant/après
- **Détails**: Nombre d'items ajoutés/supprimés/modifiés

## Flux d'utilisation

### Scénario 1: Médecin modifie sa propre prescription

1. Médecin se connecte avec son compte
2. Navigue vers "Ordonnances"
3. Voit un bouton crayon bleu à côté de ses prescriptions en attente
4. Clique sur "Modifier"
5. Modal s'ouvre avec:
   - Champs verrouillés (patient, numéro, date) en gris
   - Champs modifiables (diagnostic, médicaments) actifs
6. Effectue ses modifications
7. Clique "Enregistrer les Modifications"
8. Modification enregistrée + log d'audit créé
9. Toast de confirmation affiché
10. Liste des prescriptions rafraîchie

### Scénario 2: Pharmacien tente de modifier (bloqué)

1. Pharmacien se connecte
2. Navigue vers "Ordonnances"
3. **Ne voit pas** le bouton "Modifier" (masqué par RBAC)
4. Peut uniquement voir et dispenser les prescriptions

### Scénario 3: Médecin tente de modifier une prescription dispensée (bloqué)

1. Médecin clique sur le bouton "Modifier" (icône grisée)
2. Message d'erreur s'affiche: "Cette prescription a déjà été dispensée et ne peut plus être modifiée"
3. Modal ne s'ouvre pas
4. Aucune modification possible

### Scénario 4: Administrateur modifie n'importe quelle prescription

1. Admin se connecte
2. Peut modifier toutes les prescriptions en attente (même celles d'autres médecins)
3. Modification enregistrée avec `performed_by` = admin ID
4. Audit log complet créé

## Validation et messages d'erreur

### Validations côté client

- ✅ Tous les champs obligatoires doivent être remplis
- ✅ Au moins un médicament doit être présent
- ✅ La date d'expiration doit être dans le futur
- ✅ Le statut doit être 'pending'

### Messages d'erreur contextuels

| Situation | Message |
|-----------|---------|
| Prescription dispensée | "Cette prescription a déjà été dispensée et ne peut plus être modifiée" |
| Prescription expirée | "Cette prescription est expirée et ne peut plus être modifiée" |
| Prescription annulée | "Cette prescription a été annulée et ne peut plus être modifiée" |
| Manque de permissions | "Vous n'êtes pas autorisé à modifier cette prescription" |
| Champs incomplets | "Veuillez remplir tous les champs obligatoires" |
| Aucun médicament | "Au moins un médicament doit être prescrit" |

### Messages de succès

- ✅ "Prescription modifiée avec succès" (toast vert avec icône CheckCircle)

## Sécurité et conformité

### Niveaux de sécurité

1. **Interface (UI)**: Bouton masqué ou désactivé selon les permissions
2. **Application (Frontend)**: Vérification des permissions avant ouverture du modal
3. **API (Supabase)**: Row Level Security (RLS) policies empêchent les modifications non autorisées
4. **Base de données**: Contraintes CHECK sur le statut

### Conformité médico-légale

- ✅ Champs critiques verrouillés (patient, numéro, médecin)
- ✅ Modification impossible après dispensation
- ✅ Audit trail complet avec old_values/new_values
- ✅ Traçabilité de qui a modifié quoi et quand
- ✅ Impossibilité de contourner les règles

## Tests recommandés

### Matrice de tests

| # | Rôle | Action | Statut prescription | Résultat attendu |
|---|------|--------|---------------------|------------------|
| 1 | Médecin | Modifier sa prescription | pending | ✅ Succès |
| 2 | Médecin | Modifier prescription d'un autre | pending | ❌ Bouton invisible |
| 3 | Médecin | Modifier sa prescription | dispensed | ❌ Bouton grisé + erreur |
| 4 | Admin | Modifier n'importe quelle prescription | pending | ✅ Succès |
| 5 | Pharmacien | Modifier prescription | pending | ❌ Bouton invisible |
| 6 | Médecin | Ajouter un médicament | pending | ✅ Succès |
| 7 | Médecin | Supprimer un médicament | pending | ✅ Succès (avec confirmation) |
| 8 | Médecin | Modifier puis annuler | pending | ✅ Aucun changement |
| 9 | Médecin | Soumettre formulaire incomplet | pending | ❌ Erreur validation |
| 10 | Admin | Voir l'audit log | N/A | ✅ Toutes modifications visibles |

## Fichiers modifiés/créés

### Fichiers créés

1. `/src/components/prescriptions/EditPrescriptionModal.tsx` (743 lignes)
   - Composant modal complet de modification
   - Gestion des états et validation
   - Interface utilisateur avec champs verrouillés

### Fichiers modifiés

1. `/src/config/rbac.ts`
   - Ajout de `edit_own_prescriptions` pour les médecins
   - Ajout de `edit_all_prescriptions` pour les admins
   - Attribution aux rôles appropriés

2. `/src/pages/staff/PrescriptionsPage.tsx`
   - Import du composant EditPrescriptionModal
   - Import du hook useRBAC et icône Pencil
   - Ajout de l'état `editingPrescription`
   - Ajout des variables de permissions
   - Fonction `canEditPrescription()`
   - Fonction `getEditTooltip()`
   - Fonction `handleEditClick()`
   - Bouton "Modifier" dans la colonne Actions
   - Rendu conditionnel du modal d'édition

## Améliorations UX

### Indicateurs visuels

- 🔒 Icône de cadenas pour les champs verrouillés
- 🟦 Fond gris clair pour la section des informations verrouillées
- ✏️ Icône crayon pour le bouton "Modifier"
- ⚠️ Badge de statut coloré (jaune=pending, vert=dispensed, rouge=expiré)
- 📋 Section "Informations verrouillées" distincte visuellement

### Confirmations et feedback

- ❓ Confirmation avant suppression d'un médicament
- ✅ Toast de succès après sauvegarde
- ❌ Messages d'erreur clairs et contextuels
- ⏳ Indicateur de chargement pendant la sauvegarde

### Responsive design

- 📱 Modal adapté mobile avec scroll vertical
- 💻 Grille responsive (1 colonne mobile, 2 colonnes desktop)
- 🖱️ Transitions fluides et animations subtiles

## Performance

- ⚡ Chargement des données optimisé (une seule requête pour les items)
- 🔄 Rafraîchissement de la liste uniquement après succès
- 💾 Validation côté client avant appel serveur
- 📊 Préparation des données d'audit en une passe

## Compatibilité

- ✅ TypeScript strict mode
- ✅ Build Vite sans erreurs
- ✅ Compatible avec le système RBAC existant
- ✅ Réutilise les composants existants
- ✅ Cohérence avec le design Tailwind CSS

## Conclusion

Cette implémentation apporte une fonctionnalité de modification de prescriptions complète, sécurisée et conforme aux exigences médico-légales. Le système RBAC garantit que seuls les utilisateurs autorisés peuvent modifier les prescriptions en attente, avec une traçabilité complète de toutes les actions.

**Caractéristiques clés**:
- 🔐 Sécurité maximale (3 niveaux de contrôle)
- 📝 Traçabilité complète (audit log détaillé)
- 🔒 Intégrité des données (champs critiques verrouillés)
- 👥 Contrôle d'accès par rôle (RBAC strict)
- 🎨 Interface intuitive et professionnelle
- ✅ Validation complète et messages clairs

**Conformité médico-légale**:
- Respect des règles de modification de documents médicaux
- Audit trail complet pour traçabilité légale
- Verrouillage post-dispensation obligatoire
- Impossibilité de modifier les champs critiques
