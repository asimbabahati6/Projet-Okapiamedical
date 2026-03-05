/*
  # Templates de Radiologie Interventionnelle

  1. Templates ajoutés
    - Biopsie Guidée par Imagerie
    - Embolisation Thérapeutique
    - Drainage Percutané Guidé
    - Sclérothérapie des Varices

  2. Caractéristiques
    - Protocoles de préparation
    - Technique procédurale détaillée
    - Surveillance post-procédure
    - Consignes et complications
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

-- Template: Biopsie Guidée
(
  'Biopsie Guidée',
  'Radiologie Interventionnelle',
  'Template pour biopsies percutanées échoguidées ou scannoguidées',
  true,
  'Type: □ Échoguidée □ Scannoguidée □ Fluoroguidée

Organe cible: □ Foie □ Rein □ Poumon □ Thyroïde □ Sein □ Ganglion □ Autre: ___

Indication: □ Nodule suspect □ Masse □ Lésion indéterminée

Taille lésion: ___mm',

  'PRÉPARATION:
Bilan:
□ Plaquettes: ___/mm³ (>50000)
□ TP: ___% (>60%), INR: ___ (<1.5)
□ TCA: ___s
□ Arrêt anticoagulants: ___j

Consentement: □ Signé
Jeûne: □ 6h respectées

Prémédication:
□ Anxiolytique: ___ (dose: ___)
□ Analgésique: ___ (dose: ___)

ANESTHÉSIE:
Type: □ Locale □ Sédation

Anesthésique: □ Lidocaïne □ Ropivacaïne
Concentration: ___%,  Volume: ___ml

TECHNIQUE:
Guidage: □ Écho (___MHz) □ Scanner (___mm)

Position: □ Décubitus dorsal □ Latéral □ Procubitus

Asepsie: □ Champ stérile □ Désinfection

Aiguille: □ Fine (FNAC) □ Core biopsie
Calibre: ___G, Longueur: ___cm

DÉROULEMENT:
Repérage:
Localisation: _______________________
Distance peau-lésion: ___cm
Structures à éviter: _______________________

Passages: ___
□ Passage 1: Satisfaisant
□ Passage 2: Satisfaisant
□ Passage 3: Satisfaisant

Prélèvements:
□ Carottes: ___mm longueur
□ Aspect: Satisfaisant/Insuffisant
□ Nombre: ___

Envoi:
□ Anatomopathologie (formol)
□ Bactériologie
□ Cytologie

Contrôle post-procédure:
□ Imagerie de contrôle
□ Absence complication
□ Hémostase satisfaisante',

  'COMPLICATIONS:
□ Aucune
□ Douleur: EVA ___/10
□ Hématome: Minime/Modéré/Important
□ Pneumothorax: ___% (si pulmonaire)
  Drainage: □ Non □ Oui
□ Hémorragie
□ Malaise vagal
□ Autre: ___

SURVEILLANCE (___h):
T0: TA ___/___, FC ___, SpO2 ___%
T+1h: TA ___/___, FC ___, SpO2 ___%
T+2h: TA ___/___, FC ___, SpO2 ___%
T+4h: TA ___/___, FC ___, SpO2 ___%

Pansement: □ Sec □ Taché □ Sanglant

Autorisation sortie: □ Oui □ Non',

  'CONSIGNES POST-PROCÉDURE:

Repos 24h, pas d''efforts 48h

Signes d''alerte:
□ Douleur intense
□ Hématome qui s''étend
□ Fièvre >38.5°C
□ Dyspnée (si thoracique)

Antalgiques: Paracétamol 1g/6h

Pansement: Retrait J+2

Résultats anatomopath: ___j
Consultation: ___',

  '{}',
  '[{"code": "Z12.0", "description": "Dépistage tumeur"}, {"code": "D12.6", "description": "Tumeur bénigne"}]'
),

-- Template: Embolisation
(
  'Embolisation Thérapeutique',
  'Radiologie Interventionnelle',
  'Template pour procédures d''embolisation artérielle ou veineuse',
  true,
  'Type: □ Artérielle □ Veineuse

Indication:
□ Hémorragie active (localisation: ___)
□ Embolisation tumorale pré-op
□ Malformation artério-veineuse
□ Varicocèle
□ Fibrome utérin
□ Autre: ___

Urgence: □ Oui □ Non',

  'PRÉPARATION:
Bilan:
□ Groupe: ___, Hb: ___g/dl
□ Plaquettes: ___
□ Créatinine: ___µmol/L, DFG: ___
□ TP: ___%, INR: ___, TCA: ___s

Hydratation: VVP, SF ___ml/h

Prémédication:
□ Antibioprophylaxie: ___
□ Antalgique: ___
□ Sédation: □ Non □ Légère □ Profonde

ANESTHÉSIE:
□ Locale + Sédation
□ Générale

TECHNIQUE:
Accès: □ Artère fémorale D/G □ Radiale
Introducteur: ___F

Cathétérisme:
Cathéter: Type ___, Taille ___F
Artériographie initiale: □ Réalisée

ARTÉRIOGRAPHIE:
Territoire: _______________________
Vaisseau cible: _______________________
Branches collatérales: _______________________

Pour HÉMORRAGIE:
□ Saignement actif (extravasation)
□ Faux anévrisme
Localisation: _______________________

Pour TUMEUR:
□ Hypervascularisation
□ Vascularisation: _______________________
□ Taille: ___cm

EMBOLISATION:
Cathétérisme sélectif: □ Réalisé

Agent embolisant:
□ Coils: Nombre ___, Taille ___mm
□ Particules: ___microns, ___ml
□ Colle (Glubran/Histoacryl): ___ml
□ Onyx: ___ml
□ Éponge gélatine
□ Microsphères: Dose ___

Injection lente sous scopie

CONTRÔLE:
□ Arrêt flux complet
□ Dévascularisation complète
□ Flux résiduel: □ Oui □ Non
□ Collatérales préservées

Hémostase:
□ Compression: ___min
□ Dispositif fermeture: ___
□ Pansement compressif',

  'COMPLICATIONS:
□ Aucune
□ Hématome ponction
□ Faux anévrisme
□ Dissection artérielle
□ Spasme
□ Embolisation non cible
□ Allergie PDC
□ IR aiguë
□ Syndrome post-embolisation
□ Autre: ___

SURVEILLANCE:
Alitement: ___h (membre en extension)

T0: TA ___/___, FC ___, Pouls: +/-
T+2h: TA ___/___, FC ___, Pouls: +/-
T+4h: TA ___/___, FC ___, Pouls: +/-
T+6h: TA ___/___, FC ___, Pouls: +/-

Ponction: □ Sec □ Hématome

Diurèse: ___ml/h (>0.5ml/kg/h)
Hydratation poursuivie

Douleur: EVA ___/10
Antalgiques: ___

PRESCRIPTIONS:
□ Repos ___h
□ Hydratation IV: ___ml/24h
□ Antalgiques: ___
□ ATB (si tumeur): ___
□ Anti-inflammatoires: ___
□ Créatinine J+2',

  'CONSIGNES:
Marche après ___h

Surveillance:
□ Point ponction (hématome, saignement)
□ Membre (douleur, pâleur, pouls)
□ Température 2x/j

Signes d''alerte:
□ Hématome croissant
□ Saignement
□ Douleur membre intense
□ Fièvre >38.5°C >48h
□ Douleur abdominale

Traitement: ___

Contrôle:
□ Consultation: ___
□ Imagerie: ___ (type: ___)

Résultat: □ Arrêt hémorragie □ Dévascularisation □ Autre',

  '{}',
  '[{"code": "I74.3", "description": "Embolie et thrombose artérielle"}, {"code": "I28.0", "description": "Fistule artérioveineuse"}]'
),

-- Template: Drainage
(
  'Drainage Percutané',
  'Radiologie Interventionnelle',
  'Template pour drainage de collections, abcès, épanchements',
  true,
  'Type: □ Abcès □ Hématome □ Kyste □ Épanchement pleural □ Ascite □ Autre

Localisation: □ Hépatique □ Splénique □ Rénal □ Pelvien □ Sous-phrénique □ Pleural □ Autre: ___

Taille: ___cm
Indication: □ Drainage thérapeutique □ Prélèvement □ Soulagement',

  'PRÉPARATION:
Imagerie: □ Scanner □ Écho (date: ___)
Taille: ___x___x___cm, Volume: ___ml

Bilan:
□ GB: ___, CRP: ___mg/L
□ Plaquettes: ___ (>50000)
□ TP: ___%, INR: ___
□ Créatinine: ___

Consentement: □ Signé

ATB: □ Déjà sous ATB: ___ (___j)
     □ Prophylaxie: ___ (dose: ___)

ANESTHÉSIE:
□ Locale: Lidocaïne ___%/Ropivacaïne ___%
Volume: ___ml
□ Sédation: Midazolam ___mg

TECHNIQUE:
Guidage: □ Écho (___MHz) □ Scanner (___mm) □ Fluoroscopie

Position: □ Décubitus dorsal □ Latéral □ Procubitus

Asepsie: □ Champ stérile □ Désinfection

Repérage:
Profondeur: ___cm
Trajet: _______________________
Structures à éviter: _______________________

Technique: □ Seldinger □ Trocard

Étapes:
1. Anesthésie trajet
2. Ponction: Aiguille ___G
3. Aspiration: Aspect liquide: ___
4. □ Guide, dilatation (si Seldinger)
5. Drain: ___French, Type: □ Pigtail □ Droit
6. Fixation: □ Suture □ Externe
7. Raccordement: □ Poche □ Aspiration

PRÉLÈVEMENTS:
Aspect:
□ Purulent □ Séreux □ Hémorragique □ Trouble □ Fécaloïde

Volume drainé: ___ml

Envois:
□ Bactério aéro-anaérobie (hémoculture)
□ Examen direct + culture
□ BK (si suspicion)
□ Chimie (protides, LDH, amylase)
□ Anatomopath

CONTRÔLE:
□ Imagerie de contrôle
□ Position drain correcte
□ Drainage satisfaisant
□ Collection résiduelle: ___ml',

  'COMPLICATIONS:
□ Aucune
□ Douleur: EVA ___/10
□ Hémorragie: Minime/Modérée/Importante
□ Pneumothorax: ___%
□ Lésion organe adjacent
□ Malaise vagal
□ Autre: ___

SURVEILLANCE:
T0: TA ___/___, FC ___, T° ___°C
T+2h: TA ___/___, FC ___, T° ___°C
T+6h: TA ___/___, FC ___, T° ___°C

Drain:
□ Perméable
□ Débit: ___ml/h
□ Aspect: ___

Pansement: □ Sec □ Propre

PRESCRIPTIONS:
ATB: □ Selon antibiogramme (J+3)
     □ Probabiliste: ___ (___j)

Antalgiques:
□ Paracétamol 1g x4/j
□ Palier 2: ___

Soins drain:
□ Vérifier perméabilité
□ Noter débit quotidien
□ Réfection pansement tous les ___j
□ Aspiration douce

Critères retrait:
□ Débit <20ml/24h x2j
□ Apyrexie, CRP↓
□ Imagerie: collection affaissée',

  'ÉVOLUTION:
J1: T° ___°C, Débit ___ml, Aspect ___
J2: T° ___°C, Débit ___ml, Aspect ___
J3: T° ___°C, Débit ___ml, Aspect ___
J5: T° ___°C, Débit ___ml, Aspect ___

Biologie:
J0: CRP ___mg/L, GB ___
J3: CRP ___mg/L, GB ___
J7: CRP ___mg/L, GB ___

Bactériologie:
Direct: ___
Culture 24h: ___
Culture 48h: ___
Antibiogramme: ___

Imagerie contrôle:
Date: ___, Type: □ Écho □ Scanner
Résultat: □ Collection résiduelle minime □ Drain bien positionné

Retrait drain:
Date prévue: ___
Conditions: □ Débit<20ml □ Amélioration □ Imagerie OK',

  '{}',
  '[{"code": "K65.0", "description": "Péritonite aiguë"}, {"code": "K75.0", "description": "Abcès du foie"}]'
),

-- Template: Sclérothérapie Varices
(
  'Sclérothérapie Varices',
  'Radiologie Interventionnelle',
  'Template pour traitement des varices par sclérothérapie',
  true,
  'Indication: □ Varices tronculaires □ Tributaires □ Télangiectasies □ Varicosités

Membre: □ MI droit □ MI gauche □ Bilatéral

ATCD thrombose: □ Oui □ Non',

  'BILAN PRÉ-THÉRAPEUTIQUE:
Écho-Doppler (date: ___):

Grande saphène:
□ Calibre: ___mm (N<5mm)
□ Reflux: □ Non □ Oui (___s)
□ Segment: □ Crural □ Fémoral □ Ilio-fémoral

Petite saphène:
□ Calibre: ___mm
□ Reflux: □ Non □ Oui

Perforantes: □ Absentes □ Présentes (localisation: ___)

Varices tributaires: ___

Réseau profond:
□ Perméable
□ Pas de thrombose
□ Compressibilité normale

CEAP:
C ___, E ___, A ___, P ___

Symptômes:
□ Lourdeur □ Douleurs □ Œdème □ Crampes □ Prurit □ Troubles trophiques

TECHNIQUE:
Position: □ Debout (repérage) □ Couché (traitement)

Cartographie: □ Marquage

Agent sclérosant:
□ Polidocanol (Aethoxysklerol)
  Concentration: □ 0.5% □ 1% □ 2% □ 3%
□ Tétradécyl sulfate sodium
  Concentration: □ 0.5% □ 1% □ 3%

Forme: □ Liquide □ Mousse (ratio: ___:___)
Volume total: ___ml

ZONES TRAITÉES:

MI droit:
Cuisse:
□ Face antérieure: ___ml
□ Face postérieure: ___ml
□ Face médiale: ___ml

Jambe:
□ Face antérieure: ___ml
□ Face postérieure: ___ml
□ Face médiale: ___ml

Cheville/Pied: ___ml

MI gauche: (idem)

Technique:
Aiguille: ___G (30G télangiectasies, 25G varices)
□ Injection lente
□ Massage post-injection
Points injection: ___

COMPRESSION:
□ Bandes élastiques immédiates
□ Bas contention:
  Classe: □ 2 (15-20mmHg) □ 3 (20-36mmHg)
  Type: □ Cuisse □ Jarret
  Durée: ___j (7-21j)',

  'COMPLICATIONS:
□ Aucune
□ Douleur: EVA ___/10
□ Brûlure
□ Crampes
□ Malaise vagal
□ Allergie: □ Locale □ Systémique
□ Autre: ___

CONSIGNES:
Immédiat:
□ Marcher 30min post-traitement
□ Bas jour+nuit ___j
□ Puis journée uniquement ___j

Activités:
□ Activité normale
□ Marche 30min/j
□ Éviter station prolongée
□ Surélever jambes au repos

À éviter 1 mois:
□ Soleil sur zones traitées
□ Hammam, sauna, bains chauds
□ Épilation zones traitées
□ Sport intense
□ Voyages prolongés

Effets normaux:
□ Ecchymoses (2-3 semaines)
□ Œdème léger
□ Cordons indurés
□ Pigmentation brunâtre (régression spontanée)

Signes d''alerte:
□ Douleur mollet intense brutale
□ Gonflement douloureux jambe
□ Rougeur, chaleur, fièvre
□ Essoufflement, douleur thoracique
□ Allergie étendue

SUIVI:
J+7: □ Évaluation réponse □ Thrombose? □ Retrait caillots
1 mois: Écho-Doppler contrôle
3 mois: □ Résultat esthétique □ Séance complémentaire □ Télangiectasies',

  'RÉSULTATS:
Objectifs: □ Disparition varices □ Amélioration symptômes □ Prévention complications

Taux succès:
□ Varices tronculaires: 70-80% (1-2 séances)
□ Télangiectasies: 50-70% (2-3 séances)

Séances prévisibles: ___
Séance complémentaire: □ Oui (date: ___) □ Non □ À évaluer

CONTRE-INDICATIONS:
□ Pas ATCD TVP récente
□ Pas allergie produit
□ Pas grossesse/allaitement
□ Pas immobilisation prévue
□ Réseau profond perméable',

  '{}',
  '[{"code": "I83.9", "description": "Varices des membres inférieurs"}, {"code": "I80.3", "description": "Phlébite et thrombophlébite"}]'
);
