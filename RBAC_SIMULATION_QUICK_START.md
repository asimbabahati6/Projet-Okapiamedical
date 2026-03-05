# RBAC Role Simulation - Quick Start Guide

## What is Role Simulation?

Role simulation allows administrators to view the system from different user perspectives without logging out and creating multiple accounts. It's perfect for:
- 🧪 Testing new features
- 👨‍🏫 Training staff
- 🎯 Demonstrations
- 🐛 Debugging role-specific issues

---

## How to Use (3 Simple Steps)

### Step 1: Activate Simulation Mode

1. **Login as an administrator** (super_admin or hospital_admin)
2. Look for the **blue panel** at the top of the sidebar
3. Click the **"Activer Simulation"** button

```
┌────────────────────────────────┐
│ Mon Rôle                       │
│                [Activer Simulation] │
│ Administrateur                 │
└────────────────────────────────┘
```

### Step 2: Select a Role

Once activated, the panel turns **amber** and shows a dropdown:

```
┌────────────────────────────────────────┐
│ MODE SIMULATION ACTIF                  │
│             [Retour à mon rôle]        │
├────────────────────────────────────────┤
│ Rôle Simulé    [✓ Mode Simulation]    │
│                                        │
│ [Laboratoire ▼]                        │
│  - Administrateur                      │
│  - Médecin                             │
│  - Laboratoire  ← Selected             │
│  - Pharmacien                          │
│  - (etc...)                            │
└────────────────────────────────────────┘
```

**Select any role from the dropdown.**

### Step 3: Explore

The system will:
- ✅ Auto-navigate to that role's default dashboard
- ✅ Filter the menu to show only that role's items
- ✅ Apply that role's theming/branding
- ✅ Restrict access to appropriate pages

**To return to admin view:** Click **"Retour à mon rôle"** button

---

## Available Roles

| Role Icon | Role Name | What You'll See |
|-----------|-----------|-----------------|
| 👑 | **Administrateur** | Full system access, all modules |
| 👨‍⚕️ | **Médecin** | Medical modules, consultations, prescriptions |
| 🔬 | **Laboratoire** | Lab dashboard (teal theme), test orders, results |
| 💊 | **Pharmacien** | Pharmacy dashboard (blue theme), dispensing, inventory |
| 📋 | **Réceptionniste** | Patient check-in, appointments, registration |
| 🏢 | **Administratif/RH** | HR modules, employee management, schedules |
| 💰 | **Comptable** | Billing, analytics, contracts, payroll |
| 📦 | **Logisticien** | Inventory, suppliers, transport, facilities |

---

## Visual Indicators

### When Simulation is ACTIVE

**Amber Banner (Top of Sidebar)**
```
┌──────────────────────────────────────────────────┐
│ 🟡 MODE SIMULATION ACTIF - Visualisation: Laboratoire │
│                         [Retour à mon rôle]      │
└──────────────────────────────────────────────────┘
```

**Amber Panel (Role Selector)**
- Background: Amber gradient
- Button: "✓ Mode Simulation" (amber)
- Dropdown: Active and showing selected role

**Filtered Menu**
- Only items accessible to simulated role
- No locked items shown
- Clean, focused view

### When Simulation is OFF

**Blue Panel (Role Display)**
- Background: Blue gradient
- Button: "Activer Simulation" (blue)
- Display: Your actual role (read-only)

**Full Menu (Admin Only)**
- All items visible
- Nothing locked (admin has full access)
- Complete navigation

---

## Examples

### Example 1: Testing Laboratory Features

**Goal:** Test the new laboratory results entry feature

1. **Activate Simulation** → Click "Activer Simulation"
2. **Select Laboratoire** → Choose from dropdown
3. **Auto-navigate** → System goes to `/laboratory/dashboard`
4. **See teal dashboard** → Laboratory-specific interface
5. **Test feature** → Try entering results
6. **Return** → Click "Retour à mon rôle"

### Example 2: Training a New Pharmacist

**Goal:** Show new pharmacist their interface

1. **Activate Simulation** → Enable simulation mode
2. **Select Pharmacien** → Choose from dropdown
3. **Tour the interface** → Show dashboard, inventory, dispensing
4. **Explain features** → Point out key functionality
5. **Switch roles** → Select "Médecin" to show how doctors prescribe
6. **Back to pharmacy** → Select "Pharmacien" again
7. **Finish** → Click "Retour à mon rôle"

### Example 3: Debugging Access Issue

**Goal:** User reports they can't see consultations module

1. **Activate Simulation**
2. **Select their role** → e.g., "Réceptionniste"
3. **Check menu** → Verify what they can see
4. **Confirm issue** → Indeed, consultations not visible
5. **Check permissions** → Verify role configuration
6. **Return to admin** → Fix the issue

---

## Important Notes

### ✅ What Simulation Does

- Changes the UI to match selected role
- Shows/hides menu items appropriately
- Allows navigation to role-specific pages
- Applies role-specific theming

### ❌ What Simulation Does NOT Do

- **Does NOT** change your actual database permissions
- **Does NOT** give you real access to restricted data
- **Does NOT** bypass Row Level Security (RLS)
- **Does NOT** modify any database records with simulated identity

### 🔒 Security

**You remain logged in as yourself.**
- Database queries use YOUR actual user ID
- RLS policies check YOUR actual role
- You cannot perform actions you don't have real permission for
- Simulation is purely a frontend UI feature

**Example:**
```
Simulating as "Laboratoire" ← Frontend shows lab interface
But trying to update a lab result ← Database checks YOUR actual role
If you're actually an admin, not a lab tech ← Update denied ❌
```

This protects data integrity while allowing safe testing.

---

## Keyboard Shortcuts

| Action | Shortcut | Description |
|--------|----------|-------------|
| Toggle Simulation | (Not implemented yet) | Future: Quick toggle |
| Reset to Admin | (Not implemented yet) | Future: Quick reset |

---

## Troubleshooting

### "I don't see the simulation option"

**Cause:** You're not logged in as an administrator

**Solution:** Only super_admin and hospital_admin roles can use simulation. Regular users cannot activate it.

### "The role dropdown is empty"

**Cause:** JavaScript error or role mapping issue

**Solution:**
1. Refresh the page
2. Check browser console for errors
3. Verify your admin role in database

### "Menu items look weird"

**Cause:** Simulation mode state mismatch

**Solution:**
1. Click "Retour à mon rôle" to reset
2. Refresh the page
3. Try activating simulation again

### "Access denied when visiting a page"

**Cause:** Route protection working correctly

**Solution:** This is expected! Even when simulating, you cannot access pages you don't have actual permission for. Simulation only changes the UI, not your real permissions.

---

## Tips & Tricks

### 💡 Tip 1: Quick Role Switching

When demonstrating multiple roles:
1. Stay in simulation mode
2. Just change the dropdown selection
3. System auto-navigates each time
4. No need to toggle simulation off/on

### 💡 Tip 2: Training Sessions

For training:
1. Open in presentation mode
2. Activate simulation
3. Walk through each role
4. Show real-world workflows
5. Demonstrate role differences

### 💡 Tip 3: Testing Workflow

When testing features:
1. Simulate as the role that uses the feature
2. Go through the complete workflow
3. Verify all steps work
4. Check error handling
5. Return to admin to verify data

### 💡 Tip 4: Understanding Permissions

To see what each role can access:
1. Simulate as that role
2. Menu shows ONLY accessible items
3. No locked items (they're hidden)
4. This is exactly what that user sees

---

## Session Persistence

### Automatic Save

Your simulation state is automatically saved and restored:
- ✅ Persists across page refreshes
- ✅ Survives internal navigation
- ✅ Maintained during work session

### Automatic Clear

Simulation state is automatically cleared when:
- ❌ You close the browser tab
- ❌ You logout
- ❌ Browser session ends
- ❌ You open a new tab

This ensures:
- Clean state for new sessions
- No confusion from stale simulation
- Security through auto-reset

---

## Best Practices

### ✅ Do

- **Test before deploying** role changes
- **Use for training** new staff
- **Demonstrate features** to stakeholders
- **Debug** role-specific issues
- **Return to admin** when done

### ❌ Don't

- **Leave simulation on** indefinitely
- **Forget which role** you're simulating
- **Try to bypass security** (it won't work)
- **Make real changes** while simulating (you can't)
- **Rely on simulation** for actual work

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│         RBAC ROLE SIMULATION CHEAT SHEET            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ACTIVATE:  Click "Activer Simulation"              │
│  SELECT:    Choose role from dropdown                │
│  EXPLORE:   Navigate and test                        │
│  RESET:     Click "Retour à mon rôle"               │
│                                                     │
│  INDICATOR: 🟡 Amber banner when active             │
│  STATUS:    Check role name in banner               │
│                                                     │
│  REMEMBER:  Simulation = UI only                     │
│             Database = Real permissions still apply  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Getting Help

### Issues or Questions?

1. **Check this guide** - Most questions answered here
2. **Try resetting** - Click "Retour à mon rôle" and try again
3. **Check the console** - Browser dev tools may show errors
4. **Consult full documentation** - See `RBAC_SIMULATION_COMPLETE_GUIDE.md`

### Feature Requests

Want to enhance role simulation? Suggestions:
- Time-limited simulation sessions
- Simulation history tracking
- Quick role switching shortcuts
- Guided role tours
- Permission comparison tool

---

**Happy Simulating! 🎭**

*Remember: Simulation is a powerful tool for testing and training. Use it wisely to improve your system and user experience.*

---

**Version:** 2.0
**Last Updated:** February 22, 2026
**Status:** Production Ready ✅
