# Système de Fiches Patients Conformes aux Standards Internationaux

## Vue d'Ensemble

Ce document décrit le système complet de gestion des fiches patients conformes aux standards français et internationaux (INS, HAS, CNIL, FHIR R4, CIM-10, CCAM, LOINC, SNOMED CT) implémenté dans le système hospitalier Okapia.

**Date de création:** 15 novembre 2025
**Version:** 1.0
**Conformité:** HAS, CNIL, INS, HL7 FHIR R4, ICD-10, CCAM, LOINC, SNOMED CT

---

## 1. Architecture du Système

### 1.1 Tables de Base de Données

Le système utilise les tables suivantes dans Supabase:

#### Tables de Données Patient

| Table | Description | Conformité |
|-------|-------------|------------|
| `patient_ins_identity` | Identité Nationale de Santé | INS, ANS |
| `patient_medical_history` | Antécédents médicaux personnels | CIM-10, SNOMED CT |
| `patient_family_history` | Antécédents familiaux | CIM-10, SNOMED CT |
| `patient_allergies_detailed` | Allergies et intolérances | SNOMED CT |
| `patient_risk_factors` | Facteurs de risque | SNOMED CT, LOINC |
| `patient_consents` | Consentements patients | RGPD, CNIL |
| `patient_advance_directives` | Directives anticipées | Loi Leonetti |
| `patient_hospitalizations_history` | Historique des hospitalisations | PMSI, DRG |

#### Tables de Référence Médicale

| Table | Description | Standards |
|-------|-------------|-----------|
| `medical_codes_icd10` | Classification Internationale des Maladies | CIM-10 / ICD-10 |
| `medical_codes_ccam` | Classification Commune des Actes Médicaux | CCAM |
| `medical_codes_loinc` | Codes pour examens biologiques | LOINC |
| `medical_codes_snomed_ct` | Terminologie clinique | SNOMED CT |

#### Tables d'Audit et Traçabilité

| Table | Description | Conformité |
|-------|-------------|------------|
| `patient_data_access_log` | Journaux d'accès aux données | CNIL, RGPD |
| `patient_data_modification_log` | Journaux de modifications | CNIL, RGPD |
| `patient_consent_history` | Historique des consentements | RGPD |

### 1.2 Sécurité et Row Level Security (RLS)

Toutes les tables sont protégées par RLS avec les règles suivantes:

- **Lecture:** Accessible aux professionnels de santé authentifiés
- **Écriture:** Restreinte selon le niveau de rôle (médecins, infirmiers, admin)
- **Audit:** Seuls les administrateurs et l'utilisateur concerné peuvent voir leurs logs
- **Traçabilité:** Tous les accès sont automatiquement enregistrés

---

## 2. Composants d'Interface

### 2.1 Sections de la Fiche Patient

#### INSIdentitySection
**Fichier:** `src/components/patient/INSIdentitySection.tsx`

Affiche l'identité INS du patient avec:
- Numéro INS et matricule INS-C
- Statut de qualification (qualifié, provisoire, non qualifié)
- OID et organisme émetteur
- Dates de validation et méthodes de vérification
- Badges visuels conformes HAS/ANS

#### MedicalHistorySection
**Fichier:** `src/components/patient/MedicalHistorySection.tsx`

Affiche les antécédents médicaux avec:
- Conditions actives vs résolues
- Codes CIM-10 et SNOMED CT
- Sévérité et statut clinique
- Traitement actuel et notes
- Dates de diagnostic et résolution

#### AllergiesSection
**Fichier:** `src/components/patient/AllergiesSection.tsx`

Affiche les allergies avec:
- Alertes visuelles pour allergies sévères
- Type d'allergie (médicament, aliment, environnement, etc.)
- Sévérité (légère, modérée, sévère, anaphylaxie)
- Réactions et traitements administrés
- Codes SNOMED CT

### 2.2 Composant de Recherche

#### MedicalCodeSearch
**Fichier:** `src/components/medical/MedicalCodeSearch.tsx`

Composant d'autocomplétion pour recherche de codes médicaux:
- Recherche full-text dans CIM-10, CCAM, LOINC, SNOMED CT
- Résultats triés par pertinence
- Affichage des codes avec descriptions
- Sélection visuelle avec validation
- Délai de recherche optimisé (300ms)

### 2.3 Export de Données

#### ExportPatientDataButton
**Fichier:** `src/components/patient/ExportPatientDataButton.tsx`

Permet l'export multi-format avec:
- **Format FHIR R4:** Bundle FHIR conforme profils français
- **Format JSON complet:** Toutes données structurées
- Traçabilité automatique des exports
- Interface modale intuitive

---

## 3. API et Edge Functions

### 3.1 Génération FHIR

**Edge Function:** `generate-patient-fhir-record`
**Endpoint:** `/functions/v1/generate-patient-fhir-record?patient_id={id}`

Génère un Bundle FHIR R4 complet contenant:

#### Ressources FHIR Générées

| Ressource | Description | Profil |
|-----------|-------------|--------|
| Patient | Informations patient + INS | FrPatient |
| Condition | Antécédents médicaux | Condition |
| AllergyIntolerance | Allergies et intolérances | AllergyIntolerance |
| Encounter | Historique consultations | Encounter |
| FamilyMemberHistory | Antécédents familiaux | FamilyMemberHistory |

#### Identifiants INS

Le bundle FHIR inclut les identifiants INS conformes:
```json
{
  "identifier": [{
    "system": "urn:oid:1.2.250.1.213.1.4.8",
    "value": "numéro_ins",
    "use": "official",
    "type": {
      "coding": [{
        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
        "code": "INS-C",
        "display": "Identifiant National de Santé"
      }]
    }
  }]
}
```

### 3.2 Fonction de Recherche SQL

**Fonction PostgreSQL:** `search_medical_codes()`

Recherche intelligente dans les codes médicaux:
```sql
SELECT * FROM search_medical_codes(
  'hypertension',    -- Terme de recherche
  'icd10',           -- Système (icd10, ccam, loinc, snomed)
  20                 -- Limite de résultats
);
```

**Retourne:**
- Code médical
- Libellé en français
- Description
- Catégorie
- Score de pertinence

---

## 4. Utilitaires

### 4.1 Fichier medicalCodes.ts

**Fichier:** `src/utils/medicalCodes.ts`

Fonctions utilitaires pour:

#### Recherche de Codes
```typescript
searchMedicalCodes(
  searchTerm: string,
  codeSystem: 'icd10' | 'ccam' | 'loinc' | 'snomed',
  limitResults: number
): Promise<MedicalCodeSearchResult[]>
```

#### Formatage et Affichage
- `getSeverityColor()` - Couleurs selon sévérité
- `getStatusColor()` - Couleurs selon statut
- `getAllergyTypeIcon()` - Icônes d'allergies
- `getRiskCategoryIcon()` - Icônes de facteurs de risque
- `formatINSQualificationStatus()` - Formatage statut INS
- `getINSQualificationColor()` - Couleur badge INS
- `formatRelationship()` - Relations familiales
- `formatConsentType()` - Types de consentements
- `formatDirectiveType()` - Types de directives

---

## 5. Types TypeScript

### 5.1 Interfaces Principales

Toutes les interfaces TypeScript sont définies dans `src/types/database.ts`:

```typescript
// Identité INS
interface PatientINSIdentity {
  id: string;
  patient_id: string;
  ins_number: string | null;
  qualification_status: 'qualifié' | 'provisoire' | 'non_qualifié' | 'en_cours_validation';
  // ...
}

// Antécédents médicaux
interface PatientMedicalHistory {
  id: string;
  patient_id: string;
  condition_name: string;
  icd10_code: string | null;
  snomed_code: string | null;
  status: 'actif' | 'résolu' | 'rémission' | 'chronique' | 'récurrent';
  severity: 'léger' | 'modéré' | 'sévère' | 'critique' | null;
  // ...
}

// Allergies détaillées
interface PatientAllergyDetailed {
  id: string;
  patient_id: string;
  allergen_name: string;
  allergy_type: 'médicament' | 'aliment' | 'environnement' | 'insecte' | 'latex' | 'autre';
  severity: 'légère' | 'modérée' | 'sévère' | 'anaphylaxie';
  // ...
}
```

---

## 6. Conformité Réglementaire

### 6.1 CNIL et RGPD

#### Traçabilité Automatique
Chaque accès aux données patient est enregistré dans `patient_data_access_log`:
- Utilisateur
- Date/heure
- Type d'accès (view, export, print)
- Sections consultées
- IP et user agent
- Raison de l'accès

#### Journaux de Modification
Toutes les modifications sont tracées dans `patient_data_modification_log`:
- Table modifiée
- Valeurs avant/après
- Champs modifiés
- Raison de la modification
- Validation requise

### 6.2 HAS (Haute Autorité de Santé)

Le système respecte les recommandations HAS:
- Identitovigilance renforcée (INS)
- Codification standardisée (CIM-10)
- Traçabilité des actes médicaux (CCAM)
- Documentation complète des soins

### 6.3 Standards Internationaux

#### FHIR R4
- Bundle de type collection
- Profils français (FrPatient, etc.)
- Métadonnées complètes
- Références inter-ressources

#### Codes Standards
- **CIM-10/ICD-10:** Diagnostics et pathologies
- **CCAM:** Actes médicaux
- **LOINC:** Examens biologiques
- **SNOMED CT:** Terminologie clinique

---

## 7. Interface Utilisateur Enrichie

### 7.1 PatientDetailsModal Mis à Jour

Le modal de détails patient inclut maintenant des onglets:

1. **Vue d'ensemble** - Informations de base
2. **Identité INS** - Numéro INS et qualification
3. **Antécédents** - Historique médical et familial
4. **Allergies** - Allergies actives et résolues
5. **Consultations** - Historique des consultations

### 7.2 Bouton d'Export

Bouton "Exporter Fiche" permettant:
- Export FHIR R4 (application/fhir+json)
- Export JSON complet (application/json)
- Téléchargement automatique
- Traçabilité dans les logs

---

## 8. Utilisation

### 8.1 Accéder à la Fiche Patient Enrichie

1. Naviguer vers la gestion des patients
2. Cliquer sur un patient pour voir ses détails
3. Utiliser les onglets pour naviguer entre les sections
4. Cliquer sur "Exporter Fiche" pour générer un export

### 8.2 Rechercher des Codes Médicaux

Le composant `MedicalCodeSearch` peut être utilisé ainsi:

```typescript
<MedicalCodeSearch
  codeSystem="icd10"
  onCodeSelect={(code) => console.log(code)}
  label="Code CIM-10"
  placeholder="Rechercher un diagnostic..."
  required
/>
```

### 8.3 Exporter une Fiche FHIR

Via l'API directement:
```typescript
const response = await fetch(
  `${supabaseUrl}/functions/v1/generate-patient-fhir-record?patient_id=${patientId}`,
  {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  }
);
const fhirBundle = await response.json();
```

---

## 9. Améliorations Futures

### 9.1 Court Terme
- [ ] Intégration avec l'API INS officielle de l'ANS
- [ ] Import automatique des codes CIM-10 complets
- [ ] Module de gestion des consentements patients
- [ ] Interface de directives anticipées

### 9.2 Moyen Terme
- [ ] Génération PDF des fiches patients
- [ ] Export CSV pour analyses statistiques
- [ ] Synchronisation bidirectionnelle FHIR
- [ ] Intelligence artificielle pour suggestion de codes

### 9.3 Long Terme
- [ ] Intégration DMP (Dossier Médical Partagé)
- [ ] Messagerie sécurisée MSSanté
- [ ] E-prescription avec certification ASIP Santé
- [ ] Téléconsultation intégrée

---

## 10. Support et Documentation

### 10.1 Ressources

- **Documentation FHIR:** https://www.hl7.org/fhir/
- **Profils français:** http://interopsante.org/
- **INS/ANS:** https://esante.gouv.fr/
- **CIM-10:** https://www.who.int/classifications/icd/
- **CCAM:** https://www.ameli.fr/

### 10.2 Contacts

Pour toute question sur le système:
- **Technique:** Équipe développement Okapia
- **Conformité:** Service qualité et conformité
- **Formation:** Service formation utilisateurs

---

## Conclusion

Ce système représente une implémentation complète et conforme aux standards français et internationaux pour la gestion des fiches patients. Il garantit:

✅ **Conformité réglementaire** (HAS, CNIL, INS)
✅ **Interopérabilité** (FHIR R4, HL7)
✅ **Traçabilité** (Audit complet RGPD)
✅ **Qualité des données** (Codification standardisée)
✅ **Sécurité** (RLS, authentification)
✅ **Extensibilité** (Architecture modulaire)

Le système est prêt pour une utilisation en production et peut être étendu pour répondre aux besoins spécifiques de chaque établissement de santé.
