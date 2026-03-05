# Multi-Test Laboratory Order Implementation

## 🎯 Overview

Implementation of multi-select functionality for laboratory test orders, allowing medical staff to prescribe multiple tests in a single request with automatic price calculation and enhanced UX.

---

## ✨ New Features

### 1. **Multi-Test Selection**
- Select multiple laboratory tests in a single order
- Search functionality to quickly find tests
- Visual badges showing selected tests
- Easy removal of individual tests with one click

### 2. **Dynamic Price Calculation**
- Real-time total cost calculation
- Itemized breakdown showing each test's price
- Visual price summary card with green theme

### 3. **Enhanced Search**
- Filter tests by name, code, or category
- Search while dropdown is open
- Auto-focus on search field when dropdown opens

### 4. **Improved UX**
- Clear visual feedback for selected items
- "Effacer" (Clear all) button for quick deselection
- Selection counter showing number of tests
- Submission button displays test count

---

## 🗄️ Database Changes

### New Table: `lab_order_tests`

Junction table for many-to-many relationship between orders and tests.

```sql
CREATE TABLE lab_order_tests (
  id uuid PRIMARY KEY,
  lab_order_id uuid REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_id uuid REFERENCES lab_tests(id) ON DELETE RESTRICT,
  result_value text,
  result_unit text,
  is_abnormal boolean DEFAULT false,
  notes text,
  performed_by uuid REFERENCES user_profiles(id),
  approved_by uuid REFERENCES user_profiles(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### Data Migration
- Existing single-test orders automatically migrated to junction table
- Backward compatibility maintained
- No data loss during migration

### Security (RLS)
- ✅ RLS enabled on `lab_order_tests`
- ✅ Medical staff can create test associations
- ✅ Authenticated users can view
- ✅ Supervisors can delete

---

## 🎨 UI Components

### New Component: `MultiSelectWithSearch`

**Location:** `src/components/ui/MultiSelectWithSearch.tsx`

**Features:**
- Generic reusable component
- Customizable placeholder text
- Search integration
- Badge display for selected items
- Keyboard navigation support
- Click-outside-to-close functionality

**Props:**
```typescript
interface MultiSelectWithSearchProps {
  options: Option[];          // Available options
  selectedIds: string[];       // Currently selected IDs
  onChange: (ids: string[]) => void;  // Selection change handler
  placeholder?: string;        // Main input placeholder
  searchPlaceholder?: string;  // Search field placeholder
  maxHeight?: string;          // Dropdown max height
  disabled?: boolean;          // Disabled state
  error?: boolean;             // Error state styling
}
```

### Visual Layout

```
┌────────────────────────────────────────────────────────┐
│ Tests de Laboratoire *                                 │
│ ┌────────────────────────────────────────────────┐    │
│ │ [Hémogramme ×] [Gamma GT ×] [Créatinine ×]  ▼ │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ When opened:                                           │
│ ┌────────────────────────────────────────────────┐    │
│ │ 🔍 Rechercher un test...                       │    │
│ ├────────────────────────────────────────────────┤    │
│ │ ☐ Hémogramme Complet (CBC) • $25              │    │
│ │ ☑ Gamma GT (GGT) • $30                         │    │
│ │ ☑ Créatinine (CREAT) • $15                     │    │
│ │ ☐ Glycémie à Jeun (FBG) • $12                  │    │
│ │ ... (scrollable list)                          │    │
│ ├────────────────────────────────────────────────┤    │
│ │ 3 tests sélectionnés                           │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ ┌────────────────────────────────────────────────┐    │
│ │ $ Coût Total Estimé                    $70.00  │    │
│ │ GGT: $30  CREAT: $15  CBC: $25                 │    │
│ └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

---

## 🔄 Updated Workflow

### Creating a Multi-Test Order

```
1. User clicks "+ Nouvelle Analyse"
         ↓
2. Fills patient and doctor fields
         ↓
3. Clicks on "Tests de Laboratoire" field
         ↓
4. Dropdown opens with search bar
         ↓
5. User searches for tests (optional)
         ↓
6. Clicks checkboxes to select multiple tests
         ↓
7. Selected tests appear as badges
         ↓
8. Total price updates automatically
         ↓
9. User sees itemized breakdown
         ↓
10. Clicks "Créer la Demande (X tests)"
         ↓
11. One order created + X test associations
         ↓
12. Success: "Demande créée: X tests prescrits"
```

### Data Flow

```
Form Submission
    ↓
Create lab_order (main order)
    ↓
Get order ID
    ↓
Insert into lab_order_tests (for each selected test)
    ↓
Success notification
    ↓
Dashboard refresh
```

---

## 📊 Code Changes

### Modified Files

1. **`src/components/laboratory/AddLabOrderModal.tsx`**
   - Changed `test_id` (string) → `test_ids` (string[])
   - Integrated `MultiSelectWithSearch` component
   - Added dynamic price calculation
   - Updated validation for array of tests
   - Modified submission to create junction table entries
   - Enhanced success message with test count

2. **`src/components/ui/MultiSelectWithSearch.tsx`** (NEW)
   - Reusable multi-select component
   - Built-in search functionality
   - Badge display for selections
   - Accessible keyboard navigation

3. **Database Migration**
   - Created `lab_order_tests` junction table
   - Migrated existing data
   - Set up RLS policies
   - Added indexes for performance

---

## 🎯 Key Features in Detail

### 1. Search Functionality

```typescript
// Filters by test name, code, or price
const filteredOptions = options.filter(option => {
  const searchLower = searchTerm.toLowerCase();
  return (
    option.label.toLowerCase().includes(searchLower) ||
    option.description?.toLowerCase().includes(searchLower) ||
    option.metadata?.toLowerCase().includes(searchLower)
  );
});
```

**Search Fields:**
- Test name (e.g., "Hémogramme")
- Test code (e.g., "CBC", "GGT")
- Price (e.g., "$30")

### 2. Price Calculation

```typescript
// Calculate total from selected tests
const selectedTests = tests.filter(test =>
  formData.test_ids.includes(test.id)
);

const totalPrice = selectedTests.reduce(
  (sum, test) => sum + (test.price || 0),
  0
);
```

**Display:**
- Total shown prominently
- Individual test prices listed below
- Updates in real-time as selections change

### 3. Validation Rules

```typescript
// At least one test required
if (!formData.test_ids || formData.test_ids.length === 0) {
  errors.test_ids = 'Veuillez sélectionner au moins un test';
}
```

**Validation States:**
- ❌ No tests selected → Error message
- ✅ One or more tests → Valid
- ⚠️ Tests unavailable → Dropdown disabled

### 4. Success Notification

**Single Test:**
```
"Demande créée avec succès: 1 test prescrit"
```

**Multiple Tests:**
```
"Demande créée avec succès: 3 tests prescrits"
```

---

## 🎨 Styling & Visual Design

### Color Scheme

**Selected Test Badges:**
- Background: `bg-green-100`
- Text: `text-green-800`
- Hover on X: `bg-green-200`

**Price Summary Card:**
- Background: `gradient from-green-50 to-emerald-50`
- Border: `border-green-200`
- Icon: `text-green-600`
- Total: `text-green-700 font-bold`

**Dropdown States:**
- Normal: `border-gray-300`
- Focused: `ring-2 ring-green-500`
- Error: `border-red-300 bg-red-50`
- Disabled: `bg-gray-100`

### Icons Used

- `Search` - Search field
- `X` - Remove badge / Close dropdown
- `ChevronDown` - Dropdown indicator (rotates when open)
- `DollarSign` - Price summary
- `AlertCircle` - Error indicators

---

## 🔐 Security Considerations

### RLS Policies

**lab_order_tests table:**

1. **SELECT**: All authenticated users can view
2. **INSERT**: Only medical staff can create
3. **UPDATE**: Only medical staff can modify
4. **DELETE**: Only supervisors can delete

### Permitted Roles

```sql
'doctor', 'medical_director', 'super_admin',
'directeur_general', 'lab_technician', 'lab_supervisor'
```

### Data Integrity

- Foreign key constraints prevent orphaned records
- Cascade delete: Deleting order removes test associations
- Restrict delete: Cannot delete test if orders reference it

---

## 📱 Accessibility Features

### Keyboard Navigation

- `Tab` → Navigate between checkboxes
- `Space` → Toggle checkbox
- `Enter` → Toggle checkbox
- `Esc` → Close dropdown (future enhancement)

### Screen Readers

- ARIA labels on interactive elements
- Semantic HTML (checkboxes, labels)
- Status announcements for selection count

### Focus Management

- Auto-focus on search when dropdown opens
- Visible focus indicators
- Logical tab order

---

## 🚀 Performance Optimizations

### Efficient Rendering

```typescript
// Filter options client-side (fast)
const filteredOptions = options.filter(/* ... */);

// Memoized selected tests calculation
const selectedTests = useMemo(
  () => tests.filter(test => formData.test_ids.includes(test.id)),
  [tests, formData.test_ids]
);
```

### Database Optimization

- Indexes on `lab_order_id` and `test_id`
- Bulk insert for multiple tests (single query)
- Efficient join queries for fetching order details

### Click-Outside Detection

```typescript
// Cleanup event listener on unmount
useEffect(() => {
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

---

## 🧪 Testing Checklist

- [x] Can select multiple tests
- [x] Can search and filter tests
- [x] Can remove individual tests via badge
- [x] Can clear all selections
- [x] Price calculation updates in real-time
- [x] Validation prevents submission without tests
- [x] Success message shows correct test count
- [x] Junction table records created properly
- [x] RLS policies work correctly
- [x] Migration preserves existing data
- [x] Dropdown closes on outside click
- [x] Search auto-focuses when opened
- [x] Button shows test count
- [x] Itemized price breakdown displays
- [x] Build completes successfully

---

## 📖 Usage Examples

### Example 1: Complete Blood Count Panel

**Selected Tests:**
- Hémogramme Complet (CBC) - $25
- Numération Plaquettaire (PLT) - $15

**Total:** $40
**Button:** "Créer la Demande (2 tests)"
**Success:** "Demande créée avec succès: 2 tests prescrits"

### Example 2: Liver Function Panel

**Selected Tests:**
- Gamma GT (GGT) - $30
- ASAT (SGOT) - $25
- ALAT (SGPT) - $25
- Bilirubine Totale (TBIL) - $20

**Total:** $100
**Button:** "Créer la Demande (4 tests)"
**Success:** "Demande créée avec succès: 4 tests prescrits"

### Example 3: Diabetes Screening

**Selected Tests:**
- Glycémie à Jeun (FBG) - $12
- HbA1c - $35

**Total:** $47
**Button:** "Créer la Demande (2 tests)"
**Success:** "Demande créée avec succès: 2 tests prescrits"

---

## 🔧 Troubleshooting

### Issue: Tests not appearing in dropdown

**Check:**
- `lab_tests` table has records with `is_active = true`
- User has permissions to view tests
- Network connection is stable

**Solution:**
```sql
SELECT COUNT(*) FROM lab_tests WHERE is_active = true;
-- Should return > 0
```

### Issue: Price not calculating

**Check:**
- Test records have `price` field populated
- Selected tests are in the `tests` state array

**Debug:**
```typescript
console.log('Selected Tests:', selectedTests);
console.log('Total Price:', totalPrice);
```

### Issue: Junction table inserts failing

**Check:**
- Order was created successfully (has ID)
- Test IDs are valid UUIDs
- RLS policies allow inserts

**Solution:**
- Verify `lab_order_tests` RLS policies
- Check user role has medical staff permissions

---

## 🎓 Developer Notes

### Reusing MultiSelectWithSearch

The component is generic and can be reused:

```typescript
// Example: Multi-select for medications
<MultiSelectWithSearch
  options={medications.map(med => ({
    id: med.id,
    label: med.name,
    description: med.dosage,
    metadata: med.manufacturer
  }))}
  selectedIds={selectedMedIds}
  onChange={setSelectedMedIds}
  placeholder="Sélectionner des médicaments"
  searchPlaceholder="Rechercher un médicament..."
/>
```

### Future Enhancements

1. **Grouped Tests**: Add category grouping in dropdown
2. **Presets**: Save common test combinations
3. **Favorites**: Mark frequently used tests
4. **Keyboard Shortcuts**: Add hotkeys for common actions
5. **Drag & Drop**: Reorder selected tests
6. **Export**: Generate test requisition PDF
7. **Templates**: Load predefined test panels

---

## 📊 Database Schema Reference

### lab_orders Table (unchanged for backward compatibility)
- Still has `test_id` column (nullable)
- New orders don't populate this field
- Legacy orders maintain their single test reference

### lab_order_tests Table (NEW)
- Modern approach for multi-test support
- One row per test in an order
- Supports individual test results
- Better data normalization

### Relationship Diagram

```
lab_orders (1) ←→ (many) lab_order_tests (many) ←→ (1) lab_tests
    ↓                        ↓                           ↓
  Main order           Test associations            Test catalog
```

---

## ✅ Implementation Summary

### What Changed

1. ✅ Database schema enhanced with junction table
2. ✅ New multi-select UI component created
3. ✅ Form updated to handle multiple test selections
4. ✅ Price calculation implemented
5. ✅ Validation updated for array of tests
6. ✅ Success notifications improved
7. ✅ Search functionality added
8. ✅ Badge-based selection display
9. ✅ RLS policies configured
10. ✅ Data migration completed

### What's Maintained

- ✅ Original single-test functionality (backward compatible)
- ✅ Existing RBAC permissions
- ✅ Current user workflows
- ✅ Dashboard integration
- ✅ All existing features

### Build Status

```
✓ 2722 modules transformed
✓ built in 27.88s
```

**Status:** ✅ Production Ready

---

**Implementation Date:** 2026-02-26
**Version:** 2.0
**Migration:** `add_multi_test_support_to_lab_orders`
