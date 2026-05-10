import { DocumentSection } from '../types/medicalDocuments';
import { PatientWithDocuments } from '../types/medicalDocuments';

export function generateConsultationReport(patient: PatientWithDocuments): DocumentSection[] {
  const age = calculateAge(patient.date_of_birth);

  return [
    {
      title: 'Motif de Consultation',
      type: 'text',
      content: 'Patient se présente pour douleurs abdominales récurrentes depuis 3 jours, accompagnées de nausées et de perte d\'appétit.',
    },
    {
      title: 'Anamnèse',
      type: 'text',
      content: `Patient de ${age} ans, sexe ${patient.gender === 'male' ? 'masculin' : 'féminin'}. Antécédents médicaux: ${patient.medical_history && patient.medical_history.length > 0 ? patient.medical_history.join(', ') : 'Aucun antécédent médical significatif'}. Allergies connues: ${patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(', ') : 'Aucune allergie connue'}. Traitement actuel: Aucun médicament en cours.`,
    },
    {
      title: 'Examen Clinique',
      type: 'text',
      content: 'Examen général: Patient conscient, bien orienté dans le temps et l\'espace. TA: 120/80 mmHg, FC: 75 bpm, T°: 37.2°C. Examen abdominal: Abdomen souple, sensibilité à la palpation de l\'épigastre, pas de défense, bruits intestinaux présents et normaux.',
    },
    {
      title: 'Diagnostic',
      type: 'text',
      content: 'Gastrite aiguë probable d\'origine alimentaire. Diagnostic différentiel: ulcère gastroduodénal à exclure.',
    },
    {
      title: 'Plan de Traitement',
      type: 'text',
      content: 'Prescription d\'un inhibiteur de la pompe à protons (Oméprazole 20mg 2x/jour pendant 14 jours). Régime alimentaire adapté (éviter les aliments épicés, le café, l\'alcool). Contrôle dans 1 semaine. Si persistance des symptômes, envisager une endoscopie digestive haute.',
    },
  ];
}

export function generateLaboratoryResults(patient: PatientWithDocuments): DocumentSection[] {
  return [
    {
      title: 'Informations du Test',
      type: 'text',
      content: `Date du prélèvement: ${new Date().toLocaleDateString('fr-FR')}\nDate d'analyse: ${new Date().toLocaleDateString('fr-FR')}\nType de prélèvement: Sang veineux`,
    },
    {
      title: 'Résultats',
      type: 'table',
      tableData: {
        headers: ['Test', 'Résultat', 'Unité', 'Valeurs Normales', 'Statut'],
        rows: [
          ['Hémoglobine', '14.2', 'g/dL', '12.0 - 16.0', 'Normal'],
          ['Globules Blancs', '7.8', '10³/μL', '4.0 - 11.0', 'Normal'],
          ['Plaquettes', '245', '10³/μL', '150 - 400', 'Normal'],
          ['Glycémie', '95', 'mg/dL', '70 - 110', 'Normal'],
          ['Créatinine', '0.9', 'mg/dL', '0.6 - 1.2', 'Normal'],
          ['ASAT (TGO)', '28', 'UI/L', '< 40', 'Normal'],
          ['ALAT (TGP)', '32', 'UI/L', '< 41', 'Normal'],
          ['Cholestérol total', '185', 'mg/dL', '< 200', 'Normal'],
        ],
      },
    },
    {
      title: 'Interprétation',
      type: 'text',
      content: 'L\'ensemble des paramètres biologiques analysés se situent dans les normes. La numération formule sanguine est normale, sans signe d\'anémie, d\'infection ou de trouble de la coagulation. La fonction rénale et hépatique sont conservées. Le bilan lipidique est satisfaisant.',
    },
    {
      title: 'Recommandations',
      type: 'list',
      content: [
        'Poursuivre les mesures hygiéno-diététiques actuelles',
        'Maintenir une activité physique régulière',
        'Contrôle biologique dans 6 mois',
        'Consulter en cas de nouveaux symptômes',
      ],
    },
  ];
}

export function generateMedicalCertificate(patient: PatientWithDocuments): DocumentSection[] {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 5);

  return [
    {
      title: 'Type de Certificat',
      type: 'text',
      content: 'Certificat Médical d\'Arrêt de Travail',
    },
    {
      title: 'Observations Médicales',
      type: 'text',
      content: `Je soussigné(e), Docteur de l'OKAPIA MEDICAL, certifie avoir examiné ce jour ${patient.first_name} ${patient.last_name}, né(e) le ${new Date(patient.date_of_birth).toLocaleDateString('fr-FR')}, demeurant à ${patient.address}, ${patient.city}.\n\nÀ l'issue de cet examen, j'ai constaté un état de santé nécessitant un repos médical. Le patient présente une gastro-entérite aiguë avec syndrome fébrile nécessitant un arrêt de travail.`,
    },
    {
      title: 'Durée',
      type: 'text',
      content: `Repos complet recommandé du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}, soit 5 jours calendaires, sauf complications.`,
    },
    {
      title: 'Restrictions et Recommandations',
      type: 'list',
      content: [
        'Repos à domicile obligatoire',
        'Hydratation abondante',
        'Régime alimentaire léger',
        'Éviter toute activité physique intense',
        'Suivre scrupuleusement le traitement prescrit',
      ],
    },
  ];
}

export function generatePrescriptionSummary(patient: PatientWithDocuments): DocumentSection[] {
  return [
    {
      title: 'Diagnostic',
      type: 'text',
      content: 'Gastrite aiguë avec syndrome douloureux abdominal',
    },
    {
      title: 'Médicaments Prescrits',
      type: 'table',
      tableData: {
        headers: ['Médicament', 'Dosage', 'Forme', 'Quantité'],
        rows: [
          ['Oméprazole', '20 mg', 'Gélules', '28 unités'],
          ['Spasfon', '80 mg', 'Comprimés', '20 unités'],
          ['Gaviscon', '500 mg', 'Sachets', '14 unités'],
        ],
      },
    },
    {
      title: 'Posologie',
      type: 'table',
      tableData: {
        headers: ['Médicament', 'Posologie', 'Durée'],
        rows: [
          ['Oméprazole', '1 gélule matin et soir, avant les repas', '14 jours'],
          ['Spasfon', '1 comprimé 3 fois par jour en cas de douleur', 'Si besoin'],
          ['Gaviscon', '1 sachet après les repas et au coucher', '7 jours'],
        ],
      },
    },
    {
      title: 'Instructions Spéciales',
      type: 'list',
      content: [
        'Prendre l\'Oméprazole à jeun, 30 minutes avant le repas',
        'Ne pas dépasser 3 prises de Spasfon par jour',
        'Diluer le Gaviscon dans un demi-verre d\'eau',
        'Éviter l\'alcool et le tabac pendant le traitement',
      ],
    },
    {
      title: 'Précautions',
      type: 'text',
      content: 'En cas d\'effets indésirables (nausées, vertiges, éruptions cutanées), arrêter le traitement et consulter immédiatement. Conserver les médicaments à l\'abri de la lumière et de l\'humidité, hors de portée des enfants.',
    },
  ];
}

export function generateDischargeReport(patient: PatientWithDocuments): DocumentSection[] {
  const admissionDate = new Date();
  admissionDate.setDate(admissionDate.getDate() - 5);
  const dischargeDate = new Date();

  return [
    {
      title: 'Informations d\'Hospitalisation',
      type: 'text',
      content: `Date d'admission: ${admissionDate.toLocaleDateString('fr-FR')}\nDate de sortie: ${dischargeDate.toLocaleDateString('fr-FR')}\nDurée du séjour: 5 jours\nService: Médecine Interne`,
    },
    {
      title: 'Motif d\'Hospitalisation',
      type: 'text',
      content: 'Patient admis pour syndrome douloureux abdominal aigu avec vomissements et déshydratation. Suspicion d\'appendicite aiguë nécessitant une surveillance hospitalière.',
    },
    {
      title: 'Résumé du Séjour',
      type: 'text',
      content: 'À l\'admission, le patient présentait un tableau clinique évocateur d\'une appendicite aiguë. Les examens complémentaires (échographie abdominale, bilan biologique) ont confirmé une appendicite non compliquée. Le patient a bénéficié d\'une appendicectomie laparoscopique sous anesthésie générale. Les suites opératoires ont été simples, sans complications. Reprise progressive de l\'alimentation et récupération satisfaisante du transit. Cicatrisation normale des points d\'entrée. Ablation des agrafes prévue à J+10.',
    },
    {
      title: 'Traitements Effectués',
      type: 'list',
      content: [
        'Appendicectomie laparoscopique réalisée à J+1',
        'Antibiothérapie prophylactique (Ceftriaxone + Métronidazole)',
        'Antalgiques de palier II (Tramadol)',
        'Rééducation précoce et mobilisation',
        'Surveillance post-opératoire standard',
      ],
    },
    {
      title: 'État à la Sortie',
      type: 'text',
      content: 'Patient en bon état général, apyrétique depuis 48h. Douleurs post-opératoires bien contrôlées par antalgiques oraux. Transit intestinal repris. Cicatrisation en cours, pas de signe d\'infection. Autonomie complète retrouvée.',
    },
    {
      title: 'Instructions de Sortie',
      type: 'text',
      content: 'Repos relatif à domicile pendant 15 jours. Éviter les efforts physiques intenses pendant 4 semaines. Poursuivre les antalgiques selon la douleur. Pansements quotidiens jusqu\'à cicatrisation complète. Alimentation normale progressive, éviter les aliments trop gras la première semaine.',
    },
    {
      title: 'Suivi Recommandé',
      type: 'text',
      content: 'Consultation de contrôle dans 10 jours pour ablation des agrafes et vérification de la cicatrisation. Consultation chirurgicale dans 1 mois. En cas de fièvre, douleurs abdominales intenses, rougeur ou écoulement au niveau des cicatrices, consulter en urgence.',
    },
  ];
}

export function generateNursingNotes(patient: PatientWithDocuments): DocumentSection[] {
  return [
    {
      title: 'Date et Heure',
      type: 'text',
      content: `${new Date().toLocaleDateString('fr-FR')} - ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    },
    {
      title: 'Observations Générales',
      type: 'text',
      content: `Patient conscient, orienté, collaborant bien aux soins. État général stable. Pas de plainte particulière exprimée. Repos au lit respecté. Mobilisation progressive encouragée. Hydratation satisfaisante, boissons acceptées sans difficulté.`,
    },
    {
      title: 'Signes Vitaux',
      type: 'table',
      tableData: {
        headers: ['Paramètre', 'Valeur', 'Heure', 'Observations'],
        rows: [
          ['Température', '37.1°C', '08:00', 'Apyrétique'],
          ['Tension Artérielle', '125/78 mmHg', '08:00', 'Stable'],
          ['Fréquence Cardiaque', '72 bpm', '08:00', 'Régulière'],
          ['Fréquence Respiratoire', '16 cpm', '08:00', 'Normale'],
          ['Saturation O2', '98%', '08:00', 'Air ambiant'],
          ['Glycémie', '92 mg/dL', '08:00', 'Normo'],
        ],
      },
    },
    {
      title: 'Soins Prodigués',
      type: 'list',
      content: [
        'Toilette complète au lit effectuée',
        'Réfection du pansement abdominal post-opératoire',
        'Administration des médicaments selon prescription',
        'Surveillance de la cicatrice: pas de signe d\'infection',
        'Aide aux repas: alimentation légère bien tolérée',
        'Installation confortable au fauteuil pendant 2 heures',
      ],
    },
    {
      title: 'Réactions du Patient',
      type: 'text',
      content: 'Patient coopératif et motivé pour sa récupération. Douleur évaluée à 2/10 sur l\'échelle visuelle analogique, bien contrôlée par les antalgiques. Transit intestinal repris avec émission de gaz. Pas de nausées ni vomissements. Sommeil réparateur durant la nuit. Bon moral, famille présente et soutenante.',
    },
    {
      title: 'Transmissions',
      type: 'text',
      content: 'Informé l\'équipe médicale de l\'évolution favorable. Pas d\'événement intercurrent à signaler. Surveillance continue des paramètres vitaux et de l\'état général. Prochaine évaluation infirmière prévue dans 4 heures.',
    },
  ];
}

export function generatePrescription(patient: PatientWithDocuments): DocumentSection[] {
  return [
    {
      title: 'Informations Prescription',
      type: 'text',
      content: `Date de prescription: ${new Date().toLocaleDateString('fr-FR')}\nValidité: 30 jours\nNon substituable: Non`,
    },
    {
      title: 'Diagnostic Principal',
      type: 'text',
      content: 'Infection respiratoire haute avec pharyngite aiguë',
    },
    {
      title: 'Prescriptions',
      type: 'table',
      tableData: {
        headers: ['Médicament', 'Dosage', 'Voie', 'Fréquence', 'Durée'],
        rows: [
          ['Amoxicilline', '1g', 'Orale', '3 fois/jour', '7 jours'],
          ['Paracétamol', '1g', 'Orale', 'Toutes les 6h si douleur', '5 jours'],
          ['Vitamine C', '500mg', 'Orale', '2 fois/jour', '10 jours'],
          ['Sirop antitussif', '10ml', 'Orale', '3 fois/jour', '5 jours'],
        ],
      },
    },
    {
      title: 'Durée du Traitement',
      type: 'text',
      content: 'Traitement antibiotique pendant 7 jours (à compléter impérativement). Traitement symptomatique selon l\'évolution des symptômes.',
    },
    {
      title: 'Conseils et Instructions',
      type: 'list',
      content: [
        'Prendre l\'Amoxicilline pendant ou après les repas',
        'Respecter l\'intervalle de 6h entre les prises de Paracétamol',
        'Rester bien hydraté (minimum 1.5L d\'eau par jour)',
        'Repos relatif pendant 3-5 jours',
        'Éviter le contact rapproché avec d\'autres personnes',
        'Se laver fréquemment les mains',
      ],
    },
  ];
}

export function generateCustomDocument(patient: PatientWithDocuments, title: string): DocumentSection[] {
  return [
    {
      title: 'Informations Générales',
      type: 'text',
      content: `Patient: ${patient.first_name} ${patient.last_name}\nN° Patient: ${patient.patient_number}\nDate: ${new Date().toLocaleDateString('fr-FR')}`,
    },
    {
      title: 'Contenu du Document',
      type: 'text',
      content: 'Ce document personnalisé peut être adapté selon les besoins spécifiques du patient et de la situation clinique. Veuillez compléter les sections ci-dessous avec les informations pertinentes.',
    },
    {
      title: 'Observations',
      type: 'text',
      content: '[À compléter par le praticien]',
    },
    {
      title: 'Recommandations',
      type: 'list',
      content: [
        '[Recommandation 1 à compléter]',
        '[Recommandation 2 à compléter]',
        '[Recommandation 3 à compléter]',
      ],
    },
  ];
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export function generateDocumentContent(documentType: string, patient: PatientWithDocuments, customTitle?: string): DocumentSection[] {
  switch (documentType) {
    case 'consultation_report':
      return generateConsultationReport(patient);
    case 'laboratory_results':
      return generateLaboratoryResults(patient);
    case 'medical_certificate':
      return generateMedicalCertificate(patient);
    case 'prescription_summary':
      return generatePrescriptionSummary(patient);
    case 'discharge_report':
      return generateDischargeReport(patient);
    case 'nursing_notes':
      return generateNursingNotes(patient);
    case 'prescription':
      return generatePrescription(patient);
    case 'custom_document':
      return generateCustomDocument(patient, customTitle || 'Document Personnalisé');
    default:
      return generateCustomDocument(patient, 'Document Médical');
  }
}
