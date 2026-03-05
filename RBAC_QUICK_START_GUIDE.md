# Guide de Démarrage Rapide - Système RBAC Granulaire

## Introduction

Ce guide vous permettra de tester rapidement le système RBAC (Role-Based Access Control) granulaire implémenté pour les modules Laboratoire, Pharmacie et Radiologie.

---

## Prérequis

- Application OKAPIA Medical déployée
- Accès à la base de données Supabase
- Comptes utilisateurs avec différents rôles

---

## Étape 1 : Création des Comptes de Test

### Créer les utilisateurs via SQL

Connectez-vous à votre console Supabase et exécutez :

```sql
-- Créer un médecin
INSERT INTO user_profiles (user_id, role, full_name, email)
VALUES (
  'uuid-medecin',
  'doctor',
  'Dr. Jean Dupont',
  'medecin@test.com'
);

-- Créer un technicien laboratoire
INSERT INTO user_profiles (user_id, role, full_name, email)
VALUES (
  'uuid-tech-labo',
  'laboratory',
  'Marie Laboratoire',
  'labo@test.com'
);

-- Créer un pharmacien
INSERT INTO user_profiles (user_id, role, full_name, email)
VALUES (
  'uuid-pharmacien',
  'pharmacist',
  'Paul Pharmacie',
  'pharmacie@test.com'
);

-- Créer un chef radiologie
INSERT INTO user_profiles (user_id, role, full_name, email)
VALUES (
  'uuid-chef-radio',
  'radio_chef',
  'Sophie Radiologie',
  'radio@test.com'
);

-- Créer un technicien radiologie
INSERT INTO user_profiles (user_id, role, full_name, email)
VALUES (
  'uuid-tech-radio',
  'radio_tech',
  'Marc Technicien',
  'techradio@test.com'
);
```

---

## Étape 2 : Scénarios de Test

### A. Module LABORATOIRE

#### Test 1 : Médecin (Lecture seule)

1. **Connexion :** Connectez-vous avec le compte médecin
2. **Navigation :** Allez dans "Services Médicaux" > "Laboratoire"
3. **Vérifications attendues :**
   - ✅ Badge "Lecture seule" visible en haut de page
   - ✅ Message d'information sur l'accès en consultation
   - ✅ Dashboard visible avec statistiques
   - ✅ Liste des analyses visible
   - ❌ Boutons "Saisir résultat" désactivés/absents
   - ❌ Boutons "Valider" absents

#### Test 2 : Technicien Laboratoire (Accès complet)

1. **Connexion :** Connectez-vous avec le compte technicien labo
2. **Navigation :** Allez dans "Services Médicaux" > "Laboratoire"
3. **Vérifications attendues :**
   - ✅ Badge "Accès complet" visible
   - ✅ Tous les boutons d'action accessibles
   - ✅ Bouton "Saisir résultat" actif
   - ✅ Bouton "Valider résultat" actif
   - ✅ Gestion des équipements accessible

**Actions à tester :**
- Créer une nouvelle analyse
- Saisir des résultats
- Valider des résultats
- Modifier un résultat existant

---

### B. Module PHARMACIE

#### Test 3 : Médecin (Consultation disponibilité)

1. **Connexion :** Connectez-vous avec le compte médecin
2. **Navigation :** Allez dans "Services Médicaux" > "Pharmacie"
3. **Vérifications attendues :**
   - ✅ Vue simplifiée de disponibilité des médicaments
   - ✅ Stocks visibles
   - ✅ Badge "Consultation uniquement"
   - ❌ Boutons "Dispenser" absents
   - ❌ Gestion inventaire non accessible

#### Test 4 : Pharmacien (Dispensation)

1. **Connexion :** Connectez-vous avec le compte pharmacien
2. **Navigation :** Allez dans "Services Médicaux" > "Pharmacie"
3. **Vérifications attendues :**
   - ✅ Badge "Accès complet"
   - ✅ Vue complète avec onglets
   - ✅ Onglet "Ordonnances en attente" visible
   - ✅ Bouton "Dispenser" actif
   - ✅ Gestion inventaire accessible

**Actions à tester :**
- Consulter les ordonnances en attente
- Dispenser un médicament
- Ajouter un nouveau médicament au stock
- Modifier les quantités en stock

---

### C. Module RADIOLOGIE

#### Test 5 : Médecin (Prescription uniquement)

1. **Connexion :** Connectez-vous avec le compte médecin
2. **Navigation :** Allez dans "Services Médicaux" > "Radiologie"
3. **Menu attendu :**
   - ✅ Dashboard
   - ✅ Prescrire Examen
   - ✅ Visualiseur
   - ✅ Historique
   - ❌ File d'attente (absent)
   - ❌ Espace de travail (absent)

**Actions à tester :**
- Prescrire un nouvel examen radiologique
- Consulter un rapport validé
- Voir l'historique des examens d'un patient

#### Test 6 : Technicien Radiologie (Réalisation)

1. **Connexion :** Connectez-vous avec le compte technicien radio
2. **Navigation :** Allez dans "Services Médicaux" > "Radiologie"
3. **Menu attendu :**
   - ✅ Dashboard
   - ✅ File d'attente
   - ✅ Espace de travail
   - ✅ Visualiseur
   - ✅ Historique

**Actions à tester :**
- Voir la file d'attente des examens prescrits
- Démarrer un examen
- Upload d'images (DICOM ou JPEG/PNG)
- Rédiger le compte-rendu (Technique, Constatations, Conclusion)
- Terminer l'examen

**Vérifications :**
- ❌ Bouton "Valider rapport" absent (réservé au Chef)

#### Test 7 : Chef Radiologie (Validation)

1. **Connexion :** Connectez-vous avec le compte chef radio
2. **Navigation :** Allez dans "Services Médicaux" > "Radiologie"
3. **Menu attendu :**
   - ✅ Tous les menus visibles

**Actions à tester :**
- Tout ce que peut faire le technicien +
- **Valider un rapport terminé**
- Demander une révision si nécessaire
- Gérer le département
- Gérer les équipements

**Workflow complet :**
1. Consulter la file d'attente
2. Sélectionner un examen "Terminé" (statut bleu)
3. Ouvrir l'espace de travail
4. Vérifier les images uploadées
5. Lire le compte-rendu
6. **Panel de validation visible en bas**
7. Cliquer "Valider le rapport" ✅
8. Le rapport passe en statut "Validé" (vert)
9. Maintenant visible par le médecin prescripteur

---

## Étape 3 : Vérification des Composants RBAC

### A. Badges de Permissions

Vérifiez l'affichage des badges selon le rôle :

| Rôle | Module | Badge attendu |
|------|--------|---------------|
| Médecin | Laboratoire | "Lecture seule" (gris) |
| Technicien Labo | Laboratoire | "Accès complet" (vert) |
| Médecin | Pharmacie | "Consultation uniquement" (bleu) |
| Pharmacien | Pharmacie | "Accès complet" (vert) |
| Médecin | Radiologie | Aucun badge |
| Technicien Radio | Radiologie | Aucun badge |
| Chef Radio | Radiologie | "Accès complet" (vert) |

### B. Messages d'Information

Vérifiez les messages contextuels :

**Médecin dans Laboratoire :**
```
ℹ️ Mode lecture seule
Vous pouvez consulter les données mais ne pouvez pas les modifier.
```

**Médecin dans Pharmacie :**
```
ℹ️ Accès en consultation uniquement
Vous avez accès à la consultation des disponibilités uniquement.
Contactez un responsable pharmacie pour effectuer des modifications.
```

### C. Boutons Protégés

Testez les boutons avec tooltip :

1. Passez la souris sur un bouton désactivé
2. Un tooltip doit apparaître expliquant pourquoi l'action n'est pas autorisée
3. L'icône de cadenas 🔒 doit être visible

---

## Étape 4 : Tests de Sécurité

### A. Test d'Accès Direct (URL)

Essayez d'accéder directement à une page non autorisée :

**Exemple : Médecin tente d'accéder à l'espace de travail radiologie**

1. URL : `/staff/radiology/workspace/123`
2. **Résultat attendu :** Redirection vers `/staff/dashboard`
3. Message : "Vous n'avez pas accès à cette page"

### B. Test de Manipulation UI (DevTools)

1. Ouvrez les DevTools (F12)
2. Tentez de réactiver un bouton désactivé via l'inspecteur
3. Cliquez sur le bouton
4. **Résultat attendu :** Aucune action ne se produit (logique côté backend)

### C. Test RLS (Row Level Security)

Tentez d'accéder directement aux données via l'API Supabase :

```javascript
// Exemple : Médecin tente de modifier un résultat d'analyse
const { error } = await supabase
  .from('lab_results')
  .update({ value: '999' })
  .eq('id', 'result-id');

// Résultat attendu : error !== null
// Message : "Row Level Security policy violation"
```

---

## Étape 5 : Workflow Complet Radiologie

### Scénario : Examen radiologique de A à Z

**Participants :**
- Dr. Dupont (Médecin)
- Marc (Technicien Radio)
- Sophie (Chef Radio)

**Étapes :**

1. **Dr. Dupont prescrit un scanner** (09:00)
   - Connexion en tant que médecin
   - "Radiologie" > "Prescrire Examen"
   - Type : Scanner
   - Urgence : Normal
   - Indication : "Suspicion de fracture"
   - ✅ Examen créé (statut : Prescrit)

2. **Marc réalise l'examen** (10:00)
   - Connexion en tant que technicien
   - "File d'attente" > Voir l'examen prescrit
   - Bouton "Démarrer" ✅
   - Upload 3 images DICOM
   - Rédaction du compte-rendu :
     - Technique : "Scanner sans injection..."
     - Constatations : "Absence de fracture visible..."
     - Conclusion : "Examen normal"
   - Bouton "Terminer l'examen" ✅
   - ✅ Statut : Terminé

3. **Sophie valide le rapport** (10:30)
   - Connexion en tant que chef radio
   - "File d'attente" > Filtrer "Terminés"
   - Sélectionner l'examen
   - Vérification des images (zoom, rotation)
   - Lecture du rapport
   - Panel de validation visible en bas
   - Bouton "Valider le rapport" ✅
   - ✅ Statut : Validé

4. **Dr. Dupont consulte le rapport** (11:00)
   - Connexion en tant que médecin
   - "Radiologie" > "Visualiseur"
   - Sélectionner le rapport validé
   - Voir les images avec zoom
   - Lire le compte-rendu complet
   - Badge "Rapport validé" ✅ visible

---

## Étape 6 : Checklist de Validation Finale

### ✅ Composants RBAC

- [ ] `AccessControl` masque correctement les éléments non autorisés
- [ ] `ProtectedAction` désactive les boutons sans permissions
- [ ] Badges de permissions s'affichent correctement
- [ ] Messages d'accès sont clairs et utiles
- [ ] Tooltips informatifs sur boutons désactivés

### ✅ Hooks de Permissions

- [ ] `useLabPermissions()` retourne les bonnes valeurs
- [ ] `usePharmacyPermissions()` retourne les bonnes valeurs
- [ ] `useRadiologyPermissions()` retourne les bonnes valeurs

### ✅ Modules Fonctionnels

- [ ] Laboratoire : Accès différencié médecin/technicien
- [ ] Pharmacie : Vue médecin vs vue pharmacien
- [ ] Radiologie : Workflow complet fonctionne

### ✅ Sécurité

- [ ] Routes protégées redirigent correctement
- [ ] RLS empêche l'accès direct aux données
- [ ] Manipulation UI ne contourne pas la sécurité
- [ ] Audit logs enregistrent les actions

### ✅ UX/UI

- [ ] Design cohérent avec le reste de l'application
- [ ] Couleurs appropriées par module (teal, bleu, cyan)
- [ ] Transitions fluides
- [ ] Responsive sur mobile et desktop

---

## Dépannage Rapide

### Problème : Badge ne s'affiche pas

**Solution :**
- Vérifier que le hook de permissions est appelé
- Vérifier que le rôle de l'utilisateur est correct
- Console : `console.log(permissions)` pour debug

### Problème : Bouton reste actif malgré manque de permissions

**Solution :**
- Utiliser `ProtectedAction` au lieu d'un bouton normal
- Vérifier que la permission est bien définie dans `rbac.ts`

### Problème : Redirection incorrecte

**Solution :**
- Vérifier les routes dans `RadiologyRoutes.tsx`
- Vérifier que `AccessControl` a le bon mode (`redirect`)

### Problème : Upload d'images échoue

**Solution :**
- Vérifier que le bucket `medical-images` existe dans Supabase Storage
- Vérifier les permissions du bucket (public read)
- Vérifier la taille du fichier (max 50 MB)

---

## Ressources Supplémentaires

- **Documentation complète :** `RBAC_GRANULAR_PERMISSIONS_DOCUMENTATION.md`
- **Configuration RBAC :** `src/config/rbac.ts`
- **Composants :** `src/components/common/`
- **Hooks :** `src/hooks/`

---

## Support

En cas de problème :
1. Consulter les logs dans la console navigateur
2. Vérifier les logs Supabase
3. Tester avec un autre rôle
4. Consulter la documentation technique

**Bon test ! 🚀**
