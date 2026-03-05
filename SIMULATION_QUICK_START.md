# Simulation Mode - Quick Start Guide

**For End Users** | **5-Minute Setup** | **Version 2.0**

---

## ✅ What Was Fixed

The "**Médecin Directeur**" role and 11 other roles are now fully visible and functional in the system!

**All 20 Roles Now Available:**
- Médecin Directeur ⭐ NEW
- Responsable RH ⭐ NEW
- Responsable Opérations ⭐ NEW
- Plus 17 other roles

---

## 🚀 Quick Start (3 Steps)

### Step 1: Check Your Access

**Can you use simulation mode?**

You need one of these roles:
- Administrateur (super_admin)
- Médecin Directeur (medical_director) ⭐
- Responsable RH (hr_manager) ⭐
- Responsable Opérations (operations_manager) ⭐

### Step 2: Open Role Management

1. Click on menu
2. Select **"Système"**
3. Click **"Gestion des Rôles"**

Or go directly to: `/staff/role-management`

### Step 3: Start Simulating

1. **Pick a role** from the list
2. Click **"Simuler ce rôle"** button
3. **Fill the dialog:**
   - ✅ Check "I understand" box
   - Optional: Add reason
   - Optional: Set timer
4. Click **"Démarrer la Simulation"**

**Done!** You're now simulating that role.

---

## 🎯 What You'll See

### Amber Banner (Top)
```
⚠️ MODE SIMULATION ACTIF
Rôle réel: Administrateur → Simulé: Médecin Directeur
[Quitter la Simulation]
```

### Floating Badge (Bottom-Right)
```
🛡️ Simulation
   Médecin Directeur
   [X]
```

---

## 🛑 How to Stop

**Three Ways:**

1. Click **"Quitter la Simulation"** in banner
2. Click **X** on floating badge
3. Wait for timer to expire (if you set one)

---

## ⚠️ Important Notes

### Blocked Operations

Some operations are **blocked** in simulation mode for safety:
- ❌ Delete patients
- ❌ Delete users
- ❌ Approve payments
- ❌ Real medication dispensing
- ❌ System settings changes

### Logged Operations

**Everything you do is logged:**
- Page visits
- Data views
- Button clicks
- All actions

Administrators can see your activity.

---

## 🔍 Visual Guide

### Before Simulation
```
Normal interface
No banners
Standard permissions
```

### During Simulation
```
⚠️ AMBER BANNER at top ⚠️
Normal interface with simulated permissions
🛡️ Badge in bottom-right corner
```

### When Locked (Admin Disabled)
```
🚫 RED BANNER at top 🚫
"Simulation mode temporarily disabled"
Cannot start new simulations
```

---

## 💡 Pro Tips

1. **Always add a reason**
   - Helps you remember why you simulated
   - Useful for audit reviews

2. **Set a timer**
   - Prevents forgotten sessions
   - Recommended: 1-2 hours

3. **Test safely**
   - Use simulation to test workflows
   - Don't modify real production data unnecessarily

4. **End when done**
   - Don't leave sessions running
   - Return to your actual role

---

## ❓ Common Questions

### Q: Can I simulate multiple roles at once?
**A:** No, only one at a time. End current simulation first.

### Q: Will my real permissions change?
**A:** No, your actual role never changes. This is just for testing.

### Q: Can I simulate any role?
**A:** You can simulate any role shown in the Role Management page.

### Q: What if I need to do something blocked?
**A:** End the simulation and do it with your actual role.

### Q: How long can I simulate?
**A:** Maximum 8 hours, or until you end it manually.

---

## 🆘 Troubleshooting

### Problem: Can't start simulation

**Solution:**
- Check if you have permission (see Step 1)
- End any active simulation first
- Check if simulation is locked (red banner)

### Problem: Session won't end

**Solution:**
- Try clicking "Quitter" again
- Refresh the page and try again
- Contact IT if stuck

### Problem: Timer not showing

**Solution:**
- Timer only shows if you set auto-end duration
- Unlimited sessions have no timer

---

## 📚 Need More Help?

**Full Documentation:** `/SIMULATION_MODE_SYSTEM_GUIDE.md`

**Support:**
- IT Help Desk: ext. 5000
- Email: support@okapia-medical.local

---

**Ready to try?** Go to: `/staff/role-management`

---

*Last Updated: February 22, 2026*
