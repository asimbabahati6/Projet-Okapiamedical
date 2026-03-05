# Système RBAC Granulaire - OKAPIA Medical

## 🎯 Vue d'Ensemble

Le système RBAC (Role-Based Access Control) granulaire d'OKAPIA Medical permet de contrôler finement l'accès aux fonctionnalités des modules Laboratoire, Pharmacie et Radiologie selon le rôle de l'utilisateur.

---

## ✨ Fonctionnalités Principales

### Contrôle d'Accès Multi-Niveaux

- **Niveau UI** : Masquage, désactivation ou affichage restreint des éléments
- **Niveau Routing** : Redirection automatique si accès non autorisé
- **Niveau Backend** : Row Level Security (RLS) dans Supabase

### Module Radiologie Complet

- Dashboard avec statistiques en temps réel
- File d'attente des examens avec filtres avancés
- Espace de travail pour réalisation des examens
- Upload d'images DICOM et génération de rapports
- Workflow de validation (Technicien → Chef Radio → Médecin)
- Visualiseur d'images avec zoom, rotation, plein écran

### Composants Réutilisables

- `AccessControl` : Wrapper pour contrôler l'affichage
- `ProtectedAction` : Boutons protégés avec tooltips
- Badges de permissions (Accès complet, Lecture seule, etc.)
- Messages contextuels d'accès

---

## 🚀 Démarrage Rapide

### 1. Pour Tester le Système

Suivez le guide : **[RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)**

**Temps estimé :** 1-2 heures
**Prérequis :** Comptes utilisateurs avec différents rôles

### 2. Pour Comprendre l'Architecture

Consultez : **[RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)**

**Temps estimé :** 30-60 minutes
**Contenu :** Architecture, composants, hooks, sécurité

### 3. Pour Voir les Livrables

Lisez : **[RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md)**

**Temps estimé :** 10-15 minutes
**Contenu :** Résumé exécutif, métriques, statistiques

---

## 📚 Documentation Complète

### Index de Navigation

→ **[RBAC_DOCUMENTATION_INDEX.md](./RBAC_DOCUMENTATION_INDEX.md)**

Trouvez rapidement la documentation dont vous avez besoin par :
- Profil utilisateur (Développeur, Testeur, Chef de projet)
- Module (Laboratoire, Pharmacie, Radiologie)
- Composant technique (AccessControl, Hooks, Badges)
- Tâche (Tester, Comprendre, Modifier)

### Documents Disponibles

1. **[RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md)** (15 pages)
   - Résumé exécutif
   - Livrables complets
   - Métriques de qualité

2. **[RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)** (40 pages)
   - Documentation technique complète
   - Matrice des permissions
   - Guide d'utilisation des composants

3. **[RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)** (30 pages)
   - Guide de démarrage rapide
   - Scénarios de test
   - Workflow complet Radiologie

4. **[RBAC_DOCUMENTATION_INDEX.md](./RBAC_DOCUMENTATION_INDEX.md)** (10 pages)
   - Index de navigation
   - Recherche rapide
   - Checklist de lecture

---

## 🎭 Rôles et Permissions

### Laboratoire

| Rôle | Permissions |
|------|-------------|
| **Médecin** | 👁️ Lecture seule (dashboard, statistiques) |
| **Technicien Labo** | ✅ Accès complet (CRUD, saisie résultats) |
| **Responsable Labo** | ✅ Accès complet + validation |

### Pharmacie

| Rôle | Permissions |
|------|-------------|
| **Médecin** | 👁️ Consultation disponibilité uniquement |
| **Pharmacien** | ✅ Dispensation + gestion inventaire |
| **Responsable Pharmacie** | ✅ Accès complet + gestion fournisseurs |

### Radiologie

| Rôle | Permissions |
|------|-------------|
| **Médecin** | 📝 Prescription + consultation rapports validés |
| **Technicien Radio** | 🖼️ Réalisation + upload images + rédaction rapports |
| **Chef Radio** | ✅ Tout + **validation rapports** |
| **Médecin Directeur** | 👑 Contrôle total |

---

## 💻 Exemples de Code

### Utiliser AccessControl

```tsx
import { AccessControl } from '../components/common/AccessControl';

<AccessControl
  permission="radiology_validate_reports"
  mode="hide"
>
  <ValidationPanel />
</AccessControl>
```

### Utiliser ProtectedAction

```tsx
import { ProtectedAction } from '../components/common/ProtectedAction';

<ProtectedAction
  permission="lab_edit_results"
  onClick={handleEdit}
  tooltip="Vous n'avez pas les droits pour modifier"
  className="btn btn-primary"
>
  Modifier
</ProtectedAction>
```

### Utiliser un Hook de Permissions

```tsx
import { useRadiologyPermissions } from '../hooks/useRadiologyPermissions';

function MyComponent() {
  const permissions = useRadiologyPermissions();

  return (
    <div>
      {permissions.canValidateReports && (
        <button onClick={handleValidate}>Valider</button>
      )}
    </div>
  );
}
```

---

## 🔒 Sécurité

### 3 Niveaux de Protection

1. **UI** - Composants masqués/désactivés selon permissions
2. **Routes** - Redirections automatiques si accès non autorisé
3. **Backend** - RLS Supabase empêche l'accès direct aux données

### Bonnes Pratiques

- ✅ Toujours vérifier les permissions côté backend
- ✅ Utiliser les composants et hooks fournis
- ✅ Logger les actions critiques
- ✅ Tester avec tous les rôles

---

## 🎨 Design System

### Couleurs par Module

- **Laboratoire** : Teal (`#14b8a6`)
- **Pharmacie** : Bleu (`#2563eb`)
- **Radiologie** : Cyan (`#06b6d4`)

### Composants UI

Tous les composants suivent le design system existant avec :
- Tailwind CSS pour le styling
- Lucide React pour les icônes
- Transitions fluides
- Responsive design

---

## 🧪 Tests

### Workflow de Test Complet

1. **Créer les comptes de test** (5 min)
2. **Tester Laboratoire** (15 min)
3. **Tester Pharmacie** (15 min)
4. **Tester Radiologie** (30 min)
5. **Valider la sécurité** (15 min)

**Total : ~1h30**

Voir : [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)

---

## 📊 Statistiques

### Code Créé

- **Nouveaux fichiers :** 25+
- **Composants :** 15+
- **Hooks :** 3
- **Routes :** 6
- **Permissions :** 17

### Documentation

- **Pages :** 40+
- **Exemples de code :** 30+
- **Scénarios de test :** 7

---

## 🛠️ Maintenance

### Ajouter une Permission

1. Modifier `src/config/rbac.ts`
2. Mettre à jour le hook correspondant
3. Utiliser dans les composants
4. Tester
5. Documenter

### Modifier une Permission

1. Rechercher tous les usages
2. Mettre à jour la configuration
3. Tester avec tous les rôles
4. Mettre à jour la documentation

---

## 🆘 Support

### En cas de problème

1. **Consulter** "Dépannage Rapide" dans [RBAC_QUICK_START_GUIDE.md](./RBAC_QUICK_START_GUIDE.md)
2. **Vérifier** les logs (console navigateur + Supabase)
3. **Tester** avec un autre rôle
4. **Ouvrir** un ticket avec détails

### Ressources

- Documentation complète dans `/RBAC_*.md`
- Code source dans `/src`
- Exemples d'utilisation dans les pages

---

## ✅ Statut du Projet

**Version :** 1.0
**Date :** 2025-02-25
**Statut :** ✅ **Prêt pour Production**

### Checklist de Validation

- [x] Configuration RBAC complète
- [x] Composants réutilisables créés
- [x] Hooks de permissions fonctionnels
- [x] Module Radiologie complet
- [x] Routes protégées intégrées
- [x] Build réussi
- [x] Documentation exhaustive
- [ ] Tests utilisateurs
- [ ] Formation équipe
- [ ] Déploiement production

---

## 🎓 Technologies Utilisées

- React 18 avec Hooks
- TypeScript strict
- React Router v7
- Supabase (PostgreSQL + Storage)
- Tailwind CSS
- Lucide React (icônes)

---

## 👥 Contributeurs

**Équipe Technique OKAPIA Medical**
- Architecture et développement
- Tests et validation
- Documentation

---

## 📄 Licence

Propriétaire - OKAPIA Medical
Tous droits réservés

---

## 🔗 Liens Rapides

- [📖 Index de Navigation](./RBAC_DOCUMENTATION_INDEX.md)
- [📚 Documentation Technique](./RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md)
- [🚀 Guide de Démarrage](./RBAC_QUICK_START_GUIDE.md)
- [📊 Résumé d'Implémentation](./RBAC_IMPLEMENTATION_SUMMARY.md)

---

**Pour toute question, consultez d'abord la documentation. Bon développement ! 🚀**
