# 🎨 Guide Visuel - Système de Visibilité des Médecins

**Version :** 1.0 Production
**Date :** 21 février 2026
**Format :** Guide visuel pas-à-pas

---

## 🚀 DÉMARRAGE RAPIDE (3 minutes)

### Étape 1 : Connexion et Navigation

```
┌─────────────────────────────────────────────────────────────┐
│  OKAPIA Medical - Interface Administrateur                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ╔═══════════════════════╗                                  │
│  ║  MENU LATÉRAL        ║                                  │
│  ╠═══════════════════════╣                                  │
│  ║  📊 Tableau de Bord  ║                                  │
│  ║  🏥 Pôle Médical     ║                                  │
│  ║  🏢 Pôle Admin       ║                                  │
│  ║  📦 Pôle Logistique  ║                                  │
│  ║  💰 Pôle Finance     ║                                  │
│  ║                       ║                                  │
│  ║  ⚙️  SYSTÈME          ║  ◄──────── CLIQUEZ ICI         │
│  ║    ├─ Paramètres     ║                                  │
│  ║    ├─ 👁️ Visibilité   ║  ◄──────── PUIS ICI            │
│  ║    │     Médecins     ║                                  │
│  ║    ├─ Dashboard RDC  ║                                  │
│  ║    └─ Actualités     ║                                  │
│  ╚═══════════════════════╝                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Action :** Cliquez sur "Système" → "Visibilité Médecins"

---

### Étape 2 : Vue d'Ensemble du Dashboard

```
┌────────────────────────────────────────────────────────────────────────┐
│  👁️ Doctor Visibility Troubleshooter                   [🔄 Refresh]   │
├────────────────────────────────────────────────────────────────────────┤
│  Diagnose and fix visibility issues for medical staff                  │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│  │  👥 Total       │  │  ✅ Visible     │  │  👁️ Invisible   │       │
│  │     45          │  │     42          │  │     3            │       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│                                                                         │
│  ┌─────────────────┐                                                   │
│  │  🚨 Critical    │                                                   │
│  │     1           │  ◄────── Problème urgent à résoudre             │
│  └─────────────────┘                                                   │
│                                                                         │
│  Filtres :                                                              │
│  [👁️ Invisible Only (3)]  [👥 All Doctors]                            │
│                                                     [⚡ Bulk Activate]  │
└────────────────────────────────────────────────────────────────────────┘
```

**Interprétation :**
- 📊 **Total : 45** médecins dans le système
- ✅ **Visible : 42** accessibles sur le site public
- 👁️ **Invisible : 3** nécessitent attention
- 🚨 **Critical : 1** problème urgent

---

### Étape 3 : Liste des Médecins Invisibles

```
┌────────────────────────────────────────────────────────────────────────┐
│  Invisible Doctors (3)                                                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  ❌ Dr. Marie Dubois                               🔴 Critical   │ │
│  │     marie.dubois@hospital.com                                     │ │
│  │     Cardiologie | Médecin                                        │ │
│  │     Department: Cardiologie                                       │ │
│  │                                                                   │ │
│  │     🟠 Not accepting patients                                     │ │
│  │     📅 0 days available                                           │ │
│  │                                                                   │ │
│  │     [Show Details]  [⚡ Activate]  ◄──── Correction automatique  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  ❌ Dr. Jean Martin                                 🟠 High      │ │
│  │     jean.martin@hospital.com                                      │ │
│  │     Pédiatrie | Médecin                                          │ │
│  │     Department: Pédiatrie                                         │ │
│  │                                                                   │ │
│  │     🟠 Not accepting patients                                     │ │
│  │     📅 0 days available                                           │ │
│  │                                                                   │ │
│  │     [Show Details]  [⚡ Activate]                                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  ⚠️  Dr. Sophie Bernard                            🟡 Medium    │ │
│  │     sophie.bernard@hospital.com                                   │ │
│  │     Dermatologie | Médecin                                       │ │
│  │     Department: Dermatologie                                      │ │
│  │                                                                   │ │
│  │     🔴 Email not confirmed                                        │ │
│  │                                                                   │ │
│  │     [Show Details]  [Action Required]  ◄── Nécessite action user│ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

**Analyse visuelle :**
- 🔴 **Dr. Dubois** : Priorité CRITIQUE - Peut être corrigé automatiquement
- 🟠 **Dr. Martin** : Priorité HIGH - Peut être corrigé automatiquement
- 🟡 **Dr. Bernard** : Priorité MEDIUM - Nécessite validation email par l'utilisateur

---

### Étape 4 : Détails de Diagnostic

**Cliquez sur "Show Details" pour un médecin :**

```
┌────────────────────────────────────────────────────────────────────────┐
│  ❌ Dr. Marie Dubois                                   🔴 Critical     │
│     marie.dubois@hospital.com                                          │
│     Cardiologie | Médecin                                             │
│     Department: Cardiologie                                            │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  ℹ️  Detailed Diagnostics                                      │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │                                                                 │   │
│  │  Accepting Patients:      ❌ No     ◄── PROBLÈME 1            │   │
│  │  Current Status:          ⚠️ unavailable                        │   │
│  │  User Active:             ✅ Yes                                │   │
│  │  Department Public:       ✅ Yes                                │   │
│  │  Department Active:       ✅ Yes                                │   │
│  │  Email Confirmed:         ✅ Yes                                │   │
│  │  Role:                    doctor                                │   │
│  │  Available Days:          ❌ 0      ◄── PROBLÈME 2            │   │
│  │                                                                 │   │
│  │  ⚠️  Issues Found:                                              │   │
│  │  • Not accepting patients (can be auto-fixed)                  │   │
│  │  • No availability schedule configured (can be auto-fixed)     │   │
│  │                                                                 │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Hide Details]  [⚡ Activate]  ◄── Cliquez pour corriger             │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

**Diagnostic :**
✅ **Compte actif** et email confirmé
✅ **Département public** et actif
❌ **N'accepte pas de patients** (problème 1)
❌ **Aucun horaire configuré** (problème 2)

**Solution :** Cliquez sur "Activate" pour correction automatique

---

### Étape 5 : Processus d'Activation

**Lorsque vous cliquez sur "Activate" :**

```
┌────────────────────────────────────────────────────────────┐
│  🔄 Activating doctor...                                   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ⏳ Please wait while we configure the doctor profile...   │
│                                                             │
│  ✅ Step 1/3: Enabling patient acceptance                  │
│  ✅ Step 2/3: Creating default availability schedule       │
│  ✅ Step 3/3: Updating status to 'available'               │
│                                                             │
│  ✅ Doctor activated successfully!                         │
│                                                             │
│  Steps completed: 3                                        │
│  ✓ Enabled patient acceptance                             │
│  ✓ Created 5 days of availability (Mon-Fri, 8h-17h)       │
│  ✓ Updated status to available                            │
│                                                             │
│  [OK]                                                       │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Résultat :** Le médecin est maintenant visible sur le site public !

---

### Étape 6 : Après Activation

```
┌────────────────────────────────────────────────────────────────────────┐
│  Invisible Doctors (2)                         ◄── Passé de 3 à 2     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ✅ Dr. Marie Dubois - NOW VISIBLE!            ◄── SUCCÈS             │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  ❌ Dr. Jean Martin                                 🟠 High      │ │
│  │     jean.martin@hospital.com                                      │ │
│  │     Pédiatrie | Médecin                                          │ │
│  │     [Show Details]  [⚡ Activate]                                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  ⚠️  Dr. Sophie Bernard                            🟡 Medium    │ │
│  │     sophie.bernard@hospital.com                                   │ │
│  │     Dermatologie | Médecin                                       │ │
│  │     [Show Details]  [Action Required]                            │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

**Statistiques mises à jour :**
- ✅ Visible : 42 → 43
- 👁️ Invisible : 3 → 2
- 🚨 Critical : 1 → 0

---

## ⚡ ACTIVATION EN MASSE

### Quand l'Utiliser ?

Utilisez "Bulk Activate All" lorsque vous avez **plusieurs médecins invisibles** qui peuvent tous être corrigés automatiquement.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Invisible Doctors (5)                                                  │
│                                                     [⚡ Bulk Activate]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ❌ Dr. Marie Dubois         🔴 Critical    [⚡ Activate]              │
│  ❌ Dr. Jean Martin          🟠 High        [⚡ Activate]              │
│  ❌ Dr. Paul Durand          🟠 High        [⚡ Activate]              │
│  ❌ Dr. Claire Petit         🟡 Medium      [⚡ Activate]              │
│  ⚠️  Dr. Sophie Bernard      🟡 Medium      [Action Required]          │
│                                                                         │
│  Note: Dr. Bernard has email not confirmed - will be skipped           │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

**Cliquez sur "Bulk Activate All" :**

```
┌────────────────────────────────────────────────────────────┐
│  ⚠️  Confirmation Required                                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  This will activate all invisible doctors                  │
│  (except banned/unconfirmed).                              │
│                                                             │
│  Doctors to be activated: 4                                │
│  Doctors to be skipped: 1 (email not confirmed)            │
│                                                             │
│  Continue?                                                  │
│                                                             │
│  [Cancel]  [Confirm]  ◄── Cliquez pour confirmer           │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Résultat de l'activation en masse :**

```
┌────────────────────────────────────────────────────────────┐
│  ✅ Bulk Activation Complete!                              │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Total processed: 4                                        │
│  Successful: 4                                             │
│  Failed: 0                                                  │
│                                                             │
│  Activated doctors:                                        │
│  ✓ Dr. Marie Dubois                                        │
│  ✓ Dr. Jean Martin                                         │
│  ✓ Dr. Paul Durand                                         │
│  ✓ Dr. Claire Petit                                        │
│                                                             │
│  Skipped (requires manual action):                         │
│  • Dr. Sophie Bernard (email not confirmed)                │
│                                                             │
│  [OK]                                                       │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🎨 CODES COULEURS ET BADGES

### Badges de Statut

```
┌─────────────────────────────────────────────────────────────┐
│  Statut de Visibilité                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🟢 [  Visible  ]                                           │
│     → Tout fonctionne, médecin accessible sur site public   │
│                                                              │
│  🟠 [  Not accepting patients  ]                            │
│     → Peut être corrigé automatiquement                     │
│                                                              │
│  🟠 [  No availability schedule  ]                          │
│     → Peut être corrigé automatiquement                     │
│                                                              │
│  🔴 [  Department not public  ]                             │
│     → Nécessite intervention admin système                  │
│                                                              │
│  🔴 [  Department not active  ]                             │
│     → Nécessite intervention admin système                  │
│                                                              │
│  🟡 [  Email not confirmed  ]                               │
│     → Nécessite action du médecin (valider email)          │
│                                                              │
│  🔴 [  Banned until [date]  ]                               │
│     → Nécessite déblocage administratif                     │
│                                                              │
│  🔴 [  User not active  ]                                   │
│     → Nécessite réactivation compte                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Badges de Priorité

```
┌─────────────────────────────────────────────────────────────┐
│  Niveau de Priorité                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🟢 Normal (0)                                               │
│     → Médecin visible, tout fonctionne                      │
│                                                              │
│  🟡 Medium (5-6)                                             │
│     → Problème mineur, attention recommandée                │
│                                                              │
│  🟠 High (3-4)                                               │
│     → Problème important, action recommandée rapidement     │
│                                                              │
│  🔴 Critical (1-2)                                           │
│     → Problème urgent, nécessite action immédiate           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 EXEMPLES DE CAS D'USAGE

### Cas 1 : Nouveau Médecin Invisible

**Situation :**
Un nouveau médecin vient d'être créé mais n'apparaît pas sur le site.

**Solution :**
```
1. Accéder à "Visibilité Médecins"
2. Cliquer sur "Invisible Only"
3. Localiser le nouveau médecin
4. Cliquer sur "Show Details" pour diagnostic
5. Si corrections automatiques possibles : Cliquer "Activate"
6. Vérifier que le statut passe à "Visible"
7. Informer le médecin que son profil est en ligne
```

**Temps estimé :** 2 minutes

---

### Cas 2 : Médecin Se Plaint d'Être Invisible

**Situation :**
Un médecin vous contacte car les patients ne peuvent pas prendre RDV avec lui.

**Solution :**
```
1. Accéder immédiatement à l'outil
2. Utiliser filtre "All Doctors"
3. Rechercher le médecin par nom (Ctrl+F dans navigateur)
4. Cliquer "Show Details" pour diagnostic précis
5. Si badge 🟢 "Visible" : Problème ailleurs (vérifier département, etc.)
6. Si badge 🟠/🔴 : Cliquer "Activate"
7. Confirmer au médecin que son profil est maintenant visible
8. Lui demander de tester la prise de RDV sur le site
```

**Temps estimé :** 3 minutes
**SLA Recommandé :** Réponse dans les 30 minutes

---

### Cas 3 : Vérification Hebdomadaire de Routine

**Situation :**
Lundi matin, vérification de routine de la visibilité.

**Solution :**
```
1. Accéder à "Visibilité Médecins"
2. Observer les statistiques du dashboard
3. Si "Invisible" = 0 : ✅ Rien à faire, tout va bien
4. Si "Invisible" > 0 :
   a. Cliquer sur "Invisible Only"
   b. Examiner les cas
   c. Si plusieurs cas auto-corrigeables : "Bulk Activate All"
   d. Si cas nécessitant intervention manuelle : Noter et traiter
5. Documenter dans rapport hebdomadaire
6. Si problèmes récurrents : Investiguer cause racine
```

**Temps estimé :** 5-10 minutes
**Fréquence :** Hebdomadaire (Lundi 8h00)

---

## 📱 RACCOURCIS CLAVIER

```
┌─────────────────────────────────────────────────────────────┐
│  Raccourcis Utiles                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  F5 ou Ctrl+R     → Actualiser la page                      │
│  Ctrl+F           → Rechercher un médecin par nom           │
│  Tab              → Naviguer entre les boutons              │
│  Enter            → Confirmer l'action en cours             │
│  Esc              → Fermer la modale/annuler                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 CHECKLIST RAPIDE

### Avant de Quitter l'Outil

```
☑️  J'ai vérifié les statistiques globales
☑️  J'ai traité tous les cas "Critical"
☑️  J'ai documenté les cas nécessitant intervention manuelle
☑️  J'ai confirmé que le taux de visibilité est > 95%
☑️  J'ai noté toute tendance inhabituelle
☑️  J'ai rafraîchi les données pour avoir l'état le plus récent
```

---

## 💡 CONSEILS PRATIQUES

### Pour Gagner du Temps

✅ **Utilisez "Bulk Activate"** pour traiter plusieurs cas d'un coup
✅ **Filtrez "Invisible Only"** pour voir uniquement les problèmes
✅ **Vérifiez régulièrement** (hebdomadaire) plutôt que d'accumuler
✅ **Documentez les patterns** pour identifier problèmes systémiques

### Pour Éviter les Erreurs

⚠️ **Ne pas activer** des comptes bannis sans déblocage formel
⚠️ **Vérifier les détails** avant activation en masse
⚠️ **Communiquer** avec les médecins concernés
⚠️ **Documenter** toute action inhabituelle

---

## 📞 AIDE RAPIDE

### Problème : L'outil ne charge pas

**Solution :**
1. Vérifier la connexion internet
2. Rafraîchir la page (F5)
3. Vider le cache navigateur
4. Contacter IT si problème persiste

### Problème : Activation échoue

**Solution :**
1. Cliquer "Show Details" pour diagnostic
2. Vérifier si problème nécessite intervention manuelle
3. Consulter message d'erreur exact
4. Contacter IT avec capture d'écran si nécessaire

### Problème : Médecin toujours invisible après activation

**Solution :**
1. Attendre 2 minutes (rafraîchissement cache)
2. Cliquer "Refresh" dans l'outil
3. Vérifier critères un par un via "Show Details"
4. Si département non public : Contacter admin système

---

**Fin du Guide Visuel**

*Temps total de lecture : 15 minutes*
*Temps de maîtrise complète : 1 heure de pratique*

**Vous êtes maintenant prêt à utiliser efficacement le système de visibilité des médecins !**

---

*Guide créé le 21 février 2026*
*OKAPIA Medical ERP v2.0*
*Pour support : Consulter DOCTOR_VISIBILITY_ACTIVATION_GUIDE.md*
