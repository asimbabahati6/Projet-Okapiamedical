# Patient Registration & Department Integration System - Complete Guide

## Executive Summary

This document provides comprehensive documentation for the fully operational patient registration system with seamless department integration. The system automatically routes patients to appropriate departments based on medical needs, notifies department staff in real-time, maintains complete audit trails, and ensures HIPAA-compliant data security.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Services & APIs](#services--apis)
5. [User Interface Components](#user-interface-components)
6. [Workflow Diagrams](#workflow-diagrams)
7. [User Guides](#user-guides)
8. [Administration Guide](#administration-guide)
9. [Testing & Validation](#testing--validation)
10. [Troubleshooting](#troubleshooting)
11. [Security & Compliance](#security--compliance)

---

## System Overview

### Key Features

✅ **Intelligent Department Routing**
- Keyword-based automatic department assignment
- Multi-criteria matching (age, condition, emergency status)
- Real-time capacity checking
- Overflow routing to alternative departments

✅ **Real-Time Notifications**
- Instant alerts to department staff when patients assigned
- Multi-channel notification support (in-app, email, SMS ready)
- Priority-based notification delivery
- Escalation workflow for unacknowledged urgent notifications

✅ **Capacity Management**
- Live department capacity monitoring
- Automatic threshold alerts
- Workload distribution analytics
- Predictive capacity forecasting

✅ **Complete Audit Trail**
- All patient registration actions logged
- Department assignment history
- IP address and user agent tracking
- HIPAA-compliant audit records

✅ **Zero-Downtime Operation**
- Automatic failover mechanisms
- Offline form caching capability
- Real-time data synchronization
- Continuous availability monitoring

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     PATIENT REGISTRATION                     │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │───▶│  Department  │───▶│  Department  │  │
│  │     Form     │    │   Routing    │    │  Assignment  │  │
│  └──────────────┘    │   Service    │    └──────────────┘  │
│                      └──────────────┘                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │      DEPARTMENT INTEGRATION         │
         │                                     │
         │  ┌─────────────┐  ┌──────────────┐│
         │  │ Capacity    │  │Notification  ││
         │  │ Tracker     │  │  Service     ││
         │  └─────────────┘  └──────────────┘│
         └──────────────────┬──────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │       SUPABASE DATABASE              │
         │                                      │
         │  • patient_registrations             │
         │  • department_routing_rules          │
         │  • department_capacity_config        │
         │  • patient_assignment_notifications  │
         │  • patient_registration_audit_log    │
         └──────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS
- **Real-time**: Supabase Realtime subscriptions
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

---

## Database Schema

### Core Tables

#### 1. `department_routing_rules`
Stores keyword-based rules for automatic department assignment.

```sql
CREATE TABLE department_routing_rules (
  id UUID PRIMARY KEY,
  keyword TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  priority INTEGER DEFAULT 10,
  condition_category TEXT,
  is_emergency BOOLEAN DEFAULT false,
  age_min INTEGER,
  age_max INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Usage**: When a patient registers with "douleur thoracique" as consultation reason, the system matches the keyword and routes to Cardiology department.

#### 2. `department_capacity_config`
Configuration for each department's capacity and overflow management.

```sql
CREATE TABLE department_capacity_config (
  department_id UUID PRIMARY KEY,
  max_patients_per_day INTEGER DEFAULT 50,
  max_queue_length INTEGER DEFAULT 20,
  alert_threshold_percentage INTEGER DEFAULT 80,
  auto_route_overflow BOOLEAN DEFAULT true,
  overflow_department_id UUID REFERENCES departments(id),
  business_hours_start TIME DEFAULT '08:00',
  business_hours_end TIME DEFAULT '18:00',
  is_emergency_department BOOLEAN DEFAULT false
);
```

#### 3. `department_current_status` (VIEW)
Real-time view of department capacity and workload.

**Provides**:
- Current patients today
- Pending appointments
- Available doctors count
- Capacity percentage
- Status indicator (available/moderate/high/unavailable)
- Business hours and open status

#### 4. `patient_assignment_notifications`
Tracks all notifications sent to department staff.

```sql
CREATE TABLE patient_assignment_notifications (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  department_id UUID REFERENCES departments(id),
  notification_type TEXT, -- 'new_patient', 'urgent_patient', 'transfer'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'emergency'
  sent_to_staff_ids UUID[],
  acknowledged_by UUID,
  is_read BOOLEAN DEFAULT false,
  message_title TEXT,
  message_body TEXT,
  metadata JSONB DEFAULT '{}'
);
```

#### 5. `patient_registration_audit_log`
Complete audit trail of all registration actions.

```sql
CREATE TABLE patient_registration_audit_log (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  action_type TEXT NOT NULL,
  performed_by UUID REFERENCES user_profiles(id),
  performed_by_role TEXT,
  department_before UUID,
  department_after UUID,
  ip_address INET,
  previous_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Database Functions

#### `get_recommended_department(consultation_reason, patient_age)`
Returns top 5 department recommendations based on consultation reason and patient age.

**Example Usage**:
```sql
SELECT * FROM get_recommended_department(
  'douleur thoracique sévère',
  45
);
```

**Returns**:
```
department_id | department_name | match_score | is_emergency | reason
-------------|-----------------|-------------|--------------|------------------
uuid-123     | Cardiologie     | 95          | true         | Douleur thoracique
```

#### `mark_notification_read(notification_id)`
Marks a notification as read and acknowledged by the current user.

---

## Services & APIs

### 1. Department Routing Service

**File**: `src/services/departmentRoutingService.ts`

**Key Methods**:

```typescript
// Get recommended department for a patient
async getRecommendedDepartment(routingData: PatientRoutingData): Promise<RoutingResult>

// Check if department can accept new patients
async checkDepartmentCapacity(departmentId: string): Promise<CapacityStatus>

// Route emergency patient to emergency department
async routeEmergencyPatient(patientData: PatientRoutingData): Promise<RoutingResult>

// Get all departments with current capacity status
async getAllDepartmentsWithCapacity(): Promise<DepartmentStatus[]>
```

**Example Usage**:
```typescript
import { departmentRoutingService } from './services/departmentRoutingService';

const result = await departmentRoutingService.getRecommendedDepartment({
  consultationReason: 'fracture du bras',
  age: 35,
  gender: 'male',
  isEmergency: false
});

// Result:
// {
//   success: true,
//   recommendedDepartment: {
//     departmentId: '...',
//     departmentName: 'Orthopédie',
//     matchScore: 85,
//     capacityStatus: 'available',
//     capacityPercentage: 45
//   }
// }
```

### 2. Department Capacity Service

**File**: `src/services/departmentCapacityService.ts`

**Key Methods**:

```typescript
// Get capacity status for specific department
async getDepartmentCapacity(departmentId: string): Promise<DepartmentCapacity>

// Get all capacity alerts (departments over 70% capacity)
async getCapacityAlerts(): Promise<CapacityAlert[]>

// Predict capacity for future date
async predictCapacityForDate(departmentId: string, date: Date): Promise<Prediction>

// Update department capacity configuration
async updateDepartmentCapacityConfig(departmentId: string, config: Config): Promise<boolean>
```

### 3. Patient Notification Service

**File**: `src/services/patientDepartmentNotificationService.ts`

**Key Methods**:

```typescript
// Get notifications for logged-in user
async getUserNotifications(userId: string, limit?: number): Promise<PatientNotification[]>

// Mark notification as read
async markAsRead(notificationId: string, userId: string): Promise<boolean>

// Get notification statistics
async getNotificationStats(userId: string): Promise<NotificationStats>

// Subscribe to real-time notifications
subscribeToNotifications(userId: string, callback: Function): UnsubscribeFunction
```

---

## User Interface Components

### 1. Department Capacity Dashboard

**File**: `src/components/department/DepartmentCapacityDashboard.tsx`

**Features**:
- Real-time capacity monitoring for all departments
- Color-coded status indicators (green/yellow/orange/red)
- Capacity percentage with progress bars
- Available doctors count per department
- Pending appointments count
- Business hours and open/closed status
- Automatic refresh every 60 seconds

**Screenshot Description**:
```
┌─────────────────────────────────────────────────────┐
│  DEPARTMENT CAPACITY DASHBOARD                      │
├─────────────────────────────────────────────────────┤
│  [125 Patients] [68% Avg Cap] [12 Active] [2 Full] │
├─────────────────────────────────────────────────────┤
│  ⚠️ ALERTS                                          │
│  • Cardiologie à 92% de capacité                   │
│  • Pédiatrie à 78% de capacité                     │
├─────────────────────────────────────────────────────┤
│  SERVICES                                           │
│  ✅ Cardiologie          [███████████░] 92%  (46/50)│
│  ✅ Pédiatrie            [████████░░░] 78%  (47/60)│
│  ✅ Orthopédie           [██████░░░░░] 60%  (18/30)│
│  ✅ Médecine Générale    [████░░░░░░░] 40%  (20/50)│
└─────────────────────────────────────────────────────┘
```

### 2. Department Notification Bell

**File**: `src/components/department/DepartmentNotificationBell.tsx`

**Features**:
- Real-time notification badge with unread count
- Dropdown list of recent notifications
- Priority indicators (urgent notifications highlighted in red)
- One-click mark as read
- Mark all as read functionality
- Auto-refresh when new notifications arrive
- Browser notifications support (if permission granted)

**Integration**:
Add to staff navigation bar:
```tsx
import { DepartmentNotificationBell } from './components/department/DepartmentNotificationBell';

<nav>
  {/* Other nav items */}
  <DepartmentNotificationBell />
</nav>
```

---

## Workflow Diagrams

### Patient Registration to Department Assignment Flow

```
┌─────────────────┐
│ Staff opens     │
│ Add Patient Form│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step 1: Personal│
│ Information     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step 2: Contact │
│ Details         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step 3: Emergency│
│ Contact         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step 4: Insurance│
│ & Physician     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ AUTOMATIC ROUTING       │
│ Analyze consultation    │
│ reason + patient data   │
└────────┬────────────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐ ┌──────────────────┐
│ Match keywords  │ │ Check age range  │
│ in routing rules│ │ restrictions     │
└────────┬────────┘ └────────┬─────────┘
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Get top department   │
        │ recommendations      │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Check department     │
        │ capacity             │
        └──────────┬───────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
    [Available]      [At Capacity]
          │                 │
          │                 └──▶ Use overflow
          │                     department
          │
          ▼
┌──────────────────────┐
│ Assign patient to    │
│ recommended dept     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ CREATE APPOINTMENT   │
│ with department      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ TRIGGER NOTIFICATION │
│ to department staff  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Staff receives       │
│ notification bell    │
│ alert + details      │
└──────────────────────┘
```

### Notification Escalation Workflow

```
┌─────────────────┐
│ Patient assigned│
│ to department   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Notification created│
│ Priority determined │
└────────┬────────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
   [Normal]          [High/Emergency]
         │                 │
         │                 ▼
         │        ┌──────────────────┐
         │        │ Notify ALL staff │
         │        │ in department    │
         │        │ immediately      │
         │        └────────┬─────────┘
         │                 │
         └────────┬────────┘
                  │
                  ▼
       ┌──────────────────┐
       │ Wait 15 minutes  │
       └──────────┬───────┘
                  │
       ┌──────────┴──────────┐
       │                     │
       ▼                     ▼
  [Acknowledged]      [Not acknowledged]
       │                     │
       │                     ▼
       │          ┌──────────────────┐
       │          │ Escalate to      │
       │          │ department head  │
       │          └──────────┬───────┘
       │                     │
       │                     ▼
       │          ┌──────────────────┐
       │          │ Wait 15 minutes  │
       │          └──────────┬───────┘
       │                     │
       │          ┌──────────┴──────────┐
       │          │                     │
       │          ▼                     ▼
       │     [Acknowledged]      [Still not ack]
       │                              │
       │                              ▼
       │                   ┌──────────────────┐
       │                   │ Escalate to      │
       │                   │ admin team       │
       │                   └──────────────────┘
       │
       ▼
┌─────────────────┐
│ Mark complete   │
│ Log in audit    │
└─────────────────┘
```

---

## User Guides

### For Reception/Registration Staff

#### Adding a New Patient

1. **Access the System**
   - Log in with your receptionist credentials
   - Navigate to "Gestion des Patients" → "Ajouter un Patient"

2. **Complete the 4-Step Form**

   **Step 1: Informations Personnelles**
   - Enter first name, last name
   - Select date of birth
   - Choose gender
   - Optional: blood group
   - Optional: upload patient photo

   **Step 2: Coordonnées**
   - Enter phone number (required)
   - Enter email address (required)
   - Enter full address
   - Enter city

   **Step 3: Contact d'Urgence**
   - Enter emergency contact name
   - Enter emergency contact phone
   - Specify relationship

   **Step 4: Assurance & Médecin**
   - Enter insurance provider (if applicable)
   - Enter insurance policy number
   - Select preferred physician (or leave blank for auto-assignment)

3. **Automatic Department Assignment**
   - System automatically analyzes the consultation reason
   - Recommended department is shown with capacity status
   - You can override if needed

4. **Submit**
   - Click "Enregistrer"
   - Confirmation message appears
   - Patient is immediately visible in the system
   - Department receives notification

#### Understanding Department Capacity Indicators

- **🟢 Green (Disponible)**: 0-50% capacity - Optimal time to schedule
- **🟡 Yellow (Modéré)**: 50-80% capacity - Still accepting patients
- **🟠 Orange (Élevé)**: 80-90% capacity - Near capacity, consider alternatives
- **🔴 Red (Pleine)**: 90-100% capacity - At capacity, will auto-route to overflow

### For Department Staff (Doctors, Nurses)

#### Viewing Your Notifications

1. **Notification Bell Icon**
   - Located in top-right corner of navigation bar
   - Shows badge with unread count
   - Click to open notifications dropdown

2. **Notification Details**
   - Title: Brief description of the notification
   - Message: Full details (patient name, reason, etc.)
   - Priority: Visual indicator (red for urgent, blue for normal)
   - Time: When the notification was sent
   - Department: Which department the patient was assigned to

3. **Acknowledging Notifications**
   - Click the ✓ icon to mark as read
   - Click "Tout marquer comme lu" to mark all as read
   - Read notifications move to bottom of list

#### Checking Department Capacity

1. **Access Dashboard**
   - Navigate to "Tableau de Bord" → "Capacité des Services"

2. **View Real-Time Status**
   - Current patients today
   - Pending appointments
   - Available doctors
   - Capacity percentage
   - Open/closed status

3. **Understanding Alerts**
   - Red alerts: Department at or above 90% capacity
   - Orange alerts: Department at 70-89% capacity
   - Take action to manage patient flow

---

## Administration Guide

### Configuring Department Routing Rules

**Audience**: System administrators

#### Adding New Routing Rules

```sql
-- Example: Add routing rule for dental problems
INSERT INTO department_routing_rules (
  keyword,
  department_id,
  priority,
  condition_category,
  is_emergency,
  description
) VALUES (
  'mal de dents',
  (SELECT id FROM departments WHERE name ILIKE '%dentist%' LIMIT 1),
  80,
  'dental',
  false,
  'Douleur dentaire'
);
```

#### Updating Department Capacity Limits

```sql
-- Increase Cardiology capacity to 60 patients per day
UPDATE department_capacity_config
SET max_patients_per_day = 60,
    alert_threshold_percentage = 85
WHERE department_id = (
  SELECT id FROM departments WHERE name ILIKE '%cardio%' LIMIT 1
);
```

#### Configuring Notification Settings

```sql
-- Set quiet hours for Pediatrics (no notifications 8pm-8am)
UPDATE department_notification_settings
SET quiet_hours_start = '20:00',
    quiet_hours_end = '08:00',
    notify_roles = ARRAY['doctor', 'nurse', 'department_head']
WHERE department_id = (
  SELECT id FROM departments WHERE name ILIKE '%pédiatrie%' LIMIT 1
);
```

### Monitoring System Health

#### Check Routing Performance

```sql
-- See most used routing rules
SELECT
  drr.keyword,
  d.name as department_name,
  COUNT(*) as usage_count
FROM patient_assignment_notifications pan
JOIN department_routing_rules drr ON pan.metadata->>'rule_id' = drr.id::text
JOIN departments d ON drr.department_id = d.id
WHERE pan.created_at > NOW() - INTERVAL '30 days'
GROUP BY drr.keyword, d.name
ORDER BY usage_count DESC
LIMIT 20;
```

#### Audit Log Review

```sql
-- View recent patient assignment changes
SELECT
  pral.action_type,
  pral.performed_by_role,
  d1.name as old_department,
  d2.name as new_department,
  pral.reason,
  pral.created_at
FROM patient_registration_audit_log pral
LEFT JOIN departments d1 ON pral.department_before = d1.id
LEFT JOIN departments d2 ON pral.department_after = d2.id
WHERE pral.action_type IN ('department_changed', 'reassigned')
ORDER BY pral.created_at DESC
LIMIT 50;
```

---

## Testing & Validation

### Unit Testing

Test files location: `src/services/__tests__/`

Run tests:
```bash
npm test
```

### Integration Testing

#### Test Department Routing

```typescript
// Test automatic routing for cardiac emergency
const result = await departmentRoutingService.getRecommendedDepartment({
  consultationReason: 'douleur thoracique aiguë',
  age: 55,
  isEmergency: true
});

expect(result.success).toBe(true);
expect(result.recommendedDepartment.isEmergency).toBe(true);
expect(result.recommendedDepartment.departmentName).toContain('Cardio');
```

#### Test Capacity Management

```typescript
// Test capacity alert generation
const alerts = await departmentCapacityService.getCapacityAlerts();
const highCapacityDepts = alerts.filter(a => a.priority === 'high');

expect(highCapacityDepts.length).toBeGreaterThan(0);
expect(highCapacityDepts[0].currentPercentage).toBeGreaterThan(80);
```

### Manual Testing Checklist

- [ ] Register new patient with various consultation reasons
- [ ] Verify correct department assignment for each reason
- [ ] Confirm department staff receive notifications
- [ ] Test notification acknowledgment workflow
- [ ] Check capacity dashboard updates in real-time
- [ ] Verify audit log captures all actions
- [ ] Test with department at capacity (overflow routing)
- [ ] Confirm emergency patients route correctly
- [ ] Test quiet hours notification suppression
- [ ] Verify RLS policies (users can only see appropriate data)

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: Notifications Not Appearing

**Symptoms**: Staff not receiving notifications when patients assigned

**Diagnosis**:
1. Check notification settings for department
2. Verify staff user is in correct department
3. Check if quiet hours are active

**Solution**:
```sql
-- Verify notification settings
SELECT * FROM department_notification_settings
WHERE department_id = 'your-dept-id';

-- Check user's department assignment
SELECT up.full_name, d.name as department
FROM user_profiles up
JOIN departments d ON up.department_id = d.id
WHERE up.id = 'user-id';

-- Ensure notifications enabled
UPDATE department_notification_settings
SET notify_on_new_patient = true
WHERE department_id = 'your-dept-id';
```

#### Issue: Department Routing Not Working

**Symptoms**: All patients assigned to default department

**Diagnosis**:
1. Check if routing rules exist and are active
2. Verify keywords match consultation reasons
3. Check RLS policies allow access

**Solution**:
```sql
-- Check active routing rules
SELECT keyword, d.name, priority, is_active
FROM department_routing_rules drr
JOIN departments d ON drr.department_id = d.id
WHERE is_active = true
ORDER BY priority DESC;

-- If no rules, seed default rules
-- (Run the routing rules migration again)
```

#### Issue: Capacity Status Not Updating

**Symptoms**: Dashboard shows stale capacity data

**Diagnosis**:
1. View is not refreshing
2. Database connection issue
3. Appointment data not being tracked correctly

**Solution**:
```typescript
// Force refresh in component
await departmentCapacityService.refreshCapacityData();

// Or refresh the view in database
await supabase.rpc('refresh_views');
```

---

## Security & Compliance

### HIPAA Compliance

The system implements multiple layers of security to ensure HIPAA compliance:

1. **Data Encryption**
   - All patient data encrypted at rest (Supabase encryption)
   - TLS 1.3 encryption in transit
   - Encrypted backups

2. **Access Control**
   - Row Level Security (RLS) enforced on all tables
   - Role-based access control (RBAC)
   - Audit logging of all access

3. **Audit Trail**
   - Complete audit log of all patient data access
   - IP address and user agent tracking
   - Immutable audit records
   - 7-year retention policy

4. **Data Minimization**
   - Only necessary staff receive notifications
   - Department-based data segregation
   - Automatic session timeout

### Row Level Security (RLS) Policies

**Notifications**:
```sql
-- Staff can only view notifications sent to them
CREATE POLICY "Staff can view own department notifications"
  ON patient_assignment_notifications
  FOR SELECT
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM user_profiles WHERE id = auth.uid()
    )
    OR auth.uid() = ANY(sent_to_staff_ids)
  );
```

**Audit Logs**:
```sql
-- Only admin can view audit logs
CREATE POLICY "Admin can view audit logs"
  ON patient_registration_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'administrative_staff')
    )
  );
```

### Backup & Recovery

**Automated Backups**:
- Hourly incremental backups
- Daily full backups
- 30-day retention
- Cross-region replication

**Recovery Procedures**:
1. Point-in-time recovery available for last 7 days
2. Full restoration from backup within 15 minutes
3. Data integrity verification on all restores

**Disaster Recovery Plan**:
- RTO (Recovery Time Objective): 15 minutes
- RPO (Recovery Point Objective): 1 hour
- Failover to secondary region: Automatic

---

## Performance Metrics

### Target SLAs

- **System Uptime**: 99.9%
- **Registration Completion Time**: < 3 minutes
- **Notification Delivery**: < 30 seconds
- **Department Acknowledgment**: < 15 minutes
- **Capacity Data Refresh**: < 1 minute

### Monitoring Dashboard

Access at: `/admin/monitoring`

**Key Metrics**:
- Requests per minute
- Average response time
- Error rate
- Database connection pool usage
- Storage usage

---

## Appendix

### Glossary

- **RLS**: Row Level Security - Database security feature restricting data access
- **Routing Rules**: Keywords and criteria for automatic department assignment
- **Capacity Status**: Current workload level of a department
- **Overflow Department**: Backup department when primary is at capacity
- **Audit Log**: Complete history of all system actions
- **Acknowledgment**: Confirmation by staff that notification was received

### Support Contacts

- **Technical Support**: support@hospital.com
- **Emergency IT**: +243 XXX XXX XXX
- **System Administrator**: admin@hospital.com

### Change Log

**Version 1.0.0** (2024-02-13)
- Initial release
- Department routing system
- Real-time notifications
- Capacity management
- Complete audit trail

---

**Document Version**: 1.0.0
**Last Updated**: February 13, 2024
**Author**: Healthcare System Development Team
**Classification**: Internal Use Only
