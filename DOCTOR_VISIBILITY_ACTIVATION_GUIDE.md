# 🔍 Guide d'Activation - Système de Visibilité des Médecins

**Date d'implémentation :** 21 février 2026
**Version :** 1.0 - Production Ready
**Statut :** ✅ Déployable immédiatement

---

## 📋 Vue d'Ensemble du Médecin Directeur

En tant que **Médecin Directeur**, vous disposez désormais d'un outil complet pour :
- **Diagnostiquer** les problèmes de visibilité des médecins sur le site public
- **Corriger automatiquement** les configurations manquantes
- **Superviser** la présence en ligne de votre équipe médicale
- **Garantir** que tous les médecins actifs sont visibles pour les patients

---

## ✅ Statut de l'Implémentation

### Composants Livrés

| Composant | Statut | Description |
|-----------|--------|-------------|
| **Base de données** | ✅ Déployé | Migration 20260215210336 appliquée avec succès |
| **Vues de monitoring** | ✅ Actif | `doctors_visibility_status` et `invisible_doctors_report` |
| **Fonctions d'activation** | ✅ Actif | `activate_doctor()` et `bulk_activate_invisible_doctors()` |
| **Interface administrateur** | ✅ Intégré | Page `/staff/doctor-visibility` |
| **Navigation RBAC** | ✅ Configuré | Menu "Système" > "Visibilité Médecins" |
| **Service TypeScript** | ✅ Disponible | `doctorVisibilityService.ts` |
| **Build & Tests** | ✅ Validé | Compilation réussie |

---

## 🚀 Accès à l'Outil

### Pour les Administrateurs

1. **Se connecter** en tant qu'administrateur
2. **Naviguer** vers le menu latéral
3. **Ouvrir** "Système" → "Visibilité Médecins"
4. L'outil se charge automatiquement

### URL Directe
```
/staff/doctor-visibility
```

---

## 🎯 Utilisation de l'Outil

### 1. Vue d'Ensemble

Au chargement, vous verrez :

#### **Statistiques en Temps Réel**
- 📊 **Total des médecins** dans le système
- ✅ **Médecins visibles** sur le site public
- 👁️ **Médecins invisibles** nécessitant attention
- 🚨 **Problèmes critiques** à résoudre immédiatement

#### **Filtres Disponibles**
- **Invisible Only** : Affiche uniquement les médecins avec problèmes
- **All Doctors** : Vue complète de tous les médecins

### 2. Diagnostic Individuel

Pour chaque médecin, vous pouvez :

**Afficher les détails** en cliquant sur "Show Details" :
- ✅ Accepte des patients : Oui/Non
- 🏥 Département public : Oui/Non
- 📧 Email confirmé : Oui/Non
- 📅 Jours disponibles : Nombre
- 👤 Compte actif : Oui/Non

**Comprendre le statut** via les badges colorés :
- 🟢 **Visible** : Tout fonctionne correctement
- 🟠 **Invisible** : Configuration incomplète
- 🔴 **Critique** : Problème majeur nécessitant action immédiate

### 3. Correction Automatique

#### Activation Individuelle
```
1. Localiser le médecin invisible
2. Cliquer sur "Show Details" pour comprendre le problème
3. Cliquer sur "Activate" pour correction automatique
4. Le système effectue automatiquement :
   - Active l'acceptation de patients
   - Configure les horaires par défaut (Lun-Ven, 8h-17h)
   - Met à jour le statut
   - Rafraîchit les données
```

#### Activation en Masse
```
1. Cliquer sur le filtre "Invisible Only"
2. Vérifier la liste des médecins concernés
3. Cliquer sur "Bulk Activate All"
4. Confirmer l'action
5. Le système traite tous les médecins éligibles automatiquement
```

**⚠️ Note importante :** L'activation automatique ne fonctionne **PAS** pour :
- Comptes bannis (nécessite déblocage manuel)
- Emails non confirmés (nécessite validation utilisateur)

---

## 🔧 Que Fait l'Activation Automatique ?

Lorsque vous activez un médecin, le système exécute ces étapes :

### Étape 1 : Activation de l'Acceptation de Patients
```sql
UPDATE medical_staff
SET is_accepting_patients = true
WHERE id = 'doctor_id'
```

### Étape 2 : Création des Horaires par Défaut
```sql
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time)
VALUES
  ('doctor_id', 'Lundi', '08:00', '17:00'),
  ('doctor_id', 'Mardi', '08:00', '17:00'),
  ...
```

### Étape 3 : Mise à Jour du Statut
```sql
UPDATE medical_staff
SET current_status = 'available'
WHERE id = 'doctor_id'
```

### Étape 4 : Vérification Finale
Le système vérifie que le médecin est maintenant visible dans la vue publique.

---

## 📊 Critères de Visibilité

Un médecin est **VISIBLE** sur le site public si **TOUTES** ces conditions sont remplies :

| Critère | Description | Correction |
|---------|-------------|------------|
| ✅ **Accepte des patients** | `is_accepting_patients = true` | Automatique |
| ✅ **Département public** | `is_public = true` dans departments | Manuel |
| ✅ **Département actif** | `is_active = true` dans departments | Manuel |
| ✅ **Compte actif** | `is_active = true` dans auth.users | Manuel |
| ✅ **Email confirmé** | `confirmed_at IS NOT NULL` | Utilisateur |
| ✅ **Horaires disponibles** | Au moins 1 jour dans doctor_availability | Automatique |
| ✅ **Non banni** | `banned_until IS NULL` | Manuel |

---

## 🎨 Interface Utilisateur

### Codes Couleurs

#### Badges de Statut
- 🟢 **Vert** : Médecin visible et opérationnel
- 🟠 **Orange** : Configuration incomplète, peut être corrigé automatiquement
- 🟡 **Jaune** : Email non confirmé, action utilisateur requise
- 🔴 **Rouge** : Compte banni, intervention administrative requise

#### Badges de Priorité
- 🟢 **Normal** (0) : Tout fonctionne
- 🟡 **Medium** (5-6) : Attention requise
- 🟠 **High** (3-4) : Action recommandée
- 🔴 **Critical** (1-2) : Action urgente nécessaire

---

## 🔄 Workflow Recommandé

### Supervision Hebdomadaire (15 minutes)

```
Lundi matin, 8h00 :
1. Se connecter à l'interface admin
2. Accéder à "Visibilité Médecins"
3. Sélectionner le filtre "Invisible Only"
4. Si des médecins invisibles :
   a. Analyser les causes (Show Details)
   b. Si corrections automatiques possibles : "Bulk Activate All"
   c. Si interventions manuelles requises : noter et déléguer
5. Vérifier les statistiques globales
6. Documenter tout problème récurrent
```

### Intervention d'Urgence (5 minutes)

```
En cas de plainte d'un médecin sur sa visibilité :
1. Accéder immédiatement à l'outil
2. Rechercher le médecin concerné
3. Cliquer "Show Details" pour diagnostic précis
4. Si activation possible : "Activate" immédiatement
5. Si problème externe (email, ban) : contacter l'IT
6. Confirmer avec le médecin dans les 30 minutes
```

---

## 📈 Indicateurs de Performance (KPI)

### Objectifs du Médecin Directeur

| KPI | Cible | Mesure |
|-----|-------|--------|
| **Taux de visibilité** | > 95% | Médecins visibles / Total médecins |
| **Temps de résolution** | < 24h | Délai entre détection et correction |
| **Problèmes critiques** | 0 | Nombre de médecins en priorité 1-2 |
| **Satisfaction équipe** | > 90% | Médecins satisfaits de leur présence en ligne |

### Reporting Mensuel

```sql
-- Rapport mensuel de visibilité
SELECT
  COUNT(*) FILTER (WHERE visibility_status = 'Visible') as visible,
  COUNT(*) FILTER (WHERE visibility_status != 'Visible') as invisible,
  ROUND(100.0 * COUNT(*) FILTER (WHERE visibility_status = 'Visible') / COUNT(*), 2) as taux_visibilite
FROM doctors_visibility_status
WHERE created_at >= NOW() - INTERVAL '30 days';
```

---

## 🔐 Permissions et Sécurité

### Accès Restreint
- ✅ **Admin** : Accès complet à l'outil
- ❌ **Autres rôles** : Pas d'accès

### Actions Auditées
Toutes les actions d'activation sont enregistrées avec :
- ID de l'administrateur qui a effectué l'action
- Date et heure de l'intervention
- Étapes effectuées
- Résultat (succès/échec)

---

## 🆘 Résolution de Problèmes

### Problème : Médecin invisible après activation

**Diagnostic :**
```
1. Vérifier si le département est public
2. Vérifier si l'email est confirmé
3. Vérifier si le compte n'est pas banni
```

**Solution :**
```
- Si département non public : Contacter l'administrateur système
- Si email non confirmé : Demander au médecin de valider son email
- Si compte banni : Débloquer via les paramètres utilisateur
```

### Problème : Bulk activation échoue partiellement

**Diagnostic :**
```
L'outil affiche : "Total processed: X, Successful: Y, Failed: Z"
```

**Solution :**
```
1. Les échecs concernent généralement des comptes bannis/non confirmés
2. Consulter le détail de chaque échec dans la console
3. Traiter manuellement les cas problématiques
```

### Problème : Statistiques ne se mettent pas à jour

**Diagnostic :**
```
Rafraîchissement en cache
```

**Solution :**
```
Cliquer sur le bouton "Refresh" en haut à droite
```

---

## 📞 Support et Assistance

### Pour les Administrateurs
- **Documentation complète** : `/DOCTOR_VISIBILITY_SYSTEM_GUIDE.md`
- **Référence rapide** : `/DOCTOR_VISIBILITY_QUICK_REFERENCE.md`
- **Résumé technique** : `/DOCTOR_VISIBILITY_IMPLEMENTATION_SUMMARY.md`

### Pour les Développeurs
- **Service TypeScript** : `src/services/doctorVisibilityService.ts`
- **Composant React** : `src/components/admin/DoctorVisibilityTroubleshooter.tsx`
- **Migration SQL** : `supabase/migrations/20260215210336_*.sql`

### Contact IT
En cas de problème technique non résolu, contacter l'équipe IT avec :
- ID du médecin concerné
- Capture d'écran des détails de diagnostic
- Message d'erreur exact (si applicable)

---

## ✅ Checklist de Lancement

### Pour le Médecin Directeur

- [ ] **Formation effectuée** : J'ai lu ce guide complet
- [ ] **Accès vérifié** : Je peux accéder à l'outil via le menu
- [ ] **Premier diagnostic** : J'ai lancé une première analyse complète
- [ ] **Actions correctives** : J'ai testé l'activation individuelle et en masse
- [ ] **Workflow établi** : J'ai programmé des vérifications hebdomadaires
- [ ] **Équipe informée** : Les médecins savent qui contacter en cas de problème
- [ ] **KPI définis** : J'ai établi mes objectifs de visibilité

---

## 📅 Calendrier de Maintenance

### Hebdomadaire (Lundi 8h00)
- Vérifier les médecins invisibles
- Activer les médecins éligibles
- Noter les problèmes récurrents

### Mensuel (1er du mois)
- Générer le rapport de visibilité
- Analyser les tendances
- Ajuster les processus si nécessaire

### Trimestriel
- Révision complète du système
- Formation de rappel pour l'équipe
- Optimisation des workflows

---

## 🎓 Formation de l'Équipe

### Session Recommandée : 30 minutes

#### Partie 1 : Présentation (10 min)
- Importance de la visibilité en ligne
- Impact sur l'acquisition de patients
- Rôle de chaque médecin

#### Partie 2 : Démonstration (15 min)
- Visite guidée de l'outil
- Démonstration d'activation
- Cas d'usage réels

#### Partie 3 : Q&A (5 min)
- Réponses aux questions
- Clarification des processus
- Distribution des guides

---

## 📖 Glossaire

| Terme | Définition |
|-------|------------|
| **Visibilité** | État d'un médecin affiché sur le site public pour prise de rendez-vous |
| **Activation** | Processus automatique de correction de configuration |
| **Priorité** | Niveau d'urgence d'un problème de visibilité (0-6) |
| **Département public** | Service médical accessible aux patients externes |
| **Horaires disponibles** | Créneaux configurés pour les consultations |

---

## 🎯 Conclusion

Ce système vous permet, en tant que **Médecin Directeur**, de :

✅ **Garantir** que tous les médecins actifs sont visibles
✅ **Automatiser** la correction des problèmes de configuration
✅ **Superviser** efficacement la présence en ligne de l'équipe
✅ **Optimiser** l'accessibilité des services médicaux
✅ **Améliorer** l'expérience patient dès la prise de rendez-vous

**Le système est maintenant opérationnel et prêt à l'emploi.**

---

*Document créé le 21 février 2026*
*Version 1.0 - Production Ready*
*Système OKAPIA Medical ERP*
