# Index de la Documentation RBAC - OKAPIA Medical

## 📚 Guide de Navigation

Ce document vous aide à trouver rapidement la documentation dont vous avez besoin concernant le système RBAC (Role-Based Access Control) de l'application OKAPIA Medical.

---

## 🎯 Par Profil Utilisateur

### Je suis Développeur

**Je veux comprendre l'architecture :**
→ [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Je veux ajouter une nouvelle permission :**
→ Section "Maintenance et Évolution" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Je veux voir un exemple de code :**
→ Section "Composants de Contrôle d'Accès" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

### Je suis Testeur / QA

**Je veux tester le système RBAC :**
→ [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)

**Je veux des scénarios de test :**
→ Section "Scénarios de Test" dans [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)

**Je veux une checklist de validation :**
→ Section "Checklist de Validation Finale" dans [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)

### Je suis Chef de Projet / Product Owner

**Je veux un résumé exécutif :**
→ [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md)

**Je veux voir ce qui a été livré :**
→ Section "Livrables" dans [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md)

**Je veux les métriques :**
→ Section "Métriques de Qualité" dans [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md)

### Je suis Utilisateur Final

**Je veux comprendre mes permissions :**
→ Section "Matrice des Permissions" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Je veux un guide rapide :**
→ [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)

---

## 📖 Par Module

### Module Laboratoire

**Permissions disponibles :**
→ Section "LABORATOIRE" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Tests du module :**
→ Section "Test 1 & 2 : Module Laboratoire" dans [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)

**Hook de permissions :**
→ `src/hooks/useLabPermissions.ts`

### Module Pharmacie

**Permissions disponibles :**
→ Section "PHARMACIE" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Tests du module :**
→ Section "Test 3 & 4 : Module Pharmacie" dans [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)

**Hook de permissions :**
→ `src/hooks/usePharmacyPermissions.ts`

### Module Radiologie

**Permissions disponibles :**
→ Section "RADIOLOGIE" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Tests du module :**
→ Section "Test 5, 6 & 7 : Module Radiologie" dans [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)

**Guide complet :**
→ Section "Module Radiologie - Guide Complet" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Hook de permissions :**
→ `src/hooks/useRadiologyPermissions.ts`

---

## 🔧 Par Composant Technique

### AccessControl

**Documentation :**
→ Section "AccessControl Component" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Fichier source :**
→ `src/components/common/AccessControl.tsx`

**Exemples d'utilisation :**
→ Rechercher "AccessControl" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

### ProtectedAction

**Documentation :**
→ Section "ProtectedAction Component" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Fichier source :**
→ `src/components/common/ProtectedAction.tsx`

**Exemples d'utilisation :**
→ Voir les pages du module Radiologie

### Permission Badges

**Documentation :**
→ Section "Permission Badges" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Fichier source :**
→ `src/components/common/PermissionBadges.tsx`

**Types disponibles :**
- `FullAccessBadge`
- `ReadOnlyBadge`
- `RestrictedAccessBadge`
- `LimitedAccessBadge`

### Hooks de Permissions

**Documentation générale :**
→ Section "Hooks de Permissions" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Fichiers sources :**
- `src/hooks/useLabPermissions.ts`
- `src/hooks/usePharmacyPermissions.ts`
- `src/hooks/useRadiologyPermissions.ts`

---

## 🎓 Par Tâche

### Je veux tester le système

1. Lire [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)
2. Créer les comptes de test (Étape 1)
3. Suivre les scénarios (Étape 2)
4. Valider avec la checklist (Étape 6)

### Je veux comprendre une permission

1. Ouvrir [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)
2. Chercher le module concerné (Ctrl+F)
3. Lire la section "Permissions Disponibles"
4. Consulter les "Scénarios d'Utilisation"

### Je veux modifier une permission

1. Lire "Maintenance et Évolution" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)
2. Modifier `src/config/rbac.ts`
3. Mettre à jour le hook correspondant
4. Tester avec différents rôles
5. Mettre à jour la documentation

### Je veux ajouter un nouveau module

1. Suivre l'exemple du module Radiologie
2. Créer la structure dans `src/modules/[module-name]/`
3. Définir les permissions dans `rbac.ts`
4. Créer le hook de permissions
5. Créer les routes protégées
6. Documenter

### Je veux résoudre un problème

1. Consulter "Dépannage Rapide" dans [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)
2. Vérifier les logs dans la console navigateur
3. Vérifier les logs Supabase
4. Consulter la documentation technique

---

## 📊 Par Type d'Information

### Architecture

**Vue d'ensemble :**
→ Section "Architecture du Système RBAC" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Composants principaux :**
→ Section "Composants Principaux" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Diagrammes :**
→ [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md) - Section "Structure"

### Sécurité

**Niveaux de contrôle :**
→ Section "Sécurité et Bonnes Pratiques" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

**Tests de sécurité :**
→ Section "Tests de Sécurité" dans [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)

**RLS (Row Level Security) :**
→ Section "Sécurité" dans [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md)

### Design

**Charte couleurs :**
→ Section "Design System" dans [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md)

**Composants UI :**
→ Section "Composants UI Cohérents" dans [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md)

**Badges et messages :**
→ Section "Permission Badges" et "Messages d'Accès" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

### Performances

**Optimisations :**
→ Section "Performance" dans [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md)

**Métriques :**
→ Section "Métriques de Qualité" dans [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md)

---

## 🚀 Démarrage Rapide

### Nouveaux Développeurs

1. **Lire en premier :**
   - [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md) (10 min)

2. **Comprendre l'architecture :**
   - [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md) (30 min)

3. **Tester le système :**
   - [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md) (1h)

### Nouveaux Testeurs

1. **Guide de test :**
   - [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md) (1h)

2. **Comprendre les permissions :**
   - Section "Matrice des Permissions" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md) (20 min)

3. **Checklist de validation :**
   - Section "Checklist" dans [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md) (30 min)

---

## 📁 Fichiers de Configuration

### Configuration Principale

**Fichier :** `src/config/rbac.ts`
**Contenu :**
- Définition des rôles
- Attribution des permissions
- Configuration du menu

**Documentation :**
→ Section "Configuration des Permissions" dans [RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)

### Routes

**Fichiers :**
- `src/routes/RadiologyRoutes.tsx`
- `src/App.tsx` (intégration)

**Documentation :**
→ Section "Routes Protégées" dans [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md)

---

## 🔍 Recherche Rapide

### Par Mot-clé

| Mot-clé | Document | Section |
|---------|----------|---------|
| "permission" | RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md | Matrice des Permissions |
| "test" | RBAC_QUICK_START_GUIDE.md | Scénarios de Test |
| "composant" | RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md | Composants de Contrôle |
| "hook" | RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md | Hooks de Permissions |
| "sécurité" | RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md | Sécurité et Bonnes Pratiques |
| "radiologie" | RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md | Module Radiologie |
| "laboratoire" | RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md | LABORATOIRE |
| "pharmacie" | RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md | PHARMACIE |
| "workflow" | RBAC_QUICK_START_GUIDE.md | Workflow Complet |
| "badge" | RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md | Permission Badges |

---

## 📞 Support et Contacts

### Questions Techniques

- Consulter la documentation
- Vérifier les logs
- Ouvrir un ticket

### Bugs / Issues

- Vérifier "Dépannage Rapide" dans [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)
- Consulter les logs
- Signaler avec détails

### Améliorations

- Proposer via le système de tickets
- Documenter le besoin
- Justifier l'ajout

---

## 📝 Versions de la Documentation

| Version | Date | Changements |
|---------|------|-------------|
| 1.0 | 2025-02-25 | Version initiale - Implémentation complète RBAC |

---

## ✅ Checklist de Lecture Recommandée

### Développeur Backend
- [x] RBAC_IMPLEMENTATION_SUMMARY.md
- [x] RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md (Sections Architecture et Sécurité)
- [ ] Configuration `rbac.ts`

### Développeur Frontend
- [x] RBAC_IMPLEMENTATION_SUMMARY.md
- [x] RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md (Sections Composants et Hooks)
- [ ] Exemples de code

### Testeur QA
- [x] RBAC_QUICK_START_GUIDE.md
- [x] RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md (Section Matrice des Permissions)
- [ ] Checklist de validation

### Chef de Projet
- [x] RBAC_IMPLEMENTATION_SUMMARY.md
- [ ] Section Métriques et Livrables

---

**Dernière mise à jour :** 2025-02-25
**Statut :** ✅ Documentation Complète
