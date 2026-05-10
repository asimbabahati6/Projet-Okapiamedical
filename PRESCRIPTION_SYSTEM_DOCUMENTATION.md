# Système de Gestion des Prescriptions Médicales
## Documentation Technique Complète

---

## Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système](#architecture-du-système)
3. [Module 1: Gestion des Prescriptions](#module-1-gestion-des-prescriptions)
4. [Module 2: Intégration Stock Pharmacie](#module-2-intégration-stock-pharmacie)
5. [Module 3: Système d'Export](#module-3-système-dexport)
6. [Contrôle d'accès basé sur les rôles](#contrôle-daccès-basé-sur-les-rôles)
7. [Audit Trail](#audit-trail)
8. [Guide d'utilisation](#guide-dutilisation)
9. [API et Base de données](#api-et-base-de-données)

---

## Vue d'ensemble

Le système de gestion des prescriptions médicales est une solution complète qui permet:
- ✅ Création et gestion des prescriptions par les médecins
- ✅ Consultation des prescriptions par les patients
- ✅ Dispensation des médicaments par les pharmaciens
- ✅ Vérification en temps réel des stocks pharmaceutiques
- ✅ Alertes automatiques de stock
- ✅ Export PDF avec codes QR et signatures numériques
- ✅ Export Excel pour la gestion administrative
- ✅ Journal d'audit complet pour la conformité

---

## Architecture du Système

### Structure de la Base de Données

#### Tables Principales

**1. prescriptions**
- Stocke les informations principales de chaque prescription
- Champs: numéro, patient, médecin, pharmacie, dates, statut, diagnostic, notes
- QR code et signature numérique pour vérification

**2. prescription_items**
- Détails des médicaments prescrits
- Lien avec les médicaments du catalogue
- Informations: dosage, quantité, fréquence, durée, instructions
- Substitution générique autorisée

**3. pharmacies**
- Registre des pharmacies partenaires
- Informations de licence et contact

**4. pharmacy_stock**
- Inventaire en temps réel par pharmacie
- Suivi des lots, dates d'expiration, niveaux de réapprovisionnement
- Déclencheurs automatiques d'alertes

**5. stock_alerts**
- Alertes automatiques de stock
- Types: stock faible, épuisé, expiré, expiration prochaine
- Niveaux de gravité: critique, élevé, moyen, faible

**6. prescription_audit_log**
- Journal complet de toutes les actions
- Capture: création, consultation, modification, dispensation, export
- Conformité HIPAA/GDPR

---

## Module 1: Gestion des Prescriptions

### Fonctionnalités par Rôle

#### Pour les Médecins
**Créer une prescription:**
1. Accéder à "Prescriptions" dans le menu
2. Cliquer sur "Nouvelle Prescription"
3. Sélectionner le patient
4. (Optionnel) Assigner une pharmacie
5. Entrer le diagnostic
6. Ajouter les médicaments:
   - Sélectionner le médicament
   - Spécifier dosage, fréquence, durée, quantité
   - Ajouter des instructions spéciales
   - Autoriser substitution générique si applicable
7. Vérification automatique du stock en temps réel
8. Ajouter des notes additionnelles
9. Définir la période de validité (par défaut 30 jours)
10. Créer la prescription

**Caractéristiques:**
- Génération automatique d'un numéro unique
- Création d'un code QR pour vérification
- Alerte si médicament en rupture de stock
- Suggestions d'alternatives disponibles

**Visualiser et gérer:**
- Liste de toutes les prescriptions créées
- Filtres par statut (en attente, dispensé, expiré)
- Recherche par numéro ou patient
- Export PDF individuel ou en masse
- Export Excel pour rapports

#### Pour les Patients
**Consultation:**
- Accès en lecture seule à leurs propres prescriptions
- Historique complet des prescriptions
- Détails des médicaments prescrits
- Instructions de prise
- Statut de dispensation

#### Pour les Pharmaciens
**Dispensation:**
1. Consulter les prescriptions assignées
2. Vérifier la validité et les détails
3. Marquer comme "Dispensé" après remise
4. Enregistrement automatique de l'heure et l'identité du pharmacien

**Gestion des stocks:**
- Consulter les alertes de stock
- Mettre à jour les quantités
- Accuser réception des alertes
- Voir les médicaments les plus prescrits

#### Pour les Administrateurs
- Accès complet à toutes les prescriptions
- Consultation des journaux d'audit
- Gestion des pharmacies partenaires
- Rapports statistiques

---

## Module 2: Intégration Stock Pharmacie

### Vérification en Temps Réel

**Lors de la création d'une prescription:**
1. Le système vérifie automatiquement la disponibilité dans la pharmacie sélectionnée
2. Affichage d'indicateurs visuels:
   - ✅ Vert: Stock disponible
   - ⚠️ Orange: Stock faible
   - ❌ Rouge: Rupture de stock

3. Suggestions d'alternatives si indisponible

### Système d'Alertes Automatiques

**Types d'alertes:**

**1. Stock Faible (Sévérité: Moyenne)**
- Déclenché quand: quantité ≤ niveau de réapprovisionnement
- Action: Notifier le pharmacien pour commander

**2. Stock Épuisé (Sévérité: Critique)**
- Déclenché quand: quantité = 0
- Action: Alerte immédiate, recherche d'alternatives

**3. Expiration Prochaine (Sévérité: Moyenne/Élevée)**
- Déclenché quand: expiration dans 60 jours
- Élevé si < 30 jours
- Action: Utiliser en priorité, ajuster les commandes

**4. Produit Expiré (Sévérité: Critique)**
- Déclenché quand: date d'expiration dépassée
- Action: Retirer du stock immédiatement

### Panneau d'Alertes

**Accès:**
- Bouton "Alertes Stock" avec badge numérique
- Dashboard avec résumé par gravité

**Fonctionnalités:**
- Vue d'ensemble des alertes actives
- Tri par gravité et date
- Détails complets (pharmacie, médicament, quantité)
- Accusé de réception avec traçabilité

---

## Module 3: Système d'Export

### Export PDF

**Caractéristiques:**
- En-tête officiel de l'hôpital
- Numéro de prescription unique
- Informations complètes du patient
- Détails du médecin prescripteur
- Liste détaillée des médicaments avec instructions
- Code QR pour vérification
- Espace pour signature du médecin
- Espace pour cachet de l'hôpital
- Avertissement de validité

**Format professionnel:**
- Design moderne et lisible
- Optimisé pour l'impression
- Conforme aux standards médicaux

**Utilisation:**
1. Cliquer sur l'icône PDF dans la liste
2. Aperçu avant impression
3. Impression directe ou sauvegarde

### Export Excel

**Données exportées:**
- Numéro de prescription
- Date de création
- Informations patient (nom, numéro)
- Médecin prescripteur
- Pharmacie assignée
- Diagnostic
- Détails de chaque médicament
- Statut et date de dispensation

**Types d'export:**
1. **Export individuel**: Une seule prescription
2. **Export en masse**: Toutes les prescriptions filtrées
3. **Export par période**: Sélection de dates

**Format:**
- CSV compatible Excel
- Encodage UTF-8
- Séparateurs standards
- Colonnes clairement identifiées

---

## Contrôle d'Accès Basé sur les Rôles

### Matrice des Permissions

| Action | Médecin | Patient | Pharmacien | Admin |
|--------|---------|---------|------------|-------|
| Créer prescription | ✅ | ❌ | ❌ | ✅ |
| Voir propres prescriptions | ✅ | ✅ | ❌ | ✅ |
| Voir toutes prescriptions | ❌ | ❌ | ✅ (assignées) | ✅ |
| Modifier prescription | ✅ (si en attente) | ❌ | ❌ | ✅ |
| Dispenser médicaments | ❌ | ❌ | ✅ | ✅ |
| Export PDF | ✅ | ✅ (propres) | ✅ | ✅ |
| Export Excel | ✅ | ❌ | ✅ | ✅ |
| Voir stock | ✅ | ❌ | ✅ | ✅ |
| Gérer stock | ❌ | ❌ | ✅ | ✅ |
| Voir alertes | ✅ | ❌ | ✅ | ✅ |
| Voir audit logs | ❌ | ❌ | ❌ | ✅ |

### Sécurité Row-Level Security (RLS)

Toutes les tables utilisent RLS pour garantir:
- Isolation des données par utilisateur
- Protection contre les accès non autorisés
- Conformité avec les régulations de santé

---

## Audit Trail

### Actions Tracées

**Chaque action est enregistrée avec:**
- Type d'action (création, consultation, modification, dispensation, export)
- Utilisateur ayant effectué l'action
- Horodatage précis
- Adresse IP
- Navigateur/appareil utilisé
- Détails spécifiques (valeurs avant/après pour modifications)

### Types d'Actions Tracées

1. **created**: Création d'une nouvelle prescription
2. **viewed**: Consultation d'une prescription
3. **edited**: Modification d'une prescription existante
4. **dispensed**: Marquage comme dispensé
5. **cancelled**: Annulation d'une prescription
6. **exported_pdf**: Export au format PDF
7. **exported_excel**: Export au format Excel

### Accès aux Logs

**Administrateurs uniquement:**
- Vue complète de tous les logs
- Filtres par période, utilisateur, action
- Export des logs pour audits externes

**Médecins:**
- Logs de leurs propres prescriptions uniquement

---

## Guide d'Utilisation

### Workflow Typique

#### 1. Médecin Crée une Prescription

```
1. Connexion → Dashboard → Prescriptions
2. Cliquer "Nouvelle Prescription"
3. Sélectionner patient (recherche par nom/numéro)
4. Sélectionner pharmacie (optionnel, recommandé)
5. Entrer diagnostic
6. Pour chaque médicament:
   a. Rechercher et sélectionner le médicament
   b. ✅ Vérification automatique du stock
   c. Entrer dosage (ex: "500mg")
   d. Entrer fréquence (ex: "3 fois par jour")
   e. Entrer durée (ex: "7 jours")
   f. Spécifier quantité (ex: 21 comprimés)
   g. Ajouter instructions (ex: "Prendre après les repas")
   h. Cocher "Substitution autorisée" si applicable
7. Ajouter notes additionnelles
8. Définir validité (défaut: 30 jours)
9. Cliquer "Créer la Prescription"
10. ✅ Confirmation → Prescription générée avec QR code
```

#### 2. Patient Consulte sa Prescription

```
1. Connexion → Prescriptions
2. Liste de toutes ses prescriptions
3. Cliquer sur une prescription pour détails
4. Voir:
   - Médicaments prescrits
   - Instructions de prise
   - Statut (en attente / dispensé)
   - Pharmacie assignée
5. Option: Imprimer PDF pour se présenter à la pharmacie
```

#### 3. Pharmacien Dispense les Médicaments

```
1. Connexion → Prescriptions
2. Filtrer par "En attente"
3. Patient se présente avec prescription
4. Vérifier:
   - Validité (pas expirée)
   - Identité du patient
   - Disponibilité des médicaments
5. Préparer les médicaments
6. Cliquer "Marquer comme Dispensé"
7. ✅ Enregistrement automatique avec horodatage
8. Donner instructions au patient
```

#### 4. Gestion des Stocks

```
1. Pharmacien → Alertes Stock
2. Vue d'ensemble par gravité:
   - Critiques (rouges): Action immédiate
   - Élevées (oranges): Planifier commande
   - Moyennes (jaunes): Surveiller
3. Pour chaque alerte:
   - Voir détails (médicament, quantité, expiration)
   - Prendre action (commander, retirer)
   - Accuser réception
4. Mise à jour des quantités dans Pharmacy → Stock
```

### Scénarios Spéciaux

#### Médicament en Rupture de Stock

**Situation:**
Médecin prescrit un médicament non disponible

**Solution:**
1. ⚠️ Alerte visuelle "Stock faible/indisponible"
2. Médecin peut:
   - Cocher "Substitution autorisée"
   - Choisir une alternative dans le menu
   - Changer de pharmacie
   - Prescrire quand même (patient ira ailleurs)

#### Prescription Urgente

**Situation:**
Patient a besoin de médicaments immédiatement

**Solution:**
1. Médecin crée prescription normalement
2. Marque pharmacie la plus proche avec stock
3. Export PDF immédiat
4. Patient se présente avec le PDF
5. Pharmacien vérifie et dispense rapidement

#### Export Administratif en Masse

**Situation:**
Besoin de rapport mensuel de toutes les prescriptions

**Solution:**
1. Admin → Prescriptions
2. Filtrer par période (ex: mois dernier)
3. Optionnel: Filtrer par statut, médecin, etc.
4. Cliquer "Export Excel"
5. ✅ Fichier CSV téléchargé avec toutes les données
6. Ouvrir dans Excel pour analyse

---

## API et Base de Données

### Endpoints Supabase

**Prescriptions:**
```typescript
// Créer
supabase.from('prescriptions').insert({ ... })

// Lire
supabase.from('prescriptions').select('*, patient:patients(*), doctor:user_profiles(*), pharmacy:pharmacies(*)')

// Mettre à jour
supabase.from('prescriptions').update({ status: 'dispensed' }).eq('id', prescriptionId)

// Avec items
supabase.from('prescription_items').select('*, medication:medications(*)').eq('prescription_id', id)
```

**Stock:**
```typescript
// Vérifier disponibilité
supabase.from('pharmacy_stock')
  .select('*')
  .eq('pharmacy_id', pharmacyId)
  .eq('medication_id', medicationId)
  .single()

// Alertes
supabase.from('stock_alerts')
  .select('*, pharmacy:pharmacies(*), medication:medications(*)')
  .eq('acknowledged', false)
```

**Audit:**
```typescript
// Logger action
supabase.from('prescription_audit_log').insert({
  prescription_id: id,
  action: 'created',
  performed_by: userId,
  details: { ... }
})
```

### Triggers et Fonctions

**Trigger: check_stock_levels()**
- Exécuté: À chaque INSERT/UPDATE sur pharmacy_stock
- Action: Crée automatiquement des alertes selon:
  - Quantité ≤ niveau de réapprovisionnement
  - Quantité = 0
  - Date d'expiration proche
  - Date d'expiration dépassée

**Fonction: update_prescription_updated_at()**
- Exécuté: À chaque UPDATE sur prescriptions
- Action: Met à jour automatiquement le champ updated_at

---

## Conformité et Sécurité

### HIPAA/GDPR

**Données protégées:**
- Toutes les informations patient
- Détails médicaux et diagnostics
- Historique de prescriptions

**Mesures de protection:**
- ✅ Chiffrement en transit (HTTPS)
- ✅ Chiffrement au repos (Supabase)
- ✅ Authentification obligatoire
- ✅ RLS pour isolation des données
- ✅ Audit trail complet
- ✅ Accès basé sur les rôles
- ✅ Expiration automatique des sessions

### Bonnes Pratiques

**Pour les médecins:**
- ✅ Vérifier l'identité du patient
- ✅ Entrer des diagnostics précis
- ✅ Spécifier clairement dosages et instructions
- ✅ Vérifier les allergies avant prescription
- ✅ Se déconnecter après chaque session

**Pour les pharmaciens:**
- ✅ Vérifier validité de la prescription
- ✅ Confirmer identité du patient
- ✅ Expliquer les instructions de prise
- ✅ Mettre à jour les stocks immédiatement
- ✅ Traiter les alertes critiques en priorité

**Pour les administrateurs:**
- ✅ Surveiller les logs d'audit régulièrement
- ✅ Réviser les accès utilisateurs
- ✅ Maintenir les pharmacies partenaires à jour
- ✅ Générer des rapports mensuels
- ✅ Former le personnel aux procédures

---

## Support et Maintenance

### Dépannage Courant

**Problème: Stock ne se met pas à jour**
- Vérifier les permissions du pharmacien
- Vérifier que la pharmacie est active
- Consulter les logs d'erreur

**Problème: PDF ne s'imprime pas**
- Autoriser les pop-ups dans le navigateur
- Vérifier que l'imprimante est connectée
- Essayer un autre navigateur

**Problème: Alerte non déclenchée**
- Vérifier que le trigger est actif
- Vérifier les niveaux de réapprovisionnement
- Consulter la table stock_alerts directement

### Contact

Pour questions techniques ou bugs:
- Consulter les logs système
- Vérifier la documentation Supabase
- Contacter l'équipe de développement

---

## Conclusion

Ce système offre une solution complète et moderne pour la gestion des prescriptions médicales, respectant:
- ✅ Les standards de sécurité médicale
- ✅ Les exigences de conformité réglementaire
- ✅ Les besoins opérationnels des professionnels de santé
- ✅ L'expérience utilisateur pour tous les acteurs

Le système est conçu pour évoluer et s'adapter aux besoins futurs de votre établissement de santé.
