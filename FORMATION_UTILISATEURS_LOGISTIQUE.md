# 📚 Guide de Formation - Système de Gestion Logistique

**Bienvenue dans le système de gestion logistique de votre établissement!**

Ce guide vous accompagnera pas à pas pour maîtriser toutes les fonctionnalités du système.

---

## 🎯 Objectifs de la Formation

À la fin de cette formation, vous serez capable de:

✅ Naviguer dans l'interface du système
✅ Consulter l'état du stock en temps réel
✅ Enregistrer des mouvements de stock
✅ Traiter les alertes critiques
✅ Rechercher et filtrer des articles
✅ Consulter l'historique complet
✅ Effectuer un inventaire physique

**Durée estimée:** 2 heures (théorie + pratique)

---

## 📖 Table des Matières

1. [Introduction et Premiers Pas](#1-introduction-et-premiers-pas)
2. [Le Dashboard - Vue d'Ensemble](#2-le-dashboard---vue-densemble)
3. [Gestion de l'Inventaire](#3-gestion-de-linventaire)
4. [Enregistrement des Mouvements](#4-enregistrement-des-mouvements)
5. [Système d'Alertes](#5-système-dalertes)
6. [Recherche et Filtres Avancés](#6-recherche-et-filtres-avancés)
7. [Exercices Pratiques](#7-exercices-pratiques)
8. [Bonnes Pratiques](#8-bonnes-pratiques)
9. [Dépannage et FAQ](#9-dépannage-et-faq)

---

# 1. Introduction et Premiers Pas

## 1.1 Qu'est-ce que le Système Logistique?

Le système de gestion logistique est un outil informatique qui vous permet de:

- 📦 **Suivre le stock** en temps réel
- 📊 **Visualiser les statistiques** importantes
- 🚨 **Recevoir des alertes** automatiques
- 📝 **Enregistrer tous les mouvements** (entrées, sorties, transferts)
- 🔍 **Tracer l'historique complet** de chaque article
- 📈 **Prendre des décisions** basées sur des données précises

## 1.2 Accès au Système

### Se Connecter

1. **Ouvrir votre navigateur** (Chrome, Firefox, Edge)
2. **Taper l'adresse:** `https://votre-hopital.com`
3. **Cliquer sur** "Connexion Personnel"
4. **Entrer vos identifiants:**
   - Email: votre.email@hopital.cd
   - Mot de passe: (fourni par votre administrateur)
5. **Cliquer** "Se connecter"

### Premier Accès

Si c'est votre première connexion:
- Vous devrez changer votre mot de passe
- Choisissez un mot de passe fort (8+ caractères, majuscules, chiffres)
- Notez-le dans un endroit sûr

## 1.3 Interface Principale

Après connexion, vous verrez:

```
┌─────────────────────────────────────────────────────────┐
│  🏥 OKAPIA HOSPITAL          [👤 Votre Nom] [🔔 5]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Tableau de Bord    📦 Inventaire    📋 Mouvements  │
│                                                          │
│  🚨 Alertes (5)       📑 Rapports                       │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                   CONTENU PRINCIPAL                      │
│                                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Zones importantes:**
- 🔔 **Badge notifications** (coin supérieur droit) = nombre d'alertes actives
- 📱 **Menu principal** (en haut) = navigation entre sections
- 👤 **Menu profil** (coin droit) = paramètres et déconnexion

---

# 2. Le Dashboard - Vue d'Ensemble

## 2.1 Accéder au Dashboard

**Navigation:** Menu Principal → Logistique → Vue d'ensemble

## 2.2 Comprendre les Indicateurs (KPIs)

Le dashboard affiche 8 indicateurs clés:

### 📦 **Total Articles**
- **Que signifie ce chiffre?** Nombre total d'articles différents dans le système
- **Exemple:** 50 articles = vous gérez 50 types de produits différents
- **Bon à savoir:** Ce nombre augmente quand vous ajoutez de nouveaux produits

### 💰 **Valeur du Stock**
- **Que signifie ce chiffre?** Valeur totale de tous les articles en stock (en Francs Congolais)
- **Calcul:** Quantité × Prix unitaire pour tous les articles
- **Exemple:** 250,000 FC = valeur totale de votre stock
- **Utilité:** Suivi de l'immobilisation financière

### 🔴 **Articles Critiques**
- **Que signifie ce chiffre?** Nombre d'articles avec moins de 50% du stock minimum
- **Exemple:** 3 articles = 3 produits en situation critique
- **⚠️ URGENT:** Ces articles nécessitent un réapprovisionnement IMMÉDIAT
- **Action:** Cliquer sur le chiffre pour voir la liste

### ⚠️ **Stock Faible**
- **Que signifie ce chiffre?** Articles en dessous du seuil minimum (mais pas encore critiques)
- **Exemple:** 6 articles = 6 produits à commander bientôt
- **Action recommandée:** Planifier les commandes dans les 7 jours

### ⏰ **Expiration Proche**
- **Que signifie ce chiffre?** Articles qui expirent dans les 30 prochains jours
- **Exemple:** 2 articles = 2 produits à utiliser en priorité
- **Action:** Vérifier dates d'expiration et planifier utilisation

### ⚰️ **Articles Expirés**
- **Que signifie ce chiffre?** Articles dépassés qui doivent être retirés
- **Exemple:** 2 articles = 2 produits à retirer IMMÉDIATEMENT
- **⚠️ CRITIQUE:** Ne jamais distribuer un produit expiré
- **Action:** Retirer du stock et enregistrer perte

### 🚨 **Alertes Actives**
- **Que signifie ce chiffre?** Nombre total d'alertes non traitées
- **Exemple:** 20 alertes = 20 situations nécessitant attention
- **Code couleur:**
  - 🔴 Rouge (1-5): Quelques alertes, gérable
  - 🟠 Orange (6-15): Attention requise
  - 🔴 Rouge foncé (16+): Situation critique, action immédiate

### 📂 **Catégories**
- **Que signifie ce chiffre?** Nombre de catégories d'articles
- **Exemple:** 7 catégories = Médicaments, Consommables, Équipements, etc.
- **Utilité:** Organisation du stock

## 2.3 Actions Rapides

En bas du dashboard, vous trouverez des boutons d'action:

| Bouton | Action | Quand l'utiliser? |
|--------|--------|-------------------|
| ➕ **Nouveau Mouvement** | Enregistrer entrée/sortie | Chaque réception ou distribution |
| 📋 **Voir Inventaire** | Accéder liste complète | Consulter état stock |
| 🚨 **Gérer Alertes** | Traiter alertes | Chaque début de journée |
| 📊 **Générer Rapport** | Créer rapport | Fin de mois |

---

# 3. Gestion de l'Inventaire

## 3.1 Accéder à l'Inventaire

**Navigation:** Menu Principal → Logistique → Inventaire

## 3.2 Vue Liste des Articles

Vous verrez un tableau avec:

| Colonne | Signification | Utilité |
|---------|---------------|---------|
| **Photo/Icône** | Image de l'article | Identification visuelle rapide |
| **Nom** | Nom du produit | Identification |
| **SKU** | Code unique | Référence système |
| **Catégorie** | Type de produit | Classification |
| **Stock** | Quantité actuelle | Disponibilité |
| **Statut** | État du stock | Urgence |
| **Localisation** | Où se trouve l'article | Retrouver physiquement |
| **Actions** | Boutons d'action | Opérations possibles |

### Comprendre les Statuts de Stock

Le système affiche des badges colorés:

- 🟢 **NORMAL** = Stock OK, rien à faire
- 🟡 **FAIBLE** = En dessous du minimum, à commander
- 🟠 **CRITIQUE** = Moins de 50% du minimum, URGENT
- 🔴 **ÉPUISÉ** = Stock à zéro, rupture totale
- ⚰️ **EXPIRÉ** = À retirer immédiatement
- 📦 **SURSTOCK** = Trop de stock, risque péremption

## 3.3 Voir les Détails d'un Article

### Étapes:
1. **Trouver l'article** dans la liste
2. **Cliquer** sur l'icône œil 👁️ (colonne Actions)
3. **Consulter** la fiche complète

### Informations Disponibles:

#### **Onglet "Informations"**
- Nom complet
- Description
- SKU (code)
- Catégorie
- Fournisseur
- Prix unitaire
- Localisation physique
- Numéro de lot
- Date d'expiration

#### **Onglet "Stock"**
- **Quantité actuelle:** Ce qui est disponible MAINTENANT
- **Stock minimum:** Seuil d'alerte (ne jamais descendre en dessous)
- **Stock maximum:** Capacité de stockage maximale
- **Point de réapprovisionnement:** Quand commander

**Exemple concret:**
```
Paracétamol 500mg
- Stock actuel: 4900 comprimés ✅
- Stock minimum: 1000 comprimés
- Point réappro: 2000 comprimés
- Stock maximum: 10000 comprimés

📊 Interprétation:
Le stock est NORMAL (4900 > 1000)
Pas besoin de commander maintenant
Commander quand on atteint 2000
```

#### **Onglet "Historique"**
- Liste de tous les mouvements
- Dates et heures
- Quantités avant/après
- Raisons du mouvement
- Qui a fait l'opération

## 3.4 Ajouter un Nouvel Article

### Quand ajouter un article?
- Nouveau produit jamais utilisé avant
- Nouveau fournisseur avec code différent
- Nouvelle présentation (ex: 500mg vs 1000mg)

### Étapes:
1. **Cliquer** sur "➕ Ajouter Article"
2. **Remplir le formulaire:**

**Section Identification:**
- **Nom:** Nom exact du produit (ex: "Paracétamol 500mg")
- **Description:** Détails (ex: "Comprimés analgésiques")
- **SKU:** Code généré automatiquement (ou personnalisé)
- **Catégorie:** Sélectionner dans liste déroulante
- **Fournisseur:** Choisir le fournisseur principal

**Section Stock:**
- **Quantité initiale:** Combien vous avez au départ
- **Stock minimum:** Seuil d'alerte (ne pas descendre)
- **Stock maximum:** Capacité de stockage
- **Point réappro:** Quand commander
- **Unité:** comprimé, boîte, flacon, ampoule, etc.

**Section Détails:**
- **Prix unitaire:** Prix d'achat
- **Localisation:** Où ranger le produit (Pharmacie A1, Entrepôt B, etc.)
- **Numéro de lot:** Si applicable
- **Date expiration:** Si applicable

3. **Vérifier** les informations
4. **Cliquer** "Enregistrer"

### ⚠️ Points d'Attention:
- Bien choisir l'unité (comprimé ≠ boîte)
- Stock minimum réaliste (consommation moyenne × 2 semaines)
- Localisation précise pour retrouver facilement

---

# 4. Enregistrement des Mouvements

## 4.1 Comprendre les Types de Mouvements

Le système gère 7 types de mouvements:

### 📥 **ENTRÉE** - Réception de stock
**Quand?** Livraison fournisseur, retour de service

**Exemple concret:**
```
Le fournisseur livre 500 boîtes de gants
→ Type: ENTRÉE
→ Article: Gants Latex M
→ Quantité: 500 boîtes
→ Raison: "Réception fournisseur"
→ Référence: BL-2024-1234
```

### 📤 **SORTIE** - Distribution de stock
**Quand?** Distribution aux services, ventes

**Exemple concret:**
```
Service pédiatrie demande 100 comprimés Paracétamol
→ Type: SORTIE
→ Article: Paracétamol 500mg
→ Quantité: 100 comprimés
→ Raison: "Distribution service pédiatrie"
→ Destination: Service Pédiatrie - Unité A
```

### 🔄 **TRANSFERT** - Déplacement interne
**Quand?** Déplacer stock d'un lieu à un autre

**Exemple concret:**
```
Déplacer masques de l'entrepôt vers stock d'urgence
→ Type: TRANSFERT
→ Article: Masques chirurgicaux
→ Quantité: 50 boîtes
→ Source: Entrepôt Principal
→ Destination: Stock Urgences
```

### 🔧 **AJUSTEMENT** - Correction inventaire
**Quand?** Inventaire physique, écart détecté

**Exemple concret:**
```
Comptage physique: système indique 850, réel = 800
→ Type: AJUSTEMENT
→ Article: Gants Latex M
→ Nouvelle quantité: 800 boîtes
→ Raison: "Inventaire physique trimestriel"
→ Notes: "Écart de -50 boîtes détecté"
```

### ↩️ **RETOUR** - Article retourné
**Quand?** Service retourne article non utilisé

### ❌ **PERTE** - Perte/Casse
**Quand?** Produit cassé, volé, détruit

### ⚠️ **PÉREMPTION** - Retrait produit expiré
**Quand?** Retirer produit périmé du stock

## 4.2 Enregistrer un Mouvement - Procédure Complète

### Méthode 1: Depuis le Dashboard
1. **Cliquer** sur "➕ Nouveau Mouvement"

### Méthode 2: Depuis l'Inventaire
1. **Trouver** l'article
2. **Cliquer** sur l'icône ⚙️ (Actions)
3. **Sélectionner** "Enregistrer mouvement"

### Méthode 3: Depuis les Mouvements
1. **Menu** → Logistique → Mouvements
2. **Cliquer** sur "➕ Nouveau Mouvement"

### Formulaire d'Enregistrement:

**Étape 1: Type de mouvement**
- Sélectionner le type (Entrée, Sortie, etc.)
- Le formulaire s'adapte automatiquement

**Étape 2: Sélection article**
- Rechercher par nom ou scanner code-barres
- Le système affiche stock actuel

**Étape 3: Quantité**
- Entrer la quantité
- L'unité s'affiche automatiquement
- ⚠️ Le système vérifie si quantité disponible (pour sorties)

**Étape 4: Détails**
Selon le type:
- **Entrée:** Référence BL, fournisseur
- **Sortie:** Destination (service)
- **Transfert:** Source et destination
- **Ajustement:** Raison, notes détaillées

**Étape 5: Validation**
- Vérifier toutes les informations
- Cliquer "Enregistrer"
- ✅ Confirmation apparaît

## 4.3 Exemple Pas à Pas - Sortie de Stock

**Situation:** Le service des urgences demande 50 comprimés de Paracétamol

**Procédure:**

1. **Menu** → Logistique → Mouvements
2. **Cliquer** "➕ Nouveau Mouvement"
3. **Type:** Sélectionner "Sortie"
4. **Article:**
   - Taper "Para" dans la recherche
   - Sélectionner "Paracétamol 500mg"
   - Stock actuel affiché: 4900 comprimés
5. **Quantité:** Entrer "50"
6. **Raison:** "Distribution service urgences"
7. **Destination:** "Service Urgences - Pharmacie"
8. **Notes (optionnel):** "Demande Dr. Mukendi - Cas urgents"
9. **Vérifier:**
   - Stock avant: 4900
   - Quantité sortie: 50
   - Stock après: 4850 ✅
10. **Cliquer** "Enregistrer"
11. **Confirmation:** "Mouvement enregistré avec succès!"

**Résultat:**
- ✅ Stock mis à jour automatiquement (4900 → 4850)
- ✅ Mouvement enregistré dans l'historique
- ✅ Traçabilité complète (qui, quand, pourquoi, combien)

## 4.4 Consulter l'Historique des Mouvements

**Navigation:** Menu → Logistique → Mouvements

### Vue Liste:
Affiche tous les mouvements avec:
- Date et heure
- Type (icône colorée)
- Article
- Quantité
- Stock avant/après
- Qui a fait l'opération

### Filtres Disponibles:
- **Type:** Entrée, Sortie, Ajustement, etc.
- **Période:** Aujourd'hui, 7 jours, 30 jours, personnalisée
- **Article:** Sélectionner un article spécifique
- **Recherche:** Chercher dans raisons/notes

**Exemple d'utilisation:**
```
Question: "Combien de Paracétamol distribué cette semaine?"

Actions:
1. Mouvements → Filtrer
2. Type: Sortie
3. Article: Paracétamol 500mg
4. Période: 7 derniers jours
5. Voir résultats

Résultat: 3 sorties = 250 comprimés distribués
```

---

# 5. Système d'Alertes

## 5.1 Comprendre les Alertes

Les alertes sont des **notifications automatiques** qui signalent des situations nécessitant votre attention.

### Types d'Alertes:

#### 🔴 **STOCK ÉPUISÉ** (Critique)
- **Signification:** Article à zéro, rupture totale
- **Action:** Commander EN URGENCE
- **Exemple:** "Artémisinine 50mg - Stock épuisé"

#### 🟠 **STOCK CRITIQUE** (Critique)
- **Signification:** Moins de 50% du minimum
- **Action:** Commander IMMÉDIATEMENT
- **Exemple:** "Adrénaline - 8 ampoules (min: 20)"

#### 🟡 **STOCK FAIBLE** (Élevée)
- **Signification:** En dessous du minimum
- **Action:** Commander dans les 7 jours
- **Exemple:** "Insuline - 35 flacons (min: 50)"

#### ⚰️ **PRODUIT EXPIRÉ** (Élevée)
- **Signification:** Date dépassée
- **Action:** RETIRER IMMÉDIATEMENT
- **Exemple:** "Aspirine 100mg - Expiré depuis 5 jours"

#### ⏰ **EXPIRATION PROCHE** (Moyenne)
- **Signification:** Expire dans 7-30 jours
- **Action:** Utiliser en priorité
- **Exemple:** "Sérum physiologique - Expire dans 15 jours"

#### 📦 **SURSTOCK** (Faible)
- **Signification:** Quantité dépasse maximum
- **Action:** Vérifier et ajuster
- **Exemple:** "Compresses - 12500 unités (max: 5000)"

## 5.2 Badge Alertes

**Localisation:** Coin supérieur droit, à côté de votre nom

```
┌──────────────────────────────────┐
│  👤 Jean Kabamba    🔔 [20]     │
└──────────────────────────────────┘
              Badge rouge avec nombre
```

**Code couleur du badge:**
- 🟢 Vert (0): Aucune alerte, tout va bien
- 🔵 Bleu (1-5): Quelques alertes, situation normale
- 🟠 Orange (6-15): Attention requise
- 🔴 Rouge (16+): Situation critique

**Le badge se met à jour automatiquement** quand:
- Une nouvelle alerte est créée (+1)
- Vous résolvez une alerte (-1)
- Une alerte devient inactive (-1)

## 5.3 Consulter les Alertes

**Navigation:** Menu → Logistique → Alertes

OU

**Cliquer sur le badge** 🔔 en haut à droite

### Vue des Alertes:

Chaque alerte affiche:
- **Icône et couleur** selon sévérité
- **Type d'alerte** (Stock épuisé, Expiré, etc.)
- **Message** descriptif
- **Article concerné**
- **Quantités** (actuelle vs minimum)
- **Date création** de l'alerte
- **Actions possibles:**
  - 👁️ Voir article
  - ✅ Marquer comme lu
  - ✔️ Marquer comme résolu

### Filtres:
- **Sévérité:** Critique, Élevée, Moyenne, Faible
- **Type:** Stock épuisé, Critique, Faible, etc.
- **Statut:** Actives, Lues, Résolues

## 5.4 Traiter une Alerte - Procédure Complète

### Exemple: Alerte "Artémisinine - Stock épuisé"

**Étape 1: Identifier l'alerte**
```
🔴 CRITIQUE - Stock épuisé
Article: Artémisinine 50mg
Stock actuel: 0 comprimés
Minimum requis: 300 comprimés
Message: "Stock complètement épuisé - Rupture totale"
```

**Étape 2: Évaluer la situation**
- ❓ Y a-t-il des commandes en cours?
- ❓ Quel est le délai de livraison?
- ❓ Y a-t-il un produit de substitution?

**Étape 3: Consulter les détails**
1. **Cliquer** sur l'icône œil 👁️
2. **Voir** la fiche complète de l'article
3. **Consulter** l'historique:
   - Dernière réception: Quand?
   - Consommation moyenne: Combien par mois?
   - Dernier fournisseur: Qui?

**Étape 4: Prendre action**

**Option A: Commander**
1. Contacter le fournisseur
2. Passer commande urgente
3. Noter référence commande

**Option B: Transfert interne**
1. Vérifier autre localisation
2. Faire transfert si disponible ailleurs

**Étape 5: Enregistrer la réception**
Quand fournisseur livre:
1. **Menu** → Nouveau Mouvement
2. **Type:** Entrée
3. **Article:** Artémisinine 50mg
4. **Quantité:** 500 comprimés
5. **Raison:** "Réception urgente fournisseur"
6. **Référence:** BL-URGENT-2024-001
7. **Enregistrer**

**Étape 6: Résoudre l'alerte**
1. **Retour** aux Alertes
2. **Trouver** l'alerte Artémisinine
3. **Cliquer** icône ✔️ "Marquer comme résolu"
4. **Confirmer**

**Résultat:**
- ✅ Stock reconstitué (0 → 500)
- ✅ Alerte résolue
- ✅ Badge diminue (21 → 20)
- ✅ Traçabilité complète

## 5.5 Workflow Quotidien des Alertes

**Chaque matin au début de service:**

1. **Consulter le badge**
   - Combien d'alertes aujourd'hui?

2. **Ouvrir les Alertes**
   - Filtrer par "Critique"

3. **Traiter les critiques en PREMIER:**
   - Stock épuisé → Commander MAINTENANT
   - Stock critique → Commander AUJOURD'HUI
   - Produits expirés → Retirer IMMÉDIATEMENT

4. **Ensuite traiter les importantes:**
   - Stock faible → Planifier commande
   - Expiration proche → Utiliser en priorité

5. **Marquer comme lu:**
   - Alertes prises en compte mais pas encore résolues
   - Permet de suivre votre progression

6. **En fin de journée:**
   - Vérifier badge
   - S'assurer que les critiques sont traitées

---

# 6. Recherche et Filtres Avancés

## 6.1 Barre de Recherche

**Localisation:** En haut de chaque liste (Inventaire, Mouvements, Alertes)

### Recherche dans l'Inventaire:

**Ce que vous pouvez chercher:**
- Nom de l'article (ex: "Paracétamol")
- Partie du nom (ex: "Para" trouve tous les Paracétamol)
- Code SKU (ex: "INV-20241120-PAR500")
- Numéro de lot (ex: "LOT-PAR-2024-11")
- Localisation (ex: "Pharmacie A1")

**Astuces:**
- La recherche est **insensible à la casse** (PARA = para = Para)
- Pas besoin de taper le nom complet
- Utiliser des mots-clés (ex: "seringue" trouve toutes les seringues)

**Exemples:**
```
Recherche: "seringue"
Résultat: Seringues 10ml

Recherche: "gant"
Résultat: Gants Latex M, Gants Nitrile L

Recherche: "INV-202411"
Résultat: Tous les articles ajoutés en novembre 2024
```

## 6.2 Filtres par Statut

**Inventaire → Filtrer par statut:**

### Cas d'usage pratiques:

**Début de journée - Voir articles critiques:**
```
Filtre: CRITIQUE + ÉPUISÉ
→ Liste des urgences à traiter
→ Préparer les commandes
```

**Fin de semaine - Articles à commander:**
```
Filtre: FAIBLE + CRITIQUE
→ Liste consolidée pour commandes
→ Préparer bons de commande
```

**Contrôle qualité - Produits à retirer:**
```
Filtre: EXPIRÉ
→ Articles à retirer du stock
→ Organiser destruction
```

**Audit - Vérifier surstock:**
```
Filtre: SURSTOCK
→ Articles en excès
→ Planifier redistribution ou retour
```

## 6.3 Filtres des Mouvements

**Mouvements → Filtrer:**

### Par Type:

**Voir toutes les réceptions du mois:**
```
Type: ENTRÉE
Période: 30 derniers jours
→ Vérifier toutes les livraisons
→ Comparer avec bons de commande
```

**Voir distributions d'un service:**
```
Type: SORTIE
Recherche: "Service Pédiatrie"
Période: Mois en cours
→ Consommation du service
```

**Vérifier ajustements inventaire:**
```
Type: AJUSTEMENT
Période: Trimestre
→ Écarts détectés
→ Audit qualité
```

### Par Date:

**Raccourcis pratiques:**
- Aujourd'hui
- 7 derniers jours
- 30 derniers jours
- Mois en cours
- Mois dernier
- Personnalisé (choisir dates)

## 6.4 Filtres des Alertes

**Alertes → Filtrer:**

### Par Sévérité:

**Prioriser les urgences:**
```
Sévérité: CRITIQUE
→ Liste des urgences absolues
→ Traiter en premier
```

**Planifier actions non urgentes:**
```
Sévérité: FAIBLE
→ Actions à faire quand temps disponible
```

### Par Type:

**Focus produits expirés:**
```
Type: EXPIRÉ
→ Retirer ces articles
→ Enregistrer pertes
```

**Gestion expirations:**
```
Type: EXPIRATION PROCHE
→ Utiliser en priorité
→ Informer services
```

## 6.5 Recherche Multi-Critères Avancée

### Exemple 1: Produits expirés avec stock

**Objectif:** Trouver tous les produits expirés qu'il faut retirer

**Méthode:**
```
1. Inventaire
2. Recherche avancée:
   - Filtre: EXPIRÉ
   - Stock > 0
3. Résultat: Liste articles à retirer
```

### Exemple 2: Mouvements d'un article

**Objectif:** Voir tous les mouvements de Paracétamol ce mois

**Méthode:**
```
1. Mouvements
2. Filtres combinés:
   - Recherche: "Paracétamol"
   - Période: Mois en cours
3. Résultat: Historique complet
```

### Exemple 3: Alertes non traitées critiques

**Objectif:** Voir alertes critiques pas encore lues

**Méthode:**
```
1. Alertes
2. Filtres:
   - Sévérité: CRITIQUE
   - Statut: Non lu
3. Résultat: Urgences absolues
```

---

# 7. Exercices Pratiques

## 7.1 Exercice 1: Réception Fournisseur

**Situation:**
Le fournisseur Demo Pharma livre 1000 comprimés d'Amoxicilline 500mg.
Bon de livraison: BL-2024-5678

**À faire:**
1. Se connecter au système
2. Naviguer vers Mouvements
3. Créer nouveau mouvement de type ENTRÉE
4. Rechercher article "Amoxicilline 500mg"
5. Noter le stock AVANT
6. Entrer quantité: 1000
7. Raison: "Réception fournisseur Demo Pharma"
8. Référence: BL-2024-5678
9. Enregistrer
10. Vérifier nouveau stock

**Résultat attendu:**
✅ Stock Amoxicilline augmenté de 1000
✅ Mouvement dans l'historique
✅ Référence BL enregistrée

## 7.2 Exercice 2: Distribution Service

**Situation:**
Le service de cardiologie demande:
- 50 comprimés de Paracétamol 500mg
- 20 boîtes de Gants Latex M
- 10 Masques chirurgicaux (boîtes de 50)

**À faire:**
Pour CHAQUE article:
1. Nouveau mouvement → SORTIE
2. Sélectionner article
3. Vérifier stock disponible
4. Entrer quantité demandée
5. Destination: "Service Cardiologie"
6. Enregistrer

**Résultat attendu:**
✅ 3 mouvements de sortie enregistrés
✅ Stocks mis à jour pour les 3 articles
✅ Traçabilité destination = Cardiologie

## 7.3 Exercice 3: Inventaire Physique

**Situation:**
Inventaire trimestriel de la Pharmacie A1.
Vous comptez physiquement et trouvez:
- Paracétamol: Système dit 4850, vous comptez 4800
- Ibuprofène: Système dit 2800, vous comptez 2800 (OK)

**À faire:**
1. Pour Paracétamol (écart détecté):
   - Nouveau mouvement → AJUSTEMENT
   - Article: Paracétamol 500mg
   - Nouvelle quantité: 4800
   - Raison: "Inventaire physique trimestriel Q4"
   - Notes: "Écart de -50 comprimés. Comptage vérifié 2x."
   - Enregistrer

2. Pour Ibuprofène (pas d'écart):
   - Pas de mouvement nécessaire

**Résultat attendu:**
✅ Stock Paracétamol ajusté (4850 → 4800)
✅ Écart documenté dans notes
✅ Date d'inventaire enregistrée

## 7.4 Exercice 4: Traiter Alerte Critique

**Situation:**
Badge alertes indique 🔔 [20]
Une alerte critique: "Oxygène Médical 15L - Stock épuisé"

**À faire:**
1. Cliquer sur badge alertes
2. Filtrer par sévérité: CRITIQUE
3. Localiser alerte "Oxygène Médical"
4. Cliquer icône œil pour voir détails
5. Noter:
   - Stock minimum requis
   - Dernier fournisseur
   - Consommation moyenne
6. Contacter fournisseur (hors système)
7. Après réception (simulée):
   - Nouveau mouvement → ENTRÉE
   - Article: Oxygène Médical 15L
   - Quantité: 20 bouteilles
   - Référence: BL-URG-2024-999
   - Enregistrer
8. Retour alertes
9. Marquer alerte comme RÉSOLUE

**Résultat attendu:**
✅ Stock oxygène reconstitué
✅ Alerte marquée résolue
✅ Badge diminué (20 → 19)

## 7.5 Exercice 5: Retrait Produit Expiré

**Situation:**
Lors de contrôle qualité, vous trouvez:
- Aspirine 100mg - Lot LOT-ASP-2024-02 - Expiré depuis 5 jours
- Quantité en stock: 450 comprimés
- À retirer et détruire

**À faire:**
1. Vérifier alerte correspondante:
   - Alertes → Filtrer EXPIRÉ
   - Confirmer présence alerte Aspirine

2. Enregistrer retrait:
   - Nouveau mouvement → PÉREMPTION
   - Article: Aspirine 100mg
   - Quantité: 450 comprimés
   - Raison: "Retrait produit expiré"
   - Notes: "Lot LOT-ASP-2024-02 expiré depuis 5 jours. À détruire selon procédure."
   - Enregistrer

3. Résoudre alerte:
   - Retour alertes
   - Marquer comme RÉSOLUE

4. Procédure physique (hors système):
   - Retirer produit du stock
   - Étiqueter "PÉRIMÉ - NE PAS UTILISER"
   - Placer dans zone destruction
   - Organiser destruction sécurisée

**Résultat attendu:**
✅ Stock Aspirine = 0
✅ Mouvement péremption enregistré
✅ Alerte résolue
✅ Traçabilité destruction

## 7.6 Exercice 6: Recherche et Rapport

**Situation:**
Votre superviseur demande:
"Combien de Paracétamol a été distribué ce mois aux services?"

**À faire:**
1. Menu → Mouvements
2. Appliquer filtres:
   - Type: SORTIE
   - Période: Mois en cours
   - Recherche: "Paracétamol"
3. Consulter résultats
4. Additionner quantités distribuées
5. Noter services destinataires
6. Préparer rapport:
   ```
   Rapport Distribution Paracétamol - Novembre 2024

   - 13/11: 38 comprimés → Service Urgences
   - 16/11: 41 comprimés → Service Urgences
   - 20/11: 100 comprimés → Service Pédiatrie
   - 20/11: 50 comprimés → Service Cardiologie (exercice)

   TOTAL: 229 comprimés distribués ce mois
   ```

**Résultat attendu:**
✅ Rapport complet et précis
✅ Tous les mouvements identifiés
✅ Total calculé

---

# 8. Bonnes Pratiques

## 8.1 Saisie des Données

### ✅ FAIRE:

**Être précis et complet:**
```
❌ Mauvais: "Réception"
✅ Bon: "Réception fournisseur Demo Pharma - BL-2024-1234"

❌ Mauvais: "Distribution"
✅ Bon: "Distribution service pédiatrie - Demande Dr. Mukendi"
```

**Toujours indiquer les références:**
- Numéros de bon de livraison (BL)
- Références commandes
- Numéros de lots
- Noms des demandeurs

**Documenter les écarts:**
```
Ajustement inventaire:
❌ Mauvais: "Écart"
✅ Bon: "Inventaire physique Q4-2024. Écart -50 unités détecté.
        Comptage vérifié 2 fois. Possible casse non déclarée."
```

### ❌ NE PAS FAIRE:

- ❌ Saisir des mouvements sans référence
- ❌ Oublier de noter la destination des sorties
- ❌ Négliger les notes pour ajustements
- ❌ Utiliser des abréviations non standard
- ❌ Enregistrer plusieurs jours après le mouvement

## 8.2 Gestion du Stock

### Principes FIFO (First In, First Out)

**Règle:** Utiliser les produits les plus anciens en premier

**Application:**
1. Lors de réception:
   - Placer nouveaux produits DERRIÈRE
   - Anciens produits restent DEVANT

2. Lors de distribution:
   - Toujours prendre DEVANT
   - Vérifier date d'expiration

3. Dans le système:
   - Noter numéro de lot distribué
   - Permet traçabilité parfaite

### Contrôles Réguliers

**Quotidien:**
- ✅ Consulter badge alertes
- ✅ Traiter alertes critiques
- ✅ Enregistrer mouvements du jour

**Hebdomadaire:**
- ✅ Vérifier articles faibles
- ✅ Planifier commandes
- ✅ Contrôler expirations proches

**Mensuel:**
- ✅ Rapport complet des mouvements
- ✅ Analyse consommations
- ✅ Ajuster stocks min/max si besoin

**Trimestriel:**
- ✅ Inventaire physique complet
- ✅ Réconciliation écarts
- ✅ Audit qualité

## 8.3 Sécurité et Confidentialité

### Protection des Accès:

**Votre mot de passe:**
- Ne JAMAIS partager votre mot de passe
- Changer régulièrement (tous les 3 mois)
- Utiliser mot de passe fort
- Ne pas l'écrire sur papier visible

**Session de travail:**
- Se déconnecter en quittant le poste
- Ne pas laisser session ouverte
- Verrouiller écran si absence courte

### Traçabilité:

**Tous vos actions sont enregistrées:**
- Qui a fait le mouvement
- Quand (date + heure exacte)
- Quoi (article, quantité)
- Pourquoi (raison)

**Implications:**
- ✅ Transparence totale
- ✅ Responsabilisation
- ✅ Audit facilité
- ⚠️ Impossibilité de nier une action

## 8.4 Communication

### Avec les Services:

**Lors de distribution:**
- Faire signer bon de sortie papier
- Noter nom et signature demandeur
- Indiquer quantité exacte
- Référencer dans système

**Alertes critiques:**
- Informer services concernés
- "Stock Adrénaline critique - Utiliser avec parcimonie"
- Coordination pour éviter rupture

### Avec les Fournisseurs:

**Lors de réception:**
- Vérifier quantités livrées vs commandées
- Contrôler dates d'expiration
- Signaler anomalies immédiatement
- Enregistrer dans système APRÈS contrôle

**Suivi commandes:**
- Relancer si délai dépassé
- Utiliser système pour suivre besoins
- Planifier à l'avance (délais 15-30 jours)

### Avec la Hiérarchie:

**Rapports réguliers:**
- État du stock (dashboard)
- Alertes non résolues
- Problèmes récurrents
- Propositions d'amélioration

---

# 9. Dépannage et FAQ

## 9.1 Problèmes Courants

### "Je ne peux pas me connecter"

**Solution 1:** Vérifier identifiants
- Email correct?
- Mot de passe correct? (attention majuscules)
- Essayer "Mot de passe oublié"

**Solution 2:** Vérifier connexion internet
- Navigateur charge autres sites?
- WiFi connecté?

**Solution 3:** Contacter support IT
- Compte peut être désactivé
- Réinitialisation nécessaire

### "Le badge alertes ne se met pas à jour"

**Solution:**
- Rafraîchir la page (F5)
- Se déconnecter/reconnecter
- Vider cache navigateur

### "Je ne trouve pas un article dans la recherche"

**Vérifications:**
- Article existe bien dans système?
- Orthographe correcte?
- Essayer chercher par code SKU
- Essayer mots-clés partiels

### "Erreur lors d'enregistrement mouvement"

**Causes possibles:**

**Pour sortie:**
- Stock insuffisant?
- Vérifier quantité disponible
- Peut-être déjà distribué par quelqu'un d'autre

**Pour tous types:**
- Champs obligatoires non remplis?
- Quantité négative?
- Connexion internet perdue?

**Solution:**
1. Vérifier messages d'erreur
2. Corriger informations
3. Réessayer
4. Si persiste: Contacter support

### "Stock incorrect après mouvement"

**Diagnostic:**
1. Consulter historique article
2. Vérifier dernier mouvement enregistré
3. Comparer quantités avant/après

**Si erreur détectée:**
1. NE PAS enregistrer nouveau mouvement pour "corriger"
2. Noter situation (capture écran)
3. Contacter superviseur
4. Enregistrer ajustement avec notes détaillées

## 9.2 Questions Fréquentes (FAQ)

### Général

**Q: Puis-je utiliser le système sur téléphone?**
R: Oui, le système est responsive. Utilisez navigateur mobile.

**Q: Que faire si j'ai oublié mon mot de passe?**
R: Cliquer "Mot de passe oublié" sur page connexion. Email de réinitialisation envoyé.

**Q: Puis-je supprimer un mouvement enregistré par erreur?**
R: Non, pour traçabilité. Enregistrer mouvement inverse avec notes explicatives.

**Q: Comment changer mon mot de passe?**
R: Menu profil (coin droit) → Paramètres → Changer mot de passe

### Inventaire

**Q: Différence entre "Stock minimum" et "Point de réapprovisionnement"?**
R:
- Stock minimum = Seuil d'alerte (ne jamais descendre)
- Point réappro = Quand commander (temps livraison inclus)
- Exemple: Min=100, Réappro=200 (commander à 200 pour ne jamais atteindre 100)

**Q: Puis-je modifier les informations d'un article?**
R: Oui, permissions nécessaires. Voir détails article → Modifier

**Q: Comment savoir qui a créé un article?**
R: Voir détails article → Onglet Informations → Créé par/le

### Mouvements

**Q: J'ai distribué hier mais oublié d'enregistrer. Que faire?**
R: Enregistrer aujourd'hui avec notes: "Distribution du [date] - Enregistrement tardif car..."

**Q: Puis-je enregistrer mouvement pour date passée?**
R: Oui mais déconseillé. Toujours enregistrer immédiatement.

**Q: Que mettre dans "Référence" pour une sortie?**
R: Numéro bon de sortie interne, nom demandeur, ou "N/A" si aucune référence.

**Q: Comment annuler un mouvement enregistré par erreur?**
R: Créer mouvement inverse avec notes explicatives. Exemple:
```
Mouvement original: SORTIE -100 Paracétamol
Annulation: ENTRÉE +100 Paracétamol
Notes: "Annulation sortie du [date] - Erreur de saisie"
```

### Alertes

**Q: Différence entre "Marquer lu" et "Marquer résolu"?**
R:
- **Lu** = J'ai vu l'alerte, en cours de traitement
- **Résolu** = Problème corrigé, alerte inactive

**Q: Une alerte réapparaît après que je l'ai résolue. Pourquoi?**
R: Situation pas vraiment corrigée. Exemples:
- Stock toujours en dessous minimum
- Produit toujours expiré
→ Prendre action réelle pour corriger situation

**Q: Puis-je désactiver certaines alertes?**
R: Non, toutes alertes importantes. Si trop nombreuses, revoir stocks min/max.

**Q: Les alertes sont-elles envoyées par email?**
R: Selon configuration système. Vérifier avec admin IT.

### Rapports

**Q: Comment exporter des données vers Excel?**
R: Bouton "Exporter" disponible sur pages Inventaire et Mouvements.

**Q: Puis-je créer un rapport personnalisé?**
R: Utiliser filtres pour affiner données, puis exporter.

**Q: Comment voir consommation mensuelle d'un article?**
R: Mouvements → Filtrer: Type SORTIE, Article spécifique, Période mois → Additionner quantités.

## 9.3 Contacts Support

### Support Technique (Problèmes système)
- **Email:** support-it@hopital.cd
- **Téléphone:** +243 XXX XXX XXX
- **Heures:** Lundi-Vendredi 8h-17h

### Support Logistique (Questions fonctionnelles)
- **Superviseur:** Jean Kabamba
- **Email:** j.kabamba@hopital.cd
- **Bureau:** Bâtiment Admin, 2ème étage

### Urgences (Stock critique, rupture)
- **Astreinte:** +243 YYY YYY YYY
- **Disponibilité:** 24/7

---

# 📋 Annexes

## Annexe A: Glossaire

**Termes techniques expliqués:**

- **SKU (Stock Keeping Unit):** Code unique identifiant article dans système
- **FIFO (First In, First Out):** Utiliser produits les plus anciens d'abord
- **BL (Bon de Livraison):** Document fournisseur prouvant livraison
- **RLS (Row Level Security):** Sécurité qui contrôle qui peut voir quoi
- **KPI (Key Performance Indicator):** Indicateur clé de performance
- **Dashboard:** Tableau de bord, vue d'ensemble
- **Badge:** Petite notification numérotée (ex: 🔔 [20])
- **Traçabilité:** Capacité à suivre historique complet
- **Péremption:** Expiration d'un produit
- **Surstock:** Quantité excessive en stock

## Annexe B: Raccourcis Clavier

**Navigation rapide:**
- `Ctrl + K`: Ouvrir recherche rapide
- `F5`: Rafraîchir page
- `Ctrl + F`: Rechercher dans page
- `Échap`: Fermer modal/popup

## Annexe C: Codes Couleur

**Statuts Stock:**
- 🟢 Vert = NORMAL
- 🟡 Jaune = FAIBLE
- 🟠 Orange = CRITIQUE
- 🔴 Rouge = ÉPUISÉ
- ⚰️ Gris = EXPIRÉ
- 🔵 Bleu = SURSTOCK

**Sévérité Alertes:**
- 🔴 Rouge = CRITIQUE (Action immédiate)
- 🟠 Orange = ÉLEVÉE (Action < 7 jours)
- 🟡 Jaune = MOYENNE (Action < 30 jours)
- 🔵 Bleu = FAIBLE (À surveiller)

## Annexe D: Checklist Quotidienne

**Début de service (8h00):**
- [ ] Se connecter au système
- [ ] Consulter badge alertes
- [ ] Filtrer alertes CRITIQUES
- [ ] Prioriser actions urgentes
- [ ] Vérifier stock articles critiques
- [ ] Planifier commandes nécessaires

**Durant le service:**
- [ ] Enregistrer chaque mouvement IMMÉDIATEMENT
- [ ] Vérifier quantités avant distribution
- [ ] Documenter toutes références
- [ ] Contrôler dates expiration

**Fin de service (17h00):**
- [ ] Vérifier tous mouvements enregistrés
- [ ] Consulter badge alertes final
- [ ] Marquer alertes traitées
- [ ] Préparer liste commandes
- [ ] Se déconnecter

## Annexe E: Formulaire Rapport Incident

**En cas de problème système:**

```
RAPPORT INCIDENT SYSTÈME LOGISTIQUE

Date: __/__/____
Heure: __:__
Utilisateur: ________________
Email: ________________

Type de problème:
[ ] Connexion impossible
[ ] Erreur enregistrement mouvement
[ ] Données incorrectes
[ ] Performance lente
[ ] Autre: __________________

Description détaillée:
_________________________________
_________________________________
_________________________________

Étapes pour reproduire:
1. _____________________________
2. _____________________________
3. _____________________________

Message d'erreur (si affiché):
_________________________________

Capture d'écran attachée: [ ] Oui [ ] Non

Envoyé à: support-it@hopital.cd
```

---

# 🎓 Certification

**Félicitations!**

Si vous avez complété cette formation et réussi les exercices pratiques, vous êtes maintenant certifié pour utiliser le système de gestion logistique.

**Compétences acquises:**
✅ Navigation interface complète
✅ Consultation stock temps réel
✅ Enregistrement mouvements
✅ Traitement alertes
✅ Recherche et filtres avancés
✅ Consultation historique
✅ Bonnes pratiques logistique

**Prochaines étapes:**
1. Pratiquer quotidiennement
2. Consulter ce guide en cas de doute
3. Partager bonnes pratiques avec collègues
4. Proposer améliorations au superviseur

---

**Bonne utilisation du système!**

*Version: 1.0 - Novembre 2024*
*Document confidentiel - Usage interne uniquement*
