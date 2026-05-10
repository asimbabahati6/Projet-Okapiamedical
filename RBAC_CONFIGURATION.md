# 🔐 Configuration RBAC - OKAPIA Medical

## Vue d'Ensemble

Ce document décrit la configuration complète du système RBAC (Role-Based Access Control) de la plateforme OKAPIA Medical.

---

## 📊 Matrice Complète des Permissions

### Légende
- ✅ Accès complet
- 🔹 Accès limité (lecture seule ou fonctions limitées)
- ❌ Aucun accès

---

## 🎭 Rôles et Niveaux

| Rôle | Niveau | Utilisateurs | Accès Backend |
|------|--------|--------------|---------------|
| super_admin | 1 | 1 | ✅ Complet |
| hospital_admin | 2 | 2 | ✅ Complet |
| logistician | 2 | 1 | ✅ Complet |
| doctor | 3 | 6 | ✅ Médical |
| nurse | 4 | 10 | ✅ Soins |
| administrative_staff | 4 | 6 | ✅ Administratif |
| pharmacist | 5 | 4 | ✅ Pharmacie |
| receptionist | 6 | 0 | ✅ Réception |
| patient | 6 | 2 | ❌ Bloqué |

---

## 🔑 Permissions Détaillées par Module

### 1. Tableau de Bord

| Rôle | Accès | Widgets Visibles |
|------|-------|------------------|
| super_admin | ✅ | Tous |
| hospital_admin | ✅ | Tous sauf système |
| doctor | ✅ | Médical, Patients |
| nurse | ✅ | Patients, Soins |
| receptionist | ✅ | Rendez-vous, Patients |
| administrative_staff | ✅ | Administratif, Stats |
| pharmacist | ✅ | Pharmacie, Stocks |
| logistician | ✅ | Logistique, Stocks |
| patient | ❌ | Aucun |

---

### 2. Gestion des Patients

| Module | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Voir liste patients | ✅ | ✅ | ✅ | ✅ | ✅ | 🔹 | 🔹 | ❌ | ❌ |
| Créer patient | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modifier patient | ✅ | ✅ | ✅ | 🔹 | ✅ | ❌ | ❌ | ❌ | ❌ |
| Supprimer patient | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voir dossier médical | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | 🔹 | ❌ | ❌ |
| Export données | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### 3. Consultations

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Créer consultation | ✅ | ✅ | ✅ | 🔹 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modifier consultation | ✅ | ✅ | ✅ | 🔹 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voir consultations | ✅ | ✅ | ✅ | ✅ | 🔹 | ❌ | 🔹 | ❌ | ❌ |
| Historique complet | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Supprimer consultation | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### 4. Rendez-vous

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Voir tous rendez-vous | ✅ | ✅ | ✅ | ✅ | ✅ | 🔹 | ❌ | ❌ | ❌ |
| Créer rendez-vous | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modifier rendez-vous | ✅ | ✅ | ✅ | 🔹 | ✅ | ❌ | ❌ | ❌ | ❌ |
| Annuler rendez-vous | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestion file d'attente | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### 5. Prescriptions

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Créer prescription | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voir prescriptions | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Modifier prescription | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Délivrer médicaments | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Export prescriptions | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

### 6. Pharmacie

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Gestion stock médicaments | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | 🔹 | ❌ |
| Ajouter médicament | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Modifier médicament | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Voir alertes stock | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Délivrance | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

### 7. Laboratoire

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Créer analyse | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voir résultats | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Saisir résultats | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Export résultats | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### 8. Facturation

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Créer facture | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Voir factures | ✅ | ✅ | 🔹 | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Modifier facture | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Paiements | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

### 9. Gestion du Personnel

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Voir liste staff | ✅ | ✅ | 🔹 | ❌ | 🔹 | ✅ | ❌ | ❌ | ❌ |
| Ajouter staff | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modifier staff | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Supprimer staff | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestion présences | ✅ | ✅ | 🔹 | 🔹 | 🔹 | ✅ | 🔹 | 🔹 | ❌ |

---

### 10. Présences/Pointage

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Pointer (soi-même) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Voir propres présences | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Voir toutes présences | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Gérer pauses | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Valider congés | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

### 11. Logistique

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Gestion stocks | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | 🔹 | ✅ | ❌ |
| Mouvements stock | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | 🔹 | ✅ | ❌ |
| Fournisseurs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Transport | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Rapports logistique | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

### 12. Courrier

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Créer courrier | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assigner courrier | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Voir assignations | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Répondre courrier | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Export courrier | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

### 13. Documents Médicaux

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Génération documents | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voir documents | ✅ | ✅ | ✅ | ✅ | 🔹 | ❌ | 🔹 | ❌ | ❌ |
| Partage documents | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Export bulk | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### 14. Messagerie

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Envoyer messages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Recevoir messages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Messages groupes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

### 15. Actualités/Posts

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Créer post | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modifier post | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Supprimer post | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voir posts (backend) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Voir posts (public) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

### 16. Paramètres Système

| Action | super_admin | hospital_admin | doctor | nurse | receptionist | admin_staff | pharmacist | logistician | patient |
|--------|-------------|----------------|--------|-------|--------------|-------------|------------|-------------|---------|
| Gestion rôles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestion départements | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestion services | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Paramètres système | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Géolocalisation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔄 Hiérarchie et Priorités

### Ordre de Priorité
```
1. super_admin (Priorité absolue)
   ↓
2. hospital_admin (Gestion opérationnelle)
   ↓
3. Rôles spécialisés (doctor, logistician)
   ↓
4. Rôles support (nurse, administrative_staff)
   ↓
5. Rôles de service (pharmacist, receptionist)
   ↓
6. patient (Aucun accès backend)
```

### Règles de Conflit

**Si un utilisateur a plusieurs rôles:**
- Le rôle avec le niveau le plus bas (priorité la plus haute) prévaut
- Super_admin a toujours priorité absolue
- En cas d'égalité de niveau, le rôle le plus récent est utilisé

---

## 🛡️ Implémentation Technique

### Dans AuthContext.tsx

```typescript
// Liste des rôles autorisés au backend
const allowedRoles = [
  'doctor',
  'nurse',
  'receptionist',
  'hospital_admin',
  'super_admin',
  'administrative_staff',
  'pharmacist',
  'logistician'
];

// Vérification d'accès
function canAccessBackend(): boolean {
  if (!profile?.role) return false;
  return allowedRoles.includes(profile.role.name);
}

// Vérification patient
function isPatient(): boolean {
  if (!profile?.role) return false;
  return profile.role.name === 'patient';
}

// Vérification admin
function canManagePosts(): boolean {
  if (!profile?.role) return false;
  return profile.role.name === 'hospital_admin' ||
         profile.role.name === 'super_admin';
}
```

### Dans ProtectedRoute.tsx

```typescript
// Ordre de vérification
1. Authentification (user exists)
2. Profil chargé (profile exists)
3. Bloquer patient (isPatient())
4. Vérifier accès backend (canAccessBackend())
5. Vérification admin si requis (requireAdmin)
```

---

## 📝 Bonnes Pratiques

### 1. Principe du Moindre Privilège
- Accorder uniquement les permissions nécessaires
- Réévaluer régulièrement les besoins
- Documenter les exceptions

### 2. Séparation des Responsabilités
- Séparer les rôles administratifs et opérationnels
- Éviter les comptes partagés
- Un utilisateur = un rôle principal

### 3. Audit et Surveillance
- Logger les accès sensibles
- Surveiller les tentatives d'accès refusées
- Révision périodique des permissions

### 4. Gestion des Exceptions
- Super_admin peut tout faire (use with caution)
- Hospital_admin délègue certaines tâches
- Permissions temporaires via système dédié

---

## 🔧 Maintenance

### Ajout d'un Nouveau Rôle

1. Ajouter dans la table `roles` (base de données)
2. Ajouter dans `STAFF_ROLES` si accès backend requis (restoreStaffAccess.ts)
3. Ajouter dans `allowedRoles` si accès backend (AuthContext.tsx)
4. Définir les permissions spécifiques (RLS policies)
5. Documenter dans cette matrice
6. Tester l'accès complet

### Modification des Permissions

1. Identifier le rôle concerné
2. Mettre à jour les politiques RLS Supabase
3. Mettre à jour la logique frontend si nécessaire
4. Documenter les changements
5. Tester avec un compte de test

---

## ✅ Checklist de Vérification

**Pour chaque rôle:**
- [ ] Défini dans la table `roles`
- [ ] Niveau de priorité approprié
- [ ] Inclus dans `allowedRoles` si staff
- [ ] Politiques RLS configurées
- [ ] Tests d'accès effectués
- [ ] Documentation à jour

**Pour chaque module:**
- [ ] Permissions définies par rôle
- [ ] Logique de vérification implémentée
- [ ] Messages d'erreur appropriés
- [ ] Tests de non-régression

---

## 📊 Résumé Visuel

```
┌──────────────────────────────────────────────┐
│           HIÉRARCHIE DES RÔLES               │
└──────────────────────────────────────────────┘

     🔴 SUPER_ADMIN (Niveau 1)
          Accès Total
              │
     ┌────────┴────────┐
     │                 │
🟠 HOSPITAL_ADMIN  🟠 LOGISTICIAN (Niveau 2)
   Gestion Hôpital    Logistique
     │
     ├─── 🟡 DOCTOR (Niveau 3)
     │     Médical
     │
     ├─── 🟢 NURSE (Niveau 4)
     │     Soins
     │
     ├─── 🟢 ADMINISTRATIVE_STAFF (Niveau 4)
     │     Administratif
     │
     ├─── 🔵 PHARMACIST (Niveau 5)
     │     Pharmacie
     │
     └─── 🟣 RECEPTIONIST (Niveau 6)
           Réception

     ⚫ PATIENT (Niveau 6)
        Aucun Accès Backend
```

---

**Document maintenu par:** Équipe Développement
**Dernière révision:** 24 Novembre 2024
**Version:** 1.0.0
