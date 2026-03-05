# Laboratory Analysis Request - Quick Reference Guide

## 🎯 Feature Summary

A production-ready laboratory analysis request system with role-based access control, allowing authorized users to create lab orders through an intuitive modal interface.

---

## 🔐 Role-Based Access Control

### Button Visibility & Behavior

```
┌─────────────────────┬──────────────┬───────────────────────────────────┐
│ Role                │ Button State │ Action                            │
├─────────────────────┼──────────────┼───────────────────────────────────┤
│ Doctor              │ ✅ Enabled   │ Opens modal (doctor auto-filled)  │
│ Medical Director    │ ✅ Enabled   │ Opens modal (full access)         │
│ Super Admin         │ ✅ Enabled   │ Opens modal (full access)         │
│ Lab Technician      │ ⚠️  Visible  │ Shows info tooltip                │
│ Other Roles         │ ❌ Disabled  │ No interaction                    │
└─────────────────────┴──────────────┴───────────────────────────────────┘
```

---

## 📋 Form Fields

### Required Fields (marked with *)

1. **Patient** *
   - Format: `Patient Number - First Name Last Name`
   - Type: Dropdown (searchable)
   - Source: `patients` table

2. **Prescribing Doctor** *
   - Auto-filled for doctors (read-only)
   - Editable for directors/admins
   - Source: `medical_staff_extension` table

3. **Laboratory Test** *
   - Format: `Test Name (Code) - $Price [Category]`
   - Type: Dropdown
   - Source: `lab_tests` table (active only)

4. **Priority Level** *
   - Options: Normal ⚪ | Urgent 🔴
   - Type: Radio buttons
   - Default: Normal

### Optional Fields

5. **Clinical Notes**
   - Max: 500 characters
   - Type: Textarea (4 rows)
   - Character counter shown

---

## 🎨 UI Components

### Button Location
```
┌─────────────────────────────────────────────────────────┐
│ Dashboard Laboratoire              [Badge] [+ Nouvelle  │
│ Vue d'ensemble de l'activité...            Analyse]     │
└─────────────────────────────────────────────────────────┘
```

### Modal Layout
```
┌──────────────────────────────────────────────────────┐
│ Nouvelle Demande d'Analyse                      [X]  │
│ Créer une nouvelle demande...                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Patient *                    [Dropdown ▼]           │
│                                                      │
│  Médecin Prescripteur *       [Dropdown ▼]           │
│  ✓ Auto-rempli avec votre profil                     │
│                                                      │
│  Test de Laboratoire *        [Dropdown ▼]           │
│                                                      │
│  Niveau de Priorité *                                │
│  ┌──────────┐  ┌──────────┐                          │
│  │ ⚪ Normal │  │ 🔴 Urgent │                          │
│  └──────────┘  └──────────┘                          │
│                                                      │
│  Notes Cliniques (Optionnel)                         │
│  ┌──────────────────────────────────────┐            │
│  │ Contexte clinique...                 │            │
│  │                                      │            │
│  └──────────────────────────────────────┘            │
│                             250/500 caractères       │
│                                                      │
├──────────────────────────────────────────────────────┤
│                        [Annuler] [Créer la Demande]  │
└──────────────────────────────────────────────────────┘
```

### Lab Technician Tooltip
```
┌─────────────────────────────────────────┐
│ ℹ️  Information                          │
│                                         │
│ Votre rôle vous permet de traiter      │
│ les analyses reçues. Seuls les         │
│ médecins peuvent créer de nouvelles    │
│ demandes.                               │
└─────────────────────────────────────────┘
```

---

## 🔄 Workflow

### Successful Order Creation

```
1. Click [+ Nouvelle Analyse]
         ↓
2. Modal Opens
         ↓
3. Fill Required Fields
         ↓
4. Click [Créer la Demande]
         ↓
5. Validation (Client + Server)
         ↓
6. Database Insert
         ↓
7. Success Toast ✓
         ↓
8. Modal Closes
         ↓
9. Dashboard Refreshes
```

### Order Number Generation
```
Format: LAB-YYYYMMDD-XXXX
Example: LAB-20260226-4567

Where:
- YYYYMMDD = Current date
- XXXX = Last 4 digits of timestamp
```

---

## 🎯 Success Criteria

### ✅ Order Created Successfully When:

- All required fields filled
- User has `canCreateOrders` permission
- Patient exists in database
- Doctor exists in medical_staff_extension
- Test exists and is active
- Valid priority selected

### ❌ Order Creation Fails When:

- Missing required fields → **Inline error messages**
- No permission → **"Vous n'avez pas les permissions nécessaires"**
- Invalid references → **"Erreur: référence invalide"**
- Network error → **"Erreur lors de la création de l'analyse"**

---

## 📊 Dashboard Updates After Creation

```
Before Creation:        After Creation:
┌───────────────┐      ┌───────────────┐
│ En Attente: 3 │  →   │ En Attente: 4 │  ⬆️ +1
└───────────────┘      └───────────────┘

Recent Orders:          Recent Orders:
1. LAB-20260226-001    1. LAB-20260226-567  ⬅️ NEW
2. LAB-20260225-999    2. LAB-20260226-001
3. LAB-20260225-888    3. LAB-20260225-999
4. LAB-20260225-777    4. LAB-20260225-888
5. LAB-20260225-666    5. LAB-20260225-777
```

---

## 🎨 Color Coding

### Priority Indicators
- **Normal**: 🔵 Blue (`border-blue-500`, `bg-blue-50`)
- **Urgent**: 🔴 Red (`border-red-500`, `bg-red-50`)

### Button States
- **Enabled**: 🟢 Green (`bg-green-600`)
- **Info**: ⚪ Gray (`bg-gray-200`)
- **Disabled**: ⚫ Gray (`bg-gray-100`)

### Status Badges
- **Pending**: 🟡 Yellow (`bg-yellow-100`)
- **In Progress**: 🔵 Blue (`bg-blue-100`)
- **Completed**: 🟢 Green (`bg-green-100`)

---

## 🔧 Technical Details

### Files Modified
```
src/
├── components/
│   └── laboratory/
│       └── AddLabOrderModal.tsx     ✏️ Complete rewrite
└── pages/
    └── staff/
        └── LaboratoryPage.tsx        ✏️ Button + Modal integration
```

### Database Tables Used
```sql
lab_orders            ← Insert new order
├── patient_id        ← patients.id
├── doctor_id         ← medical_staff_extension.id
└── test_id           ← lab_tests.id
```

### Hooks Utilized
```typescript
useLabPermissions()   // RBAC access control
useLabOrderActions()  // Validation logic
useToast()           // Notifications
useAuth()            // Current user session
```

---

## 📱 Accessibility

### Keyboard Navigation
- `Tab` → Move between fields
- `Enter` → Submit form (when valid)
- `Esc` → Close modal

### Screen Reader Support
- ARIA labels on all interactive elements
- Semantic HTML structure
- Focus indicators on all controls

---

## 🚀 Performance

### Optimizations
- ⚡ Parallel data fetching (patients, doctors, tests)
- ⚡ Optimistic UI updates
- ⚡ Debounced search (if implemented)
- ⚡ Character count without re-renders

### Loading States
```
Initial Load:     [🔄 Loading spinner]
Submitting:       [🔄 "Création en cours..."]
Success:          [✅ Toast notification]
```

---

## 🐛 Troubleshooting

### Issue: Button is disabled
**Check:**
- User role has `canCreateOrders` permission
- RBAC configuration in `src/config/rbac.ts`

### Issue: No patients/tests in dropdown
**Check:**
- `patients` table has records
- `lab_tests` table has records with `is_active = true`

### Issue: Cannot save order
**Check:**
- All required fields filled
- Valid foreign key references
- Network connectivity
- RLS policies on `lab_orders` table

---

## 📞 Support Reference

### Permission Mapping
```javascript
doctor             → canCreateOrders = true
medical_director   → hasFullAccess = true
super_admin        → hasFullAccess = true
lab_technician     → isDashboardOnly = true
```

### Success Toast
```
Message: "La demande d'analyse de laboratoire a été
         transmise avec succès au service concerné"
Duration: 5 seconds
Type: Success (green)
Auto-close: Yes
```

---

## ✨ Key Features Checklist

- [x] Role-based button visibility
- [x] Auto-populated doctor field for doctors
- [x] Comprehensive form validation
- [x] Real-time character counter
- [x] Priority level selection with visual indicators
- [x] Loading states during data fetch and submission
- [x] Error handling with specific messages
- [x] Success notification toast
- [x] Automatic dashboard refresh
- [x] Informational tooltip for lab techs
- [x] Keyboard navigation support
- [x] Accessibility compliant
- [x] Responsive design
- [x] French language throughout

---

**Last Updated:** 2026-02-26
**Version:** 1.0
**Status:** ✅ Production Ready
