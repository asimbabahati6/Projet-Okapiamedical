# Guide de Démarrage Rapide - Module Médecins Référents

## 🚀 Démarrage en 5 Minutes

### Étape 1 : Insertion des Données Démonstration

Exécutez le script SQL pour ajouter les 10 médecins congolais :

**Via Supabase Dashboard :**
1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez le contenu de `scripts/insert-demo-doctors-okapi-congolais.sql`
5. Cliquez sur **Run**

**Résultat attendu :**
- ✅ 10 médecins insérés dans `user_profiles` et `medical_staff`
- ✅ Assignations aux départements créées dans `doctor_departments`
- ✅ Horaires de disponibilité configurés dans `doctor_schedule_templates`

### Étape 2 : Vérification des Données

Exécutez cette requête pour vérifier :

```sql
SELECT
  up.full_name,
  ms.specialization,
  d.name as department,
  up.phone,
  up.email
FROM user_profiles up
JOIN medical_staff ms ON ms.id = up.id
JOIN doctor_departments dd ON dd.doctor_id = up.id
JOIN departments d ON d.id = dd.department_id
WHERE up.role = 'doctor'
ORDER BY up.full_name;
```

Vous devriez voir 10 médecins avec toutes leurs informations.

### Étape 3 : Accéder au Dashboard Médecins

**URL :** `/staff/doctors-dashboard`

1. Connectez-vous en tant qu'administrateur
2. Naviguez vers **Gestion → Tableau de Bord Médecins**
3. Vous verrez :
   - 4 cards de métriques globales
   - Filtres par département
   - Liste déroulante des départements avec leurs médecins

### Étape 4 : Tester la Prise de Rendez-vous

#### Option A : Via le formulaire de rendez-vous

```tsx
// Dans votre composant de prise de RDV
import DepartmentDoctorCascadeSelector from '@/components/appointments/DepartmentDoctorCascadeSelector';
import InteractiveAppointmentCalendar from '@/components/appointments/InteractiveAppointmentCalendar';

function AppointmentBooking() {
  const [step, setStep] = useState(1);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');

  return (
    <div>
      {step === 1 && (
        <>
          <DepartmentDoctorCascadeSelector
            selectedDepartmentId={departmentId}
            selectedDoctorId={doctorId}
            onDepartmentChange={setDepartmentId}
            onDoctorChange={(id, name) => {
              setDoctorId(id);
              if (name) setDoctorName(name);
            }}
            required
          />
          <button
            onClick={() => setStep(2)}
            disabled={!doctorId}
          >
            Suivant
          </button>
        </>
      )}

      {step === 2 && doctorId && (
        <InteractiveAppointmentCalendar
          doctorId={doctorId}
          doctorName={doctorName}
          selectedDate={date}
          selectedTime={time}
          onDateTimeSelect={(newDate, newTime) => {
            setDate(newDate);
            setTime(newTime);
          }}
        />
      )}
    </div>
  );
}
```

#### Option B : Test manuel

1. Ouvrez le composant `DepartmentDoctorCascadeSelector`
2. Sélectionnez **Cardiologie**
3. Choisissez **Dr. Jean Mukendi**
4. Le calendrier affiche les disponibilités (Lun-Ven 08:00-16:00)
5. Sélectionnez une date future
6. Choisissez un créneau disponible (vert)

### Étape 5 : Tester les Exports

#### Export PDF Patient avec Médecin

```typescript
import { exportPatientToPDF } from '@/services/patientPDFExportService';

// Exporter un patient avec son médecin référent
await exportPatientToPDF('patient-id', {
  includeConsultations: true,
  includeMedicalHistory: true,
  includeAllergies: true
});
```

**Résultat :** PDF avec section "MÉDECIN RÉFÉRENT" enrichie (nom, spécialité, département, RPPS, email, téléphone)

#### Export Excel Tous les Patients

```typescript
import { exportAllPatientsToExcel } from '@/services/patientExcelExportService';

// Exporter tous les patients avec info médecins
await exportAllPatientsToExcel({
  search: '',
  bloodType: '',
  gender: ''
});
```

**Résultat :** Fichier Excel avec 15 colonnes incluant :
- Médecin Référent
- Spécialité Médecin
- Département Médecin
- Téléphone Médecin
- Email Médecin

---

## 📊 Utilisation du Service Analytics

### Récupérer les Statistiques Globales

```typescript
import { getDoctorsGlobalStats } from '@/services/doctorAnalyticsService';

const stats = await getDoctorsGlobalStats();

console.log(stats.totalDoctors);        // 10
console.log(stats.activeDoctors);       // 10
console.log(stats.averageOccupancy);    // X%
console.log(stats.todayAppointments);   // Nombre de RDV aujourd'hui
```

### Récupérer la Charge d'un Médecin

```typescript
import { getDoctorWorkload } from '@/services/doctorAnalyticsService';

const workload = await getDoctorWorkload('doctor-id', {
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});

console.log(workload.patientsAssigned);    // Nombre de patients
console.log(workload.appointmentsToday);   // RDV aujourd'hui
console.log(workload.occupancyRate);       // Taux d'occupation %
```

### Obtenir les Médecins d'un Département

```typescript
import { getDoctorsByDepartment } from '@/services/doctorAnalyticsService';

const doctors = await getDoctorsByDepartment('cardiologie-dept-id');

doctors.forEach(doc => {
  console.log(`${doc.doctorName} - ${doc.patientsAssigned} patients`);
});
```

### Exporter les Données en CSV

```typescript
import { exportDoctorsDataCSV } from '@/services/doctorAnalyticsService';

const csv = await exportDoctorsDataCSV({
  departmentIds: ['dept-1', 'dept-2']
});

// Télécharger le fichier
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'medecins-rapport.csv';
link.click();
```

---

## 🎯 Cas d'Usage Principaux

### 1. Assigner un Médecin Référent à un Patient

**Scénario :** Lors de la création/édition d'un patient

```tsx
import DepartmentDoctorCascadeSelector from '@/components/appointments/DepartmentDoctorCascadeSelector';

function PatientForm() {
  const [physicianId, setPhysicianId] = useState<string | null>(null);

  async function savePatient() {
    await supabase
      .from('patients')
      .update({ primary_care_physician_id: physicianId })
      .eq('id', patientId);
  }

  return (
    <form>
      {/* Autres champs... */}

      <DepartmentDoctorCascadeSelector
        selectedDoctorId={physicianId}
        onDepartmentChange={() => {}}
        onDoctorChange={(id) => setPhysicianId(id)}
      />

      <button onClick={savePatient}>Enregistrer</button>
    </form>
  );
}
```

### 2. Afficher les Informations du Médecin Référent

**Scénario :** Dans la fiche patient

Le composant `PhysicianBadgeCard` est déjà utilisé dans `PatientDetailsModal`. Il affiche automatiquement :
- Avatar avec initiales
- Nom et spécialité
- Modal détaillé au clic avec :
  - N° RPPS (copiable)
  - Email (cliquable)
  - Téléphone (cliquable)
  - Département

### 3. Prendre un Rendez-vous

**Scénario :** Workflow complet de prise de RDV

```tsx
function AppointmentBookingWorkflow() {
  // Étape 1 : Sélection Patient
  const [patientId, setPatientId] = useState<string | null>(null);

  // Étape 2 : Sélection Département + Médecin
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // Étape 3 : Sélection Date + Heure
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');

  // Étape 4 : Motif et Confirmation
  const [reason, setReason] = useState<string>('');

  async function confirmAppointment() {
    const { error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        department_id: departmentId,
        appointment_date: date,
        appointment_time: time,
        reason: reason,
        status: 'scheduled'
      });

    if (!error) {
      // Afficher confirmation
      // Envoyer notification SMS/Email
    }
  }

  return (
    <div className="space-y-6">
      {/* Étape 1 */}
      <PatientSelector
        selectedPatientId={patientId}
        onSelect={setPatientId}
      />

      {/* Étape 2 */}
      {patientId && (
        <DepartmentDoctorCascadeSelector
          selectedDepartmentId={departmentId}
          selectedDoctorId={doctorId}
          onDepartmentChange={setDepartmentId}
          onDoctorChange={(id) => setDoctorId(id)}
        />
      )}

      {/* Étape 3 */}
      {doctorId && (
        <InteractiveAppointmentCalendar
          doctorId={doctorId}
          doctorName="Dr. Nom"
          selectedDate={date}
          selectedTime={time}
          onDateTimeSelect={(d, t) => {
            setDate(d);
            setTime(t);
          }}
        />
      )}

      {/* Étape 4 */}
      {date && time && (
        <>
          <textarea
            placeholder="Motif de la consultation"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <button onClick={confirmAppointment}>
            Confirmer le rendez-vous
          </button>
        </>
      )}
    </div>
  );
}
```

### 4. Voir le Dashboard des Médecins

**Scénario :** Analyse et suivi de l'activité médicale

1. Accéder à `/staff/doctors-dashboard`
2. **Métriques globales** affichées automatiquement
3. **Filtrer par départements** en cochant les cases
4. **Développer un département** pour voir ses médecins
5. **Rechercher un médecin** avec la barre de recherche
6. **Actions rapides** :
   - Cliquer sur 📅 pour voir le planning
   - Cliquer sur ✉️ pour envoyer un email
   - Cliquer sur 📞 pour appeler
7. **Exporter** en cliquant sur "Exporter CSV"

---

## 🔍 Dépannage

### Problème : Les médecins n'apparaissent pas

**Solutions :**
1. Vérifier que le script SQL a été exécuté
2. Vérifier les RLS policies sur `medical_staff` et `user_profiles`
3. Vérifier que `is_active = true` dans `doctor_departments`

```sql
-- Vérifier les médecins
SELECT COUNT(*) FROM medical_staff;

-- Vérifier les assignations
SELECT COUNT(*) FROM doctor_departments WHERE is_active = true;
```

### Problème : Le calendrier ne charge pas les disponibilités

**Solutions :**
1. Vérifier que le médecin a des templates de planning :
```sql
SELECT * FROM doctor_schedule_templates WHERE doctor_id = 'xxx';
```

2. Vérifier le `slot_duration` du médecin :
```sql
SELECT slot_duration FROM doctor_schedule_templates WHERE doctor_id = 'xxx' LIMIT 1;
```

3. Vérifier les données du médecin :
```sql
SELECT * FROM medical_staff WHERE id = 'xxx';
```

### Problème : Les exports ne contiennent pas les données médecin

**Solutions :**
1. Vérifier que le patient a un médecin référent assigné :
```sql
SELECT primary_care_physician_id FROM patients WHERE id = 'xxx';
```

2. Vérifier la jointure :
```sql
SELECT
  p.id,
  p.first_name,
  ms.specialization,
  up.full_name as doctor_name
FROM patients p
LEFT JOIN medical_staff ms ON ms.id = p.primary_care_physician_id
LEFT JOIN user_profiles up ON up.id = ms.id
WHERE p.id = 'xxx';
```

### Problème : Erreur TypeScript lors de la build

**Solutions :**
1. Vérifier que toutes les interfaces sont à jour
2. Exécuter `npm run typecheck`
3. Si erreur persiste, supprimer `node_modules` et réinstaller :
```bash
rm -rf node_modules
npm install
npm run build
```

---

## 📞 Support

**Questions Techniques :**
- Consultez la documentation complète : `MODULE_MEDECINS_REFERENTS_DOCUMENTATION.md`
- Vérifiez les types TypeScript dans les fichiers sources
- Regardez les exemples de code dans ce guide

**Bugs ou Problèmes :**
- Créez une issue sur GitHub avec :
  - Description du problème
  - Étapes pour reproduire
  - Captures d'écran si applicable
  - Messages d'erreur

---

**Guide créé le 13 Février 2026**
**Version 1.0.0**
