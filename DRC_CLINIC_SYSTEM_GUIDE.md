# Système de Gestion de Clinique Médicale - Kinshasa, RDC

## Vue d'Ensemble

Ce système complet de gestion de clinique médicale a été développé spécifiquement pour les établissements de santé à Kinshasa, République Démocratique du Congo. Il intègre toutes les fonctionnalités essentielles pour la gestion administrative, RH, et financière avec conformité aux réglementations congolaises.

## Architecture Technique

- **Frontend**: React 18 avec Vite et TypeScript
- **Styling**: Tailwind CSS
- **Icônes**: Lucide React
- **Backend**: Supabase (PostgreSQL)
- **Génération PDF**: jsPDF et jsPDF-AutoTable
- **Graphiques**: D3.js

## Modules Implémentés

### 1. Tableau de Bord (Dashboard)

Le tableau de bord principal affiche les KPIs essentiels:
- Nombre de patients quotidiens
- Personnel de garde
- Revenus mensuels (CDF et USD)
- Alertes critiques de stock
- Contrats arrivant à échéance (30 jours)
- Médicaments en péremption
- Taux de change du jour

**Accès**: Tous les utilisateurs authentifiés

### 2. Gestion des Employés

Module complet de gestion RH incluant:
- Profils détaillés avec photos
- Informations personnelles (carte d'identité nationale)
- Données d'emploi (poste, département, type de contrat)
- Personnel médical avec spécialités et numéros d'inscription professionnelle
- Documents numériques (contrats, diplômes, certificats)
- Statuts: Actif, En Congé, Suspendu, Terminé

**Accès**: Administrateurs RH uniquement

**Fonctionnalités**:
- Recherche et filtres avancés
- Vue détaillée de chaque employé
- Upload de documents
- Historique complet

### 3. Système de Paie (Conforme RDC)

Calcul automatique conforme aux normes congolaises:

#### Cotisations CNSS
- **Part Employé**: 5% du salaire brut
- **Part Employeur**: 13% du salaire brut

#### Impôt Professionnel sur les Rémunérations (IPR)
Barème progressif implémenté:
- **Tranche 1**: 0 - 524 000 CDF → 3%
- **Tranche 2**: 524 001 - 1 428 000 CDF → 10%
- **Tranche 3**: 1 428 001 - 2 856 000 CDF → 20%
- **Tranche 4**: 2 856 001 - 5 712 000 CDF → 30%
- **Tranche 5**: 5 712 001+ CDF → 40%

#### Composantes du Salaire
- Salaire de base
- Allocation de transport
- Allocation de logement
- Autres allocations et primes

**Calcul**:
1. Salaire Brut = Base + Allocations + Primes
2. CNSS Employé = 5% du Brut
3. Revenu Imposable = Brut - CNSS Employé
4. IPR = Calculé selon le barème progressif
5. Salaire Net = Brut - CNSS - IPR - Autres déductions

**Accès**: Administrateurs RH uniquement

**Fonctionnalités**:
- Création de périodes de paie mensuelles
- Calcul automatique pour tous les employés actifs
- Visualisation des totaux (brut, net, cotisations)
- Export des bulletins de paie (PDF)
- Historique complet des paiements

### 4. Gestion des Horaires (Shifts)

Planification 24/7 des gardes médicales:

#### Types de Garde Prédéfinis
- **Jour**: 08h00 - 16h00 (8h)
- **Nuit**: 20h00 - 08h00 (12h)
- **Weekend Jour**: 08h00 - 20h00 (12h)
- **Garde**: 16h00 - 08h00 (16h)

#### Logique de Sécurité
- Respect des périodes de repos minimum (12-24h selon le type)
- Prévention des affectations consécutives
- Validation automatique

**Accès**: Administrateurs, Médecins, Infirmiers (consultation)

**Fonctionnalités**:
- Vue calendrier interactive
- Affectation par glisser-déposer (à implémenter)
- Liste du personnel de garde
- Statuts: Planifié, Confirmé, Terminé, Annulé
- Notifications automatiques

### 5. Gestion des Assurances

Base de données des assureurs et mutuelles locales:

#### Types d'Assurances
- Mutuelles
- Assurances d'entreprise
- Assurances gouvernementales
- Assurances privées

**Données Stockées**:
- Nom de l'assureur
- Contacts
- Pourcentage de couverture
- Conditions spécifiques

**Accès**: Administrateurs, Réceptionnistes

**Fonctionnalités**:
- Gestion des vouchers
- Validation des couvertures
- Historique des remboursements

### 6. Gestion Multi-Devises

Système complet de gestion CDF/USD:

#### Taux de Change
- Mise à jour quotidienne
- Historique complet
- Application automatique aux transactions

#### Affichage
- Tous les montants affichés en CDF
- Équivalent USD visible
- Conversion automatique selon le taux actif

**Accès**: Administrateurs uniquement pour la gestion

### 7. Inventaire Pharmacie

Suivi des stocks avec alertes d'expiration:

#### Gestion par Lots
- Numéro de lot
- Date de fabrication
- Date de péremption
- Quantité
- Coûts (CDF et USD)
- Fournisseur

#### Alertes Automatiques
- **Critique**: Expiration dans 30 jours
- **Haute**: Expiration dans 60 jours
- **Moyenne**: Expiration dans 90 jours

**Accès**: Pharmaciens, Administrateurs

### 8. Gestion des Contrats

Suivi complet des contrats d'emploi:

#### Types de Contrats
- Permanent (CDI)
- Durée déterminée (CDD)
- Contractuel
- Stagiaire

#### Alertes
- 30 jours avant expiration
- Fin de période d'essai
- Renouvellement requis

**Données Contractuelles**:
- Dates de début/fin
- Période d'essai
- Salaires et allocations
- Heures de travail
- Historique de renouvellements

**Accès**: Administrateurs RH uniquement

## Base de Données

### Tables Principales

#### Employés et RH
- `employees` - Profils des employés
- `employee_documents` - Documents numériques
- `employee_contracts` - Contrats de travail
- `shift_types` - Types de garde
- `shift_schedules` - Planning des gardes

#### Paie
- `tax_brackets` - Barème IPR
- `payroll_periods` - Périodes de paie
- `payroll_items` - Bulletins individuels

#### Finance
- `exchange_rates` - Taux de change
- `insurance_providers` - Assureurs
- `patient_insurance` - Couvertures patients

#### Pharmacie
- `medication_batches` - Lots de médicaments
- `medication_stock_alerts` - Alertes de stock

### Sécurité (RLS)

Toutes les tables sont protégées par Row Level Security:
- Accès basé sur les rôles utilisateurs
- Isolation des données sensibles
- Audit automatique des modifications

## Rôles et Permissions

### super_admin
Accès complet à tous les modules

### hospital_admin
- Gestion RH
- Paie
- Contrats
- Assurances
- Configuration système

### doctor / nurse
- Consultation des horaires
- Gestion des patients
- Prescriptions

### pharmacist
- Inventaire pharmacie
- Gestion des lots
- Alertes de péremption

### receptionist
- Enregistrement patients
- Assurances
- Rendez-vous

## Utilisation

### Démarrage

```bash
# Installation des dépendances
npm install

# Lancement en développement
npm run dev

# Build pour production
npm run build
```

### Configuration

1. **Supabase**: Les informations de connexion sont dans `.env`
2. **Taux de Change**: Mettre à jour quotidiennement via le module dédié
3. **Barème Fiscal**: Configurable dans la table `tax_brackets`

### Premier Lancement

1. Créer un compte super_admin
2. Configurer le taux de change
3. Créer les employés
4. Créer les contrats
5. Lancer la première paie

## Conformité RDC

### CNSS (Caisse Nationale de Sécurité Sociale)
- Calculs conformes aux taux officiels
- Génération des déclarations mensuelles
- Suivi des cotisations

### IPR (Impôt Professionnel sur les Rémunérations)
- Barème progressif 2024
- Calcul automatique
- Rapports fiscaux

### Droit du Travail
- Respect des périodes d'essai
- Gestion des types de contrats
- Alertes légales

## Fonctionnalités à Développer

Les modules suivants sont prêts pour développement:
- Export PDF des bulletins de paie
- Génération de rapports comptables
- Module de gestion des contrats détaillé
- Interface de gestion des taux de change
- Statistiques avancées et analytics

## Support Technique

Pour toute question ou assistance:
- Consultez la documentation inline
- Vérifiez les logs Supabase
- Contactez le support technique

## Notes Importantes

1. **Backup**: Sauvegardez régulièrement la base de données
2. **Taux de Change**: Mettez à jour quotidiennement
3. **Sécurité**: Ne partagez jamais les credentials
4. **Conformité**: Vérifiez régulièrement les mises à jour du barème fiscal

---

**Développé pour les cliniques médicales de Kinshasa, RDC**
**Version 1.0 - 2025**
