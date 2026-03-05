# OKAPIA Medical - Complete Roles Reference Guide

## 📊 Overview

This document provides a complete reference for all 9 OKAPIA Medical roles, their permissions, hierarchies, and usage patterns.

## 🎯 Role Hierarchy

```
Level 1: Directeur Général (Supreme Authority)
   ↓
Level 2: Médecin Chef de Staff (Medical Supervision)
   ↓
Level 3: Gestionnaire (Financial & HR Management)
   ↓
Level 4: Chef Radiologie (Radiology Department Head)
   ↓
Level 5: Caissière, Technicien, Tech Radiologie, Laboratoire (Operational Staff)
   ↓
Level 6: Agent d'Hygiène (Support Staff)
```

## 👥 Role Details

### 1. Directeur Général (directeur_general)

**Test Account:** directeur@okapia.com | Okapia2024!
**Person:** Prof. BAZEBOSO J.A.
**Hierarchy Level:** 1

**Permissions:**
- ✅ Full system access (`*`)
- ✅ Start simulation mode (2-hour limit)
- ✅ Modify/cancel ALL invoices (including unpaid)
- ✅ Change consultation rates
- ✅ Access all financial reports
- ✅ Manage all departments
- ✅ Force-end any simulation
- ✅ Validate radiology reports
- ✅ Delete any record

**Use Cases:**
- Strategic decisions
- Financial oversight
- System configuration
- Emergency interventions
- Final approvals

### 2. Médecin Chef de Staff (medecin_chef_staff)

**Test Account:** medecin-chef@okapia.com | Okapia2024!
**Person:** Dr. TOTI B.
**Hierarchy Level:** 2

**Permissions:**
- ✅ All medical permissions (`*_medical`)
- ✅ View all medical services
- ✅ Generate medical reports
- ✅ Manage medical quality
- ✅ Validate radiology reports
- ✅ Manage medical staff
- ✅ View doctor visibility settings
- ❌ Cannot simulate roles
- ❌ Cannot modify unpaid invoices
- ❌ Cannot change consultation rates

**Use Cases:**
- Medical supervision
- Quality assurance
- Staff management
- Protocol enforcement
- Medical reporting

### 3. Gestionnaire (gestionnaire)

**Test Account:** gestionnaire@okapia.com | Okapia2024!
**Person:** Naomie NDAYA
**Hierarchy Level:** 3

**Permissions:**
- ✅ Start simulation mode (2-hour limit)
- ✅ View billing (READ-ONLY for unpaid invoices)
- ✅ View treasury (READ-ONLY)
- ✅ Manage operational budget
- ✅ Manage expenses
- ✅ Approve supply orders
- ✅ View global balance sheets (READ-ONLY)
- ✅ View cash flow (READ-ONLY)
- ✅ Manage HR and payroll
- ❌ Cannot modify unpaid invoices
- ❌ Cannot change consultation rates
- ❌ Cannot modify global financials

**Use Cases:**
- Daily operations management
- Budget tracking
- Supply approval
- HR management
- Financial monitoring

**Important Restrictions:**
- Can VIEW all financial data but cannot MODIFY:
  - Unpaid invoices (reserved for Directeur Général)
  - Consultation rates (reserved for Directeur Général)
  - Global financial reports (read-only access)

### 4. Chef Radiologie (radio_chef)

**Test Account:** radio-chef@okapia.com | Okapia2024!
**Person:** Renedi N.
**Hierarchy Level:** 4

**Permissions:**
- ✅ Manage radiology department
- ✅ **Validate radiology reports**
- ✅ **Delete radiology records**
- ✅ Manage exam schedule
- ✅ Manage imaging equipment
- ✅ Upload radiology images
- ✅ Create technical notes
- ✅ Modify validated reports
- ❌ Cannot approve supply orders
- ❌ Cannot access financial reports

**Use Cases:**
- Department management
- Report validation
- Quality control
- Equipment oversight
- Schedule management

**Key Responsibilities:**
- Only role (besides superiors) that can validate reports
- Can delete records for corrections
- Can modify reports even after validation

### 5. Technicien Radiologie (radio_tech)

**Test Account:** radio-tech@okapia.com | Okapia2024!
**Person:** Bermie M.
**Hierarchy Level:** 5

**Permissions:**
- ✅ Upload radiology images
- ✅ Create technical notes
- ✅ View exam schedule
- ✅ View patients
- ✅ Modify DRAFT reports
- ❌ **Cannot delete any records**
- ❌ **Cannot modify validated reports**
- ❌ **Cannot validate reports**

**Use Cases:**
- Image acquisition
- Technical documentation
- Draft report creation
- Equipment operation

**Important Restrictions:**
- Once a report is validated by Radio Chef, Tech cannot modify it
- Cannot delete records (accidental deletion prevention)
- Cannot validate own work (requires senior review)

### 6. Laboratoire (lab_technician)

**Test Account:** labo@okapia.com | Okapia2024!
**Person:** Technicien Laboratoire
**Hierarchy Level:** 5

**Permissions:**
- ✅ View lab orders
- ✅ Edit lab orders
- ✅ View results
- ✅ Create results
- ✅ Process samples
- ❌ Cannot access radiology
- ❌ Cannot access pharmacy

**Use Cases:**
- Sample processing
- Result entry
- Quality control
- Laboratory management

### 7. Caissière (caissiere)

**Test Account:** caissiere@okapia.com | Okapia2024!
**Person:** Grace NZOLA
**Hierarchy Level:** 5

**Permissions:**
- ✅ Manage daily transactions
- ✅ Validate payments
- ✅ Access cash register
- ✅ View daily transactions
- ✅ View/create invoices
- ❌ **Cannot access global financial reports**
- ❌ Cannot modify consultation rates
- ❌ Cannot approve expenses

**Use Cases:**
- Daily cash operations
- Payment processing
- Invoice creation
- Transaction management

**Important Restrictions:**
- Limited to operational transactions only
- No access to strategic financial data
- Cannot see global balance sheets or comprehensive reports

### 8. Technicien (technique)

**Test Account:** technique@okapia.com | Okapia2024!
**Person:** Merlin B.
**Hierarchy Level:** 5

**Permissions:**
- ✅ Manage equipment maintenance
- ✅ Manage infrastructure
- ✅ View technical inventory
- ✅ Create maintenance tickets
- ✅ Update equipment status
- ✅ View/edit facilities
- ❌ Cannot approve purchases
- ❌ Cannot access medical data

**Use Cases:**
- Equipment maintenance
- Infrastructure management
- Preventive maintenance
- Repair coordination

### 9. Agent d'Hygiène (hygiene)

**Test Account:** hygiene@okapia.com | Okapia2024!
**Person:** Célestine
**Hierarchy Level:** 6

**Permissions:**
- ✅ View hygiene protocols
- ✅ Create cleaning checklists
- ✅ **Submit restock requests**
- ✅ View hygiene logs
- ✅ Create hygiene reports
- ❌ **Cannot approve supply orders** (only Gestionnaire can)
- ❌ Cannot access medical or financial data

**Use Cases:**
- Cleaning operations
- Supply requests
- Hygiene monitoring
- Protocol compliance

**Workflow:**
1. Agent d'Hygiène submits restock request
2. Request goes to Gestionnaire for approval
3. Once approved, Gestionnaire or Logistician processes order

## 🔄 Simulation Mode

### Who Can Simulate?
- ✅ Directeur Général
- ✅ Gestionnaire
- ❌ All other roles

### Duration
- Maximum: 2 hours (120 minutes)
- Warning: 10 minutes before expiration
- Auto-expire: Forced logout when time expires

### Countdown Colors
- 🟢 Green: > 30 minutes remaining
- 🟡 Yellow: 10-30 minutes remaining
- 🔴 Red: < 10 minutes remaining (pulsing alert)

## 🔐 Permission Matrix

| Feature | DIR_GEN | MED_CHEF | GEST | R_CHEF | R_TECH | LABO | CAISSE | TECH | HYGIENE |
|---------|---------|----------|------|--------|--------|------|--------|------|---------|
| **Simulation** |
| Start Simulation | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Financial** |
| View Invoices | ✅ | ❌ | ✅* | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Modify Unpaid Invoices | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modify Consultation Rates | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Global Financials | ✅ | ❌ | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Access Cash Register | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Radiology** |
| Upload Images | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modify Draft Reports | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modify Validated Reports | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Validate Reports | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete Records | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Supply Management** |
| Submit Restock Requests | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approve Supply Orders | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Technical** |
| Equipment Maintenance | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage Infrastructure | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

*Read-only access

## 🚨 Critical Restrictions

### Financial Restrictions (Gestionnaire)
When logged in as Gestionnaire, the following financial operations show "Réservé au Directeur Général" tooltips:
- Modify unpaid invoices
- Cancel invoices
- Change consultation rates
- Modify global financial parameters

### Radiology Restrictions (Tech Radiologie)
When logged in as Radio Tech, the following operations are blocked:
- Cannot modify reports after validation
- Cannot delete any records
- Cannot validate reports

### Supply Request Restrictions (Hygiène)
When logged in as Hygiène, approval operations show "Approbation réservée au Gestionnaire":
- Cannot approve own requests
- Cannot directly order supplies
- Must wait for Gestionnaire approval

## 📱 UI Components

### Permission Guards Available

1. **FinancialPermissionGuard**
```tsx
<FinancialPermissionGuard requires="modify_unpaid_invoices">
  <button>Modifier</button>
</FinancialPermissionGuard>
```

2. **RadiologyPermissionGuard**
```tsx
<RadiologyPermissionGuard
  requires="validate_report"
  reportStatus={status}
  isLocked={isLocked}
>
  <button>Valider</button>
</RadiologyPermissionGuard>
```

3. **SimulationCountdownBanner**
Automatically displayed during simulation with countdown timer

### Hooks Available

1. **useFinancialPermissions()**
2. **useRadiologyPermissions()**
3. **useRBAC()**

## 🧪 Testing Checklist

### Phase 1: Login Tests
- [ ] All 9 accounts can log in
- [ ] Correct dashboard shown for each role
- [ ] Menu items filtered correctly

### Phase 2: Permission Tests
- [ ] Directeur can modify unpaid invoices
- [ ] Gestionnaire blocked from modifying unpaid invoices
- [ ] Radio Chef can validate reports
- [ ] Radio Tech blocked from validating reports
- [ ] Hygiène can submit requests
- [ ] Hygiène blocked from approving requests

### Phase 3: Simulation Tests
- [ ] Directeur can start simulation
- [ ] Gestionnaire can start simulation
- [ ] Other roles cannot start simulation
- [ ] 2-hour countdown works
- [ ] Auto-expire after 2 hours

### Phase 4: Workflow Tests
- [ ] Supply request workflow (Hygiène → Gestionnaire)
- [ ] Radiology validation workflow (Tech → Chef)
- [ ] Financial approval workflow

## 📚 Related Documentation

- `OKAPIA_RBAC_IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `OKAPIA_QUICK_TEST_GUIDE.md` - Step-by-step testing guide
- `SIMULATION_MODE_USER_GUIDE.md` - Simulation mode documentation (to be created)
- `FINANCIAL_PERMISSIONS_GUIDE.md` - Financial restrictions guide (to be created)

## 🆘 Support & Troubleshooting

### Cannot Login
Verify credentials exactly as shown (case-sensitive):
- Email: `role@okapia.com`
- Password: `Okapia2024!`

### Missing Permissions
Check role mapping:
```sql
SELECT * FROM test_accounts_info WHERE email = 'your-email@okapia.com';
```

### Simulation Not Working
Verify settings:
```sql
SELECT * FROM simulation_settings;
```

### Permission Denied
Expected for restricted actions - verify you're testing with correct role

---

**Last Updated:** 2026-02-22
**Version:** 1.0
**Status:** Production Ready
