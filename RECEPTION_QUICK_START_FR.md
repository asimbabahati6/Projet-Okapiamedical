# 🏥 Réception & Accueil - Guide Rapide

## ⚡ Démarrage Rapide (2 minutes)

### Accès au Module

```
🏠 Tableau de Bord
   → 📋 Pôle Administratif
      → 🚪 Réception & Accueil
```

**URL:** `/staff/patient-checkin`

---

## 📊 Vue d'ensemble de l'Écran

```
┌────────────────────────────────────────────────────┐
│  📈 STATISTIQUES DU JOUR                           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│  │ 45  │ │ 12  │ │  8  │ │  3  │                │
│  │Enreg│ │Atten│ │Nouv │ │Inscr│                │
│  └─────┘ └─────┘ └─────┘ └─────┘                │
└────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────┐
│  🔍 RECHERCHE PATIENT        │  ⏰ FILE D'ATTENTE  │
│  ┌────────────────────────┐ │  ┌────────────────┐ │
│  │ Nom, N°, Téléphone...  │ │  │ 🟢 Mukendi J.  │ │
│  └────────────────────────┘ │  │    Position: #1 │ │
│                              │  │    ~10 min     │ │
│  📋 RDV AUJOURD'HUI          │  ├────────────────┤ │
│  ┌────────────────────────┐ │  │ 🟡 Tshiala M.  │ │
│  │ 09:00 - Kabila Joseph  │ │  │    Position: #2 │ │
│  │ Dr. Ngandu           ✓│ │  │    ~25 min     │ │
│  ├────────────────────────┤ │  └────────────────┘ │
│  │ 10:30 - Mukendi Marie  │ │                     │
│  │ Dr. Kapinga            │ │  📝 DERNIERS         │
│  └────────────────────────┘ │  ENREGISTREMENTS    │
└──────────────────────────────┴──────────────────────┘
```

---

## 🎯 3 Cas d'Usage Principaux

### 1️⃣ Patient avec Rendez-vous

```
1. 👀 Regarder la liste "RDV Aujourd'hui"
2. 👆 Cliquer sur le patient
3. ✅ Vérifier les infos dans le modal
4. 🖱️  Cliquer "Enregistrer l'arrivée"
5. 📍 Noter les instructions de direction
```

**Temps:** ~30 secondes

### 2️⃣ Patient sans Rendez-vous

```
1. 🔍 Taper le nom dans la recherche
2. 👆 Sélectionner dans les résultats
3. ✅ Confirmer l'identité
4. 🖱️  Enregistrer l'arrivée
5. 📋 Patient ajouté à la file
```

**Temps:** ~45 secondes

### 3️⃣ Nouveau Patient

```
1. 🔍 Rechercher le patient
2. ❌ "Aucun résultat"
3. ➕ Cliquer "Nouveau Patient"
4. 📝 Remplir le formulaire
5. 💾 Enregistrer le dossier
6. ✅ Enregistrement automatique
```

**Temps:** ~3-5 minutes

---

## 🚦 Codes Couleur Priorités

| Couleur | Priorité | Signification |
|---------|----------|---------------|
| 🔴 **Rouge** | Urgence | Passage immédiat |
| 🟡 **Jaune** | Prioritaire | Femmes enceintes, âgés, enfants |
| 🔵 **Bleu** | Normal | Ordre d'arrivée standard |

---

## 🔎 Astuces de Recherche

### Recherche Multi-critères

```
✓ Par nom:        "Mukendi"
✓ Par prénom:     "Marie"
✓ Par numéro:     "PAT-2024-001"
✓ Par téléphone:  "+243 XXX"
✓ Partiel:        "Muk" (minimum 2 lettres)
```

### Résultats
- **Maximum:** 10 patients
- **Vitesse:** Instantané
- **Tri:** Par pertinence

---

## ⚡ Raccourcis Clavier

| Touche | Action |
|--------|--------|
| `Ctrl + F` | Focus sur recherche |
| `Enter` | Sélectionner premier résultat |
| `Esc` | Fermer modal |
| `F5` | Rafraîchir page |

---

## 📱 Informations Affichées

### Pour Chaque Patient

```
┌─────────────────────────────┐
│ MUKENDI Jean                │
│ N° PAT-2024-001             │
│ 📞 +243 XXX XXX XXX         │
│ 🏥 Consultation Générale    │
│ 👨‍⚕️ Dr. Ngandu               │
│ ⏰ 09:00 - 09:30            │
└─────────────────────────────┘
```

### État de la File

```
Position:  #5
Attente:   ~25 minutes
Priorité:  Normal 🔵
Statut:    En attente
```

---

## ✅ Checklist Enregistrement

Avant de valider, vérifier:

- [ ] ✓ Nom et prénom corrects
- [ ] ✓ Numéro de patient valide
- [ ] ✓ Contact d'urgence à jour
- [ ] ✓ Rendez-vous confirmé (si applicable)
- [ ] ✓ Département de destination correct
- [ ] ✓ Pas de doublon aujourd'hui

---

## 🎫 Informations Remises au Patient

Après enregistrement, donner:

1. **Numéro de file:** Ex: Q-2024-0045
2. **Position:** Ex: 5ème en attente
3. **Temps estimé:** Ex: ~25 minutes
4. **Direction:** Ex: "Consultation Générale, 1er étage, porte 12"
5. **Médecin:** Ex: Dr. Ngandu

---

## 🔄 Rafraîchissement Données

### Automatique
- **File d'attente:** Toutes les 30 secondes
- **Statistiques:** Toutes les 60 secondes
- **RDV du jour:** Au chargement

### Manuel
- 🔄 Bouton rafraîchir sur file d'attente
- 🔄 Bouton actualiser sur RDV
- F5 pour recharger page complète

---

## ⚠️ Messages Courants

### Messages de Succès ✅

```
✓ "Patient enregistré avec succès"
✓ "Ajouté à la file d'attente"
✓ "Nouveau patient créé"
```

### Avertissements ⚠️

```
⚠ "Patient déjà enregistré aujourd'hui"
⚠ "Département à capacité maximale"
⚠ "Rendez-vous déjà passé"
```

### Erreurs ❌

```
✗ "Patient introuvable"
✗ "Erreur de connexion"
✗ "Champs requis manquants"
```

---

## 🆘 Résolution Rapide

| Problème | Solution Immédiate |
|----------|-------------------|
| Patient non trouvé | Vérifier orthographe ou créer nouveau |
| Doublon aujourd'hui | Vérifier historique enregistrements |
| File non rafraîchie | Cliquer bouton rafraîchir manuel |
| Modal bloqué | Appuyer sur Esc ou recharger (F5) |
| Lenteur système | Vérifier connexion internet |

---

## 📞 Contacts Urgents

### Support Technique
- 📧 **Email:** support@okapiamedical.cd
- 📱 **Téléphone:** +243 XXX XXX XXX
- ⏰ **Disponibilité:** Lun-Sam 7h-18h

### En Cas d'Urgence Médicale
- 🚨 **Urgences:** Appeler Dr. Ngandu
- 📞 **Numéro direct:** +243 XXX XXX XXX
- 🏥 **Salle d'urgence:** Rez-de-chaussée

---

## 📈 Objectifs de Performance

| Métrique | Objectif |
|----------|----------|
| Temps d'enregistrement | < 1 minute |
| Temps recherche patient | < 10 secondes |
| Précision données | 100% |
| Satisfaction patient | > 4/5 étoiles |

---

## 🎓 Formation

### Nouveau Personnel

**Durée:** 1 heure

1. **Tour de l'interface** (15 min)
2. **Pratique enregistrement** (20 min)
3. **Cas particuliers** (15 min)
4. **Questions** (10 min)

### Ressources
- 📚 Guide complet: `RECEPTION_ACCUEIL_GUIDE.md`
- 🎥 Vidéos tutoriels: [À venir]
- 📋 FAQ: Section ci-dessous

---

## ❓ FAQ Rapide

### Q: Que faire si patient ne se souvient pas de son numéro?
**R:** Rechercher par nom et téléphone. Le système affichera son numéro.

### Q: Patient en retard pour RDV, que faire?
**R:** L'enregistrer quand même. Le système ajustera la priorité automatiquement.

### Q: Comment annuler un enregistrement erroné?
**R:** Contacter superviseur ou administrateur. Pas d'option d'annulation en réception.

### Q: Patient sans pièce d'identité?
**R:** Enregistrement possible avec nom complet et contact vérifiable. Mentionner dans notes.

### Q: Que faire si système lent?
**R:** 1) Rafraîchir la page, 2) Vérifier connexion, 3) Appeler support si persiste.

---

## 🎯 Bonnes Pratiques

### ✅ À FAIRE

- ✓ Vérifier identité patient avant enregistrement
- ✓ Sourire et accueillir chaleureusement
- ✓ Expliquer temps d'attente estimé
- ✓ Indiquer clairement la direction
- ✓ Mettre à jour infos contact si changement
- ✓ Noter toute information importante

### ❌ À ÉVITER

- ✗ Enregistrer sans vérifier l'identité
- ✗ Oublier de donner numéro de file
- ✗ Promettre temps d'attente précis
- ✗ Modifier priorité sans autorisation
- ✗ Laisser patient sans instructions
- ✗ Ignorer les messages d'avertissement

---

## 📊 Rapport de Fin de Journée

### Informations à Noter

```
Date: __/__/____
Réceptionniste: _____________

Statistiques:
- Total enregistrements: ____
- Nouveaux patients: ____
- Avec rendez-vous: ____
- Sans rendez-vous: ____

Incidents:
- Problèmes techniques: ____
- Patients mécontents: ____
- Autres: _______________

Temps moyen attente: ____ min
```

---

## 🌟 Excellence en Service

### 5 Piliers de l'Accueil

1. **👋 Sourire** - Premier contact chaleureux
2. **👂 Écoute** - Comprendre besoins patient
3. **⚡ Rapidité** - Enregistrement efficace
4. **📍 Clarté** - Instructions précises
5. **💝 Empathie** - Patience et bienveillance

---

## 📅 Mémento Quotidien

### Arrivée (30 min avant ouverture)

- [ ] Allumer ordinateur
- [ ] Ouvrir application
- [ ] Vérifier liste RDV du jour
- [ ] Préparer matériel (tickets, stylos)
- [ ] Tester imprimante

### Pendant Service

- [ ] Enregistrer chaque arrivée
- [ ] Surveiller file d'attente
- [ ] Répondre questions patients
- [ ] Coordonner avec départements
- [ ] Noter incidents

### Fin de Journée

- [ ] Vérifier tous patients traités
- [ ] Compléter rapport journalier
- [ ] Ranger poste de travail
- [ ] Signaler problèmes techniques
- [ ] Fermer application proprement

---

## 🎊 Félicitations!

Vous êtes maintenant prêt(e) à utiliser le module **Réception & Accueil** avec efficacité et professionnalisme!

**Questions?** Consultez le guide complet ou contactez le support.

**Bon travail! 💪**

---

**Version:** 1.0.0
**Dernière mise à jour:** 21 Février 2026
**Statut:** ✅ Production
