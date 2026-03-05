# Guide : Création Automatique de Compte Utilisateur

## Vue d'ensemble

Le formulaire de création d'employé permet maintenant de créer automatiquement un compte utilisateur pour le nouvel employé, éliminant le besoin de créer manuellement le compte avant de remplir le dossier employé.

## Comment utiliser

### Étape 1 : Remplir les informations de base

Dans l'onglet **"Informations Personnelles"**, remplissez au minimum :
- ✅ Prénom (obligatoire)
- ✅ Nom de famille (obligatoire)
- ✅ Email (recommandé)
- ✅ Téléphone principal (recommandé)

### Étape 2 : Naviguer vers l'onglet Professionnel

Cliquez sur l'onglet **"Informations Professionnelles"**

### Étape 3 : Créer le compte utilisateur

Dans la section **"Liaison Utilisateur"** :
1. Cliquez sur le bouton vert **"Créer compte"**
2. Le système génère automatiquement :
   - Un email au format : `prenom.nom@okapia-medical.cd`
   - Un mot de passe sécurisé : `OKAPIA-[Année][4 chiffres aléatoires][Caractère spécial]`
   - Exemple : `OKAPIA-2024Ab7k!`

### Étape 4 : Noter les identifiants

Une fenêtre s'affiche avec les identifiants créés :

```
Email : jean.dupont@okapia-medical.cd
Mot de passe temporaire : OKAPIA-2024Xy3m!
```

**IMPORTANT** :
- Copiez ces identifiants en cliquant sur les icônes de copie
- Ces identifiants ne seront plus affichés après fermeture
- Communiquez-les de manière sécurisée à l'employé

### Étape 5 : Continuer le formulaire

1. Cliquez sur "J'ai noté les identifiants"
2. Le compte est maintenant automatiquement sélectionné dans le dropdown
3. Continuez à remplir les autres sections du formulaire
4. Soumettez le formulaire pour créer l'employé

## Attribution automatique du rôle

Le système détermine automatiquement le rôle en fonction du titre du poste :

| Titre du poste contient | Rôle attribué |
|-------------------------|---------------|
| "médecin", "doctor" | Médecin |
| "pharmacien" | Pharmacien |
| "dentiste" | Dentiste |
| "kiné", "physiothérapeute" | Kinésithérapeute |
| "infirmier", "nurse" | Infirmier |
| Autre | Personnel Administratif |

## Format de l'email généré

Le système normalise le prénom et le nom :
- Convertit en minuscules
- Retire les accents (é → e, à → a)
- Remplace les espaces et caractères spéciaux par des tirets
- Format final : `prenom.nom@okapia-medical.cd`

**Exemples** :
- Jean-Paul Müller → `jean-paul.muller@okapia-medical.cd`
- Marie José N'Dolo → `marie.jose.n-dolo@okapia-medical.cd`
- François-Xavier de La Fontaine → `francois-xavier.de-la-fontaine@okapia-medical.cd`

## Format du mot de passe

Structure : `OKAPIA-[Année][4 caractères alphanumériques][Caractère spécial]`

Caractéristiques :
- 12+ caractères
- Majuscules et minuscules
- Chiffres
- Caractère spécial parmi : `!@#$%`
- Exempt de caractères ambigus (0, O, I, l)

**Exemples** :
- `OKAPIA-2024Kp9m!`
- `OKAPIA-2024Nh3x@`
- `OKAPIA-2024Zr8b#`

## Gestion des erreurs

### Email déjà existant
**Erreur** : "Un compte avec l'email jean.dupont@okapia-medical.cd existe déjà"

**Solution** :
1. Vérifier si l'employé existe déjà dans le système
2. Si c'est un homonyme, ajouter un chiffre au nom : `jean.dupont2@okapia-medical.cd`
3. Ou utiliser le deuxième prénom : `jean.paul.dupont@okapia-medical.cd`

### Champs manquants
**Erreur** : "Le prénom et le nom sont requis pour créer un compte utilisateur"

**Solution** :
- Retournez à l'onglet "Informations Personnelles"
- Remplissez le prénom et le nom
- Revenez à l'onglet "Informations Professionnelles"

### Échec de création
Si la création échoue, le système effectue automatiquement un rollback (suppression du compte partiellement créé) pour éviter les comptes orphelins.

## Sécurité

### Bonnes pratiques
1. ✅ Communiquez les identifiants via un canal sécurisé
2. ✅ Ne jamais envoyer par email non chiffré
3. ✅ Demandez à l'employé de changer son mot de passe dès la première connexion
4. ✅ Ne stockez pas le mot de passe dans un fichier partagé

### Ce qui est sécurisé
- ✅ Le mot de passe n'est jamais stocké en clair
- ✅ Le système utilise le hashage Supabase Auth
- ✅ Les identifiants sont générés de manière aléatoire
- ✅ Le mot de passe respecte les standards de sécurité

## Workflow complet

```
┌─────────────────────────────────────┐
│ 1. Remplir Infos Personnelles      │
│    - Prénom, Nom, Email            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Onglet Infos Professionnelles   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Clic "Créer compte"             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 4. Génération automatique          │
│    - Email normalisé               │
│    - Mot de passe sécurisé         │
│    - Rôle basé sur le titre        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 5. Affichage Modal Identifiants    │
│    - Copier email                  │
│    - Copier mot de passe           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 6. Compte sélectionné              │
│    automatiquement                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 7. Continuer le formulaire         │
│    et soumettre                    │
└─────────────────────────────────────┘
```

## Avantages

### Gain de temps
- ⏱️ Plus besoin de créer le compte dans un autre écran
- ⏱️ Génération instantanée en un clic
- ⏱️ Pas de va-et-vient entre différentes pages

### Réduction d'erreurs
- ✅ Format d'email standardisé automatiquement
- ✅ Pas d'erreur de typo dans l'email
- ✅ Attribution correcte du rôle
- ✅ Pas de compte orphelin grâce au rollback

### Expérience utilisateur améliorée
- 🎯 Workflow fluide en une seule page
- 🎯 Feedback visuel clair
- 🎯 Copie facile des identifiants
- 🎯 Indicateur de succès visible

## Support

Pour toute question ou problème :
1. Consultez la section "Gestion des erreurs" ci-dessus
2. Vérifiez que les champs obligatoires sont remplis
3. Contactez l'administrateur système si le problème persiste

---

**Dernière mise à jour** : 11 février 2026
**Version** : 1.0
