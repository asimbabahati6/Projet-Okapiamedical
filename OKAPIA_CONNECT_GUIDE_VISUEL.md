# OKAPIA Connect - Guide Visuel Rapide

## 🎯 Accès en 1 Clic

```
Menu Principal
    │
    ├─ 🏥 Pôle Médical
    ├─ 🏢 Pôle Administratif
    ├─ 📦 Pôle Logistique
    ├─ 💰 Pôle Commercial & Finance
    │
    ├─ 💬 OKAPIA Connect  ← CLIC ICI (Direct!)
    │
    └─ ⚙️  Système
```

**Plus besoin de développer un sous-menu!**

---

## 📱 Interface Principale

```
┌─────────────────────────────────────────────────────────────────┐
│  OKAPIA Connect                                                 │
│  ┌──────────────┬────────────────────────────────────────────┐ │
│  │  SIDEBAR     │         ZONE DE CHAT                        │ │
│  │  (Cyan)      │         (Gris clair)                        │ │
│  ├──────────────┼────────────────────────────────────────────┤ │
│  │ 🔍 Recherche │  #Général                          ⋮       │ │
│  │              ├────────────────────────────────────────────┤ │
│  │ Canaux    +  │  ┌──────────────────────────────────────┐ │ │
│  │  #Général ●  │  │ Dr. Mukendi: Bonjour à tous!     10:15│ │ │
│  │  #Urgences   │  └──────────────────────────────────────┘ │ │
│  │  #Médecins   │                                            │ │
│  │              │  ┌──────────────────────────────────────┐ │ │
│  │ Messages  +  │  │             Message reçu         10:16│ │ │
│  │  👤 Dr. K  ● │  └──────────────────────────────────────┘ │ │
│  │  👤 Infirm.  │                                            │ │
│  │  👤 Pharma   │  ┌──────────────────────────────────────┐ │ │
│  │              │  │ Vous: Merci!                     10:17│ │ │
│  │              │  └──────────────────────────────────────┘ │ │
│  │              ├────────────────────────────────────────────┤ │
│  │              │  📎  [Taper un message...]        ➤       │ │
│  └──────────────┴────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Éléments Visuels

### Canaux
```
┌─────────────────────────┐
│ Canaux               +  │  ← Bouton + (création canal)
├─────────────────────────┤
│ # 🔵 Général         3  │  ← Badge rouge = 3 non lus
│ # ⚡ Urgences            │
│ # 💊 Pharmacie          │
│ # 🔬 Laboratoire    1   │
│ # 📸 Radiologie         │
└─────────────────────────┘
```

**Boutons Fonctionnels:**
- ✅ Clic sur canal → Change l'affichage
- ✅ Badge rouge → Compte messages non lus
- ✅ Highlight cyan → Canal actif
- ⚠️ Bouton + → UI prête (nécessite modal)

### Messages Directs
```
┌─────────────────────────┐
│ Messages Directs     +  │  ← Bouton + (nouvelle conv)
├─────────────────────────┤
│ 👤 🟢 Dr. Mukendi    5  │  ← Point vert = En ligne
│ 👤 🟡 Inf. Marie        │  ← Point jaune = Absent
│ 👤 🔴 Pharma Jean       │  ← Point rouge = Occupé
│ 👤 ⚫ Tech. Paul        │  ← Point gris = Hors ligne
└─────────────────────────┘
```

**Boutons Fonctionnels:**
- ✅ Clic sur utilisateur → Ouvre chat 1-to-1
- ✅ Badge rouge → Messages non lus
- ✅ Point coloré → Statut en temps réel
- ⚠️ Bouton + → UI prête (nécessite modal)

### Zone de Message
```
┌────────────────────────────────────────┐
│  Message Reçu (Gauche)                 │
│  ┌──────────────────────────────────┐  │
│  │ Dr. Mukendi · Médecin            │  │
│  │                                  │  │
│  │ Bonjour, patient en salle 3     │  │  ← Fond blanc
│  │                           10:15  │  │
│  └──────────────────────────────────┘  │
│                                        │
│              Message Envoyé (Droite)  │
│         ┌──────────────────────────┐   │
│         │ J'arrive tout de suite   │   │  ← Fond cyan
│         │                   10:16  │   │
│         └──────────────────────────┘   │
└────────────────────────────────────────┘
```

**Fonctionnalités:**
- ✅ Alignement automatique (reçu/envoyé)
- ✅ Nom + rôle pour messages reçus
- ✅ Heure d'envoi affichée
- ✅ Scroll automatique vers le bas

### Barre de Saisie
```
┌──────────────────────────────────────────────────┐
│  📎  │  Taper un message...               │  ➤  │
│      │  Shift+Enter = nouvelle ligne      │     │
│      │  Enter = envoyer                   │     │
└──────────────────────────────────────────────────┘
```

**Fonctionnalités:**
- ✅ Bouton Envoyer (Send)
- ✅ Raccourci Enter pour envoyer
- ✅ Shift+Enter pour nouvelle ligne
- ⚠️ Bouton 📎 Pièce jointe (UI prête)

---

## 🎮 Interactions Utilisateur

### Scénario 1: Envoyer un Message dans un Canal

```
1. 👆 Clic sur "#Général"
        ↓
   ✅ Canal devient cyan (actif)
   ✅ Messages du canal s'affichent
        ↓
2. ⌨️  Taper: "Bonjour à tous!"
        ↓
3. ↵   Appuyer sur Enter
        ↓
   ✅ Message envoyé
   ✅ Apparaît en bas à droite (cyan)
   ✅ Champ de saisie vidé
   ✅ Scroll automatique vers le bas
```

### Scénario 2: Discuter en Privé

```
1. 👆 Clic sur "👤 Dr. Mukendi"
        ↓
   ✅ Conversation devient cyan (active)
   ✅ Messages 1-to-1 s'affichent
   ✅ Statut visible: 🟢 En ligne
        ↓
2. ⌨️  Taper: "Merci pour ton aide"
        ↓
3. ↵   Appuyer sur Enter
        ↓
   ✅ Message privé envoyé
   ✅ Visible uniquement par vous et Dr. Mukendi
```

### Scénario 3: Rétracter la Sidebar

```
1. 👆 Clic sur ← (ChevronLeft)
        ↓
   ✅ Sidebar se rétracte (w-16)
   ✅ Plus d'espace pour les messages
   ✅ Icônes seulement visibles
        ↓
2. 👆 Clic sur → (ChevronRight)
        ↓
   ✅ Sidebar se développe (w-80)
   ✅ Noms complets visibles
```

---

## 🔔 Notifications Visuelles

### Badge de Messages Non Lus
```
Canal:         #Général  [3]  ← Badge rouge
Conversation:  Dr. K     [5]  ← Badge rouge
```

### Statuts en Ligne
```
🟢 Online  = En ligne (disponible)
🟡 Away    = Absent (inactif 5+ min)
🔴 Busy    = Occupé (en consultation)
⚫ Offline = Hors ligne (déconnecté)
```

### Highlight Actif
```
Non actif:  [Canal]           ← Hover: bg-cyan-800
Actif:      [Canal]           ← bg-cyan-600 (plus clair)
```

---

## 🎨 Codes Couleurs

### Canaux par Type
```
Général:      Cyan    🔵
Laboratoire:  Blue    🔵
Pharmacie:    Green   🟢
Radiologie:   Purple  🟣
Urgences:     Red     🔴
Admin:        Orange  🟠
```

### Interface
```
Sidebar:           Gradient Cyan (700 → 900)
Fond messages:     Gris clair (50)
Message reçu:      Blanc + bordure grise
Message envoyé:    Cyan (600)
Hover:             Cyan (800)
Actif:             Cyan (600)
Badge non lu:      Rouge (500)
```

---

## ⌨️ Raccourcis Clavier

| Touche | Action |
|--------|--------|
| **Enter** | Envoyer le message |
| **Shift + Enter** | Nouvelle ligne |
| **Esc** | *(Futur: Fermer modal)* |
| **Ctrl + K** | *(Futur: Recherche rapide)* |
| **↑ / ↓** | *(Futur: Naviguer canaux)* |

---

## 📊 Flux de Données

### Chargement Initial
```
Page Load
    ↓
fetchChannels()
    ↓
fetchConversations()
    ↓
Auto-select Premier Canal
    ↓
fetchChannelMessages()
    ↓
Affichage Messages
```

### Envoi Message
```
User Types → messageInput
    ↓
User Presses Enter
    ↓
Submit Form
    ↓
INSERT INTO chat_messages
    ↓
Refresh Messages
    ↓
Scroll to Bottom
    ↓
Clear Input
```

---

## 🎯 Points Clés

### ✅ Ce qui Fonctionne
1. **Clic sur Canaux** → Change vue + charge messages
2. **Clic sur Conversations** → Ouvre chat 1-to-1
3. **Envoi de Messages** → Insert DB + refresh + scroll
4. **Sidebar Rétractable** → Toggle width
5. **Badges Non Lus** → Compteur visible
6. **Statuts en Ligne** → Points colorés
7. **Raccourcis Clavier** → Enter/Shift+Enter

### ⚠️ UI Prête (Backend à Compléter)
1. **Bouton + Canaux** → Modal création
2. **Bouton + Messages** → Modal conversation
3. **Recherche** → Filtre canaux/convs
4. **Pièce Jointe** → Upload fichiers
5. **Menu (3 points)** → Actions contextuelles

---

## 🚀 Utilisation Rapide

### Pour l'Utilisateur Final

1. **Accéder:**
   - Menu → OKAPIA Connect (1 clic)
   - OU Badge notification (en haut à droite)

2. **Envoyer un Message:**
   - Choisir canal ou conversation
   - Taper message
   - Enter pour envoyer

3. **Voir Messages Non Lus:**
   - Chercher badge rouge
   - Cliquer sur canal/conversation
   - Messages s'affichent automatiquement

4. **Discuter en Privé:**
   - Messages Directs → Choisir utilisateur
   - Badge vert = en ligne
   - Conversation privée instantanée

---

*Interface intuitive, simple, et fonctionnelle pour communication interne efficace!*
