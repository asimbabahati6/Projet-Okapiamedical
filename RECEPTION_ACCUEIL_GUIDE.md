# Guide Complet: Module Réception & Accueil

## Vue d'ensemble

Le module **Réception & Accueil** est maintenant pleinement fonctionnel et permet la gestion complète de l'arrivée des patients à la clinique.

## Accès au Module

**Navigation:** Tableau de Bord → Pôle Administratif → Réception & Accueil

**URL:** `/staff/patient-checkin`

**Rôles autorisés:** Réceptionniste, Administrateur

---

## Fonctionnalités Principales

### 1. Tableau de Bord en Temps Réel

Quatre cartes statistiques affichent:
- **Enregistrements aujourd'hui** - Nombre total de patients enregistrés
- **Patients en attente** - Nombre de patients dans la file d'attente
- **Nouveaux patients** - Patients enregistrés pour la première fois
- **En inscription** - Patients en cours de processus d'inscription

### 2. Recherche de Patients

**Fonctionnalité:**
- Recherche dynamique par:
  - Nom
  - Prénom
  - Numéro de patient
  - Numéro de téléphone

**Utilisation:**
1. Tapez au moins 2 caractères dans la barre de recherche
2. Les résultats s'affichent automatiquement
3. Cliquez sur un patient pour lancer l'enregistrement

### 3. Liste des Rendez-vous du Jour

**Affichage:**
- Tous les rendez-vous confirmés ou en attente pour aujourd'hui
- Triés par heure de rendez-vous
- Informations visibles:
  - Nom du patient
  - Heure du rendez-vous
  - Numéro du patient
  - Nom du médecin

**Action:**
- Cliquez sur un rendez-vous pour enregistrer l'arrivée du patient

### 4. Processus d'Enregistrement

Lorsqu'un patient est sélectionné, le système:

**Étape 1: Vérification**
- Vérifie le statut du patient dans le système
- Contrôle s'il y a des rendez-vous actifs
- Identifie le département approprié

**Étape 2: Enregistrement**
- Crée une entrée dans `patient_checkins`
- Génère un numéro de file d'attente unique
- Enregistre l'heure d'arrivée
- Associe le rendez-vous si applicable

**Étape 3: Routage**
- Affiche les instructions de direction
- Indique le département de destination
- Fournit le numéro de file d'attente
- Estime le temps d'attente

### 5. File d'Attente en Direct

**Panneau latéral** affichant:
- Patients actuellement en attente
- Position dans la file
- Niveau de priorité (Normal, Prioritaire, Urgence)
- Temps d'attente estimé
- Médecin assigné

**Rafraîchissement:**
- Automatique toutes les 30 secondes
- Manuel via le bouton de rafraîchissement

### 6. Historique des Enregistrements

**Section** "Derniers Enregistrements":
- Les 10 derniers patients enregistrés
- Badge "Nouveau" pour les nouveaux patients
- Badge "Existant" pour les patients connus
- Heure d'enregistrement
- Numéro de file d'attente

---

## Flux de Travail Type

### Scénario 1: Patient avec Rendez-vous

1. Le patient arrive à la réception
2. Réceptionniste clique sur le rendez-vous dans la liste du jour
3. Modal d'enregistrement s'ouvre automatiquement
4. Vérification des informations du patient
5. Clic sur "Enregistrer l'arrivée"
6. Instructions de routage affichées
7. Patient dirigé vers le département approprié

### Scénario 2: Patient Sans Rendez-vous

1. Réceptionniste recherche le patient par nom/téléphone
2. Sélection du patient dans les résultats
3. Modal d'enregistrement s'ouvre
4. Système détecte l'absence de rendez-vous
5. Options:
   - Enregistrement en consultation directe
   - Création d'un rendez-vous d'urgence
6. Patient ajouté à la file d'attente
7. Instructions de routage fournies

### Scénario 3: Nouveau Patient

1. Si patient non trouvé dans la recherche
2. Option "Nouveau Patient" apparaît
3. Formulaire d'inscription complète:
   - Informations personnelles
   - Contact d'urgence
   - Informations médicales de base
   - Photo (optionnelle)
4. Création du dossier patient
5. Enregistrement automatique
6. Ajout à la file d'attente

---

## Tables de Base de Données Utilisées

### `patient_checkins`
```sql
- id (uuid)
- patient_id (uuid) → patients
- appointment_id (uuid) → appointments (nullable)
- checkin_time (timestamptz)
- queue_number (text)
- is_new_patient (boolean)
- status (text)
- checked_in_by (uuid) → user_profiles
- notes (text)
```

### `waiting_queue`
```sql
- id (uuid)
- patient_id (uuid) → patients
- queue_number (text)
- queue_position (integer)
- priority_level (integer)
- estimated_wait_minutes (integer)
- assigned_physician (uuid) → user_profiles
- department_id (uuid) → departments
- status (text)
- created_at (timestamptz)
```

---

## Composants React

### Page Principale
**Fichier:** `src/pages/staff/PatientCheckInPage.tsx`

**État géré:**
- Résultats de recherche
- Rendez-vous du jour
- Enregistrements récents
- Statistiques temps réel
- Patient sélectionné

### Composants Enfants

#### 1. PatientCheckInModal
**Fichier:** `src/components/checkin/PatientCheckInModal.tsx`

**Fonctions:**
- Affichage modal d'enregistrement
- Vérification du statut patient
- Soumission de l'enregistrement
- Affichage des instructions de routage

#### 2. WaitingQueueDisplay
**Fichier:** `src/components/checkin/WaitingQueueDisplay.tsx`

**Fonctions:**
- Affichage de la file d'attente
- Rafraîchissement automatique/manuel
- Tri par priorité et position
- Indicateurs visuels de priorité

#### 3. RoutingInstructions
**Fichier:** `src/components/checkin/RoutingInstructions.tsx`

**Fonctions:**
- Instructions de direction après enregistrement
- Affichage du département destination
- Numéro de file d'attente
- Plan/carte (si disponible)

#### 4. NewPatientRegistration
**Fichier:** `src/components/checkin/NewPatientRegistration.tsx`

**Fonctions:**
- Formulaire complet nouveau patient
- Validation des données
- Upload de photo
- Création du dossier

---

## Services et Utilitaires

### `patientRouting.ts`
**Fonctions:**
- `checkPatientStatus()` - Vérifie l'état d'un patient
- `determineDestination()` - Détermine le département
- `calculateWaitTime()` - Calcule le temps d'attente estimé

---

## Gestion des Priorités

### Niveaux de Priorité

**Niveau 1: Urgence** (Rouge)
- Patients en détresse médicale
- Situations critiques
- Passage immédiat

**Niveau 2: Prioritaire** (Jaune)
- Personnes âgées
- Femmes enceintes
- Enfants en bas âge
- Handicap

**Niveau 3: Normal** (Bleu)
- Patients standards
- Ordre d'arrivée

---

## Sécurité et Permissions

### Row Level Security (RLS)

**Politique de lecture:**
```sql
-- Réceptionnistes peuvent voir tous les enregistrements
-- Personnel médical peut voir leurs patients assignés
```

**Politique d'écriture:**
```sql
-- Seuls réceptionnistes et administrateurs peuvent enregistrer
-- Enregistrement de l'utilisateur qui effectue l'action
```

---

## Intégration avec Autres Modules

### 1. Module Rendez-vous
- Récupération automatique des RDV du jour
- Mise à jour du statut après enregistrement
- Lien bidirectionnel

### 2. Module Patients
- Recherche en temps réel
- Accès au dossier complet
- Historique des visites

### 3. Module Départements
- Routage automatique
- Gestion de la capacité
- Notifications au personnel

### 4. Module Médecins
- Assignment automatique si RDV
- Notification d'arrivée patient
- Consultation du planning

---

## Notifications et Alertes

### Notifications Automatiques

**Lors de l'enregistrement:**
- ✉️ Notification au médecin assigné
- 📱 SMS au patient (optionnel) avec numéro de file
- 🔔 Alerte département si capacité atteinte

**Pendant l'attente:**
- ⏰ Mise à jour temps d'attente toutes les 5 min
- 🚨 Alerte si attente > 60 minutes
- 📊 Rapport statistique fin de journée

---

## Rapports et Statistiques

### Données Collectées

- Nombre d'enregistrements par jour/semaine/mois
- Temps d'attente moyen
- Taux de nouveaux patients
- Pics d'affluence (heures)
- Performance par réceptionniste
- Taux de respect des RDV

### Exports Disponibles

- 📄 PDF: Rapport journalier
- 📊 Excel: Données statistiques
- 📈 Graphiques: Tableaux de bord

---

## Configuration

### Paramètres Personnalisables

**Dans:** `src/config/constants.ts`

```typescript
export const RECEPTION_CONFIG = {
  SEARCH_MIN_LENGTH: 2,
  QUEUE_REFRESH_INTERVAL: 30000, // 30 secondes
  MAX_SEARCH_RESULTS: 10,
  AUTO_LOGOUT_MINUTES: 30,
  PRINT_QUEUE_TICKET: true,
  SMS_NOTIFICATIONS: false,
};
```

---

## Résolution de Problèmes

### Problème: Patient non trouvé

**Solution:**
1. Vérifier orthographe du nom
2. Essayer avec numéro de téléphone
3. Chercher par numéro de patient si connu
4. Si vraiment nouveau → Créer nouveau dossier

### Problème: File d'attente ne se rafraîchit pas

**Solution:**
1. Cliquer sur bouton rafraîchissement manuel
2. Vérifier connexion internet
3. Recharger la page si nécessaire
4. Vérifier droits d'accès base de données

### Problème: Enregistrement échoue

**Solution:**
1. Vérifier que tous les champs requis sont remplis
2. Confirmer que patient a bien un dossier actif
3. Vérifier disponibilité du département
4. Consulter console navigateur pour erreurs

---

## Prochaines Améliorations Prévues

### Phase 1 (Court terme)
- [ ] Scan de carte d'identité
- [ ] Reconnaissance biométrique
- [ ] Impression automatique de ticket
- [ ] Interface tablette pour patients

### Phase 2 (Moyen terme)
- [ ] Check-in en ligne avant visite
- [ ] QR code pour enregistrement rapide
- [ ] Intégration système de paiement
- [ ] Multi-langue (Anglais, Lingala, Swahili)

### Phase 3 (Long terme)
- [ ] IA pour prédiction temps d'attente
- [ ] Chatbot assistance patients
- [ ] Application mobile patients
- [ ] Système de feedback instantané

---

## Support Technique

**En cas de problème:**
1. Consulter cette documentation
2. Vérifier les logs dans console navigateur
3. Contacter administrateur système
4. Créer un ticket de support avec capture d'écran

**Logs importants:**
```javascript
// Ouvrir console navigateur (F12)
// Vérifier erreurs en rouge
// Noter message d'erreur exact
```

---

## Conclusion

Le module Réception & Accueil est maintenant **pleinement opérationnel** et prêt pour une utilisation en production. Toutes les fonctionnalités essentielles sont implémentées, testées et documentées.

**Status:** ✅ **FONCTIONNEL**

**Dernière mise à jour:** 21 Février 2026

**Version:** 1.0.0
