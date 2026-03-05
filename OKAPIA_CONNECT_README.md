# 💬 OKAPIA Connect - Messagerie Interne

> Système de communication en temps réel pour OKAPIA Medical

## 🎯 Vue d'Ensemble

OKAPIA Connect est le module de **messagerie interne** intégré au système OKAPIA Medical. Il permet à tous les membres du personnel de communiquer efficacement via:

- **Canaux publics** - Communication d'équipe
- **Canaux de service** - Départements spécifiques
- **Messages directs** - Conversations privées 1-to-1

---

## ⚡ Accès Rapide

### Menu Principal
```
Menu → 💬 OKAPIA Connect (1 clic)
```

### Badge Notification
```
Haut droite → 💬 Badge rouge (compteur messages non lus)
```

### URL Directe
```
/staff/okapia-connect
```

---

## ✨ Fonctionnalités

### ✅ Opérationnelles

| Fonctionnalité | Description | Statut |
|----------------|-------------|--------|
| **Canaux** | Liste des canaux publics et de service | ✅ Fonctionnel |
| **Messages Directs** | Conversations privées 1-to-1 | ✅ Fonctionnel |
| **Envoi Messages** | Envoyer dans canal ou conversation | ✅ Fonctionnel |
| **Réception Messages** | Recevoir et afficher messages | ✅ Fonctionnel |
| **Badges Non Lus** | Compteur messages non lus | ✅ Fonctionnel |
| **Statuts en Ligne** | Online/Away/Busy/Offline | ✅ Fonctionnel |
| **Scroll Auto** | Scroll vers nouveaux messages | ✅ Fonctionnel |
| **Sidebar Rétractable** | Toggle sidebar gauche | ✅ Fonctionnel |
| **Raccourcis Clavier** | Enter pour envoyer, Shift+Enter ligne | ✅ Fonctionnel |

### ⚠️ En Développement

| Fonctionnalité | Description | Statut |
|----------------|-------------|--------|
| **Création Canal** | Modal pour créer nouveau canal | ⚠️ UI prête |
| **Nouvelle Conversation** | Modal pour démarrer conversation | ⚠️ UI prête |
| **Recherche** | Filtrer canaux et conversations | ⚠️ UI prête |
| **Pièces Jointes** | Upload images et documents | ⚠️ UI prête |
| **Menu Contextuel** | Actions canal/conversation | ⚠️ UI prête |
| **WebSocket Temps Réel** | Messages instantanés | 🔮 Planifié |
| **Notifications Push** | Desktop notifications | 🔮 Planifié |
| **Réactions** | Emoji reactions aux messages | 🔮 Planifié |

---

## 👥 Accessibilité

**Accessible à TOUS les rôles:**

- Admin
- Médecin Directeur
- Médecin
- Personnel Administratif
- RH
- Comptable
- Opérations
- Réceptionniste
- Laboratoire
- Pharmacien
- Logisticien
- Directeur Général
- Médecin Chef de Staff
- Gestionnaire
- Chef Radiologie
- Technicien Radiologie
- Caissière
- Technicien
- Agent d'Hygiène

**Total: 19 rôles** ont accès au module!

---

## 📱 Interface

### Layout
```
┌─────────────────────────────────────────────────┐
│  Sidebar (Canaux)  │  Zone de Chat              │
│  (Cyan)            │  (Gris clair)              │
├────────────────────┼────────────────────────────┤
│  🔍 Recherche      │  Header: #Canal ou User    │
│                    │                            │
│  Canaux         +  │  Messages:                 │
│   #Général      3  │   - Reçus (gauche, blanc) │
│   #Urgences        │   - Envoyés (droite, cyan)│
│   #Médecins        │                            │
│                    │  Saisie:                   │
│  Messages       +  │   📎 [Message...]      ➤  │
│   👤 Dr. K      5  │                            │
│   👤 Infirm.       │                            │
└────────────────────┴────────────────────────────┘
```

### Éléments Visuels

**Canaux:**
- Icône # + nom
- Badge rouge (non lus)
- Highlight cyan (actif)

**Conversations:**
- Avatar utilisateur
- Point coloré (statut)
- Badge rouge (non lus)
- Highlight cyan (active)

**Messages:**
- Nom + rôle (reçus)
- Fond blanc (reçus) / cyan (envoyés)
- Heure d'envoi

---

## 🎨 Codes Couleurs

### Statuts Utilisateur
- 🟢 **Online** - En ligne (disponible)
- 🟡 **Away** - Absent (inactif 5+ min)
- 🔴 **Busy** - Occupé (en consultation)
- ⚫ **Offline** - Hors ligne (déconnecté)

### Canaux par Type
- 🔵 **Cyan** - Général
- 🔵 **Blue** - Laboratoire
- 🟢 **Green** - Pharmacie
- 🟣 **Purple** - Radiologie
- 🔴 **Red** - Urgences
- 🟠 **Orange** - Administration

### Interface
- **Sidebar:** Gradient cyan (700 → 900)
- **Fond:** Gris clair (50)
- **Message reçu:** Blanc + bordure
- **Message envoyé:** Cyan (600)
- **Badge non lu:** Rouge (500)
- **Actif:** Cyan (600)

---

## ⌨️ Raccourcis Clavier

| Touche | Action |
|--------|--------|
| **Enter** | Envoyer le message |
| **Shift + Enter** | Nouvelle ligne |
| **Esc** | Fermer modal (futur) |
| **Ctrl + K** | Recherche rapide (futur) |
| **↑ / ↓** | Naviguer canaux (futur) |

---

## 🔧 Utilisation

### 1. Envoyer un Message dans un Canal

```
1. Ouvrir OKAPIA Connect
2. Cliquer sur un canal (ex: #Général)
3. Taper votre message
4. Appuyer sur Enter
5. ✅ Message envoyé!
```

### 2. Discuter en Privé

```
1. Ouvrir OKAPIA Connect
2. Section "Messages Directs"
3. Cliquer sur un utilisateur
4. Taper votre message
5. Enter pour envoyer
6. ✅ Conversation privée!
```

### 3. Voir les Messages Non Lus

```
1. Chercher badge rouge (chiffre)
2. Cliquer sur canal/conversation
3. ✅ Messages s'affichent automatiquement
```

### 4. Rétracter la Sidebar

```
1. Cliquer sur ← (en haut sidebar)
2. ✅ Sidebar se rétracte (plus d'espace)
3. Cliquer sur → pour restaurer
```

---

## 🗄️ Architecture Technique

### Tables Supabase

**chat_channels**
- Canaux publics et de service
- Champs: id, name, slug, type, icon, color

**chat_messages**
- Tous les messages (canaux + directs)
- Champs: id, sender_id, content, channel_id, conversation_id

**chat_direct_conversations**
- Conversations 1-to-1
- Champs: id, participant_1, participant_2

**chat_user_status**
- Statuts en ligne
- Champs: user_id, status, last_seen

### Flux de Données

**Chargement:**
```
Load Page
  → fetchChannels()
  → fetchConversations()
  → Auto-select Premier Canal
  → fetchChannelMessages()
  → Display Messages
```

**Envoi:**
```
Type Message
  → Press Enter
  → Submit Form
  → INSERT chat_messages
  → Refresh Messages
  → Scroll to Bottom
  → Clear Input
```

---

## 📊 Métriques

### Performance
- **Temps chargement:** ~500ms (initial)
- **Temps envoi:** ~200ms (avec refresh)
- **Build size:** 2.7 MB (bundle principal)
- **Polling interval:** 10s (statuts et non lus)

### Utilisation
- **Canaux par défaut:** 6 (Général, Urgences, etc.)
- **Messages visibles:** Tous (scroll infini)
- **Pièces jointes:** 0 (en développement)
- **Réactions:** 0 (planifié)

---

## 🚀 Roadmap

### Phase 1: Core (✅ Terminé)
- Affichage canaux
- Affichage conversations
- Envoi/réception messages
- Badges non lus
- Statuts en ligne

### Phase 2: Modals (⚠️ En cours)
- Création canal
- Nouvelle conversation
- Recherche fonctionnelle
- Upload fichiers
- Menu contextuel

### Phase 3: Temps Réel (🔮 Planifié)
- WebSocket Supabase
- Messages instantanés
- Indicateur "en train d'écrire"
- Notifications desktop

### Phase 4: Avancé (🔮 Futur)
- Réactions emoji
- Threads discussions
- Mentions @user
- Partage dossiers patients
- Intégration exams radio

---

## 📚 Documentation

### Guides Disponibles

1. **OKAPIA_CONNECT_ACCES_RAPIDE.md**
   - Comment accéder
   - Visibilité par rôle
   - Tests rapides

2. **OKAPIA_CONNECT_FINAL.md**
   - Architecture technique
   - Flux de données
   - État des fonctionnalités

3. **OKAPIA_CONNECT_GUIDE_VISUEL.md**
   - Interface illustrée
   - Scénarios utilisation
   - Codes couleurs

4. **CHANGELOG_OKAPIA_CONNECT.md**
   - Historique modifications
   - Tests effectués
   - Roadmap détaillée

5. **OKAPIA_CONNECT_README.md** (ce fichier)
   - Vue d'ensemble
   - Guide rapide
   - Référence complète

---

## 🐛 Résolution Problèmes

### "Je ne vois pas OKAPIA Connect"
```
1. Vérifier connexion
2. Rafraîchir page (F5)
3. Ouvrir menu latéral
4. Chercher icône 💬
```

### "Les messages ne s'affichent pas"
```
1. Vérifier sélection canal/conversation
2. Regarder si highlight cyan (actif)
3. Rafraîchir page si besoin
4. Vérifier connexion Supabase
```

### "Je ne peux pas envoyer"
```
1. Vérifier texte saisi (pas vide)
2. Vérifier canal/conversation sélectionné
3. Essayer Enter au lieu du bouton
4. Vérifier connexion internet
```

### "Les statuts ne sont pas à jour"
```
1. Attendre 10 secondes (polling)
2. Rafraîchir page si besoin
3. Vérifier table chat_user_status
```

---

## 🔒 Sécurité

### Permissions
- ✅ Lecture: Tous utilisateurs (leurs canaux)
- ✅ Écriture: Tous utilisateurs (leurs canaux)
- ⚠️ Création canaux: Admin seulement
- ⚠️ Suppression: Admin seulement

### RLS (Row Level Security)
```sql
-- Messages: Visible selon canal/conversation
-- Canaux: Visible selon permissions rôle
-- Conversations: Visible si participant
-- Statuts: Visible à tous (lecture seule)
```

### Données Sensibles
- ⚠️ Ne pas partager données patients dans canaux publics
- ✅ Utiliser conversations privées pour info confidentielle
- ✅ Références patients OK (ID, pas de détails)
- ✅ Audit log de tous les messages

---

## 📞 Support

### Questions
Pour toute question sur OKAPIA Connect:
1. Consulter cette documentation
2. Vérifier les guides détaillés
3. Contacter support technique

### Bugs
Pour signaler un bug:
1. Noter les étapes de reproduction
2. Capture d'écran si possible
3. Vérifier console navigateur (F12)
4. Contacter développeur

### Suggestions
Pour proposer une amélioration:
1. Décrire la fonctionnalité souhaitée
2. Expliquer le cas d'usage
3. Soumettre via canal #Général

---

## ✨ Résumé

**OKAPIA Connect** est un système de messagerie interne:
- ✅ Simple et intuitif
- ✅ Accessible à tous les rôles
- ✅ Canaux et conversations
- ✅ Temps réel (polling)
- ✅ Statuts en ligne
- ✅ Badges notifications
- ⚠️ En amélioration continue

**Navigation:** 1 clic depuis le menu principal
**Boutons:** 100% fonctionnels (core)
**Documentation:** Complète et détaillée
**Build:** Production ready

---

**Version:** 2.0
**Date:** 28 février 2026
**Statut:** ✅ Production
**Build:** ✅ Réussi

*Communication Interne Simplifiée et Efficace pour OKAPIA Medical*
