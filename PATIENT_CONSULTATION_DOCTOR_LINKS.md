# Système de Liens Patient-Consultation-Médecin

## Date : 16 janvier 2026

## Vue d'ensemble

Ce système établit des liens complets entre les patients, leurs consultations médicales et les médecins traitants, permettant une navigation fluide et des requêtes efficaces dans l'historique médical.

## Architecture

### Relations de Base de Données

```
patients ←→ consultations ←→ medical_staff (médecins)
    ↓            ↓                  ↓
    └─────── appointments ──────────┘
```

**Relations clés :**
- `consultations.patient_id` → `patients.id`
- `consultations.doctor_id` → `medical_staff.id`
- `consultations.appointment_id` → `appointments.id` (optionnel)
- `patients.primary_care_physician_id` → `medical_staff.id` (optionnel)

## Composants Créés

### 1. Vues SQL (4 vues)

#### `patient_consultations_view`
Vue complète combinant toutes les informations de consultation.

**Colonnes principales :**
- `consultation_id`, `consultation_date`
- `patient_id`, `patient_number`, `patient_first_name`, `patient_last_name`
- `doctor_id`, `doctor_name`, `specialization`, `department_name`
- `diagnosis`, `treatment_plan`, `vital_signs`
- `appointment_number`, `appointment_date`

**Utilisation :**
```sql
-- Voir toutes les consultations récentes
SELECT
  consultation_date,
  patient_first_name || ' ' || patient_last_name as patient,
  doctor_name,
  diagnosis
FROM patient_consultations_view
ORDER BY consultation_date DESC
LIMIT 10;
```

#### `patient_medical_history_view`
Résumé de l'historique médical par patient.

**Colonnes principales :**
- Informations patient (nom, date de naissance, groupe sanguin)
- Allergies et conditions chroniques
- `total_consultations` : nombre de consultations
- `last_consultation_date` : dernière consultation
- `next_appointment_date` : prochain rendez-vous
- `primary_care_physician_name` : médecin traitant

**Utilisation :**
```sql
-- Patients avec le plus de consultations
SELECT
  patient_name,
  total_consultations,
  last_consultation_date,
  primary_care_physician_name
FROM patient_medical_history_view
WHERE total_consultations > 0
ORDER BY total_consultations DESC
LIMIT 10;
```

#### `doctor_consultations_view`
Vue des consultations par médecin.

**Colonnes principales :**
- Informations médecin (nom, spécialisation, département)
- Informations patient pour chaque consultation
- Détails de consultation (diagnostic, date)

**Utilisation :**
```sql
-- Activité d'un médecin spécifique
SELECT
  consultation_date,
  patient_name,
  diagnosis
FROM doctor_consultations_view
WHERE doctor_id = 'uuid-du-medecin'
ORDER BY consultation_date DESC;
```

#### `patient_appointments_view`
Vue des rendez-vous avec liens vers consultations.

**Colonnes principales :**
- Informations rendez-vous (date, heure, statut)
- Patient et médecin
- `consultation_id` : lien vers consultation associée
- Dates importantes (check-in, completed, cancelled)

**Utilisation :**
```sql
-- Rendez-vous avec consultations associées
SELECT
  appointment_date,
  patient_name,
  doctor_name,
  status,
  consultation_id IS NOT NULL as has_consultation
FROM patient_appointments_view
WHERE appointment_date >= CURRENT_DATE
ORDER BY appointment_date;
```

### 2. Fonctions SQL (4 fonctions)

#### `get_patient_consultation_history(patient_id)`
Récupère l'historique complet des consultations d'un patient.

**Paramètres :**
- `patient_id` (UUID) : ID du patient

**Retourne :**
- `consultation_id`, `consultation_date`
- `doctor_name`, `doctor_specialization`, `department_name`
- `chief_complaint`, `diagnosis`, `treatment_plan`
- `vital_signs`, `notes`, `follow_up_date`

**Exemple :**
```sql
-- Historique d'un patient
SELECT
  consultation_date,
  doctor_name,
  diagnosis,
  treatment_plan
FROM get_patient_consultation_history('patient-uuid-here')
ORDER BY consultation_date DESC;
```

#### `get_doctor_patients(doctor_id)`
Liste tous les patients ayant consulté un médecin.

**Paramètres :**
- `doctor_id` (UUID) : ID du médecin

**Retourne :**
- Informations patient (nom, date de naissance, contacts)
- `last_consultation_date` : dernière consultation avec ce médecin
- `total_consultations` : nombre total de consultations

**Exemple :**
```sql
-- Patients d'un médecin
SELECT
  patient_name,
  date_of_birth,
  total_consultations,
  last_consultation_date
FROM get_doctor_patients('doctor-uuid-here')
ORDER BY last_consultation_date DESC;
```

#### `get_patient_doctors(patient_id)`
Liste tous les médecins ayant consulté un patient.

**Paramètres :**
- `patient_id` (UUID) : ID du patient

**Retourne :**
- `doctor_id`, `doctor_name`
- `department_name`, `specialization`
- `last_consultation_date`, `total_consultations`

**Exemple :**
```sql
-- Médecins d'un patient
SELECT
  doctor_name,
  specialization,
  total_consultations,
  last_consultation_date
FROM get_patient_doctors('patient-uuid-here')
ORDER BY total_consultations DESC;
```

#### `get_consultation_details(consultation_id)`
Récupère tous les détails d'une consultation spécifique.

**Paramètres :**
- `consultation_id` (UUID) : ID de la consultation

**Retourne :**
- Informations patient complètes (y compris allergies, conditions chroniques)
- Informations médecin complètes
- Détails consultation (plainte, examen, diagnostic, traitement)
- Lien rendez-vous (appointment_id, appointment_number)

**Exemple :**
```sql
-- Détails complets d'une consultation
SELECT * FROM get_consultation_details('consultation-uuid-here');
```

### 3. Indexes de Performance

Indexes créés pour optimiser les requêtes fréquentes :

```sql
-- Index sur consultations
idx_consultations_patient_date     -- (patient_id, consultation_date DESC)
idx_consultations_doctor_date      -- (doctor_id, consultation_date DESC)
idx_consultations_appointment      -- (appointment_id)

-- Index sur appointments
idx_appointments_patient_date      -- (patient_id, appointment_date DESC)
idx_appointments_doctor_date       -- (doctor_id, appointment_date DESC)
```

## Données de Démonstration

### Statistiques Générées

| Métrique | Valeur |
|----------|--------|
| **Consultations créées** | 70 |
| **Patients avec historique** | 41 |
| **Médecins actifs** | 5 |
| **Période couverte** | 6 mois (Juillet 2025 - Janvier 2026) |

### Exemples de Données

**Top 5 Patients par Consultations :**
1. Cécile Kalala - 5 consultations
2. François Kabila - 3 consultations
3. Catherine Kamerhe - 3 consultations
4. Antoine Kananga - 3 consultations
5. Pierre Moise - 3 consultations

**Diagnostics Inclus :**
- Hypertension artérielle
- Diabète de type 2
- Infections respiratoires
- Grippe saisonnière
- Gastro-entérite
- Migraines
- Lombalgies
- Asthme
- Arthrose
- Et 11 autres conditions

## Cas d'Utilisation

### 1. Dashboard Patient

Afficher l'historique complet d'un patient :

```sql
-- Informations générales
SELECT * FROM patient_medical_history_view
WHERE patient_id = 'uuid';

-- Consultations détaillées
SELECT * FROM get_patient_consultation_history('uuid');

-- Médecins consultés
SELECT * FROM get_patient_doctors('uuid');

-- Prochains rendez-vous
SELECT * FROM patient_appointments_view
WHERE patient_id = 'uuid'
AND appointment_date >= CURRENT_DATE
ORDER BY appointment_date;
```

### 2. Dashboard Médecin

Vue d'ensemble pour un médecin :

```sql
-- Liste des patients
SELECT * FROM get_doctor_patients('doctor-uuid');

-- Consultations récentes
SELECT * FROM doctor_consultations_view
WHERE doctor_id = 'doctor-uuid'
AND consultation_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY consultation_date DESC;

-- Rendez-vous aujourd'hui
SELECT * FROM patient_appointments_view
WHERE doctor_id = 'doctor-uuid'
AND appointment_date = CURRENT_DATE
ORDER BY appointment_time;
```

### 3. Recherche de Consultations

Recherche multi-critères :

```sql
-- Par diagnostic
SELECT * FROM patient_consultations_view
WHERE diagnosis ILIKE '%hypertension%'
ORDER BY consultation_date DESC;

-- Par période
SELECT * FROM patient_consultations_view
WHERE consultation_date BETWEEN '2025-10-01' AND '2025-12-31'
ORDER BY consultation_date;

-- Par département
SELECT * FROM patient_consultations_view
WHERE department_name = 'Cardiologie'
ORDER BY consultation_date DESC;
```

### 4. Statistiques et Rapports

Analyses agrégées :

```sql
-- Consultations par mois
SELECT
  DATE_TRUNC('month', consultation_date) as mois,
  COUNT(*) as nb_consultations,
  COUNT(DISTINCT patient_id) as nb_patients,
  COUNT(DISTINCT doctor_id) as nb_medecins
FROM consultations
GROUP BY DATE_TRUNC('month', consultation_date)
ORDER BY mois DESC;

-- Top diagnostics
SELECT
  diagnosis,
  COUNT(*) as occurrences
FROM consultations
WHERE diagnosis IS NOT NULL
GROUP BY diagnosis
ORDER BY occurrences DESC
LIMIT 10;

-- Charge de travail par médecin
SELECT
  doctor_name,
  department_name,
  COUNT(*) as total_consultations,
  COUNT(DISTINCT patient_id) as patients_uniques
FROM doctor_consultations_view
WHERE consultation_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY doctor_name, department_name
ORDER BY total_consultations DESC;
```

### 5. Suivi Patient

Continuité des soins :

```sql
-- Patients nécessitant un suivi
SELECT
  patient_name,
  last_consultation_date,
  diagnosis,
  follow_up_date
FROM (
  SELECT DISTINCT ON (patient_id)
    p.first_name || ' ' || p.last_name as patient_name,
    c.consultation_date as last_consultation_date,
    c.diagnosis,
    c.follow_up_date
  FROM consultations c
  JOIN patients p ON c.patient_id = p.id
  WHERE c.follow_up_date IS NOT NULL
  ORDER BY c.patient_id, c.consultation_date DESC
) subquery
WHERE follow_up_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY follow_up_date;
```

## Intégration Frontend

### TypeScript Types

```typescript
// Type pour une consultation complète
interface PatientConsultation {
  consultation_id: string;
  consultation_date: string;
  patient_id: string;
  patient_number: string;
  patient_first_name: string;
  patient_last_name: string;
  doctor_id: string;
  doctor_name: string;
  specialization: string;
  department_name: string;
  diagnosis: string;
  treatment_plan: string;
  vital_signs: VitalSigns;
  notes: string;
}

interface VitalSigns {
  temperature: number;
  blood_pressure: string;
  heart_rate: number;
  respiratory_rate: number;
  weight: number;
  height: number;
}

// Type pour l'historique patient
interface PatientMedicalHistory {
  patient_id: string;
  patient_name: string;
  date_of_birth: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  total_consultations: number;
  last_consultation_date: string;
  next_appointment_date: string | null;
  primary_care_physician_name: string | null;
}
```

### Exemples de Requêtes Supabase

```typescript
// Récupérer l'historique d'un patient
const { data: history, error } = await supabase
  .rpc('get_patient_consultation_history', {
    p_patient_id: patientId
  });

// Récupérer les patients d'un médecin
const { data: patients, error } = await supabase
  .rpc('get_doctor_patients', {
    p_doctor_id: doctorId
  });

// Vue des consultations
const { data: consultations, error } = await supabase
  .from('patient_consultations_view')
  .select('*')
  .order('consultation_date', { ascending: false })
  .limit(20);

// Historique médical
const { data: history, error } = await supabase
  .from('patient_medical_history_view')
  .select('*')
  .eq('patient_id', patientId)
  .single();
```

## Performance

### Optimisations Appliquées

1. **Indexes stratégiques** sur les colonnes fréquemment filtrées
2. **Vues matérialisables** pour les requêtes complexes fréquentes
3. **Fonctions SECURITY DEFINER** pour un contrôle d'accès centralisé
4. **Requêtes groupées** pour minimiser les appels N+1

### Recommandations

- Utiliser les vues pour les lectures simples
- Utiliser les fonctions pour les logiques métier complexes
- Paginer les résultats des consultations (LIMIT/OFFSET)
- Mettre en cache les statistiques agrégées

## Sécurité

### Row Level Security (RLS)

Les vues héritent des politiques RLS des tables sous-jacentes :
- `consultations` : accessible par médecins et staff autorisé
- `patients` : accessible selon le rôle utilisateur
- `medical_staff` : informations publiques limitées

### Fonctions SECURITY DEFINER

Les 4 fonctions utilisent `SECURITY DEFINER` pour :
- Exécuter avec les privilèges du créateur
- Contourner RLS de manière contrôlée
- Centraliser la logique d'accès

## Tests et Vérification

### Tests Unitaires SQL

```sql
-- Test 1 : Vérifier les liens patient-consultation
SELECT
  COUNT(*) as consultations_linkees,
  COUNT(DISTINCT patient_id) as patients,
  COUNT(DISTINCT doctor_id) as medecins
FROM patient_consultations_view;

-- Test 2 : Vérifier les fonctions
SELECT COUNT(*) as test_passed
FROM get_patient_consultation_history(
  (SELECT id FROM patients LIMIT 1)
);

-- Test 3 : Vérifier l'intégrité des données
SELECT
  c.id,
  c.patient_id,
  p.patient_number,
  c.doctor_id,
  ms.specialization
FROM consultations c
LEFT JOIN patients p ON c.patient_id = p.id
LEFT JOIN medical_staff ms ON c.doctor_id = ms.id
WHERE p.id IS NULL OR ms.id IS NULL;
-- Résultat attendu : 0 lignes
```

### Validation des Données

Toutes les consultations générées incluent :
- ✅ Lien patient valide
- ✅ Lien médecin valide
- ✅ Date de consultation réaliste (6 derniers mois)
- ✅ Signes vitaux cohérents
- ✅ Diagnostic et traitement
- ✅ 50% avec date de suivi

## Migration et Maintenance

### Fichier de Migration

**Nom :** `create_patient_consultation_views_and_functions.sql`

**Contenu :**
- 4 vues SQL
- 4 fonctions PL/pgSQL
- 5 indexes de performance
- Documentation complète

### Rollback

Pour supprimer tous les composants :

```sql
-- Supprimer les fonctions
DROP FUNCTION IF EXISTS get_patient_consultation_history(UUID);
DROP FUNCTION IF EXISTS get_doctor_patients(UUID);
DROP FUNCTION IF EXISTS get_patient_doctors(UUID);
DROP FUNCTION IF EXISTS get_consultation_details(UUID);

-- Supprimer les vues
DROP VIEW IF EXISTS patient_consultations_view;
DROP VIEW IF EXISTS patient_medical_history_view;
DROP VIEW IF EXISTS doctor_consultations_view;
DROP VIEW IF EXISTS patient_appointments_view;

-- Supprimer les indexes (optionnel)
DROP INDEX IF EXISTS idx_consultations_patient_date;
DROP INDEX IF EXISTS idx_consultations_doctor_date;
DROP INDEX IF EXISTS idx_consultations_appointment;
DROP INDEX IF EXISTS idx_appointments_patient_date;
DROP INDEX IF EXISTS idx_appointments_doctor_date;
```

## Prochaines Étapes

### Améliorations Suggérées

1. **Vue matérialisée** pour les statistiques agrégées
2. **Trigger** pour mettre à jour automatiquement les compteurs
3. **Fonction de recherche full-text** sur diagnostics et notes
4. **Export PDF** de l'historique patient
5. **Timeline interactive** des consultations dans le frontend

### Fonctionnalités Futures

- Notifications de suivi automatiques
- Analyse de tendances médicales
- Prédiction de charge de travail
- Recommandations de médecins basées sur l'historique
- Intégration avec système de facturation

## Support et Documentation

### Ressources

- Migration SQL : `/supabase/migrations/create_patient_consultation_views_and_functions.sql`
- Types TypeScript : À créer dans `/src/types/consultations.ts`
- Hooks React : À créer dans `/src/hooks/consultation/`

### Contact

Pour toute question sur ce système :
- Consulter la documentation technique
- Tester avec les données de démonstration
- Vérifier les logs Supabase pour le debugging

## Conclusion

Le système de liens Patient-Consultation-Médecin fournit :
- ✅ **Navigation fluide** entre toutes les entités médicales
- ✅ **Performances optimisées** avec indexes et vues
- ✅ **Sécurité** via RLS et fonctions contrôlées
- ✅ **Données de test** pour validation (70 consultations)
- ✅ **Documentation complète** pour maintenance

Le système est prêt pour l'intégration frontend et l'utilisation en production.

---

**Dernière mise à jour :** 16 janvier 2026
**Version :** 1.0
**Statut :** ✅ Production Ready
