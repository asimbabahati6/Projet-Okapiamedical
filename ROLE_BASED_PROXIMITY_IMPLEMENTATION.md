# Role-Based Proximity Constraint Implementation

## Overview

This document describes the implementation of role-based proximity constraints for the OKAPIA Hospital Management System attendance tracking feature. The system now applies a 5-meter proximity requirement selectively based on user roles.

## Implementation Summary

### Objective
Modify the existing proximity constraint system so that:
- Personnel roles must be within 5 meters to check in
- Super User (super_admin) and Administrator (hospital_admin) roles are exempt from this constraint
- All check-in attempts are logged with role and exemption details for audit purposes

## Changes Implemented

### 1. Core Validation Logic Updates

**File:** `/src/utils/geolocation.ts`

#### New Interface Properties
```typescript
export interface GeolocationValidationResult {
  isValid: boolean;
  distance: number;
  reason?: string;
  exemptionApplied?: boolean;  // NEW: Indicates if role exemption was applied
  userRole?: string;            // NEW: Records the user's role
}
```

#### New Helper Function
```typescript
export function isRoleExemptFromProximity(userRole?: string): boolean {
  if (!userRole) return false;
  const exemptRoles = ['super_admin', 'hospital_admin'];
  return exemptRoles.includes(userRole);
}
```

#### Enhanced Validation Logic
- The `validatePosition()` function now explicitly tracks whether an exemption was applied
- Error messages are more descriptive and role-aware
- Success messages clearly indicate when exemptions are granted

### 2. Attendance Page Enhancements

**File:** `/src/pages/staff/HRAttendancePage.tsx`

#### Visual Proximity Indicator
Added a prominent banner that displays before the check-in button:
- **For exempt roles (super_admin, hospital_admin):** Blue banner indicating exemption is active
- **For personnel roles:** Amber banner indicating proximity validation is required
- Shows the distance requirement dynamically based on settings

#### Enhanced Audit Logging
Updated `logCheckInAttempt()` function to record:
- `user_role`: The actual role name
- `role_name_display`: Human-readable role name
- `proximity_exemption_applied`: Boolean flag
- `is_exempt_role`: Whether the role has exemption privileges
- `distance_requirement_meters`: The configured distance requirement

### 3. Settings Access Control

**File:** `/src/components/settings/AttendanceGeolocationSettings.tsx`

#### Role-Based Access Control
- Only Super Administrators and Administrators can modify proximity settings
- Other users see settings in read-only mode with clear visual indicators
- All critical input fields are disabled for non-admin users

#### Enhanced Documentation
Added comprehensive role-based proximity information panel showing:
- Which roles require proximity validation (marked with red indicator)
- Which roles are exempt (marked with green indicator)
- Clear explanation that all attempts are audited

#### UI Features
- **Lock icon badge:** Shows "Lecture seule" (Read-only) for non-admin users
- **Shield icon notices:** Explain access restrictions
- **Disabled inputs:** All distance and coordinate inputs are read-only for non-admins
- **Hidden save button:** Replaced with informational text for non-admin users

## Role Configuration

### Exempt Roles (No Proximity Requirement)
- **super_admin** - Super Administrator
- **hospital_admin** - Hospital Administrator

These roles can check in from any distance. The distance is still calculated and recorded for audit purposes.

### Required Proximity Roles (5-Meter Requirement)
All other roles must be within the configured distance (default: 5 meters):
- **doctor** - Médecin
- **nurse** - Infirmier
- **pharmacist** - Pharmacien
- **receptionist** - Réceptionniste
- **administrative_staff** - Personnel Administratif
- **logistician** - Logisticien
- **patient** - Patient (if applicable)

## User Experience

### For Personnel (Proximity Required)
1. User opens the attendance page
2. Sees amber banner: "Validation de proximité requise - Vous devez être à moins de 5m..."
3. Clicks "Pointer l'arrivée" button
4. System acquires GPS location
5. If beyond 5 meters: Shows rejection modal with distance information
6. If within 5 meters: Check-in succeeds

### For Administrators (Exemption Active)
1. User opens the attendance page
2. Sees blue banner: "Exemption de proximité active - En tant que [role], vous pouvez effectuer le pointage depuis n'importe quel emplacement..."
3. Clicks "Pointer l'arrivée" button
4. System acquires GPS location
5. Check-in succeeds regardless of distance
6. Distance is recorded for audit purposes

### Settings Configuration
1. Administrator opens Settings page
2. Can modify all geolocation parameters including distance requirement
3. Sees comprehensive role-based proximity information panel
4. Non-admin users see same page but all inputs are disabled
5. Clear messaging about who can modify settings

## Audit Trail

All check-in attempts are logged in the `hr_checkin_attempts` table with:
- GPS coordinates (latitude, longitude, accuracy)
- Calculated distance from hospital
- Validation result (success, out_of_range, etc.)
- User role information
- Exemption status
- Device information

This ensures complete accountability while providing necessary flexibility for administrative oversight.

## Technical Details

### Distance Calculation
Uses the Haversine formula to calculate great-circle distance between two points on Earth:
- Clinic coordinates: -4.37°S, 15.25°E (OKAPIA Medical, Kinshasa)
- Calculates distance in meters
- Accuracy requirement: Minimum 50 meters GPS accuracy for check-in

### Configuration Parameters
- **max_distance_meters:** Default 5 meters (configurable 1-100m)
- **min_gps_accuracy_meters:** Default 3 meters
- **geolocation_enabled:** Master switch for GPS validation
- **clinic_latitude / clinic_longitude:** Reference point coordinates

## Security Considerations

1. **Role verification:** Exemption status is verified server-side through the database
2. **Audit logging:** All attempts are logged regardless of success/failure
3. **Settings protection:** Only admin roles can modify distance requirements
4. **GPS validation:** Distance is calculated and verified on both client and server
5. **Read-only enforcement:** Non-admin users cannot modify critical settings

## Testing Recommendations

1. **Test personnel role check-in:**
   - Verify rejection when beyond 5 meters
   - Verify success when within 5 meters
   - Check error messages are role-aware

2. **Test admin role check-in:**
   - Verify success from any distance
   - Confirm exemption message is displayed
   - Verify distance is still recorded in audit

3. **Test settings access:**
   - Verify admins can modify distance settings
   - Verify non-admins see read-only view
   - Test "Test my current position" function

4. **Audit verification:**
   - Check all attempts are logged
   - Verify exemption status is recorded
   - Confirm role information is captured

## Future Enhancements

Potential improvements that were NOT implemented per user requirements:
- Temporary exemptions for specific users
- Different distance requirements per role
- Time-based exemptions
- Location-based exemptions for multiple facilities

## Conclusion

The implementation successfully applies proximity constraints based on user roles while maintaining comprehensive audit trails and providing clear user feedback. Only Super User and Administrator roles can bypass the 5-meter requirement and configure distance settings, ensuring both security and operational flexibility.
