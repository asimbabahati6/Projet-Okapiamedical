import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';

export type DemoRole = 'medecin' | 'laborantin' | 'pharmacien';

export type LabRequestStatus = 'en_attente' | 'en_cours' | 'termine';
export type PrescriptionStatus = 'a_delivrer' | 'en_cours' | 'delivree';
export type ConsultationStatus = 'brouillon' | 'en_cours' | 'terminee';

export interface LabRequest {
  id: string;
  consultation_id: string;
  order_number: string;
  patient_name: string;
  patient_id: string;
  tests: string[];
  priority: 'normal' | 'urgent' | 'stat';
  status: LabRequestStatus;
  doctor_name: string;
  created_at: string;
  notes?: string;
}

export interface PrescriptionItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  consultation_id: string;
  prescription_number: string;
  patient_name: string;
  patient_id: string;
  doctor_name: string;
  items: PrescriptionItem[];
  status: PrescriptionStatus;
  created_at: string;
  notes?: string;
}

export interface DemoConsultation {
  id: string;
  consultation_number: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  consultation_type: string;
  consultation_status: ConsultationStatus;
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  created_at: string;
  lab_requests: LabRequest[];
  prescriptions: Prescription[];
}

interface WorkflowContextType {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  consultations: DemoConsultation[];
  labRequests: LabRequest[];
  prescriptions: Prescription[];
  addConsultation: (
    c: Omit<DemoConsultation, 'id' | 'consultation_number' | 'created_at' | 'lab_requests' | 'prescriptions'> & {
      lab_tests?: string[];
      medications?: PrescriptionItem[];
      priority?: LabRequest['priority'];
    }
  ) => void;
  updateLabRequestStatus: (id: string, status: LabRequestStatus) => void;
  updatePrescriptionStatus: (id: string, status: PrescriptionStatus) => void;
}

const MOCK_CONSULTATIONS: DemoConsultation[] = [
  {
    id: 'c1',
    consultation_number: 'CONS-2026-001',
    patient_id: 'p1',
    patient_name: 'Jean-Paul Mbala',
    doctor_name: 'Dr. Amani Katebe',
    consultation_type: 'initial',
    consultation_status: 'terminee',
    chief_complaint: 'Fièvre persistante depuis 3 jours',
    diagnosis: 'Paludisme confirmé (J06.9)',
    treatment_plan: 'Artémether-luméfantrine 80/480mg, 2 cp 2x/j pendant 3 jours',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    lab_requests: [],
    prescriptions: [],
  },
];

const MOCK_LAB_REQUESTS: LabRequest[] = [
  {
    id: 'lr1',
    consultation_id: 'c1',
    order_number: 'LAB-2026-041',
    patient_name: 'Jean-Paul Mbala',
    patient_id: 'p1',
    tests: ['NFS complète', 'Frottis sanguin', 'CRP'],
    priority: 'urgent',
    status: 'en_attente',
    doctor_name: 'Dr. Amani Katebe',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'pr1',
    consultation_id: 'c1',
    prescription_number: 'ORD-2026-081',
    patient_name: 'Jean-Paul Mbala',
    patient_id: 'p1',
    doctor_name: 'Dr. Amani Katebe',
    items: [{ name: 'Artémether-luméfantrine 80/480mg', dosage: '2 comprimés', frequency: '2x/jour', duration: '3 jours' }],
    status: 'a_delivrer',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

let consultationCounter = 4;
let labCounter = 45;
let prescriptionCounter = 84;

export function DemoWorkflowProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<DemoRole>('medecin');
  const [consultations, setConsultations] = useState<DemoConsultation[]>(MOCK_CONSULTATIONS);
  const [labRequests, setLabRequests] = useState<LabRequest[]>(MOCK_LAB_REQUESTS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);

  const addConsultation = useCallback(
    (
      data: Omit<DemoConsultation, 'id' | 'consultation_number' | 'created_at' | 'lab_requests' | 'prescriptions'> & {
        lab_tests?: string[];
        medications?: PrescriptionItem[];
        priority?: LabRequest['priority'];
      }
    ) => {
      const consultationId = `c${Date.now()}`;
      const consultationNumber = `CONS-2026-${String(consultationCounter++).padStart(3, '0')}`;
      const now = new Date().toISOString();

      const newLabRequests: LabRequest[] = [];
      const newPrescriptions: Prescription[] = [];

      if (data.lab_tests && data.lab_tests.length > 0) {
        const lr: LabRequest = {
          id: `lr${Date.now()}`,
          consultation_id: consultationId,
          order_number: `LAB-2026-${String(labCounter++).padStart(3, '0')}`,
          patient_name: data.patient_name,
          patient_id: data.patient_id,
          tests: data.lab_tests,
          priority: data.priority ?? 'normal',
          status: 'en_attente',
          doctor_name: data.doctor_name,
          created_at: now,
        };
        newLabRequests.push(lr);
        setLabRequests(prev => [lr, ...prev]);
      }

      if (data.medications && data.medications.length > 0) {
        const pr: Prescription = {
          id: `pr${Date.now()}`,
          consultation_id: consultationId,
          prescription_number: `ORD-2026-${String(prescriptionCounter++).padStart(3, '0')}`,
          patient_name: data.patient_name,
          patient_id: data.patient_id,
          doctor_name: data.doctor_name,
          items: data.medications,
          status: 'a_delivrer',
          created_at: now,
        };
        newPrescriptions.push(pr);
        setPrescriptions(prev => [pr, ...prev]);
      }

      const consultation: DemoConsultation = {
        id: consultationId,
        consultation_number: consultationNumber,
        patient_id: data.patient_id,
        patient_name: data.patient_name,
        doctor_name: data.doctor_name,
        consultation_type: data.consultation_type,
        consultation_status: data.consultation_status,
        chief_complaint: data.chief_complaint,
        diagnosis: data.diagnosis,
        treatment_plan: data.treatment_plan,
        created_at: now,
        lab_requests: newLabRequests,
        prescriptions: newPrescriptions,
      };

      setConsultations(prev => [consultation, ...prev]);
    },
    []
  );

  const updateLabRequestStatus = useCallback((id: string, status: LabRequestStatus) => {
    setLabRequests(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  }, []);

  const updatePrescriptionStatus = useCallback((id: string, status: PrescriptionStatus) => {
    setPrescriptions(prev => prev.map(p => (p.id === id ? { ...p, status } : p)));
  }, []);

  return (
    <WorkflowContext.Provider
      value={{ role, setRole, consultations, labRequests, prescriptions, addConsultation, updateLabRequestStatus, updatePrescriptionStatus }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useDemoWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error('useDemoWorkflow must be used within DemoWorkflowProvider');
  return ctx;
}

export { useDemoWorkflow as useWorkflow };
export { DemoWorkflowProvider as WorkflowProvider };
