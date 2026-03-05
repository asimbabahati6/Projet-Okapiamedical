/*
  # Create Doctor Analytics Materialized Views
  
  1. Materialized Views
    - mv_doctor_performance_metrics - Performance KPIs per doctor
    - mv_doctor_availability_summary - Availability stats
    - mv_doctor_workload_summary - Workload metrics
    - mv_doctor_revenue_summary - Revenue statistics
    - mv_replacement_summary - Current and upcoming replacements
  
  2. Regular Views
    - v_doctors_with_specialties - Doctors with their specialties
    - v_doctors_availability_today - Today's availability
    - v_doctor_statistics - Comprehensive doctor stats
*/

-- Materialized View: Doctor Performance Metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_doctor_performance_metrics AS
SELECT 
  ms.id as doctor_id,
  up.full_name,
  ms.specialization,
  ms.staff_type,
  COUNT(DISTINCT c.id) as total_consultations_completed,
  COUNT(DISTINCT c.patient_id) as unique_patients_seen,
  AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at))/60)::integer as avg_consultation_duration_minutes,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') as completed_appointments,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'cancelled') as cancelled_appointments,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'no_show') as no_show_appointments,
  (COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::numeric / 
   NULLIF(COUNT(DISTINCT a.id), 0) * 100)::numeric(5,2) as completion_rate_percent,
  SUM(ca.total_price)::numeric as total_revenue_generated,
  COUNT(DISTINCT ca.id) as total_acts_performed,
  ms.is_accepting_patients,
  ms.current_status,
  ms.professional_insurance_expiry,
  ms.average_rating,
  ms.total_ratings,
  CURRENT_DATE as last_refreshed
FROM medical_staff ms
JOIN user_profiles up ON up.id = ms.id
LEFT JOIN consultations c ON c.doctor_id = ms.id
LEFT JOIN appointments a ON a.doctor_id = ms.id
LEFT JOIN consultation_acts ca ON ca.doctor_id = ms.id
WHERE ms.staff_type = 'medecin'
GROUP BY ms.id, up.full_name, ms.specialization, ms.staff_type, 
  ms.is_accepting_patients, ms.current_status, ms.professional_insurance_expiry,
  ms.average_rating, ms.total_ratings;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_doctor_performance_doctor_id 
  ON mv_doctor_performance_metrics(doctor_id);
CREATE INDEX IF NOT EXISTS idx_mv_doctor_performance_rating 
  ON mv_doctor_performance_metrics(average_rating DESC) WHERE average_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mv_doctor_performance_revenue 
  ON mv_doctor_performance_metrics(total_revenue_generated DESC) WHERE total_revenue_generated > 0;

-- Materialized View: Doctor Availability Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_doctor_availability_summary AS
SELECT 
  ms.id as doctor_id,
  up.full_name,
  ms.specialization,
  COUNT(dac.id) FILTER (WHERE dac.is_available = true AND dac.date >= CURRENT_DATE) as available_days_next_30,
  COUNT(dac.id) FILTER (WHERE dac.is_available = false AND dac.date >= CURRENT_DATE) as unavailable_days_next_30,
  MIN(dac.date) FILTER (WHERE dac.is_available = true AND dac.date >= CURRENT_DATE) as next_available_date,
  COUNT(DISTINCT a.id) FILTER (WHERE a.appointment_date = CURRENT_DATE) as today_appointments,
  ms.max_daily_appointments,
  ((COUNT(DISTINCT a.id) FILTER (WHERE a.appointment_date = CURRENT_DATE))::numeric / 
   NULLIF(ms.max_daily_appointments, 0) * 100)::numeric(5,2) as today_capacity_utilization,
  ms.current_status,
  ms.emergency_availability,
  ms.accepts_walk_ins,
  ms.telemedicine_enabled,
  CURRENT_DATE as last_refreshed
FROM medical_staff ms
JOIN user_profiles up ON up.id = ms.id
LEFT JOIN doctor_availability_calendar dac ON dac.doctor_id = ms.id 
  AND dac.date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
LEFT JOIN appointments a ON a.doctor_id = ms.id 
  AND a.appointment_date = CURRENT_DATE
  AND a.status NOT IN ('cancelled', 'no_show')
WHERE ms.staff_type = 'medecin'
GROUP BY ms.id, up.full_name, ms.specialization, ms.max_daily_appointments,
  ms.current_status, ms.emergency_availability, ms.accepts_walk_ins, ms.telemedicine_enabled;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_doctor_availability_doctor_id 
  ON mv_doctor_availability_summary(doctor_id);
CREATE INDEX IF NOT EXISTS idx_mv_doctor_availability_next_date 
  ON mv_doctor_availability_summary(next_available_date) WHERE next_available_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mv_doctor_availability_status 
  ON mv_doctor_availability_summary(current_status);

-- Materialized View: Doctor Workload Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_doctor_workload_summary AS
SELECT 
  ms.id as doctor_id,
  up.full_name,
  ms.specialization,
  COUNT(a.id) FILTER (WHERE a.appointment_date BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE) as appointments_last_7_days,
  COUNT(a.id) FILTER (WHERE a.appointment_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE) as appointments_last_30_days,
  COUNT(a.id) FILTER (WHERE a.appointment_date >= CURRENT_DATE) as upcoming_appointments,
  (COUNT(a.id) FILTER (WHERE a.appointment_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE)::numeric / 30)::numeric(5,2) as avg_daily_appointments_last_month,
  ms.max_daily_appointments,
  ((COUNT(a.id) FILTER (WHERE a.appointment_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE)::numeric / 30) / 
   NULLIF(ms.max_daily_appointments, 0) * 100)::numeric(5,2) as avg_capacity_utilization_percent,
  ms.current_patient_load,
  ms.average_consultation_duration,
  CURRENT_DATE as last_refreshed
FROM medical_staff ms
JOIN user_profiles up ON up.id = ms.id
LEFT JOIN appointments a ON a.doctor_id = ms.id AND a.status NOT IN ('cancelled', 'no_show')
WHERE ms.staff_type = 'medecin'
GROUP BY ms.id, up.full_name, ms.specialization, ms.max_daily_appointments, 
  ms.current_patient_load, ms.average_consultation_duration;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_doctor_workload_doctor_id 
  ON mv_doctor_workload_summary(doctor_id);
CREATE INDEX IF NOT EXISTS idx_mv_doctor_workload_utilization 
  ON mv_doctor_workload_summary(avg_capacity_utilization_percent DESC) WHERE avg_capacity_utilization_percent > 0;

-- Materialized View: Doctor Revenue Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_doctor_revenue_summary AS
SELECT 
  ms.id as doctor_id,
  up.full_name,
  ms.specialization,
  ms.billing_sector,
  SUM(ca.total_price) FILTER (WHERE ca.performed_at >= CURRENT_DATE - INTERVAL '30 days')::numeric as revenue_last_30_days,
  SUM(ca.total_price) FILTER (WHERE ca.performed_at >= CURRENT_DATE - INTERVAL '7 days')::numeric as revenue_last_7_days,
  SUM(ca.total_price) FILTER (WHERE ca.performed_at::date = CURRENT_DATE)::numeric as revenue_today,
  COUNT(ca.id) FILTER (WHERE ca.performed_at >= CURRENT_DATE - INTERVAL '30 days') as acts_last_30_days,
  AVG(ca.total_price) FILTER (WHERE ca.performed_at >= CURRENT_DATE - INTERVAL '30 days')::numeric(10,2) as avg_act_price_last_30_days,
  SUM(ca.patient_share) FILTER (WHERE ca.performed_at >= CURRENT_DATE - INTERVAL '30 days')::numeric as patient_revenue_last_30_days,
  SUM(ca.insurance_share) FILTER (WHERE ca.performed_at >= CURRENT_DATE - INTERVAL '30 days')::numeric as insurance_revenue_last_30_days,
  (SUM(ca.insurance_share) FILTER (WHERE ca.performed_at >= CURRENT_DATE - INTERVAL '30 days')::numeric / 
   NULLIF(SUM(ca.total_price) FILTER (WHERE ca.performed_at >= CURRENT_DATE - INTERVAL '30 days'), 0) * 100)::numeric(5,2) as insurance_coverage_rate_percent,
  ms.consultation_fee,
  ms.practice_mode,
  CURRENT_DATE as last_refreshed
FROM medical_staff ms
JOIN user_profiles up ON up.id = ms.id
LEFT JOIN consultation_acts ca ON ca.doctor_id = ms.id
WHERE ms.staff_type = 'medecin'
GROUP BY ms.id, up.full_name, ms.specialization, ms.billing_sector, 
  ms.consultation_fee, ms.practice_mode;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_doctor_revenue_doctor_id 
  ON mv_doctor_revenue_summary(doctor_id);
CREATE INDEX IF NOT EXISTS idx_mv_doctor_revenue_last_30 
  ON mv_doctor_revenue_summary(revenue_last_30_days DESC) WHERE revenue_last_30_days > 0;

-- Materialized View: Replacement Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_replacement_summary AS
SELECT 
  dr.id as replacement_id,
  dr.original_doctor_id,
  up1.full_name as original_doctor_name,
  dr.replacement_doctor_id,
  up2.full_name as replacement_doctor_name,
  dr.start_date,
  dr.end_date,
  dr.replacement_type,
  dr.status,
  dr.affected_appointments_count,
  dr.patients_notified_count,
  COUNT(rat.id) as transferred_appointments,
  COUNT(rn.id) as notifications_sent,
  COUNT(rn.id) FILTER (WHERE rn.delivery_status = 'delivered') as notifications_delivered,
  COUNT(rn.id) FILTER (WHERE rn.patient_response = 'accepted') as patients_accepted,
  CURRENT_DATE as last_refreshed
FROM doctor_replacements dr
JOIN user_profiles up1 ON up1.id = dr.original_doctor_id
LEFT JOIN user_profiles up2 ON up2.id = dr.replacement_doctor_id
LEFT JOIN replacement_appointment_transfers rat ON rat.replacement_id = dr.id
LEFT JOIN replacement_notifications rn ON rn.replacement_id = dr.id
WHERE dr.status IN ('pending', 'approved', 'active')
  OR dr.end_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY dr.id, dr.original_doctor_id, up1.full_name, dr.replacement_doctor_id, 
  up2.full_name, dr.start_date, dr.end_date, dr.replacement_type, dr.status,
  dr.affected_appointments_count, dr.patients_notified_count;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_replacement_id 
  ON mv_replacement_summary(replacement_id);
CREATE INDEX IF NOT EXISTS idx_mv_replacement_doctor 
  ON mv_replacement_summary(original_doctor_id);
CREATE INDEX IF NOT EXISTS idx_mv_replacement_dates 
  ON mv_replacement_summary(start_date, end_date);

-- Regular View: Doctors with Specialties
CREATE OR REPLACE VIEW v_doctors_with_specialties AS
SELECT 
  ms.id,
  up.full_name,
  ms.staff_type,
  ms.specialization as primary_specialization,
  ARRAY_AGG(
    DISTINCT jsonb_build_object(
      'specialty_id', msp.id,
      'specialty_name_fr', msp.name_fr,
      'specialty_name_en', msp.name_en,
      'is_primary', ds.is_primary_specialty,
      'competence_level', ds.competence_level,
      'years_practicing', ds.years_practicing
    )
  ) FILTER (WHERE msp.id IS NOT NULL) as specialties,
  ms.is_accepting_patients,
  ms.telemedicine_enabled,
  ms.average_rating,
  ms.total_ratings,
  ms.consultation_fee,
  ms.current_status
FROM medical_staff ms
JOIN user_profiles up ON up.id = ms.id
LEFT JOIN doctor_specialties ds ON ds.doctor_id = ms.id AND ds.is_active = true
LEFT JOIN medical_specialties msp ON msp.id = ds.specialty_id
WHERE ms.staff_type = 'medecin'
GROUP BY ms.id, up.full_name, ms.staff_type, ms.specialization, 
  ms.is_accepting_patients, ms.telemedicine_enabled, ms.average_rating,
  ms.total_ratings, ms.consultation_fee, ms.current_status;

-- Regular View: Today's Doctor Availability
CREATE OR REPLACE VIEW v_doctors_availability_today AS
SELECT 
  ms.id as doctor_id,
  up.full_name,
  ms.specialization,
  COALESCE(dac.is_available, false) as is_available,
  dac.available_from,
  dac.available_until,
  dac.location,
  COALESCE(dac.capacity_percentage, 100) as capacity_percentage,
  COUNT(a.id) as appointments_today,
  ms.max_daily_appointments,
  GREATEST(0, ms.max_daily_appointments - COUNT(a.id)::integer) as available_slots,
  ((COUNT(a.id)::numeric / NULLIF(ms.max_daily_appointments, 0)) * 100)::numeric(5,2) as utilization_percent,
  ms.current_status,
  ms.emergency_availability,
  ms.accepts_walk_ins,
  ms.telemedicine_enabled
FROM medical_staff ms
JOIN user_profiles up ON up.id = ms.id
LEFT JOIN doctor_availability_calendar dac ON dac.doctor_id = ms.id AND dac.date = CURRENT_DATE
LEFT JOIN appointments a ON a.doctor_id = ms.id 
  AND a.appointment_date = CURRENT_DATE
  AND a.status NOT IN ('cancelled', 'no_show')
WHERE ms.staff_type = 'medecin'
GROUP BY ms.id, up.full_name, ms.specialization, dac.is_available, 
  dac.available_from, dac.available_until, dac.location, dac.capacity_percentage,
  ms.max_daily_appointments, ms.current_status, ms.emergency_availability,
  ms.accepts_walk_ins, ms.telemedicine_enabled;

-- Regular View: Comprehensive Doctor Statistics
CREATE OR REPLACE VIEW v_doctor_statistics AS
SELECT 
  ms.id,
  up.full_name,
  ms.staff_type,
  ms.specialization,
  ms.rpps_number,
  ms.practice_mode,
  ms.billing_sector,
  ms.is_accepting_patients,
  ms.current_status,
  ms.average_rating,
  ms.total_ratings,
  ms.total_consultations,
  ms.total_patients,
  ms.consultation_fee,
  ms.professional_insurance_expiry,
  (ms.professional_insurance_expiry IS NOT NULL AND ms.professional_insurance_expiry >= CURRENT_DATE) as insurance_valid,
  ms.telemedicine_enabled,
  ms.emergency_availability,
  ms.current_patient_load,
  ms.max_daily_appointments,
  ARRAY_LENGTH(ms.languages_spoken, 1) as languages_count,
  ms.created_at as joined_date,
  (CURRENT_DATE - ms.created_at::date) as days_since_joined
FROM medical_staff ms
JOIN user_profiles up ON up.id = ms.id
WHERE ms.staff_type = 'medecin';

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_doctor_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_doctor_performance_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_doctor_availability_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_doctor_workload_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_doctor_revenue_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_replacement_summary;
END;
$$ LANGUAGE plpgsql;
