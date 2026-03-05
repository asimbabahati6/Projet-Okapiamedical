# Guide des Actions Rapides - Laboratoire & Radiologie

## Vue d'Ensemble

Les boutons "Actions Rapides" ont été entièrement implémentés avec une logique de filtrage dynamique, un système de saisie de résultats et des notifications automatiques.

---

## 🎯 Fonctionnalités Implémentées

### 1. Voir File d'Attente

#### Comportement
- **Action:** Filtre automatiquement les analyses avec statut "En Attente" ou "En Cours"
- **Feedback visuel:**
  - Surbrillance des compteurs "Analyses en Attente" et "En Cours d'Analyse"
  - Ring vert animé autour des cartes statistiques
  - Icône de filtre avec animation pulse
  - Bouton "Effacer filtre" pour réinitialiser

#### Utilisation
```typescript
// Cliquer sur le bouton "Voir File d'Attente"
// → Le tableau se filtre automatiquement
// → Les compteurs pertinents s'illuminent
// → Un badge "(File d'attente active)" apparaît
```

#### Navigation
- Sur le dashboard principal: Filtre en place
- Le bouton conserve un état visuel actif (vert foncé avec ring)

---

### 2. Saisir Résultats

#### Comportement
- **Action:** Ouvre un modal de saisie pour la première analyse en attente
- **Priorité:** Les analyses urgentes sont traitées en premier
- **Interface:** Modal complet avec tous les champs de saisie

#### Permissions RBAC
```typescript
Visibilité du bouton:
✅ lab_supervisor
✅ lab_technician
✅ super_admin
❌ doctor (masqué)
❌ other roles (masqué)
```

#### Workflow de Saisie

**Étape 1: Sélection automatique**
```sql
SELECT * FROM lab_orders
WHERE status IN ('pending', 'in_progress')
ORDER BY
  priority DESC,    -- Urgents en premier
  created_at ASC    -- Plus anciens en premier
LIMIT 1
```

**Étape 2: Interface de saisie**

Le modal affiche:
- Informations de l'analyse (Numéro, Type, Échantillon, Priorité)
- Notes du prescripteur
- Tableau des paramètres éditable
  - Nom du paramètre
  - Valeur trouvée
  - Unité
  - Valeur de référence
- Zone d'interprétation (textarea)
- Sélecteur de statut (En cours / Terminé)

**Étape 3: Enregistrement**
```typescript
Données sauvegardées:
{
  results: {
    parameters: [...],
    interpretation: string,
    enteredBy: userId,
    enteredAt: timestamp
  },
  status: 'in_progress' | 'completed',
  completed_at: timestamp (si terminé),
  completed_by: userId (si terminé)
}
```

---

### 3. Gérer Équipements

#### Comportement
- **Action:** Navigation vers `/laboratory/equipment`
- **Page:** Interface de gestion des équipements de laboratoire

---

## 📊 Feedback Visuel

### Compteurs en Surbrillance

Quand le filtre "File d'Attente" est actif:

```css
Effet appliqué:
- ring-4 ring-green-300
- shadow-2xl
- scale-105
- Icône Filter avec animation pulse
```

**Avant:**
```
┌─────────────────────┐
│ 🕐 Analyses         │
│    en Attente       │
│         8           │
└─────────────────────┘
```

**Après (Filtre actif):**
```
┌═════════════════════┐ ← Ring vert
║ 🕐 Analyses    🔍   ║ ← Icône filtre
║    en Attente       ║
║         8           ║ ← Agrandi (scale-105)
└═════════════════════┘
```

---

## 🔐 Restrictions RBAC

### Tableau des Permissions

| Action | doctor | lab_tech | lab_supervisor | super_admin |
|--------|--------|----------|----------------|-------------|
| Voir File | ✅ | ✅ | ✅ | ✅ |
| Saisir Résultats | ❌ | ✅ | ✅ | ✅ |
| Gérer Équipements | ❌ | ✅ | ✅ | ✅ |
| Créer Demande | ✅ | ❌ | ✅ | ✅ |

---

## 🔔 Système de Notifications

### Notification Automatique

Quand un résultat est marqué comme "Terminé":

```typescript
await supabase.from('notifications').insert({
  user_id: prescribing_doctor_id,
  type: 'lab_results_ready',
  title: 'Résultats d\'analyse disponibles',
  message: `Les résultats pour ${test_type} sont disponibles`,
  link: `/laboratory/results/${order_id}`,
  created_at: new Date().toISOString()
});
```

Le médecin prescripteur reçoit une notification en temps réel.

---

## ⚡ Actualisation en Temps Réel

### Sans Rechargement de Page

Après chaque action:
```typescript
// Après sauvegarde des résultats
onSave={() => {
  loadDashboardData(); // Recharge les stats
}}

// Les compteurs se mettent à jour:
- Analyses en Attente: -1
- Terminées Aujourd'hui: +1
```

---

## 🎨 États Visuels du Bouton

### Bouton "Voir File d'Attente"

**État Normal:**
```css
bg-green-600 text-white
hover:bg-green-700
```

**État Actif (Filtre appliqué):**
```css
bg-green-700 text-white
ring-2 ring-green-300
shadow-lg
+ Icône Filter
```

### Bouton "Saisir Résultats"

**Visible (Permissions OK):**
```css
border-2 border-green-600 text-green-600
hover:bg-green-50
```

**Masqué (Pas de permissions):**
```
Le bouton n'apparaît pas du tout
```

---

## 📱 Responsive Design

### Desktop
```
┌─────────────────────────────────┐
│ Actions Rapides                 │
├─────────────────────────────────┤
│ [🧪 Voir File d'Attente      ] │
│ [📄 Saisir Résultats         ] │
│ [📊 Gérer Équipements        ] │
└─────────────────────────────────┘
```

### Mobile
Même disposition en colonne, largeur 100%

---

## 🔧 Architecture Technique

### Composants Créés

1. **`useLabOrderFilters` Hook**
   - Gestion de l'état des filtres
   - Fonctions showQueue(), clearFilters()
   - États isQueueFilterActive, isUrgentFilterActive

2. **`LabResultsEntryModal` Component**
   - Interface complète de saisie
   - Tableau dynamique de paramètres
   - Zone d'interprétation
   - Sélecteur de statut
   - Sauvegarde avec notifications

3. **Modifications `LaboratoryPage`**
   - Intégration du hook de filtrage
   - Gestion des états filteredOrders
   - Fonction handleViewQueue()
   - Fonction handleEnterResults()
   - Fonction canEnterResults() pour RBAC
   - Feedback visuel sur compteurs

---

## 🚀 Workflow Complet

### Scénario: Traiter une Analyse Urgente

**Étape 1:** Technicien arrive sur dashboard
```
Statut:
- Analyses en Attente: 8
- Cas Urgents: 2
```

**Étape 2:** Clic sur "Voir File d'Attente"
```
Action:
- Filtre appliqué
- Tableau affiche seulement 8 analyses (pending + in_progress)
- Compteurs illuminés avec ring vert
- Analyses urgentes en haut de liste
```

**Étape 3:** Clic sur "Saisir Résultats"
```
Action:
- Modal s'ouvre
- Première analyse urgente sélectionnée automatiquement
- Ordre LAB-2026-01001 (URGENT)
- Test: NFS Complète
```

**Étape 4:** Saisie des résultats
```
Paramètres entrés:
- Hémoglobine: 13.5 g/dL (Normal: 13-17)
- Leucocytes: 7200/mm³ (Normal: 4000-10000)
- Plaquettes: 245000/mm³ (Normal: 150000-400000)

Interprétation:
"Toutes les valeurs sont dans les normes. Pas d'anémie."

Statut sélectionné: Terminé
```

**Étape 5:** Sauvegarde
```
Actions automatiques:
1. Résultats enregistrés dans lab_orders
2. completed_at = NOW()
3. completed_by = technicien_id
4. status = 'completed'
5. Notification envoyée au médecin
6. Dashboard rechargé
```

**Étape 6:** Mise à jour automatique
```
Nouveau statut:
- Analyses en Attente: 7 (-1)
- Cas Urgents: 1 (-1)
- Terminées Aujourd'hui: 1 (+1)

Filtre toujours actif:
- Tableau affiche maintenant 7 analyses
```

**Étape 7:** Médecin reçoit notification
```
🔔 Notification
Titre: Résultats d'analyse disponibles
Message: Les résultats pour NFS Complète sont disponibles
Lien: /laboratory/results/xxx-xxx-xxx
```

---

## 📋 Champs de Saisie Détaillés

### Laboratoire

**Tableau des Paramètres:**
| Champ | Type | Requis | Exemple |
|-------|------|--------|---------|
| Paramètre | text | ✅ | Hémoglobine |
| Valeur trouvée | text | ✅ | 13.5 |
| Unité | text | ✅ | g/dL |
| Valeur de référence | text | ✅ | 13-17 |

**Interprétation:**
- Type: textarea
- Lignes: 4
- Placeholder: "Entrez votre interprétation..."

**Statut:**
- Radio buttons: En cours | Terminé
- Default: En cours

---

## 🎯 Points Clés

### ✅ Fonctionnalités Complètes

1. ✅ Filtrage dynamique avec feedback visuel
2. ✅ Surbrillance des compteurs pertinents
3. ✅ Modal de saisie complet
4. ✅ Permissions RBAC strictes
5. ✅ Notifications automatiques
6. ✅ Actualisation sans rechargement
7. ✅ Priorisation des urgences
8. ✅ Traçabilité complète

### 🔄 Actualisation Temps Réel

- Statistiques mises à jour après chaque action
- Pas de rechargement de page nécessaire
- Filtres persistent pendant la session
- Animations fluides

### 🔐 Sécurité

- Vérification RBAC côté client
- Validation des permissions en base
- RLS policies respectées
- Audit trail complet (created_by, completed_by)

---

## 📊 Exemple de Données

### Résultats Enregistrés (JSON)

```json
{
  "parameters": [
    {
      "name": "Hémoglobine",
      "value": "13.5",
      "unit": "g/dL",
      "reference": "13-17 (H) / 12-16 (F)",
      "isAbnormal": false
    },
    {
      "name": "Leucocytes",
      "value": "7200",
      "unit": "/mm³",
      "reference": "4000-10000",
      "isAbnormal": false
    },
    {
      "name": "Plaquettes",
      "value": "245000",
      "unit": "/mm³",
      "reference": "150000-400000",
      "isAbnormal": false
    }
  ],
  "interpretation": "Toutes les valeurs sont dans les normes. Pas d'anémie.",
  "enteredBy": "uuid-tech-123",
  "enteredAt": "2026-02-27T14:30:00Z"
}
```

---

## 🐛 Gestion d'Erreurs

### Cas: Aucune analyse en attente

```typescript
if (error.code === 'PGRST116') {
  // Pas de résultats trouvés
  alert('Aucune analyse en attente de résultats');
  return;
}
```

### Cas: Erreur de sauvegarde

```typescript
catch (err) {
  setError(err.message || 'Erreur lors de l\'enregistrement');
  // Message affiché dans le modal
}
```

---

## 🎓 Pour Aller Plus Loin

### Améliorations Possibles

1. **Validation des valeurs**
   - Détection automatique des valeurs anormales
   - Highlighting en rouge si hors normes

2. **Templates de résultats**
   - Pré-remplissage selon le type d'analyse
   - Bibliothèque de paramètres standard

3. **Signature électronique**
   - Validation par signature numérique
   - Conformité réglementaire

4. **Export PDF**
   - Génération automatique du rapport
   - Envoi par email au patient

---

## ✅ Checklist de Validation

- [x] Bouton "Voir File d'Attente" filtre correctement
- [x] Compteurs s'illuminent quand filtre actif
- [x] Bouton "Effacer filtre" fonctionne
- [x] Bouton "Saisir Résultats" visible selon RBAC
- [x] Modal s'ouvre avec la bonne analyse
- [x] Urgences traitées en priorité
- [x] Tableau de paramètres éditable
- [x] Ajout/suppression de lignes possible
- [x] Zone d'interprétation fonctionnelle
- [x] Sélecteur de statut opérationnel
- [x] Sauvegarde enregistre dans DB
- [x] Notification envoyée au médecin
- [x] Dashboard se met à jour automatiquement
- [x] Statistiques actualisées sans reload

---

**Version:** 1.0
**Date:** 27 février 2026
**Modules:** Laboratoire, Radiologie (template)
**Status:** ✅ Production Ready
