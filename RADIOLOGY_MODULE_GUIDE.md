# Guide du Module Radiologie - OKAPIA Medical

## Vue d'ensemble

Le module Radiologie d'OKAPIA Medical offre une interface complète pour la gestion des examens d'imagerie médicale, de la prescription à la validation des rapports.

## Pages et Fonctionnalités

### 1. Prescrire un Examen (`/staff/radiology/prescribe`)

**Accessible à:** Médecins, Responsable Radiologie

**Fonctionnalités:**
- Recherche de patient par nom, prénom ou numéro
- Sélection du type d'imagerie:
  - Radiographie (CR)
  - Scanner (CT)
  - IRM (MR)
  - Échographie (US)
  - Mammographie (MG)
- Choix de la partie du corps (11 zones disponibles)
- Niveau d'urgence (Routine, Urgent, Urgence)
- Renseignements cliniques (obligatoire)
- Instructions spéciales (optionnel)

**Workflow:**
1. Rechercher et sélectionner un patient
2. Remplir le formulaire de prescription
3. Cliquer sur "Prescrire l'Examen"
4. L'examen est ajouté à la file d'attente

---

### 2. File d'Attente (`/staff/radiology/queue`)

**Accessible à:** Responsable Radiologie, Technicien Radiologie

**Fonctionnalités:**
- Visualisation de tous les examens prescrits
- Filtres par:
  - Statut (Prescrit, En cours, Terminé, Validé)
  - Urgence (Routine, Urgent, Urgence)
- Statistiques en temps réel
- Action "Prendre en charge" pour démarrer un examen

**Codes couleur:**
- **Orange:** En attente
- **Bleu:** En cours
- **Vert:** Terminé
- **Rouge:** Urgence

**Workflow:**
1. Consulter la liste des examens
2. Filtrer si nécessaire
3. Cliquer sur un examen ou "Prendre en charge"
4. Redirection vers l'Espace de travail

---

### 3. Espace de Travail (`/staff/radiology/workspace/:examId`)

**Accessible à:** Responsable Radiologie uniquement

**Fonctionnalités:**

#### Informations Patient
- Nom complet et numéro de patient
- Date de naissance
- Prescripteur et date de prescription
- Renseignements cliniques

#### Visualisation d'Images
- Viewer DICOM avec contrôles:
  - Zoom (50% à 200%)
  - Rotation (90° par pas)
  - Mode plein écran
  - Téléchargement
- Navigation entre plusieurs images
- Miniatures des images disponibles

#### Upload d'Images
- Zone de glisser-déposer
- Support: DICOM (.dcm), JPEG, PNG
- Upload multiple simultané

#### Saisie du Rapport
Quatre sections principales:

1. **Technique**
   - Paramètres techniques
   - Matériel utilisé
   - Protocole d'acquisition

2. **Observations** (obligatoire)
   - Description détaillée des structures visualisées
   - Anomalies détectées

3. **Conclusion** (obligatoire)
   - Diagnostic radiologique
   - Interprétation synthétique

4. **Recommandations**
   - Examens complémentaires suggérés
   - Suivi recommandé

**Actions:**
- **Sauvegarder Brouillon:** Enregistre sans finaliser
- **Terminer l'Examen:** Finalise et envoie pour validation

**Workflow:**
1. Cliquer sur "Démarrer l'Examen" (si prescrit)
2. Uploader les images DICOM
3. Remplir les sections du rapport
4. Sauvegarder régulièrement
5. Terminer l'examen quand complet

---

### 4. Historique (`/staff/radiology/history`)

**Accessible à:** Tous les utilisateurs avec accès Radiologie

**Fonctionnalités:**
- Consultation des examens passés
- Filtres avancés:
  - Recherche par patient ou n° dossier
  - Période (date de début/fin)
  - Modalité (CR, CT, MR, US, MG)
- Groupement par mois
- Badge "Validé" pour les rapports validés

**Actions:**
- **Voir le rapport:** Icône œil pour visualiser le compte-rendu complet

**Workflow:**
1. Appliquer les filtres souhaités
2. Naviguer dans l'historique mensuel
3. Cliquer sur "Voir le rapport" pour consulter

---

### 5. Visualiseur de Rapport (`/staff/radiology/viewer/:examId`)

**Accessible à:** Tous les utilisateurs avec accès Radiologie

**Fonctionnalités:**
- Affichage du rapport complet en lecture seule
- Visualisation des images associées
- Informations détaillées du patient
- Prescripteur et dates importantes

---

## Contrôle d'Accès (RBAC)

### Permissions par Rôle

| Action | Médecin | Resp. Radio | Tech. Radio | Vue |
|--------|---------|-------------|-------------|-----|
| Prescrire examen | ✅ | ✅ | ❌ | ❌ |
| Voir file d'attente | ✅ | ✅ | ✅ | ✅ |
| Réaliser examen | ❌ | ✅ | ❌ | ❌ |
| Upload images | ❌ | ✅ | ❌ | ❌ |
| Rédiger rapport | ❌ | ✅ | ❌ | ❌ |
| Consulter historique | ✅ | ✅ | ✅ | ✅ |
| Voir rapports | ✅ | ✅ | ✅ | ✅ |

---

## Données Fictives Intégrées

Le système fonctionne avec des données réelles de la base Supabase, mais voici des exemples typiques:

### Patients Exemples
- Mukendi Marie-Claire (P-2026-045)
- Tshilombo Jean-Paul (P-2026-046)
- Kalala Sophie (P-2026-047)
- Nsimba Patrick (P-2026-048)
- Lubamba Grace (P-2026-049)
- Kabongo Daniel (P-2026-050)

### Types d'Examens
- Scanner thorax pour suspicion de pneumonie
- Radiographie membre inférieur (fracture)
- Échographie abdominale
- IRM cérébrale (AVC suspecté)
- Radiographie colonne vertébrale
- Scanner crâne (traumatisme)

---

## Interface Utilisateur

### Palette de Couleurs
- **Cyan/Bleu clair:** Actions principales, navigation
- **Orange:** Examens en attente, urgences modérées
- **Bleu:** Examens en cours
- **Vert:** Examens terminés, validés
- **Rouge:** Urgences critiques
- **Gris:** Informations secondaires, états neutres

### Icônes (Lucide React)
- `FileText`: Prescriptions, rapports
- `Eye`: Visualisation
- `Upload`: Import d'images
- `ZoomIn/Out`: Contrôles viewer
- `RotateCw`: Rotation images
- `Calendar`: Dates, historique
- `User`: Patients
- `Activity`: Statut en cours
- `CheckCircle`: Validation, complétion

---

## Workflow Type Complet

1. **Médecin:** Prescrit un examen pour un patient
2. **Système:** Ajoute l'examen à la file d'attente
3. **Responsable Radiologie:**
   - Consulte la file d'attente
   - Prend en charge l'examen urgent
   - Démarre l'examen
4. **Réalisation:**
   - Upload des clichés DICOM
   - Visualisation et analyse des images
   - Rédaction du rapport technique
5. **Finalisation:**
   - Sauvegarde du brouillon
   - Vérification des sections obligatoires
   - Terminer l'examen
6. **Consultation:**
   - Médecin consulte le rapport dans l'historique
   - Patient peut être informé des résultats

---

## Bonnes Pratiques

### Pour les Médecins Prescripteurs
- Toujours remplir les renseignements cliniques de manière détaillée
- Indiquer le niveau d'urgence approprié
- Préciser les instructions spéciales si nécessaire

### Pour les Radiologues
- Démarrer l'examen avant de commencer la saisie
- Uploader toutes les images avant de rédiger
- Sauvegarder régulièrement le brouillon
- Remplir toutes les sections obligatoires
- Utiliser une terminologie médicale précise

### Pour la Consultation
- Utiliser les filtres pour trouver rapidement un examen
- Vérifier la date de l'examen
- Consulter l'historique pour comparer avec examens antérieurs

---

## Support Technique

Pour toute question sur l'utilisation du module Radiologie, consultez:
- La documentation complète dans `/docs`
- Le guide RBAC dans `RBAC_DOCUMENTATION_INDEX.md`
- Le système de permissions dans `RBAC_CONFIGURATION.md`

---

**Version:** 1.0
**Dernière mise à jour:** 27 février 2026
**Module:** Radiologie - OKAPIA Medical ERP
