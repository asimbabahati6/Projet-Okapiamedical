# Access Permission Fix for Role Simulator

## Issue Description

When using the Role Simulator to switch between Laboratory and Pharmacy roles, users were encountering an "Accès non autorisé" (Unauthorized Access) error. The system was correctly navigating to the specialized dashboards but was blocking access due to permission validation.

## Root Cause

The `ProtectedRoute` component was only checking the actual user's profile role from the database, without considering the simulated role set by the RBAC context. This meant:

1. User logs in with role "doctor" (database role)
2. User activates role simulator and selects "Laboratoire" (RBAC simulated role)
3. Navigation successfully redirects to `/laboratory/dashboard`
4. `ProtectedRoute` checks the allowedRoles against the database role "doctor"
5. Since "doctor" wasn't being mapped correctly for simulation mode, access was denied

## Solution Implemented

Updated `src/routes/ProtectedRoute.tsx` to:

1. **Import RBAC Context**: Added `useRBAC` hook to access simulation state
2. **Check Simulation Mode**: Detect when the role simulator is active
3. **Use Effective Role**: When in simulation mode, use the simulated RBAC role instead of the database role
4. **Role Mapping**: Created a mapping between RBAC simulator roles and UserRole enum values

### Key Changes

```typescript
// Import RBAC context
import { useRBAC } from '@/contexts/RBACContext';

// Get simulation state
const { userRole, isSimulationMode, loading: rbacLoading } = useRBAC();

// Map RBAC simulator roles to UserRole enum values
const rbacToEnumMap: Record<string, UserRole> = {
  'admin': UserRole.SUPER_ADMIN,
  'doctor': UserRole.DOCTOR,
  'pharmacist': UserRole.PHARMACIST,
  'laboratory': UserRole.LAB_TECHNICIAN,
  'receptionist': UserRole.RECEPTIONIST,
  'administrative': UserRole.NURSE,
  'accountant': UserRole.NURSE,
  'logistician': UserRole.NURSE
};

// Determine effective role based on simulation mode
if (isSimulationMode) {
  effectiveRole = rbacToEnumMap[userRole];
} else {
  effectiveRole = profile?.role as UserRole;
}
```

## Role Mappings

### RBAC Simulator Roles → Database Roles → UserRole Enum

| RBAC Simulator | Database Role | UserRole Enum |
|---------------|---------------|---------------|
| admin | super_admin | SUPER_ADMIN |
| doctor | doctor | DOCTOR |
| pharmacist | pharmacist | PHARMACIST |
| laboratory | lab_technician | LAB_TECHNICIAN |
| receptionist | receptionist | RECEPTIONIST |
| administrative | nurse | NURSE |
| accountant | nurse | NURSE |
| logistician | nurse | NURSE |

## How It Works Now

### Laboratory Role Flow

1. User activates role simulator
2. User selects "Laboratoire" from dropdown
3. `RBACNavigation` auto-navigates to `/laboratory/dashboard`
4. `ProtectedRoute` checks permissions:
   - Detects simulation mode is active
   - Maps 'laboratory' → LAB_TECHNICIAN
   - Checks if LAB_TECHNICIAN is in allowedRoles [LAB_TECHNICIAN, DOCTOR, SUPER_ADMIN]
   - Access granted ✅
5. `LaboratoryLayout` renders with teal branding
6. `LabDashboard` displays with lab-specific data

### Pharmacy Role Flow

1. User activates role simulator
2. User selects "Pharmacien" from dropdown
3. `RBACNavigation` auto-navigates to `/pharmacy/dashboard`
4. `ProtectedRoute` checks permissions:
   - Detects simulation mode is active
   - Maps 'pharmacist' → PHARMACIST
   - Checks if PHARMACIST is in allowedRoles [PHARMACIST, DOCTOR, SUPER_ADMIN]
   - Access granted ✅
5. `PharmacyLayout` renders with blue branding
6. `EnhancedPharmacyPage` displays with pharmacy-specific data

## Super Admin Override

The fix includes special handling for super admin roles:

```typescript
// Always allow super_admin and hospital_admin
if (effectiveRole === UserRole.SUPER_ADMIN || effectiveRole === UserRole.HOSPITAL_ADMIN) {
  return <>{children}</>;
}
```

This ensures administrators always have access regardless of other restrictions.

## Testing Verification

### Test Case 1: Laboratory Access
- ✅ Role simulator → Laboratoire
- ✅ Auto-navigate to /laboratory/dashboard
- ✅ No "Accès non autorisé" error
- ✅ Dashboard loads with statistics
- ✅ Teal branding visible

### Test Case 2: Pharmacy Access
- ✅ Role simulator → Pharmacien
- ✅ Auto-navigate to /pharmacy/dashboard
- ✅ No "Accès non autorisé" error
- ✅ Dashboard loads with inventory
- ✅ Blue branding visible

### Test Case 3: Role Switching
- ✅ Switch from Laboratoire → Pharmacien
- ✅ Seamless transition
- ✅ No access errors
- ✅ Correct dashboard for each role

### Test Case 4: Non-Simulation Mode
- ✅ Disable simulator
- ✅ Uses actual profile role
- ✅ Access still works correctly
- ✅ Returns to appropriate default dashboard

## Build Status

✅ **Build Successful**
- No TypeScript errors
- No compilation warnings
- All routes properly configured
- Production bundle ready

## Files Modified

1. `src/routes/ProtectedRoute.tsx` - Added simulation mode support and role mapping

## Related Files (No Changes Required)

- `src/components/layout/RBACNavigation.tsx` - Already has auto-navigation
- `src/contexts/RBACContext.tsx` - Already manages simulation state
- `src/modules/laboratory/LaboratoryLayout.tsx` - Already functional
- `src/modules/pharmacy/PharmacyLayout.tsx` - Already functional
- `src/routes/LaboratoryRoutes.tsx` - Already has correct allowedRoles
- `src/routes/PharmacyRoutes.tsx` - Already has correct allowedRoles

## Security Considerations

- Real user authentication still required
- Simulation mode only changes UI routing and displayed data
- Database queries still respect actual user permissions
- RLS policies in Supabase remain enforced
- No elevation of actual database privileges

## Benefits

1. **Role Testing**: Administrators can test different role experiences without creating multiple accounts
2. **Training**: Training sessions can demonstrate different user interfaces
3. **Development**: Developers can test all role-based features quickly
4. **Demos**: Sales/demo scenarios can show different department views
5. **User Experience**: Seamless navigation between specialized dashboards

## Conclusion

The access permission issue has been resolved. The role simulator now works seamlessly with the specialized Laboratory and Pharmacy dashboards, allowing users to switch between roles and access department-specific views without encountering unauthorized access errors.

**Fix Date**: February 22, 2026
**Status**: ✅ Resolved
**Build Status**: ✅ Production Ready
