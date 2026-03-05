# Doctor Visibility - Quick Reference Card

## 🚨 Quick Diagnostic

```sql
-- How many invisible?
SELECT COUNT(*) FROM invisible_doctors_report;

-- Show me the invisible doctors
SELECT full_name, visibility_status FROM invisible_doctors_report;
```

## ⚡ Quick Fixes

### Fix One Doctor
```sql
SELECT activate_doctor('DOCTOR_ID_HERE');
```

### Fix All Invisible Doctors
```sql
SELECT bulk_activate_invisible_doctors();
```

### Manual Fix (if needed)
```sql
-- All in one
UPDATE user_profiles SET is_active = true WHERE id = 'ID';
UPDATE medical_staff SET is_accepting_patients = true, current_status = 'available' WHERE id = 'ID';
```

## 🎯 Common Issues & Solutions

| Issue | Quick Fix |
|-------|-----------|
| Not accepting patients | `SELECT activate_doctor('id')` |
| Private department | `SELECT activate_doctor('id')` (makes dept public) |
| User inactive | `SELECT activate_doctor('id')` |
| No availability | `SELECT activate_doctor('id')` |
| Multiple issues | `SELECT bulk_activate_invisible_doctors()` |

## 🔍 Monitoring

```sql
-- Daily check
SELECT
  COUNT(*) FILTER (WHERE visibility_status = 'Visible') as visible,
  COUNT(*) FILTER (WHERE visibility_status != 'Visible') as invisible
FROM doctors_visibility_status;
```

## 💻 For Developers

```typescript
import { doctorVisibilityService } from './services/doctorVisibilityService';

// Get stats
const stats = await doctorVisibilityService.getVisibilityStats();

// Activate
await doctorVisibilityService.activateDoctor(doctorId);

// Bulk activate
await doctorVisibilityService.bulkActivateInvisible();
```

## 🖥️ Admin UI

```tsx
import { DoctorVisibilityTroubleshooter } from './components/admin/DoctorVisibilityTroubleshooter';

// Add to your admin routes
<Route path="/admin/doctor-visibility" element={<DoctorVisibilityTroubleshooter />} />
```

## 📊 Visibility Priorities

- **0** = Visible ✅
- **1-2** = Critical (banned, unconfirmed)
- **3-4** = High (inactive, not accepting)
- **5-7** = Medium (department, status)

## ✅ Prevention

When creating doctors:
- Use public departments only
- AddDoctorModal now handles defaults automatically
- Verify immediately after creation

## 📚 Full Documentation

- `DOCTOR_VISIBILITY_SYSTEM_GUIDE.md` - Complete guide
- `DOCTOR_VISIBILITY_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `scripts/test-doctor-visibility.sql` - All diagnostic queries

## 🆘 Emergency Commands

```sql
-- Check one doctor
SELECT * FROM doctors_visibility_status WHERE id = 'DOCTOR_ID';

-- Find all issues
SELECT visibility_status, COUNT(*) FROM invisible_doctors_report GROUP BY visibility_status;

-- Nuclear option: activate everyone
SELECT bulk_activate_invisible_doctors();
```

---

**Remember**: The `activate_doctor` function fixes EVERYTHING automatically!
