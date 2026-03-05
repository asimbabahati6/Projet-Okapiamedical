# Quick Guide: Appointment Deletion & Management System

## What's New

Your calendar management system now includes comprehensive appointment deletion and management features with safety controls.

## Key Features at a Glance

### 1. Cancel Individual Appointments
- Click the **red Ban icon** next to any appointment
- Or open **Details** and click "Annuler le Rendez-vous"
- Select a cancellation reason from predefined options
- Confirm to cancel (patients and doctors are notified)

### 2. Permanently Delete Appointments
- Only available for **cancelled** or **no-show** appointments
- Click the **dark red Trash icon**
- Type "SUPPRIMER" to confirm deletion
- This action is **irreversible**

### 3. Bulk Selection
- Check boxes next to appointments you want to manage
- Use the header checkbox to select all visible appointments
- Selected appointments are highlighted in light blue

### 4. Bulk Actions Toolbar
When you select appointments, a floating toolbar appears at the bottom with:
- **Export** (green): Download selected appointments as CSV
- **Cancel** (red): Cancel all selected eligible appointments
- **Delete** (dark red): Permanently delete eligible appointments

### 5. Smart Action Buttons
Each appointment row shows contextual action buttons:
- **Ban icon**: Cancel appointment (if not already cancelled/completed)
- **Trash icon**: Delete permanently (if cancelled or no-show)
- **Details button**: View full appointment information

## Quick Actions Guide

### To Cancel One Appointment:
1. Find the appointment in the list
2. Click the red **Ban icon** OR click "Détails" then "Annuler le Rendez-vous"
3. Select or enter a cancellation reason
4. Click "Confirmer l'annulation"

### To Delete One Appointment:
1. Ensure it's already cancelled or marked as no-show
2. Click the dark red **Trash icon**
3. Read the warnings carefully
4. Type "SUPPRIMER" in the confirmation field
5. Click "Supprimer Définitivement"

### To Cancel Multiple Appointments:
1. Check the boxes next to appointments you want to cancel
2. Click "Annuler" in the floating toolbar
3. Enter a common cancellation reason
4. Confirm the bulk cancellation

### To Delete Multiple Appointments:
1. Select cancelled or no-show appointments
2. Click "Supprimer" in the toolbar
3. Read all warnings
4. Type "SUPPRIMER" to confirm
5. Click the confirmation button

### To Export Selected Appointments:
1. Select appointments using checkboxes
2. Click "Exporter" in the toolbar
3. CSV file downloads automatically

## Safety Features

### Cancellation (Soft Delete)
- Keeps the appointment in the system
- Marks it as cancelled with a reason
- Preserves history and statistics
- **Recommended approach**

### Permanent Deletion (Hard Delete)
- Completely removes from database
- Cannot be undone
- Only for already cancelled/no-show appointments
- Requires typing confirmation text

## Visual Indicators

| Color | Meaning |
|-------|---------|
| Blue highlight | Selected appointment |
| Red icon (Ban) | Cancel action |
| Dark red icon (Trash) | Delete action |
| Green button | Export action |
| Gray button | Cancel selection |

## Eligibility Rules

**Can Cancel If:**
- Status is NOT "cancelled"
- Status is NOT "completed"

**Can Delete If:**
- Status IS "cancelled" OR
- Status IS "no-show"

## Pro Tips

1. **Use cancellation instead of deletion** to preserve records
2. **Export before bulk delete** to backup important data
3. **Read all warnings** before confirming deletions
4. **Check selection count** in toolbar before bulk actions
5. **Use filters** to find specific appointments to manage

## Workflow Example

**Cleaning up old cancelled appointments:**

1. Set status filter to "Annulé" (Cancelled)
2. Set date filter to "Passés" (Past)
3. Review the filtered list
4. Select appointments to delete using checkboxes
5. Click "Exporter" to backup data (optional but recommended)
6. Click "Supprimer" in toolbar
7. Confirm deletion by typing "SUPPRIMER"

## Confirmation Requirements

| Action | Confirmation Required |
|--------|---------------------|
| Cancel single | Reason selection |
| Cancel bulk | Common reason entry |
| Delete single | Type "SUPPRIMER" |
| Delete bulk | Type "SUPPRIMER" |
| Export | None |

## What Happens After Actions

**After Cancellation:**
- Status changes to "cancelled"
- Cancellation reason is recorded
- Timestamp is saved
- Modification is logged
- Success message appears

**After Deletion:**
- Appointment is removed from database
- Cannot be recovered
- List refreshes automatically
- Success message appears

## Components Reference

### New Components Created
1. `CancelAppointmentModal` - Beautiful cancellation interface
2. `DeleteAppointmentModal` - Secure deletion with confirmation
3. `BulkActionsToolbar` - Floating toolbar for bulk operations
4. `useAppointmentActions` - React hook for all appointment actions

### Updated Components
1. `AppointmentDetailsModal` - Now includes cancel/delete buttons
2. `AppointmentsPage` - Checkboxes, action buttons, bulk toolbar

## Technical Details

### Database Operations
- **Cancel**: Updates status, adds reason and timestamp
- **Delete**: Removes record from database
- **Bulk Cancel**: Updates multiple records in one transaction
- **Bulk Delete**: Removes multiple records in one transaction

### Error Handling
- Failed operations show error messages
- Network errors are caught and displayed
- Invalid operations are prevented with disabled buttons
- User-friendly error descriptions

## Best Practices

1. **Always confirm** you're selecting the right appointments
2. **Use filters** to narrow down results before bulk actions
3. **Export first** when deleting important appointments
4. **Prefer cancellation** over deletion for record keeping
5. **Read warnings** especially for permanent deletions
6. **Double-check** bulk selections before confirming

## Need Help?

If appointments aren't showing action buttons:
- Check the appointment status (eligibility rules above)
- Refresh the page
- Ensure you have proper permissions

If bulk actions aren't working:
- Verify you've selected eligible appointments
- Check that appointments meet action criteria
- Try selecting fewer appointments at once

---

**Remember**: Cancellation preserves history, deletion is permanent. When in doubt, cancel instead of delete.
