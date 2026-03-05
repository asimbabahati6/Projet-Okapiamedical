/*
  # Templates de Dentisterie

  1. Templates ajoutés
    - Consultation Dentaire Générale
    - Soins Conservateurs
    - Chirurgie Dentaire
    - Orthodontie

  2. Caractéristiques
    - Formule dentaire complète
    - Schémas de notation FDI
    - Plans de traitement détaillés
    - Soins bucco-dentaires professionnels
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

-- Template: Consultation Dentaire Générale
(
  'Consultation Dentaire Générale',
  'Dentisterie',
  'Template pour examen bucco-dentaire complet avec formule dentaire',
  true,
  'Motif: □ Douleur □ Contrôle □ Détartrage □ Première consultation

Localisation douleur (si applicable): _______________________

ATCD dentaires:
□ Caries traitées
□ Extractions
□ Orthodontie
□ Prothèses
□ Soins parodontaux',

  'EXAMEN EXOBUCCAL:
□ Symétrie faciale: Normale/Asymétrie
□ ATM: Normal/Craquements/Douleur
□ Ganglions: Normaux/Adénopathies

EXAMEN ENDOBUCCAL:

Muqueuses:
□ Gingivale: Normale/Inflammation/Saignement
□ Jugale: Normale/Lésion
□ Linguale: Normale/Lésion
□ Palais: Normal/Lésion

Hygiène:
□ Plaque: Absente/Légère/Modérée/Importante
□ Tartre: Absent/Supragingival/Sous-gingival
□ Indice de plaque: ___/3

Occlusion:
□ Classe I d''Angle
□ Classe II d''Angle (division 1/2)
□ Classe III d''Angle
□ Surplomb (overjet): ___mm
□ Recouvrement (overbite): ___mm

Parodonte:
□ Gingivite: Absente/Légère/Modérée/Sévère
□ Poches parodontales: <3mm / 4-5mm / >6mm
□ Mobilité dentaire: Absente/Grade 1/2/3
□ Récessions gingivales: Absentes/Présentes

FORMULE DENTAIRE (Adulte 18-48):

Maxillaire (Haut):
18: □S □C □O □A □Cr □Br □I  |  17: □  |  16: □  |  15: □  |  14: □  |  13: □  |  12: □  |  11: □
21: □  |  22: □  |  23: □  |  24: □  |  25: □  |  26: □  |  27: □  |  28: □

Mandibule (Bas):
48: □  |  47: □  |  46: □  |  45: □  |  44: □  |  43: □  |  42: □  |  41: □
31: □  |  32: □  |  33: □  |  34: □  |  35: □  |  36: □  |  37: □  |  38: □

Légende:
S=Saine, C=Cariée, O=Obturée, A=Absente, Cr=Couronne, Br=Bridge, I=Implant

Détail des caries/lésions:
Dent ___ : Classe ___ de Black, Face: Occlusal/Vestibulaire/Linguale/Proximale
Dent ___ : _______________________
Dent ___ : _______________________

RADIOGRAPHIES:
□ Panoramique: Date ___
□ Rétro-alvéolaires: Secteur ___
Constatations: _______________________',

  'PLAN DE TRAITEMENT:

Urgences:
□ Aucune
□ Pulpite: Dent ___
□ Abcès: Dent ___
□ Extraction: Dent ___

Soins conservateurs:
□ Détartrage complet
□ Obturations: Dents ___, ___, ___
□ Traitements canalaires: Dents ___, ___

Soins parodontaux:
□ Surfaçage radiculaire
□ Curetage
□ Chirurgie parodontale

Prothèses:
□ Couronne: Dent ___
□ Bridge: ___ à ___
□ Prothèse partielle/complète

Orthodontie:
□ Consultation orthodontique

Prévention:
□ Enseignement brossage
□ Conseils alimentaires
□ Fluoration

PRESCRIPTIONS:
□ Bain de bouche: ___ (___x/j)
□ Autre: ___

Prochain RDV: ___',

  'CONSEILS:
□ Brossage 2-3x/jour (2-3min)
□ Fil dentaire quotidien
□ Bain de bouche si prescrit
□ Éviter grignotage sucré
□ Consultation 1-2x/an

Coût estimatif: _______________________',

  '{}',
  '[{"code": "K02.9", "description": "Carie dentaire"}, {"code": "K05.1", "description": "Gingivite chronique"}]'
),

-- Template: Soins Conservateurs
(
  'Soins Conservateurs Dentaires',
  'Dentisterie',
  'Template pour obturations et restaurations dentaires',
  true,
  'Dent traitée: Numérotation FDI ___

Type de soin:
□ Carie superficielle
□ Carie moyenne
□ Carie profonde
□ Remplacement obturation

Symptômes préalables:
□ Douleur au chaud/froid
□ Douleur à la mastication
□ Sensibilité
□ Asymptomatique',

  'EXAMEN CLINIQUE:

Dent ___ :
□ Carie: Classe ___ de Black
  Faces atteintes: □ Occlusale □ Vestibulaire □ Linguale □ Mésiale □ Distale
□ Profondeur: Superficielle/Moyenne/Profonde
□ Vitalité pulpaire: □ Normale (test au froid +)
□ Percussion: □ Négative □ Positive
□ Palpation: □ Négative □ Positive

Test diagnostic:
□ Sonde exploratrice: Cavité détectée
□ Test thermique froid: Réponse normale/Exagérée/Absente
□ Radiographie: Étendue carie ___

ANESTHÉSIE:

Type: □ Locale infiltration □ Tronculaire
Produit: □ Articaïne 1/200000 □ Lidocaïne 1/100000
Dose: ___ml (___carpules)
Site: _______________________
Efficacité: □ Bonne □ Complète après ___min

ISOLATION:

□ Digue en caoutchouc (idéal)
□ Rouleaux de coton
□ Aspiration chirurgicale

PRÉPARATION CAVITAIRE:

Fraisage:
□ Élimination tissu carié
□ Préparation des parois
□ Biseautage des bords (si composite)

Nettoyage:
□ Rinçage eau/air
□ Désinfection cavitaire (chlorhexidine si profond)
□ Séchage

Protection pulpaire (si carie profonde):
□ Fond cavitaire: Hydroxyde de calcium/Verre ionomère
□ Base: Verre ionomère

RESTAURATION:

Matériau: □ Composite photopolymérisable □ Amalgame □ Verre ionomère

Si COMPOSITE:
□ Mordançage acide phosphorique 37%: ___s
□ Rinçage et séchage
□ Adhésif: ___ (marque)
□ Photopolymérisation: ___s
□ Composite: Teinte ___ (échelle Vita)
□ Technique couches successives (max 2mm)
□ Photopolymérisation chaque couche: ___s

Si AMALGAME:
□ Matrice et coin interdentaire
□ Condensation amalgame
□ Modelage anatomique

FINITION:

□ Retrait digue
□ Contrôle occlusion (papier à articuler)
□ Ajustement hauteur
□ Polissage: □ Immédiat (composite) □ J+1 (amalgame)
□ Contrôle radiographique final (si proximal)',

  'RÉSULTAT:

□ Obturation satisfaisante
□ Occlusion équilibrée
□ Contours adaptés
□ Pas de surplomb

RECOMMANDATIONS:

□ Attendre fin anesthésie avant manger (2-3h)
□ Éviter aliments durs pendant 24h
□ Mastication du côté opposé pendant 24h (si amalgame)
□ Sensibilité transitoire possible (chaud/froid) 1-2 semaines
□ Consulter si douleur persistante >3 jours

Analgésiques:
□ Paracétamol 1g si besoin
□ Autre: ___

Contrôle à: ___

Pronostic:
□ Excellent
□ Bon (surveiller évolution si carie profonde)
□ Réservé (risque atteinte pulpaire)',

  'COMPLICATIONS POSSIBLES:
□ Sensibilité post-opératoire
□ Atteinte pulpaire différée (nécessiterait traitement canalaire)
□ Fracture de restauration
□ Carie secondaire

Durée de vie obturation:
□ Composite: 5-10 ans
□ Amalgame: 10-15 ans

Coût: ___',

  '{}',
  '[{"code": "K02.1", "description": "Carie de la dentine"}]'
),

-- Template: Chirurgie Dentaire
(
  'Chirurgie Dentaire',
  'Dentisterie',
  'Template pour extractions dentaires simples et chirurgicales',
  true,
  'Type: □ Extraction simple □ Extraction chirurgicale □ Dent de sagesse

Dent: Numérotation FDI ___
Position: Maxillaire/Mandibule, Secteur ___

Indication:
□ Carie non restaurable
□ Péricoronarite
□ Dent incluse/enclavée
□ Fracture radiculaire
□ Mobilité terminale (parodontite)
□ Orthodontique
□ Infectieuse (abcès)
□ Autre: ___',

  'EXAMEN PRÉ-OPÉRATOIRE:

Dent ___ :
□ Mobilité: Grade 0/1/2/3
□ Percussion: Négative/Positive
□ Palpation: Négative/Tuméfaction/Abcès
□ Gencive: Normale/Inflammée/Infection

Radiographie:
□ Panoramique
□ Rétro-alvéolaire
Constatations:
□ Racines: Nombre ___, Forme: Droite/Courbe/Divergente
□ Rapport nerf alvéolaire (si 38/48): Distance ___mm
□ Rapport sinus (si molaire sup): ___
□ Ankylose osseuse: □ Non □ Suspectée
□ Lyse osseuse péri-apicale: □ Non □ Oui

État général:
□ Pas de contre-indication
□ Traitement anticoagulant: □ Non □ Oui (INR: ___)
□ Diabète: □ Non □ Oui (équilibré/non équilibré)
□ Antibioprophylaxie nécessaire: □ Non □ Oui

ANESTHÉSIE:

Type:
□ Locale infiltration
□ Loco-régionale (bloc mandibulaire pour mandibule)

Produit: □ Articaïne 1/200000 □ Lidocaïne 1/100000
Dose: ___ml (___carpules)

Sites injection:
□ Vestibulaire
□ Palatine/Linguale
□ Bloc alvéolaire inférieur (si mandibule)

Délai action: ___min
Efficacité: □ Complète

TECHNIQUE CHIRURGICALE:

EXTRACTION SIMPLE:
□ Syndesmotome: Section ligament
□ Élévateur: Mobilisation
□ Davier: Type ___, Prise satisfaisante
□ Luxation: Mouvements contrôlés
□ Extraction: □ Dent entière □ Fragments

EXTRACTION CHIRURGICALE:
□ Incision: Intrasulculaire + décharge
□ Décollement lambeau muco-périosté
□ Alvéolectomie: Fraisage os vestibulaire
□ Odontosection (si dent incluse):
  Séparation couronne-racines
  Section racines si multi-radiculée
□ Extraction fragments
□ Curetage alvéolaire
□ Régularisation bords osseux
□ Irrigation sérum physiologique
□ Sutures: Fil résorbable/non résorbable ___/0
  Nombre de points: ___

HÉMOSTASE:

□ Compression: Compresse mordue ___min
□ Matériel hémostatique: □ Non □ Oui (Surgicel/Coalgan)
□ Hémostase satisfaisante',

  'POST-OPÉRATOIRE:

PRESCRIPTIONS:

Antalgiques:
□ Paracétamol 1g x4/jour pendant 3j
□ AINS: Ibuprofène 400mg x3/jour pendant 3j
□ Palier 2 si besoin: ___ (dose: ___)

Anti-inflammatoires (si indication):
□ Prednisolone 20mg/j pendant 3j

Antibiotiques (si indication):
□ Amoxicilline 1g x3/jour pendant 7j
□ Métronidazole 500mg x3/jour pendant 7j
□ Alternative allergie: ___

Bain de bouche:
□ Chlorhexidine 0.12% x3/jour après 24h, pendant 7j

CONSIGNES:

Premières 24 heures:
□ Compresse mordue 30min
□ Glace externe: 10min/h pendant 6h
□ Pas de bain de bouche
□ Pas de rinçage vigoureux
□ Alimentation froide/tiède
□ Éviter côté opéré

Jours suivants:
□ Brossage doux (éviter zone opérée pendant 3j)
□ Bain de bouche chlorhexidine à partir J+1
□ Alimentation molle pendant 3-5j
□ Éviter aliments durs, épicés
□ Pas de tabac pendant 48h (retard cicatrisation)
□ Pas d''alcool pendant 24h
□ Pas d''effort physique intense 48h

Signes normaux:
□ Saignement léger 1-2h
□ Douleur modérée 2-3j
□ Œdème J+2/J+3 (maximum)
□ Trismus (difficulté ouverture bouche) si chirurgical

SIGNES D''ALERTE (nécessitant consultation):
□ Saignement abondant persistant
□ Douleur intense non calmée
□ Fièvre >38.5°C
□ Œdème croissant après J+3
□ Alvéolite (douleur intense J+3-J+5)

Sutures (si non résorbables):
□ Retrait à: J+7-J+10

Contrôle: J+7

Pronostic:
□ Cicatrisation normale attendue
□ Surveillance (terrain fragile)',

  'COMPLICATIONS POSSIBLES:
□ Alvéolite sèche (2-5%)
□ Hémorragie retardée
□ Infection
□ Paresthésie (si 38/48 proche nerf)
□ Communication bucco-sinusienne (molaire sup)

Durée arrêt travail (si nécessaire): ___j

Coût: ___',

  '{}',
  '[{"code": "K04.7", "description": "Abcès périapical"}, {"code": "K08.1", "description": "Perte de dents"}]'
),

-- Template: Orthodontie
(
  'Consultation Orthodontique',
  'Dentisterie',
  'Template pour évaluation orthodontique et plan de traitement',
  true,
  'Âge: ___ ans (□ Enfant □ Adolescent □ Adulte)

Motif:
□ Esthétique
□ Fonctionnel (mastication, élocution)
□ Pré-prothétique
□ Préconisation orthodontiste

Plainte principale: _______________________',

  'ANALYSE FACIALE:

Vue de face:
□ Symétrie: Normale/Asymétrie
□ Proportions: Harmonieuses/Étage inférieur augmenté/diminué
□ Ligne médiane faciale: Centrée/Déviée

Vue de profil:
□ Profil: Droit/Convexe/Concave
□ Angle naso-labial: Normal/Augmenté/Diminué
□ Menton: Normal/Fuyant/Proéminent

Sourire:
□ Ligne du sourire: Haute/Moyenne/Basse
□ Corridor buccal: Normal/Important
□ Exposition gingivale: Normale/>3mm (gummy smile)

ANALYSE DENTAIRE:

Articulé:
□ Classe molaire d''Angle:
  Droite: Classe I/II/III
  Gauche: Classe I/II/III
□ Classe canine:
  Droite: Classe I/II/III
  Gauche: Classe I/II/III

Surplomb (overjet):
□ Normal (2-3mm)
□ Augmenté: ___mm (promandibulie)
□ Réduit/inversé: ___mm (prognathie)

Recouvrement (overbite):
□ Normal (2-3mm)
□ Augmenté: ___mm (supraclusion)
□ Réduit/béance: ___mm

Ligne médiane dentaire:
□ Maxillaire: Centrée/Déviée à droite/gauche (___mm)
□ Mandibulaire: Centrée/Déviée à droite/gauche (___mm)
□ Coïncidence lignes médianes: □ Oui □ Non

Encombrement:
□ Maxillaire: Absent/Léger (<4mm)/Modéré (4-8mm)/Sévère (>8mm)
□ Mandibule: Absent/Léger/Modéré/Sévère

Diastèmes:
□ Absents
□ Présents: Localisation ___, Taille ___mm

Malpositions individuelles:
□ Rotations: Dents ___
□ Versions: Dents ___
□ Infraclusion/Supraclusion: Dents ___
□ Transpositions: Dents ___

Articulé transversal:
□ Normal
□ Endoalvéolie maxillaire (maxillaire étroit)
□ Occlusion croisée: Unilatérale/Bilatérale, Dents ___

Absences dentaires:
□ Agénésies: Dents ___
□ Extractions antérieures: Dents ___

Dents surnuméraires: □ Non □ Oui (dents ___)

ANALYSES COMPLÉMENTAIRES:

Radiographie panoramique:
□ Toutes les dents présentes
□ Dents en évolution: ___
□ Dents incluses: ___
□ Agénésies: ___
□ Dilacérations radiculaires: ___

Téléradiographie de profil:
□ Réalisée: Date ___
Tracés céphalométriques:
□ SNA (position maxillaire): ___° (N=82°)
□ SNB (position mandibule): ___° (N=80°)
□ ANB (relation maxillo-mandibulaire): ___° (N=2°)
  □ Classe I squelettique (ANB 0-4°)
  □ Classe II squelettique (ANB >4°)
  □ Classe III squelettique (ANB <0°)

Modèles d''étude:
□ Empreintes alginate
□ Moulages en plâtre
□ Scan intra-oral (si disponible)',

  'DIAGNOSTIC ORTHODONTIQUE:

Classe d''Angle: ___ (dentoalvéolaire)
Classe squelettique: ___ (céphalométrie)

Dysmorphose:
□ Encombrement
□ Diastèmes
□ Béance
□ Supraclusion
□ Occlusion croisée
□ Promandibulie/Prognathie
□ Asymétrie

Étiologie:
□ Héréditaire
□ Fonctionnelle (succion pouce, déglutition atypique)
□ Agénésies
□ Autre: ___

PLAN DE TRAITEMENT:

Phase 1 - Interception (si enfant):
□ Éducation fonctionnelle
□ Appareil amovible
□ Expansion maxillaire (quad-helix, disjoncteur)
□ Masque de Delaire (si Classe III)
Durée: ___mois

Phase 2 - Traitement actif:
□ Extractions nécessaires:
  Dents de sagesse: □ Oui □ Non
  Prémolaires: □ Oui (dents ___) □ Non
  Autres: ___

□ Appareillage fixe (brackets):
  Type: □ Métalliques □ Céramiques □ Linguaux
  Technique: □ Conventionnelle □ Auto-ligaturants
□ Gouttières transparentes (Invisalign):
  Nombre gouttières: ___

Objectifs:
□ Correction articulé
□ Alignement
□ Nivellement
□ Fermeture espaces
□ Détorsion
□ Coordination arcades
□ Finitions

Durée estimée: ___mois (12-24 mois typique)

Phase 3 - Contention:
□ Fil collé lingual (6-6)
□ Gouttières nocturnes
□ Plaque de Hawley
Durée: ___ans (minimum 2 ans)

Chirurgie orthognathique (si indication):
□ Non nécessaire
□ À envisager si: ___

Cas complexe nécessitant avis pluridisciplinaire:
□ Parodontiste
□ Chirurgien maxillo-facial
□ ORL

PRONOSTIC:

□ Excellent
□ Bon (coopération patient requise)
□ Réservé (complexité, âge, parodonte)

Coopération nécessaire:
□ Port appareils amovibles: 20h/j
□ Élastiques: Selon prescription
□ Hygiène rigoureuse
□ RDV réguliers (toutes les 4-8 semaines)

Risques/Complications:
□ Résorptions radiculaires
□ Décalcifications (caries)
□ Récidive (nécessite contention)
□ Résultat non optimal si non coopération',

  'DEVIS:

Phase 1 (si applicable): ___
Phase 2 (appareil): ___
Contention: ___
Total: ___

Prise en charge:
□ Sécurité sociale (si <16 ans): 193.50€/semestre
□ Mutuelle: Variable selon contrat
□ Reste à charge: ___

Début traitement: ___
Prochaine consultation: ___',

  '{}',
  '[{"code": "K07.3", "description": "Anomalies de position des dents"}]'
);
