# Guide de Démarrage Rapide - Analyse de Facturation

## 🚀 Accès Rapide

### Pour Utilisateurs
1. Connexion avec compte **Administrateur** ou **Personnel Administratif**
2. Sidebar → **"Analyse Facturation"** (icône 📊)
3. Tableau de bord chargé automatiquement

## 📊 Vue d'Ensemble en 60 Secondes

### Onglet "Vue d'ensemble"
- **8 Cartes KPI** : Statistiques principales
- **Graphique Flux** : Courbe verte (collecté) vs orange (en attente)
- **Jauge Recouvrement** : Indicateur circulaire avec seuil à 75%
- **Histogramme Paiements** : Barres par méthode (Espèces, Carte, Mobile Money...)
- **Top 3 Patients** : Podium 🥇🥈🥉 avec montants

### Onglet "Prévisions"
- **Graphique Prévisionnel** : 14 jours à venir
- **3 Scénarios** : Optimiste, Réaliste, Pessimiste
- **Précision** : Pourcentage de fiabilité
- **Recommandations** : Actions suggérées

### Onglet "Alertes"
- **Alertes Actives** : Problèmes nécessitant attention
- **4 Niveaux** : Critique, Élevé, Moyen, Faible
- **Actions** : ✓ Accuser réception ou ✕ Ignorer
- **Soldes Impayés** : Liste des patients à relancer

## ⚡ Actions Rapides

### Filtrer Par Période
```
Aujourd'hui → Dernières 24h
7 Jours → Semaine glissante
30 Jours → Mois glissant (par défaut)
Personnalisé → Choisir dates
```

### Voir Top Patients
```
Clic "Par Montant" → Classement par USD payés
Clic "Par Fréquence" → Classement par nombre de paiements
Clic sur patient → Ouvre son profil
```

### Actualiser Données
```
Bouton "Actualiser" en haut à droite
OU
Automatique toutes les 5 minutes
```

## 📈 Comprendre les KPI

| KPI | Signification | Bon Si |
|-----|--------------|---------|
| **Total Facturé** | Somme factures émises | Tendance ↗️ |
| **Montant Collecté** | Paiements reçus | ≥ 80% du facturé |
| **Taux Recouvrement** | % payé vs facturé | ≥ 75% |
| **Délai Paiement** | Jours avant paiement | ≤ 15 jours |
| **Solde Impayé** | En attente de paiement | Le plus bas possible |

## 🔔 Types d'Alertes

| Type | Déclenchement | Action Recommandée |
|------|--------------|-------------------|
| 🔴 **Taux Faible** | < 75% | Relancer patients |
| 🟠 **Retards** | > 30 jours | Appeler patients |
| 🔴 **Flux Négatif** | Dépenses > Recettes | Ajuster stratégie |
| 🟠 **Solde Critique** | > 5000 USD impayé | Actions recouvrement |

## 🎯 Cas d'Usage Fréquents

### 1. Rapport Hebdomadaire
```
1. Sélectionner "7 Derniers Jours"
2. Noter les KPI principaux
3. Clic "Exporter" pour PDF
4. Présenter à direction
```

### 2. Identifier Patients à Relancer
```
1. Onglet "Alertes"
2. Section "Soldes Impayés"
3. Noter patients avec > 30 jours retard
4. Clic patient → Voir coordonnées
5. Appel téléphonique
```

### 3. Planification Trésorerie
```
1. Onglet "Prévisions"
2. Observer scénario "Réaliste"
3. Vérifier précision modèle (> 70% = fiable)
4. Planifier dépenses selon prévisions
```

### 4. Analyser Méthodes Paiement
```
1. Vue d'ensemble → Histogramme
2. Identifier méthode la plus utilisée
3. Optimiser selon préférences patients
4. Promouvoir méthodes moins coûteuses
```

## 💡 Conseils Pro

### Optimiser Recouvrement
- Relancer à J+7, J+15, J+30
- Proposer facilités paiement si > 1000 USD
- Privilégier patients "Top Fréquence" (fidèles)

### Utiliser Prévisions
- Scénario Pessimiste = Budget prudent
- Scénario Réaliste = Planification normale
- Scénario Optimiste = Investissements possibles

### Suivre Tendances
- Flèche ↗️ verte = Amélioration
- Flèche ↘️ rouge = Détérioration
- Comparer vs période précédente

## 🔧 Dépannage Express

### Aucune Donnée Affichée
1. Vérifier période sélectionnée
2. S'assurer factures existent dans Supabase
3. Actualiser avec bouton ⟳
4. Recharger page (F5)

### Graphiques Ne Se Chargent Pas
1. Vider cache navigateur (Ctrl+Shift+Del)
2. Vérifier connexion internet
3. Essayer autre navigateur (Chrome recommandé)

### Alertes Non Pertinentes
1. Aller Paramètres → Alertes (si disponible)
2. Ajuster seuils selon besoin
3. Sauvegarder configuration

## 📱 Accès Mobile

Le système est responsive :
- **Téléphone** : Cartes empilées, swipe entre onglets
- **Tablette** : Vue hybride optimisée
- **Desktop** : Vue complète avec tous graphiques

## ⌨️ Raccourcis Clavier (Futur)

| Raccourci | Action |
|-----------|--------|
| `Ctrl + R` | Actualiser |
| `Ctrl + E` | Exporter |
| `Ctrl + P` | Paramètres |
| `Tab` | Navigation |

## 📞 Aide

**Questions ?** Consulter `BILLING_ANALYTICS_IMPLEMENTATION.md` pour détails techniques complets.

---

**Temps de Maîtrise Estimé** : 10-15 minutes
**Utilisateurs Formés** : 2-3 personnes recommandées
**ROI Attendu** : Amélioration recouvrement +10-20%
