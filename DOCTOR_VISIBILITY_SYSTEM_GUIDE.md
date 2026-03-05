# Doctor Visibility System - Complete Implementation Guide

## Overview

This system provides comprehensive tools to diagnose, fix, and prevent doctor visibility issues across the healthcare management platform.

## Components Implemented

### 1. Database Layer

#### Views Created

**`doctors_visibility_status`**
- Comprehensive view showing all doctor visibility states
- Includes diagnostic information about user, department, and availability
- Calculates visibility status and priority automatically
- Accessible to all authenticated users

**`invisible_doctors_report`**
- Filtered view showing only doctors with visibility issues
- Ordered by priority (critical issues first)
- Excludes visible doctors for quick troubleshooting

#### Functions Created

**`activate_doctor(doctor_id uuid)`**
- Activates a single doctor across all systems
- Steps performed:
  1. Activates user profile
  2. Enables patient acceptance
  3. Sets status to 'available'
  4. Makes department public and active
  5. Activates department junctions
  6. Creates Mon-Fri availability schedule
- Returns detailed activation report
- Requires admin role (super_admin or hospital_admin)

**`bulk_activate_invisible_doctors()`**
- Activates all invisible doctors in bulk
- Excludes banned users and unconfirmed emails
- Returns comprehensive results for each doctor
- Requires admin role

#### Default Values Set

```sql
-- Medical Staff defaults
is_accepting_patients: true
current_status: 'available'

-- User Profiles defaults
is_active: true
```

#### Indexes Added

- `idx_medical_staff_visibility` - Fast lookup for accepting doctors
- `idx_departments_public` - Fast lookup for public departments
- `idx_user_profiles_active` - Fast lookup for active users

### 2. Admin Troubleshooting Component

**Location:** `/src/components/admin/DoctorVisibilityTroubleshooter.tsx`

**Features:**
- Real-time visibility monitoring
- Individual doctor activation
- Bulk activation of all invisible doctors
- Detailed diagnostic information
- Visual status indicators with priority badges
- Filter between all doctors and invisible only
- Expandable details for each doctor
- Statistics dashboard

**How to Use:**

1. Navigate to the admin panel
2. Import and render the component:
   ```tsx
   import { DoctorVisibilityTroubleshooter } from './components/admin/DoctorVisibilityTroubleshooter';

   <DoctorVisibilityTroubleshooter />
   ```

3. View doctors and their visibility status
4. Click "Activate" on individual doctors to fix issues
5. Use "Bulk Activate All" to fix all invisible doctors at once

### 3. Enhanced AddDoctorModal

**Location:** `/src/components/doctors/AddDoctorModal.tsx`

**Improvements Made:**
- Filters to show only PUBLIC departments
- Creates complete doctor profile with correct schema
- Sets visibility defaults automatically:
  - `is_accepting_patients: true`
  - `current_status: 'available'`
  - `user_profiles.is_active: true`
- Creates Mon-Fri availability schedule automatically
- Shows visibility notes to admin
- Proper error handling and user feedback

**Schema Structure:**
```typescript
// Creates records in correct order:
1. auth.users (authentication)
2. user_profiles (profile info)
3. medical_staff (medical details)
4. doctor_departments (department assignment)
5. doctor_availability_calendar (availability)
```

### 4. Doctor Visibility Service

**Location:** `/src/services/doctorVisibilityService.ts`

**API Methods:**

```typescript
// Get all doctors with visibility status
await doctorVisibilityService.getAllDoctors();

// Get only invisible doctors
await doctorVisibilityService.getInvisibleDoctors();

// Activate single doctor
await doctorVisibilityService.activateDoctor(doctorId);

// Bulk activate all invisible
await doctorVisibilityService.bulkActivateInvisible();

// Check specific doctor's visibility
await doctorVisibilityService.checkDoctorVisibility(doctorId);

// Get doctors by department
await doctorVisibilityService.getDepartmentDoctors(departmentId);

// Get visibility statistics
await doctorVisibilityService.getVisibilityStats();

// Manual fixes with granular control
await doctorVisibilityService.fixDoctorVisibilityManually(doctorId, {
  activateUser: true,
  enablePatientAcceptance: true,
  setStatusAvailable: true,
  makeDepartmentPublic: true,
  createAvailabilitySchedule: true
});

// Validate doctor data
await doctorVisibilityService.validateDoctorData(doctorId);
```

## Visibility Status Hierarchy

The system assigns priorities to visibility issues:

| Priority | Status | Description |
|----------|--------|-------------|
| 0 | Visible | Doctor is fully visible and available |
| 1 | Banned | User is banned (requires manual review) |
| 2 | Email not confirmed | User hasn't confirmed email |
| 3 | User inactive | User profile is inactive |
| 4 | Not accepting patients | `is_accepting_patients = false` |
| 5 | Private department | Department is not public |
| 6 | Inactive department | Department is inactive |
| 7 | Status issue | Current status is off_duty/unavailable |

## Troubleshooting Workflow

### For Individual Doctors

1. **Identify the issue:**
   ```sql
   SELECT * FROM doctors_visibility_status
   WHERE id = 'DOCTOR_ID';
   ```

2. **Check visibility status field:**
   - "Visible" = No action needed
   - "Not accepting patients" = Use activate function
   - "Private department" = Use activate function or reassign
   - "User inactive" = Use activate function
   - "Banned" = Requires manual admin review
   - "Email not confirmed" = Resend confirmation email

3. **Activate the doctor:**
   ```sql
   SELECT activate_doctor('DOCTOR_ID');
   ```

   Or use the UI component:
   - Navigate to DoctorVisibilityTroubleshooter
   - Find the doctor
   - Click "Activate" button

### For Bulk Issues

1. **Check how many doctors are invisible:**
   ```sql
   SELECT COUNT(*) FROM invisible_doctors_report;
   ```

2. **Review the issues:**
   ```sql
   SELECT visibility_status, COUNT(*)
   FROM invisible_doctors_report
   GROUP BY visibility_status;
   ```

3. **Bulk activate (excludes banned/unconfirmed):**
   ```sql
   SELECT bulk_activate_invisible_doctors();
   ```

   Or use the UI:
   - Click "Bulk Activate All" in the troubleshooter

## Prevention Best Practices

### When Creating Doctors

1. **Always use public departments:**
   - AddDoctorModal now filters automatically
   - Avoid: Administration, Logistique
   - Use: Cardiologie, Chirurgie, Médecine Générale, etc.

2. **Verify defaults are set:**
   - Database now sets defaults automatically
   - AddDoctorModal sets all required fields

3. **Create availability schedule:**
   - Now created automatically by AddDoctorModal
   - Manual: Use `activate_doctor()` function

### Monitoring

1. **Set up regular checks:**
   ```sql
   -- Weekly monitoring query
   SELECT
     visibility_status,
     COUNT(*) as count
   FROM doctors_visibility_status
   GROUP BY visibility_status
   ORDER BY COUNT(*) DESC;
   ```

2. **Use the visibility service:**
   ```typescript
   // In your admin dashboard
   const stats = await doctorVisibilityService.getVisibilityStats();
   console.log(`Invisible doctors: ${stats.invisible}`);
   ```

3. **Set up alerts:**
   - Monitor `invisible_doctors_report` view
   - Alert when count > threshold

## Integration Guide

### Add to Settings Page

```tsx
import { DoctorVisibilityTroubleshooter } from '../components/admin/DoctorVisibilityTroubleshooter';

// In your settings/admin page
<Tab label="Doctor Visibility">
  <DoctorVisibilityTroubleshooter />
</Tab>
```

### Add to Admin Dashboard

```tsx
import { doctorVisibilityService } from '../services/doctorVisibilityService';

function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    doctorVisibilityService.getVisibilityStats()
      .then(setStats);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Invisible Doctors"
        value={stats?.invisible}
        alert={stats?.invisible > 0}
      />
      {/* ... other stats */}
    </div>
  );
}
```

### Add Quick Fix Button

```tsx
// In doctor list or details page
<button onClick={() => activateDoctor(doctor.id)}>
  Quick Fix Visibility
</button>
```

## Testing the System

### 1. Test Visibility Detection

```sql
-- Should return doctors with issues
SELECT * FROM invisible_doctors_report;
```

### 2. Test Single Activation

```typescript
const result = await doctorVisibilityService.activateDoctor(doctorId);
console.log(result.activation_steps);
```

### 3. Test Bulk Activation

```typescript
const result = await doctorVisibilityService.bulkActivateInvisible();
console.log(`Activated: ${result.total_activated}`);
```

### 4. Test New Doctor Creation

1. Use AddDoctorModal to create a doctor
2. Check visibility immediately:
   ```sql
   SELECT visibility_status
   FROM doctors_visibility_status
   WHERE full_name = 'New Doctor';
   ```
3. Should show "Visible"

## Database Queries Reference

### Find All Invisible Doctors
```sql
SELECT * FROM invisible_doctors_report;
```

### Check Specific Doctor
```sql
SELECT * FROM doctors_visibility_status WHERE id = 'DOCTOR_ID';
```

### Activate Single Doctor
```sql
SELECT activate_doctor('DOCTOR_ID');
```

### Bulk Activate All
```sql
SELECT bulk_activate_invisible_doctors();
```

### Get Statistics
```sql
SELECT
  COUNT(*) FILTER (WHERE visibility_status = 'Visible') as visible,
  COUNT(*) FILTER (WHERE visibility_status != 'Visible') as invisible,
  COUNT(*) as total
FROM doctors_visibility_status;
```

### Find Doctors by Issue
```sql
-- Not accepting patients
SELECT * FROM doctors_visibility_status
WHERE visibility_status = 'Not accepting patients';

-- Private department
SELECT * FROM doctors_visibility_status
WHERE visibility_status = 'Private department';

-- Critical priority
SELECT * FROM doctors_visibility_status
WHERE visibility_priority BETWEEN 1 AND 2;
```

## Common Issues & Solutions

### Issue: Doctor created but not visible

**Diagnosis:**
```sql
SELECT visibility_status FROM doctors_visibility_status WHERE id = 'DOCTOR_ID';
```

**Solution:**
```sql
SELECT activate_doctor('DOCTOR_ID');
```

### Issue: Department visibility affects multiple doctors

**Diagnosis:**
```sql
SELECT d.name, d.is_public, COUNT(ms.id) as doctor_count
FROM departments d
LEFT JOIN user_profiles up ON up.department_id = d.id
LEFT JOIN medical_staff ms ON ms.id = up.id
WHERE d.is_public = false
GROUP BY d.id, d.name;
```

**Solution:**
```sql
-- Make department public
UPDATE departments
SET is_public = true
WHERE name = 'DEPARTMENT_NAME';

-- Or bulk activate doctors
SELECT bulk_activate_invisible_doctors();
```

### Issue: No availability schedule

**Diagnosis:**
```sql
SELECT COUNT(*)
FROM doctor_availability_calendar
WHERE doctor_id = 'DOCTOR_ID' AND is_available = true;
```

**Solution:**
```sql
SELECT activate_doctor('DOCTOR_ID');
```

## Support & Maintenance

### Logs to Monitor

- Activation function execution time
- Number of invisible doctors trend
- Bulk activation results
- Doctor creation success rate

### Performance Considerations

- Views are indexed for fast queries
- Bulk operations are transaction-safe
- Functions use SECURITY DEFINER for consistent permissions

### Future Enhancements

1. Automated email notifications for invisible doctors
2. Schedule-based auto-activation
3. API webhooks for visibility changes
4. Historical tracking of visibility status
5. Integration with audit logs

---

## Quick Command Reference

```bash
# Check invisible doctors
SELECT COUNT(*) FROM invisible_doctors_report;

# Activate one
SELECT activate_doctor('UUID');

# Activate all
SELECT bulk_activate_invisible_doctors();

# Get stats
SELECT * FROM doctors_visibility_status WHERE visibility_status != 'Visible';
```

This system provides a complete solution for managing doctor visibility across your healthcare platform!
