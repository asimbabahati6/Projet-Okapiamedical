# Documentation Complète - Module de Gestion du Transport

## Vue d'ensemble

Le Module de Gestion du Transport est un système complet conçu pour gérer l'ensemble de la flotte de véhicules d'un établissement hospitalier, incluant les ambulances, les véhicules administratifs, et tout le personnel de conduite. Ce module permet un suivi en temps réel des véhicules, la gestion des missions de transport, le suivi GPS, la gestion du carburant, et la planification de la maintenance.

### Objectifs Principaux

1. **Gestion de la Flotte**: Suivi complet de tous les véhicules avec leur statut, documentation et historique
2. **Gestion des Missions**: Planification et suivi des missions de transport (patients, matériel, urgences)
3. **Suivi GPS**: Localisation en temps réel des véhicules et historique des trajets
4. **Gestion du Carburant**: Enregistrement des pleins, calcul de consommation, contrôle des coûts
5. **Maintenance**: Planification préventive et suivi des réparations
6. **Gestion des Conducteurs**: Attribution des missions, suivi des heures, gestion des permissions

---

## Architecture de la Base de Données

### Tables Principales

#### 1. `vehicles` - Gestion des Véhicules

Stocke toutes les informations relatives aux véhicules de la flotte.

```sql
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text UNIQUE NOT NULL,
  vehicle_type vehicle_type_enum NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  registration_plate text UNIQUE NOT NULL,
  vin_number text UNIQUE,
  status vehicle_status_enum DEFAULT 'disponible',
  capacity_persons integer,
  capacity_weight_kg numeric(10, 2),
  purchase_date date,
  purchase_price numeric(12, 2),
  current_mileage_km numeric(10, 2) DEFAULT 0,
  last_service_date date,
  next_service_due_km numeric(10, 2),
  insurance_policy_number text,
  insurance_expiry_date date,
  registration_expiry_date date,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Types de véhicules** (`vehicle_type_enum`):
- `ambulance_urgence`: Ambulances d'urgence (SMUR)
- `ambulance_standard`: Ambulances standards pour transports programmés
- `voiture_service`: Véhicules de service pour le personnel
- `camionnette`: Camionnettes pour transport de matériel
- `moto`: Motos pour liaisons rapides

**Statuts des véhicules** (`vehicle_status_enum`):
- `disponible`: Prêt à être utilisé
- `en_mission`: Actuellement en mission
- `en_maintenance`: En réparation ou maintenance
- `hors_service`: Temporairement non utilisable
- `retire`: Retiré de la flotte

**Exemples d'utilisation**:

```sql
-- Lister tous les véhicules disponibles
SELECT
  vehicle_number,
  vehicle_type,
  make,
  model,
  current_mileage_km,
  status
FROM vehicles
WHERE is_active = true
  AND status = 'disponible'
ORDER BY vehicle_type, vehicle_number;

-- Véhicules nécessitant une maintenance prochaine
SELECT
  vehicle_number,
  make,
  model,
  current_mileage_km,
  next_service_due_km,
  (next_service_due_km - current_mileage_km) as km_avant_maintenance
FROM vehicles
WHERE is_active = true
  AND next_service_due_km IS NOT NULL
  AND current_mileage_km >= (next_service_due_km - 500)
ORDER BY km_avant_maintenance;

-- Véhicules avec documents expirant dans 30 jours
SELECT
  vehicle_number,
  'Assurance' as document_type,
  insurance_expiry_date as expiry_date
FROM vehicles
WHERE insurance_expiry_date <= CURRENT_DATE + interval '30 days'
  AND insurance_expiry_date >= CURRENT_DATE
UNION ALL
SELECT
  vehicle_number,
  'Carte grise' as document_type,
  registration_expiry_date
FROM vehicles
WHERE registration_expiry_date <= CURRENT_DATE + interval '30 days'
  AND registration_expiry_date >= CURRENT_DATE
ORDER BY expiry_date;
```

#### 2. `drivers` - Gestion des Conducteurs

Gère les informations des conducteurs et leurs permissions de conduite.

```sql
CREATE TABLE drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  license_number text UNIQUE NOT NULL,
  license_type driver_license_type_enum NOT NULL,
  license_expiry_date date NOT NULL,
  medical_certificate_expiry_date date,
  phone_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  is_available boolean DEFAULT true,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Types de permis** (`driver_license_type_enum`):
- `permis_b`: Permis B (voitures)
- `permis_d`: Permis D (transport de personnes)
- `permis_ambulance`: Permis ambulance (DEA)
- `permis_moto`: Permis moto

**Exemples d'utilisation**:

```sql
-- Conducteurs disponibles avec permis ambulance
SELECT
  d.employee_number,
  d.first_name,
  d.last_name,
  d.license_type,
  d.license_expiry_date
FROM drivers d
WHERE d.is_active = true
  AND d.is_available = true
  AND d.license_type IN ('permis_ambulance', 'permis_d')
  AND d.license_expiry_date > CURRENT_DATE
ORDER BY d.last_name, d.first_name;

-- Alertes permis expirant dans 60 jours
SELECT
  employee_number,
  first_name,
  last_name,
  license_number,
  license_expiry_date,
  (license_expiry_date - CURRENT_DATE) as jours_restants
FROM drivers
WHERE is_active = true
  AND license_expiry_date <= CURRENT_DATE + interval '60 days'
  AND license_expiry_date >= CURRENT_DATE
ORDER BY license_expiry_date;

-- Statistiques par type de permis
SELECT
  license_type,
  COUNT(*) as nombre_conducteurs,
  SUM(CASE WHEN is_available THEN 1 ELSE 0 END) as disponibles,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as actifs
FROM drivers
GROUP BY license_type
ORDER BY license_type;
```

#### 3. `transport_missions` - Gestion des Missions

Enregistre toutes les missions de transport avec leur statut et détails.

```sql
CREATE TABLE transport_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_number text UNIQUE NOT NULL DEFAULT generate_mission_number(),
  mission_type mission_type_enum NOT NULL,
  priority mission_priority_enum DEFAULT 'normale',
  status mission_status_enum DEFAULT 'planifiee',
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  pickup_location text NOT NULL,
  pickup_address text,
  pickup_coordinates point,
  destination_location text NOT NULL,
  destination_address text,
  destination_coordinates point,
  scheduled_departure timestamptz,
  actual_departure timestamptz,
  scheduled_arrival timestamptz,
  actual_arrival timestamptz,
  distance_km numeric(10, 2),
  description text,
  special_requirements text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

**Types de missions** (`mission_type_enum`):
- `urgence`: Transport d'urgence (SMUR)
- `transport_patient`: Transport programmé de patient
- `transfert_inter_hopital`: Transfert entre établissements
- `transport_materiel`: Transport de matériel médical
- `livraison_pharmacie`: Livraison de médicaments
- `autre`: Autre type de mission

**Priorités** (`mission_priority_enum`):
- `urgente`: Urgence vitale
- `elevee`: Priorité élevée
- `normale`: Priorité normale
- `faible`: Peut être différée

**Statuts** (`mission_status_enum`):
- `planifiee`: Planifiée, pas encore commencée
- `en_attente`: En attente de départ
- `en_cours`: Mission en cours
- `completee`: Mission terminée avec succès
- `annulee`: Mission annulée
- `reportee`: Mission reportée

**Exemples d'utilisation**:

```sql
-- Missions en cours avec détails
SELECT
  m.mission_number,
  m.mission_type,
  m.priority,
  v.vehicle_number,
  v.vehicle_type,
  d.first_name || ' ' || d.last_name as conducteur,
  p.first_name || ' ' || p.last_name as patient,
  m.pickup_location,
  m.destination_location,
  m.actual_departure,
  m.scheduled_arrival
FROM transport_missions m
LEFT JOIN vehicles v ON m.vehicle_id = v.id
LEFT JOIN drivers d ON m.driver_id = d.id
LEFT JOIN patients p ON m.patient_id = p.id
WHERE m.status = 'en_cours'
ORDER BY m.priority DESC, m.actual_departure;

-- Missions du jour par véhicule
SELECT
  v.vehicle_number,
  v.vehicle_type,
  COUNT(*) as nombre_missions,
  SUM(CASE WHEN m.status = 'completee' THEN 1 ELSE 0 END) as completees,
  SUM(CASE WHEN m.status = 'en_cours' THEN 1 ELSE 0 END) as en_cours,
  SUM(m.distance_km) as distance_totale_km
FROM transport_missions m
JOIN vehicles v ON m.vehicle_id = v.id
WHERE DATE(m.created_at) = CURRENT_DATE
GROUP BY v.id, v.vehicle_number, v.vehicle_type
ORDER BY nombre_missions DESC;

-- Missions urgentes en attente d'attribution
SELECT
  mission_number,
  mission_type,
  pickup_location,
  destination_location,
  scheduled_departure,
  (scheduled_departure - now()) as temps_avant_depart,
  special_requirements
FROM transport_missions
WHERE status = 'planifiee'
  AND priority IN ('urgente', 'elevee')
  AND vehicle_id IS NULL
ORDER BY priority DESC, scheduled_departure;
```

#### 4. `vehicle_locations` - Suivi GPS

Enregistre l'historique des positions GPS des véhicules.

```sql
CREATE TABLE vehicle_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  mission_id uuid REFERENCES transport_missions(id) ON DELETE SET NULL,
  location point NOT NULL,
  address text,
  speed_kmh numeric(5, 2),
  heading numeric(5, 2),
  altitude_m numeric(8, 2),
  accuracy_m numeric(8, 2),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_vehicle_locations_vehicle_time
  ON vehicle_locations(vehicle_id, recorded_at DESC);
CREATE INDEX idx_vehicle_locations_mission
  ON vehicle_locations(mission_id);
CREATE INDEX idx_vehicle_locations_recorded
  ON vehicle_locations(recorded_at DESC);
```

**Exemples d'utilisation**:

```sql
-- Position actuelle de tous les véhicules en mission
SELECT DISTINCT ON (vl.vehicle_id)
  v.vehicle_number,
  v.vehicle_type,
  m.mission_number,
  vl.location,
  vl.address,
  vl.speed_kmh,
  vl.recorded_at,
  EXTRACT(EPOCH FROM (now() - vl.recorded_at)) / 60 as minutes_depuis_derniere_position
FROM vehicle_locations vl
JOIN vehicles v ON vl.vehicle_id = v.id
LEFT JOIN transport_missions m ON vl.mission_id = m.id
WHERE v.status = 'en_mission'
ORDER BY vl.vehicle_id, vl.recorded_at DESC;

-- Trajet complet d'une mission
SELECT
  recorded_at,
  location,
  address,
  speed_kmh,
  heading,
  calculate_distance_km(
    location,
    LAG(location) OVER (ORDER BY recorded_at)
  ) as distance_depuis_point_precedent_km
FROM vehicle_locations
WHERE mission_id = 'uuid-de-la-mission'
ORDER BY recorded_at;

-- Véhicules avec signal GPS ancien (> 30 minutes)
SELECT DISTINCT ON (vehicle_id)
  v.vehicle_number,
  v.vehicle_type,
  v.status,
  vl.recorded_at as derniere_position,
  EXTRACT(EPOCH FROM (now() - vl.recorded_at)) / 60 as minutes_sans_signal
FROM vehicle_locations vl
JOIN vehicles v ON vl.vehicle_id = v.id
WHERE v.is_active = true
ORDER BY vehicle_id, recorded_at DESC
HAVING EXTRACT(EPOCH FROM (now() - recorded_at)) / 60 > 30;
```

#### 5. `fuel_records` - Gestion du Carburant

Enregistre tous les pleins de carburant et permet le calcul de consommation.

```sql
CREATE TABLE fuel_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  fuel_type fuel_type_enum NOT NULL,
  quantity_liters numeric(8, 2) NOT NULL,
  cost_per_liter numeric(8, 2),
  total_cost numeric(10, 2),
  mileage_km numeric(10, 2) NOT NULL,
  station_name text,
  station_location text,
  is_full_tank boolean DEFAULT true,
  receipt_number text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  refuel_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

**Types de carburant** (`fuel_type_enum`):
- `essence_95`: Essence Sans Plomb 95
- `essence_98`: Essence Sans Plomb 98
- `diesel`: Gazole/Diesel
- `electrique`: Véhicule électrique
- `hybride`: Véhicule hybride

**Exemples d'utilisation**:

```sql
-- Consommation moyenne par véhicule (30 derniers jours)
WITH fuel_consumption AS (
  SELECT
    vehicle_id,
    refuel_date,
    quantity_liters,
    mileage_km,
    LAG(mileage_km) OVER (PARTITION BY vehicle_id ORDER BY refuel_date) as previous_mileage,
    total_cost
  FROM fuel_records
  WHERE refuel_date >= CURRENT_DATE - interval '30 days'
    AND is_full_tank = true
)
SELECT
  v.vehicle_number,
  v.make,
  v.model,
  COUNT(*) as nombre_pleins,
  ROUND(AVG(fc.quantity_liters), 2) as litres_moyen_par_plein,
  ROUND(SUM(fc.quantity_liters), 2) as litres_total,
  ROUND(AVG((fc.mileage_km - fc.previous_mileage) / NULLIF(fc.quantity_liters, 0) * 100), 2)
    as consommation_moyenne_l_per_100km,
  ROUND(SUM(fc.total_cost), 2) as cout_total
FROM fuel_consumption fc
JOIN vehicles v ON fc.vehicle_id = v.id
WHERE fc.previous_mileage IS NOT NULL
GROUP BY v.id, v.vehicle_number, v.make, v.model
ORDER BY consommation_moyenne_l_per_100km DESC;

-- Coûts carburant par type de véhicule (mois en cours)
SELECT
  v.vehicle_type,
  f.fuel_type,
  COUNT(*) as nombre_pleins,
  ROUND(SUM(f.quantity_liters), 2) as litres_total,
  ROUND(SUM(f.total_cost), 2) as cout_total,
  ROUND(AVG(f.cost_per_liter), 2) as prix_moyen_litre
FROM fuel_records f
JOIN vehicles v ON f.vehicle_id = v.id
WHERE DATE_TRUNC('month', f.refuel_date) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY v.vehicle_type, f.fuel_type
ORDER BY v.vehicle_type, f.fuel_type;

-- Top 5 véhicules les plus consommateurs (ce mois)
SELECT
  v.vehicle_number,
  v.make,
  v.model,
  COUNT(*) as nombre_pleins,
  ROUND(SUM(f.quantity_liters), 2) as litres_consommes,
  ROUND(SUM(f.total_cost), 2) as cout_total
FROM fuel_records f
JOIN vehicles v ON f.vehicle_id = v.id
WHERE DATE_TRUNC('month', f.refuel_date) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY v.id, v.vehicle_number, v.make, v.model
ORDER BY litres_consommes DESC
LIMIT 5;
```

#### 6. `maintenance_schedules` - Planification Maintenance

Planifie les maintenances préventives selon le kilométrage et le temps.

```sql
CREATE TABLE maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type maintenance_type_enum NOT NULL,
  description text NOT NULL,
  scheduled_date date,
  scheduled_mileage_km numeric(10, 2),
  interval_days integer,
  interval_km integer,
  last_performed_date date,
  last_performed_mileage_km numeric(10, 2),
  next_due_date date,
  next_due_mileage_km numeric(10, 2),
  is_completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Types de maintenance** (`maintenance_type_enum`):
- `vidange`: Vidange d'huile
- `revision`: Révision complète
- `pneus`: Changement/rotation pneus
- `freins`: Vérification/changement freins
- `controle_technique`: Contrôle technique obligatoire
- `climatisation`: Entretien climatisation
- `batterie`: Vérification/changement batterie
- `autre`: Autre maintenance

**Exemples d'utilisation**:

```sql
-- Maintenances en retard
SELECT
  v.vehicle_number,
  v.make,
  v.model,
  ms.maintenance_type,
  ms.description,
  ms.next_due_date,
  ms.next_due_mileage_km,
  v.current_mileage_km,
  CASE
    WHEN ms.next_due_date < CURRENT_DATE THEN
      CURRENT_DATE - ms.next_due_date
    ELSE NULL
  END as jours_retard,
  CASE
    WHEN ms.next_due_mileage_km < v.current_mileage_km THEN
      v.current_mileage_km - ms.next_due_mileage_km
    ELSE NULL
  END as km_retard
FROM maintenance_schedules ms
JOIN vehicles v ON ms.vehicle_id = v.id
WHERE ms.is_completed = false
  AND (
    ms.next_due_date < CURRENT_DATE
    OR ms.next_due_mileage_km < v.current_mileage_km
  )
ORDER BY
  COALESCE(CURRENT_DATE - ms.next_due_date, 0) DESC,
  COALESCE(v.current_mileage_km - ms.next_due_mileage_km, 0) DESC;

-- Maintenances à venir dans 30 jours
SELECT
  v.vehicle_number,
  ms.maintenance_type,
  ms.description,
  ms.next_due_date,
  (ms.next_due_date - CURRENT_DATE) as jours_restants,
  ms.next_due_mileage_km,
  v.current_mileage_km,
  (ms.next_due_mileage_km - v.current_mileage_km) as km_restants
FROM maintenance_schedules ms
JOIN vehicles v ON ms.vehicle_id = v.id
WHERE ms.is_completed = false
  AND ms.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '30 days'
ORDER BY ms.next_due_date;
```

#### 7. `maintenance_records` - Historique Maintenance

Enregistre toutes les interventions de maintenance effectuées.

```sql
CREATE TABLE maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES maintenance_schedules(id) ON DELETE SET NULL,
  maintenance_type maintenance_type_enum NOT NULL,
  description text NOT NULL,
  maintenance_date date NOT NULL,
  mileage_km numeric(10, 2) NOT NULL,
  service_provider text,
  labor_cost numeric(10, 2),
  parts_cost numeric(10, 2),
  total_cost numeric(10, 2),
  invoice_number text,
  warranty_expiry_date date,
  performed_by text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
```

**Exemples d'utilisation**:

```sql
-- Coûts de maintenance par véhicule (année en cours)
SELECT
  v.vehicle_number,
  v.make,
  v.model,
  v.year,
  COUNT(*) as nombre_interventions,
  ROUND(SUM(mr.labor_cost), 2) as cout_main_oeuvre,
  ROUND(SUM(mr.parts_cost), 2) as cout_pieces,
  ROUND(SUM(mr.total_cost), 2) as cout_total,
  ROUND(AVG(mr.total_cost), 2) as cout_moyen_intervention
FROM maintenance_records mr
JOIN vehicles v ON mr.vehicle_id = v.id
WHERE EXTRACT(YEAR FROM mr.maintenance_date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY v.id, v.vehicle_number, v.make, v.model, v.year
ORDER BY cout_total DESC;

-- Historique complet d'un véhicule
SELECT
  maintenance_date,
  maintenance_type,
  description,
  mileage_km,
  service_provider,
  total_cost,
  invoice_number,
  warranty_expiry_date,
  performed_by
FROM maintenance_records
WHERE vehicle_id = 'uuid-du-vehicule'
ORDER BY maintenance_date DESC, mileage_km DESC;

-- Interventions sous garantie
SELECT
  v.vehicle_number,
  mr.maintenance_date,
  mr.maintenance_type,
  mr.description,
  mr.warranty_expiry_date,
  (mr.warranty_expiry_date - CURRENT_DATE) as jours_garantie_restants
FROM maintenance_records mr
JOIN vehicles v ON mr.vehicle_id = v.id
WHERE mr.warranty_expiry_date IS NOT NULL
  AND mr.warranty_expiry_date > CURRENT_DATE
ORDER BY mr.warranty_expiry_date;
```

---

## Fonctions PostgreSQL

### 1. `calculate_distance_km` - Calcul de Distance

Calcule la distance entre deux points GPS en kilomètres.

```sql
CREATE OR REPLACE FUNCTION calculate_distance_km(point1 point, point2 point)
RETURNS numeric AS $$
DECLARE
  lat1 numeric;
  lon1 numeric;
  lat2 numeric;
  lon2 numeric;
  R numeric := 6371; -- Rayon de la Terre en km
  dLat numeric;
  dLon numeric;
  a numeric;
  c numeric;
BEGIN
  IF point1 IS NULL OR point2 IS NULL THEN
    RETURN NULL;
  END IF;

  lat1 := radians(point1[1]);
  lon1 := radians(point1[0]);
  lat2 := radians(point2[1]);
  lon2 := radians(point2[0]);

  dLat := lat2 - lat1;
  dLon := lon2 - lon1;

  a := sin(dLat/2) * sin(dLat/2) +
       cos(lat1) * cos(lat2) *
       sin(dLon/2) * sin(dLon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));

  RETURN ROUND((R * c)::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Usage**:
```sql
-- Distance parcourue lors d'une mission
SELECT calculate_distance_km(pickup_coordinates, destination_coordinates) as distance_km
FROM transport_missions
WHERE id = 'uuid-mission';
```

### 2. `generate_mission_number` - Numéro de Mission

Génère un numéro de mission unique au format `MYYYYMMDD-XXXX`.

```sql
CREATE OR REPLACE FUNCTION generate_mission_number()
RETURNS text AS $$
DECLARE
  prefix text;
  sequence_num integer;
  mission_num text;
BEGIN
  prefix := 'M' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(mission_number FROM 11) AS integer)
  ), 0) + 1
  INTO sequence_num
  FROM transport_missions
  WHERE mission_number LIKE prefix || '-%';

  mission_num := prefix || '-' || LPAD(sequence_num::text, 4, '0');

  RETURN mission_num;
END;
$$ LANGUAGE plpgsql VOLATILE;
```

**Exemples de numéros générés**:
- `M20251120-0001`
- `M20251120-0002`
- `M20251121-0001`

### 3. `update_vehicle_status_from_missions` - MAJ Statut Véhicule

Trigger automatique pour mettre à jour le statut d'un véhicule selon ses missions.

```sql
CREATE OR REPLACE FUNCTION update_vehicle_status_from_missions()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'en_cours' AND NEW.vehicle_id IS NOT NULL THEN
    UPDATE vehicles
    SET status = 'en_mission'
    WHERE id = NEW.vehicle_id;
  ELSIF (NEW.status = 'completee' OR NEW.status = 'annulee')
    AND NEW.vehicle_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM transport_missions
      WHERE vehicle_id = NEW.vehicle_id
        AND status = 'en_cours'
        AND id != NEW.id
    ) THEN
      UPDATE vehicles
      SET status = 'disponible'
      WHERE id = NEW.vehicle_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vehicle_status_on_mission
  AFTER INSERT OR UPDATE OF status ON transport_missions
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_status_from_missions();
```

---

## Vues Statistiques

### `fleet_overview` - Vue d'Ensemble Flotte

Vue synthétique de l'état de la flotte.

```sql
CREATE VIEW fleet_overview AS
SELECT
  v.vehicle_type,
  COUNT(*) as total_vehicles,
  SUM(CASE WHEN v.status = 'disponible' THEN 1 ELSE 0 END) as disponibles,
  SUM(CASE WHEN v.status = 'en_mission' THEN 1 ELSE 0 END) as en_mission,
  SUM(CASE WHEN v.status = 'en_maintenance' THEN 1 ELSE 0 END) as en_maintenance,
  SUM(CASE WHEN v.status = 'hors_service' THEN 1 ELSE 0 END) as hors_service,
  ROUND(AVG(v.current_mileage_km), 0) as km_moyen,
  ROUND(SUM(v.current_mileage_km), 0) as km_total
FROM vehicles v
WHERE v.is_active = true
GROUP BY v.vehicle_type;
```

**Utilisation**:
```sql
SELECT * FROM fleet_overview ORDER BY vehicle_type;
```

---

## Workflows Opérationnels

### Workflow 1: Planification d'une Mission de Transport

#### Étape 1: Créer la Mission

```sql
INSERT INTO transport_missions (
  mission_type,
  priority,
  patient_id,
  pickup_location,
  pickup_address,
  pickup_coordinates,
  destination_location,
  destination_address,
  destination_coordinates,
  scheduled_departure,
  scheduled_arrival,
  description,
  special_requirements,
  created_by
) VALUES (
  'transport_patient',
  'normale',
  'uuid-patient',
  'Domicile Patient',
  '123 Rue de la Santé, 75013 Paris',
  point(2.3522, 48.8566),
  'Service Cardiologie - Hôpital',
  'Hôpital Central, 456 Avenue Medicale, 75014 Paris',
  point(2.3200, 48.8300),
  '2025-11-21 14:00:00+01',
  '2025-11-21 14:45:00+01',
  'Transport pour consultation cardiologie',
  'Patient à mobilité réduite - fauteuil roulant nécessaire',
  auth.uid()
);
```

#### Étape 2: Assigner Véhicule et Conducteur

```sql
-- Trouver véhicule disponible adapté
SELECT id, vehicle_number, vehicle_type
FROM vehicles
WHERE is_active = true
  AND status = 'disponible'
  AND vehicle_type IN ('ambulance_standard', 'ambulance_urgence')
ORDER BY current_mileage_km
LIMIT 1;

-- Trouver conducteur disponible avec bon permis
SELECT id, first_name, last_name
FROM drivers
WHERE is_active = true
  AND is_available = true
  AND license_type IN ('permis_ambulance', 'permis_d')
  AND license_expiry_date > CURRENT_DATE
LIMIT 1;

-- Assigner à la mission
UPDATE transport_missions
SET
  vehicle_id = 'uuid-vehicule',
  driver_id = 'uuid-conducteur',
  status = 'en_attente',
  updated_at = now()
WHERE id = 'uuid-mission';
```

#### Étape 3: Démarrer la Mission

```sql
-- Marquer le départ
UPDATE transport_missions
SET
  status = 'en_cours',
  actual_departure = now(),
  updated_at = now()
WHERE id = 'uuid-mission';

-- Le statut du véhicule est automatiquement mis à 'en_mission' par le trigger
```

#### Étape 4: Suivi GPS Pendant la Mission

```sql
-- Enregistrer position toutes les 2-5 minutes
INSERT INTO vehicle_locations (
  vehicle_id,
  mission_id,
  location,
  address,
  speed_kmh,
  heading,
  accuracy_m
) VALUES (
  'uuid-vehicule',
  'uuid-mission',
  point(2.3400, 48.8450),
  'Boulevard Saint-Michel, 75005 Paris',
  45.5,
  180.0,
  10.0
);
```

#### Étape 5: Terminer la Mission

```sql
-- Calculer distance totale de la mission
WITH mission_track AS (
  SELECT
    location,
    LAG(location) OVER (ORDER BY recorded_at) as previous_location
  FROM vehicle_locations
  WHERE mission_id = 'uuid-mission'
  ORDER BY recorded_at
)
SELECT SUM(
  calculate_distance_km(previous_location, location)
) as total_distance
FROM mission_track
WHERE previous_location IS NOT NULL;

-- Compléter la mission
UPDATE transport_missions
SET
  status = 'completee',
  actual_arrival = now(),
  distance_km = 12.5, -- distance calculée ci-dessus
  completed_at = now(),
  updated_at = now()
WHERE id = 'uuid-mission';

-- Le statut du véhicule retourne automatiquement à 'disponible' si aucune autre mission en cours
```

### Workflow 2: Gestion du Carburant

#### Enregistrer un Plein

```sql
-- Obtenir kilométrage actuel du véhicule
SELECT current_mileage_km FROM vehicles WHERE id = 'uuid-vehicule';

-- Enregistrer le plein
INSERT INTO fuel_records (
  vehicle_id,
  driver_id,
  fuel_type,
  quantity_liters,
  cost_per_liter,
  total_cost,
  mileage_km,
  station_name,
  station_location,
  is_full_tank,
  receipt_number,
  recorded_by
) VALUES (
  'uuid-vehicule',
  'uuid-conducteur',
  'diesel',
  65.00,
  1.89,
  122.85,
  45230.00,
  'Total Access',
  'Autoroute A6, Aire de Repos',
  true,
  'REC-2025-001234',
  auth.uid()
);

-- Mettre à jour le kilométrage du véhicule
UPDATE vehicles
SET
  current_mileage_km = 45230.00,
  updated_at = now()
WHERE id = 'uuid-vehicule';
```

#### Analyser la Consommation

```sql
-- Consommation sur les 5 derniers pleins
WITH fuel_analysis AS (
  SELECT
    refuel_date,
    quantity_liters,
    mileage_km,
    LAG(mileage_km) OVER (ORDER BY refuel_date) as previous_mileage,
    total_cost
  FROM fuel_records
  WHERE vehicle_id = 'uuid-vehicule'
    AND is_full_tank = true
  ORDER BY refuel_date DESC
  LIMIT 5
)
SELECT
  refuel_date,
  quantity_liters,
  (mileage_km - previous_mileage) as km_parcourus,
  ROUND(
    quantity_liters / NULLIF((mileage_km - previous_mileage), 0) * 100,
    2
  ) as consommation_l_per_100km,
  total_cost,
  ROUND(
    total_cost / NULLIF((mileage_km - previous_mileage), 0) * 100,
    2
  ) as cout_per_100km
FROM fuel_analysis
WHERE previous_mileage IS NOT NULL
ORDER BY refuel_date DESC;
```

### Workflow 3: Maintenance Préventive

#### Étape 1: Configuration Planification

```sql
-- Configurer maintenance récurrente (ex: vidange tous les 10,000 km)
INSERT INTO maintenance_schedules (
  vehicle_id,
  maintenance_type,
  description,
  interval_days,
  interval_km,
  last_performed_date,
  last_performed_mileage_km,
  next_due_date,
  next_due_mileage_km
) VALUES (
  'uuid-vehicule',
  'vidange',
  'Vidange huile moteur + filtre',
  NULL, -- pas d''intervalle temps
  10000, -- tous les 10,000 km
  '2025-09-15',
  35000.00,
  NULL,
  45000.00
);
```

#### Étape 2: Identifier Maintenances Dues

```sql
-- Maintenance dues ou à venir (7 jours / 500 km)
SELECT
  v.vehicle_number,
  v.make,
  v.model,
  ms.maintenance_type,
  ms.description,
  ms.next_due_date,
  ms.next_due_mileage_km,
  v.current_mileage_km,
  CASE
    WHEN ms.next_due_date IS NOT NULL THEN
      ms.next_due_date - CURRENT_DATE
  END as jours_restants,
  CASE
    WHEN ms.next_due_mileage_km IS NOT NULL THEN
      ms.next_due_mileage_km - v.current_mileage_km
  END as km_restants
FROM maintenance_schedules ms
JOIN vehicles v ON ms.vehicle_id = v.id
WHERE ms.is_completed = false
  AND (
    (ms.next_due_date IS NOT NULL AND ms.next_due_date <= CURRENT_DATE + 7)
    OR (ms.next_due_mileage_km IS NOT NULL AND v.current_mileage_km >= ms.next_due_mileage_km - 500)
  )
ORDER BY
  COALESCE(ms.next_due_date, CURRENT_DATE + 365),
  COALESCE(ms.next_due_mileage_km, 999999);
```

#### Étape 3: Planifier Intervention

```sql
-- Marquer véhicule en maintenance
UPDATE vehicles
SET
  status = 'en_maintenance',
  updated_at = now()
WHERE id = 'uuid-vehicule';

-- Annuler missions planifiées affectées à ce véhicule
UPDATE transport_missions
SET
  status = 'reportee',
  vehicle_id = NULL,
  notes = COALESCE(notes || ' | ', '') || 'Mission reportée - véhicule en maintenance',
  updated_at = now()
WHERE vehicle_id = 'uuid-vehicule'
  AND status IN ('planifiee', 'en_attente');
```

#### Étape 4: Enregistrer Intervention

```sql
-- Enregistrer la maintenance effectuée
INSERT INTO maintenance_records (
  vehicle_id,
  schedule_id,
  maintenance_type,
  description,
  maintenance_date,
  mileage_km,
  service_provider,
  labor_cost,
  parts_cost,
  total_cost,
  invoice_number,
  warranty_expiry_date,
  performed_by,
  created_by
) VALUES (
  'uuid-vehicule',
  'uuid-schedule',
  'vidange',
  'Vidange huile moteur + filtre à huile + filtre à air',
  CURRENT_DATE,
  45230.00,
  'Garage Central Auto',
  45.00,
  89.50,
  134.50,
  'INV-2025-5678',
  CURRENT_DATE + interval '1 year',
  'Jean Dupont - Mécanicien',
  auth.uid()
);

-- Marquer schedule comme complété et calculer prochaine échéance
UPDATE maintenance_schedules
SET
  is_completed = true,
  last_performed_date = CURRENT_DATE,
  last_performed_mileage_km = 45230.00,
  next_due_mileage_km = 45230.00 + interval_km,
  updated_at = now()
WHERE id = 'uuid-schedule';

-- Créer nouvelle planification pour prochain cycle
INSERT INTO maintenance_schedules (
  vehicle_id,
  maintenance_type,
  description,
  interval_days,
  interval_km,
  last_performed_date,
  last_performed_mileage_km,
  next_due_mileage_km
)
SELECT
  vehicle_id,
  maintenance_type,
  description,
  interval_days,
  interval_km,
  CURRENT_DATE,
  45230.00,
  45230.00 + interval_km
FROM maintenance_schedules
WHERE id = 'uuid-schedule';

-- Mettre à jour véhicule
UPDATE vehicles
SET
  status = 'disponible',
  current_mileage_km = 45230.00,
  last_service_date = CURRENT_DATE,
  next_service_due_km = 55230.00,
  updated_at = now()
WHERE id = 'uuid-vehicule';
```

---

## Sécurité et Politiques RLS

### Politiques par Rôle

#### Logisticien (`logisticien`)
Accès complet à tous les modules transport.

```sql
-- Véhicules: accès complet
CREATE POLICY "Logisticians full access vehicles"
  ON vehicles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'logisticien'
    )
  );

-- Conducteurs: accès complet
CREATE POLICY "Logisticians full access drivers"
  ON drivers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'logisticien'
    )
  );

-- Missions: accès complet
CREATE POLICY "Logisticians full access missions"
  ON transport_missions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'logisticien'
    )
  );
```

#### Conducteur (`driver`)
Accès à ses propres missions et données de conduite.

```sql
-- Missions: voir uniquement ses missions
CREATE POLICY "Drivers view own missions"
  ON transport_missions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = transport_missions.driver_id
        AND drivers.user_id = auth.uid()
    )
  );

-- Missions: mettre à jour statut de ses missions
CREATE POLICY "Drivers update own mission status"
  ON transport_missions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = transport_missions.driver_id
        AND drivers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = transport_missions.driver_id
        AND drivers.user_id = auth.uid()
    )
  );

-- GPS: créer positions pour missions assignées
CREATE POLICY "Drivers create GPS locations"
  ON vehicle_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transport_missions tm
      JOIN drivers d ON tm.driver_id = d.id
      WHERE tm.id = vehicle_locations.mission_id
        AND d.user_id = auth.uid()
    )
  );

-- Carburant: enregistrer ses pleins
CREATE POLICY "Drivers create fuel records"
  ON fuel_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = fuel_records.driver_id
        AND drivers.user_id = auth.uid()
    )
  );
```

#### Médecin/Infirmier
Peut créer missions pour patients, voir statut.

```sql
CREATE POLICY "Medical staff create patient missions"
  ON transport_missions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role IN ('medecin', 'infirmier')
    )
  );

CREATE POLICY "Medical staff view patient missions"
  ON transport_missions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role IN ('medecin', 'infirmier')
    )
  );
```

---

## Rapports et Analyses

### Rapport 1: Performance de la Flotte (Mensuel)

```sql
-- Synthèse mensuelle complète par véhicule
WITH monthly_data AS (
  SELECT
    v.id as vehicle_id,
    v.vehicle_number,
    v.make,
    v.model,
    v.vehicle_type,
    -- Missions
    COUNT(DISTINCT tm.id) as total_missions,
    SUM(CASE WHEN tm.status = 'completee' THEN 1 ELSE 0 END) as missions_completees,
    SUM(tm.distance_km) as distance_totale_km,
    -- Carburant
    SUM(fr.quantity_liters) as carburant_litres,
    SUM(fr.total_cost) as carburant_cout,
    -- Maintenance
    COUNT(DISTINCT mr.id) as nb_maintenances,
    SUM(mr.total_cost) as maintenance_cout,
    -- Temps d'utilisation
    SUM(
      EXTRACT(EPOCH FROM (tm.actual_arrival - tm.actual_departure)) / 3600
    ) as heures_utilisation
  FROM vehicles v
  LEFT JOIN transport_missions tm ON v.id = tm.vehicle_id
    AND DATE_TRUNC('month', tm.created_at) = DATE_TRUNC('month', CURRENT_DATE)
  LEFT JOIN fuel_records fr ON v.id = fr.vehicle_id
    AND DATE_TRUNC('month', fr.refuel_date) = DATE_TRUNC('month', CURRENT_DATE)
  LEFT JOIN maintenance_records mr ON v.id = mr.vehicle_id
    AND DATE_TRUNC('month', mr.maintenance_date) = DATE_TRUNC('month', CURRENT_DATE)
  WHERE v.is_active = true
  GROUP BY v.id, v.vehicle_number, v.make, v.model, v.vehicle_type
)
SELECT
  vehicle_number,
  make || ' ' || model as vehicule,
  vehicle_type,
  total_missions,
  missions_completees,
  ROUND(missions_completees::numeric / NULLIF(total_missions, 0) * 100, 1)
    as taux_completion_pct,
  ROUND(distance_totale_km, 0) as km_parcourus,
  ROUND(carburant_litres, 1) as litres_consommes,
  ROUND(carburant_litres / NULLIF(distance_totale_km, 0) * 100, 2)
    as consommation_l_100km,
  ROUND(carburant_cout, 2) as cout_carburant,
  nb_maintenances,
  ROUND(maintenance_cout, 2) as cout_maintenance,
  ROUND(carburant_cout + maintenance_cout, 2) as cout_total,
  ROUND(heures_utilisation, 1) as heures_utilisation,
  ROUND(
    (carburant_cout + maintenance_cout) / NULLIF(distance_totale_km, 0),
    3
  ) as cout_par_km
FROM monthly_data
ORDER BY cout_total DESC;
```

### Rapport 2: Performance des Conducteurs

```sql
SELECT
  d.employee_number,
  d.first_name || ' ' || d.last_name as conducteur,
  d.license_type,
  COUNT(tm.id) as total_missions,
  SUM(CASE WHEN tm.status = 'completee' THEN 1 ELSE 0 END) as completees,
  SUM(CASE WHEN tm.status = 'annulee' THEN 1 ELSE 0 END) as annulees,
  ROUND(AVG(tm.distance_km), 1) as distance_moyenne_km,
  SUM(tm.distance_km) as distance_totale_km,
  ROUND(
    AVG(
      EXTRACT(EPOCH FROM (tm.actual_arrival - tm.actual_departure)) / 3600
    ),
    2
  ) as duree_moyenne_heures,
  ROUND(
    SUM(
      EXTRACT(EPOCH FROM (tm.actual_arrival - tm.actual_departure)) / 3600
    ),
    1
  ) as heures_totales,
  -- Ponctualité: missions terminées dans les temps
  SUM(
    CASE
      WHEN tm.status = 'completee'
        AND tm.actual_arrival <= tm.scheduled_arrival
      THEN 1
      ELSE 0
    END
  ) as missions_a_lheure,
  ROUND(
    SUM(
      CASE
        WHEN tm.status = 'completee'
          AND tm.actual_arrival <= tm.scheduled_arrival
        THEN 1
        ELSE 0
      END
    )::numeric / NULLIF(
      SUM(CASE WHEN tm.status = 'completee' THEN 1 ELSE 0 END),
      0
    ) * 100,
    1
  ) as taux_ponctualite_pct
FROM drivers d
LEFT JOIN transport_missions tm ON d.id = tm.driver_id
  AND DATE_TRUNC('month', tm.created_at) = DATE_TRUNC('month', CURRENT_DATE)
WHERE d.is_active = true
GROUP BY d.id, d.employee_number, d.first_name, d.last_name, d.license_type
HAVING COUNT(tm.id) > 0
ORDER BY total_missions DESC;
```

### Rapport 3: Analyse des Coûts

```sql
-- Coûts totaux par catégorie (année en cours)
WITH yearly_costs AS (
  SELECT
    'Carburant' as categorie,
    SUM(total_cost) as montant
  FROM fuel_records
  WHERE EXTRACT(YEAR FROM refuel_date) = EXTRACT(YEAR FROM CURRENT_DATE)

  UNION ALL

  SELECT
    'Maintenance - ' || maintenance_type as categorie,
    SUM(total_cost) as montant
  FROM maintenance_records
  WHERE EXTRACT(YEAR FROM maintenance_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  GROUP BY maintenance_type
)
SELECT
  categorie,
  ROUND(montant, 2) as montant_total,
  ROUND(
    montant / SUM(montant) OVER () * 100,
    2
  ) as pourcentage_total
FROM yearly_costs
ORDER BY montant DESC;

-- Évolution mensuelle des coûts
SELECT
  TO_CHAR(month_date, 'YYYY-MM') as mois,
  ROUND(SUM(fuel_cost), 2) as carburant,
  ROUND(SUM(maintenance_cost), 2) as maintenance,
  ROUND(SUM(fuel_cost + maintenance_cost), 2) as total
FROM (
  SELECT
    DATE_TRUNC('month', refuel_date) as month_date,
    SUM(total_cost) as fuel_cost,
    0 as maintenance_cost
  FROM fuel_records
  WHERE refuel_date >= CURRENT_DATE - interval '12 months'
  GROUP BY DATE_TRUNC('month', refuel_date)

  UNION ALL

  SELECT
    DATE_TRUNC('month', maintenance_date) as month_date,
    0 as fuel_cost,
    SUM(total_cost) as maintenance_cost
  FROM maintenance_records
  WHERE maintenance_date >= CURRENT_DATE - interval '12 months'
  GROUP BY DATE_TRUNC('month', maintenance_date)
) costs
GROUP BY month_date
ORDER BY mois DESC;
```

---

## Alertes et Notifications

### Alertes Critiques

#### 1. Véhicules avec Documents Expirés/Expirant

```sql
-- Documents expirés ou expirant dans 15 jours
SELECT
  'URGENT' as niveau,
  vehicle_number,
  CASE
    WHEN insurance_expiry_date <= CURRENT_DATE THEN 'Assurance EXPIRÉE'
    WHEN insurance_expiry_date <= CURRENT_DATE + 15 THEN 'Assurance expire dans ' ||
      (insurance_expiry_date - CURRENT_DATE) || ' jours'
    WHEN registration_expiry_date <= CURRENT_DATE THEN 'Carte grise EXPIRÉE'
    WHEN registration_expiry_date <= CURRENT_DATE + 15 THEN 'Carte grise expire dans ' ||
      (registration_expiry_date - CURRENT_DATE) || ' jours'
  END as alerte,
  LEAST(insurance_expiry_date, registration_expiry_date) as date_critique
FROM vehicles
WHERE is_active = true
  AND (
    insurance_expiry_date <= CURRENT_DATE + 15
    OR registration_expiry_date <= CURRENT_DATE + 15
  )
ORDER BY date_critique;
```

#### 2. Permis Conducteurs Expirant

```sql
SELECT
  'URGENT' as niveau,
  employee_number,
  first_name || ' ' || last_name as conducteur,
  license_number,
  license_type,
  license_expiry_date,
  CASE
    WHEN license_expiry_date <= CURRENT_DATE THEN 'EXPIRÉ'
    ELSE 'Expire dans ' || (license_expiry_date - CURRENT_DATE) || ' jours'
  END as statut
FROM drivers
WHERE is_active = true
  AND license_expiry_date <= CURRENT_DATE + 30
ORDER BY license_expiry_date;
```

#### 3. Maintenances en Retard

```sql
SELECT
  'IMPORTANT' as niveau,
  v.vehicle_number,
  ms.maintenance_type,
  ms.description,
  CASE
    WHEN ms.next_due_date < CURRENT_DATE THEN
      'Retard de ' || (CURRENT_DATE - ms.next_due_date) || ' jours'
    WHEN ms.next_due_mileage_km < v.current_mileage_km THEN
      'Dépassement de ' || ROUND(v.current_mileage_km - ms.next_due_mileage_km, 0) || ' km'
  END as retard
FROM maintenance_schedules ms
JOIN vehicles v ON ms.vehicle_id = v.id
WHERE ms.is_completed = false
  AND v.is_active = true
  AND (
    ms.next_due_date < CURRENT_DATE
    OR ms.next_due_mileage_km < v.current_mileage_km
  )
ORDER BY
  COALESCE(CURRENT_DATE - ms.next_due_date, 0) DESC,
  COALESCE(v.current_mileage_km - ms.next_due_mileage_km, 0) DESC;
```

#### 4. Véhicules avec Signal GPS Perdu

```sql
SELECT DISTINCT ON (v.id)
  'ATTENTION' as niveau,
  v.vehicle_number,
  v.status,
  vl.recorded_at as derniere_position,
  ROUND(EXTRACT(EPOCH FROM (now() - vl.recorded_at)) / 60, 0) as minutes_sans_signal
FROM vehicles v
LEFT JOIN vehicle_locations vl ON v.id = vl.vehicle_id
WHERE v.is_active = true
  AND v.status = 'en_mission'
ORDER BY v.id, vl.recorded_at DESC
HAVING EXTRACT(EPOCH FROM (now() - MAX(vl.recorded_at))) / 60 > 30;
```

---

## Intégration Frontend (React/TypeScript)

### Types TypeScript

```typescript
// src/types/transport.ts

export type VehicleType =
  | 'ambulance_urgence'
  | 'ambulance_standard'
  | 'voiture_service'
  | 'camionnette'
  | 'moto';

export type VehicleStatus =
  | 'disponible'
  | 'en_mission'
  | 'en_maintenance'
  | 'hors_service'
  | 'retire';

export interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  year: number;
  registration_plate: string;
  vin_number?: string;
  status: VehicleStatus;
  capacity_persons?: number;
  capacity_weight_kg?: number;
  current_mileage_km: number;
  last_service_date?: string;
  next_service_due_km?: number;
  insurance_expiry_date?: string;
  registration_expiry_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type MissionType =
  | 'urgence'
  | 'transport_patient'
  | 'transfert_inter_hopital'
  | 'transport_materiel'
  | 'livraison_pharmacie'
  | 'autre';

export type MissionPriority =
  | 'urgente'
  | 'elevee'
  | 'normale'
  | 'faible';

export type MissionStatus =
  | 'planifiee'
  | 'en_attente'
  | 'en_cours'
  | 'completee'
  | 'annulee'
  | 'reportee';

export interface TransportMission {
  id: string;
  mission_number: string;
  mission_type: MissionType;
  priority: MissionPriority;
  status: MissionStatus;
  vehicle_id?: string;
  driver_id?: string;
  patient_id?: string;
  pickup_location: string;
  pickup_address?: string;
  destination_location: string;
  destination_address?: string;
  scheduled_departure?: string;
  actual_departure?: string;
  scheduled_arrival?: string;
  actual_arrival?: string;
  distance_km?: number;
  description?: string;
  special_requirements?: string;
  created_at: string;

  // Relations
  vehicle?: Vehicle;
  driver?: Driver;
  patient?: Patient;
}

export interface Driver {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  license_number: string;
  license_type: 'permis_b' | 'permis_d' | 'permis_ambulance' | 'permis_moto';
  license_expiry_date: string;
  phone_number?: string;
  is_available: boolean;
  is_active: boolean;
}

export interface VehicleLocation {
  id: string;
  vehicle_id: string;
  mission_id?: string;
  location: { x: number; y: number }; // point type
  address?: string;
  speed_kmh?: number;
  heading?: number;
  recorded_at: string;
}

export interface FuelRecord {
  id: string;
  vehicle_id: string;
  fuel_type: 'essence_95' | 'essence_98' | 'diesel' | 'electrique' | 'hybride';
  quantity_liters: number;
  cost_per_liter?: number;
  total_cost?: number;
  mileage_km: number;
  station_name?: string;
  refuel_date: string;
}
```

### Exemple de Hook: Gestion des Missions

```typescript
// src/hooks/useTransportMissions.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { TransportMission } from '@/types/transport';

export function useTransportMissions(filters?: {
  status?: string[];
  priority?: string[];
  date?: string;
}) {
  const [missions, setMissions] = useState<TransportMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMissions();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('transport_missions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transport_missions'
        },
        () => {
          fetchMissions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filters]);

  async function fetchMissions() {
    try {
      let query = supabase
        .from('transport_missions')
        .select(`
          *,
          vehicle:vehicles(*),
          driver:drivers(*),
          patient:patients(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.in('status', filters.status);
      }

      if (filters?.priority) {
        query = query.in('priority', filters.priority);
      }

      if (filters?.date) {
        query = query.gte('created_at', `${filters.date}T00:00:00`)
                     .lte('created_at', `${filters.date}T23:59:59`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setMissions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  async function createMission(missionData: Partial<TransportMission>) {
    const { data, error } = await supabase
      .from('transport_missions')
      .insert([missionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function updateMission(id: string, updates: Partial<TransportMission>) {
    const { data, error } = await supabase
      .from('transport_missions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function startMission(id: string) {
    return updateMission(id, {
      status: 'en_cours',
      actual_departure: new Date().toISOString()
    });
  }

  async function completeMission(id: string, distance_km: number) {
    return updateMission(id, {
      status: 'completee',
      actual_arrival: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      distance_km
    });
  }

  return {
    missions,
    loading,
    error,
    createMission,
    updateMission,
    startMission,
    completeMission,
    refresh: fetchMissions
  };
}
```

---

## Bonnes Pratiques

### 1. Gestion des Véhicules

- ✅ Toujours vérifier l'assurance et la carte grise avant d'assigner un véhicule
- ✅ Mettre à jour le kilométrage à chaque retour de mission
- ✅ Planifier les maintenances préventives selon le calendrier
- ✅ Retirer de la flotte active les véhicules hors d'usage
- ❌ Ne jamais assigner un véhicule en maintenance à une mission
- ❌ Ne pas ignorer les alertes de documents expirés

### 2. Gestion des Missions

- ✅ Assigner véhicule et conducteur adaptés au type de mission
- ✅ Vérifier la disponibilité du conducteur et son type de permis
- ✅ Enregistrer les positions GPS régulièrement (toutes les 2-5 minutes)
- ✅ Calculer et enregistrer la distance réelle parcourue
- ✅ Documenter les missions annulées ou reportées
- ❌ Ne pas créer de missions urgentes sans véhicule assigné
- ❌ Ne pas oublier de compléter les missions terminées

### 3. Gestion du Carburant

- ✅ Enregistrer TOUS les pleins, même partiels
- ✅ Conserver les reçus et numéros de facture
- ✅ Mettre à jour le kilométrage du véhicule lors du plein
- ✅ Surveiller la consommation anormale (alerte si > 15% augmentation)
- ❌ Ne pas enregistrer de plein sans le kilométrage exact
- ❌ Ne pas accepter de pleins sans reçu

### 4. Maintenance

- ✅ Respecter strictement les intervalles de maintenance
- ✅ Planifier la maintenance pendant les périodes creuses
- ✅ Conserver tous les documents de garantie
- ✅ Tenir à jour l'historique complet de chaque véhicule
- ❌ Ne jamais reporter une maintenance critique
- ❌ Ne pas remettre en service sans validation complète

### 5. Sécurité

- ✅ Vérifier les permis de conduite régulièrement
- ✅ Limiter l'accès aux données selon les rôles
- ✅ Auditer les actions sur les missions critiques
- ✅ Sauvegarder les données GPS historiques
- ❌ Ne pas partager les accès logisticien
- ❌ Ne pas modifier manuellement les données d'audit

---

## Indicateurs Clés de Performance (KPIs)

### KPI Opérationnels

1. **Taux de Disponibilité Flotte**
   ```sql
   SELECT
     ROUND(
       COUNT(*) FILTER (WHERE status = 'disponible')::numeric /
       COUNT(*)::numeric * 100,
       2
     ) as taux_disponibilite_pct
   FROM vehicles
   WHERE is_active = true;
   ```

2. **Temps Moyen de Mission**
   ```sql
   SELECT
     mission_type,
     ROUND(
       AVG(
         EXTRACT(EPOCH FROM (actual_arrival - actual_departure)) / 60
       ),
       0
     ) as duree_moyenne_minutes
   FROM transport_missions
   WHERE status = 'completee'
     AND actual_departure IS NOT NULL
     AND actual_arrival IS NOT NULL
   GROUP BY mission_type;
   ```

3. **Taux de Complétion Missions**
   ```sql
   SELECT
     ROUND(
       COUNT(*) FILTER (WHERE status = 'completee')::numeric /
       COUNT(*)::numeric * 100,
       2
     ) as taux_completion_pct
   FROM transport_missions
   WHERE created_at >= CURRENT_DATE - interval '30 days';
   ```

### KPI Financiers

1. **Coût par Kilomètre**
   ```sql
   WITH monthly_costs AS (
     SELECT
       SUM(fr.total_cost) as fuel_cost,
       SUM(mr.total_cost) as maintenance_cost
     FROM vehicles v
     LEFT JOIN fuel_records fr ON v.id = fr.vehicle_id
       AND DATE_TRUNC('month', fr.refuel_date) = DATE_TRUNC('month', CURRENT_DATE)
     LEFT JOIN maintenance_records mr ON v.id = mr.vehicle_id
       AND DATE_TRUNC('month', mr.maintenance_date) = DATE_TRUNC('month', CURRENT_DATE)
   ),
   monthly_distance AS (
     SELECT SUM(distance_km) as total_km
     FROM transport_missions
     WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
       AND status = 'completee'
   )
   SELECT
     ROUND(
       (mc.fuel_cost + mc.maintenance_cost) / NULLIF(md.total_km, 0),
       3
     ) as cout_par_km_euro
   FROM monthly_costs mc, monthly_distance md;
   ```

2. **Évolution Budget Transport**
   ```sql
   SELECT
     TO_CHAR(month_date, 'Month YYYY') as periode,
     ROUND(SUM(total_cost), 2) as budget_mensuel
   FROM (
     SELECT DATE_TRUNC('month', refuel_date) as month_date, total_cost
     FROM fuel_records
     WHERE refuel_date >= CURRENT_DATE - interval '12 months'
     UNION ALL
     SELECT DATE_TRUNC('month', maintenance_date), total_cost
     FROM maintenance_records
     WHERE maintenance_date >= CURRENT_DATE - interval '12 months'
   ) costs
   GROUP BY month_date
   ORDER BY month_date DESC;
   ```

### KPI Maintenance

1. **Taux de Conformité Maintenance**
   ```sql
   SELECT
     ROUND(
       COUNT(*) FILTER (WHERE is_completed = true)::numeric /
       COUNT(*)::numeric * 100,
       2
     ) as taux_conformite_pct
   FROM maintenance_schedules
   WHERE next_due_date < CURRENT_DATE
     OR next_due_mileage_km < (
       SELECT current_mileage_km
       FROM vehicles
       WHERE id = maintenance_schedules.vehicle_id
     );
   ```

2. **Downtime Moyen par Véhicule**
   ```sql
   SELECT
     v.vehicle_number,
     COUNT(mr.id) as nb_interventions,
     ROUND(AVG(mr.total_cost), 2) as cout_moyen,
     -- Estimation: 1 jour par intervention maintenance
     COUNT(mr.id) as jours_downtime_estimes
   FROM vehicles v
   LEFT JOIN maintenance_records mr ON v.id = mr.vehicle_id
     AND EXTRACT(YEAR FROM mr.maintenance_date) = EXTRACT(YEAR FROM CURRENT_DATE)
   WHERE v.is_active = true
   GROUP BY v.id, v.vehicle_number
   ORDER BY jours_downtime_estimes DESC;
   ```

---

## Conclusion

Le Module de Gestion du Transport fournit une solution complète pour gérer efficacement la flotte de véhicules d'un établissement hospitalier. Il couvre tous les aspects opérationnels, de la planification des missions au suivi GPS en temps réel, en passant par la gestion du carburant et la maintenance préventive.

### Points Forts du Système

1. **Traçabilité Complète**: Chaque mission, plein de carburant, et intervention de maintenance est enregistré avec horodatage
2. **Sécurité RLS**: Accès contrôlé selon les rôles (logisticien, conducteur, personnel médical)
3. **Automatisation**: Triggers pour mise à jour automatique des statuts véhicules
4. **Analyse Avancée**: Rapports détaillés sur performance, coûts, et utilisation
5. **Alertes Proactives**: Notifications pour documents expirés, maintenances dues, signal GPS perdu
6. **Scalabilité**: Architecture conçue pour gérer une flotte de toute taille

### Prochaines Évolutions Possibles

- Interface mobile pour conducteurs avec navigation GPS intégrée
- Optimisation automatique des trajets (algorithme de routage)
- Prédiction IA pour maintenance préventive
- Intégration avec systèmes de télématique véhicule
- Dashboard temps réel avec cartographie
- Système de réservation de véhicules en libre-service
- Gestion des accidents et sinistres

---

**Version**: 1.0
**Date**: 20 Novembre 2025
**Auteur**: Système de Documentation Automatique
