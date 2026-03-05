# 🔍 Guide de Débogage - Bouton "Démarrer la Conversation"

## 🎯 Objectif

Ce guide vous aide à identifier **exactement** pourquoi le bouton "Démarrer la Conversation" ne fonctionne pas toujours.

---

## 📋 Étapes de Débogage

### Étape 1: Ouvrir la Console Développeur

**Dans votre navigateur:**
1. Appuyez sur `F12` (ou `Cmd+Option+I` sur Mac)
2. Cliquez sur l'onglet **"Console"**
3. Gardez cette console ouverte pendant le test

### Étape 2: Tester le Bouton

1. Accédez à **OKAPIA Connect**
2. Cliquez sur le bouton **"+"** à côté de "Messages Directs"
3. Le modal "Nouvelle Conversation" s'ouvre
4. Sélectionnez un utilisateur (exemple: "Merlin Bazebosso Bweluzeyi")
5. Cliquez sur **"Démarrer la Conversation"**

### Étape 3: Lire les Logs dans la Console

Vous devriez voir une séquence de logs comme ceci:

#### ✅ Scénario de SUCCÈS (tout fonctionne)

```
=== handleCreateConversation START ===
Selected user: {id: "abc123", full_name: "Merlin Bazebosso Bweluzeyi", role: "Logistician", status: "online"}
Current user: xyz789

Checking for existing conversation...
Existing conversation check: null Error: null

Creating new conversation...
Participant 1 (current user): xyz789
Participant 2 (selected user): abc123

Insert result: {id: "conv-12345", participant_1: "xyz789", participant_2: "abc123"} Error: null
✅ Created new conversation: conv-12345
Calling onSuccess with ID: conv-12345

=== onSuccess called with conversationId: conv-12345
Conversation data: {id: "conv-12345", participant_1: "xyz789", participant_2: "abc123"} Error: null
Other user ID: abc123
View data: {id: "abc123", full_name: "Merlin Bazebosso Bweluzeyi", role: "Logistician"} Error: null
Final user info: {id: "abc123", full_name: "Merlin Bazebosso Bweluzeyi", role: "Logistician"}
Status data: {status: "online"}
New conversation object: {id: "conv-12345", otherUser: {...}}
Conversation selected!

=== handleCreateConversation END ===
```

**✅ Résultat:** La conversation s'ouvre automatiquement!

---

#### ❌ Scénario d'ÉCHEC (identifier le problème)

Lisez attentivement les logs pour identifier **où** ça échoue:

---

### 🔴 Problème 1: Conversation existe déjà mais ne s'ouvre pas

**Logs:**
```
=== handleCreateConversation START ===
Checking for existing conversation...
Existing conversation check: {id: "conv-99999"} Error: null
✅ Found existing conversation: conv-99999
Calling onSuccess with ID: conv-99999

=== onSuccess called with conversationId: conv-99999
Conversation data: null Error: {code: "PGRST116", message: "..."}
❌ Error fetching conversation: {...}
```

**Diagnostic:**
- La conversation existe en DB
- MAIS la requête pour la récupérer échoue dans `onSuccess`

**Solution:**
- Vérifier que la conversation n'a pas été supprimée entre-temps
- Vérifier les permissions RLS sur `chat_direct_conversations`

**Commande SQL de vérification:**
```sql
-- Dans votre console Supabase
SELECT * FROM chat_direct_conversations 
WHERE id = 'conv-99999';

-- Vérifier les permissions
SELECT * FROM pg_policies 
WHERE tablename = 'chat_direct_conversations';
```

---

### 🔴 Problème 2: Erreur lors de la création

**Logs:**
```
=== handleCreateConversation START ===
Creating new conversation...
Insert result: null Error: {code: "23505", message: "duplicate key violation"}
❌ Insert error: {...}
```

**Diagnostic:**
- Tentative de créer une conversation
- Erreur: "duplicate key violation" (doublon)

**Cause:**
- La vérification `existingConv` n'a pas trouvé la conversation
- MAIS elle existe quand même (problème de synchronisation)

**Solution:**
- Améliorer la requête de vérification
- Ajouter un `UNIQUE` constraint sur (participant_1, participant_2)

---

### 🔴 Problème 3: user_profiles_with_email indisponible

**Logs:**
```
=== onSuccess called with conversationId: conv-12345
Other user ID: abc123
View data: null Error: {code: "42P01", message: "relation user_profiles_with_email does not exist"}
Fallback to user_profiles...
Profile data: {id: "abc123", full_name: "Merlin B.", role_id: "role-123"} Error: null
Role data: {name: "Logistician"}
Final user info: {id: "abc123", full_name: "Merlin B.", role: "Logistician"}
✅ Conversation selected!
```

**Diagnostic:**
- La vue `user_profiles_with_email` n'existe pas
- Le fallback vers `user_profiles` fonctionne ✅

**Résultat:** Pas de problème! Le fallback gère ce cas.

---

### 🔴 Problème 4: Utilisateur introuvable

**Logs:**
```
=== onSuccess called with conversationId: conv-12345
Other user ID: abc123
View data: null Error: null
Fallback to user_profiles...
Profile data: null Error: null
Final user info: {id: "abc123", full_name: "Utilisateur", role: "Utilisateur"}
✅ Conversation selected!
```

**Diagnostic:**
- L'utilisateur n'existe pas dans `user_profiles`
- Le fallback ultime utilise des valeurs par défaut ✅

**Résultat:** La conversation s'ouvre quand même avec "Utilisateur" comme nom.

**Action recommandée:**
Vérifier pourquoi l'utilisateur n'existe pas:
```sql
SELECT * FROM user_profiles WHERE id = 'abc123';
```

---

### 🔴 Problème 5: Erreur critique non gérée

**Logs:**
```
=== handleCreateConversation START ===
...
=== ERROR in handleCreateConversation === {message: "Network error", ...}
=== handleCreateConversation END ===

=== CRITICAL ERROR in onSuccess: {message: "..."}
Fallback: found conversation, will refresh list
```

**Diagnostic:**
- Erreur réseau ou autre problème inattendu
- Le système tente un fallback

**Actions:**
1. Vérifier votre connexion internet
2. Vérifier que Supabase est accessible
3. Vérifier les credentials dans `.env`

---

## 🛠️ Corrections Possibles

### Fix 1: Problème de Permissions RLS

Si les logs montrent des erreurs de permission:

**1. Vérifier les policies:**
```sql
-- Dans Supabase SQL Editor
SELECT * FROM pg_policies 
WHERE tablename = 'chat_direct_conversations';
```

**2. Ajouter policy si manquante:**
```sql
-- Politique de lecture pour ses propres conversations
CREATE POLICY "Users can read their conversations"
ON chat_direct_conversations
FOR SELECT
TO authenticated
USING (
  participant_1 = auth.uid() OR 
  participant_2 = auth.uid()
);

-- Politique de création
CREATE POLICY "Users can create conversations"
ON chat_direct_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  participant_1 = auth.uid() OR 
  participant_2 = auth.uid()
);
```

---

### Fix 2: Vue user_profiles_with_email manquante

Si vous voyez "relation user_profiles_with_email does not exist":

**Option A:** Créer la vue (Recommandé)
```sql
CREATE OR REPLACE VIEW user_profiles_with_email AS
SELECT
  up.id,
  up.full_name,
  up.email,
  r.name as role,
  up.role_id,
  up.department_id,
  up.is_active,
  up.created_at
FROM user_profiles up
LEFT JOIN roles r ON r.id = up.role_id;

-- Permissions
GRANT SELECT ON user_profiles_with_email TO authenticated;
```

**Option B:** Ne rien faire
Le fallback automatique vers `user_profiles` + `roles` fonctionne parfaitement.

---

### Fix 3: Détection de Doublons

Si vous voyez "duplicate key violation":

**Ajouter un constraint unique:**
```sql
-- Créer une fonction pour trier les participants
CREATE OR REPLACE FUNCTION normalize_participants(p1 UUID, p2 UUID)
RETURNS UUID[] AS $$
BEGIN
  IF p1 < p2 THEN
    RETURN ARRAY[p1, p2];
  ELSE
    RETURN ARRAY[p2, p1];
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ajouter une colonne calculée
ALTER TABLE chat_direct_conversations
ADD COLUMN IF NOT EXISTS participants_normalized UUID[]
GENERATED ALWAYS AS (normalize_participants(participant_1, participant_2)) STORED;

-- Ajouter un index unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_conversation
ON chat_direct_conversations (participants_normalized);
```

---

## 📊 Checklist de Débogage

Utilisez cette checklist pour identifier systématiquement le problème:

### ✅ Avant de Tester
- [ ] Console développeur ouverte (F12)
- [ ] Onglet "Console" sélectionné
- [ ] Connexion Supabase stable
- [ ] Utilisateur connecté

### ✅ Pendant le Test
- [ ] Modal "Nouvelle Conversation" s'ouvre
- [ ] Liste des utilisateurs s'affiche
- [ ] Utilisateur sélectionné (surligné cyan)
- [ ] Clic sur "Démarrer la Conversation"

### ✅ Logs à Vérifier
- [ ] `=== handleCreateConversation START ===` apparaît
- [ ] `Selected user:` affiche les bonnes infos
- [ ] `Current user:` affiche votre ID
- [ ] Soit `✅ Found existing` SOIT `✅ Created new`
- [ ] `Calling onSuccess with ID:` apparaît
- [ ] `=== onSuccess called with conversationId:` apparaît
- [ ] `Conversation data:` a des données (pas null)
- [ ] `Final user info:` a des données
- [ ] `Conversation selected!` apparaît
- [ ] `=== handleCreateConversation END ===` apparaît

### ✅ Résultat Attendu
- [ ] Modal se ferme
- [ ] Conversation apparaît dans sidebar (surligné cyan)
- [ ] Header affiche le nom de l'utilisateur
- [ ] Zone de chat est active
- [ ] Champ de saisie disponible

---

## 🆘 Signaler le Problème

Si après avoir suivi ce guide, le problème persiste:

**1. Copier TOUS les logs de la console**
```
Clic droit dans la console → "Save as..." → logs.txt
```

**2. Prendre une capture d'écran:**
- [ ] Modal "Nouvelle Conversation" avec utilisateur sélectionné
- [ ] Console avec les logs d'erreur

**3. Noter:**
- Quel utilisateur avez-vous sélectionné?
- Est-ce la première fois ou une conversation existante?
- À quelle étape exactement ça échoue? (voir logs)

**4. Fournir ces informations:**
- Logs complets
- Captures d'écran
- Réponses aux questions ci-dessus

---

## 🎓 Comprendre le Flux

### Flux Normal (Nouvelle Conversation)

```
1. Utilisateur clique "Démarrer"
   ↓
2. handleCreateConversation() appelée
   ↓
3. Vérification existence conversation
   ↓ (non trouvée)
4. INSERT nouvelle conversation en DB
   ↓
5. Récupération ID: "conv-12345"
   ↓
6. onSuccess(conv-12345) appelée
   ↓
7. SELECT conversation depuis DB
   ↓
8. Identification otherUserId
   ↓
9. SELECT user_profiles_with_email
   ↓ (OU fallback user_profiles + roles)
10. SELECT chat_user_status
   ↓
11. Construction objet DirectConversation
   ↓
12. setSelectedConversation(newConv)
   ↓
13. setSelectedChannel(null)
   ↓
14. fetchConversations() en arrière-plan
   ↓
15. Modal se ferme
   ↓
16. ✅ Conversation ouverte!
```

### Points de Défaillance Possibles

```
Étape 3: ❌ Erreur RLS (permissions)
Étape 4: ❌ Erreur INSERT (doublon, contrainte)
Étape 7: ❌ Conversation introuvable après création
Étape 9: ❌ Vue inexistante (fallback OK)
Étape 10: ❌ Statut inexistant (fallback OK)
Étape 12: ❌ État React non mis à jour
```

---

## 🎯 Conclusion

**Avec les logs détaillés ajoutés, vous pouvez maintenant:**

1. ✅ Identifier **exactement** où le problème se produit
2. ✅ Voir les données à chaque étape
3. ✅ Détecter les erreurs Supabase
4. ✅ Valider que le fallback fonctionne
5. ✅ Tracer le flux complet

**Suivez ce guide et partagez les logs pour un diagnostic précis!**

---

**Date:** 28 février 2026
**Version:** 2.1.3 (debug mode)
**Statut:** 🔍 **OUTILS DE DEBUG ACTIVÉS**
