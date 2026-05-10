# 🎬 Démonstration: Scénarios d'Utilisation - Réception & Accueil

## 📋 Guide de Démonstration Complète

---

## 🎯 Scénario 1: Patient avec Rendez-vous

### Contexte
**Patient:** Marie Tshiala
**RDV:** 09:30 avec Dr. Ngandu
**Type:** Consultation de suivi

### 🎬 Déroulement (Étape par Étape)

#### Étape 1: Identification du RDV
```
┌─────────────────────────────────────┐
│  RENDEZ-VOUS D'AUJOURD'HUI          │
├─────────────────────────────────────┤
│ ⏰ 09:30 - Tshiala Marie           │
│ 👨‍⚕️ Dr. Ngandu                      │
│ 📋 Consultation Générale            │
│ 📞 +243 XXX XXX XXX                 │
│                                     │
│        [Enregistrer Arrivée]        │
└─────────────────────────────────────┘
```

**Action:** Réceptionniste clique sur la ligne

#### Étape 2: Modal d'Enregistrement
```
╔══════════════════════════════════════════╗
║  Enregistrement Patient                  ║
╠══════════════════════════════════════════╣
║                                          ║
║  👤 Nom: Tshiala Marie                  ║
║  🆔 N°: PAT-2024-0234                   ║
║  📞 Tel: +243 XXX XXX XXX               ║
║                                          ║
║  📅 RDV: 09:30 - Dr. Ngandu            ║
║  🏥 Service: Consultation Générale      ║
║                                          ║
║  ✅ Patient identifié                   ║
║  ✅ Rendez-vous confirmé                ║
║  ✅ Dossier à jour                      ║
║                                          ║
║  ┌──────────┐  ┌──────────┐           ║
║  │ Annuler  │  │ Enregistrer│          ║
║  └──────────┘  └──────────┘           ║
╚══════════════════════════════════════════╝
```

**Action:** Clic sur "Enregistrer"

#### Étape 3: Confirmation & Instructions
```
╔══════════════════════════════════════════╗
║  ✅ Enregistrement Réussi               ║
╠══════════════════════════════════════════╣
║                                          ║
║  🎫 Numéro de File: Q-2024-0045         ║
║  📍 Position: 3ème en attente           ║
║  ⏱️  Temps estimé: ~15 minutes          ║
║                                          ║
║  🚪 INSTRUCTIONS:                        ║
║  ─────────────────────────────────      ║
║  → Montez au 1er étage                  ║
║  → Consultation Générale                ║
║  → Porte n°12                           ║
║  → Présentez-vous à l'accueil           ║
║                                          ║
║  👨‍⚕️ Médecin: Dr. Ngandu                ║
║  ⏰ Heure prévue: 09:30                 ║
║                                          ║
║        [Imprimer Ticket]  [Fermer]      ║
╚══════════════════════════════════════════╝
```

**Résultat:**
- Patient enregistré ✅
- Ajouté à la file d'attente
- Dr. Ngandu notifié
- Ticket disponible

---

## 🎯 Scénario 2: Patient sans Rendez-vous

### Contexte
**Patient:** Jean Mukendi
**Motif:** Douleur abdominale aiguë
**Urgence:** Modérée

### 🎬 Déroulement

#### Étape 1: Recherche du Patient
```
┌─────────────────────────────────────┐
│  🔍 Rechercher un Patient           │
├─────────────────────────────────────┤
│  [Mukendi________________]  🔎      │
│                                     │
│  RÉSULTATS (2 trouvés):             │
│  ┌─────────────────────────────┐   │
│  │ 👤 Mukendi Jean              │   │
│  │ 🆔 PAT-2024-0178             │   │
│  │ 📞 +243 XXX XXX XXX          │   │
│  │ ────────────────             │   │
│  │ [Sélectionner]               │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 👤 Mukendi Joseph            │   │
│  │ 🆔 PAT-2024-0098             │   │
│  │ 📞 +243 YYY YYY YYY          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Action:** Sélectionner "Mukendi Jean"

#### Étape 2: Détection Absence RDV
```
╔══════════════════════════════════════════╗
║  ⚠️  Pas de Rendez-vous Aujourd'hui     ║
╠══════════════════════════════════════════╣
║                                          ║
║  👤 Patient: Mukendi Jean               ║
║  🆔 N°: PAT-2024-0178                   ║
║                                          ║
║  ❓ Motif de la visite:                 ║
║  ┌────────────────────────────────┐   ║
║  │ Douleur abdominale aiguë       │   ║
║  └────────────────────────────────┘   ║
║                                          ║
║  🏥 Service suggéré:                    ║
║  ○ Consultation Générale                ║
║  ○ Médecine Interne                     ║
║  ● Urgences                             ║
║                                          ║
║  🔴 Priorité: ○ Normal  ● Prioritaire  ║
║                                          ║
║  ┌──────────┐  ┌──────────────┐       ║
║  │ Annuler  │  │ Enregistrer   │       ║
║  └──────────┘  └──────────────┘       ║
╚══════════════════════════════════════════╝
```

**Action:** Sélectionner priorité et service

#### Étape 3: Enregistrement Urgent
```
╔══════════════════════════════════════════╗
║  ✅ Enregistrement Urgent Effectué      ║
╠══════════════════════════════════════════╣
║                                          ║
║  🎫 Numéro: Q-URG-2024-012              ║
║  🔴 Priorité: PRIORITAIRE               ║
║  📍 Position: 2ème (sur 5)              ║
║  ⏱️  Temps estimé: ~10 minutes          ║
║                                          ║
║  🚨 INSTRUCTIONS URGENTES:               ║
║  ─────────────────────────────────      ║
║  → RDC - Aile Gauche                    ║
║  → Service des Urgences                 ║
║  → Salle de Triage                      ║
║  → Présentez-vous IMMÉDIATEMENT         ║
║                                          ║
║  👨‍⚕️ Médecin de garde notifié           ║
║                                          ║
║        [Imprimer]  [Alerter Urgences]   ║
╚══════════════════════════════════════════╝
```

**Résultat:**
- Enregistrement prioritaire ✅
- Médecin de garde alerté 🚨
- Position priorité dans file
- Instructions urgentes données

---

## 🎯 Scénario 3: Nouveau Patient (Première Visite)

### Contexte
**Patient:** Sophie Kabila
**Situation:** Première visite à la clinique
**Référence:** Recommandation d'un ami

### 🎬 Déroulement

#### Étape 1: Recherche Infructueuse
```
┌─────────────────────────────────────┐
│  🔍 Rechercher un Patient           │
├─────────────────────────────────────┤
│  [Kabila Sophie__________]  🔎      │
│                                     │
│  ❌ AUCUN RÉSULTAT                  │
│                                     │
│  Ce patient n'existe pas dans       │
│  notre système.                     │
│                                     │
│  ┌────────────────────────────┐    │
│  │  ➕ Créer Nouveau Patient  │    │
│  └────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Action:** Cliquer "Créer Nouveau Patient"

#### Étape 2: Formulaire d'Inscription (Partie 1/3)
```
╔══════════════════════════════════════════╗
║  👤 Nouveau Patient - Infos Personnelles ║
║                                    [1/3] ║
╠══════════════════════════════════════════╣
║                                          ║
║  Nom *                                   ║
║  [Kabila_____________________]          ║
║                                          ║
║  Prénom *                                ║
║  [Sophie_____________________]          ║
║                                          ║
║  Date de Naissance *                     ║
║  [15] / [03] / [1990]                   ║
║                                          ║
║  Genre *                                 ║
║  ● Féminin  ○ Masculin  ○ Autre         ║
║                                          ║
║  État Civil                              ║
║  ○ Célibataire  ● Marié(e)  ○ Divorcé(e)║
║                                          ║
║  Groupe Sanguin                          ║
║  [A+_____▼]                             ║
║                                          ║
║                    [Suivant →]           ║
╚══════════════════════════════════════════╝
```

#### Étape 3: Formulaire d'Inscription (Partie 2/3)
```
╔══════════════════════════════════════════╗
║  📞 Nouveau Patient - Contact           ║
║                                    [2/3] ║
╠══════════════════════════════════════════╣
║                                          ║
║  Téléphone Principal *                   ║
║  [+243_XXX_XXX_XXX___________]          ║
║                                          ║
║  Téléphone Secondaire                    ║
║  [+243_YYY_YYY_YYY___________]          ║
║                                          ║
║  Email                                   ║
║  [sophie.kabila@email.com____]          ║
║                                          ║
║  Adresse *                               ║
║  ┌────────────────────────────────┐   ║
║  │Avenue Lumumba, N°45            │   ║
║  │Commune de Gombe                │   ║
║  │Kinshasa, RDC                   │   ║
║  └────────────────────────────────┘   ║
║                                          ║
║  [← Précédent]        [Suivant →]      ║
╚══════════════════════════════════════════╝
```

#### Étape 4: Formulaire d'Inscription (Partie 3/3)
```
╔══════════════════════════════════════════╗
║  🆘 Nouveau Patient - Contact d'Urgence ║
║                                    [3/3] ║
╠══════════════════════════════════════════╣
║                                          ║
║  Nom du Contact *                        ║
║  [Jean Kabila________________]          ║
║                                          ║
║  Relation *                              ║
║  [Époux______▼]                         ║
║                                          ║
║  Téléphone *                             ║
║  [+243_ZZZ_ZZZ_ZZZ___________]          ║
║                                          ║
║  ──────────────────────────────────     ║
║                                          ║
║  📋 Informations Médicales              ║
║                                          ║
║  Allergies Connues                       ║
║  ┌────────────────────────────────┐   ║
║  │Pénicilline                      │   ║
║  └────────────────────────────────┘   ║
║                                          ║
║  Maladies Chroniques                     ║
║  ┌────────────────────────────────┐   ║
║  │Hypertension                     │   ║
║  └────────────────────────────────┘   ║
║                                          ║
║  [← Précédent]     [Créer Patient]     ║
╚══════════════════════════════════════════╝
```

**Action:** Remplir et valider

#### Étape 5: Création et Enregistrement Auto
```
╔══════════════════════════════════════════╗
║  ✅ Patient Créé avec Succès            ║
╠══════════════════════════════════════════╣
║                                          ║
║  👤 Kabila Sophie                       ║
║  🆔 N°: PAT-2024-0456 (NOUVEAU)         ║
║  📅 Dossier créé le 21/02/2026          ║
║                                          ║
║  ✅ Enregistrement automatique effectué ║
║                                          ║
║  🎫 Numéro de File: Q-2024-0046         ║
║  📍 Position: 4ème en attente           ║
║  ⏱️  Temps estimé: ~20 minutes          ║
║                                          ║
║  🏥 Prochaine étape:                    ║
║  → Consultation Initiale                ║
║  → 1er étage, Porte 8                   ║
║  → Évaluation médicale complète         ║
║                                          ║
║  📋 Dossier médical ouvert              ║
║                                          ║
║  [Imprimer Ticket]  [Voir Dossier]      ║
╚══════════════════════════════════════════╝
```

**Résultat:**
- Dossier patient créé ✅
- Numéro unique assigné
- Enregistrement automatique
- Prêt pour consultation initiale

---

## 🎯 Scénario 4: Gestion de la File d'Attente

### Vue en Temps Réel

#### Panneau File d'Attente
```
╔══════════════════════════════════════╗
║  ⏰ FILE D'ATTENTE (7 patients)      ║
╠══════════════════════════════════════╣
║                                      ║
║  🔴 Q-URG-2024-012  #1              ║
║  Mukendi Jean                        ║
║  Urgences • ~5 min                   ║
║  Dr. Garde                           ║
║  ────────────────────────────────   ║
║                                      ║
║  🔵 Q-2024-0043  #2                 ║
║  Tshiala Joseph                      ║
║  Consultation • ~10 min              ║
║  Dr. Ngandu                          ║
║  ────────────────────────────────   ║
║                                      ║
║  🔵 Q-2024-0045  #3                 ║
║  Tshiala Marie                       ║
║  Consultation • ~15 min              ║
║  Dr. Ngandu                          ║
║  ────────────────────────────────   ║
║                                      ║
║  🟡 Q-2024-0044  #4                 ║
║  Kabongo Thérèse (75 ans)            ║
║  Gériatrie • ~20 min                 ║
║  Dr. Kapinga                         ║
║  ────────────────────────────────   ║
║                                      ║
║  🔵 Q-2024-0046  #5                 ║
║  Kabila Sophie (NOUVEAU)             ║
║  Consultation • ~25 min              ║
║  Dr. Lumingu                         ║
║                                      ║
║  [↻ Rafraîchir]    Mis à jour: 10:34║
╚══════════════════════════════════════╝
```

### Légende Priorités
```
🔴 = Urgence (passage immédiat)
🟡 = Prioritaire (personnes âgées, femmes enceintes)
🔵 = Normal (ordre d'arrivée)
```

---

## 🎯 Scénario 5: Statistiques en Temps Réel

### Tableau de Bord Réceptionniste
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📊 STATISTIQUES DU JOUR - 21/02/2026      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ ✅ ENREGISTR.│ ⏰ EN ATTENTE│ 🆕 NOUVEAUX  │ 📝 INSCRIPTION│
│              │              │              │              │
│     45       │     7        │     8        │     2        │
│              │              │              │              │
│ +3 vs hier   │ -2 vs hier   │ +1 vs hier   │ = vs hier    │
└──────────────┴──────────────┴──────────────┴──────────────┘

📈 GRAPHIQUE DE LA JOURNÉE
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  20│                                      ▄▄▄              │
│    │                                   ▄▄▄   ▄            │
│  15│                              ▄▄▄▄▄       ▄           │
│    │                         ▄▄▄▄▄                        │
│  10│                    ▄▄▄▄▄                             │
│    │               ▄▄▄▄▄                                  │
│   5│          ▄▄▄▄▄                                       │
│    │     ▄▄▄▄▄                                            │
│   0└─────┴────┴────┴────┴────┴────┴────┴────┴────┴──────┤
│     8h   9h  10h  11h  12h  13h  14h  15h  16h   17h     │
└────────────────────────────────────────────────────────────┘

🏆 PERFORMANCE
├─ Temps moyen d'enregistrement: 45 sec ✅
├─ Temps moyen d'attente: 18 min ✅
├─ Taux de respect des RDV: 92% ✅
└─ Satisfaction patients: 4.7/5 ⭐⭐⭐⭐⭐
```

---

## 🎯 Scénario 6: Gestion d'Incident

### Situation: Patient Mécontent du Temps d'Attente

#### Étape 1: Identification du Problème
```
╔══════════════════════════════════════════╗
║  ⚠️  ALERTE PATIENT                     ║
╠══════════════════════════════════════════╣
║                                          ║
║  Patient: Lumingu Pierre                 ║
║  Numéro: Q-2024-0041                     ║
║  Attente: 65 minutes ⚠️                 ║
║                                          ║
║  Status: Consultation Générale           ║
║  Position: 6ème                          ║
║  Médecin: Dr. Ngandu                     ║
║                                          ║
║  ⚠️  Dépassement temps standard (45min) ║
║                                          ║
║  ACTIONS POSSIBLES:                      ║
║  ┌────────────────────────────────┐   ║
║  │ Changer priorité               │   ║
║  │ Réassigner médecin             │   ║
║  │ Proposer RDV ultérieur         │   ║
║  │ Alerter superviseur            │   ║
║  └────────────────────────────────┘   ║
║                                          ║
║  [Gérer Situation]  [Alerter Médecin]   ║
╚══════════════════════════════════════════╝
```

#### Étape 2: Action Réceptionniste
```
Options de gestion:

1. 📢 COMMUNICATION
   - Informer patient du retard
   - Expliquer cause (urgence traitée)
   - Donner nouveau temps estimé
   - Offrir café/eau

2. 🔄 RÉORGANISATION
   - Passer patient en priorité
   - Réassigner à médecin disponible
   - Proposer nouveau créneau

3. 🆘 ESCALADE
   - Alerter superviseur
   - Demander médecin supplémentaire
   - Activer plan de débordement
```

---

## 📊 Rapport de Fin de Journée

### Synthèse Automatique
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📋 RAPPORT QUOTIDIEN - RÉCEPTION          ┃
┃  Date: 21 Février 2026                     ┃
┃  Réceptionniste: Marie Kasongo             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📈 STATISTIQUES GÉNÉRALES
─────────────────────────────────────────────
Total Enregistrements:        45 patients
Avec Rendez-vous:            32 (71%)
Sans Rendez-vous:            13 (29%)
Nouveaux Patients:            8 (18%)

⏱️  TEMPS ET EFFICACITÉ
─────────────────────────────────────────────
Temps moyen enregistrement:   45 secondes
Temps moyen attente:          18 minutes
Pic d'affluence:              10h30 - 11h30

🎯 QUALITÉ DE SERVICE
─────────────────────────────────────────────
Taux respect RDV:             92%
Incidents gérés:              2
Plaintes reçues:              0
Compliments reçus:            3

🏥 RÉPARTITION PAR SERVICE
─────────────────────────────────────────────
Consultation Générale:        18 (40%)
Médecine Interne:             9 (20%)
Pédiatrie:                    7 (16%)
Gériatrie:                    5 (11%)
Urgences:                     4 (9%)
Autres:                       2 (4%)

✅ VALIDATION SUPERVISEUR
─────────────────────────────────────────────
Superviseur: Dr. Kapinga
Validation: ✅ Approuvé
Commentaires: Excellente performance
Date: 21/02/2026 17:45
```

---

## 🎓 Points Clés de Formation

### Pour Nouveaux Réceptionnistes

#### Les 5 Commandements

1. **SOURIRE** - Toujours accueillir chaleureusement
2. **VÉRIFIER** - Confirmer identité avant enregistrement
3. **INFORMER** - Communiquer temps d'attente et direction
4. **NOTER** - Enregistrer toute information importante
5. **ALERTER** - Signaler immédiatement les urgences

#### Erreurs à Éviter

❌ Enregistrer sans vérification identité
❌ Oublier de donner numéro de file
❌ Promettre temps d'attente précis
❌ Ignorer signaux d'urgence
❌ Laisser patient sans instructions

#### Bonnes Pratiques

✅ Demander pièce d'identité
✅ Expliquer processus clairement
✅ Donner instructions de direction
✅ Remettre ticket de file d'attente
✅ Être patient et empathique

---

## 🏆 Excellence en Service

### Critères d'Évaluation

| Critère | Objectif | Points |
|---------|----------|--------|
| Rapidité enregistrement | < 1 min | 20 |
| Précision données | 100% | 20 |
| Courtoisie | Excellent | 20 |
| Gestion incidents | Efficace | 20 |
| Propreté poste | Impeccable | 20 |

**Score Excellence:** 90-100 points ⭐⭐⭐⭐⭐

---

## 📞 Contacts Rapides

### Urgences
- 🚨 **Médecin de garde:** Ext. 111
- 🆘 **Sécurité:** Ext. 112
- 🚑 **Ambulance:** Ext. 113

### Support
- 💻 **IT Support:** Ext. 201
- 👔 **Superviseur:** Ext. 301
- 📋 **Administration:** Ext. 401

---

**🎉 FIN DE LA DÉMONSTRATION**

Le module Réception & Accueil est maintenant pleinement opérationnel et prêt pour une utilisation professionnelle!

**Version:** 1.0.0
**Date:** 21 Février 2026
**Status:** ✅ PRODUCTION
