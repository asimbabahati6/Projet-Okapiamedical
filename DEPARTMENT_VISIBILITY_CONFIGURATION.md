# Configuration de la Visibilité des Départements

## Vue d'ensemble

Le système OKAPIA Medical permet de contrôler quels départements sont visibles sur l'interface publique via le champ `is_public`. Cette fonctionnalité permet de cacher certains départements internes (comme la Logistique) du site web public tout en les conservant pleinement fonctionnels dans le back-office administratif.

## Champs de Configuration

### `is_active` (boolean)
- **Fonction:** Indique si le département est actif dans le système
- **Impact:** Affecte toutes les interfaces (public et back-office)
- **Modification:** Accessible aux `hospital_admin` et `super_admin`
- **Valeur par défaut:** `true`

### `is_public` (boolean)
- **Fonction:** Contrôle la visibilité du département sur le site web public
- **Impact:** Uniquement l'interface publique (page "Notre équipe médicale")
- **Modification:** **UNIQUEMENT accessible aux `super_admin`** 🔒
- **Valeur par défaut:** `true` (visible au public)

## Matrice de Comportement

| is_active | is_public | Site Public      | Back-office Admin | Notes |
|-----------|-----------|------------------|-------------------|-------|
| `true`    | `true`    | ✅ Visible       | ✅ Visible        | Comportement standard - département public |
| `true`    | `false`   | ❌ Caché         | ✅ Visible        | Département interne (ex: Logistique) |
| `false`   | `true`    | ❌ Caché         | ✅ Visible        | Département temporairement désactivé |
| `false`   | `false`   | ❌ Caché         | ✅ Visible        | Département désactivé et privé |

## Départements Configurés comme Privés

### Logistique
- **Statut actuel:** `is_active: true`, `is_public: false`
- **Raison:** Département interne pour la gestion des stocks, des fournitures et du transport
- **Personnel:** Accessible uniquement aux logisticiens via le back-office
- **Visibilité:** Caché du site public, visible dans l'interface d'administration

## Permissions et Contrôles d'Accès

### Rôle: `hospital_admin`
- ✅ Voir tous les départements dans le back-office
- ✅ Créer de nouveaux départements
- ✅ Modifier: nom, description, téléphone, email
- ✅ Activer/désactiver un département (`is_active`)
- ❌ **NE PEUT PAS** modifier `is_public`
- **Note:** Si un `hospital_admin` tente de modifier `is_public`, la requête sera rejetée par la politique RLS (Row Level Security)

### Rôle: `super_admin`
- ✅ Toutes les permissions `hospital_admin`
- ✅ **Modifier `is_public`** (contrôler la visibilité publique)
- ✅ Créer des départements privés dès leur création
- ✅ Transformer un département public en privé et vice-versa

## Guide d'Utilisation

### Comment Cacher un Département du Public

**Prérequis:** Être connecté en tant que `super_admin`

1. Se connecter au back-office OKAPIA Medical
2. Naviguer vers **Paramètres** → **Départements**
3. Localiser le département à cacher
4. Cliquer sur le bouton **Modifier** à côté du département
5. Dans le formulaire, trouver la section **"Visible sur le site public"**
   - Note: Badge orange "Super Admin uniquement" indique que seuls les super_admin peuvent modifier ce paramètre
6. Décocher le toggle pour cacher le département
7. Cliquer sur **Enregistrer les modifications**
8. Le département est maintenant caché du site public mais reste accessible dans le back-office

**Résultat:**
- Le département n'apparaît plus dans les filtres de la page "Notre équipe médicale"
- Les médecins de ce département ne sont plus affichés sur le site public
- Le département affiche un badge **"Privé (Back-office)"** dans la liste des départements

### Comment Réactiver la Visibilité Publique

**Prérequis:** Être connecté en tant que `super_admin`

1. Se connecter au back-office en tant que `super_admin`
2. Aller dans **Paramètres** → **Départements**
3. Identifier le département avec le badge **"Privé (Back-office)"** 🔒
4. Cliquer sur **Modifier** à côté du département
5. Cocher le toggle **"Visible sur le site public"**
6. Cliquer sur **Enregistrer les modifications**
7. Le département réapparaît immédiatement sur la page publique "Notre équipe médicale"

### Créer un Nouveau Département Privé

**Prérequis:** Être connecté en tant que `super_admin`

1. Aller dans **Paramètres** → **Départements**
2. Cliquer sur **Ajouter un Département**
3. Remplir les informations du département (nom, description, etc.)
4. **Décocher** le toggle **"Visible sur le site public"**
5. Cocher **"Département actif"** si vous voulez l'activer immédiatement
6. Cliquer sur **Ajouter le département**

## Sécurité et Protection des Données

### Protection RLS (Row Level Security)

Le système utilise les politiques RLS de Supabase pour protéger le champ `is_public`:

```sql
-- Fonction pour vérifier si l'utilisateur est super_admin
CREATE FUNCTION is_super_admin() RETURNS boolean

-- Politique RLS sur la table departments
-- Empêche les non-super_admin de modifier is_public
```

**Comportement:**
- Si un `hospital_admin` tente de modifier `is_public` via l'API, la requête est **automatiquement rejetée**
- Seuls les `super_admin` peuvent réussir les modifications de `is_public`
- Tous les administrateurs peuvent lire la valeur de `is_public`

### Vérification des Permissions

Pour vérifier le rôle de l'utilisateur actuel:

```sql
-- Requête SQL pour vérifier votre rôle
SELECT r.name as role
FROM user_profiles up
JOIN roles r ON r.id = up.role_id
WHERE up.id = auth.uid();
```

Pour vérifier les départements cachés:

```sql
-- Lister tous les départements avec leur visibilité
SELECT
  name,
  is_active,
  is_public,
  CASE
    WHEN is_public = false THEN 'Privé (Back-office uniquement)'
    ELSE 'Public'
  END as visibilite
FROM departments
ORDER BY name;
```

## Impact sur les Autres Fonctionnalités

### Page "Notre équipe médicale" (Site Public)
- **Filtres de départements:** Les départements avec `is_public = false` n'apparaissent pas dans les boutons de filtre
- **Liste des médecins:** Les médecins assignés à des départements privés ne sont pas affichés
- **Recherche:** Les médecins des départements privés sont exclus des résultats

### Back-office Administratif
- **Aucun impact:** Tous les départements sont visibles et accessibles
- **Gestion du personnel:** Les administrateurs peuvent toujours assigner des employés aux départements privés
- **Rapports:** Les départements privés apparaissent dans tous les rapports internes

### API et Intégrations
- **Endpoints publics:** Filtrent automatiquement les départements avec `is_public = false`
- **Endpoints administratifs:** Retournent tous les départements sans filtrage

## Maintenance et Dépannage

### Problème: Un département ne s'affiche pas sur le site public

**Vérifications:**
1. ✅ Le département est-il actif? (`is_active = true`)
2. ✅ Le département est-il public? (`is_public = true`)
3. ✅ Y a-t-il des médecins assignés au département avec `is_accepting_patients = true`?

**Solution:**
```sql
-- Vérifier l'état du département
SELECT * FROM departments WHERE name = 'Nom du département';

-- Réactiver et rendre public
UPDATE departments
SET is_active = true, is_public = true
WHERE name = 'Nom du département';
```

### Problème: Un hospital_admin reçoit une erreur en modifiant un département

**Cause probable:** Tentative de modification du champ `is_public` sans avoir les permissions `super_admin`

**Solution:**
- Demander à un `super_admin` de faire la modification
- Ou se faire attribuer le rôle `super_admin` (nécessite l'intervention d'un super_admin existant)

### Problème: Le badge "Privé (Back-office)" n'apparaît pas

**Cause:** La propriété `is_public` n'est pas chargée depuis la base de données

**Solution:**
1. Vérifier que la colonne `is_public` existe dans la table `departments`
2. Actualiser la page du navigateur (Ctrl+F5 ou Cmd+Shift+R)
3. Vider le cache du navigateur si nécessaire

## FAQ (Foire Aux Questions)

### Q: Un hospital_admin peut-il voir les départements privés?
**R:** Oui, tous les administrateurs (hospital_admin et super_admin) peuvent voir tous les départements dans le back-office. Seul le site public est affecté par `is_public = false`.

### Q: Les médecins du département Logistique peuvent-ils se connecter au back-office?
**R:** Oui, absolument. Leur accès au back-office n'est pas affecté. Ils peuvent se connecter et accéder à toutes leurs fonctionnalités normalement.

### Q: Peut-on avoir plusieurs départements privés en même temps?
**R:** Oui, il n'y a aucune limite. Vous pouvez marquer autant de départements que nécessaire comme privés (`is_public = false`).

### Q: Comment réactiver un département si on l'a désactivé par erreur?
**R:** Dans **Paramètres** → **Départements**, cliquez sur "Activer" à côté du département. Pour rendre un département à nouveau public, vous devez être `super_admin` et cocher le toggle "Visible sur le site public".

### Q: Les départements privés apparaissent-ils dans les statistiques?
**R:** Oui, dans le back-office. Les départements privés sont inclus dans toutes les statistiques, rapports et analyses administratives.

### Q: Que se passe-t-il si je supprime le département Logistique?
**R:** **Attention!** Ne supprimez pas le département Logistique si des employés y sont assignés ou si des données y sont liées. Préférez le désactiver (`is_active = false`) plutôt que de le supprimer.

### Q: Comment ajouter un autre département interne comme "Ressources Humaines"?
**R:**
1. Créez le département normalement via **Paramètres** → **Départements** → **Ajouter un Département**
2. Remplissez les informations (nom: "Ressources Humaines", description, etc.)
3. Décochez "Visible sur le site public" (si vous êtes super_admin)
4. Enregistrez

## Historique des Modifications

| Date       | Version | Modifications |
|------------|---------|---------------|
| 2026-01-16 | 1.0     | Création initiale de la documentation |
| 2026-01-16 | 1.0     | Ajout du champ `is_public` à la table departments |
| 2026-01-16 | 1.0     | Configuration du département Logistique comme privé |
| 2026-01-16 | 1.0     | Mise en place des politiques RLS pour `super_admin` uniquement |

## Support et Contact

Pour toute question ou problème concernant la gestion de la visibilité des départements:

- **Support technique:** Contacter l'administrateur système
- **Demande de permissions super_admin:** Contacter votre super_admin actuel
- **Bug ou problème:** Créer un ticket dans le système de gestion

---

**Document confidentiel - Usage interne OKAPIA Medical uniquement**
