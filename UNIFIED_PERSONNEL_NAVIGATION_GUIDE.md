# 📍 Guide de Navigation - Personnel Unifié

## 🎯 Accès au Module

Le module **Personnel Unifié** est intégré dans le sous-menu **Ressources Humaines** conformément au plan stratégique d'intégration.

### Chemin d'Accès

```
Menu Principal → Ressources Humaines → Personnel Unifié
```

### Navigation Détaillée

1. **Se connecter** avec un compte `hospital_admin` ou `super_admin`

2. **Cliquer sur "Ressources Humaines"** dans le menu latéral gauche
   - Icône : 💼 Briefcase
   - Le sous-menu se déplie automatiquement

3. **Cliquer sur "Personnel Unifié"**
   - 2ème option du sous-menu
   - Icône : 👥 Users

---

## 📋 Structure du Sous-Menu RH

Le module Personnel Unifié s'intègre dans la structure suivante :

```
💼 Ressources Humaines
├── 📊 Tableau de Bord RH
├── 👥 Personnel Unifié ← NOUVEAU
├── ➕ Employés
├── 📄 Contrats
├── 💵 Paie
├── ⏰ Ma Présence
├── 📈 Gestion Présence
├── 📍 Audit Pointages
├── 📅 Congés
└── 📄 Rapport Migration
```

---

## 🎨 Positionnement Stratégique

### Pourquoi dans le sous-menu RH ?

✅ **Cohérence Organisationnelle**
- Personnel Unifié = Vue consolidée RH + Médical
- Logiquement rattaché au module RH

✅ **Facilité d'Accès**
- Positionné en 2ème pour un accès rapide
- Juste après le Tableau de Bord RH

✅ **Conformité au Plan**
- Respecte le plan stratégique initial
- Intégration logique avec les autres fonctionnalités RH

---

## 🔑 Permissions

### Rôles Autorisés

- ✅ `hospital_admin` (Administrateur Hospitalier)
- ✅ `super_admin` (Super Administrateur)

### Rôles Non Autorisés

- ❌ `doctor` (Médecin)
- ❌ `nurse` (Infirmier/ère)
- ❌ `receptionist` (Réceptionniste)
- ❌ `administrative_staff` (Personnel Administratif)
- ❌ Autres rôles

---

## 💡 Conseils d'Utilisation

### Accès Rapide

1. **Marquer comme Favori** (en navigation)
   - Ouvrir le sous-menu RH
   - Le système garde le sous-menu ouvert pendant la session

2. **Navigation Clavier** (future fonctionnalité)
   - Alt + R → Ressources Humaines
   - Flèche Bas × 1 → Personnel Unifié
   - Entrée

### Workflow Recommandé

1. **Début de Journée**
   - Aller dans Personnel Unifié
   - Vérifier les statistiques générales
   - Identifier les profils incomplets

2. **Recherche d'Employé**
   - Utiliser la recherche rapide
   - Consulter le profil 360°

3. **Actions Complémentaires**
   - Retourner dans "Employés" ou modules spécialisés pour modifications
   - Revenir dans Personnel Unifié pour vérification

---

## 🔄 Relation avec Autres Modules

### Depuis Personnel Unifié

**Liens vers** :
- 🔗 **Employés** : Pour éditer les données RH
- 🔗 **Contrats** : Pour gérer les contrats
- 🔗 **Personnel Médical** : Pour éditer les credentials médicaux

### Vers Personnel Unifié

**À partir de** :
- 📊 Tableau de Bord RH → Lien vers Personnel Unifié
- ➕ Employés → "Voir profil unifié" (Phase 2)
- 🩺 Personnel Médical → "Voir profil RH" (Phase 2)

---

## 🆘 Dépannage

### Je ne vois pas "Personnel Unifié"

**Cause 1 : Permissions Insuffisantes**
- ✅ Solution : Se connecter avec un compte `hospital_admin` ou `super_admin`

**Cause 2 : Sous-menu Fermé**
- ✅ Solution : Cliquer sur "Ressources Humaines" pour ouvrir le sous-menu

**Cause 3 : Cache du Navigateur**
- ✅ Solution : Rafraîchir la page (Ctrl+F5 ou Cmd+Shift+R)

### Le sous-menu ne s'ouvre pas

**Solution** :
1. Vérifier que vous êtes connecté
2. Vérifier votre rôle dans Paramètres → Mon Profil
3. Contacter l'administrateur système si le problème persiste

---

## 📱 Version Mobile (Future)

### Navigation Mobile

Sur mobile, le menu sera accessible via :

```
☰ Menu Hamburger
  → Ressources Humaines
    → Personnel Unifié
```

---

## 🎓 Formation

### Pour Nouveaux Utilisateurs

1. **Vidéo de Démonstration** : [À venir]
2. **Documentation Complète** : `UNIFIED_PERSONNEL_IMPLEMENTATION.md`
3. **Guide Rapide** : `UNIFIED_PERSONNEL_QUICK_START.md`
4. **Support** : Contacter l'équipe RH

### Pour Formateurs

**Points Clés à Montrer** :
1. ✅ Où trouver le module (chemin exact)
2. ✅ Comment rechercher un employé
3. ✅ Comment interpréter les badges et statistiques
4. ✅ Différence entre profil médical, administratif, et hybride

---

## 📊 Métriques d'Adoption

### KPIs de Navigation

| Métrique | Objectif |
|----------|----------|
| Temps pour trouver le module | < 10 secondes |
| Clics pour accéder | 2 clics max |
| Taux de réussite première fois | > 95% |

---

## 🗺️ Feuille de Route

### Phase Actuelle (Phase 1)

✅ Intégration dans sous-menu RH
✅ Navigation fonctionnelle
✅ Accès basé sur les rôles

### Phase 2 (Planifiée)

⏳ Liens bidirectionnels avec autres modules
⏳ Raccourcis clavier
⏳ Version mobile optimisée
⏳ Widget "Accès Rapide" sur Tableau de Bord RH

---

**Document préparé par** : Équipe de Développement OKAPIA Medical
**Date** : 25 janvier 2026
**Version** : 1.1 (Mise à jour intégration RH)
**Statut** : Navigation Intégrée dans RH ✅
