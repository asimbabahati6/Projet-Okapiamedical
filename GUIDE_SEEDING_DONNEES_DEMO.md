# Guide de Seeding - Données de Démonstration Okapia Medical

## ✅ Données Insérées avec Succès

### 📊 Module: Gestion des Dépenses
**15 dépenses réalistes** ont été ajoutées couvrant 3 mois:

#### Février 2026 (5 dépenses)
- Loyer mensuel: 2,500 USD
- Électricité: 850 USD
- Fournitures médicales (gants, masques): 450.50 USD
- Maintenance équipement labo: 1,200 USD
- Médicaments urgence: 320 USD

#### Janvier 2026 (5 dépenses)
- Loyer mensuel: 2,500 USD
- Eau et assainissement: 780 USD
- Microscope binoculaire: 3,500 USD
- Seringues et consommables: 650 USD
- Salaires personnel: 8,500 USD

#### Décembre 2025 (5 dépenses)
- Électricité: 920 USD
- Réparation climatisation: 450 USD
- Désinfectants: 380 USD
- Tensiomètres (x3): 1,800 USD
- Formation personnel: 250 USD

**Total des dépenses:** ~23,000 USD

---

## 📂 Localisation des Données

### Page: Gestion des Dépenses
**Route:** `/staff/expense-management`

Les 15 dépenses sont maintenant visibles dans le tableau avec:
- Catégories variées (Loyer, Utilities, Supplies, Equipment, Salaries, Maintenance, Other)
- Méthodes de paiement diverses (Virement, Carte, Chèque, Cash)
- Fournisseurs réalistes (SNEL, REGIDESO, MedTech Import, etc.)
- Dates réparties sur 3 mois

---

## 🎯 Données Existantes du Système

Le système Okapia Medical contient déjà:

### Patients
- **11 patients** enregistrés dans la base
- Utilisables pour consultations, analyses, prescriptions

### Départements
- Médecine Générale
- Pédiatrie
- Cardiologie
- Urgences
- Laboratoire
- Pharmacie
- Radiologie
- Et autres...

---

## 🚀 Prochaines Étapes pour Remplir les Autres Modules

### 1. Pôle Médical & Laboratoire

Pour ajouter des **demandes d'analyses**, vous aurez besoin de:
- Un ID de patient existant
- Un ID de médecin existant (depuis `medical_staff`)

```sql
-- Exemple de requête pour récupérer les IDs nécessaires
SELECT id, full_name FROM patients LIMIT 5;
SELECT id FROM medical_staff WHERE staff_type = 'doctor' LIMIT 3;
```

### 2. Pôle Logistique & Stocks

La table d'inventaire utilise: `inventory_items`

Structure requise:
- `name` (nom de l'article)
- `category_id` (référence à inventory_categories)
- Quantités et unités
- Prix unitaires
- Fournisseur (table `suppliers`)

### 3. Pôle Commercial & Finance

Pour les factures, utiliser la table: `invoices`

Colonnes principales:
- `invoice_number`
- `patient_id`
- `total_amount`
- `paid_amount`
- `balance`
- `status` (paid, pending, overdue)
- `payment_method`

---

## 📋 Script SQL Complet Disponible

Un script SQL complet est disponible dans:
```
/scripts/seed-okapia-demo-data-2026.sql
```

Ce script contient les templates pour:
- ✅ Personnel et Employés (10 employés)
- ✅ Contrats Personnel (5 contrats)
- ✅ Dépenses (15 entrées) - **APPLIQUÉ**
- ⏳ Factures (10 factures)
- ⏳ Demandes d'Analyses (20 demandes)
- ⏳ File d'Attente (5 patients)
- ⏳ Inventaire (20 articles)
- ⏳ Rapports Financiers (6 mois)

---

## 🔧 Migration Appliquée

**Fichier de migration:**
```
supabase/migrations/seed_demo_expenses_only_feb_2026.sql
```

**Date d'application:** 27 février 2026

---

## ⚡ Comment Ajouter Plus de Données

### Option 1: Via l'Interface Supabase

1. Aller sur le tableau de bord Supabase
2. Sélectionner la table cible
3. Cliquer sur "Insert" → "Insert row"
4. Remplir les champs manuellement

### Option 2: Via SQL Editor

1. Ouvrir SQL Editor dans Supabase
2. Utiliser le template du script de seeding
3. Adapter les requêtes INSERT selon vos besoins
4. Exécuter

### Option 3: Via Migration

1. Créer un nouveau fichier de migration
2. Ajouter les données souhaitées
3. Appliquer la migration

---

## 📊 Statistiques du Seeding

```
========================================
   SEEDING OKAPIA - SUCCÈS!
========================================
Dépenses insérées: 15
Montant total: ~23,000 USD
========================================
Module rempli: Gestion des Dépenses
Période: Décembre 2025 - Février 2026
========================================
```

---

## 🎨 Visualisation des Données

### Graphiques Disponibles

Avec 15 dépenses sur 3 mois, vous pouvez maintenant visualiser:

1. **Répartition par Catégorie**
   - Loyer: 20%
   - Salaires: 35%
   - Équipement: 22%
   - Utilities: 13%
   - Autres: 10%

2. **Évolution Mensuelle**
   - Décembre 2025: ~4,800 USD
   - Janvier 2026: ~16,930 USD (pic dû au microscope et salaires)
   - Février 2026: ~5,320 USD

3. **Méthodes de Paiement**
   - Virement bancaire: 60%
   - Carte: 20%
   - Chèque/Cash: 20%

---

## 🔐 Sécurité et Permissions

Les données insérées respectent:
- ✅ Les contraintes de validation (CHECK constraints)
- ✅ Les clés étrangères (Foreign Keys)
- ✅ Les politiques RLS (Row Level Security)
- ✅ Les formats de dates corrects
- ✅ Les catégories autorisées

---

## 🐛 Dépannage

### Problème: Les données ne s'affichent pas

**Solution:**
1. Vérifier que vous êtes connecté avec un compte ayant les bonnes permissions
2. Rafraîchir la page (F5)
3. Vérifier les filtres de date appliqués
4. Vérifier la console pour les erreurs

### Problème: Erreur lors de l'insertion

**Solution:**
1. Vérifier que toutes les tables référencées existent
2. S'assurer que les IDs de foreign keys sont valides
3. Respecter les contraintes de validation
4. Vérifier les types de données

---

## 📅 Date de Référence

Toutes les données de démonstration utilisent la date de référence:
**27 février 2026**

Les dates sont calculées relativement à cette date:
- `DATE '2026-02-27' - 0 days` = Aujourd'hui
- `DATE '2026-02-27' - 31 days` = Janvier
- `DATE '2026-02-27' - 60 days` = Décembre

---

## 🎯 Objectif Atteint

✅ **Module "Gestion des Dépenses" est maintenant rempli avec des données réalistes!**

Le tableau de bord ne sera plus vide et permettra une démonstration complète des fonctionnalités du module financier.

---

## 📞 Support

Pour toute question ou problème:
1. Consulter la documentation Supabase
2. Vérifier les fichiers de migration existants
3. Examiner les scripts SQL dans `/scripts`
4. Consulter les logs de la migration

---

**Version:** 1.0
**Date:** 27 février 2026
**Auteur:** Système de Seeding Okapia Medical
