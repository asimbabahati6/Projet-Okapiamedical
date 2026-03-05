# Guide de Démarrage Rapide - Module Transport

## Accès au Module

Le module Transport est accessible pour les utilisateurs avec les rôles:
- **Logisticien** (`logistician`)
- **Super Admin** (`super_admin`)

### Navigation
1. Connectez-vous à l'interface staff
2. Cliquez sur **"Transport"** dans le menu latéral (icône navigation)

---

## Vue d'Ensemble

### Tableau de Bord Principal

Le tableau de bord affiche 5 indicateurs clés de la flotte:

| Indicateur | Description |
|------------|-------------|
| **Total Véhicules** | Nombre total de véhicules actifs dans la flotte |
| **Disponibles** | Véhicules prêts à être assignés (statut vert) |
| **En Mission** | Véhicules actuellement en déplacement (statut bleu) |
| **En Maintenance** | Véhicules en réparation (statut jaune) |
| **Hors Service** | Véhicules temporairement non utilisables (statut rouge) |

### Onglets du Module

Le module contient 6 onglets principaux:

1. **Vue d'ensemble** - Dashboard avec missions actives, véhicules disponibles et alertes
2. **Missions** - Liste complète des missions de transport
3. **Véhicules** - Gestion de la flotte
4. **Conducteurs** - Gestion des chauffeurs
5. **Carburant** - Suivi de la consommation (en développement)
6. **Maintenance** - Planification et historique (en développement)

---

## Fonctionnalités Actuelles

### ✅ Vue d'Ensemble

**Missions Actives**
- Affiche les 5 dernières missions en cours
- Informations: numéro, type, priorité, trajet, véhicule assigné
- Mise à jour en temps réel

**Véhicules Disponibles**
- Top 5 véhicules prêts à l'emploi
- Type, modèle, immatriculation
- Statut visuel avec code couleur

**Alertes Automatiques**
- 🟠 **Assurance expirant**: Documents expirant dans les 30 prochains jours
- 🟡 **Maintenance requise**: Véhicules à 500 km ou moins de l'entretien prévu
- Affichage uniquement si alertes présentes

### ✅ Missions

**Tableau des Missions**
- Liste complète avec pagination (50 dernières)
- Filtre par statut: Toutes, Planifiées, En Attente, En Cours, Complétées, Annulées
- Colonnes affichées:
  - Numéro de mission
  - Type et priorité (badge coloré)
  - Trajet (départ → destination)
  - Véhicule assigné (avec icône type)
  - Conducteur
  - Statut actuel
  - Horaires programmés

**Codes Couleur Priorité**
| Priorité | Couleur | Badge |
|----------|---------|-------|
| Urgente | Rouge | 🔴 |
| Élevée | Orange | 🟠 |
| Normale | Bleu | 🔵 |
| Faible | Gris | ⚪ |

**Actions Disponibles**
- 🆕 Bouton "Nouvelle Mission" (à venir)
- Tri et filtrage en temps réel
- Mise à jour automatique lors de changements

### ✅ Véhicules

**Grille de Véhicules**
- Affichage en cartes (responsive: 1/2/3 colonnes)
- Informations par véhicule:
  - Icône selon type (ambulance, voiture, camionnette, moto)
  - Numéro d'identification
  - Marque et modèle
  - Type de véhicule
  - Année de mise en service
  - Kilométrage actuel
  - Immatriculation
  - Statut avec badge coloré

**Types de Véhicules**
| Type | Icône | Usage |
|------|-------|-------|
| Ambulance Urgence | 🚑 | SMUR, urgences vitales |
| Ambulance Standard | 🚑 | Transports programmés |
| Voiture Service | 🚗 | Personnel, administratif |
| Camionnette | 🚚 | Transport matériel |
| Moto | 🏍️ | Liaisons rapides |

**Actions Disponibles**
- 🆕 Bouton "Ajouter Véhicule" (à venir)

### ✅ Conducteurs

**Grille de Conducteurs**
- Cartes avec informations essentielles:
  - Nom et prénom
  - Numéro employé
  - Type de permis (B, D, Ambulance, Moto)
  - Numéro de permis
  - Date d'expiration
  - Téléphone
  - Statut disponibilité

**Alertes Permis**
- ⚠️ Icône orange si permis expire dans 60 jours
- Date d'expiration en surbrillance orange

**Actions Disponibles**
- 🆕 Bouton "Ajouter Conducteur" (à venir)

---

## Mises à Jour en Temps Réel

Le module utilise **Supabase Realtime** pour les mises à jour automatiques:

### Événements Écoutés

1. **Changements de Missions**
   - Nouvelle mission créée
   - Statut de mission modifié (planifiée → en cours → complétée)
   - Véhicule ou conducteur assigné

2. **Changements de Véhicules**
   - Nouveau véhicule ajouté
   - Statut véhicule modifié (disponible → en mission → maintenance)
   - Kilométrage mis à jour

### Comportement
- ✅ Rafraîchissement automatique sans rechargement de page
- ✅ Données synchronisées entre tous les utilisateurs connectés
- ✅ Indicateur visuel de chargement lors des mises à jour

---

## Données Démo Disponibles

Le système contient des données de démonstration:

### Véhicules (7 total)
- 3 Ambulances (2 urgence, 1 standard)
- 2 Voitures de service
- 1 Camionnette
- 1 Moto

### Conducteurs (3 actifs)
- Conducteurs avec différents types de permis
- Disponibilité variée

### Missions (4 missions)
- Missions avec différents statuts et priorités
- Trajets réalistes avec coordonnées GPS
- Véhicules et conducteurs assignés

---

## Prochaines Fonctionnalités

### 🔜 En Développement

**Onglet Carburant**
- Enregistrement des pleins
- Calcul consommation automatique
- Analyse coûts par véhicule
- Détection consommation anormale

**Onglet Maintenance**
- Planification maintenance préventive
- Historique des interventions
- Alertes kilométrage/dates
- Gestion des coûts

**Gestion des Missions**
- Formulaire création mission complète
- Attribution automatique véhicule/conducteur
- Suivi GPS en temps réel
- Validation et complétion

**Gestion des Véhicules**
- Formulaire ajout véhicule
- Modification informations
- Upload documents (assurance, carte grise)
- Historique complet

**Gestion des Conducteurs**
- Formulaire ajout conducteur
- Liaison compte utilisateur
- Gestion permissions de conduite
- Planning de disponibilité

---

## Accès aux Données

### Tables Principales

```sql
-- Véhicules
SELECT * FROM vehicles WHERE is_active = true;

-- Conducteurs
SELECT * FROM drivers WHERE is_active = true;

-- Missions
SELECT * FROM transport_missions
ORDER BY created_at DESC LIMIT 50;

-- Statistiques flotte
SELECT * FROM fleet_overview;
```

### Filtres Utiles

**Missions du jour**
```sql
SELECT * FROM transport_missions
WHERE DATE(created_at) = CURRENT_DATE;
```

**Véhicules disponibles**
```sql
SELECT * FROM vehicles
WHERE is_active = true AND status = 'disponible';
```

**Alertes maintenance**
```sql
SELECT * FROM vehicles
WHERE current_mileage_km >= next_service_due_km - 500;
```

---

## Support et Documentation

Pour plus de détails:
- 📖 Documentation complète: `TRANSPORT_MODULE_DOCUMENTATION.md`
- 🗄️ Schéma base de données: Migration `create_transport_management_system`
- 💾 Données démo: Script SQL dans la migration

---

**Version**: 1.0
**Dernière mise à jour**: 20 Novembre 2025
**Statut**: Fonctionnel - Interface et données de base opérationnelles
