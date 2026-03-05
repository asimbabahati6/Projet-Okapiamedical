# OKAPIA Connect - Guide d'Accès Rapide

## Comment accéder à OKAPIA Connect

### Méthode 1: Menu de Navigation Principal
1. Ouvrir la barre latérale (menu)
2. Développer la section **"Communication"**
3. Cliquer sur **"OKAPIA Connect"**

### Méthode 2: Badge de Notification
1. Regarder en haut à droite de l'écran
2. Cliquer sur l'icône **MessageSquare** (bulle de chat)
3. Badge rouge affiche le nombre de messages non lus
4. Navigation automatique vers OKAPIA Connect

### Méthode 3: URL Directe
```
/staff/okapia-connect
```

---

## Visibilité du Module

### ✅ Accessible à TOUS les rôles:
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

**Tous les utilisateurs** du système OKAPIA Medical peuvent utiliser la messagerie interne!

---

## Changements Effectués

### 1. Configuration RBAC (`src/config/rbac.ts`)
- ✅ Ajout d'une nouvelle section **"Communication"** dans le menu
- ✅ Item "OKAPIA Connect" accessible à tous les rôles
- ✅ Icône: `MessageSquare`

### 2. Navigation (`src/components/layout/RBACNavigation.tsx`)
- ✅ Import de l'icône `MessageSquare`
- ✅ Ajout dans `ICON_MAP`

### 3. Layout Principal (`src/pages/staff/StaffLayout.tsx`)
- ✅ Import du composant `ChatNotificationBell`
- ✅ Badge notification visible en permanence à côté de la cloche de notifications
- ✅ Affichage du compteur de messages non lus en temps réel

### 4. Routes (`src/App.tsx`)
- ✅ Route `/staff/okapia-connect` → OkapiaConnectPage
- ✅ Route `/staff/messaging` → Redirige vers OKAPIA Connect
- ✅ Import des composants nécessaires

### 5. Page de Redirection (`src/pages/staff/MessagingPage.tsx`)
- ✅ Redirection automatique vers `/staff/okapia-connect`
- ✅ Compatible avec ancien système de messagerie

---

## Test de Visibilité

### Vérification Rapide:
1. Se connecter à OKAPIA Medical
2. Ouvrir le menu latéral
3. Voir la section **"Communication"** (icône MessageSquare)
4. Développer la section
5. Cliquer sur **"OKAPIA Connect"**
6. Interface de chat s'affiche instantanément

### Badge de Notification:
- Visible en haut à droite
- Icône MessageSquare
- Badge rouge avec compteur si messages non lus
- Cliquable pour accès rapide

---

## Structure du Menu

```
📱 Communication (Nouvelle section)
  ├── 💬 OKAPIA Connect
  └── 💬 Messagerie Interne (redirige vers OKAPIA Connect)
```

---

## Canaux Disponibles

Tous les utilisateurs ont accès aux canaux selon leur rôle:

### Canaux Publics (Tous)
- **#Général** - Canal pour toute l'équipe

### Canaux de Service (Selon rôle)
- **#Laboratoire** - Équipe laboratoire + médecins
- **#Pharmacie** - Pharmaciens + médecins
- **#Radiologie** - Radiologues + médecins
- **#Administration** - Personnel admin + RH
- **#Urgences** - Staff urgences + médecins

### Canaux Privés (Restreints)
- **#Médecins** - Uniquement corps médical

---

## Fonctionnalités Visibles

### Badge de Notification
- Position: Haut droite, à côté de la cloche
- Couleur: Rouge avec animation pulse
- Affichage: Compteur de messages non lus
- Mise à jour: Automatique toutes les 10 secondes

### Interface OKAPIA Connect
- Sidebar rétractable (canaux + conversations)
- Messages en temps réel
- Bulles différenciées (envoyé/reçu)
- Statuts en ligne
- Zone de saisie avec support pièces jointes

---

## Permissions par Défaut

### Lecture
✅ Tous les utilisateurs peuvent lire les messages dans leurs canaux

### Écriture
✅ Tous les utilisateurs peuvent envoyer des messages

### Création de Canaux
⚠️ Réservé aux Admins et Médecin Directeur

### Modération
⚠️ Réservé aux Admins et Médecin Directeur

---

## Résolution de Problèmes

### "Je ne vois pas OKAPIA Connect"
1. Vérifier que vous êtes connecté
2. Rafraîchir la page (F5)
3. Vérifier que le menu latéral est ouvert
4. Chercher la section "Communication"

### "Le badge ne s'affiche pas"
1. Vérifier la connexion à Supabase
2. Vérifier que vous avez des messages non lus
3. Attendre 10 secondes (mise à jour auto)

### "Les canaux ne s'affichent pas"
1. Vérifier votre rôle dans le système
2. Certains canaux sont restreints par rôle
3. Le canal #Général est toujours visible

---

## État du Module

**Statut:** ✅ Visible et Accessible
**Build:** ✅ Réussi sans erreurs
**Routes:** ✅ Configurées
**Navigation:** ✅ Intégrée
**Permissions:** ✅ Configurées (TOUS les rôles)
**Notifications:** ✅ Badge actif
**Date:** 28 février 2026

---

## Prochaines Étapes

Pour améliorer encore la visibilité:

1. **Widget Flottant**
   - Ajouter `<FloatingChatWidget />` dans StaffLayout
   - Bouton rond toujours visible en bas à droite

2. **Raccourci Clavier**
   - Ctrl+K pour ouvrir OKAPIA Connect
   - Navigation rapide au clavier

3. **Onboarding**
   - Tutorial au premier lancement
   - Highlight du badge de notification

4. **Notifications Desktop**
   - Web Push API
   - Sons personnalisables

---

*OKAPIA Connect est maintenant accessible à tous les utilisateurs via le menu principal et le badge de notification!*
