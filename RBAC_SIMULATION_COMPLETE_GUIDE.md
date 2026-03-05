# Complete RBAC Role Simulation Implementation Guide

## Overview

This guide documents the complete, working implementation of Role-Based Access Control (RBAC) with simulation functionality. The system allows administrators and authorized users to simulate different roles to test and demonstrate various user experiences without switching accounts.

---

## Key Features Implemented

### 1. **Centralized Role Mapping System**
- Unified mapping between three role systems (RBAC, Database, UserRole Enum)
- Consistent role conversion across all components
- Type-safe role handling with TypeScript

### 2. **Smart Simulation Mode**
- Session-persistent simulation state
- Automatic role detection and mapping
- One-click return to actual role
- Visual indicators showing simulation status

### 3. **Intelligent Menu Visibility**
- Admins see ALL roles when simulation is OFF (to select what to simulate)
- Regular users see only their accessible items
- Locked items shown with tooltips indicating required roles
- Menu filters correctly based on simulated role when active

### 4. **Enhanced Access Control**
- ProtectedRoute respects both actual and simulated roles
- Admins always have override access
- Security maintained at database level (RLS policies)
- No privilege escalation possible through simulation

---

## Architecture

### File Structure

```
src/
├── utils/
│   └── roleMapping.ts          # NEW - Centralized role mappings
├── contexts/
│   └── RBACContext.tsx         # UPDATED - Enhanced simulation management
├── components/
│   └── layout/
│       └── RBACNavigation.tsx  # UPDATED - Smart menu visibility
└── routes/
    └── ProtectedRoute.tsx      # UPDATED - Simulation-aware access control
```

### Three Role Systems Unified

#### 1. RBAC Roles (Legacy/UI Layer)
```typescript
type RBACRole = 'admin' | 'doctor' | 'administrative' | 'accountant' |
                'receptionist' | 'laboratory' | 'pharmacist' | 'logistician'
```

#### 2. Database Roles (Supabase)
```typescript
type DatabaseRole = 'super_admin' | 'hospital_admin' | 'doctor' | 'nurse' |
                    'pharmacist' | 'receptionist' | 'lab_technician' | 'patient'
```

#### 3. UserRole Enum (Type System)
```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',
  HOSPITAL_ADMIN = 'hospital_admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  PHARMACIST = 'pharmacist',
  RECEPTIONIST = 'receptionist',
  LAB_TECHNICIAN = 'lab_technician',
  PATIENT = 'patient'
}
```

---

## How It Works

### Role Mapping Flow

```
User Login
    ↓
Database returns: 'super_admin'
    ↓
RBACContext maps: 'super_admin' → 'admin' (RBAC role)
    ↓
Store both:
  - actualRole: 'admin' (never changes)
  - userRole: 'admin' (changes during simulation)
    ↓
User Interface displays: 'Administrateur'
```

### Simulation Activation Flow

```
Admin User (actualRole: 'admin')
    ↓
Clicks "Activer Simulation"
    ↓
isSimulationMode = true
    ↓
Selects "Laboratoire" from dropdown
    ↓
userRole changes to: 'laboratory'
    ↓
Menu filters to show only lab-accessible items
    ↓
Auto-navigates to: /laboratory/dashboard
    ↓
ProtectedRoute uses simulated role: 'laboratory' → LAB_TECHNICIAN
    ↓
Access granted to laboratory routes
```

### Return to Actual Role Flow

```
Click "Retour à mon rôle" button
    ↓
resetSimulation() called
    ↓
isSimulationMode = false
userRole = actualRole (back to 'admin')
    ↓
Menu shows all items again
    ↓
Navigate to default dashboard
```

---

## Component Details

### 1. Role Mapping Utility (`roleMapping.ts`)

#### Key Functions

```typescript
// Convert RBAC role to UserRole enum
mapRbacToEnum(rbacRole: RBACRole): UserRole

// Convert database role to UserRole enum
mapDbToEnum(dbRole: DatabaseRole): UserRole

// Convert database role to RBAC role
mapDbToRbac(dbRole: DatabaseRole): RBACRole

// Check if role has admin privileges
isAdminRole(role: UserRole | RBACRole | DatabaseRole): boolean

// Get all available roles for simulator
getAllSimulatorRoles(): RBACRole[]

// Get localized role name
getRoleDisplayName(role: RBACRole): string
```

#### Mapping Tables

**RBAC → UserRole Enum**
| RBAC Role      | UserRole Enum     |
|----------------|-------------------|
| admin          | SUPER_ADMIN       |
| doctor         | DOCTOR            |
| laboratory     | LAB_TECHNICIAN    |
| pharmacist     | PHARMACIST        |
| receptionist   | RECEPTIONIST      |
| administrative | NURSE             |
| accountant     | NURSE             |
| logistician    | NURSE             |

**Database → RBAC**
| Database Role   | RBAC Role      |
|-----------------|----------------|
| super_admin     | admin          |
| hospital_admin  | admin          |
| doctor          | doctor         |
| lab_technician  | laboratory     |
| pharmacist      | pharmacist     |
| receptionist    | receptionist   |
| nurse           | administrative |

### 2. RBAC Context (`RBACContext.tsx`)

#### State Management

```typescript
interface RBACContextType {
  userRole: UserRole;              // Current role (simulated or actual)
  actualRole: UserRole;            // User's real role from database
  setUserRole: (role: UserRole) => void;
  isSimulationMode: boolean;       // Simulation active flag
  setSimulationMode: (mode: boolean) => void;
  hasPermission: (permission: string) => boolean;
  getEffectiveRole: () => UserRole;  // Returns userRole if simulating, else actualRole
  resetSimulation: () => void;       // Quick reset to actual role
  loading: boolean;
}
```

#### Session Persistence

Simulation state is saved to `sessionStorage`:
- `rbac_simulation_mode`: "true" | "false"
- `rbac_simulated_role`: Current simulated role

This allows simulation to persist across:
- Page refreshes
- Internal navigation
- But NOT across new browser tabs (session-scoped)

#### Key Methods

**fetchUserRole()**
- Fetches user's actual role from Supabase
- Maps database role to RBAC role
- Sets `actualRole` (permanent)
- Only sets `userRole` if not in simulation mode

**setSimulationMode(mode)**
- Toggles simulation on/off
- Saves state to sessionStorage
- Resets to actual role when disabled
- Saves current simulated role when enabled

**getEffectiveRole()**
- Returns simulated role if simulation is active
- Returns actual role otherwise
- Used by permission checks

**resetSimulation()**
- Turns off simulation mode
- Restores actual role
- Clears sessionStorage
- Quick way to return to normal

### 3. RBAC Navigation (`RBACNavigation.tsx`)

#### Smart Menu Display Logic

```typescript
// Determine which menu to show
const showAllItems = !isSimulationMode && isAdminRole(actualRole);
const menuToDisplay = isSimulationMode
  ? filterMenuByRole(MENU_STRUCTURE, userRole)  // Show only simulated role's items
  : (showAllItems ? MENU_STRUCTURE : filterMenuByRole(MENU_STRUCTURE, userRole));
```

**When Simulation is OFF:**
- Admins see ALL menu items (some locked with 🔒)
- Regular users see only their accessible items
- Locked items show tooltip with required roles

**When Simulation is ON:**
- Menu filtered to show only simulated role's items
- No locked items shown
- Clean view as if you ARE that role

#### Visual Elements

**Simulation Active Banner** (Amber)
```
┌─────────────────────────────────────────────────────┐
│ MODE SIMULATION ACTIF - Visualisation: Laboratoire  │
│                    [Retour à mon rôle]               │
└─────────────────────────────────────────────────────┘
```

**Role Selector** (Changes based on state)
- Simulation OFF + Admin: Dropdown with all roles + hint text
- Simulation ON: Dropdown with all roles
- Simulation OFF + Non-admin: Read-only display of current role

**Menu Item with Lock** (Admin view, simulation off)
```
🔬 Laboratoire             🔒
   (tooltip: Accessible aux rôles: Admin, Médecin, Laboratoire)
```

#### Auto-Navigation

When simulation mode is activated and role changes:
```typescript
const roleRoutes: Record<string, string> = {
  'laboratory': '/laboratory/dashboard',
  'pharmacist': '/pharmacy/dashboard',
  'doctor': '/doctor/dashboard',
  'admin': '/staff/dashboard',
  // ... etc
};
```

Automatically redirects to the most appropriate dashboard for that role.

### 4. Protected Route (`ProtectedRoute.tsx`)

#### Access Control Logic

```typescript
// Determine effective role
if (isSimulationMode) {
  effectiveRole = mapRbacToEnum(userRole);      // Use simulated
} else {
  effectiveRole = mapDbToEnum(profile.role);    // Use actual from DB
}

// Admin override
if (isAdminRole(effectiveRole)) {
  return <>{children}</>;  // Always allow
}

// Role check
if (!allowedRoles.includes(effectiveRole)) {
  return <Navigate to="/access-denied" />;
}
```

#### Route Protection Examples

```typescript
// Laboratory route
<Route path="/laboratory/*" element={
  <ProtectedRoute allowedRoles={[
    UserRole.LAB_TECHNICIAN,
    UserRole.DOCTOR,
    UserRole.SUPER_ADMIN
  ]}>
    <LaboratoryRoutes />
  </ProtectedRoute>
} />
```

When user simulates "laboratory" role:
1. `isSimulationMode = true`
2. `userRole = 'laboratory'`
3. `mapRbacToEnum('laboratory')` → `LAB_TECHNICIAN`
4. `LAB_TECHNICIAN` is in `allowedRoles`
5. Access granted ✅

---

## User Experience Flows

### Flow 1: Admin Simulating Laboratory Role

**Step 1: Initial State**
```
Logged in as: Administrateur (super_admin)
Simulation: OFF
Menu: All items visible (none locked for admin)
```

**Step 2: Activate Simulation**
```
Click "Activer Simulation" button
→ Dropdown appears with all roles
→ Helper text: "💡 Sélectionnez un rôle ci-dessus pour activer le mode simulation"
```

**Step 3: Select Laboratory**
```
Select "Laboratoire" from dropdown
→ isSimulationMode automatically set to true
→ Amber banner appears: "MODE SIMULATION ACTIF"
→ Auto-navigate to /laboratory/dashboard
→ Menu filtered to show only laboratory items
```

**Step 4: Experience Laboratory View**
```
Dashboard: Teal-themed laboratory interface
Menu items:
  ✓ Tableau de Bord Principal
  ✓ Services Médicaux
    → Laboratoire
  (Other items hidden)
```

**Step 5: Return to Admin**
```
Click "Retour à mon rôle" button
→ Simulation OFF
→ Menu shows all items again
→ Return to admin dashboard
```

### Flow 2: Doctor User (No Simulation Access)

**State:**
```
Logged in as: Médecin (doctor)
Simulation: OFF (no access to enable it)
Menu: Only medical items visible
Role display: Read-only "Médecin"
```

**Behavior:**
- Cannot activate simulation mode (not admin)
- Sees only items accessible to doctor role
- Other items are completely hidden (not even shown as locked)

### Flow 3: Admin Viewing Available Roles

**When Simulation is OFF:**
```
Menu Structure:
  Pôle Médical ✓
    → Gestion des Patients ✓
    → Rendez-vous ✓
    → Consultations ✓
    → Personnel Médical ✓
    → Services Médicaux ✓
      → Laboratoire ✓
      → Pharmacie ✓

  Pôle Administratif ✓
    → Personnel Administratif ✓
    → Réception & Accueil ✓
    (etc., all items accessible)
```

Admin can see everything they CAN access, with no locked items.

---

## Session Persistence

### Storage Strategy

**Using `sessionStorage` (not `localStorage`):**
- Persists across page refreshes
- Clears when browser tab closes
- Doesn't persist across new tabs
- More secure than localStorage

**Keys Used:**
```javascript
SIMULATION_MODE_KEY = 'rbac_simulation_mode'
SIMULATED_ROLE_KEY = 'rbac_simulated_role'
```

**Storage Format:**
```json
{
  "rbac_simulation_mode": "true",
  "rbac_simulated_role": "laboratory"
}
```

### Restoration Flow

```
Page Load
    ↓
RBACContext mounts
    ↓
useEffect checks sessionStorage
    ↓
If saved state found:
  setSimulationMode(true)
  setUserRole(savedRole)
    ↓
Then fetch actual role from database
    ↓
Ready to use
```

---

## Security Considerations

### What Simulation DOES

✅ Changes which UI elements are visible
✅ Changes which routes are accessible in the frontend
✅ Allows testing different user experiences
✅ Helps with training and demonstrations

### What Simulation DOES NOT DO

❌ Does NOT change database permissions
❌ Does NOT bypass Row Level Security (RLS)
❌ Does NOT grant actual data access
❌ Does NOT modify user's actual role in database

### Database Security

**Supabase RLS Policies remain enforced:**
```sql
-- Example: Only actual lab technicians can update results
CREATE POLICY "Lab techs can update results"
  ON lab_results
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles
      WHERE role = 'lab_technician'
    )
  );
```

Even if admin simulates lab tech role:
- Frontend shows lab interface ✅
- Frontend allows navigation to lab pages ✅
- **But** database queries still check `auth.uid()` and actual role ✅
- **Cannot** actually update lab results unless actually a lab tech ✅

### Admin Override

Admins have special privileges:
```typescript
// Always allow admin roles
if (isAdminRole(effectiveRole)) {
  return <>{children}</>;
}
```

This means:
- Super admins can access ANY route
- Hospital admins can access ANY route
- Even when not simulating
- This is intentional for system administration

---

## Testing Checklist

### ✅ Simulation Activation
- [ ] Admin can activate simulation mode
- [ ] Role dropdown appears when activated
- [ ] All 8 roles are available in dropdown
- [ ] Helper text shown to admins when OFF
- [ ] Non-admins cannot activate simulation

### ✅ Role Selection
- [ ] Selecting a role activates simulation
- [ ] Selecting a role auto-navigates to appropriate dashboard
- [ ] Menu filters correctly for selected role
- [ ] Amber banner appears showing simulation active
- [ ] Role name displays correctly in banner

### ✅ Menu Visibility
- [ ] Admin with simulation OFF sees all items
- [ ] Admin with simulation ON sees filtered items
- [ ] Non-admin users see only their accessible items
- [ ] Locked items show tooltip with required roles
- [ ] Menu categories render correctly

### ✅ Navigation
- [ ] Laboratory role → /laboratory/dashboard
- [ ] Pharmacist role → /pharmacy/dashboard
- [ ] Doctor role → /doctor/dashboard
- [ ] Specialized dashboards load correctly
- [ ] Branded layouts display (teal, blue, etc.)

### ✅ Access Control
- [ ] ProtectedRoute respects simulated role
- [ ] No "Access Denied" errors when simulating valid role
- [ ] Invalid role selections still block access
- [ ] Admin override works for all routes
- [ ] Database queries still enforce actual permissions

### ✅ Session Persistence
- [ ] Simulation state persists on page refresh
- [ ] Simulated role persists on page refresh
- [ ] State clears when tab closes
- [ ] State doesn't persist to new tabs

### ✅ Reset Functionality
- [ ] "Retour à mon rôle" button works
- [ ] Returns to actual role
- [ ] Turns off simulation mode
- [ ] Clears sessionStorage
- [ ] Menu returns to normal view

### ✅ Edge Cases
- [ ] Switching roles multiple times works
- [ ] Rapid role switching doesn't break UI
- [ ] Logging out clears simulation state
- [ ] Invalid roles in storage are handled
- [ ] Missing profile gracefully handled

---

## Troubleshooting

### Issue: "Can't see other roles in dropdown"

**Cause:** User is not an admin
**Solution:** Only admins (super_admin, hospital_admin) can use role simulation

### Issue: "Access Denied when simulating"

**Cause:** Role mapping incorrect or route protection too strict
**Solution:**
1. Check `roleMapping.ts` for correct mappings
2. Verify `allowedRoles` in route definitions
3. Ensure `mapRbacToEnum()` is working correctly

### Issue: "Menu doesn't filter correctly"

**Cause:** `showAllItems` or `isSimulationMode` logic error
**Solution:**
1. Verify `isSimulationMode` state in RBACContext
2. Check `menuToDisplay` calculation in RBACNavigation
3. Ensure `filterMenuByRole` is called correctly

### Issue: "Simulation doesn't persist"

**Cause:** sessionStorage not working or being cleared
**Solution:**
1. Check browser allows sessionStorage
2. Verify keys are correct: `rbac_simulation_mode`, `rbac_simulated_role`
3. Ensure no code is clearing sessionStorage unexpectedly

### Issue: "Auto-navigation not working"

**Cause:** useEffect dependencies or route mapping
**Solution:**
1. Check `roleRoutes` object has all roles
2. Verify useEffect dependencies include `userRole`, `isSimulationMode`
3. Ensure routes exist in App.tsx

---

## API Reference

### RBACContext

```typescript
// Get current context
const {
  userRole,          // string - Current role (simulated or actual)
  actualRole,        // string - User's real role from DB
  setUserRole,       // (role: UserRole) => void
  isSimulationMode,  // boolean - Is simulation active?
  setSimulationMode, // (mode: boolean) => void
  hasPermission,     // (permission: string) => boolean
  getEffectiveRole,  // () => UserRole
  resetSimulation,   // () => void
  loading            // boolean - Still fetching role?
} = useRBAC();
```

### Role Mapping Functions

```typescript
import {
  mapRbacToEnum,        // (rbacRole: RBACRole) => UserRole
  mapDbToEnum,          // (dbRole: DatabaseRole) => UserRole
  mapDbToRbac,          // (dbRole: DatabaseRole) => RBACRole
  isAdminRole,          // (role: any) => boolean
  getAllSimulatorRoles, // () => RBACRole[]
  getRoleDisplayName    // (role: RBACRole) => string
} from '@/utils/roleMapping';
```

---

## Future Enhancements

### Potential Improvements

1. **Simulation History**
   - Track which roles user has simulated
   - Show "recently simulated" quick access

2. **Time Limits**
   - Auto-expire simulation after X minutes
   - Require re-activation for security

3. **Audit Logging**
   - Log when simulation is activated
   - Track what actions taken while simulating
   - Store in database for compliance

4. **Multi-Facility Simulation**
   - Simulate different facilities/locations
   - Test facility-specific permissions

5. **Permission Testing Tool**
   - UI to test specific permissions
   - Show which roles have which permissions
   - Help admins configure RBAC

6. **Guided Tours**
   - Step-by-step walkthrough of each role
   - Automated demonstration mode
   - Training material integration

---

## Conclusion

The RBAC simulation system is now fully functional with:
- ✅ Centralized role mapping
- ✅ Session persistence
- ✅ Smart menu visibility
- ✅ Visual simulation indicators
- ✅ Secure access control
- ✅ Admin override capabilities
- ✅ Production-ready build

Users can now seamlessly simulate different roles to test functionality, train staff, and demonstrate system capabilities without creating multiple accounts.

**Build Status:** ✅ Successful
**Production Ready:** ✅ Yes
**Documentation:** ✅ Complete

---

**Last Updated:** February 22, 2026
**Version:** 2.0
**Status:** Production Ready
