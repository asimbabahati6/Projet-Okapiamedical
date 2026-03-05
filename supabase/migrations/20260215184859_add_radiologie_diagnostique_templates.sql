/*
  # Templates de Radiologie Diagnostique

  1. Templates ajoutés
    - Radiologie Standard (examens conventionnels)
    - Échographie (toutes zones anatomiques)
    - Scanner/TDM (tomodensitométrie)

  2. Caractéristiques
    - Champs très détaillés par zone anatomique
    - Protocoles d'acquisition
    - Analyse systématique des structures
    - Terminologie médicale française
*/

INSERT INTO consultation_templates (
  name,
  specialty,
  description,
  is_system_template,
  chief_complaint_template,
  examination_template,
  treatment_template,
  notes_template,
  vital_signs_defaults,
  suggested_diagnoses
) VALUES

-- Template: Radiologie Standard
(
  'Radiologie Standard',
  'Radiologie Diagnostique',
  'Template pour examens radiographiques conventionnels (Thorax, Abdomen, Rachis, Membres)',
  true,
  'Type d''examen: □ Thorax □ Abdomen □ Rachis □ Membres

Indication: _______________________
Traumatisme: □ Oui □ Non
Douleur: □ Oui □ Non',

  'TECHNIQUE:
Incidences: □ Face □ Profil □ Oblique

THORAX:
□ Champs pulmonaires: Clairs/Infiltrat
□ Médiastin: Normal/Élargi
□ Cœur: Index <0.5
□ Coupoles: Libres/Surélévation
□ Squelette: Normal/Fracture

ABDOMEN:
□ Gaz: Normal/Distension
□ Calcifications: Absentes/Présentes
□ Squelette: Normal/Anomalie

RACHIS:
□ Courbures: Normales/Scoliose
□ Alignement: Normal/Listésis
□ Hauteur vertébrale: Conservée/Tassement
□ Disques: Normaux/Pincement

MEMBRES:
□ Structures osseuses: Normales/Fracture
□ Interligne: Normal/Pincement
□ Parties molles: Normales/Tuméfaction',

  'CONCLUSION: □ Normal □ Anomalies

Constatations: _______________________

Recommandations:
□ Aucune
□ Examens complémentaires
□ Contrôle à: _______',

  'Date examen: _______
Dose: _______ mGy',

  '{}',
  '[{"code": "Z01.6", "description": "Examen radiologique"}, {"code": "M25.50", "description": "Douleur articulaire"}]'
),

-- Template: Échographie
(
  'Échographie',
  'Radiologie Diagnostique',
  'Template détaillé pour examens échographiques avec analyse par zones anatomiques',
  true,
  'Type: □ Abdominale □ Pelvienne □ Thyroïdienne □ Mammaire □ Cardiaque □ Vasculaire □ Musculo-squelettique

Indication: _______________________',

  'TECHNIQUE:
Sonde: □ Convexe □ Linéaire □ Endocavitaire
Fréquence: _______ MHz
Doppler: □ Couleur □ Pulsé □ Continu

ABDOMEN:

FOIE:
□ Taille: Normale/Hépatomégalie (___cm)
□ Contours: Réguliers/Irréguliers
□ Échostructure: Homogène/Stéatose
□ Lésions: Absentes/Présentes
□ Veine porte: ___mm (N<13mm)

VÉSICULE:
□ Taille: Normale/Distendue
□ Paroi: <3mm/Épaissie
□ Lithiase: Absente/Présente (___mm)
□ VBP: ___mm (N<7mm)

PANCRÉAS:
□ Visualisation: Bonne/Partielle
□ Échostructure: Homogène/Hétérogène
□ Wirsung: ___mm

RATE:
□ Taille: ___cm (N<12cm)
□ Lésions: Absentes/Présentes

REINS:
Droit: ___x___cm
□ Différenciation: Conservée/Diminuée
□ Cavités: Non dilatées/Dilatées
□ Lithiase: Absente/Présente

Gauche: ___x___cm
□ Différenciation: Conservée/Diminuée
□ Cavités: Non dilatées/Dilatées
□ Lithiase: Absente/Présente

VESSIE:
□ Paroi: Fine/Épaissie
□ Résidu: ___ml

AORTE:
□ Calibre: ___mm (N<30mm)

PELVIS:

UTÉRUS:
□ Position: Antéversé/Rétroversé
□ Taille: ___x___x___cm
□ Myomètre: Homogène/Fibromes
□ Endomètre: ___mm

OVAIRES:
Droit: ___x___cm, ___cm³
□ Follicules/Kystes

Gauche: ___x___cm, ___cm³
□ Follicules/Kystes

THYROÏDE:

Lobe droit: ___x___x___mm
□ Échostructure: Homogène/Hétérogène
□ Nodules: Absents/Présents
  Taille: ___ Écho: Hypo/Iso/Hyper
  Contours: Réguliers/Irréguliers
  Calcifications: □ Micro □ Macro
  Doppler: Périphérique/Central

Lobe gauche: ___x___x___mm
□ Nodules: Absents/Présents

VASCULAIRE:

Carotides:
□ CCD: Perméable, ___mm, Plaques: Oui/Non
□ CID: Sténose ___%, Vélocité ___cm/s
□ CCG: Perméable, ___mm, Plaques: Oui/Non
□ CIG: Sténose ___%, Vélocité ___cm/s

Membres:
□ Réseau profond: Perméable/Thrombose
□ Veines superficielles: Normales/Varices',

  'CONCLUSION:

Synthèse: _______________________

Classification (si nodule): EU-TIRADS ___

Conduite: □ Surveillance □ Contrôle □ Examens complémentaires □ Cytoponction',

  'Âge: ___ Poids: ___kg
Qualité: □ Optimale □ Difficile',

  '{}',
  '[{"code": "Z01.4", "description": "Examen échographique"}, {"code": "K80.2", "description": "Calcul de la vésicule biliaire"}]'
),

-- Template: Scanner/TDM
(
  'Scanner/TDM',
  'Radiologie Diagnostique',
  'Template pour examens tomodensitométriques avec reconstructions',
  true,
  'Type: □ Cérébral □ Thoracique □ Abdomino-pelvien □ Rachis □ Ostéo-articulaire □ Angio-scanner

Indication: _______________________
Urgence: □ Oui □ Non',

  'TECHNIQUE:
Scanner multibarrettes (___barrettes)

Injection PDC iodé:
□ Non □ Oui: ___ml, ___mg/ml
Temps: □ Artériel □ Portal □ Tardif

Coupes: ___mm
Reconstructions: □ Axiales □ Coronales □ Sagittales □ 3D

CÉRÉBRAL:

PARENCHYME:
□ Densité: Normale/Hypodensité
□ Hémorragie: Absente/Présente
□ Infarctus: Absent/Présent (territoire ___)
□ Œdème: Absent/Présent
□ Lésions: Absentes/Présentes

VENTRICULES:
□ Taille: Normale/Dilatés/Comprimés

LIGNE MÉDIANE:
□ En place/Déviée ___mm

OS CRÂNE:
□ Normaux/Fracture/Lyse

THORAX:

POUMONS:
□ Parenchyme: Normal/Condensation/Nodules
□ Nodules: Nombre ___, Taille ___mm
  Aspect: Solide/Semi-solide/Verre dépoli
□ Emphysème: Absent/Présent
□ Bronchectasies: Absentes/Présentes

PLÈVRE:
□ Libre/Épanchement/Pneumothorax

MÉDIASTIN:
□ Ganglions: Normaux/Adénopathies (___mm)
□ Trachée: Perméable/Sténose

CŒUR:
□ Taille: Normale/Cardiomégalie
□ Aorte: Normale/Anévrisme/Dissection
□ Artères pulmonaires: Normales/Embolie
□ Score calcique: ___

PAROI (Fenêtre osseuse):
□ Côtes: Normales/Fracture/Lyse
□ Rachis: Normal/Tassement/Lyse

ABDOMEN-PELVIS:

FOIE:
□ Taille: Normale/Hépatomégalie
□ Contours: Réguliers/Dysmorphique
□ Densité: Homogène/Stéatose
□ Lésions: Absentes/Présentes (___cm, ___UH)

VOIES BILIAIRES:
□ Vésicule: Normale/Lithiase
□ VBP: ___mm

PANCRÉAS:
□ Morphologie: Normale
□ Densité: Homogène/Hétérogène
□ Wirsung: ___mm
□ Lésions: Absentes/Présentes

RATE:
□ Taille: ___cm
□ Lésions: Absentes/Présentes

REINS:
Droit: ___cm, Néphro: Normale/Retardée
□ Lésions/Lithiase

Gauche: ___cm, Néphro: Normale/Retardée
□ Lésions/Lithiase

SURRÉNALES: □ Normales □ Nodule

DIGESTIF:
□ Estomac/Intestin/Côlon: Normal/Anomalie

VAISSEAUX:
□ Aorte: ___mm
□ VCI: Perméable/Thrombose
□ Veine porte: Perméable/Thrombose

PELVIS:
□ Vessie/Utérus-Ovaires/Prostate
□ Rectum

GANGLIONS:
□ Normaux/Adénopathies (___mm)

SQUELETTE:
□ Rachis/Bassin: Normal/Tassement/Fracture',

  'CONCLUSION:

Synthèse: _______________________

Diagnostic: _______________________

Recommandations:
□ Surveillance
□ Examens complémentaires
□ Biopsie guidée
□ Contrôle à: _______',

  'DLP: ___mGy.cm
Dose: ___mSv
Qualité: □ Optimale □ Artefacts',

  '{}',
  '[{"code": "Z01.6", "description": "Examen radiologique"}, {"code": "C34.9", "description": "Tumeur maligne des bronches et du poumon"}]'
);
