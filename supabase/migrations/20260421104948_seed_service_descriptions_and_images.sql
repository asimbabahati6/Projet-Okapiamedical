/*
  # Seed service descriptions and images

  Updates all services with:
  1. Unique, professional French descriptions (2-3 sentences each)
  2. Real Pexels image URLs appropriate to each medical specialty

  Services updated:
  - Lab: Hématologie, Biochimie, Immunologie, Bactériologie, Parasitologie
  - Radiology diagnostic: Échographie, Scanner, Radiographie
  - Radiology interventional: Biopsie guidée, Embolisation, Drainage, Traitement des varices
  - Explorations: EEG, Endoscopie bronchique, Endoscopie digestive, Explorations cardiaques
  - Dentistry: Soins dentaires
  - Kinesitherapy: Kinésithérapie
  - Consultations: Consultation générale, Consultation spécialisée
*/

UPDATE services SET
  description = 'Analyse complète de la composition du sang (numération formule sanguine, bilan de coagulation, groupage) pour détecter anémies, infections, troubles de la coagulation et hémopathies. Résultats fiables en moins de 24h avec interprétation clinique incluse.',
  image_url = 'https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Hématologie';

UPDATE services SET
  description = 'Dosage des marqueurs biologiques sanguins et urinaires (glycémie, bilan hépatique, rénal, lipidique) pour surveiller les fonctions vitales et adapter les traitements. Une couverture analytique complète pour un suivi métabolique rigoureux.',
  image_url = 'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Biochimie';

UPDATE services SET
  description = 'Exploration du système immunitaire par la recherche d''anticorps, de marqueurs d''auto-immunité et d''allergènes pour diagnostiquer maladies auto-immunes, infections chroniques et allergies. Technique ELISA et immunofluorescence de haute sensibilité.',
  image_url = 'https://images.pexels.com/photos/4031514/pexels-photo-4031514.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Immunologie';

UPDATE services SET
  description = 'Identification et antibiogramme des agents bactériens responsables d''infections (urinaires, pulmonaires, cutanées) pour orienter précisément l''antibiothérapie. Résultats en 48-72h avec profil de résistance complet pour lutter contre l''antibiorésistance.',
  image_url = 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Bactériologie';

UPDATE services SET
  description = 'Détection microscopique et sérologique des parasites intestinaux, sanguins et tissulaires (paludisme, bilharziose, amibiase) avec rendu rapide pour une prise en charge antiparasitaire ciblée. Expertise adaptée aux profils épidémiologiques locaux.',
  image_url = 'https://images.pexels.com/photos/3938023/pexels-photo-3938023.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Parasitologie';

UPDATE services SET
  description = 'Imagerie en temps réel par ultrasons pour explorer l''abdomen, la thyroïde, les vaisseaux et les organes pelviens sans radiation ionisante. Examen doux, rapide et sans préparation spécifique dans la majorité des cas.',
  image_url = 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Échographie';

UPDATE services SET
  description = 'Tomodensitométrie (TDM) à coupes millimétriques pour une visualisation tridimensionnelle des organes thoraciques, abdominaux, cérébraux et osseux. Une précision diagnostique inégalée pour les pathologies complexes nécessitant une cartographie anatomique détaillée.',
  image_url = 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Scanner';

UPDATE services SET
  description = 'Clichés radiographiques numériques pour évaluer rapidement l''état des poumons, du squelette et des articulations. Technique rapide et disponible en urgence, avec traitement numérique offrant une excellente lisibilité diagnostique.',
  image_url = 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Radiographie';

UPDATE services SET
  description = 'Prélèvement tissulaire ciblé guidé par échographie ou scanner pour analyse anatomopathologique précise. La précision du guidage garantit un prélèvement représentatif tout en minimisant le risque de complication.',
  image_url = 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Biopsie guidée';

UPDATE services SET
  description = 'Occlusion sélective de vaisseaux sanguins pathologiques (fibromes, saignements actifs, tumeurs) par cathétérisme artériel guidé par imagerie. Une alternative mini-invasive évitant la chirurgie ouverte, avec une récupération rapide et peu douloureuse.',
  image_url = 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Embolisation';

UPDATE services SET
  description = 'Évacuation guidée par imagerie de collections liquidiennes (abcès, épanchements pleuraux, kystes) à l''aide d''aiguilles et de drains de petit calibre. Soulagement rapide et durable sans recours à la chirurgie conventionnelle.',
  image_url = 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Drainage';

UPDATE services SET
  description = 'Sclérothérapie et techniques endovasculaires pour éliminer varices et télangiectasies avec un résultat fonctionnel et esthétique durable. Traitement ambulatoire sans anesthésie générale ni hospitalisation, avec reprise immédiate des activités.',
  image_url = 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Traitement des varices';

UPDATE services SET
  description = 'Enregistrement de l''activité électrique cérébrale pour diagnostiquer épilepsies, troubles du sommeil et encéphalopathies. Examen indolore réalisé en ambulatoire avec lecture spécialisée par notre neurologue sous 48h.',
  image_url = 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'EEG';

UPDATE services SET
  description = 'Exploration visuelle directe des bronches et voies aériennes pour diagnostiquer tumeurs, infections et corps étrangers, avec prélèvements et gestes thérapeutiques réalisés dans le même temps opératoire.',
  image_url = 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Endoscopie bronchique';

UPDATE services SET
  description = 'Examen visuel du tube digestif (œsophage, estomac, côlon) pour détecter ulcères, polypes et tumeurs, avec ablation des polypes et biopsies effectuées simultanément. Le dépistage précoce augmente significativement les chances de guérison.',
  image_url = 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Endoscopie digestive';

UPDATE services SET
  description = 'Bilan cardiovasculaire complet associant électrocardiogramme, épreuve d''effort et échocardiographie Doppler pour évaluer la fonction cardiaque et dépister coronaropathies, valvulopathies et arythmies.',
  image_url = 'https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Explorations cardiaques';

UPDATE services SET
  description = 'Soins bucco-dentaires complets alliant prévention, restauration et esthétique dans un cabinet moderne équipé. De la détartrage à la chirurgie implantaire, nos dentistes prennent en charge toute la sphère orale avec douceur et précision.',
  image_url = 'https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Soins dentaires';

UPDATE services SET
  description = 'Programme de rééducation personnalisé pour restaurer la mobilité, soulager les douleurs et prévenir les récidives après blessure, chirurgie ou affection chronique. Nos kinésithérapeutes certifiés combinent techniques manuelles, exercices actifs et électrothérapie.',
  image_url = 'https://images.pexels.com/photos/5473177/pexels-photo-5473177.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Kinésithérapie';

UPDATE services SET
  description = 'Consultation médicale approfondie avec un généraliste expérimenté pour évaluer votre état de santé global, établir un diagnostic initial et coordonner votre parcours de soins. Suivi personnalisé incluant la prévention et la gestion des maladies chroniques.',
  image_url = 'https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Consultation générale';

UPDATE services SET
  description = 'Accès à un large panel de spécialistes médicaux pour une prise en charge ciblée et approfondie de votre pathologie. Chaque consultation débouche sur un plan thérapeutique personnalisé, coordonné avec votre médecin référent pour un suivi optimal.',
  image_url = 'https://images.pexels.com/photos/5407206/pexels-photo-5407206.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Consultation spécialisée';
