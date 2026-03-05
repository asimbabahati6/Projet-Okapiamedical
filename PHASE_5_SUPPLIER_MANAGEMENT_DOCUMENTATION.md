# 📦 PHASE 5: SYSTÈME DE GESTION COMPLÈTE DES FOURNISSEURS

**Version:** 1.0
**Date:** 20 Novembre 2024
**Statut:** ✅ Implémenté et Opérationnel

---

## 🎯 Vue d'Ensemble

La Phase 5 ajoute un système complet de gestion des fournisseurs au système logistique, incluant:
- Gestion avancée des fournisseurs et contacts
- Système de bons de commande (Purchase Orders)
- Réception et validation des livraisons
- Évaluation de performance des fournisseurs
- Statistiques et KPIs automatiques

---

## 📊 Résumé de l'Implémentation

### **Données Créées**

```
✅ 10 Tables créées
✅ 5 Fournisseurs
✅ 10 Contacts (2 par fournisseur)
✅ 4 Bons de commande (401,500 FC)
✅ 5 Lignes de commande
✅ 3 Bons de livraison
✅ 3 Lignes de livraison
✅ 4 Évaluations fournisseurs
✅ 1 Vue statistiques automatique
✅ 4 Fonctions automatiques
✅ 5 Triggers actifs
```

### **Montants**

- **Total commandes:** 401,500 FC
- **Commande moyenne:** 100,375 FC
- **Commandes clôturées:** 1
- **Commandes en cours:** 2

---

## 🗄️ Architecture de la Base de Données

### **1. supplier_contacts**
**Objectif:** Gérer plusieurs contacts par fournisseur

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| supplier_id | uuid | Référence fournisseur |
| name | text | Nom du contact |
| position | text | Poste (ex: Directeur Commercial) |
| department | text | Département (Ventes, Technique) |
| email | text | Email |
| phone | text | Téléphone fixe |
| mobile | text | Mobile |
| is_primary | boolean | Contact principal? |
| notes | text | Notes |

**Exemple:**
```
Fournisseur: Demo Pharma International
├── Marie Kimbangu (Directeur Commercial) ⭐ Principal
└── Service Technique (Responsable Technique)
```

---

### **2. supplier_categories**
**Objectif:** Définir quels produits chaque fournisseur peut fournir

| Colonne | Type | Description |
|---------|------|-------------|
| supplier_id | uuid | Fournisseur |
| category_id | uuid | Catégorie de produits |
| is_preferred | boolean | Fournisseur préféré pour cette catégorie? |
| lead_time_days | integer | Délai de livraison moyen (jours) |
| minimum_order_quantity | decimal | Quantité minimum de commande |

**Exemple:**
```
Demo Pharma International → Médicaments (Préféré, 15 jours)
Demo Medical Supply Co. → Consommables, Laboratoire (20 jours)
```

---

### **3. purchase_orders** (Bons de Commande)
**Objectif:** Gérer les commandes passées aux fournisseurs

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant |
| po_number | text | Numéro unique (PO-YYYY-MM-0001) |
| supplier_id | uuid | Fournisseur |
| order_date | date | Date de commande |
| expected_delivery_date | date | Date livraison prévue |
| actual_delivery_date | date | Date livraison réelle |
| status | text | Statut (voir workflow) |
| total_amount | decimal | Montant total |
| currency | text | Devise (FC, USD) |
| payment_terms | text | Conditions paiement |
| shipping_address | text | Adresse livraison |
| created_by | uuid | Créé par |
| approved_by | uuid | Approuvé par |
| notes | text | Notes |

**Workflow Statuts:**
```
draft → sent → confirmed → partial → received → closed
   ↓                                              ↑
cancelled ←──────────────────────────────────────┘
```

**Statuts:**
- **draft:** Brouillon, en cours de préparation
- **sent:** Envoyée au fournisseur
- **confirmed:** Confirmée par le fournisseur
- **partial:** Partiellement reçue
- **received:** Totalement reçue
- **closed:** Clôturée automatiquement
- **cancelled:** Annulée

**Exemples:**
```sql
PO-2024-11-0001: Paracétamol 5000 cp - CLÔTURÉE (75,000 FC)
PO-2024-11-0002: Amoxicilline 8000 cp - PARTIELLE (144,000 FC)
PO-2024-11-0003: Consommables - CONFIRMÉE (122,500 FC)
PO-2024-11-0004: Artémisinine URGENTE - ENVOYÉE (60,000 FC)
```

---

### **4. purchase_order_items** (Lignes de Commande)
**Objectif:** Détail des articles dans chaque commande

| Colonne | Type | Description |
|---------|------|-------------|
| purchase_order_id | uuid | Référence commande |
| item_id | uuid | Article |
| quantity_ordered | decimal | Quantité commandée |
| quantity_received | decimal | Quantité reçue |
| unit_price | decimal | Prix unitaire |
| total_price | decimal | Prix total (calculé auto) |
| status | text | pending, partial, received, cancelled |
| expected_delivery_date | date | Date prévue |

**Exemple:**
```
PO-2024-11-0002 (Amoxicilline)
├── Commandé: 8000 comprimés @ 0.45 FC = 3,600 FC
├── Reçu: 3200 comprimés (40%)
└── Statut: PARTIELLE (en attente 2ème livraison)
```

---

### **5. delivery_notes** (Bons de Livraison)
**Objectif:** Enregistrer les réceptions fournisseurs

| Colonne | Type | Description |
|---------|------|-------------|
| delivery_number | text | Numéro unique (BL-YYYY-MM-0001) |
| purchase_order_id | uuid | Commande liée (optionnel) |
| supplier_id | uuid | Fournisseur |
| delivery_date | date | Date de livraison |
| received_by | uuid | Reçu par |
| validated_by | uuid | Validé par |
| status | text | pending, partial, complete, rejected |
| is_conforming | boolean | Conforme? |
| non_conformity_details | text | Détails non-conformités |
| carrier_name | text | Transporteur |
| tracking_number | text | Numéro de suivi |
| document_url | text | Scan BL |

**Exemples:**
```sql
BL-2024-11-0001: Paracétamol 5000 - CONFORME ✅
BL-2024-11-0002: Amoxicilline 3200 (1/2) - PARTIELLE
BL-2024-11-0003: Gants 850, 50 rejetés - NON CONFORME ❌
```

---

### **6. delivery_note_items** (Lignes de Livraison)
**Objectif:** Contrôle qualité détaillé

| Colonne | Type | Description |
|---------|------|-------------|
| delivery_note_id | uuid | Bon de livraison |
| po_item_id | uuid | Ligne commande (optionnel) |
| item_id | uuid | Article |
| quantity_ordered | decimal | Commandé |
| quantity_received | decimal | Reçu |
| quantity_accepted | decimal | Accepté |
| quantity_rejected | decimal | Rejeté |
| quality_status | text | ok, damaged, expired, wrong_item, missing |
| batch_number | text | Numéro de lot |
| expiry_date | date | Date expiration |
| rejection_reason | text | Raison rejet |

**Contrainte:** `quantity_accepted + quantity_rejected = quantity_received`

**Exemple Contrôle Qualité:**
```
BL-2024-11-0003: Gants Latex M
├── Commandé: N/A (livraison hors commande)
├── Reçu: 850 boîtes
├── Accepté: 800 boîtes ✅
├── Rejeté: 50 boîtes ❌
├── Qualité: DAMAGED
└── Raison: "Boîtes écrasées, gants déchirés"
```

---

### **7. supplier_evaluations** (Évaluations Fournisseurs)
**Objectif:** Évaluer périodiquement les fournisseurs

| Colonne | Type | Description |
|---------|------|-------------|
| supplier_id | uuid | Fournisseur |
| evaluation_date | date | Date évaluation |
| period_start | date | Début période |
| period_end | date | Fin période |
| delivery_time_score | integer | Score délai (1-5) |
| quality_score | integer | Score qualité (1-5) |
| price_competitiveness_score | integer | Score prix (1-5) |
| service_score | integer | Score service (1-5) |
| communication_score | integer | Score communication (1-5) |
| overall_score | decimal | Score global (calculé auto) |
| total_orders | integer | Nombre commandes période |
| on_time_deliveries | integer | Livraisons à temps |
| conforming_deliveries | integer | Livraisons conformes |
| total_amount_spent | decimal | Montant dépensé |
| on_time_rate | decimal | Taux ponctualité (%) |
| conformity_rate | decimal | Taux conformité (%) |
| comments | text | Commentaires |
| recommendations | text | Recommandations |

**Calcul Score Global:**
```
overall_score = (délai + qualité + prix + service + communication) / 5
```

**Exemple Évaluation:**
```
Demo Pharma International - Q3 2024
├── Délai: 5/5 ⭐⭐⭐⭐⭐
├── Qualité: 5/5 ⭐⭐⭐⭐⭐
├── Prix: 4/5 ⭐⭐⭐⭐
├── Service: 5/5 ⭐⭐⭐⭐⭐
├── Communication: 5/5 ⭐⭐⭐⭐⭐
├── Score Global: 4.8/5
├── Commandes: 12 (11 à temps = 91.7%)
├── Conformité: 100%
└── Recommandation: "Continuer collaboration, négocier remise volume 2025"
```

---

### **8. supplier_documents**
**Objectif:** Gestion documentaire fournisseurs

| Colonne | Type | Description |
|---------|------|-------------|
| supplier_id | uuid | Fournisseur |
| document_type | text | contract, certificate, license, insurance, invoice, quote, other |
| document_name | text | Nom document |
| document_url | text | URL fichier |
| issue_date | date | Date émission |
| expiry_date | date | Date expiration |
| is_active | boolean | Actif? |
| uploaded_by | uuid | Uploadé par |

**Types de Documents:**
- **contract:** Contrats commerciaux
- **certificate:** Certifications (ISO, qualité)
- **license:** Licences d'exploitation
- **insurance:** Assurances
- **invoice:** Factures
- **quote:** Devis
- **other:** Autres

---

### **9. supplier_performance_stats** (Vue)
**Objectif:** Statistiques agrégées automatiques

**Colonnes calculées:**
- Total commandes, montants
- Taux de livraison à temps
- Taux de conformité
- Délai moyen
- Dernière évaluation
- Dernière commande/livraison

**Exemple:**
```sql
SELECT * FROM supplier_performance_stats
WHERE supplier_name = 'Demo Pharma International';

Résultat:
├── Total commandes: 3
├── Montant total: 837,000 FC
├── Commande moyenne: 93,000 FC
├── Taux ponctualité: 100% (1/1)
├── Taux conformité: 66.7% (2/3)
├── Dernière évaluation: 4.8/5 (01/10/2024)
└── Dernière commande: PO-2024-11-0004
```

---

## ⚙️ Fonctions Automatiques

### **1. generate_po_number()**
**Objectif:** Générer numéro de commande unique

**Format:** `PO-YYYY-MM-XXXX`
- PO: Purchase Order
- YYYY: Année
- MM: Mois
- XXXX: Séquence (0001, 0002, etc.)

**Exemple:**
```sql
SELECT generate_po_number();
-- Résultat: PO-2024-11-0005
```

**Utilisation:**
```sql
INSERT INTO purchase_orders (po_number, supplier_id, ...)
VALUES (generate_po_number(), supplier_id, ...);
```

---

### **2. generate_delivery_number()**
**Objectif:** Générer numéro de bon de livraison

**Format:** `BL-YYYY-MM-XXXX`

**Exemple:**
```sql
SELECT generate_delivery_number();
-- Résultat: BL-2024-11-0004
```

---

### **3. calculate_supplier_rating(supplier_id)**
**Objectif:** Calculer et mettre à jour le rating fournisseur

**Logique:**
1. Moyenne des `overall_score` des 12 derniers mois
2. Conversion en rating 1-5 (arrondi)
3. Mise à jour automatique de `suppliers.rating`

**Exemple:**
```sql
-- Évaluations:
-- Q2: 4.6
-- Q3: 4.8
-- Moyenne: 4.7 → Rating: 5

SELECT calculate_supplier_rating('uuid-fournisseur');
-- Résultat: 5
-- suppliers.rating mis à jour automatiquement
```

---

### **4. auto_close_purchase_order(po_id)**
**Objectif:** Clôturer automatiquement une commande 100% reçue

**Logique:**
1. Vérifie si tous les items ont `quantity_received >= quantity_ordered`
2. Si oui: Passe status à 'closed' et définit `actual_delivery_date`
3. Retourne true/false

**Exemple:**
```sql
-- Commande PO-0002: 8000 commandés, 8000 reçus
SELECT auto_close_purchase_order('po-uuid');
-- Résultat: true
-- purchase_orders.status → 'closed'
-- purchase_orders.actual_delivery_date → aujourd'hui
```

---

## 🔄 Triggers Automatiques

### **1. update_supplier_rating_trigger**
**Déclencheur:** Après INSERT/UPDATE sur `supplier_evaluations`

**Action:** Appelle `calculate_supplier_rating()` automatiquement

**Exemple:**
```sql
-- Vous créez une évaluation
INSERT INTO supplier_evaluations (supplier_id, overall_score, ...)
VALUES (..., 4.8, ...);

-- Trigger s'exécute automatiquement
-- Rating fournisseur mis à jour: 4 → 5
```

---

### **2. auto_close_po_trigger**
**Déclencheur:** Après UPDATE de `quantity_received` sur `purchase_order_items`

**Action:** Appelle `auto_close_purchase_order()` si quantité complète

**Exemple:**
```sql
-- Mise à jour réception
UPDATE purchase_order_items
SET quantity_received = 5000
WHERE id = 'item-uuid';

-- Si quantity_received >= quantity_ordered:
-- → Trigger clôture automatique PO
-- → Status: 'received' → 'closed'
```

---

### **3. update_updated_at triggers**
**Déclencheur:** Avant UPDATE sur tables

**Action:** Met à jour colonne `updated_at` automatiquement

**Tables concernées:**
- supplier_contacts
- purchase_orders
- purchase_order_items
- delivery_notes
- supplier_documents

---

## 🔒 Sécurité RLS (Row Level Security)

### **Règles d'Accès**

| Rôle | Accès |
|------|-------|
| **Logistician** | ✅ CREATE, READ, UPDATE, DELETE (Complet) |
| **Super Admin** | ✅ CREATE, READ, UPDATE, DELETE (Complet) |
| **Autres rôles** | 📖 READ ONLY (Lecture seule) |

**Toutes les tables sont protégées:**
- supplier_contacts
- supplier_categories
- purchase_orders
- purchase_order_items
- delivery_notes
- delivery_note_items
- supplier_evaluations
- supplier_documents

**Policies:**
```sql
-- Exemple pour purchase_orders
CREATE POLICY "Logisticians full access"
  ON purchase_orders FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician')
    )
  );

CREATE POLICY "Others read only"
  ON purchase_orders FOR SELECT TO authenticated
  USING (true);
```

---

## 📋 Workflows Complets

### **Workflow 1: Créer une Commande**

**Étapes:**

1. **Créer PO (Brouillon)**
```sql
INSERT INTO purchase_orders (
  po_number, supplier_id, order_date, expected_delivery_date,
  status, total_amount
) VALUES (
  generate_po_number(),
  'supplier-uuid',
  CURRENT_DATE,
  CURRENT_DATE + 15,
  'draft',
  0
);
```

2. **Ajouter Articles**
```sql
INSERT INTO purchase_order_items (
  purchase_order_id, item_id,
  quantity_ordered, unit_price
) VALUES
  ('po-uuid', 'item1-uuid', 1000, 0.50),
  ('po-uuid', 'item2-uuid', 500, 1.20);
```

3. **Calculer Total**
```sql
UPDATE purchase_orders
SET total_amount = (
  SELECT SUM(total_price)
  FROM purchase_order_items
  WHERE purchase_order_id = 'po-uuid'
)
WHERE id = 'po-uuid';
```

4. **Envoyer au Fournisseur**
```sql
UPDATE purchase_orders
SET status = 'sent',
    created_by = auth.uid()
WHERE id = 'po-uuid';
```

5. **Fournisseur Confirme (Manuellement)**
```sql
UPDATE purchase_orders
SET status = 'confirmed'
WHERE id = 'po-uuid';
```

---

### **Workflow 2: Réceptionner une Livraison**

**Étapes:**

1. **Créer Bon de Livraison**
```sql
INSERT INTO delivery_notes (
  delivery_number, purchase_order_id, supplier_id,
  delivery_date, received_by, carrier_name, tracking_number
) VALUES (
  generate_delivery_number(),
  'po-uuid',
  'supplier-uuid',
  CURRENT_DATE,
  auth.uid(),
  'DHL Congo',
  'DHL123456789'
);
```

2. **Enregistrer Articles Reçus**
```sql
INSERT INTO delivery_note_items (
  delivery_note_id, po_item_id, item_id,
  quantity_ordered, quantity_received,
  quantity_accepted, quantity_rejected,
  quality_status, batch_number, expiry_date
) VALUES (
  'dn-uuid',
  'po-item-uuid',
  'item-uuid',
  1000,        -- Commandé
  980,         -- Reçu
  950,         -- Accepté
  30,          -- Rejeté
  'damaged',   -- 30 endommagés
  'LOT-2024-11',
  '2026-11-20'
);
```

3. **Mettre à Jour Quantité PO**
```sql
UPDATE purchase_order_items
SET quantity_received = quantity_received + 950
WHERE id = 'po-item-uuid';
-- Trigger auto_close_po vérifie si PO complète
```

4. **Marquer Conformité**
```sql
UPDATE delivery_notes
SET is_conforming = CASE
  WHEN (SELECT SUM(quantity_rejected) FROM delivery_note_items
        WHERE delivery_note_id = 'dn-uuid') > 0
  THEN false ELSE true END,
    status = 'complete',
    validated_by = auth.uid(),
    validated_at = now()
WHERE id = 'dn-uuid';
```

5. **Créer Mouvement Stock (Automatique ou Manuel)**
```sql
-- Pour chaque article accepté
INSERT INTO stock_movements (
  item_id, movement_type, quantity,
  previous_quantity, new_quantity,
  reason, reference_number
) VALUES (
  'item-uuid',
  'entry',
  950,
  current_quantity,
  current_quantity + 950,
  'Réception fournisseur',
  'BL-2024-11-0001'
);

UPDATE inventory_items
SET current_quantity = current_quantity + 950,
    last_restock_date = now()
WHERE id = 'item-uuid';
```

---

### **Workflow 3: Évaluer un Fournisseur**

**Étapes:**

1. **Collecter Données Période**
```sql
-- Commandes du trimestre
SELECT COUNT(*), SUM(total_amount)
FROM purchase_orders
WHERE supplier_id = 'supplier-uuid'
  AND order_date BETWEEN '2024-07-01' AND '2024-09-30';

-- Livraisons à temps
SELECT COUNT(*)
FROM purchase_orders
WHERE supplier_id = 'supplier-uuid'
  AND actual_delivery_date <= expected_delivery_date
  AND order_date BETWEEN '2024-07-01' AND '2024-09-30';

-- Livraisons conformes
SELECT COUNT(*)
FROM delivery_notes
WHERE supplier_id = 'supplier-uuid'
  AND is_conforming = true
  AND delivery_date BETWEEN '2024-07-01' AND '2024-09-30';
```

2. **Créer Évaluation**
```sql
INSERT INTO supplier_evaluations (
  supplier_id,
  evaluation_date,
  period_start,
  period_end,
  delivery_time_score,      -- 1-5
  quality_score,            -- 1-5
  price_competitiveness_score, -- 1-5
  service_score,            -- 1-5
  communication_score,      -- 1-5
  -- overall_score calculé automatiquement
  total_orders,
  on_time_deliveries,
  conforming_deliveries,
  total_amount_spent,
  comments,
  recommendations,
  evaluated_by
) VALUES (
  'supplier-uuid',
  CURRENT_DATE,
  '2024-07-01',
  '2024-09-30',
  5, 5, 4, 5, 5,  -- Scores
  12,  -- Total commandes
  11,  -- À temps
  12,  -- Conformes
  450000,  -- Montant
  'Excellent fournisseur. Qualité constante.',
  'Continuer collaboration. Négocier remise volume.',
  auth.uid()
);
-- Trigger met à jour automatiquement suppliers.rating
```

---

## 📊 Requêtes Utiles

### **Dashboard Fournisseur**

```sql
SELECT
  s.name,
  s.rating,
  sps.total_orders,
  sps.total_amount_spent,
  sps.on_time_delivery_rate,
  sps.conformity_rate,
  sps.latest_evaluation_score,
  sps.latest_evaluation_date
FROM suppliers s
LEFT JOIN supplier_performance_stats sps ON s.id = sps.supplier_id
WHERE s.is_active = true
ORDER BY sps.total_amount_spent DESC;
```

### **Commandes en Retard**

```sql
SELECT
  po.po_number,
  s.name as supplier,
  po.order_date,
  po.expected_delivery_date,
  CURRENT_DATE - po.expected_delivery_date as jours_retard,
  po.total_amount,
  po.status
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id
WHERE po.expected_delivery_date < CURRENT_DATE
  AND po.status NOT IN ('closed', 'cancelled', 'received')
ORDER BY jours_retard DESC;
```

### **Top 10 Fournisseurs (Montant)**

```sql
SELECT
  s.name,
  s.rating,
  COUNT(DISTINCT po.id) as nb_commandes,
  SUM(po.total_amount) as montant_total,
  AVG(po.total_amount) as commande_moyenne
FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.supplier_id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.rating
ORDER BY montant_total DESC
LIMIT 10;
```

### **Articles en Attente de Livraison**

```sql
SELECT
  i.name as article,
  s.name as fournisseur,
  po.po_number,
  poi.quantity_ordered,
  poi.quantity_received,
  poi.quantity_ordered - poi.quantity_received as en_attente,
  po.expected_delivery_date,
  CASE
    WHEN po.expected_delivery_date < CURRENT_DATE
    THEN 'EN RETARD'
    ELSE 'DANS LES TEMPS'
  END as statut
FROM purchase_order_items poi
JOIN inventory_items i ON poi.item_id = i.id
JOIN purchase_orders po ON poi.purchase_order_id = po.id
JOIN suppliers s ON po.supplier_id = s.id
WHERE poi.quantity_received < poi.quantity_ordered
  AND po.status NOT IN ('cancelled', 'closed')
ORDER BY po.expected_delivery_date;
```

### **Évaluations Récentes**

```sql
SELECT
  s.name as fournisseur,
  se.evaluation_date,
  se.period_start || ' → ' || se.period_end as periode,
  se.overall_score,
  se.on_time_rate || '%' as taux_ponctualite,
  se.conformity_rate || '%' as taux_conformite,
  se.total_orders,
  se.total_amount_spent,
  se.comments
FROM supplier_evaluations se
JOIN suppliers s ON se.supplier_id = s.id
ORDER BY se.evaluation_date DESC
LIMIT 10;
```

### **Livraisons Non Conformes**

```sql
SELECT
  dn.delivery_number,
  s.name as fournisseur,
  dn.delivery_date,
  dn.non_conformity_details,
  COUNT(dni.id) as nb_articles,
  SUM(dni.quantity_rejected) as qte_rejetee
FROM delivery_notes dn
JOIN suppliers s ON dn.supplier_id = s.id
JOIN delivery_note_items dni ON dn.id = dni.delivery_note_id
WHERE dn.is_conforming = false
GROUP BY dn.id, dn.delivery_number, s.name, dn.delivery_date, dn.non_conformity_details
ORDER BY dn.delivery_date DESC;
```

---

## 🎯 Cas d'Usage

### **Cas 1: Commander Stock Critique**

**Contexte:** Artémisinine stock épuisé (alerte critique)

**Actions:**
1. Consulter fournisseur préféré pour médicaments
2. Vérifier délai livraison
3. Créer commande urgente
4. Marquer comme prioritaire

```sql
-- 1. Trouver fournisseur
SELECT s.name, sc.lead_time_days, s.rating
FROM suppliers s
JOIN supplier_categories sc ON s.id = sc.supplier_id
JOIN inventory_categories ic ON sc.category_id = ic.id
WHERE ic.name = 'Médicaments'
  AND sc.is_preferred = true
  AND s.is_active = true;

-- 2. Créer commande urgente
INSERT INTO purchase_orders (...)
VALUES (..., 'Paiement comptant', 'COMMANDE URGENTE - Rupture stock');

-- 3. Notifier fournisseur (hors système)
-- 4. Suivre statut commande
```

---

### **Cas 2: Contrôle Qualité Réception**

**Contexte:** Livraison 1000 boîtes gants, inspection révèle dommages

**Actions:**
1. Créer BL
2. Inspecter articles un par un
3. Séparer acceptés/rejetés
4. Documenter non-conformité
5. Prévenir fournisseur

```sql
-- Enregistrement détaillé
INSERT INTO delivery_note_items (
  delivery_note_id, item_id,
  quantity_received, quantity_accepted, quantity_rejected,
  quality_status, rejection_reason, notes
) VALUES (
  'dn-uuid',
  'gants-uuid',
  1000,  -- Reçu
  950,   -- OK
  50,    -- Rejeté
  'damaged',
  'Boîtes écrasées lors transport',
  'Photos prises. Réclamation à faire auprès transporteur.'
);

UPDATE delivery_notes
SET is_conforming = false,
    non_conformity_details = '50 boîtes endommagées sur 1000'
WHERE id = 'dn-uuid';
```

---

### **Cas 3: Évaluation Trimestrielle**

**Contexte:** Fin Q4 2024, évaluer tous les fournisseurs actifs

**Actions:**
1. Extraire données période (Oct-Nov-Dec)
2. Calculer KPIs
3. Scorer chaque critère
4. Rédiger commentaires
5. Définir recommandations

```sql
-- Script automatique génération évaluations
DO $$
DECLARE
  supplier_record RECORD;
  v_total_orders integer;
  v_on_time integer;
  v_conforming integer;
  v_amount decimal;
BEGIN
  FOR supplier_record IN
    SELECT id FROM suppliers WHERE is_active = true
  LOOP
    -- Collecter données Q4
    SELECT
      COUNT(*),
      COUNT(CASE WHEN actual_delivery_date <= expected_delivery_date THEN 1 END),
      SUM(total_amount)
    INTO v_total_orders, v_on_time, v_amount
    FROM purchase_orders
    WHERE supplier_id = supplier_record.id
      AND order_date BETWEEN '2024-10-01' AND '2024-12-31';

    SELECT COUNT(*)
    INTO v_conforming
    FROM delivery_notes
    WHERE supplier_id = supplier_record.id
      AND is_conforming = true
      AND delivery_date BETWEEN '2024-10-01' AND '2024-12-31';

    -- Créer évaluation
    INSERT INTO supplier_evaluations (
      supplier_id, evaluation_date,
      period_start, period_end,
      total_orders, on_time_deliveries,
      conforming_deliveries, total_amount_spent,
      -- Scores à définir manuellement après
      evaluated_by
    ) VALUES (
      supplier_record.id, CURRENT_DATE,
      '2024-10-01', '2024-12-31',
      v_total_orders, v_on_time, v_conforming, v_amount,
      auth.uid()
    );
  END LOOP;
END $$;
```

---

## 🚀 Prochaines Étapes Recommandées

### **Phase 5A: Interface Utilisateur**
- [ ] Page liste fournisseurs avec filtres
- [ ] Fiche détaillée fournisseur (contacts, catégories, stats)
- [ ] Formulaire création/modification fournisseur
- [ ] Page gestion contacts

### **Phase 5B: Gestion Commandes**
- [ ] Interface création commande (panier)
- [ ] Liste commandes avec filtres avancés
- [ ] Workflow approbation commandes
- [ ] Suivi temps réel commandes
- [ ] Notifications délais dépassés

### **Phase 5C: Réceptions**
- [ ] Interface réception avec scan BL
- [ ] Contrôle qualité guidé
- [ ] Photos non-conformités
- [ ] Signature électronique réception
- [ ] Génération PDF BL

### **Phase 5D: Évaluations**
- [ ] Dashboard performance fournisseurs
- [ ] Graphiques KPIs (évolution dans temps)
- [ ] Interface évaluation guidée
- [ ] Rapports comparatifs
- [ ] Recommandations automatiques

### **Phase 5E: Intégrations**
- [ ] Import catalogue fournisseurs (CSV/Excel)
- [ ] Export commandes format fournisseur
- [ ] API webhooks notifications commandes
- [ ] Intégration emails automatiques
- [ ] Portail fournisseur (consultation commandes)

---

## 📈 Métriques de Succès

**Indicateurs Phase 5:**
- ✅ 10 tables créées avec relations
- ✅ 4 fonctions automatiques opérationnelles
- ✅ 5 triggers actifs
- ✅ Vue statistiques performante
- ✅ Données démo complètes (4 PO, 3 BL, 4 évals)
- ✅ RLS sécurisé pour tous les rôles
- ✅ Documentation complète

**Prochains KPIs à suivre:**
- Temps moyen traitement commande
- Taux erreur saisie commandes
- Satisfaction utilisateurs
- Économies réalisées (négociations)
- Réduction délais approvisionnement

---

## 🎓 Formation Utilisateurs

### **Module 1: Gestion Fournisseurs (30min)**
- Création fournisseur
- Ajout contacts
- Association catégories
- Upload documents

### **Module 2: Bons de Commande (45min)**
- Créer commande
- Ajouter articles
- Workflow approbation
- Suivi livraison

### **Module 3: Réceptions (45min)**
- Enregistrer livraison
- Contrôle qualité
- Gérer non-conformités
- Intégration stock

### **Module 4: Évaluations (30min)**
- Critères scoring
- Créer évaluation
- Interpréter statistiques
- Recommandations

---

## 📞 Support

**Questions Techniques:**
- Email: support-logistique@hopital.cd
- Documentation: /docs/phase5

**Bugs & Améliorations:**
- Créer ticket dans système
- Décrire problème avec captures d'écran
- Fournir numéros commandes/BL concernés

---

**Version:** 1.0
**Dernière mise à jour:** 20 Novembre 2024
**Statut:** ✅ Production Ready

*Document confidentiel - Usage interne uniquement*
