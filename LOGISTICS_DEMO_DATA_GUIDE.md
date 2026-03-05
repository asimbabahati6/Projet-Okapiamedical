# 📦 Guide de Génération des Données de Démonstration - Système Logistique

Ce guide explique comment charger les données de démonstration pour tester le système de gestion logistique.

---

## 🎯 Contenu des Données de Démonstration

Le script génère **50 articles d'inventaire réalistes** répartis en 5 catégories:

### **1. Médicaments (15 articles)**
- ✅ **Stock normal:** Paracétamol, Amoxicilline, Ibuprofène (3 articles)
- ⚠️ **Stock faible:** Insuline, Morphine (2 articles)
- 🔴 **Stock critique:** Adrénaline, Vaccin COVID-19 (2 articles)
- ❌ **Stock épuisé:** Artémisinine, Oxygène médical (2 articles)
- ⏰ **Expiration proche:** Sérum physiologique, Glucose (2 articles)
- ⚰️ **Expirés:** Aspirine, Vitamine C (2 articles)
- 📦 **Surstock:** Compresses, Bandes élastiques (2 articles)

### **2. Consommables Médicaux (15 articles)**
- Seringues, Gants, Cathéters, Masques, Aiguilles
- Pansements, Draps d'examen, Sondes, Tubes EDTA
- Sets perfusion, Poches urine, Champs opératoires, etc.

### **3. Équipements Médicaux (10 articles)**
- Thermomètres, Tensiomètres, Stéthoscopes
- Otoscopes, Glucomètres, Oxymètres
- Lampes d'examen, Défibrillateurs, Nébuliseurs

### **4. Fournitures de Laboratoire (5 articles)**
- Réactifs (Glucose, Hémoglobine)
- Lames et lamelles microscope
- Pipettes Pasteur

### **5. Hygiène et Désinfection (5 articles)**
- Solution hydroalcoolique
- Eau de Javel
- Savon antiseptique
- Sacs DASRI
- Lingettes désinfectantes

---

## 🏢 Fournisseurs (5)

Le script crée 5 fournisseurs fictifs:
1. **Demo Pharma International** - Kinshasa (Rating: 4.5/5)
2. **Demo Medical Supply Co.** - Lubumbashi (Rating: 4.8/5)
3. **Demo Équipements Hospitaliers** - Goma (Rating: 4.2/5)
4. **Demo Laboratoire Distribution** - Kinshasa (Rating: 4.6/5)
5. **Demo Consommables Médicaux** - Kisangani (Rating: 4.3/5)

---

## 📊 Mouvements de Stock (60+)

Le script génère ~60 mouvements historiques sur les 30 derniers jours:
- **Entrées** - Réceptions fournisseurs avec références BL
- **Sorties** - Distributions services
- **Ajustements** - Inventaires physiques
- **Transferts** - Mouvements inter-services

---

## 🚨 Alertes (15-20)

Le script génère automatiquement des alertes de tous types:
- 🔴 **Critiques:** Stock épuisé, Stock critique
- 🟠 **Élevées:** Stock faible, Produits expirés
- 🟡 **Moyennes:** Expiration proche (7-30 jours)
- 🔵 **Faibles:** Surstock

---

## 📝 Instructions d'Exécution

### **Méthode 1: Via l'Interface Supabase (Recommandée)**

1. **Ouvrir Supabase Dashboard**
   - Aller sur: https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Accéder à l'Éditeur SQL**
   - Menu latéral → `SQL Editor`
   - Cliquer sur `New Query`

3. **Copier-Coller le Script**
   - Ouvrir le fichier: `/scripts/generate-logistics-demo-data.sql`
   - Copier tout le contenu (Ctrl+A, Ctrl+C)
   - Coller dans l'éditeur SQL Supabase

4. **Exécuter le Script**
   - Cliquer sur le bouton `Run` (ou Ctrl+Enter)
   - Attendre 10-15 secondes

5. **Vérifier le Résultat**
   - Le dernier SELECT affichera:
     ```
     message: "Données de démonstration générées avec succès!"
     fournisseurs: 5
     articles_inventaire: 50
     mouvements_30j: 60+
     alertes_actives: 15-20
     ```

---

### **Méthode 2: Via le CLI Supabase (Alternative)**

```bash
# Si vous avez installé Supabase CLI
supabase db reset  # Réinitialiser la DB (optionnel)
psql $DATABASE_URL -f scripts/generate-logistics-demo-data.sql
```

---

## 🧪 Vérification des Données

### **1. Vérifier les Articles**

Dans l'interface de l'application:
1. Aller sur **Logistique → Inventaire**
2. Vous devriez voir **50 articles**
3. Utiliser les filtres pour voir:
   - Articles en stock normal
   - Articles avec stock faible/critique
   - Articles épuisés
   - Articles expirés

### **2. Vérifier les Mouvements**

1. Aller sur **Logistique → Mouvements**
2. Vous devriez voir **60+ mouvements**
3. Filtrer par:
   - Type (Entrée, Sortie, Ajustement, Transfert)
   - Date (30 derniers jours)

### **3. Vérifier les Alertes**

1. Aller sur **Logistique → Alertes**
2. Vous devriez voir **15-20 alertes actives**
3. Le badge rouge sur l'onglet doit afficher le nombre
4. Filtrer par:
   - Sévérité (Critique, Élevée, Moyenne, Faible)
   - Type (Stock épuisé, Stock faible, Expiration, etc.)

### **4. Vérifier le Dashboard**

1. Aller sur **Logistique → Vue d'ensemble**
2. Les KPIs doivent afficher:
   - **Total Articles:** ~50
   - **Valeur Stock:** ~250,000+ FC
   - **Articles Critiques:** 2-4
   - **Stock Faible:** 5-8
   - **Articles Expirés:** 2
   - **Alertes Actives:** 15-20
   - **Catégories:** 7
   - **Fournisseurs:** 5+

---

## 🗑️ Réinitialisation (Optionnel)

Si vous voulez supprimer les données de démonstration et recommencer:

```sql
-- Décommenter ces lignes dans le script
DELETE FROM logistics_stock_alerts;
DELETE FROM stock_movements;
DELETE FROM inventory_items WHERE sku LIKE 'INV-20241120-%';
DELETE FROM suppliers WHERE name LIKE 'Demo%';
```

Puis réexécuter le script complet.

---

## 🎮 Scénarios de Test Recommandés

Une fois les données chargées, testez ces scénarios:

### **Scénario 1: Traiter une Alerte Critique**
1. Aller sur **Alertes**
2. Voir alerte "Stock épuisé - Artémisinine"
3. Cliquer sur **Voir l'article** (icône œil)
4. Depuis les détails, créer un mouvement d'entrée
5. Marquer l'alerte comme résolue

### **Scénario 2: Enregistrer une Sortie de Stock**
1. Aller sur **Mouvements → Nouveau Mouvement**
2. Type: **Sortie**
3. Article: **Paracétamol 500mg**
4. Quantité: **100 comprimés**
5. Raison: "Distribution service pédiatrie"
6. Enregistrer et voir mise à jour instantanée

### **Scénario 3: Ajustement d'Inventaire**
1. Aller sur **Mouvements → Nouveau Mouvement**
2. Type: **Ajustement**
3. Article: **Gants Latex M**
4. Quantité: **800** (nouvelle quantité totale)
5. Raison: "Inventaire physique trimestriel"
6. Vérifier le nouveau stock

### **Scénario 4: Filtrer et Rechercher**
1. **Inventaire:** Rechercher "Seringue"
2. **Mouvements:** Filtrer par type "Entrée" + derniers 7 jours
3. **Alertes:** Filtrer par sévérité "Critique"

### **Scénario 5: Voir Historique Complet**
1. Aller sur **Inventaire**
2. Cliquer sur **Voir détails** pour "Amoxicilline 500mg"
3. Onglet **Historique**
4. Observer tous les mouvements de cet article

---

## 📈 Données Générées par Catégorie

| Catégorie | Articles | Valeur Estimée | Alertes |
|-----------|----------|----------------|---------|
| Médicaments | 15 | ~50,000 FC | 8-10 |
| Consommables | 15 | ~60,000 FC | 3-5 |
| Équipements | 10 | ~120,000 FC | 1-2 |
| Laboratoire | 5 | ~15,000 FC | 1-2 |
| Hygiène | 5 | ~8,000 FC | 1 |
| **TOTAL** | **50** | **~250,000 FC** | **15-20** |

---

## ✅ Checklist de Vérification

Après exécution du script, vérifiez:

- [ ] 50 articles créés dans l'inventaire
- [ ] 5 fournisseurs avec contacts
- [ ] 60+ mouvements de stock historiques
- [ ] 15-20 alertes actives visibles
- [ ] Badge rouge sur onglet Alertes avec le bon compte
- [ ] Dashboard affiche tous les KPIs
- [ ] Filtres fonctionnent sur chaque page
- [ ] Recherche retourne des résultats
- [ ] Détails article montrent historique complet

---

## 🐛 Dépannage

### **Problème: "Aucun article trouvé"**
**Solution:** Le script n'a pas été exécuté ou a échoué. Réexécutez-le.

### **Problème: "Duplicate key violation"**
**Solution:** Les données existent déjà. Supprimez-les d'abord avec les commandes DELETE.

### **Problème: "Catégories non trouvées"**
**Solution:** Exécutez d'abord la migration qui crée les catégories par défaut.

### **Problème: "Pas d'alertes visibles"**
**Solution:** Les triggers d'alertes doivent être actifs. Vérifiez les migrations.

---

## 🎉 Résultat Attendu

Après exécution réussie, votre système logistique sera **100% opérationnel** avec:

✅ **Dashboard complet** avec statistiques réalistes
✅ **Inventaire varié** (stock normal, faible, critique, épuisé, expiré, surstock)
✅ **Historique de mouvements** sur 30 jours
✅ **Alertes actives** de tous types et sévérités
✅ **Badge temps réel** affichant le compte d'alertes
✅ **Données prêtes pour démonstration** client/formation

---

**Le système est maintenant prêt pour être testé et démontré! 🚀**
