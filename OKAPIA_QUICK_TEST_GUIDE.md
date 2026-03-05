# OKAPIA Medical - Quick Test Guide for 9 Roles

## 🚀 Immediate Testing Available

The RBAC system with 9 OKAPIA Medical roles is now ready for testing! All test accounts have been created and the system has been successfully built.

## 📋 Test Account Credentials

All accounts use the same password: **Okapia2024!**

### Executive Level

**1. Directeur Général (Prof. BAZEBOSO J.A.)**
- Email: `directeur@okapia.com`
- Password: `Okapia2024!`
- Expected Access: Everything (supreme authority)
- Can: Start simulation, modify all invoices, change consultation rates

**2. Médecin Chef de Staff (Dr. TOTI B.)**
- Email: `medecin-chef@okapia.com`
- Password: `Okapia2024!`
- Expected Access: All medical services
- Can: Supervise all medical activities, validate radiology reports

### Management Level

**3. Gestionnaire (Naomie NDAYA)**
- Email: `gestionnaire@okapia.com`
- Password: `Okapia2024!`
- Expected Access: Finance, HR, Operations
- Can: Start simulation, view financials (read-only for unpaid invoices), manage operational budget
- Cannot: Modify unpaid invoices, change consultation rates

### Specialized Departments

**4. Chef Radiologie (Renedi N.)**
- Email: `radio-chef@okapia.com`
- Password: `Okapia2024!`
- Expected Access: Radiology department management
- Can: Validate radiology reports, delete records, manage exam schedule

**5. Technicien Radiologie (Bermie M.)**
- Email: `radio-tech@okapia.com`
- Password: `Okapia2024!`
- Expected Access: Limited radiology operations
- Can: Upload images, create technical notes
- Cannot: Delete records, modify validated reports

**6. Technicien Laboratoire**
- Email: `labo@okapia.com`
- Password: `Okapia2024!`
- Expected Access: Laboratory operations
- Can: Process lab orders, enter results

### Operational Staff

**7. Caissière (Grace NZOLA)**
- Email: `caissiere@okapia.com`
- Password: `Okapia2024!`
- Expected Access: Cash operations
- Can: Manage daily transactions, validate payments, access cash register
- Cannot: Access global financial reports

**8. Technicien (Merlin B.)**
- Email: `technique@okapia.com`
- Password: `Okapia2024!`
- Expected Access: Equipment and infrastructure
- Can: Manage equipment maintenance, create maintenance tickets

**9. Agent d'Hygiène (Célestine)**
- Email: `hygiene@okapia.com`
- Password: `Okapia2024!`
- Expected Access: Cleaning and hygiene management
- Can: Create cleaning checklists, submit restock requests
- Cannot: Approve supply orders (only Gestionnaire can)

## 🧪 Test Scenarios

### Scenario 1: Test Role Hierarchy
1. Login as `directeur@okapia.com`
2. Navigate to billing section
3. Try to modify an invoice - ✅ Should work
4. Logout and login as `gestionnaire@okapia.com`
5. Navigate to billing section
6. Try to modify an unpaid invoice - ❌ Should be blocked
7. Verify can view all financial data

### Scenario 2: Test Simulation Mode (2-Hour Timeout)
1. Login as `directeur@okapia.com`
2. Look for simulation mode switcher
3. Start a simulation as another role
4. Verify countdown timer appears
5. Verify system auto-expires after 2 hours
6. Try logging in as `caissiere@okapia.com`
7. Verify no simulation option available (not authorized)

### Scenario 3: Test Radiology Hierarchy
1. Login as `radio-tech@okapia.com`
2. Navigate to radiology section
3. Upload a test image
4. Create technical notes
5. Try to delete a record - ❌ Should be blocked
6. Logout and login as `radio-chef@okapia.com`
7. Validate the report
8. Login back as `radio-tech@okapia.com`
9. Try to modify validated report - ❌ Should be blocked

### Scenario 4: Test Financial Restrictions
1. Login as `gestionnaire@okapia.com`
2. Navigate to Pôle Commercial & Finance
3. Open Facturation (Billing)
4. Verify can view all invoices
5. Find an unpaid invoice
6. Try to modify or delete - ❌ Should see "Réservé au Directeur Général"
7. Navigate to Analyses Financières
8. Verify can view all reports (read-only)
9. Try to modify operational budget - ✅ Should work
10. Try to modify consultation rates - ❌ Should be blocked

### Scenario 5: Test Supply Request Workflow
1. Login as `hygiene@okapia.com`
2. Navigate to hygiene dashboard
3. Create a restock request for cleaning supplies
4. Submit request (status: pending)
5. Logout and login as `gestionnaire@okapia.com`
6. Check pending supply requests
7. Approve the request - ✅ Should work
8. Login as `hygiene@okapia.com`
9. Verify request status changed to approved

### Scenario 6: Test Cash Operations
1. Login as `caissiere@okapia.com`
2. Navigate to cash register
3. Process a payment transaction
4. Try to access global financial reports - ❌ Should be denied
5. Verify can only see daily transactions

### Scenario 7: Test Technical Maintenance
1. Login as `technique@okapia.com`
2. Navigate to equipment maintenance
3. Create a maintenance ticket
4. Update equipment status
5. Verify access to facilities management

## ✅ Expected Behavior Checklist

### All Roles
- [ ] Can login successfully
- [ ] See appropriate menu items for their role
- [ ] Dashboard loads without errors
- [ ] Navigation works correctly

### Directeur Général Only
- [ ] Access to all modules
- [ ] Can start simulation mode
- [ ] Can modify any invoice (including unpaid)
- [ ] Can change consultation rates
- [ ] Can force-end any simulation

### Gestionnaire Only
- [ ] Can start simulation mode
- [ ] Can view all financial data (read-only for some)
- [ ] Cannot modify unpaid invoices
- [ ] Cannot change consultation rates
- [ ] Can approve supply orders
- [ ] Can modify operational budget

### Radio Chef Only
- [ ] Can validate radiology reports
- [ ] Can delete radiology records
- [ ] Can manage exam schedule

### Radio Tech Only
- [ ] Can upload images and create notes
- [ ] Cannot delete any records
- [ ] Cannot modify validated reports

### Caissière Only
- [ ] Can manage daily transactions
- [ ] Cannot access global financial reports
- [ ] Can view and create invoices

### Hygiene Only
- [ ] Can create cleaning checklists
- [ ] Can submit restock requests
- [ ] Cannot approve supply orders

## 🐛 Troubleshooting

### Cannot Login
- Verify password is exactly: `Okapia2024!` (case-sensitive)
- Check network connection to Supabase
- Verify email is correct (no spaces)

### Missing Menu Items
- Verify user role in database: `SELECT * FROM test_accounts_info;`
- Check RBAC configuration in code
- Clear browser cache and reload

### Simulation Mode Not Working
- Verify you're logged in as directeur or gestionnaire
- Check simulation_settings table in database
- Verify max_session_duration_minutes is 120

### Permission Denied Errors
- Expected behavior for restricted actions
- Verify you're testing with the correct role
- Check ROLE_PERMISSIONS in rbac.ts

## 📊 Database Verification Queries

Run these in Supabase SQL editor to verify setup:

```sql
-- View all test accounts
SELECT * FROM test_accounts_info;

-- Check simulation settings
SELECT * FROM simulation_settings;

-- Check user roles
SELECT
  up.full_name,
  r.name as role_name,
  r.level,
  au.email
FROM user_profiles up
JOIN roles r ON up.role_id = r.id
JOIN auth.users au ON au.id = up.id
WHERE up.phone LIKE '+243 800 000%'
ORDER BY r.level;

-- View active simulations (if any)
SELECT * FROM active_simulation_sessions;
```

## 🎯 Success Criteria

✅ **Phase 1 - Database & Types (Completed)**
- [x] All 9 test accounts created
- [x] All roles properly configured
- [x] Type system updated
- [x] Build succeeds

🔄 **Phase 2 - UI Components (In Progress)**
- [ ] Simulation countdown banner visible
- [ ] Financial restrictions enforced in UI
- [ ] Radiology validation workflow works
- [ ] Supply request approval system works

⏳ **Phase 3 - Dashboards (Pending)**
- [ ] 7 role-specific dashboards created
- [ ] Navigation properly routes to correct dashboard
- [ ] All dashboard features working

## 📞 Support

If you encounter issues during testing:

1. Check `OKAPIA_RBAC_IMPLEMENTATION_SUMMARY.md` for implementation details
2. Verify database with SQL queries above
3. Check browser console for errors
4. Review RBAC permissions in `src/config/rbac.ts`

---

**Last Updated:** 2026-02-22
**Test Status:** Ready for immediate testing
**Priority Tests:** Scenarios 1, 2, and 4
