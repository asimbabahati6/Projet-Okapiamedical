/*
  # Templates d'Explorations Médicales - Partie 1

  1. Templates ajoutés
    - Endoscopie Digestive Haute (FOGD)
    - Coloscopie
    - Bronchoscopie
    - Échocardiographie

  2. Caractéristiques
    - Protocoles d'exploration systématique
    - Classifications internationales
    - Prélèvements et biopsies
    - Résultats détaillés
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

-- Template: FOGD
(
  'Endoscopie Digestive Haute (FOGD)',
  'Explorations Médicales',
  'Template pour fibroscopie œso-gastro-duodénale',
  true,
  'Indication:
[ ] Dyspepsie [ ] Hémorragie digestive [ ] Dépistage
[ ] Anémie [ ] Dysphagie [ ] Douleur épigastrique

Symptômes:
[ ] Pyrosis [ ] Régurgitations [ ] Nausées
[ ] Hématémèse [ ] Melaena [ ] Amaigrissement',

  'PRÉPARATION: Jeûne 6h, Consentement signé

PRÉMÉDICATION:
Anesthésie pharyngée: Xylocaïne spray
Sédation: Midazolam ___mg IV

ŒSOPHAGE (Distance AD-cardia: ___cm):
[ ] Muqueuse: Normale/Inflammée
[ ] Z-line: ___cm
[ ] Œsophagite Los Angeles: Grade A/B/C/D
[ ] Barrett: Non/Oui (___cm)
[ ] Varices: Grade 1/2/3, Signes rouges: Oui/Non

ESTOMAC:
[ ] Fundus/Corps/Antre: Normal/Lésion
[ ] Plis: Normaux/Hypertrophiés
[ ] Gastrite: Absente/Érythémateuse/Érosive
[ ] Ulcère: Localisation ___, Taille ___mm
  Classification Forrest: Ia/Ib/IIa/IIb/IIc/III
[ ] Polype: Nombre ___, Taille ___mm

DUODÉNUM:
[ ] D1 (bulbe): Normal/Ulcère
[ ] D2: Normal/Lésion
[ ] Papille: Normale

Test H. pylori: [ ] Non fait [ ] Positif [ ] Négatif

BIOPSIES:
Antre (2): [ ] Fait
Corps (2): [ ] Fait
Autres: ___',

  'DIAGNOSTIC:
[ ] Normal
[ ] Œsophagite grade ___
[ ] Barrett ___cm
[ ] Varices grade ___
[ ] Gastrite
[ ] Ulcère gastrique/duodénal
[ ] H. pylori +/-
[ ] Polypes
[ ] Tumeur suspecte

GESTES: Biopsies ___, Polypectomie, Hémostase

COMPLICATIONS: [ ] Aucune [ ] Désaturation

TRAITEMENT:
[ ] IPP: ___ (dose: ___)
[ ] Éradication H. pylori (si +)
[ ] Surveillance à: ___',

  'Jeûne 1h post-examen
Pas de conduite 2h
Résultats biopsies: 2-3 semaines
Contrôle: ___',

  '{}',
  '[{"code": "K21.0", "description": "RGO avec œsophagite"}, {"code": "K29.0", "description": "Gastrite"}]'
),

-- Template: Coloscopie  
(
  'Coloscopie',
  'Explorations Médicales',
  'Template pour exploration endoscopique colique',
  true,
  'Indication:
[ ] Dépistage >50 ans [ ] Hemoccult + [ ] Rectorragies
[ ] Troubles transit [ ] Anémie [ ] ATCD familial
[ ] Surveillance polypes/MICI',

  'PRÉPARATION: Score Boston ___/9
Excellente (8-9) / Bonne (6-7) / Moyenne (4-5) / Insuffisante (<4)

SÉDATION:
[ ] Consciente: Midazolam ___mg + Fentanyl ___µg
[ ] Profonde: Propofol

PROGRESSION:
[ ] Rectum > Sigmoïde > Descendant
[ ] Angle gauche > Transverse > Angle droit
[ ] Ascendant > Cæcum: [ ] Atteint (valvule visible)
[ ] Iléon: [ ] Intubé (___cm)

Durée: ___min

MUQUEUSE:
[ ] Normale
[ ] Diverticules: Localisation ___, Nombre ___
[ ] Mélanose colique

POLYPES (Classification Paris):
Polype 1:
Localisation: ___
Taille: ___mm
Morphologie: Ip/Is/IIa/IIb/IIc
Aspect: Régulier/Irrégulier/Villeux
Geste: [ ] Polypectomie [ ] Biopsie
Récupération: [ ] Oui [ ] Non

TUMEUR:
[ ] Absente
[ ] Présente: Localisation ___, Taille ___cm
  Aspect: Ulcéré/Sténosant/Végétant
  Franchissable: Oui/Non
  Biopsies: [ ] Faites (nombre: ___)
  Tatouage: [ ] Fait

MICI:
[ ] Aspect normal
[ ] RCH suspectée: Mayo Grade 0/1/2/3
  Extension: Rectite/Colite gauche/Pancolite
[ ] Crohn suspecté: Ulcérations, Pavé
  Localisation: ___

BIOPSIES ÉTAGÉES:
Rectum/Sigmoïde/Descendant/Transverse/Ascendant/Cæcum/Iléon',

  'DIAGNOSTIC:
[ ] Normal
[ ] Diverticulose
[ ] Polypes: ___ (max ___mm)
[ ] Tumeur suspecte
[ ] MICI (RCH/Crohn)

GESTES: Polypectomies ___, Biopsies ___, Tatouage

COMPLICATIONS:
[ ] Aucune [ ] Hémorragie minime [ ] Perforation

SURVEILLANCE:
Polypes <10mm, <3: Contrôle 5-10 ans
Polypes ≥10mm ou ≥3: Contrôle 3 ans
MICI: Traitement spécifique

Contrôle à: ___',

  'Alimentation légère J0
Surveiller saignement rectal minime (normal)
Douleur abdominale intense ou fièvre: Urgence
Pas conduite 2h

Résultats: 2-3 semaines
Consultation: ___',

  '{}',
  '[{"code": "K63.5", "description": "Polype du côlon"}, {"code": "K51.9", "description": "Rectocolite hémorragique"}]'
),

-- Template: Bronchoscopie
(
  'Bronchoscopie',
  'Explorations Médicales',
  'Template pour endoscopie bronchique',
  true,
  'Indication:
[ ] Hémoptysie [ ] Tumeur suspectée
[ ] Infection/Tuberculose [ ] Dyspnée
[ ] Anomalie radiologique [ ] LBA diagnostic
[ ] Corps étranger [ ] Surveillance',

  'PRÉPARATION: Jeûne 6h, Consentement signé

Voie: [ ] Nasale [ ] Orale [ ] Trachéotomie

ANESTHÉSIE LOCALE:
Xylocaïne spray + Lidocaïne nébulisée 2%
Instillations: ___ml total
Sédation: Midazolam ___mg (si besoin)
O2: ___L/min

LARYNX:
[ ] Cordes vocales: Normales/Immobilité
[ ] Sous-glotte: Normale/Sténose

TRACHÉE:
[ ] Muqueuse: Normale/Inflammée
[ ] Paroi: Normale/Malacique
[ ] Carène: Normale/Élargie (angle: ___°)

BRONCHE SOUCHE DROITE:
[ ] Perméable/Sténose ___%
[ ] Muqueuse: Normale/Inflammée/Tumorale
[ ] Sécrétions: Absentes/Claires/Purulentes/Hémorragiques

Lobaires D: [ ] Sup [ ] Moyen [ ] Inf

BRONCHE SOUCHE GAUCHE:
[ ] Perméable/Sténose ___%

Lobaires G: [ ] Sup (culmen+lingula) [ ] Inf

LÉSIONS:

TUMEUR:
[ ] Absente
[ ] Présente: Localisation ___
  Type: Endoluminale/Infiltrante/Extrinsèque
  Sténose: ___%
  Biopsies: [ ] Faites (nombre: ___)

INFLAMMATION:
[ ] Bronchite [ ] Sécrétions purulentes
[ ] Aspect évocateur tuberculose

STÉNOSE: Localisation ___, ___%

CORPS ÉTRANGER: [ ] Non [ ] Oui (extraction: ___)

PRÉLÈVEMENTS:

Biopsies: Nombre ___, Localisation ___
Brossage: [ ] Fait (localisation: ___)
LBA: [ ] Fait
  Lobe: ___, Volume: ___ml
  Récupéré: ___ml, Aspect: ___
  Envoi: Bactério (BK, fongique), Cytologie',

  'DIAGNOSTIC:
[ ] Normal
[ ] Tumeur bronchique (localisation: ___)
[ ] Bronchite purulente
[ ] Tuberculose suspectée
[ ] Sténose ___%
[ ] Hémoptysie sans lésion

COMPLICATIONS:
[ ] Aucune [ ] Désaturation
[ ] Hémorragie: Minime/Modérée
[ ] Bronchospasme [ ] Pneumothorax

TRAITEMENT:
Attente résultats:
Anatomopath: 1 semaine
Bactério: 48h-3 semaines (BK)

Conduite:
[ ] Scanner thoracique
[ ] TEP-scanner
[ ] RCP
[ ] ATB: ___',

  'Jeûne 2h post-examen
Pas conduite 2h
Hémoptysie minime normale 24h
Douleur thoracique/dyspnée: Urgence

Résultats: ___
Consultation: ___',

  '{}',
  '[{"code": "J18.9", "description": "Pneumonie"}, {"code": "C34.9", "description": "Tumeur maligne bronche"}]'
),

-- Template: Échocardiographie
(
  'Échocardiographie',
  'Explorations Médicales',
  'Template pour examen échographique cardiaque',
  true,
  'Indication:
[ ] Dyspnée [ ] Souffle [ ] IC [ ] Douleur thoracique
[ ] Valvulopathie [ ] HTA [ ] Bilan pré-op',

  'Qualité: Bonne / Moyenne / Limitée

VENTRICULE GAUCHE:
DTD: ___mm (N: 42-59mm H, 39-53mm F)
DTS: ___mm (N: 25-40mm H, 22-35mm F)
Septum: ___mm (N <11mm, HVG si >12mm)
Paroi post: ___mm (N <11mm)

VTD: ___ml, VTS: ___ml

FEVG (Simpson): ___%
[ ] Normale ≥50%
[ ] Légère 40-49%
[ ] Modérée 30-39%
[ ] Sévère <30%

Cinétique:
[ ] Normokinésie globale
[ ] Hypokinésie: Segment(s) ___
[ ] Akinésie: Segment(s) ___
Territoire: [ ] Antérieur (IVA) [ ] Inférieur (CD) [ ] Latéral (Cx)

FONCTION DIASTOLIQUE:
E: ___cm/s, A: ___cm/s, E/A: ___
e'' septal: ___cm/s, e'' latéral: ___cm/s
E/e'': ___ (N <14)
[ ] Normal [ ] Trouble relaxation [ ] Pseudonormal [ ] Restrictif

OREILLETTE GAUCHE:
Surface: ___cm² (N <20cm²)
Volume indexé: ___ml/m² (N <34ml/m²)

VENTRICULE DROIT:
Diamètre: ___mm (N <42mm)
TAPSE: ___mm (N >16mm)
Fonction: Normale / Altérée

VALVE MITRALE:
Morphologie: Normale/Épaissie/Calcifiée/Prolapsus
IM: [ ] Absente [ ] Minime [ ] Modérée [ ] Sévère
RM: Surface ___cm² (N 4-6cm²), Gradient moy: ___mmHg

VALVE AORTIQUE:
Morphologie: Tricuspide/Bicuspide, Calcifiée: Oui/Non
IA: [ ] Absente [ ] Minime [ ] Modérée [ ] Sévère
RA: Gradient max ___mmHg, Gradient moy ___mmHg
    Surface ___cm² (Serré si <1cm²)

VALVE TRICUSPIDE:
IT: [ ] Absente [ ] Minime [ ] Modérée [ ] Sévère
PAPS: ___mmHg (N <35mmHg, HTAP si >45mmHg)

PÉRICARDE:
[ ] Normal [ ] Épanchement: Minime/Modéré/Abondant (___mm)

AORTE:
Racine: ___mm (N <37mm)
Ascendante: ___mm (N <40mm)',

  'CONCLUSIONS:

FEVG: ___% (Normale/Altérée)
Cinétique: Normale/Trouble segmentaire ___

Fonction diastolique: Normale/Grade I/II/III

VALVES:
IM: Grade ___, Mécanisme: ___
RA: Gradient ___mmHg, Surface ___cm²
IA: Grade ___
IT: Grade ___, PAPS ___mmHg

CAVITÉS:
OG: Normale/Dilatée
VG: Normal/Dilaté/HVG
VD: Normal/Dilaté

DIAGNOSTIC: _______________________

Surveillance à: ___',

  'Corrélation clinique nécessaire

Contrôle écho:
Valvulopathie sévère: 6-12 mois
Valvulopathie modérée: 1-2 ans
FEVG altérée: 3-6 mois',

  '{}',
  '[{"code": "I50.9", "description": "Insuffisance cardiaque"}, {"code": "I34.0", "description": "Insuffisance mitrale"}]'
);
