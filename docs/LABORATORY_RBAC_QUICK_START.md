# Guide de Démarrage Rapide - RBAC Laboratoire

## Résumé en 30 Secondes

Le module Laboratoire d'OKAPIA Medical dispose maintenant d'un système RBAC sécurisé à 5 niveaux:

**Qui peut faire quoi:**
- **Admin, Médecin Directeur, Personnel Labo**: Tout (CRUD complet)
- **Médecin**: Prescrire et consulter uniquement (pas modifier/supprimer)
- **Autres rôles**: Onglet masqué, aucun accès

## Matrice Rapide des Permissions

| Rôle | Menu | Créer | Voir | Modifier | Supprimer |
|------|------|-------|------|----------|-----------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Médecin Directeur | ✅ | ✅ | ✅ | ✅ | ✅ |
| Personnel Labo | ✅ | ✅ | ✅ | ✅ | ✅ |
| Médecin | ✅ | ✅ | ✅ | ❌ | ❌ |
| Autres | ❌ | ❌ | ❌ | ❌ | ❌ |

## Fichiers Créés

```
src/
├── components/
│   ├── common/
│   │   └── PermissionGuard.tsx         # Protection de page
│   └── laboratory/
│       └── LabOrderActions.tsx         # Actions conditionnelles
├── hooks/
│   └── useLabOrderActions.ts           # Validation centralisée
└── services/
    └── laboratoryAuditService.ts       # Traçabilité complète

docs/
├── LABORATORY_RBAC_IMPLEMENTATION.md   # Documentation complète
└── LABORATORY_RBAC_QUICK_START.md      # Ce fichier
```

## Fichiers Modifiés

```
src/
├── config/
│   └── rbac.ts                         # Rôles autorisés mis à jour
├── hooks/
│   └── useRolePermissions.ts           # Permissions laboratoire
├── pages/staff/
│   └── LaboratoryPage.tsx              # Intégration sécurité
└── components/laboratory/
    └── AddLabOrderModal.tsx            # Validation ajoutée
```

## Migrations Supabase Appliquées

1. **`laboratory_rbac_policies`**: Politiques RLS sur `lab_orders`
2. **`laboratory_audit_logs_table`**: Table d'audit pour traçabilité

## Test Rapide

### 1. Tester en tant qu'Admin
```bash
# Connexion avec compte admin
# Vérifier: Onglet visible, tous boutons actifs, pas de bandeau
```

### 2. Tester en tant que Médecin
```bash
# Connexion avec compte médecin
# Vérifier: Onglet visible, bouton "Nouvelle Analyse" actif
# Vérifier: Bandeau jaune affiché
# Vérifier: Colonne Actions montre uniquement "Détails"
```

### 3. Tester en tant que Réceptionniste
```bash
# Connexion avec compte réceptionniste
# Vérifier: Onglet Laboratoire INVISIBLE dans le menu
# Tenter accès direct: /staff/laboratory
# Vérifier: Redirection automatique vers /staff/dashboard
```

## Commandes Utiles

### Vérifier les Logs d'Audit
```typescript
import { labAuditService } from '../services/laboratoryAuditService';

// Voir les tentatives refusées
const denied = await labAuditService.getDeniedAccessAttempts(10);
console.log('Tentatives refusées:', denied);

// Activité d'un utilisateur
const activity = await labAuditService.getUserActivitySummary(userId);
console.log('Activité:', activity);
```

### Vérifier les Permissions d'un Utilisateur
```typescript
import { useRolePermissions } from '../hooks/useRolePermissions';

const permissions = useRolePermissions('laboratory');
console.log('Permissions:', permissions);
// {
//   canCreate: true/false,
//   canEdit: true/false,
//   canDelete: true/false,
//   canViewDetails: true/false,
//   canExport: true/false,
//   isReadOnly: true/false,
//   role: 'doctor'
// }
```

### Vérifier les Politiques RLS
```sql
-- Lister toutes les politiques sur lab_orders
SELECT * FROM pg_policies WHERE tablename = 'lab_orders';

-- Vérifier si RLS est activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'lab_orders';
```

## Messages d'Erreur Communs

### "Droits insuffisants pour créer une analyse"
**Cause**: L'utilisateur n'a pas la permission `canCreate`
**Solution**: Vérifier le rôle de l'utilisateur et la configuration des permissions

### "Les médecins ne peuvent pas modifier les résultats d'analyse"
**Cause**: Un médecin tente de modifier un résultat existant
**Solution**: Normal - c'est le comportement attendu. Seul le personnel de labo peut modifier

### "Accès au module Laboratoire refusé"
**Cause**: Utilisateur avec un rôle non autorisé tente d'accéder directement
**Solution**: Normal - l'utilisateur sera redirigé automatiquement

## Architecture en 3 Points

1. **Frontend**: Composants conditionnels + Validation hooks
2. **Backend**: Politiques RLS Supabase
3. **Audit**: Table de logs pour traçabilité complète

## Sécurité en 5 Niveaux

```
1. Menu (Masquage)
   ↓
2. Page Guard (Redirection)
   ↓
3. UI Components (Boutons conditionnels)
   ↓
4. Client Validation (Hooks)
   ↓
5. Database RLS (Supabase)
```

## Contacts & Support

- **Documentation complète**: `docs/LABORATORY_RBAC_IMPLEMENTATION.md`
- **Code source**: `src/components/laboratory/` et `src/hooks/`
- **Migrations**: `supabase/migrations/` (filtrer par "laboratory")

## Checklist de Déploiement

- [x] Migrations Supabase appliquées
- [x] Code frontend déployé
- [x] Tests de build réussis
- [ ] Tests utilisateurs par rôle
- [ ] Formation des utilisateurs finaux
- [ ] Monitoring des logs d'audit activé

---

**Version**: 1.0
**Date**: 26 Février 2026
**Status**: ✅ Production Ready
