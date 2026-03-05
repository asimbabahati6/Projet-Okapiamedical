# 🚀 Guide de Démarrage Rapide - Okapi Medical ERP v1.0

## 📋 Prérequis

1. Node.js installé (v18+)
2. npm ou yarn
3. Navigateur moderne (Chrome, Firefox, Edge)

---

## ⚡ Installation & Lancement

```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev

# Build pour production
npm run build
```

L'application sera accessible sur : `http://localhost:5173`

---

## 🔑 Connexion & Test des Rôles

### Mode Simulation de Rôle

1. **Connectez-vous** avec votre compte
2. **Ouvrez la sidebar** (menu gauche)
3. **En haut de la sidebar**, vous verrez le "Simulateur de Rôle"
4. **Cliquez sur le toggle** pour activer le mode simulation
5. **Sélectionnez un rôle** dans le dropdown pour tester la vue

**Rôles disponibles** :
- 👑 Administrateur (accès complet)
- 🩺 Médecin (pôle médical)
- 🏢 Administratif/RH (personnel & paie)
- 💰 Comptable (finances & taux de change)
- 📦 Logisticien (stocks & fournisseurs)
- 🔔 Réceptionniste (accueil patients)
- 🔬 Laboratoire (analyses)
- 💊 Pharmacien (médicaments)

---

## 🎯 Tests Rapides par Module

### 1️⃣ Gestion des Patients

**Route** : `/staff/patients`

**Test** :
1. Voir la liste des patients
2. Cliquer sur "Voir" pour afficher la fiche patient
3. Dans la fiche, cliquer sur "Exporter PDF"
4. Vérifier que le PDF contient :
   - ✅ En-tête Okapi Medical
   - ✅ Informations personnelles
   - ✅ Allergies en rouge
   - ✅ Historique médical

**Export Excel** :
1. Depuis la liste, cliquer sur "Export Excel"
2. Vérifier que le fichier `patients_okapi_medical_YYYY-MM-DD.xlsx` se télécharge

---

### 2️⃣ Personnel Médical (10 Docteurs)

**Route** : `/staff/doctors-dashboard`

**Vérification** :
- ✅ Dr. Jean Mukendi - Cardiologie
- ✅ Dr. Marie Kapinga - Gynécologie
- ✅ Dr. Joseph Kabila - Pédiatrie
- ✅ Dr. Christine Ngandu - Médecine Générale
- ✅ Dr. Paul Tshisekedi - Chirurgie
- ✅ Dr. Grace Mbuyi - Dermatologie
- ✅ Dr. Patrick Lumumba - Neurologie
- ✅ Dr. Sophie Kanyinda - Ophtalmologie
- ✅ Dr. Emmanuel Ngoy - Orthopédie
- ✅ Dr. Cecile Mulamba - Radiologie

---

### 3️⃣ Bons de Commande (Logistique)

**Route** : `/staff/purchase-orders`

**Test** :
1. Voir la liste des BCs de démonstration
2. Cliquer sur "PDF" pour télécharger un BC
3. Vérifier le PDF :
   - ✅ En-tête branding Okapi Medical
   - ✅ N° BC (ex: BC-2024-001)
   - ✅ Informations fournisseur
   - ✅ Tableau des articles
   - ✅ Sous-total / TVA / Total
   - ✅ Zones de signature

**BCs de Démonstration** :
- BC-2024-001 : MediSupply RDC (Status: Envoyé)
- BC-2024-002 : Pharma Congo (Status: Brouillon)
- BC-2024-003 : LabEquip International (Status: Reçu)

---

### 4️⃣ Facturation

**Route** : `/staff/billing`

**Test Génération de Facture** :
1. Créer une nouvelle facture
2. Ajouter des actes médicaux
3. Changer le statut en "Payé"
4. Télécharger le PDF
5. Vérifier :
   - ✅ En-tête Okapi Medical
   - ✅ N° Facture unique
   - ✅ Badge "PAYÉE" coloré
   - ✅ Tableau des actes
   - ✅ **Filigrane "PAYÉ" en diagonal** (si status = paid)
   - ✅ Mode et date de paiement

---

### 5️⃣ Alertes de Stocks

**Route** : `/staff/logistics`

**Test des Badges** :
1. Voir la liste des articles en stock
2. Vérifier les badges de couleur :
   - 🔴 **Rouge** : Stock = 0 (Rupture de Stock)
   - 🟠 **Orange** : Stock ≤ Minimum (Stock Bas)
   - 🟡 **Jaune** : Péremption ≤ 30 jours (Expire dans Xj)
   - 🟢 **Vert** : Stock OK

**Badges avec Animation** :
- Badge rouge/orange ont une animation `pulse`
- Icônes AlertCircle et AlertTriangle

---

### 6️⃣ Widget Taux de Change

**Accessible par** : Admin, Comptable

**Localisation** : En bas de la sidebar

**Vérification** :
- ✅ Badge "Live" animé (pulse)
- ✅ USD/CDF : 2,850 FC
- ✅ EUR/CDF : 3,120 FC
- ✅ Bouton "Mettre à jour les taux"
- ✅ Gradient vert
- ✅ Icône TrendingUp

**Test** :
1. Se connecter en tant qu'Admin ou Comptable
2. Ouvrir la sidebar
3. Scroller tout en bas
4. Vérifier que le widget est visible

---

## 🧪 Scénarios de Test Complets

### Scénario 1 : Médecin consulte un patient

1. **Se connecter** en tant que Médecin (ou utiliser le simulateur)
2. **Naviguer** vers "Gestion des Patients"
3. **Ouvrir** une fiche patient
4. **Vérifier** :
   - Allergies affichées en rouge
   - Historique médical complet
   - Consultations précédentes
5. **Exporter** la fiche en PDF
6. **Créer** une nouvelle consultation
7. **Prescrire** des médicaments

### Scénario 2 : Logisticien passe une commande

1. **Se connecter** en tant que Logisticien
2. **Naviguer** vers "Logistique & Stocks"
3. **Vérifier** les alertes de stock bas (badges rouges/orange)
4. **Naviguer** vers "Bons de Commande"
5. **Télécharger** un BC de démonstration en PDF
6. **Vérifier** que le PDF contient toutes les informations

### Scénario 3 : Comptable génère une facture

1. **Se connecter** en tant que Comptable
2. **Naviguer** vers "Facturation"
3. **Créer** une nouvelle facture pour un patient
4. **Ajouter** plusieurs actes médicaux
5. **Marquer** la facture comme "Payée"
6. **Télécharger** le PDF
7. **Vérifier** le filigrane "PAYÉ" en diagonal
8. **Consulter** le widget "Taux de Change" en bas de la sidebar

### Scénario 4 : Admin supervise le système

1. **Se connecter** en tant qu'Admin
2. **Activer** le mode simulation de rôle
3. **Tester** chaque rôle un par un :
   - Médecin → Voir le pôle médical
   - Logisticien → Voir les stocks & BCs
   - Comptable → Voir la facturation & taux de change
4. **Désactiver** le mode simulation
5. **Revenir** à la vue Admin complète

---

## 📊 Export de Données

### Export Patients (Excel)

```typescript
import { AdvancedDocumentGenerator } from './services/advancedDocumentGenerator';

// Liste de patients
const patients = await fetchPatients();

// Export Excel
AdvancedDocumentGenerator.exportPatientsToExcel(patients);

// Fichier téléchargé : patients_okapi_medical_2024-02-14.xlsx
```

### Export Recettes (Excel)

```typescript
import { AdvancedDocumentGenerator } from './services/advancedDocumentGenerator';

// Données de recettes mensuelles
const revenueData = [
  { month: 'Janvier 2024', revenue: 15000, expenses: 8000, invoice_count: 120, collection_rate: 85 },
  { month: 'Février 2024', revenue: 18000, expenses: 9000, invoice_count: 145, collection_rate: 90 }
];

// Export Excel
AdvancedDocumentGenerator.exportRevenueToExcel(revenueData);

// Fichier téléchargé : recettes_okapi_medical_2024-02-14.xlsx
```

---

## ✅ Checklist de Validation

### Installation
- [ ] `npm install` réussi
- [ ] `npm run dev` démarre sans erreur
- [ ] Application accessible sur `http://localhost:5173`

### RBAC
- [ ] Simulateur de rôle fonctionne
- [ ] Menus filtrés correctement par rôle
- [ ] Widget taux de change visible pour Admin/Comptable

### Documents PDF
- [ ] Fiche patient générée avec branding
- [ ] Facture avec filigrane "PAYÉ"
- [ ] Bon de commande avec signatures

### Exports Excel
- [ ] Export patients réussi
- [ ] Export recettes réussi

### Alertes Stocks
- [ ] Badge rouge pour rupture
- [ ] Badge orange pour stock bas
- [ ] Badge jaune pour péremption proche
- [ ] Badge vert pour stock OK

### Personnel
- [ ] 10 médecins fictifs visibles
- [ ] Répartis par services

---

**🎉 Félicitations ! Vous avez complété le guide de démarrage rapide.**

**Pour aller plus loin, consultez la documentation complète dans `OKAPI_MEDICAL_ERP_V1_DOCUMENTATION.md`**

---

**Version 1.0.0 - Février 2024**
**© Okapi Medical - Tous droits réservés**
