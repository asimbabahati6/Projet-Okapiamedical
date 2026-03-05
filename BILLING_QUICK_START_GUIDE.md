# 🚀 Guide Rapide: Facturation & Analyses Financières

## ⚡ Démarrage en 5 Minutes

### 🎯 Les 3 Modules Financiers

```
┌─────────────────────────────────────────────────────┐
│  💰 FACTURATION          → /staff/billing           │
│  Gestion factures, paiements, KPIs                  │
├─────────────────────────────────────────────────────┤
│  📈 ANALYTICS            → /staff/billing-analytics │
│  Graphiques, prévisions, insights                   │
├─────────────────────────────────────────────────────┤
│  💸 DÉPENSES             → /staff/expenses          │
│  Gestion dépenses opérationnelles                   │
└─────────────────────────────────────────────────────┘
```

---

## 💰 Module 1: Facturation

### Accès Rapide
```
URL: /staff/billing
Rôles: Administrateur, Comptable, Réceptionniste
```

### Actions Essentielles

#### 1️⃣ Créer une Facture
```
1. Cliquer [Nouvelle Facture]
2. Sélectionner patient
3. Choisir type (Consultation, Hospitalisation, etc.)
4. Ajouter articles avec prix
5. Méthode paiement
6. [Créer Facture]
```

#### 2️⃣ Enregistrer un Paiement
```
1. Cliquer sur facture "En Attente"
2. Section "Enregistrer Paiement"
3. Entrer montant reçu
4. Sélectionner méthode
5. [Enregistrer]
→ Status mis à jour automatiquement
```

#### 3️⃣ Filtrer les Factures
```
Périodes:
- Aujourd'hui
- Cette Semaine
- Ce Mois
- Personnalisé (dates)

Status:
- Tous
- En Attente
- Payées
- Partielles
- Annulées
```

### KPIs Affichés

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Revenu Total │ │ Impayées     │ │ Taux Collecte│
│ $45,230      │ │ $8,450       │ │ 87.5%        │
│ +12% ↑       │ │ 15 factures  │ │ +3.2% ↑      │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 📈 Module 2: Analytics

### Accès Rapide
```
URL: /staff/billing-analytics
Rôles: Administrateur, Directeur, Finance
```

### Graphiques Disponibles

#### 1. Collection Trend (Tendance)
```
📊 Courbe revenu sur période
→ Voir évolution jour par jour
→ Identifier pics et creux
```

#### 2. Invoice Status (Distribution)
```
🍩 Donut chart par status
→ % Payées, En attente, etc.
→ Montants par catégorie
```

#### 3. Payment Methods (Méthodes)
```
📊 Barres par méthode
→ Espèces, Carte, Mobile Money
→ Préférences clients
```

#### 4. Cash Flow Forecast (Prévisions)
```
📈 Prévisions 30 jours
→ Revenu attendu
→ Intervalle confiance
```

### Comparaisons

```
Comparer automatiquement:
- Période actuelle vs précédente
- Ce mois vs mois dernier
- Cette semaine vs semaine dernière

Métriques:
→ Revenu total
→ Nombre factures
→ Moyenne par patient
→ Taux de collecte
```

### Top Payeurs

```
🥇 1. Mukendi Joseph    $2,450 (15 visites)
🥈 2. Tshiala Marie     $1,890 (12 visites)
🥉 3. Kabila Sophie     $1,650 (8 visites)
   ...
🔟 10. Lumingu Pierre   $890 (5 visites)
```

---

## 💸 Module 3: Dépenses (NOUVEAU!)

### Accès Rapide
```
URL: /staff/expenses
Rôles: Administrateur, Finance
```

### Catégories de Dépenses

```
⚡ Services Publics    - Électricité, Eau, Internet
🏢 Loyer               - Location locaux
🔧 Maintenance         - Réparations, entretien
📦 Fournitures         - Bureau, consommables
💰 Salaires            - Rémunérations personnel
🖥️ Équipement          - Matériel, équipements
📢 Marketing           - Communication, pub
🛡️ Assurances          - Polices d'assurance
🚗 Transport           - Véhicules, carburant
📋 Autres              - Divers
```

### Actions Rapides

#### 1️⃣ Enregistrer Dépense
```
1. Cliquer [Nouvelle Dépense]
2. Choisir catégorie (ex: ⚡ Services Publics)
3. Montant: 500.00
4. Description: "Facture électricité Février"
5. Date: 15/02/2026
6. Fournisseur: "SNEL"
7. Méthode: Virement Bancaire
8. N° Reçu: ELEC-2026-002
9. Notes (optionnel)
10. [Enregistrer]
```

#### 2️⃣ Consulter Détails
```
1. Cliquer sur ligne dépense
2. Modal affiche:
   - Montant en grand
   - Catégorie + icône
   - Date formatée
   - Description complète
   - Fournisseur
   - Méthode paiement
   - Notes
   - Qui a créé + quand
```

#### 3️⃣ Filtrer Dépenses
```
Par Catégorie:
→ Toutes ou sélection unique

Par Date:
→ Aujourd'hui
→ 7 derniers jours
→ Ce mois
→ Toutes les dates
```

### Statistiques Dépenses

```
┌─────────────────────────┐
│ Dépenses Ce Mois        │
│ $12,450                 │
│ +8.5% vs mois dernier  │
└─────────────────────────┘

┌─────────────────────────┐
│ Mois Dernier            │
│ $11,480                 │
│ 48 transactions         │
└─────────────────────────┘

┌─────────────────────────┐
│ Total Général           │
│ $145,890                │
│ 456 transactions        │
└─────────────────────────┘
```

---

## 🔗 Intégration Modules

### Comment ça communique?

```
┌─────────────┐
│ FACTURATION │ → Revenu
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  ANALYTICS  │ ← Données financières
└──────┬──────┘    complètes
       ↑
       │
┌──────┴──────┐
│  DÉPENSES   │ → Coûts
└─────────────┘

RÉSULTAT = Profit/Perte calculé automatiquement
```

### Rapports Financiers

```
Génération automatique:
1. Données Facturation (Revenu)
2. Données Dépenses (Coûts)
3. Calcul automatique:
   - Balance Sheet
   - Income Statement
   - Cash Flow Statement
4. Export PDF professionnel
5. Stockage Supabase
6. Téléchargement facile
```

---

## 🎯 Cas d'Usage Fréquents

### Scenario 1: Fin de Journée

```
📝 Checklist quotidienne:

1. Vérifier factures du jour
   → /staff/billing
   → Filtre "Aujourd'hui"

2. Enregistrer paiements reçus
   → Cliquer factures impayées
   → Enregistrer montants

3. Ajouter dépenses
   → /staff/expenses
   → Créer nouvelle dépense si achat

4. Consulter KPIs
   → Observer tendance journalière
```

### Scenario 2: Fin de Semaine

```
📊 Revue hebdomadaire:

1. Analytics
   → /staff/billing-analytics
   → Période "Cette Semaine"

2. Observer graphiques
   → Collection trend
   → Status distribution

3. Lire insights automatiques
   → Banner en haut
   → Alertes si présentes

4. Comparer semaine précédente
   → Tableau comparaison
   → Variations %
```

### Scenario 3: Fin de Mois

```
📈 Clôture mensuelle:

1. Générer rapport financier
   → /staff/billing
   → Section "Rapports Financiers"
   → [Générer Rapport]
   → Type: Détaillé
   → Période: Ce Mois

2. Analyser profit/perte
   → Revenu vs Dépenses
   → Marge calculée

3. Identifier tendances
   → Top payeurs
   → Catégories dépenses élevées

4. Planifier mois suivant
   → Budget basé sur données
   → Ajustements nécessaires
```

---

## ⚡ Raccourcis & Astuces

### Navigation Rapide

```
Facturation:          /staff/billing
Analytics:            /staff/billing-analytics
Dépenses:             /staff/expenses

Création rapide:
Ctrl+N (si modal fermé) → Nouvelle facture/dépense
```

### Filtres Intelligents

```
Facturation:
- Cliquer KPI card → Filtre automatique
  Ex: Card "Impayées" → Affiche seulement impayées

Dépenses:
- Cliquer stat catégorie → Filtre appliqué
```

### Exports Rapides

```
PDF:  Rapport formaté, imprimable
Excel: Données analysables, formules
CSV:  Import dans autres systèmes

Tout exporter: Cliquer [Exporter] → Choisir format
```

---

## 📊 Métriques à Surveiller

### Quotidiennement
```
✓ Revenu du jour
✓ Factures émises
✓ Paiements reçus
✓ Dépenses enregistrées
```

### Hebdomadairement
```
✓ Taux de collecte
✓ Factures impayées > 7j
✓ Tendance revenu
✓ Dépenses inhabituelles
```

### Mensuellement
```
✓ Revenu total mois
✓ Profit net
✓ Ratio revenu/dépenses
✓ Top 10 payeurs
✓ Catégories dépenses principales
```

---

## 🚨 Alertes Importantes

### Critiques (Rouge) 🔴
```
→ Factures impayées > 30 jours
→ Baisse revenu > 20%
→ Dépenses dépassent revenu
→ Action immédiate requise!
```

### Avertissements (Jaune) 🟡
```
→ Taux collecte < 85%
→ Augmentation dépenses > 15%
→ Factures annulées élevées
→ Surveillance nécessaire
```

### Informations (Bleu) 🔵
```
→ Nouveau record de revenu
→ Amélioration taux collecte
→ Pic d'activité détecté
→ FYI, bon à savoir
```

---

## 🔐 Sécurité & Permissions

### Qui Peut Faire Quoi?

```
👑 ADMINISTRATEUR:
✓ Tout voir
✓ Tout créer
✓ Tout modifier
✓ Tout supprimer

💼 FINANCE/COMPTABLE:
✓ Voir factures et dépenses
✓ Créer factures et dépenses
✓ Modifier factures et dépenses
✗ Supprimer (admins seulement)

🏥 RÉCEPTIONNISTE:
✓ Voir factures
✓ Créer factures
✓ Enregistrer paiements
✗ Voir/gérer dépenses

📊 DIRECTEUR:
✓ Voir analytics complets
✓ Télécharger rapports
✗ Modifier données
```

---

## 💡 Conseils Pro

### Optimiser Collecte

```
1. Paiements à l'émission
   → Encourager paiement immédiat

2. Rappels automatiques
   → Factures > 7 jours impayées

3. Options paiement multiples
   → Espèces, Carte, Mobile Money

4. Facilités de paiement
   → Paiements partiels acceptés
```

### Réduire Dépenses

```
1. Analyse catégories
   → Identifier postes élevés

2. Comparaison fournisseurs
   → Négocier meilleurs prix

3. Budgets par catégorie
   → Limites mensuelles

4. Audit régulier
   → Éliminer gaspillages
```

### Améliorer Trésorerie

```
1. Prévisions précises
   → Anticiper besoins

2. Réserve de sécurité
   → 3 mois de fonctionnement

3. Diversification revenus
   → Multiples sources

4. Contrôle dépenses
   → Approbations requises
```

---

## 📞 Support Rapide

### Problème Fréquent #1
**"Je ne vois pas les factures"**
```
Solution:
1. Vérifier rôle utilisateur
2. Rafraîchir page (F5)
3. Vérifier filtres appliqués
4. Consulter admin si persiste
```

### Problème Fréquent #2
**"Dépenses n'apparaissent pas dans rapport"**
```
Solution:
1. Vérifier dates dépenses dans période rapport
2. Rafraîchir analytics (bouton refresh)
3. Regénérer rapport
4. Vider cache navigateur (Ctrl+Shift+R)
```

### Problème Fréquent #3
**"Export PDF échoue"**
```
Solution:
1. Réduire plage de dates
2. Vérifier connexion internet
3. Réessayer après 30 secondes
4. Utiliser export Excel alternative
```

---

## 🎓 Formation Express

### 15 Minutes pour Maîtriser

**Minutes 1-5: Facturation**
```
→ Créer 1 facture test
→ Enregistrer 1 paiement
→ Observer KPIs mis à jour
```

**Minutes 6-10: Analytics**
```
→ Naviguer vers analytics
→ Explorer graphiques
→ Lire insights banner
```

**Minutes 11-15: Dépenses**
```
→ Créer 1 dépense test
→ Filtrer par catégorie
→ Consulter détails
```

---

## ✅ Checklist Premier Jour

```
□ Se connecter avec bon rôle
□ Accéder /staff/billing
□ Créer facture de test
□ Enregistrer paiement test
□ Accéder /staff/billing-analytics
□ Explorer graphiques
□ Accéder /staff/expenses
□ Créer dépense de test
□ Exporter rapport PDF
□ Lire documentation complète
```

---

## 🎯 Objectifs Suggérés

### Semaine 1
```
□ Enregistrer toutes transactions quotidiennes
□ Familiarisation interface
□ Premier rapport mensuel
```

### Mois 1
```
□ Processus quotidien fluide
□ Analyse hebdomadaire régulière
□ Dépenses catégorisées correctement
□ Rapport mensuel complet
```

### Trimestre 1
```
□ Optimisation taux collecte
□ Réduction dépenses superflues
□ Prévisions précises
□ Profit stable/croissant
```

---

## 📚 Ressources Supplémentaires

**Documentation Complète:**
→ `BILLING_AND_FINANCIAL_COMPLETE_GUIDE.md`

**Résumé Technique:**
→ `BILLING_FINANCIAL_IMPLEMENTATION_SUMMARY.md`

**Support:**
→ Contacter administrateur système
→ Consulter FAQ dans guide complet

---

## 🎉 Prêt à Commencer!

```
┌─────────────────────────────────────────┐
│  🚀 Vous êtes maintenant prêt!          │
│                                         │
│  Modules 100% fonctionnels:             │
│  ✅ Facturation                         │
│  ✅ Analytics                           │
│  ✅ Dépenses                            │
│                                         │
│  → Commencez par créer votre           │
│     première facture!                   │
└─────────────────────────────────────────┘
```

**Bonne gestion financière! 💰📈**

---

**Version:** 2.0.0
**Date:** 21 Février 2026
**Status:** ✅ Production Ready
