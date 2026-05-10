# Okapi Medical ERP v1.0 - Documentation Complète

## 🏥 Vue d'Ensemble

**Okapi Medical ERP** est une application de gestion hospitalière complète (ERP) développée pour www.okapiamedical.com. Le système intègre la gestion des rôles (RBAC), la facturation, la logistique, et les dossiers patients dans une interface professionnelle et intuitive.

---

## 🎯 Architecture Globale

### Stack Technique
- **Frontend** : React 18.3 + TypeScript
- **Styling** : Tailwind CSS 3.4
- **Icônes** : Lucide React
- **Animations** : Framer Motion (planifié)
- **PDF** : jsPDF + jspdf-autotable
- **Excel** : xlsx
- **Base de données** : Supabase
- **UI Components** : Custom (inspiré Shadcn/UI)

### Design System
- **Couleurs principales** :
  - Bleu médical profond : `#0066CC`
  - Blanc : `#FFFFFF`
  - Gris technique : `#6B7280`
- **Thème** : Professionnel, épuré, aux couleurs de la marque
- **Responsive** : Support mobile, tablette, desktop

---

## 👥 Système de Rôles (RBAC)

### 1. ADMIN (Administrateur)
**Accès** : Total - tous les modules
**Description** : Gestion complète du système, configuration, supervision

### 2. MÉDECIN (Doctor)
**Accès** : Pôle Médical + Rendez-vous
**Modules** :
- Gestion des Patients
- Rendez-vous
- Consultations
- Ordonnances
- Laboratoire (consultation/prescription)
- Pharmacie (consultation)

### 3. ADMINISTRATIF/RH (Administrative)
**Accès** : Personnel Admin, Services Généraux, Paie
**Modules** :
- Personnel Administratif
- Ressources Humaines
- Annuaire du Personnel
- Planning des Équipes
- Gestion des Pauses
- Réception & Accueil

### 4. COMPTABLE (Accountant)
**Accès** : Facturation, Assurances, Taux de Change
**Modules** :
- Facturation
- Analyses Financières
- Contrats
- Assurances
- Paie (complète)
- Taux de Change (widget dynamique)

### 5. LOGISTICIEN (Logistician)
**Accès** : Stocks, Fournisseurs, Transports, Installations
**Modules** :
- Logistique & Stocks
- Fournisseurs
- Transport
- Installations
- Bons de Commande (BC)

### 6. RÉCEPTIONNISTE (Receptionist)
**Accès** : Réception + Gestion Patients basique
**Modules** :
- Gestion des Patients (lecture + création)
- Rendez-vous (consultation + création)
- Réception & Accueil (check-in)

### 7. LABORATOIRE (Laboratory)
**Accès** : Module Laboratoire complet
**Modules** :
- Gestion des analyses
- Résultats d'examens
- Équipement labo

### 8. PHARMACIEN (Pharmacist)
**Accès** : Module Pharmacie complet
**Modules** :
- Pharmacie (dispensation)
- Stock Pharmacie
- Inventaire médicaments

---

## 📋 Structure des Menus

### 🏠 TABLEAU DE BORD & RDV
- Vue globale des statistiques
- Calendrier de prise de rendez-vous
- Indicateurs de performance

### 🏥 PÔLE MÉDICAL

#### Gestion des Patients
**Fiche Patient Complète** :
- **Informations personnelles** :
  - Nom, Prénom
  - Sexe
  - Groupe Sanguin
  - Téléphone
  - Email
  - Date de Naissance
  - Adresse

- **Historique Médical** :
  - Liste des consultations
  - Allergies (affichage en rouge avec icône alerte)
  - Antécédents médicaux
  - Traitements en cours

- **Actions disponibles** :
  - Export PDF complet de la fiche patient
  - Export Excel de la liste des patients
  - Impression de la fiche

#### Personnel Médical
**Liste de 10 Docteurs Fictifs** :

1. **Dr. Jean Mukendi** - Cardiologie
2. **Dr. Marie Kapinga** - Gynécologie
3. **Dr. Joseph Kabila** - Pédiatrie
4. **Dr. Christine Ngandu** - Médecine Générale
5. **Dr. Paul Tshisekedi** - Chirurgie
6. **Dr. Grace Mbuyi** - Dermatologie
7. **Dr. Patrick Lumumba** - Neurologie
8. **Dr. Sophie Kanyinda** - Ophtalmologie
9. **Dr. Emmanuel Ngoy** - Orthopédie
10. **Dr. Cecile Mulamba** - Radiologie

Chaque docteur est réparti par service avec :
- Spécialité
- Horaires de consultation
- Disponibilité
- Nombre de patients suivis

#### Services Médicaux
- **Laboratoire** : Analyses, résultats, équipement
- **Pharmacie** : Inventaire, dispensation, stock
- **Imagerie** : Radiologie, échographie (planifié)

---

### 🏢 PÔLE ADMINISTRATIF

#### Personnel Admin
- Gestion des employés administratifs
- Contrats de travail
- Évaluations de performance

#### Ressources Humaines
- **Annuaire du Personnel** : Liste complète du staff
- **Planning des Équipes** : Gestion des horaires
- **Gestion des Pauses** : Suivi des temps de pause

#### Services Généraux
- Réception & Accueil
- Maintenance
- Sécurité

---

### 📦 PÔLE LOGISTIQUE

#### Logistique & Stocks
**Système d'Alertes Automatiques** :

- **🔴 Badge Rouge - Rupture de Stock** :
  ```
  Stock = 0
  → Alerte "Rupture de Stock" avec icône AlertCircle
  → Animation pulse
  ```

- **🟠 Badge Orange - Stock Bas** :
  ```
  Stock ≤ Minimum
  → Alerte "Stock Bas (X unités)"
  → Animation pulse
  ```

- **🟡 Badge Jaune - Péremption Proche** :
  ```
  Date péremption ≤ 30 jours
  → Alerte "Expire dans X jours"
  → Icône AlertTriangle
  ```

- **🟢 Badge Vert - Stock OK** :
  ```
  Stock > Minimum & Péremption > 30j
  → Badge "Stock OK" avec CheckCircle
  ```

#### Fournisseurs
- Liste des fournisseurs
- Contacts
- Historique des commandes
- Évaluation des fournisseurs

#### Transport
- Gestion des véhicules
- Planning des transports
- Maintenance des véhicules

#### Installations
- Gestion des bâtiments
- Maintenance des installations
- Planning des interventions

#### Bons de Commande (BC)
**Générateur de PDF Professionnel** :

**Contenu du BC** :
- En-tête Okapi Medical (branding complet)
- N° BC unique (ex: BC-2024-001)
- Informations fournisseur
- Date de commande
- Date de livraison souhaitée
- Tableau détaillé des articles :
  - Nom de l'article
  - Quantité
  - Prix unitaire
  - Total
- Sous-total
- TVA (calculée automatiquement)
- Total général
- Notes/Instructions
- Signatures :
  - Préparé par (Logisticien)
  - Approuvé par (Directeur)

**Statuts des BC** :
- 🔘 **Brouillon** : En cours de préparation
- 🔵 **Envoyé** : Envoyé au fournisseur
- 🟢 **Reçu** : Livraison reçue et validée
- 🔴 **Annulé** : Commande annulée

---

### 💰 PÔLE COMMERCIAL & FINANCE

#### Facturation
**Création d'Actes** :
- Type de prestation
- Prix unitaire
- Quantité
- Calcul automatique de la TVA
- Total TTC

**Statuts** :
- ✅ **Payé** : Facture réglée (filigrane "PAYÉ" sur le PDF)
- ⏳ **En attente** : En attente de paiement
- ⚠️ **En retard** : Dépassement du délai

**Génération de Facture PDF** :
- En-tête Okapi Medical avec branding
- N° Facture unique
- Date d'émission
- Informations patient
- Tableau détaillé des actes
- Sous-total / TVA / Total
- Mode de paiement (si payé)
- Date de paiement (si payé)
- **Filigrane "PAYÉ"** en diagonal (si status = payé)
- Pied de page avec coordonnées

#### Analyses Financières
- Graphiques de revenus mensuels
- Taux de recouvrement
- Statistiques de facturation
- Prévisions financières

#### Contrats
- Gestion des contrats
- Renouvellements
- Alertes d'expiration

#### Assurances
- Partenariats assurance
- Gestion des remboursements
- Suivi des dossiers

#### Paie
- Bulletins de salaire
- Calculs automatiques
- Historique des paiements

#### Taux de Change (Widget)
**Widget Dynamique en Bas de Sidebar** :
```
🟢 Live
USD/CDF : 2,850 FC
EUR/CDF : 3,120 FC
[Mettre à jour les taux]
```
- Gradient vert
- Badge "Live" animé (pulse)
- Icône TrendingUp
- Bouton de mise à jour

---

## 📄 Générateur de Documents Avancé

### Service : `AdvancedDocumentGenerator`

#### 1. Fiche Patient (PDF)
```typescript
AdvancedDocumentGenerator.generatePatientFile(patient)
```

**Contenu** :
- En-tête branding Okapi Medical
- Informations personnelles complètes
- Allergies (en rouge avec alertes)
- Historique médical (tableau)
- Consultations récentes (tableau)
- Pied de page avec coordonnées

**Utilisation** :
```typescript
const doc = AdvancedDocumentGenerator.generatePatientFile(patientData);
doc.save('fiche_patient.pdf');
```

#### 2. Facture (PDF)
```typescript
AdvancedDocumentGenerator.generateInvoice(invoice)
```

**Contenu** :
- En-tête branding
- N° Facture + Date
- Informations patient
- Badge de statut (coloré)
- Tableau des actes
- Sous-total / TVA / Total
- Filigrane "PAYÉ" (si status = paid)
- Mode et date de paiement
- Pied de page

**Utilisation** :
```typescript
const doc = AdvancedDocumentGenerator.generateInvoice(invoiceData);
doc.save(`facture_${invoice.invoice_number}.pdf`);
```

#### 3. Bon de Commande (PDF)
```typescript
AdvancedDocumentGenerator.generatePurchaseOrder(po)
```

**Contenu** :
- En-tête branding Okapi Medical
- N° BC + Date
- Informations fournisseur
- Date de livraison souhaitée
- Tableau des articles
- Sous-total / TVA / Total
- Notes/Instructions
- Zones de signature (Préparé par / Approuvé par)
- Pied de page

**Utilisation** :
```typescript
const doc = AdvancedDocumentGenerator.generatePurchaseOrder(poData);
doc.save(`BC_${po.po_number}.pdf`);
```

#### 4. Export Patients (Excel)
```typescript
AdvancedDocumentGenerator.exportPatientsToExcel(patients)
```

**Colonnes** :
- ID
- Nom Complet
- Sexe
- Date de Naissance
- Groupe Sanguin
- Téléphone
- Email
- Adresse

**Nom de fichier** : `patients_okapi_medical_YYYY-MM-DD.xlsx`

#### 5. Export Recettes (Excel)
```typescript
AdvancedDocumentGenerator.exportRevenueToExcel(revenueData)
```

**Colonnes** :
- Mois
- Recettes ($)
- Dépenses ($)
- Bénéfice ($)
- Nombre de Factures
- Taux de Recouvrement (%)

**Nom de fichier** : `recettes_okapi_medical_YYYY-MM-DD.xlsx`

---

## 🎨 Design & Interface

### Branding Okapi Medical

#### Couleurs
- **Primaire** : `#0066CC` (Bleu médical)
- **Secondaire** : `#FFFFFF` (Blanc)
- **Texte** : `#1F2937` (Gris foncé)
- **Bordures** : `#E5E7EB` (Gris clair)

#### Typographie
- **Titres** : Helvetica Bold
- **Corps** : Helvetica Normal
- **Taille H1** : 24px
- **Taille H2** : 16px
- **Taille Body** : 10-12px

#### Composants

**Badges de Statut** :
```tsx
// Rupture de stock
<Badge color="red" icon={AlertCircle}>Rupture de Stock</Badge>

// Stock bas
<Badge color="orange" icon={AlertTriangle} pulse>Stock Bas (5)</Badge>

// Péremption proche
<Badge color="yellow" icon={AlertTriangle}>Expire dans 15j</Badge>

// Stock OK
<Badge color="green" icon={CheckCircle}>Stock OK</Badge>
```

**Accordéons de Menu** :
- Chevron Down ▼ / Chevron Right ►
- Animation de transition 300ms
- Bordures colorées par pôle :
  - Bleu : Médical
  - Violet : Administratif
  - Vert : Commercial
  - Orange : Logistique

**Cartes (Cards)** :
- Shadow : `shadow-sm` ou `shadow-lg`
- Bordure : `border border-gray-200`
- Arrondis : `rounded-xl`
- Padding : `p-6`

### Mode Sombre/Clair
- Toggle disponible dans le profil utilisateur
- Support complet des deux thèmes
- Transition fluide entre les modes

---

## 🔐 Sécurité & Permissions

### Système RBAC

**Vérification d'accès** :
```typescript
hasAccess(userRole, menuItem) → boolean
```

**Filtrage du menu** :
```typescript
filterMenuByRole(menu, userRole) → MenuItem[]
```

**Vérification de permission** :
```typescript
hasPermission(permission) → boolean
```

### Masquage UI
- Menus non autorisés **invisibles**
- Icône cadenas 🔒 pour modules verrouillés
- Redirections automatiques si accès non autorisé

### Mode Simulation (Développement)
- Sélecteur de rôle en haut de la sidebar
- Permet de tester chaque profil
- Toggle ON/OFF
- Badge visuel du rôle actif

---

## 📱 Responsive Design

### Breakpoints
- **Mobile** : < 640px
- **Tablet** : 640px - 1024px
- **Desktop** : > 1024px

### Adaptations
- Sidebar collapsible sur mobile
- Tableaux avec scroll horizontal
- Cartes empilées verticalement sur mobile
- Menu burger sur petits écrans

---

## 🚀 Fonctionnalités Avancées

### 1. Export Multi-Format
- PDF avec branding
- Excel pour analyses
- Impression directe

### 2. Alertes Intelligentes
- Stocks bas (automatique)
- Péremption proche (30 jours)
- Factures en retard
- Rendez-vous à venir

### 3. Recherche & Filtres
- Recherche globale
- Filtres par statut
- Filtres par date
- Filtres par catégorie

### 4. Statistiques & Dashboards
- KPIs en temps réel
- Graphiques interactifs (planifié)
- Tableaux de bord personnalisés par rôle

---

## 📂 Architecture du Code

```
src/
├── components/
│   ├── layout/
│   │   └── RBACNavigation.tsx          # Navigation avec RBAC
│   ├── logistics/
│   │   ├── StockAlertBadge.tsx         # Badges d'alerte stocks
│   │   └── ...                          # Autres composants logistique
│   ├── patient/
│   │   └── ...                          # Composants patients
│   └── ...
├── config/
│   └── rbac.ts                          # Configuration RBAC
├── contexts/
│   ├── AuthContext.tsx                  # Authentification
│   ├── RBACContext.tsx                  # Gestion des rôles
│   └── ...
├── pages/
│   └── staff/
│       ├── Dashboard.tsx                 # Tableau de bord
│       ├── PatientManagement.tsx         # Gestion patients
│       ├── PurchaseOrdersPage.tsx        # Bons de commande
│       └── ...                           # Autres pages
├── services/
│   ├── advancedDocumentGenerator.ts      # Générateur de documents
│   └── ...                               # Autres services
└── types/
    └── ...                               # Définitions TypeScript
```

---

## 🧪 Tests & Validation

### Checklist Fonctionnelle

#### RBAC
- [ ] Admin voit tous les menus
- [ ] Médecin voit Pôle Médical + RDV uniquement
- [ ] Administratif voit Personnel Admin + Paie
- [ ] Comptable voit Facturation + Taux de Change
- [ ] Logisticien voit Stocks + Fournisseurs + Transport + BC
- [ ] Sélecteur de rôle fonctionne
- [ ] Widget taux de change visible pour Admin/Comptable

#### Documents
- [ ] Fiche patient PDF générée correctement
- [ ] Facture PDF avec filigrane "PAYÉ" si status = paid
- [ ] Bon de commande PDF avec signatures
- [ ] Export Excel patients fonctionnel
- [ ] Export Excel recettes fonctionnel

#### Alertes Stocks
- [ ] Badge rouge si stock = 0
- [ ] Badge orange si stock ≤ minimum
- [ ] Badge jaune si péremption ≤ 30 jours
- [ ] Badge vert si stock OK

---

## 📞 Support & Contact

**Email** : contact@okapiamedical.com
**Téléphone** : +243 XXX XXX XXX
**Site Web** : www.okapiamedical.com

---

## 📝 Notes de Version

### Version 1.0.0 (Actuelle)
✅ Système RBAC complet (8 rôles)
✅ Gestion des patients avec fiche complète
✅ 10 médecins fictifs par services
✅ Générateur de documents PDF/Excel
✅ Système d'alertes de stocks
✅ Module Bons de Commande
✅ Widget Taux de Change
✅ Facturation avec statuts
✅ Design professionnel Okapi Medical

### Prochaines Versions (Roadmap)
- 🔜 Animations Framer Motion
- 🔜 Graphiques interactifs D3.js
- 🔜 API Taux de Change en temps réel
- 🔜 Module de Télémédecine
- 🔜 Application mobile (React Native)
- 🔜 Notifications push en temps réel
- 🔜 Module de Reporting avancé
- 🔜 Intégration paiement mobile (M-Pesa, Orange Money)

---

**Développé avec 💙 pour Okapi Medical**
**© 2024 Okapi Medical - Tous droits réservés**
