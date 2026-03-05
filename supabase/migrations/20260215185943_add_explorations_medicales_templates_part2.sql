/*
  # Templates d'Explorations Médicales - Partie 2

  1. Templates ajoutés
    - Électrocardiogramme (ECG)
    - Épreuve d'Effort
    - Électroencéphalogramme (EEG)

  2. Caractéristiques
    - Analyse systématique des tracés
    - Interprétation clinique
    - Protocoles standardisés
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

-- Template: ECG
(
  'Électrocardiogramme (ECG)',
  'Explorations Médicales',
  'Template pour électrocardiogramme 12 dérivations',
  true,
  'Indication:
[ ] Douleur thoracique [ ] Palpitations [ ] Dyspnée
[ ] Bilan systématique [ ] Pré-opératoire
[ ] Surveillance cardiaque [ ] Contrôle traitement',

  'CONDITIONS:
Repos, 12 dérivations
Qualité tracé: [ ] Bonne [ ] Artefacts [ ] Tremblements

ANALYSE SYSTÉMATIQUE:

RYTHME:
[ ] Sinusal régulier
[ ] Arythmie sinusale respiratoire
[ ] Fibrillation atriale
[ ] Flutter atrial
[ ] Rythme jonctionnel
[ ] Tachycardie ventriculaire
[ ] Autre: ___

FRÉQUENCE:
___bpm
[ ] Bradycardie (<60bpm)
[ ] Normale (60-100bpm)
[ ] Tachycardie (>100bpm)

AXE DU CŒUR:
___° [ ] Normal (-30° à +90°)
[ ] Déviation axiale gauche (<-30°)
[ ] Déviation axiale droite (>+90°)

ONDE P:
[ ] Présente [ ] Absente
Morphologie: [ ] Normale [ ] Biphasique [ ] Pointue
Durée: ___ms (N: 80-110ms)
Amplitude: ___mm (N <2.5mm)
[ ] Hypertrophie OG (P mitrale): P ≥120ms, bifide en DII
[ ] Hypertrophie OD (P pulmonale): P >2.5mm en DII

INTERVALLE PR:
___ms [ ] Normal (120-200ms)
[ ] Court (<120ms): Pré-excitation (WPW)
[ ] Allongé (>200ms): BAV 1er degré
[ ] Variable: BAV 2ème degré (Mobitz I/II)

COMPLEXE QRS:
Durée: ___ms [ ] Normal (<120ms)
[ ] Large (≥120ms): BBG/BBD, Troubles conduction

Morphologie:
[ ] Normale
[ ] Onde Q pathologique (>40ms ou >25% R): ___
  Dérivations: ___ (Territoire: Antérieur/Inférieur/Latéral)
[ ] Ondes R amples
[ ] Ondes S profondes
[ ] QS (infarctus constitué)
[ ] rSr'' (BBD)
[ ] Large monophasique (BBG)

Amplitude:
[ ] Normale
[ ] Microvoltage (<5mm membres, <10mm précordiales)
[ ] HVG (Sokolow-Lyon: SV1+RV5 >35mm H, >30mm F)
[ ] HVD (R en V1 >7mm, R/S en V1 >1)

SEGMENT ST:
[ ] Isoélectrique
[ ] Sus-décalage: ___mm, Dérivations: ___
  [ ] Lésion ischémique (IDM STEMI)
  [ ] Péricardite (concave, diffus)
  [ ] Repolarisation précoce (jeune, athlète)
[ ] Sous-décalage: ___mm, Dérivations: ___
  [ ] Ischémie sous-endocardique
  [ ] Effet digitalique

ONDE T:
[ ] Positive normale
[ ] Négative: Dérivations ___
  [ ] Ischémie
  [ ] Séquelle infarctus
  [ ] HVG avec surcharge
[ ] Pointue, ample: Hyperkaliémie
[ ] Aplatie: Hypokaliémie

INTERVALLE QT:
QT mesuré: ___ms
QTc (corrigé Bazett): ___ms
[ ] Normal (<440ms H, <460ms F)
[ ] Allongé: >440ms (Risque torsades de pointe)
[ ] Raccourci: <340ms

HYPERTROPHIES:

Hypertrophie VG (HVG):
[ ] Non
[ ] Oui: Critères positifs:
  [ ] Sokolow-Lyon: SV1+RV5/6 ___mm (>35mm H, >30mm F)
  [ ] Cornell: RaVL+SV3 ___mm (>28mm H, >20mm F)
  [ ] Indice de Lewis positif

Hypertrophie VD (HVD):
[ ] Non
[ ] Oui: R en V1 >7mm, R/S en V1 >1, Déviation axiale droite

TROUBLES DE CONDUCTION:

Bloc auriculo-ventriculaire (BAV):
[ ] Non
[ ] BAV 1er degré: PR >200ms
[ ] BAV 2ème degré: Mobitz I (Luciani-Wenckebach) / Mobitz II
[ ] BAV 3ème degré: Dissociation AV complète

Blocs de branche:
[ ] Non
[ ] BBD (Bloc branche droit): QRS ≥120ms, rSr'' en V1-V2
[ ] BBG (Bloc branche gauche): QRS ≥120ms, QS en V1, R large en V5-V6
[ ] Hémibloc antérieur gauche: Axe gauche, rS en DII-III-aVF
[ ] Hémibloc postérieur gauche: Axe droit, qR en DII-III-aVF

Pré-excitation:
[ ] Non
[ ] Syndrome de Wolff-Parkinson-White: PR court, Onde delta

ISCHÉMIE / INFARCTUS:

Infarctus du myocarde:
[ ] Non
[ ] Séquelle infarctus (Ondes Q pathologiques):
  [ ] Antérieur: V1-V4 (IVA)
  [ ] Inférieur: DII, DIII, aVF (Coronaire droite)
  [ ] Latéral: DI, aVL, V5-V6 (Circonflexe)
  [ ] Septal: V1-V2
  [ ] Postérieur: R amples V1-V2

Ischémie aiguë:
[ ] Non
[ ] IDM STEMI: Sus-ST ___mm, Dérivations ___, Territoire ___
[ ] IDM NSTEMI: Sous-ST, T négatives, Pas de sus-ST
[ ] Angor instable: Modifications transitoires ST-T

AUTRES ANOMALIES:

[ ] Extrasystoles: Atriales / Ventriculaires (Fréquence: ___)
[ ] Fibrillation atriale: FC ___, Réponse ventriculaire: Rapide/Lente/Contrôlée
[ ] Flutter atrial: Ondes F en dents de scie, Ratio: ___:1
[ ] Péricardite: Sus-ST concave, Sous-PQ
[ ] Hyperkaliémie: T pointues, QRS large, Onde P disparaît
[ ] Hypokaliémie: T aplaties, Onde U, Sous-ST
[ ] Hypercalcémie: QT court
[ ] Hypocalcémie: QT long
[ ] Effet digitalique: Cupule digitalique (sous-ST en cuillère)',

  'CONCLUSION:

RYTHME: ___ à ___bpm

CONDUCTION:
[ ] Normale
[ ] BAV ___
[ ] BBD / BBG / Hémibloc ___

AXE: ___° (Normal/Déviation gauche/droite)

HYPERTROPHIES:
[ ] HVG [ ] HVD [ ] Non

REPOLARISATION:
[ ] Normale
[ ] Ischémie: Dérivations ___
[ ] Lésion: Dérivations ___
[ ] Séquelle IDM: Territoire ___

QTc: ___ms (Normal/Allongé/Raccourci)

DIAGNOSTIC PRINCIPAL:
[ ] ECG normal
[ ] IDM STEMI territoire ___
[ ] IDM NSTEMI
[ ] Ischémie sous-endocardique
[ ] Séquelle IDM ___
[ ] Fibrillation atriale
[ ] Troubles conduction: ___
[ ] HVG / HVD
[ ] Troubles ioniques
[ ] Autre: ___

COMPARAISON:
[ ] ECG antérieur non disponible
[ ] Stable par rapport à ECG du ___
[ ] Modifications nouvelles: ___

CONDUITE À TENIR:
[ ] ECG normal: Aucune
[ ] Surveillance
[ ] Troponines + Bilan cardiaque
[ ] Écho-cardiographie
[ ] Épreuve d''effort
[ ] Coronarographie en urgence (si STEMI)
[ ] Holter ECG (si arythmie)
[ ] Correction troubles ioniques
[ ] Autre: ___',

  'Corrélation clinique indispensable

ECG de contrôle si:
[ ] Douleur thoracique persistante
[ ] Modification traitement cardiaque
[ ] Post-angioplastie/Pontage: 1 mois, 6 mois, 1 an',

  '{}',
  '[{"code": "I49.9", "description": "Arythmie cardiaque"}, {"code": "I25.2", "description": "Infarctus ancien"}]'
),

-- Template: Épreuve d'effort
(
  'Épreuve d''Effort (ECG d''effort)',
  'Explorations Médicales',
  'Template pour test d''effort cardiaque',
  true,
  'Indication:
[ ] Douleur thoracique atypique
[ ] Dépistage ischémie coronaire
[ ] Évaluation capacité fonctionnelle
[ ] Bilan HTA effort
[ ] Post-infarctus (évaluation pronostic)
[ ] Adaptation traitement anti-arythmique',

  'CONTRE-INDICATIONS VÉRIFIÉES:
[ ] Pas IDM récent (<2j)
[ ] Pas angor instable
[ ] Pas sténose aortique serrée symptomatique
[ ] Pas IC décompensée
[ ] Pas arythmie ventriculaire grave non contrôlée
[ ] Pas embolie pulmonaire récente
[ ] Pas myocardite/péricardite aiguë

PRÉPARATION:
Arrêt bêtabloquants: [ ] 48h [ ] Non indiqué
Jeûne: [ ] 2h
Tenue sportive: [ ] Oui

PROTOCOLE:
[ ] Bruce standard (paliers 3min)
[ ] Bruce modifié
[ ] Rampe
[ ] Watts (vélo): Paliers de ___W toutes les ___min

Matériel: [ ] Tapis roulant [ ] Vélo ergométrique

DONNÉES DE BASE (Repos):
FC repos: ___bpm
TA repos: ___/___mmHg
ECG repos: [ ] Normal [ ] Anomalie (détailler): ___

FC maximale théorique: 220 - âge = ___bpm
FC cible (85% FMT): ___bpm

DÉROULEMENT:

Palier 1: ___min, ___% pente ou ___W
FC: ___bpm, TA: ___/___mmHg, ECG: ___

Palier 2: ___min
FC: ___bpm, TA: ___/___mmHg, ECG: ___

Palier 3: ___min
FC: ___bpm, TA: ___/___mmHg, ECG: ___

Palier 4 et suivants: ...

DONNÉES MAXIMALES:
Durée totale effort: ___min ___s
Charge maximale: ___W ou ___METS
FC maximale atteinte: ___bpm (___%  de FMT)
TA maximale: ___/___mmHg
Double produit (FCmax x TAS): ___

MOTIF D''ARRÊT:
[ ] Épuisement (normal)
[ ] FC cible atteinte
[ ] Douleur thoracique angineuse (EVA: ___/10)
[ ] Dyspnée importante
[ ] Sous-décalage ST significatif (___mm)
[ ] Sus-décalage ST
[ ] Arythmie ventriculaire (ESV nombreuses, TV)
[ ] Chute TA
[ ] HTA excessive (>250/115mmHg)
[ ] Claudication membres inférieurs
[ ] Malaise, vertiges
[ ] Refus patient

SYMPTÔMES PENDANT EFFORT:

Douleur thoracique:
[ ] Absente
[ ] Présente: Début palier ___, EVA ___/10
  Type: Oppression/Brûlure/Serrement
  Irradiation: [ ] Bras gauche [ ] Mâchoire [ ] Dos
  Régression: Immédiate/Progressive (___min)

Dyspnée: [ ] Absente [ ] Légère [ ] Modérée [ ] Intense

Autres: [ ] Palpitations [ ] Vertiges [ ] Nausées

MODIFICATIONS ECG:

Sous-décalage ST (Ischémie):
[ ] Absent
[ ] Présent:
  Amplitude max: ___mm (Positif si ≥1mm à 80ms après point J)
  Dérivations: ___
  Pente: Horizontale/Descendante/Ascendante lente
  Apparition: Palier ___, FC ___bpm
  Persistance en récupération: ___min

Sus-décalage ST:
[ ] Absent
[ ] Présent: ___mm, Dérivations ___ (Ischémie transmurale sévère)

Troubles du rythme:
[ ] Absents
[ ] ESV (extrasystoles ventriculaires): Rares/Fréquentes/Salves
[ ] Tachycardie ventriculaire: [ ] Oui (arrêt immédiat)
[ ] ESA (extrasystoles atriales)
[ ] FA paroxystique

Troubles conduction:
[ ] Absents
[ ] BBG fonctionnel (FC-dépendant)
[ ] BAV

RÉCUPÉRATION (3-5min):

T+1min: FC ___bpm, TA ___/___mmHg, ECG: ___
T+3min: FC ___bpm, TA ___/___mmHg, ECG: ___
T+5min: FC ___bpm, TA ___/___mmHg, ECG: ___

Normalisation ST: [ ] <3min [ ] 3-5min [ ] >5min [ ] Persistant

Récupération FC:
Chute FC à 1min: ___bpm (Anormale si <12bpm, mauvais pronostic)',

  'INTERPRÉTATION:

TEST:
[ ] NÉGATIF (ischémie non détectée)
[ ] POSITIF (ischémie détectée)
[ ] DOUTEUX (modifications limites)
[ ] NON CONTRIBUTIF (FC cible non atteinte, ECG ininterprétable)

Critères de positivité remplis:
[ ] Sous-ST ≥1mm horizontal/descendant, ≥80ms après point J
[ ] Apparition à faible charge (<6 METS) ou FC basse
[ ] Persistance prolongée en récupération (>5min)
[ ] Douleur angineuse typique
[ ] Sus-décalage ST

CAPACITÉ FONCTIONNELLE:
___METS ou ___W
[ ] Excellente (>10 METS)
[ ] Bonne (7-10 METS)
[ ] Moyenne (4-7 METS)
[ ] Faible (<4 METS)

RÉPONSE HÉMODYNAMIQUE:
[ ] Normale: Augmentation TA et FC proportionnelles
[ ] Incompétence chronotrope: FC max <85% FMT sous bêtabloquants
[ ] Réponse tensionnelle inadaptée: Chute TA ou non-élévation

PRONOSTIC (si post-IDM):
[ ] Bon pronostic: Test négatif, Capacité >7 METS
[ ] Risque intermédiaire
[ ] Haut risque: Test positif précoce, Chute TA, Arythmies ventriculaires

CONCLUSION:
[ ] Test négatif: Probabilité faible de coronaropathie significative
[ ] Test positif: Ischémie myocardique à l''effort évoquée
  Territoire probable: Antérieur/Inférieur/Latéral
  Sévérité: Ischémie précoce (charge basse) / Ischémie tardive
[ ] Test douteux: Modifications limites, Corrélation clinique
[ ] Test non contributif: FC cible non atteinte

CONDUITE À TENIR:
[ ] Rassurer si test négatif
[ ] Coronarographie à discuter (si test positif, surtout si précoce)
[ ] Scintigraphie myocardique (si test douteux)
[ ] Écho-cardiographie de stress (alternative)
[ ] Optimisation traitement médical: Bêtabloquants, Statines, Antiagrégants
[ ] Modification facteurs de risque: Tabac, Diététique, Activité physique
[ ] Réépreuve dans ___ (si test non contributif)',

  'CONSIGNES:
[ ] Reprendre traitement habituel
[ ] Consultation cardiologie pour résultats
[ ] RDV: ___

Si douleur thoracique ou palpitations: Consulter urgence',

  '{}',
  '[{"code": "I20.9", "description": "Angine de poitrine"}, {"code": "Z01.8", "description": "Examen médical"}]'
),

-- Template: EEG
(
  'Électroencéphalogramme (EEG)',
  'Explorations Médicales',
  'Template pour électroencéphalogramme',
  true,
  'Indication:
[ ] Épilepsie (diagnostic, classification)
[ ] Première crise convulsive
[ ] Troubles de conscience
[ ] Encéphalopathie
[ ] Confusion, comportement anormal
[ ] Suivi traitement anti-épileptique
[ ] Sevrage médicamenteux',

  'CONDITIONS:
État de vigilance: [ ] Éveillé [ ] Somnolent [ ] Endormi
Coopération: [ ] Bonne [ ] Difficile [ ] Enfant agité
Privation sommeil: [ ] Non [ ] Oui (___h)
Traitement en cours: ___

Montage: 10-20 international
Électrodes: ___
Durée enregistrement: ___min

ACTIVITÉ DE FOND (État de veille):

RYTHME ALPHA POSTÉRIEUR:
[ ] Présent [ ] Absent
Fréquence: ___Hz (N: 8-12Hz, Adulte; 6-8Hz Enfant)
Amplitude: ___µV (N: 50-100µV)
Réactivité: [ ] Normale (disparaît yeux ouverts) [ ] Absente [ ] Réduite
Topographie: [ ] Occipitale bilatérale [ ] Asymétrie
Asymétrie: [ ] Non [ ] Oui (Droite/Gauche plus ample/rapide)

RYTHMES RAPIDES:
Activité bêta (13-30Hz):
[ ] Normale (frontale, amplitude modérée)
[ ] Excessive diffuse (effet médicamenteux: BZD, barbituriques)
[ ] Asymétrique

RYTHMES LENTS:

Activité thêta (4-7Hz):
[ ] Absente [ ] Physiologique (somnolence, enfant)
[ ] Pathologique: [ ] Focale (localisation: ___) [ ] Diffuse

Activité delta (<4Hz):
[ ] Absente
[ ] Présente: [ ] Focale (localisation: ___) [ ] Diffuse
  [ ] Continue [ ] Intermittente
  Signification: Souffrance cérébrale, Encéphalopathie

SYMÉTRIE:
[ ] Activité symétrique
[ ] Asymétrie: Hémisphère ___ (Plus lent/Amplitude réduite)

ÉPREUVES D''ACTIVATION:

HYPERPNÉE (HV):
Durée: 3-5min
[ ] Non réalisée
[ ] Réalisée:
  [ ] Ralentissement physiologique (normal chez enfant/ado)
  [ ] Bouffées d''ondes lentes bi-frontales (normal <20 ans)
  [ ] Anomalies paroxystiques: Pointes-ondes généralisées (Épilepsie absence)
  [ ] Aucune modification pathologique

STIMULATION LUMINEUSE INTERMITTENTE (SLI):
Fréquences testées: 1-30Hz
[ ] Non réalisée
[ ] Réalisée:
  [ ] Réponse d''entraînement physiologique (Following)
  [ ] Réponse photoparoxystique (RPP):
    [ ] Focale (occipitale, pariétale)
    [ ] Généralisée (polypointes-ondes, décharges)
    Seuil: ___Hz
    Avec manifestation clinique: [ ] Non [ ] Oui (Myoclonies, Absence)

SOMMEIL (si enregistré):
[ ] Endormissement obtenu
Stades: [ ] N1 [ ] N2 [ ] N3 (sommeil lent profond)
Grapho-éléments physiologiques:
  [ ] Pointes vertex (N1-N2)
  [ ] Fuseaux de sommeil (N2)
  [ ] Ondes lentes amples (N3)

Anomalies activées par sommeil: [ ] Non [ ] Oui (détailler)

ANOMALIES PAROXYSTIQUES:

ANOMALIES FOCALES:
[ ] Absentes
[ ] Présentes:
  Type: [ ] Pointes [ ] Ondes pointues [ ] Pointes-ondes [ ] Polypointes
  Localisation: [ ] Temporale [ ] Frontale [ ] Centrale [ ] Pariétale [ ] Occipitale
  Latéralisation: [ ] Droite [ ] Gauche [ ] Bilatérale
  Fréquence: Rare / Fréquente / Quasi-continue
  Activation par: [ ] Sommeil [ ] HV [ ] SLI
  Clinique associée: [ ] Non [ ] Oui (détailler: ___)

ANOMALIES GÉNÉRALISÉES:
[ ] Absentes
[ ] Présentes:
  Type:
    [ ] Pointes-ondes 3Hz (Épilepsie absence typique)
    [ ] Pointes-ondes lentes <3Hz (Lennox-Gastaut)
    [ ] Pointes-ondes rapides 4-6Hz (Absence atypique)
    [ ] Polypointes-ondes (Épilepsie myoclonique)
  Durée décharges: ___s
  Clinique associée:
    [ ] Absente (décharge infraclinique)
    [ ] Absence: Rupture contact, Automatismes
    [ ] Myoclonies
    [ ] Autre: ___

RALENTISSEMENT:

Focal:
[ ] Absent
[ ] Présent: Localisation ___, Continu/Intermittent
  Signification: Lésion structurelle, AVC, Tumeur, Infection

Diffus:
[ ] Absent
[ ] Présent: [ ] Léger [ ] Modéré [ ] Sévère
  Étiologie suspectée: Encéphalopathie métabolique, Toxique, Infectieuse, Dégénérative',

  'CONCLUSION:

ACTIVITÉ DE FOND:
[ ] Normale pour l''âge
[ ] Ralentie (diffuse/focale): ___
[ ] Asymétrie hémisphérique: ___
[ ] Désorganisée

ANOMALIES PAROXYSTIQUES:
[ ] Absentes
[ ] Pointes/Ondes pointues focales: Localisation ___
[ ] Décharges généralisées: Type ___, Durée ___s
[ ] Réponse photoparoxystique

DIAGNOSTIC EEG:

[ ] EEG normal
[ ] EEG épileptique:
  [ ] Foyer épileptogène: Localisation ___
    Compatible avec: Épilepsie partielle/focale
  [ ] Anomalies généralisées:
    [ ] Pointes-ondes 3Hz: Épilepsie absence (Petit mal)
    [ ] Polypointes-ondes: Épilepsie myoclonique juvénile
    [ ] Pointes-ondes lentes: Syndrome de Lennox-Gastaut
[ ] EEG non épileptique mais anormal:
  [ ] Ralentissement focal: Lésion structurelle suspectée
  [ ] Ralentissement diffus: Encéphalopathie
[ ] EEG douteux: Anomalies aspécifiques

CORRÉLATION CLINIQUE:

Cohérence avec clinique:
[ ] Anomalies EEG concordantes avec épilepsie clinique
[ ] Discordance: EEG normal malgré épilepsie clinique
  (Sensibilité EEG standard ~50%, Répéter si besoin)
[ ] Anomalies EEG sans épilepsie clinique (5-10% population)

RECOMMANDATIONS:

[ ] EEG normal: Rassurer si 1ère crise unique
[ ] EEG épileptique: Traitement anti-épileptique indiqué
  Molécules suggérées selon type: ___
[ ] EEG de contrôle à ___ (Surveillance traitement)
[ ] EEG prolongé ou Vidéo-EEG (si diagnostic incertain)
[ ] IRM cérébrale (si foyer focal, recherche lésion)
[ ] Bilan métabolique/infectieux (si encéphalopathie)
[ ] EEG de sommeil (si EEG veille normal, suspicion persiste)',

  'CONSIGNES:

Conduite automobile:
[ ] Autorisée (EEG normal, pas crise récente)
[ ] Contre-indiquée temporairement (Épilepsie active)
[ ] À discuter avec neurologue

Suivi:
Consultation neurologie: ___
EEG contrôle: ___ (surtout si traitement ou sevrage)',

  '{}',
  '[{"code": "G40.9", "description": "Épilepsie"}, {"code": "R56.0", "description": "Convulsions fébriles"}]'
);
