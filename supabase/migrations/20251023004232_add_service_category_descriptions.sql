/*
  # Add Comprehensive Descriptions for Service Categories

  ## Changes
  
  This migration adds detailed multilingual descriptions for all 8 service categories
  to help patients understand the scope and purpose of each medical department.

  ### Service Categories Updated
  
  1. Consultation générale - General medical consultations
  2. Radiologie diagnostique - Diagnostic imaging services
  3. Consultation spécialisée - Specialized medical consultations
  4. Radiologie interventionnelle - Interventional radiology procedures
  5. Dentisterie - Dental care services
  6. Laboratoire médical - Medical laboratory testing
  7. Explorations médicales - Medical diagnostic explorations
  8. Kinésithérapie - Physical therapy and rehabilitation

  ## Languages
  
  - French (description) - Primary language
  - English (description_en)
  - Arabic (description_ar)

  ## Notes
  
  Descriptions are patient-friendly while maintaining medical accuracy.
  They explain the purpose, scope, and types of services offered in each category.
*/

-- Consultation générale
UPDATE service_categories 
SET 
  description = 'Notre service de consultation générale offre des examens médicaux complets par des médecins qualifiés. Nous assurons le diagnostic et le traitement des maladies courantes, le suivi préventif, les bilans de santé, et les orientations vers des spécialistes si nécessaire.',
  description_en = 'Our general consultation service provides comprehensive medical examinations by qualified physicians. We offer diagnosis and treatment of common illnesses, preventive care, health check-ups, and referrals to specialists when needed.',
  description_ar = 'تقدم خدمة الاستشارة العامة لدينا فحوصات طبية شاملة من قبل أطباء مؤهلين. نوفر تشخيص وعلاج الأمراض الشائعة، الرعاية الوقائية، الفحوصات الصحية، والإحالة إلى المتخصصين عند الحاجة.'
WHERE name = 'Consultation générale';

-- Radiologie diagnostique
UPDATE service_categories 
SET 
  description = 'Notre département de radiologie diagnostique utilise des technologies d''imagerie médicale avancées pour visualiser l''intérieur du corps. Nous réalisons des radiographies, échographies, et scanners pour aider au diagnostic précis de diverses pathologies.',
  description_en = 'Our diagnostic radiology department uses advanced medical imaging technologies to visualize the interior of the body. We perform X-rays, ultrasounds, and CT scans to assist in accurate diagnosis of various conditions.',
  description_ar = 'يستخدم قسم الأشعة التشخيصية لدينا تقنيات التصوير الطبي المتقدمة لتصوير داخل الجسم. نقوم بإجراء الأشعة السينية والموجات فوق الصوتية والأشعة المقطعية للمساعدة في التشخيص الدقيق لمختلف الحالات.'
WHERE name = 'Radiologie diagnostique';

-- Consultation spécialisée
UPDATE service_categories 
SET 
  description = 'Nos consultations spécialisées offrent une expertise approfondie dans divers domaines médicaux. Nos spécialistes qualifiés prennent en charge des pathologies complexes nécessitant des connaissances et des compétences spécifiques.',
  description_en = 'Our specialized consultations offer in-depth expertise in various medical fields. Our qualified specialists handle complex conditions requiring specific knowledge and skills.',
  description_ar = 'تقدم استشاراتنا المتخصصة خبرة متعمقة في مختلف المجالات الطبية. يتعامل أخصائيونا المؤهلون مع الحالات المعقدة التي تتطلب معرفة ومهارات محددة.'
WHERE name = 'Consultation spécialisée';

-- Radiologie interventionnelle
UPDATE service_categories 
SET 
  description = 'La radiologie interventionnelle combine l''imagerie médicale et les procédures mini-invasives. Guidés par l''imagerie, nos radiologues effectuent des biopsies, des drainages, des embolisations, et des traitements ciblés avec une précision maximale.',
  description_en = 'Interventional radiology combines medical imaging with minimally invasive procedures. Guided by imaging, our radiologists perform biopsies, drainage, embolization, and targeted treatments with maximum precision.',
  description_ar = 'تجمع الأشعة التداخلية بين التصوير الطبي والإجراءات طفيفة التوغل. بتوجيه من التصوير، يقوم أخصائيو الأشعة لدينا بإجراء الخزعات والتصريف والانصمام والعلاجات الموجهة بدقة قصوى.'
WHERE name = 'Radiologie interventionnelle';

-- Dentisterie
UPDATE service_categories 
SET 
  description = 'Notre service de dentisterie offre des soins dentaires complets pour toute la famille. Nous assurons les soins préventifs, les traitements conservateurs, les soins d''urgence, et les interventions pour maintenir votre santé bucco-dentaire.',
  description_en = 'Our dentistry service offers comprehensive dental care for the whole family. We provide preventive care, conservative treatments, emergency care, and procedures to maintain your oral health.',
  description_ar = 'تقدم خدمة طب الأسنان لدينا رعاية أسنان شاملة لجميع أفراد الأسرة. نوفر الرعاية الوقائية والعلاجات المحافظة ورعاية الطوارئ والإجراءات للحفاظ على صحة فمك.'
WHERE name = 'Dentisterie';

-- Laboratoire médical
UPDATE service_categories 
SET 
  description = 'Notre laboratoire médical moderne effectue une large gamme d''analyses biologiques. Nous réalisons des tests en hématologie, biochimie, immunologie, bactériologie, et parasitologie pour un diagnostic précis et un suivi thérapeutique optimal.',
  description_en = 'Our modern medical laboratory performs a wide range of biological analyses. We conduct tests in hematology, biochemistry, immunology, bacteriology, and parasitology for accurate diagnosis and optimal therapeutic monitoring.',
  description_ar = 'يجري مختبرنا الطبي الحديث مجموعة واسعة من التحليلات البيولوجية. نجري اختبارات في أمراض الدم والكيمياء الحيوية وعلم المناعة وعلم البكتيريا وعلم الطفيليات للتشخيص الدقيق والمتابعة العلاجية المثلى.'
WHERE name = 'Laboratoire médical';

-- Explorations médicales
UPDATE service_categories 
SET 
  description = 'Les explorations médicales permettent d''examiner en profondeur le fonctionnement de vos organes. Nous réalisons des endoscopies digestives et bronchiques, des explorations cardiaques, et des électroencéphalogrammes (EEG) avec des équipements de pointe.',
  description_en = 'Medical explorations allow in-depth examination of your organs'' functioning. We perform digestive and bronchial endoscopies, cardiac explorations, and electroencephalograms (EEG) with state-of-the-art equipment.',
  description_ar = 'تسمح الفحوصات الطبية بفحص متعمق لوظائف أعضائك. نجري تنظير الجهاز الهضمي والقصبات الهوائية والفحوصات القلبية وتخطيط كهربية الدماغ (EEG) بمعدات حديثة.'
WHERE name = 'Explorations médicales';

-- Kinésithérapie
UPDATE service_categories 
SET 
  description = 'Notre service de kinésithérapie offre des traitements de rééducation et de réadaptation fonctionnelle. Nos kinésithérapeutes qualifiés utilisent des techniques manuelles et des exercices thérapeutiques pour traiter les troubles musculosquelettiques et neurologiques.',
  description_en = 'Our physiotherapy service offers rehabilitation and functional recovery treatments. Our qualified physiotherapists use manual techniques and therapeutic exercises to treat musculoskeletal and neurological disorders.',
  description_ar = 'تقدم خدمة العلاج الطبيعي لدينا علاجات إعادة التأهيل والتعافي الوظيفي. يستخدم أخصائيو العلاج الطبيعي المؤهلون لدينا التقنيات اليدوية والتمارين العلاجية لعلاج الاضطرابات العضلية الهيكلية والعصبية.'
WHERE name = 'Kinésithérapie';
