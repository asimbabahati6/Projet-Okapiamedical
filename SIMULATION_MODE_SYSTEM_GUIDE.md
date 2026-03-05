# Enhanced Dual Simulation Mode System - Complete Guide

**Version:** 2.0
**Date:** February 22, 2026
**Author:** OKAPIA Medical Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Role Visibility Fixes](#role-visibility-fixes)
4. [Simulation Mode States](#simulation-mode-states)
5. [Getting Started](#getting-started)
6. [User Guide](#user-guide)
7. [Administrator Guide](#administrator-guide)
8. [Security Features](#security-features)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Enhanced Dual Simulation Mode System allows authorized users to temporarily assume different roles for testing purposes while maintaining strict security boundaries and comprehensive audit logging.

### What's New in Version 2.0

- **Role Visibility Fixed**: "Médecin Directeur" and 12 other missing roles now visible
- **Dual Simulation States**: DISABLED, ACTIVE, and LOCKED modes
- **Enhanced Visual Indicators**: Prominent banners and floating badges
- **Comprehensive Audit Trail**: Every action during simulation is logged
- **Confirmation Dialogs**: Required before starting simulation
- **Auto-End Timer**: Optional automatic session termination
- **Security Boundaries**: Sensitive operations blocked or warned
- **Role Management Dashboard**: Complete interface for managing roles and simulations

---

## Key Features

### ✅ Complete Role Mapping

All 20 database roles are now mapped to the UI:

**Management Roles:**
- super_admin → Administrateur
- hospital_admin → Administrateur
- **medical_director** → **Médecin Directeur** ⭐ NEW
- administrative_director → Administratif/RH
- hr_manager → Responsable RH ⭐ NEW
- finance_manager → Comptable
- operations_manager → Responsable Opérations ⭐ NEW
- information_systems_coordinator → Administrateur

**Medical Roles:**
- doctor → Médecin
- dentist → Médecin (specialized)
- physical_therapist → Médecin (specialized)
- nurse → Administratif
- pharmacist → Pharmacien
- lab_technician → Laboratoire

**Administrative Roles:**
- administrative_staff → Administratif/RH
- administrative_officer → Administratif/RH
- administrative_assistant → Réceptionniste
- receptionist → Réceptionniste
- logistician → Logisticien

**Patient Role:**
- patient → Réceptionniste (limited access)

---

## Role Visibility Fixes

### Problem Resolved

The "Médecin Directeur" role and 11 other roles were not appearing in:
- User interface dropdowns
- Role selection menus
- Simulation mode options
- Permission displays

### Solution Implemented

1. **Updated TypeScript Enums** (`src/core/types/enums.ts`)
   - Added all 20 role values to UserRole enum

2. **Complete Role Mappings** (`src/utils/roleMapping.ts`)
   - Database roles → UI roles
   - RBAC roles → Display names
   - All roles now have proper mappings

3. **RBAC Configuration** (`src/config/rbac.ts`)
   - Added all roles to permissions matrix
   - Updated menu structure with new roles
   - Assigned appropriate permissions

4. **Verification**
   - All roles now visible in simulation mode
   - Role management dashboard shows all roles
   - Proper permissions applied

---

## Simulation Mode States

### 1. DISABLED (Default)

**Description:** Normal operation, no simulation active

**Visual Indicators:**
- No banner shown
- Standard interface
- Regular permissions apply

**When to Use:** Normal day-to-day operations

---

### 2. ACTIVE (Simulation Running)

**Description:** User is simulating another role

**Visual Indicators:**
- **Amber banner** at top of all pages
- **Floating badge** in bottom-right corner
- Page title includes "[SIMULATION]" prefix
- Timer countdown if auto-end enabled

**Features:**
- All actions logged to audit trail
- Sensitive operations controlled
- Session can be ended at any time
- Auto-warning 5 minutes before expiry

**When to Use:** Testing role permissions, workflows, or features

---

### 3. LOCKED (Admin Disabled)

**Description:** Simulation disabled by super administrator

**Visual Indicators:**
- **Red banner** at top of all pages
- "Simulation mode temporarily disabled" message
- Simulation button disabled

**Who Can Lock:**
- Only super_admin users

**When to Use:** During system maintenance, critical operations, or security concerns

---

## Getting Started

### Prerequisites

1. **Required Role:** One of the following:
   - super_admin (Administrateur)
   - medical_director (Médecin Directeur)
   - hr_manager (Responsable RH)
   - operations_manager (Responsable Opérations)

2. **System Status:** Simulation mode not locked globally

3. **Browser:** Modern browser with JavaScript enabled

---

### Quick Start (5 Minutes)

1. **Log in** with an authorized account

2. **Navigate to Role Management**
   - Menu: Système → Gestion des Rôles
   - URL: `/staff/role-management`

3. **Select a Role to Simulate**
   - Browse available roles
   - Click "Simuler ce rôle" button

4. **Confirm Simulation**
   - Review role details
   - Optional: Add reason for simulation
   - Optional: Set auto-end timer
   - Check acknowledgment box
   - Click "Démarrer la Simulation"

5. **Use the System**
   - Navigate normally
   - Test features and permissions
   - All actions are logged

6. **End Simulation**
   - Click "Quitter la Simulation" in banner
   - Or click X on floating badge
   - Or wait for auto-end timer

---

## User Guide

### Starting a Simulation

#### Step 1: Access Role Management

Navigate to the Role Management page via the menu:

```
Menu → Système → Gestion des Rôles
```

#### Step 2: Choose a Role

Browse the list of available roles. Each role card shows:
- Role name (French)
- Role identifier (English)
- Number of permissions
- Quick simulate button

#### Step 3: Confirm Details

When you click "Simuler ce rôle", a confirmation dialog appears:

**Required Information:**
- ✅ Acknowledge you understand this is testing only

**Optional Information:**
- Reason for simulation (recommended)
- Auto-end duration (15min to 8 hours)

#### Step 4: Visual Confirmation

Once simulation starts, you'll see:
- Amber banner at top: "MODE SIMULATION ACTIF"
- Your actual role and simulated role displayed
- Timer countdown (if auto-end enabled)
- Floating badge in bottom-right corner

#### Step 5: Test Normally

Use the system as if you had that role:
- Navigate to different pages
- View data
- Test operations
- Everything is logged

#### Step 6: End Simulation

Three ways to end:
1. Click "Quitter la Simulation" in banner
2. Click X on floating badge
3. Wait for auto-end timer (if set)

---

### Understanding Visual Indicators

#### Amber Banner (Top of Page)

```
⚠️ MODE SIMULATION ACTIF
Rôle réel: Administrateur → Simulé: Médecin Directeur
🕐 Temps restant: 45 minutes

[Quitter la Simulation]
```

**Shows:**
- Your actual role
- Simulated role
- Time remaining (if auto-end set)
- Quick exit button

#### Floating Badge (Bottom-Right)

```
🛡️ Simulation
   Médecin Directeur
   [X]
```

**Shows:**
- Current simulated role
- Quick exit button

---

### Security Boundaries

Certain operations are controlled during simulation:

#### ❌ BLOCKED Operations

These operations are **completely blocked** in simulation mode:

- Delete patient records
- Delete user accounts
- Delete employees
- Change user roles
- Approve payments
- Financial transactions
- Real medication dispensing
- Delete prescriptions
- Delete consultations
- System settings changes

**What Happens:** You'll see an error message explaining the operation is blocked.

#### ⚠️ WARNED Operations

These operations require **extra confirmation** in simulation mode:

- Modify medical records
- Modify billing information
- Delete appointments
- Delete lab orders
- Export data

**What Happens:** A confirmation dialog appears reminding you that you're in simulation mode and the action will be logged.

---

### Auto-End Timer

Set a maximum duration for your simulation session:

**Available Durations:**
- 15 minutes
- 30 minutes
- 1 hour (60 minutes)
- 2 hours (120 minutes)
- 4 hours (240 minutes)
- 8 hours (480 minutes) - Default maximum
- Unlimited (manual end only)

**Warnings:**
- **5 minutes before expiry:** Banner shows warning
- **At expiry:** Session automatically ends
- **Can extend:** Before expiry, you can start a new session

---

## Administrator Guide

### Managing Simulation Settings

#### Access Settings (Super Admin Only)

1. Navigate to: `/staff/role-management`
2. Settings are stored in `simulation_settings` table
3. Use SQL or admin interface to modify

#### Available Settings

```sql
-- View current settings
SELECT * FROM simulation_settings;

-- Update settings
UPDATE simulation_settings SET
  is_globally_enabled = TRUE,              -- Enable/disable simulation
  max_session_duration_minutes = 480,     -- Max duration (8 hours)
  require_reason = FALSE,                  -- Force reason entry
  allowed_roles = ARRAY['admin', 'medical_director', 'hr_admin', 'operations']
WHERE true;
```

#### Allowed Roles Configuration

Control which roles can use simulation mode:

```sql
-- Add a role
UPDATE simulation_settings SET
  allowed_roles = array_append(allowed_roles, 'new_role');

-- Remove a role
UPDATE simulation_settings SET
  allowed_roles = array_remove(allowed_roles, 'old_role');

-- Reset to defaults
UPDATE simulation_settings SET
  allowed_roles = ARRAY['admin', 'medical_director', 'hr_admin', 'operations'];
```

---

### Monitoring Active Sessions

#### View All Active Sessions

From the Role Management page, administrators can see:
- Who is currently simulating
- What role they're simulating
- When the session started
- Reason for simulation (if provided)

#### Force-End a Session

**When to Use:**
- User forgot to end session
- Testing is complete
- Security concern
- System maintenance needed

**How to Do It:**
1. Navigate to Role Management page
2. Find the session in "Sessions Actives" section
3. Click "Terminer" button
4. Confirm the action

**What Happens:**
- Session ends immediately
- User returns to their actual role
- Action logged as "ended_by: admin"

---

### Audit Trail

#### Viewing Audit Logs

**Database Tables:**
- `simulation_sessions` - Session start/end records
- `simulation_actions` - Every action during simulation

#### Query Examples

```sql
-- All sessions in last 30 days
SELECT
  s.id,
  up.full_name,
  s.actual_role,
  s.simulated_role,
  s.started_at,
  s.ended_at,
  s.reason,
  EXTRACT(EPOCH FROM (COALESCE(s.ended_at, NOW()) - s.started_at)) / 60 AS duration_minutes
FROM simulation_sessions s
JOIN user_profiles up ON s.user_id = up.id
WHERE s.started_at > NOW() - INTERVAL '30 days'
ORDER BY s.started_at DESC;

-- Actions for a specific session
SELECT
  action_type,
  resource_type,
  resource_id,
  action_details,
  timestamp
FROM simulation_actions
WHERE session_id = 'SESSION_ID_HERE'
ORDER BY timestamp;

-- Sessions that ended by timeout
SELECT COUNT(*)
FROM simulation_sessions
WHERE ended_by = 'timeout'
AND started_at > NOW() - INTERVAL '30 days';

-- Most simulated role
SELECT
  simulated_role,
  COUNT(*) as session_count
FROM simulation_sessions
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY simulated_role
ORDER BY session_count DESC;
```

#### Statistics Dashboard

The Role Management page shows:
- Total sessions (last 30 days)
- Currently active sessions
- Unique users who simulated
- Average session duration
- Most simulated role
- Total actions logged

---

### Locking Simulation Mode

#### When to Lock

- Critical system maintenance
- Security incident investigation
- Production deployment
- During audits
- Temporarily disable testing

#### How to Lock

```sql
-- Lock simulation mode
UPDATE simulation_settings SET
  is_globally_enabled = FALSE
WHERE true;

-- Unlock simulation mode
UPDATE simulation_settings SET
  is_globally_enabled = TRUE
WHERE true;
```

#### What Users See

- Red banner: "Mode Simulation Verrouillé"
- Message: "Le mode simulation a été temporairement désactivé par l'administrateur"
- All simulation buttons disabled
- Active sessions continue until they end naturally

---

## Security Features

### 1. No Privilege Escalation

**How It Works:**
- Your actual role never changes
- Simulation state stored separately
- Database RLS policies use `auth.uid()` and actual user role
- Frontend shows simulated permissions
- Backend enforces actual permissions

**Example:**
```typescript
// Frontend allows access based on simulated role
if (userRole === 'medical_director') {
  showMedicalStaffManagement();
}

// Database enforces actual role
CREATE POLICY "Only real admins can delete"
  ON patients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );
```

### 2. Immutable Audit Trail

**Characteristics:**
- Insert-only logging (no UPDATE/DELETE)
- Timestamp on every action
- Cannot be tampered with
- Survives session end
- Permanent record

**What's Logged:**
- Session start/end
- Every navigation
- Every data view
- Every data modification
- Blocked operations
- Confirmed operations

### 3. Sensitive Operation Controls

**Three Levels of Protection:**

1. **Block** - Operation completely prevented
2. **Warn** - Extra confirmation required
3. **Allow** - Normal operation with logging

**Configuration:**
See `src/services/securityBoundariesService.ts` for operation definitions

### 4. Session Management

**Protection Mechanisms:**
- Auto-expiry prevents forgotten sessions
- Force-end capability for administrators
- Maximum duration limits (8 hours default)
- Session stored in browser sessionStorage
- Cleared on logout

### 5. IP and User Agent Tracking

**Captured Data:**
- IP address of simulation start
- Browser user agent
- Session metadata
- Useful for security audits

---

## API Reference

### RBACContext

Enhanced context for role-based access control.

```typescript
import { useRBAC } from '@/contexts/RBACContext';

function MyComponent() {
  const {
    // Current state
    userRole,              // Current effective role
    actualRole,            // User's real role
    isSimulationMode,      // Boolean: in simulation?
    simulationModeState,   // 'DISABLED' | 'ACTIVE' | 'LOCKED'

    // Capabilities
    canUseSimulation,      // Boolean: can this user simulate?
    simulationSettings,    // Global settings object
    activeSession,         // Current session info or null
    currentSessionId,      // Session ID or null

    // Actions
    startSimulation,       // (role, reason?, duration?) => Promise<void>
    endSimulation,         // (endedBy?) => Promise<void>
    resetSimulation,       // () => void

    // Permissions
    hasPermission,         // (permission) => boolean
    getEffectiveRole,      // () => UserRole

    // State
    loading                // Boolean: loading user data?
  } = useRBAC();
}
```

### SimulationAuditService

Service for managing simulation audit trail.

```typescript
import { simulationAuditService } from '@/services/simulationAuditService';

// Start a session
const sessionId = await simulationAuditService.startSession({
  userId: user.id,
  actualRole: 'admin',
  simulatedRole: 'doctor',
  reason: 'Testing patient permissions',
  autoEndMinutes: 60
});

// Log an action
await simulationAuditService.logAction({
  sessionId,
  actionType: 'view',
  resourceType: 'patient',
  resourceId: 'patient-uuid',
  details: { page: 'patient-details' }
});

// End a session
await simulationAuditService.endSession(sessionId, 'user');

// Get user history
const history = await simulationAuditService.getUserHistory(userId, 50);

// Get active sessions (admin only)
const active = await simulationAuditService.getActiveSessions();

// Get statistics
const stats = await simulationAuditService.getStatistics();

// Get settings
const settings = await simulationAuditService.getSettings();
```

### SecurityBoundariesService

Service for managing security boundaries during simulation.

```typescript
import {
  securityBoundariesService,
  SENSITIVE_OPERATIONS
} from '@/services/securityBoundariesService';

// Check if operation is allowed
const result = securityBoundariesService.checkOperation(
  'delete_patient',
  isSimulationMode
);

if (!result.allowed) {
  alert(result.blockReason);
  return;
}

// Get warning dialog text
const dialog = securityBoundariesService.getOperationWarningDialog(
  'modify_billing',
  isSimulationMode
);

// Log operation attempt
await securityBoundariesService.logOperationAttempt(
  'approve_payment',
  false, // was it allowed?
  'invoice',
  'invoice-uuid',
  { reason: 'Blocked in simulation' }
);
```

### useSecurityBoundaries Hook

Convenient hook for security checks in components.

```typescript
import { useSecurityBoundaries } from '@/hooks/useSecurityBoundaries';

function DeleteButton({ patientId }) {
  const { confirmOperation, trackModification } = useSecurityBoundaries();

  const handleDelete = async () => {
    // Check and confirm
    const allowed = await confirmOperation('delete_patient');
    if (!allowed) return;

    // Perform deletion
    await deletePatient(patientId);

    // Track for audit
    await trackModification('patient', patientId, 'delete');
  };

  return (
    <button onClick={handleDelete}>
      Delete Patient
    </button>
  );
}
```

---

## Troubleshooting

### Problem: "Médecin Directeur" Role Not Visible

**Solution:** Already fixed in version 2.0. If still not visible:

1. Clear browser cache
2. Log out and log back in
3. Verify user has correct role in database:
   ```sql
   SELECT up.id, up.full_name, r.name as role
   FROM user_profiles up
   JOIN roles r ON up.role_id = r.id
   WHERE up.id = 'YOUR_USER_ID';
   ```

### Problem: Cannot Start Simulation

**Possible Causes:**

1. **Not Authorized**
   - Check if your role is in allowed_roles
   - Contact administrator

2. **Simulation Locked**
   - Red banner appears
   - Wait for administrator to unlock
   - Check with IT team

3. **Already Simulating**
   - End current simulation first
   - Only one simulation per user at a time

### Problem: Session Won't End

**Solutions:**

1. **Click Multiple Times**
   - Try clicking "Quitter" button again
   - Refresh page and try again

2. **Clear Session Storage**
   - Open browser DevTools
   - Application tab → Session Storage
   - Delete entries starting with "rbac_"

3. **Administrator Force-End**
   - Contact administrator
   - They can force-end from Role Management page

### Problem: Timer Not Showing

**Check:**

1. Did you set auto-end duration?
   - Timer only shows if duration was set
   - Unlimited sessions have no timer

2. Browser refresh
   - Timer state loads from session
   - Refresh page to update

### Problem: Blocked Operation You Need

**Understanding:**

Some operations are intentionally blocked in simulation for safety.

**Solutions:**

1. **End Simulation**
   - Return to your actual role
   - Perform the operation normally

2. **Request Permission**
   - Some operations need real permissions
   - Cannot be simulated for security

3. **Contact Administrator**
   - If blocking seems incorrect
   - May need configuration update

---

## Testing Checklist

### Role Visibility Testing

- [ ] All 20 roles appear in Role Management page
- [ ] "Médecin Directeur" is listed and can be simulated
- [ ] Role display names show in French
- [ ] Role identifiers show in English
- [ ] Permission counts are accurate

### Simulation Flow Testing

- [ ] Can start simulation with confirmation dialog
- [ ] Amber banner appears immediately
- [ ] Floating badge appears in bottom-right
- [ ] Can navigate between pages while simulating
- [ ] Timer counts down if auto-end set
- [ ] 5-minute warning appears
- [ ] Auto-end works at timer expiry
- [ ] Can manually end simulation
- [ ] Returns to actual role correctly

### Security Testing

- [ ] Sensitive operations are blocked
- [ ] Warning dialogs appear for warned operations
- [ ] All actions are logged to audit trail
- [ ] Cannot escalate actual privileges
- [ ] Database RLS enforces actual role
- [ ] Session survives page refresh
- [ ] Session clears on logout

### Administrator Testing

- [ ] Can view all active sessions
- [ ] Can force-end any session
- [ ] Statistics display correctly
- [ ] Can lock simulation mode globally
- [ ] Locked mode shows red banner
- [ ] Can modify allowed roles list

---

## Support and Contact

For questions, issues, or feature requests:

**Internal Support:**
- IT Help Desk: ext. 5000
- Email: support@okapia-medical.local

**Documentation:**
- This Guide: `/SIMULATION_MODE_SYSTEM_GUIDE.md`
- RBAC Config: `/src/config/rbac.ts`
- Role Mapping: `/src/utils/roleMapping.ts`

**Database:**
- Tables: `simulation_sessions`, `simulation_actions`, `simulation_settings`
- Functions: `get_active_simulation_session`, `get_simulation_statistics`

---

## Appendix: Role Permission Matrix

### admin (Administrateur)
- **Permissions:** ALL (*)
- **Access:** Everything

### medical_director (Médecin Directeur)
- **Permissions:** All medical operations, staff management, visibility controls
- **Access:** Medical modules, doctor management, posts, settings

### doctor (Médecin)
- **Permissions:** Patient care, consultations, prescriptions, lab orders
- **Access:** Medical modules only

### hr_admin (Responsable RH)
- **Permissions:** Employee management, payroll, scheduling, contracts
- **Access:** HR modules, personnel directory

### accountant (Comptable)
- **Permissions:** Billing, analytics, contracts, insurance, payroll
- **Access:** Financial modules

### operations (Responsable Opérations)
- **Permissions:** Logistics, facilities, transport, billing view
- **Access:** Operations modules

### administrative (Administratif/RH)
- **Permissions:** Employee management, HR, reception
- **Access:** Administrative modules

### receptionist (Réceptionniste)
- **Permissions:** Patient registration, appointment scheduling, check-in
- **Access:** Reception modules

### laboratory (Laboratoire)
- **Permissions:** Lab orders, results entry, equipment
- **Access:** Laboratory modules

### pharmacist (Pharmacien)
- **Permissions:** Prescription dispensing, pharmacy inventory
- **Access:** Pharmacy modules

### logistician (Logisticien)
- **Permissions:** Inventory, suppliers, transport, facilities
- **Access:** Logistics modules

---

**End of Guide**

Version 2.0 - February 22, 2026
