# Guide Visuel - Système d'Analyse de Facturation

## 🎨 Aperçu de l'Interface

### Page Principale - Vue d'Ensemble
```
┌─────────────────────────────────────────────────────────────┐
│  📊 Analyse de Facturation                    [🔄][💾][⚙️] │
├─────────────────────────────────────────────────────────────┤
│  Dernière mise à jour: 23/11/2025 22:30                     │
├─────────────────────────────────────────────────────────────┤
│  [Aujourd'hui] [7 Derniers Jours] [30 Derniers Jours] [...] │
├─────────────────────────────────────────────────────────────┤
│  [Vue d'ensemble] [Prévisions] [Alertes (2)]               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│  │💰 Total   │ │💳 Collecté│ │⚠️  Impayé │ │📊 Taux    │  │
│  │ Facturé   │ │           │ │           │ │ Recouv.   │  │
│  │ 45,230 $  │ │ 38,500 $  │ │ 7,332 $   │ │   85%     │  │
│  │ +12% ↗️   │ │ +8% ↗️    │ │ -5% ↘️    │ │ +3% ↗️    │  │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘  │
│                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│  │💵 Moyenne │ │⏱️  Délai  │ │🚨 Retards │ │❌ Annulées│  │
│  │ Facture   │ │ Paiement  │ │           │ │           │  │
│  │  312 $    │ │  12 jours │ │ 2,100 $   │ │  450 $    │  │
│  │ +5% ↗️    │ │           │ │           │ │           │  │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘  │
│                                                              │
│  ┌───────────────────────────────┬──────────────────────┐  │
│  │ 📈 Flux de Trésorerie         │  🎯 Taux Recouvrement│  │
│  │                               │                       │  │
│  │      ╱╲                       │         ╱────╲       │  │
│  │     ╱  ╲      ╱╲              │       ╱        ╲     │  │
│  │    ╱    ╲    ╱  ╲             │     ╱    85%    ╲   │  │
│  │   ╱      ╲  ╱    ╲            │   ╱                ╲ │  │
│  │  ────────────────────         │  │      ✓ Bon       ││  │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─          │  │   Seuil: 75%     ││  │
│  │  Collecté    En attente       │  └──────────────────┘│  │
│  └───────────────────────────────┴──────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────┬───────────────────────┐  │
│  │ 📊 Méthodes de Paiement      │ 📋 Factures par Statut│  │
│  │                              │                        │  │
│  │  ▇▇▇▇▇▇▇▇ Espèces    45%    │ ✅ Payé:     14  (58%)│  │
│  │  ▇▇▇▇▇▇   Carte      30%    │ ⏳ En attente: 8  (33%)│  │
│  │  ▇▇▇▇     Mobile M.  20%    │ ⚠️  Partiel:   2   (8%)│  │
│  │  ▇        Assurance   5%    │ ❌ Annulé:     0   (0%)│  │
│  └──────────────────────────────┴───────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┤
│  │ 👑 Top Patients                [Par Montant][Par Freq.]│  │
│  ├─────────────────────────────────────────────────────────┤
│  │  🥇                  🥈                   🥉            │  │
│  │  Jean Dupont        Marie Koffi         Paul Mbala     │  │
│  │  PAT-601234         PAT-601567          PAT-602341     │  │
│  │  5,420 USD          3,850 USD           2,900 USD      │  │
│  │  12 paiements       9 paiements         11 paiements   │  │
│  │  Moyenne: 452 $     Moyenne: 428 $      Moyenne: 264 $ │  │
│  │  ● Actif            ● Actif             ● Actif        │  │
│  ├─────────────────────────────────────────────────────────┤
│  │  4. Sophie Lukeni      2,340 USD    8 paiements    →  │  │
│  │  5. André Kabila       1,980 USD    6 paiements    →  │  │
│  │  6. Claire Tshisekedi  1,750 USD    5 paiements    →  │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Onglet Prévisions
```
┌─────────────────────────────────────────────────────────────┐
│  [Vue d'ensemble] [📈 Prévisions] [Alertes]                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔮 Prévisions de Trésorerie - 14 jours                     │
│  Analyse prédictive basée sur l'historique des 45 derniers  │
│  jours                                                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              │                                        │  │
│  │              │    ┌────────────────────────────┐     │  │
│  │ Montant      │    │  Zone de confiance         │     │  │
│  │   $          │    │  (Optimiste-Pessimiste)    │     │  │
│  │ 5000─ ───────╲───┼─ ─ ─ ─ ─ ─ ─ ─ ─            │     │  │
│  │              ╲   │                              │     │  │
│  │ 4000─         ╲  │                              │     │  │
│  │                ╲─┼─ ─ ─ ─ ─ ─ ─ ─              │     │  │
│  │ 3000─           ╲│                              │     │  │
│  │                  ╲── ─ ─ ─ ─ ─                 │     │  │
│  │ 2000─             │                             │     │  │
│  │                   │                             │     │  │
│  │    Historique  │  Prévisions                   │     │  │
│  │  ────────────  │  ─ ─ ─ ─ ─ ─                  │     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────┬─────────────┬──────────────┐             │
│  │ 📈 Tendance │ 🎯 Précision│ 🔄 Pattern    │             │
│  │             │             │  Saisonnier   │             │
│  │ Croissante  │    78%      │ ✓ Identifié  │             │
│  └─────────────┴─────────────┴──────────────┘             │
│                                                              │
│  💡 Recommandations:                                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ ℹ️  Pattern saisonnier détecté                       │  │
│  │    Planifiez la trésorerie en tenant compte des     │  │
│  │    variations                                         │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ ✓  Optimisez les relances                           │  │
│  │    Délai moyen de paiement: 12 jours                │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Onglet Alertes
```
┌─────────────────────────────────────────────────────────────┐
│  [Vue d'ensemble] [Prévisions] [🚨 Alertes (2)]             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Alertes Actives (2)                                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔴 Factures en retard importantes           [✓][✕]  │  │
│  │                                                       │  │
│  │ 8 factures en retard depuis plus de 30 jours, pour  │  │
│  │ un montant total de 12,450.00 USD                    │  │
│  │                                                       │  │
│  │ ▼ Détails                                            │  │
│  │   Valeur actuelle: 12,450.00 USD                     │  │
│  │   Seuil: 10,000.00 USD                               │  │
│  │   Détectée le 23 novembre 2025 à 14:30              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🟠 Taux de recouvrement faible             [✓][✕]   │  │
│  │                                                       │  │
│  │ Le taux de recouvrement actuel (72.5%) est          │  │
│  │ inférieur au seuil minimum de 75%                   │  │
│  │                                                       │  │
│  │ Valeur actuelle: 72.5%                               │  │
│  │ Seuil: 75%                                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Soldes Impayés - Action Requise                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Grace Kabongo                        2,340.00 USD    │  │
│  │ PAT-6041002 • 3 facture(s) • 45 jours de retard     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Samuel Tshisekedi                    1,980.00 USD    │  │
│  │ PAT-6041003 • 2 facture(s) • 38 jours de retard     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Albertine Kisangani                  1,750.00 USD    │  │
│  │ PAT-6041008 • 2 facture(s) • 32 jours de retard     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Palette de Couleurs

### Couleurs Principales
```
┌─────────┬─────────────┬──────────────┐
│ Type    │ Couleur     │ Utilisation  │
├─────────┼─────────────┼──────────────┤
│ Succès  │ 🟢 #10B981  │ Collecté     │
│ Avert.  │ 🟠 #F59E0B  │ En attente   │
│ Danger  │ 🔴 #EF4444  │ Retards      │
│ Info    │ 🔵 #3B82F6  │ Prévisions   │
│ Primaire│ 🔷 #2563EB  │ Historique   │
└─────────┴─────────────┴──────────────┘
```

### Codes Couleur des Alertes
```
┌─────────┬─────────────┬──────────────────┐
│ Niveau  │ Badge       │ Bordure          │
├─────────┼─────────────┼──────────────────┤
│ Critique│ 🔴 Rouge    │ border-red-300   │
│ Élevé   │ 🟠 Orange   │ border-orange-300│
│ Moyen   │ 🟡 Jaune    │ border-yellow-300│
│ Faible  │ 🔵 Bleu     │ border-blue-300  │
└─────────┴─────────────┴──────────────────┘
```

## 📊 Icônes et Symboles

### KPI Cards
```
💰 Total Facturé         💳 Montant Collecté
⚠️  Solde Impayé         📊 Taux Recouvrement
💵 Moyenne Facture       ⏱️  Délai Paiement
🚨 Factures en Retard    ❌ Factures Annulées
```

### Statuts
```
✅ Payé          Vert   - Facture complètement réglée
⏳ En attente    Jaune  - Paiement non encore reçu
⚠️  Partiel      Orange - Paiement partiel effectué
❌ Annulé        Gris   - Facture annulée
```

### Tendances
```
↗️ +12%   Croissance positive (Vert)
↘️ -5%    Décroissance (Rouge)
→  0%    Stable (Gris)
```

### Top Patients
```
🥇 1ère Place    Or
🥈 2ème Place    Argent
🥉 3ème Place    Bronze
●  Actif         Badge vert
○  Inactif       Badge gris
```

## 🎬 Animations

### Entrées des Éléments
```
Cartes KPI      : Fade in + Scale (300ms)
Graphiques      : Draw animation (1500ms)
Barres          : Height grow (1000ms)
Jauge           : Rotation elastic (1500ms)
Tooltips        : Fade in (150ms)
```

### Transitions
```
Hover Card      : Scale 1.02 + Shadow (200ms)
Hover Barre     : Opacity 0.8 (200ms)
Hover Dot       : Radius +2px (200ms)
Tab Switch      : Slide transition (300ms)
```

## 📱 Responsive Breakpoints

### Mobile (320px - 767px)
```
┌──────────┐
│  Card 1  │
├──────────┤
│  Card 2  │
├──────────┤
│  Card 3  │
└──────────┘
Tout empilé verticalement
Graphiques adaptés à largeur 100%
```

### Tablette (768px - 1023px)
```
┌──────────┬──────────┐
│  Card 1  │  Card 2  │
├──────────┼──────────┤
│  Card 3  │  Card 4  │
└──────────┴──────────┘
Grille 2 colonnes
Graphiques côte à côte
```

### Desktop (1024px+)
```
┌────┬────┬────┬────┐
│ C1 │ C2 │ C3 │ C4 │
├────┴────┼────┴────┤
│ Graph 1 │ Gauge  │
├─────────┴─────────┤
│  Top Patients     │
└───────────────────┘
Grille 4 colonnes optimale
```

## 🎯 Points d'Interaction

### Éléments Cliquables
```
🖱️  Cartes KPI          → Détails expandables (futur)
🖱️  Barres graphique    → Highlight + Tooltip
🖱️  Points ligne        → Tooltip avec valeurs
🖱️  Patient Top 3       → Profil patient
🖱️  Badge alerte        → Expand détails
🖱️  Bouton période      → Change période
```

### Boutons d'Action
```
[🔄 Actualiser]   Recharge données
[💾 Exporter]     Génère rapport PDF/Excel
[⚙️  Paramètres]  Config seuils alertes
[✓ Accuser]       Marque alerte comme vue
[✕ Ignorer]       Dismiss alerte
```

## 📐 Proportions et Espacements

### Grille
```
Gap entre cards:    24px (gap-6)
Padding intérieur:  24px (p-6)
Border radius:      12px (rounded-xl)
Shadow cards:       sm → md au hover
```

### Typographie
```
Titre principal:    30px (text-3xl) Bold
Sous-titre:         16px (text-base) Regular
KPI valeur:         24px (text-2xl) Bold
KPI label:          14px (text-sm) Medium
Tooltip:            12px (text-xs) Regular
```

## 🎨 États Visuels

### Normal
```
Card:    bg-white shadow-sm
Button:  bg-blue-600 text-white
Badge:   Colored based on status
```

### Hover
```
Card:    shadow-md transform scale-1.02
Button:  bg-blue-700
Badge:   Slightly darker
```

### Active/Selected
```
Tab:     border-b-2 border-blue-600
Period:  bg-blue-600 text-white shadow-md
```

### Loading
```
Spinner: Rotating circle animation
Skeleton: Pulsing gray placeholder
```

### Empty State
```
Icon:    Large centered icon (opacity 50%)
Text:    Gray centered message
Action:  Optional CTA button
```

---

**Ce guide visuel aide à comprendre l'interface avant même de l'utiliser!**
**Utilisez-le pour former les utilisateurs et communiquer le design.**
