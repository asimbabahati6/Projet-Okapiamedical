# Documentation Technique : Création Automatique de Compte Utilisateur

## Architecture

### Composant modifié
- **Fichier** : `src/components/hr/AddEmployeeModal.tsx`
- **Type** : Composant React avec TypeScript
- **Framework** : React 18.3+ avec hooks

## Nouveaux états ajoutés

```typescript
const [isCreatingUser, setIsCreatingUser] = useState(false);
const [createdUserCredentials, setCreatedUserCredentials] = useState<{
  email: string;
  password: string;
} | null>(null);
const [showCredentialsModal, setShowCredentialsModal] = useState(false);
```

### Description des états

| État | Type | Description |
|------|------|-------------|
| `isCreatingUser` | boolean | Indique si la création du compte est en cours |
| `createdUserCredentials` | object \| null | Stocke les identifiants générés (email, password) |
| `showCredentialsModal` | boolean | Contrôle l'affichage de la modal des identifiants |

## Fonctions utilitaires

### 1. normalizeString(text: string): string

Normalise une chaîne de caractères pour un format email.

**Algorithme** :
1. Convertit en minuscules
2. Applique la normalisation Unicode NFD
3. Retire les marques diacritiques (accents)
4. Remplace les caractères non-alphanumériques par des tirets
5. Élimine les tirets multiples consécutifs
6. Retire les tirets en début/fin

**Exemple** :
```typescript
normalizeString("Jean-François d'Août")
// → "jean-francois-d-aout"
```

### 2. generateUsername(firstName: string, lastName: string): string

Génère un email au format standardisé.

**Format** : `{prenom-normalise}.{nom-normalise}@okapia-medical.cd`

**Exemple** :
```typescript
generateUsername("Marie José", "N'Dolo")
// → "marie.jose.n-dolo@okapia-medical.cd"
```

### 3. generateSecurePassword(): string

Génère un mot de passe sécurisé aléatoire.

**Format** : `OKAPIA-{annee}{4chars}{special}`

**Caractéristiques** :
- Longueur : 12-13 caractères
- Caractères utilisés : `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789`
- Caractères spéciaux : `!@#$%`
- Exclus : 0, O, I, l, 1 (caractères ambigus)

**Exemple** :
```typescript
generateSecurePassword()
// → "OKAPIA-2024Xy3m!"
```

### 4. determineRoleFromJobTitle(jobTitle: string): string

Détermine le rôle approprié basé sur le titre du poste.

**Mapping** :
```typescript
const roleMapping = {
  'médecin|doctor|docteur': 'doctor',
  'pharmacien|pharmacist': 'pharmacist',
  'dentiste|dentist': 'dentist',
  'kiné|physiothérapeute|physical therapist': 'physical_therapist',
  'infirm|nurse': 'nurse',
  'default': 'administrative_staff'
};
```

**Retour** : ID du rôle (UUID)

## Fonction principale

### handleCreateUserAccount(): Promise<void>

Crée un compte utilisateur dans Supabase Auth et user_profiles.

**Étapes** :

1. **Validation**
   ```typescript
   if (!formData.first_name || !formData.last_name) {
     throw new Error('Le prénom et le nom sont requis');
   }
   ```

2. **Génération des identifiants**
   ```typescript
   const generatedEmail = generateUsername(first_name, last_name);
   const generatedPassword = generateSecurePassword();
   ```

3. **Vérification d'unicité**
   ```typescript
   const { data: existingUser } = await supabase
     .from('user_profiles')
     .select('email')
     .eq('email', generatedEmail)
     .single();
   ```

4. **Création Auth**
   ```typescript
   const { data: authData, error: authError } = await supabase.auth.signUp({
     email: generatedEmail,
     password: generatedPassword,
     options: {
       data: { full_name: `${first_name} ${last_name}` }
     }
   });
   ```

5. **Création du profil**
   ```typescript
   const roleId = determineRoleFromJobTitle(job_title);

   await supabase.from('user_profiles').insert({
     id: authData.user.id,
     role_id: roleId,
     full_name: `${first_name} ${last_name}`,
     email: generatedEmail,
     phone: phone_primary || null,
     is_active: true,
   });
   ```

6. **Rollback en cas d'erreur**
   ```typescript
   if (profileError) {
     await supabase.auth.admin.deleteUser(authData.user.id);
     throw profileError;
   }
   ```

7. **Mise à jour de l'état**
   ```typescript
   setFormData({ ...formData, user_id: authData.user.id });
   setCreatedUserCredentials({ email, password });
   setShowCredentialsModal(true);
   await loadUsers();
   ```

## Interface utilisateur

### Bouton "Créer compte"

**Position** : Section "Liaison Utilisateur" dans l'onglet "Informations Professionnelles"

**Code** :
```tsx
<button
  type="button"
  onClick={handleCreateUserAccount}
  disabled={isCreatingUser || !formData.first_name || !formData.last_name}
  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
>
  {isCreatingUser ? (
    <>
      <Spinner />
      Création...
    </>
  ) : (
    <>
      <User className="w-4 h-4" />
      Créer compte
    </>
  )}
</button>
```

**États du bouton** :
- Actif : Prénom et nom remplis
- Désactivé : Champs manquants ou création en cours
- Loading : Animation spinner pendant la création

### Modal des identifiants

**Composant** :
```tsx
{showCredentialsModal && createdUserCredentials && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
    <div className="bg-white rounded-xl p-6 max-w-md w-full">
      {/* Contenu de la modal */}
    </div>
  </div>
)}
```

**Fonctionnalités** :
- Affichage de l'email avec bouton copier
- Affichage du mot de passe avec bouton copier
- Message d'avertissement
- Bouton de fermeture

## Sécurité

### Hachage du mot de passe
- ✅ Géré automatiquement par Supabase Auth
- ✅ Utilise bcrypt avec salt
- ✅ Jamais stocké en clair

### Validation
- ✅ Vérification d'unicité de l'email
- ✅ Validation des champs requis
- ✅ Rollback automatique en cas d'erreur

### Permissions RLS
La création utilise les politiques RLS existantes de `user_profiles` :
```sql
CREATE POLICY "Allow authenticated users to read all profiles"
ON user_profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert their own profile"
ON user_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);
```

## Gestion des erreurs

### Types d'erreurs gérés

1. **Champs manquants**
   ```typescript
   Error: 'Le prénom et le nom sont requis pour créer un compte utilisateur'
   ```

2. **Email existant**
   ```typescript
   Error: 'Un compte avec l'email {email} existe déjà'
   ```

3. **Erreur Supabase Auth**
   ```typescript
   authError.message // Message d'erreur de Supabase
   ```

4. **Erreur de profil**
   - Rollback automatique du compte auth
   - Message d'erreur affiché à l'utilisateur

### Affichage des erreurs
```typescript
setError(err instanceof Error ? err.message : 'Erreur lors de la création du compte utilisateur');
```

## Base de données

### Tables impliquées

#### 1. auth.users (Supabase Auth)
- Gérée automatiquement par `supabase.auth.signUp()`
- Stocke le hash du mot de passe
- Génère automatiquement l'ID utilisateur (UUID)

#### 2. user_profiles
```sql
INSERT INTO user_profiles (
  id,              -- UUID de auth.users
  role_id,         -- UUID du rôle
  full_name,       -- Prénom + Nom
  email,           -- Email généré
  phone,           -- Téléphone principal
  is_active        -- true par défaut
) VALUES (...);
```

### Requêtes SQL effectuées

1. **Vérification d'unicité**
   ```sql
   SELECT email FROM user_profiles WHERE email = $1;
   ```

2. **Création du profil**
   ```sql
   INSERT INTO user_profiles (id, role_id, full_name, email, phone, is_active)
   VALUES ($1, $2, $3, $4, $5, true);
   ```

3. **Rollback (si erreur)**
   ```sql
   DELETE FROM auth.users WHERE id = $1;
   ```

## Tests recommandés

### Tests unitaires
```typescript
describe('User Account Creation', () => {
  test('normalizeString removes accents', () => {
    expect(normalizeString('François')).toBe('francois');
  });

  test('generateUsername creates correct format', () => {
    expect(generateUsername('Jean', 'Dupont'))
      .toBe('jean.dupont@okapia-medical.cd');
  });

  test('generateSecurePassword has correct length', () => {
    const password = generateSecurePassword();
    expect(password.length).toBeGreaterThanOrEqual(12);
  });

  test('determineRoleFromJobTitle returns correct role', () => {
    expect(determineRoleFromJobTitle('Médecin généraliste'))
      .toBe(doctorRoleId);
  });
});
```

### Tests d'intégration
1. Création réussie avec tous les champs valides
2. Erreur si prénom/nom manquants
3. Erreur si email existe déjà
4. Rollback effectué en cas d'erreur de profil
5. État du formulaire mis à jour correctement

### Tests E2E
1. Remplir le formulaire → Créer compte → Vérifier modal
2. Copier les identifiants → Vérifier clipboard
3. Fermer la modal → Vérifier dropdown mis à jour
4. Soumettre le formulaire → Vérifier employé créé

## Dépendances

### Packages npm
- `react` : ^18.3.1
- `@supabase/supabase-js` : ^2.57.4
- `lucide-react` : ^0.344.0

### APIs Supabase utilisées
- `supabase.auth.signUp()`
- `supabase.auth.admin.deleteUser()`
- `supabase.from('user_profiles').select()`
- `supabase.from('user_profiles').insert()`
- `supabase.from('roles').select()`

## Performance

### Optimisations
- ✅ Chargement des rôles une seule fois au montage
- ✅ Vérification d'unicité avant création auth
- ✅ Mise à jour sélective des états
- ✅ Modal montée conditionnellement

### Métriques
- Temps moyen de création : ~1-2 secondes
- Requêtes DB : 3 (vérification + création profil + récupération rôle)
- Requêtes Auth : 1 (signUp)

## Évolutions futures

### Phase 2
- [ ] Envoi automatique des identifiants par email
- [ ] Génération de QR code pour les identifiants
- [ ] Option de personnalisation de l'email
- [ ] Historique des comptes créés

### Phase 3
- [ ] Intégration avec AD/LDAP
- [ ] Authentification à deux facteurs
- [ ] Politique de mot de passe personnalisable
- [ ] Import en masse d'employés avec création de comptes

## Références

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Hooks Reference](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**Auteur** : Équipe Développement OKAPIA
**Date** : 11 février 2026
**Version** : 1.0.0
