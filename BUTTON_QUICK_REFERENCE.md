# Personnel Management Buttons - Quick Reference

## Button Locations

```
┌─────────────────────────────────────────────────────────────┐
│  Gestion du Personnel                                       │
│  Vue d'ensemble de tous les membres du personnel           │
│                                                             │
│                        [Exporter CSV] [Ajouter un nouveau  │
│                                        personnel] ← TOP BAR │
└─────────────────────────────────────────────────────────────┘

STAFF CARDS (when data exists):
┌──────────────────────────────────────┐
│  [👤] Dr. Jean Dupont                │
│       [Médecin]                      │
│                                      │
│  🏢 Cardiologie                      │
│  📞 +243 800 123 456                 │
│  ✉️ jean.dupont@okapia.hospital     │
│  ──────────────────────────────────  │
│  [Voir] [Modifier] [Supprimer]  ← CARD ACTIONS
└──────────────────────────────────────┘

EMPTY STATE (when no data):
┌──────────────────────────────────────┐
│                                      │
│           [👥 Icon]                  │
│                                      │
│  Aucun membre du personnel trouvé   │
│  Commencez par ajouter votre         │
│  premier membre du personnel         │
│                                      │
│  [➕ Ajouter un nouveau personnel]  ← EMPTY STATE CTA
│                                      │
│  Vous pouvez ajouter des médecins,   │
│  infirmiers, pharmaciens...          │
└──────────────────────────────────────┘
```

## Three Main Buttons

### 1️⃣ "Ajouter un nouveau personnel" Button

**Location**: Top right of page (always visible)

**Appearance**:
- 🔵 Blue background
- ⚪ White text
- ➕ UserPlus icon
- 🌟 Shadow effect
- ↗️ Lifts on hover

**Function**: Opens modal to add new staff member

**Form Fields**:
- Full name (required)
- Phone number
- Role (required) - Doctor, Nurse, Pharmacist, etc.
- Department
- Email (required)
- Password (required, min 6 chars)

**Result**: Creates new user account and staff profile

---

### 2️⃣ "Modifier" Button

**Location**: On each staff member card (middle button)

**Appearance**:
- ⚫ Gray background
- ⚪ Dark gray text
- 📝 No icon (text only)
- 🌟 Shadow effect
- Tooltip: "Modifier les informations"

**Function**: Opens modal to edit existing staff

**Editable Fields**:
- Full name
- Phone number
- Role
- Department
- Active status (checkbox)

**Result**: Updates staff information immediately

---

### 3️⃣ "Supprimer" Button

**Location**: On each staff member card (right button)

**Appearance**:
- 🔴 Red background (light)
- 🔴 Red text (dark)
- 🗑️ No icon (text only)
- 🌟 Shadow effect
- Tooltip: "Supprimer le membre"

**Function**: Opens 3-step deletion wizard

**3 Steps**:

**Step 1: Confirmation**
- Shows staff details
- Lists consequences
- Warning about approval process

**Step 2: Details**
- Select departure type
- Enter final work date
- Provide reason (min 20 chars)

**Step 3: Impact Assessment**
- Checks active patients
- Checks future appointments
- Checks on-call schedules
- Shows approval workflow
- Prevents if blocking issues exist

**Result**: Creates deletion request (requires HR + Admin + Direction approval)

---

## Button States

### Normal State
```
[Button Text]  ← Default appearance
```

### Hover State
```
[Button Text]  ← Darker background + shadow + lift
      ↑
```

### Disabled State
```
[Button Text]  ← Grayed out + no interaction
(disabled)
```

### Loading State
```
[⏳ Loading...]  ← Shows progress
```

---

## Color Coding

| Button Type | Background | Text Color | Purpose |
|-------------|-----------|-----------|---------|
| **Add** | Blue 600 | White | Create new |
| **View** | Blue 50 | Blue 600 | View details |
| **Edit** | Gray 100 | Gray 700 | Modify data |
| **Delete** | Red 50 | Red 600 | Remove data |
| **Export** | Green 600 | White | Download CSV |

---

## Keyboard Shortcuts (Future)

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New staff |
| `Enter` | Confirm modal |
| `Esc` | Close modal |
| `Tab` | Navigate buttons |

---

## Common Actions

### Adding First Staff Member
1. Look for empty state message
2. Click big blue "Ajouter un nouveau personnel" button
3. Fill in form
4. Click "Ajouter le Membre"

### Editing Staff Information
1. Find staff card
2. Click "Modifier" (middle gray button)
3. Update fields
4. Click "Enregistrer les Modifications"

### Removing Staff Member
1. Find staff card
2. Click "Supprimer" (right red button)
3. Click "Continuer" on confirmation
4. Fill in departure details
5. Click "Vérifier l'impact"
6. Review impact assessment
7. Click "Soumettre la demande" if no blocking issues

---

## Safety Features

🛡️ **Multi-Level Approval**
- Deletion requires 3 approvals (HR → Admin → Direction)

🛡️ **Impact Assessment**
- Checks for active patients
- Checks for future appointments
- Prevents deletion if blocking issues exist

🛡️ **Data Retention**
- Staff data archived for 10 years
- Audit trail maintained

🛡️ **Access Control**
- Only super_admin and hospital_admin can access
- Role-based permissions enforced

---

## Tips

💡 **Empty State**: If you see "Aucun membre du personnel trouvé", click the prominent blue button in the center

💡 **Filters**: If staff exists but you see empty state, check your search filters (role, department)

💡 **Required Fields**: Fields marked with * are required

💡 **Deletion**: Always provide a detailed reason (minimum 20 characters)

💡 **Reassignment**: If deletion blocked, reassign patients/appointments first

💡 **Active Status**: Use the "Personnel actif" checkbox in edit modal instead of full deletion for temporary deactivation

---

## Button Hierarchy

**Primary Action** (most important):
- ➕ Ajouter un nouveau personnel (top right + empty state)

**Secondary Actions** (common):
- 👁️ Voir (view profile)
- ✏️ Modifier (edit details)
- 📊 Exporter CSV (export data)

**Destructive Action** (dangerous):
- 🗑️ Supprimer (delete with safeguards)

---

## Responsive Behavior

### Desktop (1024px+)
- Buttons side by side
- Cards in 3-column grid

### Tablet (768px - 1023px)
- Buttons side by side
- Cards in 2-column grid

### Mobile (< 768px)
- Buttons may stack
- Cards in 1-column grid
- Touch-optimized sizes

---

**Quick Access**: For immediate staff management, always look for the blue "Ajouter un nouveau personnel" button at the top right!
