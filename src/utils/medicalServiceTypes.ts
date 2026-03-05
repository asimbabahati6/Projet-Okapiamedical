export interface MedicalServiceType {
  code: string;
  name: string;
  category: 'consultation' | 'examen' | 'traitement';
  minPrice: number;
  maxPrice: number;
  probability: number;
}

export const MEDICAL_SERVICES: MedicalServiceType[] = [
  { code: 'CONS-GEN', name: 'Consultation Générale', category: 'consultation', minPrice: 50, maxPrice: 100, probability: 0.20 },
  { code: 'CONS-SPEC', name: 'Consultation Spécialisée', category: 'consultation', minPrice: 100, maxPrice: 200, probability: 0.15 },
  { code: 'CONS-URG', name: 'Consultation Urgence', category: 'consultation', minPrice: 150, maxPrice: 300, probability: 0.05 },

  { code: 'EXAM-SANG', name: 'Examen Sanguin', category: 'examen', minPrice: 80, maxPrice: 150, probability: 0.15 },
  { code: 'EXAM-RADIO', name: 'Radiographie', category: 'examen', minPrice: 120, maxPrice: 250, probability: 0.10 },
  { code: 'EXAM-ECHO', name: 'Échographie', category: 'examen', minPrice: 150, maxPrice: 300, probability: 0.08 },
  { code: 'EXAM-SCAN', name: 'Scanner', category: 'examen', minPrice: 300, maxPrice: 600, probability: 0.02 },

  { code: 'TRAIT-MED', name: 'Traitement Médicamenteux', category: 'traitement', minPrice: 100, maxPrice: 400, probability: 0.12 },
  { code: 'TRAIT-CHIR', name: 'Intervention Chirurgicale', category: 'traitement', minPrice: 800, maxPrice: 2000, probability: 0.03 },
  { code: 'TRAIT-HOSP', name: 'Hospitalisation (jour)', category: 'traitement', minPrice: 200, maxPrice: 500, probability: 0.08 },
  { code: 'TRAIT-KINE', name: 'Kinésithérapie', category: 'traitement', minPrice: 60, maxPrice: 120, probability: 0.02 }
];

export function selectRandomService(): MedicalServiceType {
  const random = Math.random();
  let cumulativeProbability = 0;

  for (const service of MEDICAL_SERVICES) {
    cumulativeProbability += service.probability;
    if (random <= cumulativeProbability) {
      return service;
    }
  }

  return MEDICAL_SERVICES[0];
}

export function generateServicePrice(service: MedicalServiceType): number {
  const basePrice = service.minPrice + Math.random() * (service.maxPrice - service.minPrice);
  return Math.round(basePrice / 10) * 10;
}

export function getCategoryDistribution(): { consultation: number; examen: number; traitement: number } {
  const consultation = MEDICAL_SERVICES
    .filter(s => s.category === 'consultation')
    .reduce((sum, s) => sum + s.probability, 0);

  const examen = MEDICAL_SERVICES
    .filter(s => s.category === 'examen')
    .reduce((sum, s) => sum + s.probability, 0);

  const traitement = MEDICAL_SERVICES
    .filter(s => s.category === 'traitement')
    .reduce((sum, s) => sum + s.probability, 0);

  return { consultation, examen, traitement };
}
