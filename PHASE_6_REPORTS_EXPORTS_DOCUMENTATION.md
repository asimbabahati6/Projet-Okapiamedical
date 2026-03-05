# 📊 PHASE 6: SYSTÈME DE RAPPORTS ET EXPORTS

**Version:** 1.0
**Date:** 20 Novembre 2024
**Statut:** ✅ Implémenté et Opérationnel

---

## 🎯 Vue d'Ensemble

La Phase 6 ajoute un système complet de génération de rapports et d'exports multi-formats pour tous les modules du système hospitalier, incluant:

- Système de templates de rapports configurables
- Génération à la demande (PDF, Excel, CSV, JSON)
- Planification automatique avec envoi email
- Historique complet et traçabilité
- Abonnements utilisateurs
- Statistiques d'utilisation

---

## 📊 Résumé de l'Implémentation

### **Données Créées**

```
✅ 4 Tables principales
✅ 4 Enums (types)
✅ 1 Vue statistiques
✅ 3 Fonctions automatiques
✅ 4 Triggers
✅ 8 Templates prédéfinis
✅ 4 Rapports générés (démo)
✅ 4 Rapports planifiés
✅ 2 Abonnements utilisateurs
```

### **Templates par Catégorie**

| Catégorie | Nombre | Templates |
|-----------|--------|-----------|
| **Logistique** | 4 | État Stock, Mouvements, Alertes, Inventaire |
| **Fournisseurs** | 2 | Performance, Commandes |
| **RH** | 1 | Présences Personnel |
| **Médical** | 1 | Consultations |
| **TOTAL** | **8** | Templates système |

---

## 🗄️ Architecture de la Base de Données

### **1. report_templates**
**Objectif:** Templates de rapports configurables et réutilisables

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| name | text | Nom technique (snake_case) |
| display_name | text | Nom affiché utilisateur |
| description | text | Description du rapport |
| category | report_category | logistics, suppliers, medical, financial, hr, admin |
| sql_query | text | Requête SQL à exécuter |
| parameters | jsonb | Paramètres acceptés (dates, filtres) |
| columns | jsonb | Configuration colonnes (label, width, align) |
| default_format | report_format | Format par défaut (pdf, excel, csv) |
| supports_formats | report_format[] | Formats supportés |
| allow_date_range | boolean | Accepte période dates? |
| allow_filters | boolean | Accepte filtres? |
| filters_config | jsonb | Configuration filtres disponibles |
| page_orientation | text | portrait ou landscape |
| include_header | boolean | En-tête sur chaque page? |
| include_footer | boolean | Pied de page? |
| include_page_numbers | boolean | Numéros de page? |
| watermark | text | Texte watermark (ex: CONFIDENTIEL) |
| is_system | boolean | Template système (non modifiable)? |
| is_active | boolean | Actif? |
| created_by | uuid | Créateur |

**Exemple Template:**
```json
{
  "name": "stock_status_report",
  "display_name": "État du Stock",
  "category": "logistics",
  "sql_query": "SELECT i.name, i.current_quantity, i.status FROM inventory_items i",
  "columns": [
    {"key": "name", "label": "Article", "width": 150},
    {"key": "current_quantity", "label": "Quantité", "width": 80, "align": "right"},
    {"key": "status", "label": "Statut", "width": 80}
  ],
  "default_format": "pdf",
  "supports_formats": ["pdf", "excel", "csv"]
}
```

---

### **2. generated_reports**
**Objectif:** Historique de tous les rapports générés

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant |
| template_id | uuid | Template utilisé |
| report_name | text | Nom fichier généré |
| format | report_format | pdf, excel, csv, json |
| status | report_status | pending, processing, completed, failed, cancelled |
| parameters | jsonb | Paramètres utilisés |
| date_range_start | date | Début période (si applicable) |
| date_range_end | date | Fin période |
| filters | jsonb | Filtres appliqués |
| file_url | text | URL fichier généré |
| file_size | integer | Taille en bytes |
| mime_type | text | Type MIME |
| rows_count | integer | Nombre de lignes exportées |
| started_at | timestamptz | Début génération |
| completed_at | timestamptz | Fin génération |
| generation_duration_ms | integer | Durée (millisecondes) |
| error_message | text | Message erreur si échec |
| error_details | jsonb | Détails erreur |
| generated_by | uuid | Qui a généré |
| is_scheduled | boolean | Généré automatiquement? |
| scheduled_report_id | uuid | Planification source |
| expires_at | timestamptz | Date expiration |
| downloaded_count | integer | Nombre téléchargements |
| last_downloaded_at | timestamptz | Dernier téléchargement |

**États (Status):**
- **pending:** En attente de génération
- **processing:** Génération en cours
- **completed:** Terminé avec succès ✅
- **failed:** Échec ❌
- **cancelled:** Annulé par utilisateur

**Exemple:**
```
Rapport: Etat_Stock_20241120.pdf
├── Template: État du Stock
├── Format: PDF
├── Statut: Complété ✅
├── Généré: 20/11/2024 08:32
├── Durée: 2,340 ms
├── Taille: 245 KB
├── Lignes: 50 articles
└── Téléchargements: 3 fois
```

---

### **3. scheduled_reports**
**Objectif:** Planification automatique de rapports

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant |
| template_id | uuid | Template à générer |
| name | text | Nom planification |
| description | text | Description |
| frequency | report_frequency | once, daily, weekly, monthly, quarterly, yearly |
| is_active | boolean | Actif? |
| format | report_format | Format sortie |
| parameters | jsonb | Paramètres fixes |
| filters | jsonb | Filtres fixes |
| email_recipients | text[] | Liste emails |
| include_link | boolean | Envoyer lien téléchargement? |
| attach_file | boolean | Attacher fichier email? |
| schedule_time | time | Heure exécution |
| schedule_day_of_week | integer | Jour semaine (0-6, 0=dimanche) |
| schedule_day_of_month | integer | Jour du mois (1-31) |
| custom_cron | text | Expression cron personnalisée |
| last_run_at | timestamptz | Dernière exécution |
| last_run_status | report_status | Statut dernière exec |
| last_run_error | text | Erreur dernière exec |
| next_run_at | timestamptz | Prochaine exécution |
| run_count | integer | Nombre exécutions |
| created_by | uuid | Créateur |

**Fréquences:**
- **once:** Une seule fois
- **daily:** Chaque jour
- **weekly:** Chaque semaine (jour spécifié)
- **monthly:** Chaque mois (jour spécifié)
- **quarterly:** Chaque trimestre
- **yearly:** Chaque année
- **custom:** Expression cron

**Exemples:**
```
Planification 1: Rapport Quotidien État Stock
├── Fréquence: Quotidien
├── Heure: 08:00
├── Format: PDF
├── Destinataires: logistique@hopital.cd
├── Dernière exéc: 19/11/2024 08:00 ✅
├── Prochaine: 20/11/2024 08:00
└── Total exécutions: 15

Planification 2: Rapport Hebdomadaire Mouvements
├── Fréquence: Hebdomadaire (Lundi)
├── Heure: 09:00
├── Format: Excel
├── Destinataires: logistique@, direction@
└── Prochaine: 25/11/2024 09:00
```

---

### **4. report_subscriptions**
**Objectif:** Abonnements utilisateurs aux rapports

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant |
| user_id | uuid | Utilisateur abonné |
| template_id | uuid | Template |
| preferred_format | report_format | Format préféré |
| frequency | report_frequency | Fréquence souhaitée |
| email_notifications | boolean | Recevoir emails? |
| default_parameters | jsonb | Paramètres par défaut |
| default_filters | jsonb | Filtres par défaut |
| is_active | boolean | Actif? |

**Exemple:**
```
Utilisateur: Jean Kabamba
└── Abonnements:
    ├── État du Stock
    │   ├── Format: PDF
    │   ├── Fréquence: Hebdomadaire
    │   └── Emails: Oui ✅
    └── Mouvements de Stock
        ├── Format: Excel
        ├── Fréquence: Mensuel
        └── Emails: Oui ✅
```

---

### **5. report_statistics** (Vue)
**Objectif:** Statistiques d'utilisation des rapports

**Colonnes calculées:**
- total_generated: Nombre total générations
- completed_count: Générations réussies
- failed_count: Générations échouées
- unique_users: Utilisateurs distincts
- avg_duration_ms: Durée moyenne génération
- total_file_size_bytes: Taille totale fichiers
- total_rows_exported: Lignes exportées total
- total_downloads: Téléchargements total
- pdf_count, excel_count, csv_count: Par format
- last_generated_at: Dernière génération
- first_generated_at: Première génération

**Exemple:**
```sql
SELECT * FROM report_statistics
WHERE template_name = 'État du Stock';

Résultat:
├── Total générations: 47
├── Réussies: 45 (95.7%)
├── Échouées: 2 (4.3%)
├── Utilisateurs: 8
├── Durée moyenne: 2,350 ms
├── Taille totale: 11.2 MB
├── Lignes exportées: 2,350
├── Téléchargements: 156
├── PDF: 30, Excel: 15, CSV: 2
└── Dernière génération: 20/11/2024 08:32
```

---

## ⚙️ Fonctions Automatiques

### **1. calculate_next_run()**
**Objectif:** Calculer prochaine exécution d'un rapport planifié

**Paramètres:**
- p_frequency: report_frequency
- p_schedule_time: time (défaut 08:00)
- p_day_of_week: integer (0-6)
- p_day_of_month: integer (1-31)
- p_from_date: timestamptz (défaut now)

**Retour:** timestamptz (prochaine exécution)

**Exemples:**
```sql
-- Quotidien à 8h
SELECT calculate_next_run('daily', '08:00:00');
-- Résultat: Demain 08:00

-- Hebdomadaire lundi 9h
SELECT calculate_next_run('weekly', '09:00:00', 1);
-- Résultat: Prochain lundi 09:00

-- Mensuel le 1er à 10h
SELECT calculate_next_run('monthly', '10:00:00', NULL, 1);
-- Résultat: 1er du mois prochain 10:00

-- Trimestriel le 15
SELECT calculate_next_run('quarterly', '10:00:00', NULL, 15);
-- Résultat: 15 du prochain trimestre 10:00
```

---

### **2. create_scheduled_report()**
**Objectif:** Créer un rapport planifié avec calcul auto prochaine exec

**Paramètres:**
- p_template_id: uuid
- p_name: text
- p_frequency: report_frequency
- p_format: report_format (défaut 'pdf')
- p_email_recipients: text[]
- p_schedule_time: time (défaut '08:00')
- p_created_by: uuid

**Retour:** uuid (ID planification créée)

**Exemple:**
```sql
SELECT create_scheduled_report(
  'template-uuid',
  'Rapport Quotidien Stock',
  'daily',
  'pdf',
  ARRAY['logistique@hopital.cd'],
  '08:00:00',
  auth.uid()
);
-- Résultat: uuid de la planification
-- next_run_at calculé automatiquement
```

---

### **3. cleanup_old_reports()**
**Objectif:** Nettoyer rapports expirés ou anciens

**Paramètre:**
- p_days_to_keep: integer (défaut 90 jours)

**Retour:** integer (nombre rapports supprimés)

**Logique:**
1. Supprime rapports avec expires_at dépassé
2. Supprime rapports > X jours sans date expiration

**Exemple:**
```sql
-- Nettoyer rapports > 90 jours
SELECT cleanup_old_reports();
-- Résultat: 23 (23 rapports supprimés)

-- Nettoyer rapports > 30 jours
SELECT cleanup_old_reports(30);
-- Résultat: 45
```

**Recommandation:** Exécuter automatiquement chaque nuit via cron.

---

## 🔄 Triggers Automatiques

### **1. update_updated_at triggers**
**Déclencheur:** BEFORE UPDATE

**Tables concernées:**
- report_templates
- scheduled_reports
- report_subscriptions

**Action:** Met à jour colonne `updated_at` automatiquement

---

### **2. calculate_duration_trigger**
**Déclencheur:** BEFORE UPDATE OF status ON generated_reports

**Condition:** Quand status passe à 'completed'

**Action:** Calcule `generation_duration_ms` automatiquement

**Formule:**
```sql
generation_duration_ms = (completed_at - started_at) * 1000
```

**Exemple:**
```sql
-- Mise à jour statut
UPDATE generated_reports
SET status = 'completed',
    completed_at = now()
WHERE id = 'report-uuid';

-- Trigger calcule automatiquement:
-- started_at: 08:30:00.000
-- completed_at: 08:30:02.340
-- → generation_duration_ms: 2340
```

---

## 🔒 Sécurité RLS (Row Level Security)

### **Templates de Rapports**

**Lecture (SELECT):**
- ✅ Tous utilisateurs authentifiés peuvent lire templates actifs

**Écriture (INSERT/UPDATE/DELETE):**
- ✅ Logisticiens, admins, personnel administratif uniquement

**Policies:**
```sql
-- Lecture tous
CREATE POLICY "All can read active templates"
  ON report_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Écriture admins
CREATE POLICY "Logisticians can manage templates"
  ON report_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician', 'administrative_staff')
    )
  );
```

---

### **Rapports Générés**

**Règle:** Chaque utilisateur voit uniquement SES rapports

**Exceptions:**
- ✅ Super admins voient TOUS les rapports

**Policies:**
```sql
-- Utilisateur voit ses rapports
CREATE POLICY "Users see own reports"
  ON generated_reports FOR SELECT
  TO authenticated
  USING (generated_by = auth.uid());

-- Admins voient tout
CREATE POLICY "Admins see all reports"
  ON generated_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name = 'super_admin'
    )
  );
```

---

### **Rapports Planifiés**

**Règle:** Créateur + admins/logisticiens

**Policies:**
```sql
-- Créateur gère ses planifications
CREATE POLICY "Users manage own scheduled reports"
  ON scheduled_reports FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Admins gèrent toutes planifications
CREATE POLICY "Admins manage all scheduled reports"
  ON scheduled_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician')
    )
  );
```

---

### **Abonnements**

**Règle:** Utilisateur gère UNIQUEMENT ses propres abonnements

**Policy:**
```sql
CREATE POLICY "Users manage own subscriptions"
  ON report_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## 📋 Templates Prédéfinis

### **1. État du Stock** (logistics)
**Nom:** `stock_status_report`
**Format:** PDF (supporte Excel, CSV)
**Période:** Non (snapshot actuel)

**Données exportées:**
- Article, Code SKU, Catégorie
- Stock actuel, Min, Max
- Prix unitaire, Valeur totale
- Localisation, Statut
- Fournisseur, Date expiration

**Cas d'usage:** Inventaire mensuel, rapport direction

---

### **2. Mouvements de Stock** (logistics)
**Nom:** `stock_movements_report`
**Format:** Excel (supporte PDF, CSV)
**Période:** Oui (date début/fin)

**Données exportées:**
- Date/heure mouvement
- Article, Type mouvement
- Quantité, Stock avant/après
- Raison, Référence
- Effectué par

**Cas d'usage:** Audit, analyse consommation, rapprochement

---

### **3. Alertes Actives** (logistics)
**Nom:** `active_alerts_report`
**Format:** PDF
**Période:** Non (alertes actuelles)

**Données exportées:**
- Type alerte, Sévérité
- Article, Code
- Stock actuel vs minimum
- Message alerte
- Date création, Acquittée?

**Cas d'usage:** Réunion quotidienne, priorisation urgences

---

### **4. Inventaire Complet** (logistics)
**Nom:** `complete_inventory_report`
**Format:** Excel (landscape)
**Période:** Non

**Données exportées:**
- Catégorie, Article, Code
- Quantité, Unité
- Prix unitaire, Valeur
- Localisation, Lot, Expiration
- Fournisseur

**Cas d'usage:** Inventaire physique annuel, valorisation stock

---

### **5. Performance Fournisseurs** (suppliers)
**Nom:** `supplier_performance_report`
**Format:** Excel
**Période:** Non (stats globales)

**Données exportées:**
- Fournisseur, Rating
- Nb commandes, Montant total
- Commande moyenne
- Taux ponctualité, conformité
- Dernière évaluation

**Cas d'usage:** Évaluation trimestrielle, négociations contrats

---

### **6. Bons de Commande** (suppliers)
**Nom:** `purchase_orders_report`
**Format:** PDF
**Période:** Oui

**Données exportées:**
- Numéro commande, Fournisseur
- Dates (commande, prévue, réelle)
- Statut, Montant, Devise
- Conditions paiement
- Créé par

**Cas d'usage:** Suivi commandes, rapprochement comptable

---

### **7. Présences Personnel** (hr)
**Nom:** `staff_attendance_report`
**Format:** Excel
**Période:** Oui

**Données exportées:**
- Employé, Rôle, Département
- Date, Heure entrée/sortie
- Heures travaillées
- Statut

**Cas d'usage:** Paie mensuelle, suivi assiduité

---

### **8. Consultations Médicales** (medical)
**Nom:** `medical_consultations_report`
**Format:** PDF
**Période:** Oui

**Données exportées:**
- Date consultation
- Patient, N° patient
- Docteur, Service
- Diagnostic, Traitement
- Statut

**Cas d'usage:** Statistiques mensuelles, indicateurs santé

---

## 🔄 Workflows Complets

### **Workflow 1: Générer Rapport à la Demande**

**Étapes:**

1. **Choisir Template**
```sql
SELECT id, display_name, category, default_format
FROM report_templates
WHERE is_active = true
ORDER BY category, display_name;
```

2. **Créer Demande Génération**
```sql
INSERT INTO generated_reports (
  template_id,
  report_name,
  format,
  status,
  date_range_start,
  date_range_end,
  parameters,
  generated_by,
  started_at
) VALUES (
  'template-uuid',
  'Mouvements_Stock_Novembre_2024.xlsx',
  'excel',
  'pending',
  '2024-11-01',
  '2024-11-20',
  '{"include_transfers": true}'::jsonb,
  auth.uid(),
  now()
);
```

3. **Traitement (Backend)**
```javascript
// Récupérer template
const template = await supabase
  .from('report_templates')
  .select('*')
  .eq('id', templateId)
  .single();

// Exécuter requête SQL
const { data } = await supabase.rpc('execute_report_query', {
  query: template.sql_query,
  params: reportParams
});

// Générer fichier (PDF/Excel/CSV)
const fileBuffer = await generateFile(data, template.columns, format);

// Upload vers storage
const { data: upload } = await supabase.storage
  .from('reports')
  .upload(fileName, fileBuffer);

// Mettre à jour statut
await supabase
  .from('generated_reports')
  .update({
    status: 'completed',
    completed_at: new Date(),
    file_url: upload.path,
    file_size: fileBuffer.length,
    rows_count: data.length
  })
  .eq('id', reportId);
```

4. **Téléchargement**
```sql
-- Incrémenter compteur
UPDATE generated_reports
SET downloaded_count = downloaded_count + 1,
    last_downloaded_at = now()
WHERE id = 'report-uuid';
```

---

### **Workflow 2: Planifier Rapport Automatique**

**Étapes:**

1. **Créer Planification**
```sql
SELECT create_scheduled_report(
  (SELECT id FROM report_templates WHERE name = 'stock_status_report'),
  'Rapport Quotidien État Stock',
  'daily',
  'pdf',
  ARRAY['logistique@hopital.cd', 'direction@hopital.cd'],
  '08:00:00',
  auth.uid()
);
```

2. **Exécution Automatique (Cron Job)**
```javascript
// Chaque minute, vérifier planifications dues
const { data: dueReports } = await supabase
  .from('scheduled_reports')
  .select('*')
  .eq('is_active', true)
  .lte('next_run_at', new Date())
  .order('next_run_at');

for (const scheduled of dueReports) {
  // Générer rapport
  const reportId = await generateReport(scheduled.template_id, {
    format: scheduled.format,
    parameters: scheduled.parameters,
    is_scheduled: true,
    scheduled_report_id: scheduled.id
  });

  // Envoyer email si configuré
  if (scheduled.email_recipients.length > 0) {
    await sendEmailNotification(scheduled.email_recipients, reportId);
  }

  // Mettre à jour planification
  const nextRun = calculateNextRun(scheduled.frequency, scheduled.schedule_time);

  await supabase
    .from('scheduled_reports')
    .update({
      last_run_at: new Date(),
      last_run_status: 'completed',
      next_run_at: nextRun,
      run_count: scheduled.run_count + 1
    })
    .eq('id', scheduled.id);
}
```

---

### **Workflow 3: S'abonner à un Rapport**

**Étapes:**

1. **Créer Abonnement**
```sql
INSERT INTO report_subscriptions (
  user_id,
  template_id,
  preferred_format,
  frequency,
  email_notifications,
  default_parameters
) VALUES (
  auth.uid(),
  (SELECT id FROM report_templates WHERE name = 'stock_movements_report'),
  'excel',
  'monthly',
  true,
  '{"include_adjustments": false}'::jsonb
);
```

2. **Notification Automatique**
```javascript
// Lors génération rapport planifié
const { data: subscriptions } = await supabase
  .from('report_subscriptions')
  .select('user_id')
  .eq('template_id', templateId)
  .eq('is_active', true)
  .eq('email_notifications', true);

for (const sub of subscriptions) {
  const user = await getUserEmail(sub.user_id);
  await sendEmail(user.email, {
    subject: `Nouveau rapport: ${reportName}`,
    body: `Votre rapport ${reportName} est disponible.`,
    link: `/reports/${reportId}`
  });
}
```

---

## 📊 Requêtes Utiles

### **Dashboard Rapports Utilisateur**

```sql
SELECT
  gr.id,
  rt.display_name as template,
  gr.report_name,
  gr.format,
  gr.status,
  TO_CHAR(gr.created_at, 'DD/MM/YYYY HH24:MI') as genere_le,
  gr.generation_duration_ms,
  ROUND(gr.file_size / 1024.0, 2) as taille_kb,
  gr.rows_count,
  gr.downloaded_count
FROM generated_reports gr
JOIN report_templates rt ON gr.template_id = rt.id
WHERE gr.generated_by = auth.uid()
ORDER BY gr.created_at DESC
LIMIT 20;
```

---

### **Rapports les Plus Générés**

```sql
SELECT
  template_name,
  category,
  total_generated,
  unique_users,
  ROUND(avg_duration_ms / 1000.0, 2) as avg_seconds,
  pdf_count,
  excel_count,
  csv_count,
  TO_CHAR(last_generated_at, 'DD/MM/YYYY HH24:MI') as derniere_generation
FROM report_statistics
ORDER BY total_generated DESC
LIMIT 10;
```

---

### **Planifications Actives**

```sql
SELECT
  sr.name,
  rt.display_name as template,
  sr.frequency,
  TO_CHAR(sr.schedule_time, 'HH24:MI') as heure,
  sr.format,
  ARRAY_LENGTH(sr.email_recipients, 1) as nb_destinataires,
  TO_CHAR(sr.last_run_at, 'DD/MM/YYYY HH24:MI') as derniere_exec,
  sr.last_run_status,
  TO_CHAR(sr.next_run_at, 'DD/MM/YYYY HH24:MI') as prochaine_exec,
  sr.run_count
FROM scheduled_reports sr
JOIN report_templates rt ON sr.template_id = rt.id
WHERE sr.is_active = true
ORDER BY sr.next_run_at;
```

---

### **Rapports Échoués à Réessayer**

```sql
SELECT
  gr.id,
  rt.display_name as template,
  gr.report_name,
  gr.error_message,
  TO_CHAR(gr.created_at, 'DD/MM/YYYY HH24:MI') as date_echec,
  up.full_name as utilisateur
FROM generated_reports gr
JOIN report_templates rt ON gr.template_id = rt.id
JOIN user_profiles up ON gr.generated_by = up.id
WHERE gr.status = 'failed'
  AND gr.created_at > now() - INTERVAL '7 days'
ORDER BY gr.created_at DESC;
```

---

### **Statistiques Mensuelles**

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', created_at), 'MM/YYYY') as mois,
  COUNT(*) as total_rapports,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as reussis,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as echecs,
  ROUND(AVG(generation_duration_ms) / 1000.0, 2) as duree_moyenne_sec,
  COUNT(DISTINCT generated_by) as utilisateurs_uniques,
  SUM(file_size) / 1024 / 1024 as taille_totale_mb
FROM generated_reports
WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY DATE_TRUNC('month', created_at) DESC;
```

---

## 🎯 Cas d'Usage

### **Cas 1: Rapport Inventaire Mensuel**

**Contexte:** Fin de mois, comptable demande valorisation stock

**Actions:**
1. Accéder module Rapports
2. Choisir template "Inventaire Complet"
3. Format: Excel
4. Générer
5. Télécharger fichier
6. Envoyer à comptabilité

**Automatisation possible:**
- Planifier génération auto le 1er de chaque mois
- Envoi email automatique à comptabilite@hopital.cd

---

### **Cas 2: Audit Mouvements Trimestriel**

**Contexte:** Audit interne, vérifier mouvements Q4 2024

**Actions:**
1. Template: "Mouvements de Stock"
2. Période: 01/10/2024 → 31/12/2024
3. Format: Excel
4. Filtres: Tous types mouvements
5. Générer
6. Analyser anomalies
7. Justifier écarts

---

### **Cas 3: Tableau de Bord Direction**

**Contexte:** Réunion direction hebdomadaire, présenter KPIs

**Actions:**
1. Générer plusieurs rapports:
   - État du Stock (PDF)
   - Alertes Actives (PDF)
   - Performance Fournisseurs (Excel)
   - Présences Personnel (Excel)
2. Compiler dans présentation
3. Présenter en réunion

**Automatisation:**
- Abonnement hebdomadaire (Lundi matin)
- Email automatique à direction@hopital.cd

---

## 🚀 Prochaines Étapes

### **Phase 6A: Interfaces UI**
- [ ] Page liste templates avec filtres
- [ ] Générateur interactif (wizard)
- [ ] Preview données avant export
- [ ] Queue génération temps réel
- [ ] Historique avec recherche

### **Phase 6B: Exports Avancés**
- [ ] Charts dans PDF (graphiques)
- [ ] Tableaux croisés dynamiques Excel
- [ ] Exports multi-feuilles
- [ ] Formats additionnels (Word, HTML)
- [ ] Compression ZIP multi-rapports

### **Phase 6C: Automatisations**
- [ ] Cron job pour planifications
- [ ] Envoi emails avec attachements
- [ ] Notifications push mobiles
- [ ] Webhooks post-génération
- [ ] Intégration stockage cloud

### **Phase 6D: Analytics**
- [ ] Dashboard analytics rapports
- [ ] Recommandations intelligentes
- [ ] Prédictions volumes
- [ ] Optimisation performances
- [ ] Détection anomalies

---

## 📈 Métriques de Succès

**Indicateurs Phase 6:**
- ✅ 4 tables créées
- ✅ 8 templates prédéfinis
- ✅ 3 fonctions automatiques
- ✅ Vue statistiques
- ✅ RLS sécurisé
- ✅ Données démo complètes

**KPIs à suivre:**
- Nombre rapports générés/mois
- Temps moyen génération
- Taux succès/échec
- Utilisation par template
- Satisfaction utilisateurs
- Volume téléchargements

---

**Version:** 1.0
**Dernière mise à jour:** 20 Novembre 2024
**Statut:** ✅ Production Ready

*Document confidentiel - Usage interne uniquement*
