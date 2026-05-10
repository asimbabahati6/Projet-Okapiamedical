/*
  # Add Comprehensive Descriptions for All Individual Services

  ## Changes
  
  This migration adds detailed multilingual descriptions for all 23 individual medical services
  to help patients understand what each service offers, what conditions it addresses, and what to expect.

  ### Services Updated (by Category)
  
  **Consultation générale:**
  - Consultation générale

  **Radiologie diagnostique:**
  - Radiographie
  - Échographie
  - Scanner

  **Consultation spécialisée:**
  - Consultation spécialisée

  **Radiologie interventionnelle:**
  - Biopsie
  - Embolisation
  - Drainage
  - Traitement des varices

  **Dentisterie:**
  - Dentisterie

  **Laboratoire médical:**
  - Hématologie
  - Biochimie
  - Immunologie
  - Bactériologie
  - Parasitologie

  **Explorations médicales:**
  - Endoscopie digestive
  - Endoscopie bronchique
  - Explorations cardiaques
  - EEG

  **Kinésithérapie:**
  - Kinésithérapie

  ## Languages
  
  - French (description) - Primary language
  - English (description_en)
  - Arabic (description_ar)

  ## Notes
  
  Each description includes:
  - What the service involves
  - Common conditions diagnosed or treated
  - Basic procedure information
  - Patient-friendly language while maintaining medical accuracy
*/

-- Consultation générale
UPDATE services 
SET 
  description = 'La consultation générale est votre premier contact avec notre équipe médicale. Le médecin effectue un examen clinique complet, évalue vos symptômes, pose un diagnostic, et prescrit un traitement adapté. Cette consultation permet également la prévention, les bilans de santé, les vaccinations, et les certificats médicaux. Durée moyenne : 30 minutes.',
  description_en = 'General consultation is your first contact with our medical team. The doctor performs a complete clinical examination, evaluates your symptoms, makes a diagnosis, and prescribes appropriate treatment. This consultation also covers prevention, health check-ups, vaccinations, and medical certificates. Average duration: 30 minutes.',
  description_ar = 'الاستشارة العامة هي أول اتصال لك مع فريقنا الطبي. يجري الطبيب فحصًا سريريًا كاملاً ويقيم أعراضك ويضع التشخيص ويصف العلاج المناسب. تغطي هذه الاستشارة أيضًا الوقاية والفحوصات الصحية والتطعيمات والشهادات الطبية. المدة المتوسطة: 30 دقيقة.'
WHERE name = 'Consultation générale';

-- Radiographie
UPDATE services 
SET 
  description = 'La radiographie utilise les rayons X pour créer des images des structures internes du corps, particulièrement les os et certains organes. Examen rapide et indolore, elle permet de diagnostiquer les fractures, infections pulmonaires, problèmes dentaires, et anomalies osseuses. Aucune préparation spéciale n''est généralement nécessaire.',
  description_en = 'Radiography uses X-rays to create images of internal body structures, particularly bones and certain organs. Quick and painless, it helps diagnose fractures, lung infections, dental problems, and bone abnormalities. No special preparation is usually required.',
  description_ar = 'يستخدم التصوير الشعاعي الأشعة السينية لإنشاء صور للبنى الداخلية للجسم، خاصة العظام وبعض الأعضاء. سريع وغير مؤلم، يساعد في تشخيص الكسور والتهابات الرئة ومشاكل الأسنان وتشوهات العظام. لا يلزم عادة تحضير خاص.'
WHERE name = 'Radiographie';

-- Échographie
UPDATE services 
SET 
  description = 'L''échographie utilise des ultrasons pour visualiser en temps réel les organes internes, les tissus mous, et le développement fœtal. Examen non invasif et sans radiation, elle permet d''examiner l''abdomen, le pelvis, la thyroïde, les vaisseaux sanguins, et de suivre les grossesses. Un gel est appliqué sur la peau pour faciliter le passage des ondes.',
  description_en = 'Ultrasound uses sound waves to visualize internal organs, soft tissues, and fetal development in real-time. Non-invasive and radiation-free, it examines the abdomen, pelvis, thyroid, blood vessels, and monitors pregnancies. A gel is applied to the skin to facilitate wave transmission.',
  description_ar = 'تستخدم الموجات فوق الصوتية موجات صوتية لتصوير الأعضاء الداخلية والأنسجة الرخوة ونمو الجنين في الوقت الفعلي. غير جراحي وخالٍ من الإشعاع، يفحص البطن والحوض والغدة الدرقية والأوعية الدموية ويراقب الحمل. يتم وضع جل على الجلد لتسهيل نقل الموجات.'
WHERE name = 'Échographie';

-- Scanner
UPDATE services 
SET 
  description = 'Le scanner (tomodensitométrie ou CT scan) combine plusieurs images radiographiques pour créer des coupes détaillées du corps. Cet examen permet de détecter les tumeurs, les hémorragies internes, les traumatismes, et d''examiner les organes en détail. Rapide et précis, il peut nécessiter l''injection d''un produit de contraste. Durée : 10-30 minutes.',
  description_en = 'CT scanner (computed tomography) combines multiple X-ray images to create detailed cross-sections of the body. This examination detects tumors, internal bleeding, trauma, and examines organs in detail. Fast and accurate, it may require contrast injection. Duration: 10-30 minutes.',
  description_ar = 'يجمع التصوير المقطعي المحوسب (CT) عدة صور بالأشعة السينية لإنشاء مقاطع مفصلة للجسم. يكتشف هذا الفحص الأورام والنزيف الداخلي والصدمات ويفحص الأعضاء بالتفصيل. سريع ودقيق، قد يتطلب حقن مادة تباين. المدة: 10-30 دقيقة.'
WHERE name = 'Scanner';

-- Consultation spécialisée
UPDATE services 
SET 
  description = 'Les consultations spécialisées offrent une expertise pointue dans des domaines médicaux spécifiques (cardiologie, neurologie, gynécologie, pédiatrie, etc.). Le spécialiste analyse en profondeur votre pathologie, réalise des examens spécialisés si nécessaire, et élabore un plan de traitement personnalisé. Souvent réalisée sur référence d''un médecin généraliste.',
  description_en = 'Specialized consultations offer expert knowledge in specific medical fields (cardiology, neurology, gynecology, pediatrics, etc.). The specialist thoroughly analyzes your condition, performs specialized examinations if needed, and develops a personalized treatment plan. Often conducted on referral from a general practitioner.',
  description_ar = 'تقدم الاستشارات المتخصصة خبرة متقدمة في مجالات طبية محددة (أمراض القلب، الأعصاب، أمراض النساء، طب الأطفال، إلخ). يحلل الأخصائي حالتك بدقة ويجري فحوصات متخصصة إذا لزم الأمر ويضع خطة علاج شخصية. غالبًا ما يتم إجراؤها بإحالة من طبيب عام.'
WHERE name = 'Consultation spécialisée';

-- Biopsie
UPDATE services 
SET 
  description = 'La biopsie guidée par imagerie permet de prélever un échantillon de tissu suspect pour analyse en laboratoire. Réalisée sous anesthésie locale avec guidage par échographie ou scanner, cette procédure mini-invasive aide à diagnostiquer les cancers, les infections, et les maladies inflammatoires. Les résultats sont généralement disponibles en quelques jours.',
  description_en = 'Image-guided biopsy allows sampling of suspicious tissue for laboratory analysis. Performed under local anesthesia with ultrasound or CT guidance, this minimally invasive procedure helps diagnose cancers, infections, and inflammatory diseases. Results are usually available within days.',
  description_ar = 'تسمح الخزعة الموجهة بالصور بأخذ عينة من الأنسجة المشتبه بها للتحليل المخبري. تُجرى تحت التخدير الموضعي بتوجيه من الموجات فوق الصوتية أو الأشعة المقطعية، وهذه الإجراء طفيف التوغل يساعد في تشخيص السرطانات والالتهابات والأمراض الالتهابية. النتائج متاحة عادة في غضون أيام.'
WHERE name = 'Biopsie';

-- Embolisation
UPDATE services 
SET 
  description = 'L''embolisation est une technique qui bloque l''apport sanguin vers une zone ciblée en injectant des particules dans les vaisseaux sanguins. Utilisée pour traiter les hémorragies, les fibromes utérins, certaines tumeurs, et les malformations vasculaires. Procédure réalisée sous anesthésie locale par un petit cathéter introduit dans l''artère fémorale.',
  description_en = 'Embolization is a technique that blocks blood supply to a targeted area by injecting particles into blood vessels. Used to treat bleeding, uterine fibroids, certain tumors, and vascular malformations. Procedure performed under local anesthesia through a small catheter inserted in the femoral artery.',
  description_ar = 'الانصمام هو تقنية تمنع إمداد الدم إلى منطقة مستهدفة عن طريق حقن جزيئات في الأوعية الدموية. تستخدم لعلاج النزيف والأورام الليفية الرحمية وبعض الأورام وتشوهات الأوعية الدموية. يتم الإجراء تحت التخدير الموضعي من خلال قسطرة صغيرة يتم إدخالها في الشريان الفخذي.'
WHERE name = 'Embolisation';

-- Drainage
UPDATE services 
SET 
  description = 'Le drainage percutané guidé par imagerie permet d''évacuer des collections liquidiennes anormales (abcès, kystes, épanchements) sans chirurgie ouverte. Un cathéter est inséré à travers la peau sous guidage échographique ou scanner pour drainer le liquide. Procédure mini-invasive réalisée sous anesthésie locale.',
  description_en = 'Image-guided percutaneous drainage evacuates abnormal fluid collections (abscesses, cysts, effusions) without open surgery. A catheter is inserted through the skin under ultrasound or CT guidance to drain the fluid. Minimally invasive procedure performed under local anesthesia.',
  description_ar = 'يسمح التصريف عبر الجلد الموجه بالصور بإخلاء تجمعات السوائل غير الطبيعية (الخراجات والأكياس والانصباب) دون جراحة مفتوحة. يتم إدخال قسطرة عبر الجلد تحت توجيه الموجات فوق الصوتية أو الأشعة المقطعية لتصريف السائل. إجراء طفيف التوغل يتم تحت التخدير الموضعي.'
WHERE name = 'Drainage';

-- Traitement des varices
UPDATE services 
SET 
  description = 'Le traitement des varices par radiologie interventionnelle utilise des techniques mini-invasives comme la sclérothérapie échoguidée ou l''ablation thermique. Ces procédures ferment les veines défaillantes sans chirurgie, améliorant la circulation et l''apparence des jambes. Réalisées en ambulatoire sous anesthésie locale, avec reprise rapide des activités.',
  description_en = 'Interventional radiology treatment of varicose veins uses minimally invasive techniques like ultrasound-guided sclerotherapy or thermal ablation. These procedures close failing veins without surgery, improving circulation and leg appearance. Performed as outpatient procedures under local anesthesia with quick return to activities.',
  description_ar = 'يستخدم علاج الدوالي بالأشعة التداخلية تقنيات طفيفة التوغل مثل العلاج بالتصليب الموجه بالموجات فوق الصوتية أو الاستئصال الحراري. تغلق هذه الإجراءات الأوردة الفاشلة دون جراحة، مما يحسن الدورة الدموية ومظهر الساقين. تُجرى كإجراءات خارجية تحت التخدير الموضعي مع عودة سريعة للأنشطة.'
WHERE name = 'Traitement des varices';

-- Dentisterie
UPDATE services 
SET 
  description = 'Notre service de dentisterie couvre tous les aspects de la santé bucco-dentaire : examens de routine, nettoyage et détartrage, traitement des caries, soins des gencives, extractions dentaires, soins d''urgence pour les douleurs et traumatismes. Nous assurons également les soins préventifs et l''éducation à l''hygiène dentaire pour toute la famille.',
  description_en = 'Our dentistry service covers all aspects of oral health: routine examinations, cleaning and scaling, cavity treatment, gum care, tooth extractions, emergency care for pain and trauma. We also provide preventive care and dental hygiene education for the whole family.',
  description_ar = 'تغطي خدمة طب الأسنان لدينا جميع جوانب صحة الفم: الفحوصات الروتينية والتنظيف وإزالة الجير وعلاج التسوس ورعاية اللثة وخلع الأسنان ورعاية الطوارئ للألم والصدمات. نوفر أيضًا الرعاية الوقائية والتثقيف حول نظافة الأسنان لجميع أفراد الأسرة.'
WHERE name = 'Dentisterie';

-- Hématologie
UPDATE services 
SET 
  description = 'L''hématologie étudie les cellules sanguines et les troubles de la coagulation. Nos analyses incluent : numération formule sanguine (NFS), groupage sanguin, taux d''hémoglobine, numération des plaquettes, tests de coagulation. Ces examens permettent de diagnostiquer les anémies, infections, troubles de coagulation, et maladies hématologiques.',
  description_en = 'Hematology studies blood cells and coagulation disorders. Our analyses include: complete blood count (CBC), blood typing, hemoglobin levels, platelet count, coagulation tests. These tests diagnose anemias, infections, coagulation disorders, and hematological diseases.',
  description_ar = 'يدرس أمراض الدم خلايا الدم واضطرابات التخثر. تشمل تحليلاتنا: تعداد الدم الكامل (CBC)، فصيلة الدم، مستويات الهيموغلوبين، عدد الصفائح الدموية، اختبارات التخثر. تشخص هذه الاختبارات فقر الدم والالتهابات واضطرابات التخثر وأمراض الدم.'
WHERE name = 'Hématologie';

-- Biochimie
UPDATE services 
SET 
  description = 'La biochimie médicale analyse les substances chimiques présentes dans le sang et les fluides corporels. Nos tests incluent : glycémie, cholestérol, triglycérides, créatinine, urée, enzymes hépatiques, électrolytes. Ces analyses évaluent le fonctionnement des organes (foie, reins, pancréas) et détectent les déséquilibres métaboliques.',
  description_en = 'Medical biochemistry analyzes chemical substances in blood and body fluids. Our tests include: blood glucose, cholesterol, triglycerides, creatinine, urea, liver enzymes, electrolytes. These analyses evaluate organ function (liver, kidneys, pancreas) and detect metabolic imbalances.',
  description_ar = 'تحلل الكيمياء الحيوية الطبية المواد الكيميائية في الدم وسوائل الجسم. تشمل اختباراتنا: سكر الدم والكوليسترول والدهون الثلاثية والكرياتينين واليوريا وإنزيمات الكبد والإلكتروليتات. تقيم هذه التحليلات وظائف الأعضاء (الكبد والكلى والبنكرياس) وتكتشف الاختلالات الأيضية.'
WHERE name = 'Biochimie';

-- Immunologie
UPDATE services 
SET 
  description = 'L''immunologie étudie le système immunitaire et les réactions allergiques. Nos tests comprennent : sérologies infectieuses (VIH, hépatites, toxoplasmose), dosage des anticorps, tests allergiques, marqueurs auto-immuns. Ces analyses diagnostiquent les infections, allergies, maladies auto-immunes, et évaluent l''immunité.',
  description_en = 'Immunology studies the immune system and allergic reactions. Our tests include: infectious serologies (HIV, hepatitis, toxoplasmosis), antibody measurements, allergy tests, autoimmune markers. These analyses diagnose infections, allergies, autoimmune diseases, and assess immunity.',
  description_ar = 'يدرس علم المناعة الجهاز المناعي والتفاعلات التحسسية. تشمل اختباراتنا: الفحوصات المصلية للعدوى (فيروس نقص المناعة البشرية والتهاب الكبد وداء المقوسات) وقياس الأجسام المضادة واختبارات الحساسية وعلامات المناعة الذاتية. تشخص هذه التحليلات العدوى والحساسية وأمراض المناعة الذاتية وتقيم المناعة.'
WHERE name = 'Immunologie';

-- Bactériologie
UPDATE services 
SET 
  description = 'La bactériologie identifie les bactéries responsables d''infections. Nous réalisons des cultures (urines, sang, prélèvements divers), antibiogrammes pour déterminer la sensibilité aux antibiotiques, et recherche de germes spécifiques. Ces analyses guident le traitement antibiotique adapté et surveillent les infections.',
  description_en = 'Bacteriology identifies bacteria causing infections. We perform cultures (urine, blood, various samples), antibiograms to determine antibiotic sensitivity, and specific pathogen detection. These analyses guide appropriate antibiotic treatment and monitor infections.',
  description_ar = 'يحدد علم البكتيريا البكتيريا المسببة للعدوى. نجري مزارع (البول والدم وعينات مختلفة) ومخططات المضادات الحيوية لتحديد حساسية المضادات الحيوية والكشف عن مسببات أمراض معينة. توجه هذه التحليلات العلاج المناسب بالمضادات الحيوية وتراقب العدوى.'
WHERE name = 'Bactériologie';

-- Parasitologie
UPDATE services 
SET 
  description = 'La parasitologie détecte les parasites intestinaux et sanguins. Nos examens incluent : recherche de parasites dans les selles, goutte épaisse et frottis sanguin pour le paludisme, sérologies parasitaires. Ces analyses diagnostiquent les infections parasitaires courantes en Afrique centrale (paludisme, amibiase, bilharziose, filarioses).',
  description_en = 'Parasitology detects intestinal and blood parasites. Our examinations include: stool parasite screening, thick blood smear and blood film for malaria, parasitic serologies. These analyses diagnose common parasitic infections in Central Africa (malaria, amebiasis, schistosomiasis, filariasis).',
  description_ar = 'يكتشف علم الطفيليات الطفيليات المعوية والدموية. تشمل فحوصاتنا: فحص الطفيليات في البراز، والفحص الدموي السميك ومسحة الدم للملاريا، والفحوصات المصلية للطفيليات. تشخص هذه التحليلات العدوى الطفيلية الشائعة في وسط أفريقيا (الملاريا وداء الأميبات والبلهارسيا وداء الفيلاريات).'
WHERE name = 'Parasitologie';

-- Endoscopie digestive
UPDATE services 
SET 
  description = 'L''endoscopie digestive examine l''intérieur de l''œsophage, l''estomac, et le duodénum (gastroscopie) ou le côlon (coloscopie) à l''aide d''une caméra flexible. Cet examen détecte les ulcères, inflammations, polypes, tumeurs, et permet de réaliser des biopsies. Réalisée sous sédation pour votre confort, une préparation spécifique est nécessaire.',
  description_en = 'Digestive endoscopy examines the inside of the esophagus, stomach, and duodenum (gastroscopy) or colon (colonoscopy) using a flexible camera. This examination detects ulcers, inflammation, polyps, tumors, and allows biopsies. Performed under sedation for comfort, specific preparation is required.',
  description_ar = 'يفحص تنظير الجهاز الهضمي داخل المريء والمعدة والاثني عشر (تنظير المعدة) أو القولون (تنظير القولون) باستخدام كاميرا مرنة. يكتشف هذا الفحص القرحة والالتهابات والأورام الحميدة والأورام ويسمح بأخذ خزعات. يتم إجراؤه تحت التخدير للراحة، ويتطلب تحضيرًا محددًا.'
WHERE name = 'Endoscopie digestive';

-- Endoscopie bronchique
UPDATE services 
SET 
  description = 'L''endoscopie bronchique (ou fibroscopie bronchique) explore les voies respiratoires en introduisant un tube flexible dans les bronches. Cet examen visualise les anomalies des bronches et des poumons, permet de réaliser des biopsies, et d''aspirer des sécrétions pour analyse. Réalisée sous anesthésie locale avec sédation légère.',
  description_en = 'Bronchial endoscopy (or bronchoscopy) explores the airways by introducing a flexible tube into the bronchi. This examination visualizes abnormalities of the bronchi and lungs, allows biopsies, and aspiration of secretions for analysis. Performed under local anesthesia with light sedation.',
  description_ar = 'يستكشف تنظير القصبات (أو تنظير القصبات الهوائية) الشعب الهوائية عن طريق إدخال أنبوب مرن في القصبات. يصور هذا الفحص التشوهات في القصبات والرئتين ويسمح بأخذ خزعات وشفط الإفرازات للتحليل. يتم إجراؤه تحت التخدير الموضعي مع تخدير خفيف.'
WHERE name = 'Endoscopie bronchique';

-- Explorations cardiaques
UPDATE services 
SET 
  description = 'Les explorations cardiaques évaluent le fonctionnement du cœur. Nos examens incluent : électrocardiogramme (ECG) pour analyser l''activité électrique, échocardiographie pour visualiser les structures cardiaques, épreuves d''effort pour évaluer la capacité cardiaque, Holter ECG pour enregistrement prolongé. Ces tests diagnostiquent les troubles du rythme, insuffisances cardiaques, et maladies coronariennes.',
  description_en = 'Cardiac explorations evaluate heart function. Our examinations include: electrocardiogram (ECG) to analyze electrical activity, echocardiography to visualize cardiac structures, stress tests to evaluate cardiac capacity, Holter ECG for prolonged recording. These tests diagnose rhythm disorders, heart failure, and coronary diseases.',
  description_ar = 'تقيم الفحوصات القلبية وظائف القلب. تشمل فحوصاتنا: تخطيط كهربية القلب (ECG) لتحليل النشاط الكهربائي، وتخطيط صدى القلب لتصوير بنى القلب، واختبارات الجهد لتقييم قدرة القلب، وتخطيط القلب هولتر للتسجيل المطول. تشخص هذه الاختبارات اضطرابات النظم وفشل القلب وأمراض الشريان التاجي.'
WHERE name = 'Explorations cardiaques';

-- EEG
UPDATE services 
SET 
  description = 'L''électroencéphalogramme (EEG) enregistre l''activité électrique du cerveau à l''aide d''électrodes placées sur le cuir chevelu. Examen non invasif et indolore, il détecte les anomalies de l''activité cérébrale, diagnostique l''épilepsie, les troubles du sommeil, et évalue les atteintes neurologiques. Durée : 20-45 minutes. Cheveux propres requis.',
  description_en = 'Electroencephalogram (EEG) records the brain''s electrical activity using electrodes placed on the scalp. Non-invasive and painless, it detects brain activity abnormalities, diagnoses epilepsy, sleep disorders, and evaluates neurological impairments. Duration: 20-45 minutes. Clean hair required.',
  description_ar = 'يسجل تخطيط كهربية الدماغ (EEG) النشاط الكهربائي للدماغ باستخدام أقطاب كهربائية موضوعة على فروة الرأس. غير جراحي وغير مؤلم، يكتشف تشوهات نشاط الدماغ ويشخص الصرع واضطرابات النوم ويقيم الاختلالات العصبية. المدة: 20-45 دقيقة. يتطلب شعرًا نظيفًا.'
WHERE name = 'EEG';

-- Kinésithérapie
UPDATE services 
SET 
  description = 'La kinésithérapie utilise des techniques manuelles, des exercices thérapeutiques, et des modalités physiques pour restaurer la fonction et réduire la douleur. Nos traitements couvrent : rééducation post-opératoire, traumatismes musculo-squelettiques, douleurs chroniques, rééducation neurologique, drainage lymphatique, et prévention des blessures. Séances personnalisées selon votre condition.',
  description_en = 'Physiotherapy uses manual techniques, therapeutic exercises, and physical modalities to restore function and reduce pain. Our treatments cover: post-operative rehabilitation, musculoskeletal trauma, chronic pain, neurological rehabilitation, lymphatic drainage, and injury prevention. Personalized sessions according to your condition.',
  description_ar = 'يستخدم العلاج الطبيعي التقنيات اليدوية والتمارين العلاجية والطرق الفيزيائية لاستعادة الوظيفة وتقليل الألم. تغطي علاجاتنا: إعادة التأهيل بعد العمليات الجراحية، والصدمات العضلية الهيكلية، والألم المزمن، وإعادة التأهيل العصبي، والتصريف اللمفاوي، والوقاية من الإصابات. جلسات شخصية حسب حالتك.'
WHERE name = 'Kinésithérapie';
