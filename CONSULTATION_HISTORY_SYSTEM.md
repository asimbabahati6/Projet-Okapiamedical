# Système d'Historique des Consultations - Documentation

## Vue d'ensemble

Le nouveau système d'historique des consultations transforme une section statique en une plateforme interactive et dynamique permettant l'analyse approfondie des données médicales avec visualisations D3.js personnalisées, filtrage avancé, et gestion granulaire des permissions.

## Fonctionnalités Implémentées

### 1. Architecture Base de Données et Permissions

#### Tables Créées
- **`permissions_matrix`** : Gestion granulaire des permissions par rôle et ressource
- **`consultation_shares`** : Partage temporaire de consultations entre médecins
- **`consultation_audit_logs`** : Traçabilité complète de toutes les actions

#### Permissions par Rôle
- **Médecin** :
  - Voir ses consultations + département
  - Créer et modifier ses consultations
  - Exporter et partager
- **Infirmier** :
  - Voir consultations du département (lecture seule)
- **Administrateur** :
  - Accès complet à toutes les consultations
  - Modifier, supprimer, exporter
- **Réception** :
  - Accès limité (pas d'accès aux consultations médicales)

#### Fonctions RPC Supabase
- `get_consultation_statistics()` : Statistiques agrégées avec filtres
- `log_consultation_audit()` : Enregistrement automatique des actions
- `get_consultation_timeseries()` : Données temporelles pour graphiques

### 2. Système de Filtrage Multicritères

**Composant** : `ConsultationFiltersPanel`

#### Filtres Disponibles
- **Période** :
  - Presets rapides (Aujourd'hui, 7 jours, 30 jours, ce mois, 3 mois, année)
  - Sélection personnalisée (date début/fin)
- **Médecin** : Liste déroulante avec tous les médecins actifs
- **Département** : Filtrage par département médical
- **Recherche Diagnostic** : Recherche textuelle dans les diagnostics
- **Statut de Suivi** :
  - Tous
  - Avec suivi prévu
  - Suivi en attente
  - Suivi en retard

#### Fonctionnalités
- Sauvegarde automatique des filtres actifs
- Réinitialisation rapide
- Badge indicateur de filtres actifs
- Application en temps réel

### 3. Barre de Recherche Intelligente

**Composant** : `SmartSearchBar`

#### Caractéristiques
- **Debouncing** : 300ms pour optimiser les performances
- **Recherche multi-champs** :
  - Nom du patient
  - Diagnostic
  - Plan de traitement
  - Symptômes principaux
- **Bouton de réinitialisation** rapide
- **Placeholder informatif** pour guider l'utilisateur

### 4. Visualisations D3.js Personnalisées

#### A. TimelineChart (Graphique d'Évolution)
**Fichier** : `components/consultations/charts/TimelineChart.tsx`

**Fonctionnalités** :
- Courbe lissée (curve monotone) avec gradient
- Animation d'apparition progressive (stroke-dasharray)
- Points interactifs avec tooltips détaillés
- Grille de référence en arrière-plan
- Axes formatés en français
- Zoom et hover interactions

**Données affichées** :
- Nombre de consultations par jour/semaine/mois
- Tendances temporelles visuelles

#### B. DiagnosisDistributionChart (Répartition des Diagnostics)
**Fichier** : `components/consultations/charts/DiagnosisDistributionChart.tsx`

**Fonctionnalités** :
- Graphique à barres horizontales
- Top 10 diagnostics les plus fréquents
- Couleurs graduées (interpolateBlues)
- Animation d'apparition séquentielle
- Tooltips avec pourcentages
- Wrapping intelligent du texte

**Données affichées** :
- Nombre de cas par diagnostic
- Pourcentage de répartition

#### C. HeatmapCalendar (Calendrier de Charge)
**Fichier** : `components/consultations/charts/HeatmapCalendar.tsx`

**Fonctionnalités** :
- Visualisation type "GitHub contributions"
- Cellules colorées selon intensité
- Légende avec gradient interactif
- Navigation par jours de la semaine
- Tooltips avec date et nombre

**Données affichées** :
- Charge quotidienne des consultations
- Patterns hebdomadaires et mensuels

### 5. Tableau Dynamique Interactif

**Composant** : `ConsultationTable`

#### Fonctionnalités de Tri
- **Colonnes triables** :
  - Date de consultation
  - Nom du patient
  - Nom du médecin
  - Diagnostic
  - Date de suivi
- **Indicateurs visuels** : Flèches ascendantes/descendantes
- **Tri bidirectionnel** : Asc/Desc

#### Affichage
- **Mise en forme conditionnelle** :
  - Suivis en retard (rouge)
  - Suivis à venir (normal)
- **Icônes contextuelles** : Calendar, User, Stethoscope, Clock
- **Ligne cliquable** : Navigation vers détails patient
- **État vide informatif** avec illustration

#### Colonnes
1. Date (avec heure)
2. Patient (nom + numéro)
3. Médecin (nom + spécialisation)
4. Diagnostic (avec symptôme principal)
5. Suivi (avec statut)
6. Actions (bouton détails)

### 6. Pagination Avancée

**Composant** : `Pagination`

#### Fonctionnalités
- **Navigation** : Première, Précédente, Suivante, Dernière page
- **Numérotation intelligente** avec ellipses (...)
- **Sélection taille de page** : 10, 25, 50, 100 éléments
- **Indicateur de position** : "Affichage de X à Y sur Z résultats"
- **Navigation clavier** possible
- **Boutons désactivés** aux limites

### 7. Cards Statistiques avec KPIs

**Composant** : `StatisticsCards`

#### Métriques Affichées
1. **Total Consultations**
   - Icône : FileText
   - Couleur : Bleu
   - Tendance vs période précédente

2. **Patients Uniques**
   - Icône : Users
   - Couleur : Vert
   - Tendance vs période précédente

3. **Avec Suivi**
   - Icône : UserCheck
   - Couleur : Violet
   - Pourcentage des consultations
   - Tendance vs période précédente

4. **Médecins Actifs**
   - Icône : Calendar
   - Couleur : Orange
   - Nombre de médecins ayant consulté

#### Indicateurs de Tendance
- Flèche montante/descendante (TrendingUp/TrendingDown)
- Pourcentage de variation
- Comparaison automatique avec période précédente
- Couleurs contextuelles (vert positif, rouge négatif)

### 8. Dashboard Principal

**Composant** : `ConsultationHistoryDashboard`

#### Modes de Vue
1. **Liste** : Tableau complet avec pagination
2. **Graphiques** : Visualisations D3.js multiples
3. **Calendrier** : Vue calendrier (à implémenter)

#### Barre d'Actions
- **Bouton Actualiser** : Recharge les données
- **Menu Export** (si permissions) :
  - Export CSV
  - Export Excel (prochainement)
  - Export PDF (prochainement)

#### Layout Responsive
- Header avec titre et description
- Statistiques en haut
- Barre de recherche + filtres
- Toggle de modes de vue
- Contenu principal adaptatif

### 9. Hooks Personnalisés

#### useConsultationHistory
**Fichier** : `hooks/consultation/useConsultationHistory.ts`

**Fonctionnalités** :
- Chargement paginé des consultations
- Filtrage côté serveur optimisé
- Calcul des statistiques
- Gestion du state (loading, error)
- Méthodes :
  - `updateFilters()` : Mise à jour des filtres
  - `clearFilters()` : Réinitialisation
  - `refresh()` : Rechargement manuel
  - `goToPage()` : Navigation pagination
  - `changePageSize()` : Modification taille page

#### usePermissions
**Fichier** : `hooks/consultation/usePermissions.ts`

**Fonctionnalités** :
- Chargement des permissions utilisateur
- Basé sur le rôle actif
- Permissions granulaires :
  - can_view_own, can_view_department, can_view_all
  - can_create, can_edit_own, can_edit_all
  - can_delete, can_export, can_share

### 10. Utilitaires D3.js

**Fichier** : `utils/d3/chartHelpers.ts`

#### Fonctions Disponibles
- `createSvg()` : Création SVG avec marges
- `createTooltip()` : Tooltips personnalisés
- `showTooltip()` / `hideTooltip()` : Gestion tooltips
- `formatNumber()` : Format français (1 234)
- `formatDate()` : Format date français
- `getColorScale()` : Échelles de couleurs
- `addGridLines()` : Grilles de référence
- `animateTransition()` : Transitions fluides (750ms, cubic)
- `wrapText()` : Wrapping intelligent du texte
- `addLegend()` : Légendes graphiques
- `addAxisLabels()` : Labels des axes
- `highlightOnHover()` : Effets de survol

#### Constantes
- `CHART_COLORS` : Palette de couleurs cohérente
- `CHART_MARGINS` : Marges standard (top: 20, right: 30, bottom: 40, left: 50)

### 11. Sécurité et Audit

#### Audit Logging
Toutes les actions sont enregistrées dans `consultation_audit_logs` :
- **Actions tracées** :
  - viewed (consultation consultée)
  - created (nouvelle consultation)
  - updated (modification)
  - deleted (suppression)
  - exported_pdf, exported_excel, exported_csv
  - shared (partage)
  - printed (impression)

#### Informations Enregistrées
- ID consultation
- ID utilisateur
- Action effectuée
- Timestamp
- Adresse IP (optionnel)
- User agent (optionnel)
- Détails additionnels (JSON)

#### Accès aux Logs
- Administrateurs : Accès complet à tous les logs
- Utilisateurs : Accès à leurs propres logs uniquement

### 12. Types TypeScript

**Fichier** : `types/consultationHistory.ts`

Types définis :
- `ConsultationWithDetails` : Consultation enrichie
- `ConsultationFilters` : Filtres disponibles
- `ConsultationStatistics` : Statistiques agrégées
- `TimeSeriesData` : Données temporelles
- `DiagnosisDistribution` : Répartition diagnostics
- `HeatmapCell` : Cellule de heatmap
- `ConsultationAuditLog` : Log d'audit
- `Permissions` : Permissions utilisateur
- `ViewMode`, `ChartType`, `ExportFormat`, etc.

## Architecture des Fichiers

```
src/
├── components/
│   └── consultations/
│       ├── charts/
│       │   ├── TimelineChart.tsx
│       │   ├── DiagnosisDistributionChart.tsx
│       │   └── HeatmapCalendar.tsx
│       └── history/
│           ├── ConsultationHistoryDashboard.tsx
│           ├── ConsultationFiltersPanel.tsx
│           ├── SmartSearchBar.tsx
│           ├── ConsultationTable.tsx
│           ├── Pagination.tsx
│           └── StatisticsCards.tsx
├── hooks/
│   └── consultation/
│       ├── useConsultationHistory.ts
│       └── usePermissions.ts
├── utils/
│   └── d3/
│       └── chartHelpers.ts
├── types/
│   └── consultationHistory.ts
└── pages/
    └── staff/
        └── ConsultationHistoryPage.tsx
```

## Accès au Système

### Navigation
Le nouveau système est accessible depuis le menu de navigation du staff :

**Menu** : "Historique Consultations"
**Icône** : Activity
**Rôles autorisés** : Médecin, Infirmier, Administrateur

### URL
`/dashboard/consultation-history`

## Technologies Utilisées

- **React 18** avec TypeScript
- **D3.js v7** pour les visualisations
- **Supabase** pour la base de données et RPC
- **Tailwind CSS** pour le style
- **Lucide React** pour les icônes
- **React Router** pour la navigation

## Performance et Optimisation

### Optimisations Implémentées
1. **Debouncing** de la recherche (300ms)
2. **Pagination côté serveur** pour limiter le transfert de données
3. **Indexes SQL** sur les colonnes fréquemment requêtées
4. **Lazy loading** des graphiques (chargés uniquement en mode "Graphiques")
5. **Memoization** des calculs statistiques
6. **Transitions D3.js optimisées** (750ms cubic)

### Recommandations Futures
1. Implémenter **React Query** pour le cache
2. Ajouter **virtualisation** pour listes >1000 éléments
3. **Code splitting** pour réduire le bundle initial
4. **Service Workers** pour mode offline
5. **WebSockets** pour mises à jour en temps réel

## Fonctionnalités en Développement

### Phase 2 (À venir)
- ✅ Export CSV (implémenté basique)
- ⏳ Export PDF avec mise en page professionnelle
- ⏳ Export Excel avec graphiques intégrés
- ⏳ Vue Calendrier complète avec navigation
- ⏳ Timeline verticale patient
- ⏳ Notifications en temps réel (Supabase Realtime)
- ⏳ Mode offline avec synchronisation
- ⏳ Graphiques avancés (Network, Bubble, Sankey)
- ⏳ Analyses prédictives
- ⏳ Rapports automatisés planifiables

### Phase 3 (Futures améliorations)
- Mode sombre complet
- Système de favoris/bookmarks
- Comparaison entre périodes côte à côte
- Alertes intelligentes configurables
- Dashboard personnalisable
- Exports planifiés par email
- Intégration avec systèmes externes
- API REST pour intégrations tierces

## Guide d'Utilisation

### 1. Accéder au Système
1. Se connecter au dashboard du staff
2. Cliquer sur "Historique Consultations" dans le menu latéral
3. Le dashboard s'affiche avec les statistiques des 30 derniers jours

### 2. Filtrer les Consultations
1. Cliquer sur le bouton "Filtres"
2. Sélectionner les critères souhaités :
   - Choisir une période prédéfinie ou personnalisée
   - Sélectionner un médecin spécifique
   - Choisir un département
   - Rechercher un diagnostic
   - Filtrer par statut de suivi
3. Cliquer sur "Appliquer les filtres"
4. Pour réinitialiser : cliquer sur "Réinitialiser"

### 3. Rechercher une Consultation
1. Utiliser la barre de recherche en haut
2. Taper le nom du patient, diagnostic, ou symptôme
3. Les résultats s'affichent automatiquement après 300ms
4. Cliquer sur X pour effacer la recherche

### 4. Consulter les Graphiques
1. Cliquer sur l'onglet "Graphiques"
2. Observer les visualisations :
   - **Courbe d'évolution** : Tendances temporelles
   - **Top diagnostics** : 10 diagnostics les plus fréquents
   - **Calendrier de charge** : Visualisation des jours chargés
3. Survoler les éléments pour voir les détails
4. Les graphiques sont interactifs et animés

### 5. Exporter les Données
1. Cliquer sur le bouton "Exporter"
2. Choisir le format :
   - **CSV** : Pour Excel ou analyse externe
   - **Excel** : Avec formatage et graphiques (à venir)
   - **PDF** : Rapport imprimable (à venir)
3. Le fichier se télécharge automatiquement
4. Toutes les actions d'export sont enregistrées dans les logs d'audit

### 6. Naviguer dans les Pages
1. Utiliser les boutons de pagination en bas du tableau
2. Changer la taille de page (10, 25, 50, 100)
3. Utiliser les flèches pour page précédente/suivante
4. Cliquer sur un numéro de page pour accès direct

### 7. Consulter les Détails
1. Cliquer sur une ligne du tableau
2. Ou cliquer sur le bouton "Détails"
3. La modal patient s'ouvre avec toutes les informations
4. L'action est enregistrée dans les logs d'audit

## Sécurité et Conformité

### Conformité RGPD
- ✅ Logs d'audit complets
- ✅ Traçabilité de tous les accès
- ✅ Permissions granulaires
- ⏳ Anonymisation pour exports statistiques
- ⏳ Droit à l'oubli
- ⏳ Export données personnelles sur demande

### Sécurité des Données
- ✅ Row Level Security (RLS) Supabase
- ✅ Permissions basées sur les rôles
- ✅ Audit trail complet
- ⏳ Chiffrement champs sensibles
- ⏳ Watermarks sur exports PDF
- ⏳ Limitation de taux (rate limiting)
- ⏳ Authentification à deux facteurs pour exports

## Support et Assistance

### Problèmes Courants

**Les graphiques ne s'affichent pas**
- Vérifier que vous êtes en mode "Graphiques"
- Actualiser la page
- Vérifier qu'il y a des données dans la période sélectionnée

**Les filtres ne fonctionnent pas**
- Vérifier les permissions de votre rôle
- Essayer de réinitialiser les filtres
- Actualiser les données

**Export CSV ne fonctionne pas**
- Vérifier que vous avez la permission `can_export`
- Vérifier qu'il y a des données à exporter
- Essayer avec un filtre plus restrictif

**Performance lente**
- Réduire la période de temps sélectionnée
- Utiliser des filtres pour limiter les résultats
- Réduire la taille de page (choisir 25 au lieu de 100)

## Maintenance et Évolution

### Scripts de Maintenance
À créer dans le futur :
- Script de nettoyage des logs d'audit anciens
- Script d'archivage des consultations anciennes
- Script de génération de rapports automatiques
- Script de sauvegarde des statistiques

### Monitoring Recommandé
- Temps de réponse des requêtes
- Taille des logs d'audit
- Utilisation des exports
- Patterns d'utilisation des filtres
- Performance des graphiques D3.js

## Conclusion

Le nouveau système d'historique des consultations offre une plateforme moderne, interactive et sécurisée pour l'analyse des données médicales. Avec ses visualisations D3.js personnalisées, son système de filtrage avancé, et ses permissions granulaires, il permet aux professionnels de santé d'accéder rapidement aux informations dont ils ont besoin tout en garantissant la sécurité et la traçabilité des accès.

Le système est conçu pour être évolutif et peut être enrichi progressivement avec de nouvelles fonctionnalités selon les besoins des utilisateurs.

---

**Version** : 1.0.0
**Date de création** : 26 Octobre 2025
**Dernière mise à jour** : 26 Octobre 2025
**Auteur** : Système de Gestion Hospitalière Okapia
