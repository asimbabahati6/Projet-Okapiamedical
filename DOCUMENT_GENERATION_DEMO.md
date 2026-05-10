# Démonstration Visuelle - Système de Génération de Documents

## 🎬 Interface Utilisateur

### Vue d'Ensemble de la Page

```
┌─────────────────────────────────────────────────────────────────────┐
│  📄 Documents Médicaux                    [⚡ Génération] [+ Nouveau]│
│  Générez des documents professionnels avec le branding OKAPIA       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────── TABLEAU DE GÉNÉRATION RAPIDE ────────────────┐│
│  │  📄 OKAPIA MEDICAL     8 types • PDF et Word    [🔄 Rafraîchir]││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ Type Document       │ Patient Assigné      │ Formats Export   │││
│  ├─────────────────────┼──────────────────────┼──────────────────┤││
│  │ 📄 Consultation     │ 👤 Jean Dupont       │ [PDF] [Word]     │││
│  │    Rapports         │    PAT-601001        │  🔴    🔵       │││
│  ├─────────────────────┼──────────────────────┼──────────────────┤││
│  │ 🧪 Laboratoire      │ 👤 Marie Koffi       │ [PDF] [Word]     │││
│  │    Résultats        │    PAT-601002        │  🔴    🔵       │││
│  ├─────────────────────┼──────────────────────┼──────────────────┤││
│  │ 🏆 Certificat       │ 👤 Paul Mbala        │ [PDF] [Word]     │││
│  │    Médical          │    PAT-601003        │  🔴    🔵       │││
│  ├─────────────────────┼──────────────────────┼──────────────────┤││
│  │ 💊 Prescription     │ 👤 Sophie Lukeni     │ [PDF] [Word]     │││
│  │    Résumé           │    PAT-601004        │  🔴    🔵       │││
│  ├─────────────────────┼──────────────────────┼──────────────────┤││
│  │ 🚪 Sortie           │ 👤 André Kabila      │ [PDF] [Word]     │││
│  │    Rapport          │    PAT-601005        │  🔴    🔵       │││
│  ├─────────────────────┼──────────────────────┼──────────────────┤││
│  │ ❤️  Infirmière      │ 👤 Claire Tshisekedi │ [PDF] [Word]     │││
│  │    Notes            │    PAT-601006        │  🔴    🔵       │││
│  ├─────────────────────┼──────────────────────┼──────────────────┤││
│  │ 📋 Ordonnance       │ 👤 David Lumingu     │ [PDF] [Word]     │││
│  │    Complète         │    PAT-601007        │  🔴    🔵       │││
│  ├─────────────────────┼──────────────────────┼──────────────────┤││
│  │ 📝 Personnalisé     │ 👤 Emma Mobutu       │ [PDF] [Word]     │││
│  │    Document         │    PAT-601008        │  🔴    🔵       │││
│  └─────────────────────┴──────────────────────┴──────────────────┘│
│  📊 8 documents prêts à être exportés        🔴 PDF  🔵 Word      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Modal de Génération en Masse

### Étape 1 : Sélection des Types

```
┌────────────────── 📁 GÉNÉRATION EN MASSE ──────────────────────────┐
│                                                          [✕ Fermer] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Sélectionner les Types de Documents    [Tout sélectionner]        │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│  │ 📄 Consultation│  │ 🧪 Laboratoire │  │ 🏆 Certificat  │       │
│  │ ✓ Sélectionné  │  │ ✓ Sélectionné  │  │   À sélectionner│      │
│  └────────────────┘  └────────────────┘  └────────────────┘       │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│  │ 💊 Prescription│  │ 🚪 Sortie      │  │ ❤️  Infirmière │       │
│  │   À sélectionner│  │   À sélectionner│  │   À sélectionner│      │
│  └────────────────┘  └────────────────┘  └────────────────┘       │
│                                                                      │
│  ℹ️ 2 type(s) sélectionné(s)                                       │
│                                                                      │
│  Format d'Export                                                    │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│  │  📄 PDF       │  │  💾 Word      │  │  📦 PDF+Word  │          │
│  │  uniquement   │  │  uniquement   │  │  ✓ Les deux   │          │
│  └───────────────┘  └───────────────┘  └───────────────┘          │
│                                                                      │
│  ┌──────────────── RÉSUMÉ ────────────────┐                        │
│  │ • Documents: 2                          │                        │
│  │ • Format: PDF + Word                    │                        │
│  │ • Fichiers totaux: 4                    │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                      │
│                                    [Annuler]  [Générer (4)]         │
└─────────────────────────────────────────────────────────────────────┘
```

### Étape 2 : Génération en Cours

```
┌────────────────── 📁 GÉNÉRATION EN MASSE ──────────────────────────┐
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                          🔄                                          │
│                    [Spinner animé]                                  │
│                                                                      │
│               Génération en Cours...                                │
│                     2 / 4 fichiers                                  │
│                                                                      │
│  Progression                                                 50%    │
│  [████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░]                  │
│                                                                      │
│  Fichier en cours:                                                  │
│  Consultation - Marie Koffi.docx                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Étape 3 : Génération Terminée

```
┌────────────────── 📁 GÉNÉRATION EN MASSE ──────────────────────────┐
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                          ✓                                           │
│                   [Checkmark vert]                                  │
│                                                                      │
│               Génération Terminée!                                  │
│                     4 / 4 fichiers                                  │
│                                                                      │
│  Progression                                                100%    │
│  [████████████████████████████████████████████████████████]         │
│                                                                      │
│  Dernier fichier:                                                   │
│  Laboratoire - Marie Koffi.docx                                     │
│                                                                      │
│         ✅ 4 document(s) générés avec succès!                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Exemple de Document PDF Généré

### En-tête (Toutes les Pages)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                      OKAPIA MEDICAL                                 │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                      │
```

### Corps du Document

```
│              RAPPORT DE CONSULTATION                                │
│                                                                      │
│  Patient: Jean Dupont                                               │
│  N° Patient: PAT-601001                                             │
│  Date: 23/11/2025                                                   │
│                                                                      │
│  ─────────────────────────────────────────────────────────────      │
│                                                                      │
│  MOTIF DE CONSULTATION                                              │
│                                                                      │
│  Patient se présente pour douleurs abdominales récurrentes          │
│  depuis 3 jours, accompagnées de nausées et de perte               │
│  d'appétit.                                                         │
│                                                                      │
│  ANAMNÈSE                                                           │
│                                                                      │
│  Patient de 40 ans, sexe masculin. Antécédents médicaux:           │
│  Hypertension. Allergies connues: Pénicilline. Traitement          │
│  actuel: Aucun médicament en cours.                                │
│                                                                      │
│  EXAMEN CLINIQUE                                                    │
│                                                                      │
│  Examen général: Patient conscient, bien orienté. TA: 120/80       │
│  mmHg, FC: 75 bpm, T°: 37.2°C. Examen abdominal: Abdomen          │
│  souple, sensibilité à la palpation de l'épigastre.                │
│                                                                      │
│  DIAGNOSTIC                                                         │
│                                                                      │
│  Gastrite aiguë probable d'origine alimentaire.                     │
│                                                                      │
│  PLAN DE TRAITEMENT                                                 │
│                                                                      │
│  Prescription d'Oméprazole 20mg 2x/jour pendant 14 jours.          │
│  Régime alimentaire adapté. Contrôle dans 1 semaine.               │
│                                                                      │
```

### Pied de Page (Toutes les Pages)

```
│                                                                      │
│  ─────────────────────────────────────────────────────────────      │
│              Page 1 sur 1                                           │
│  Document Confidentiel - Usage Médical Uniquement - OKAPIA MEDICAL │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💾 Exemple de Document Word (.docx)

### Structure

```
[En-tête automatique]
╔══════════════════════════════════════════════════════════════╗
║                    OKAPIA MEDICAL                            ║
╚══════════════════════════════════════════════════════════════╝

[Corps avec styles]
Titre 1: RAPPORT DE CONSULTATION
Normal: Patient: Jean Dupont
Normal: N° Patient: PAT-601001

Titre 2: Motif de Consultation
Normal: [Contenu éditable...]

Titre 2: Anamnèse
Normal: [Contenu éditable...]

[Pied de page automatique]
────────────────────────────────────────────────────────────
Page {PAGE} | Document OKAPIA MEDICAL | Date: {DATE}
```

---

## 🎨 Codes Couleur des Boutons

### États des Boutons d'Export

```
┌────────────────────────────────────────────────────────┐
│  BOUTON PDF                                            │
├────────────────────────────────────────────────────────┤
│  État Prêt:       [🔴 PDF]      (Rouge)               │
│  Chargement:      [⏳ Export...] (Gris)               │
│  Succès:          [✓ Téléchargé] (Vert)              │
│  Erreur:          [✕ Erreur]    (Rouge foncé)         │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  BOUTON WORD                                           │
├────────────────────────────────────────────────────────┤
│  État Prêt:       [🔵 Word]     (Bleu)                │
│  Chargement:      [⏳ Export...] (Gris)               │
│  Succès:          [✓ Téléchargé] (Vert)              │
│  Erreur:          [✕ Erreur]    (Rouge foncé)         │
└────────────────────────────────────────────────────────┘
```

---

## 📊 Exemples de Contenu Généré

### Résultats de Laboratoire (Tableau)

```
┌──────────────┬──────────┬────────┬──────────────┬─────────┐
│ Test         │ Résultat │ Unité  │ Valeurs Norm.│ Statut  │
├──────────────┼──────────┼────────┼──────────────┼─────────┤
│ Hémoglobine  │ 14.2     │ g/dL   │ 12.0 - 16.0  │ Normal  │
│ Globules B.  │ 7.8      │ 10³/μL │ 4.0 - 11.0   │ Normal  │
│ Plaquettes   │ 245      │ 10³/μL │ 150 - 400    │ Normal  │
│ Glycémie     │ 95       │ mg/dL  │ 70 - 110     │ Normal  │
│ Créatinine   │ 0.9      │ mg/dL  │ 0.6 - 1.2    │ Normal  │
└──────────────┴──────────┴────────┴──────────────┴─────────┘
```

### Prescription Summary (Liste)

```
MÉDICAMENTS PRESCRITS:
• Oméprazole 20mg - 1 gélule matin et soir (14 jours)
• Spasfon 80mg - 1 comprimé 3×/jour si besoin
• Gaviscon 500mg - 1 sachet après repas (7 jours)

INSTRUCTIONS SPÉCIALES:
• Prendre l'Oméprazole à jeun
• Ne pas dépasser 3 prises de Spasfon/jour
• Éviter l'alcool et le tabac
```

---

## 🎬 Scénario d'Utilisation Animé

### Séquence : Export Rapide

```
Temps: 0s
┌─────────────────────────────────────────┐
│ [📄 PDF] [💾 Word]                     │  ← Boutons prêts
└─────────────────────────────────────────┘

Utilisateur clique [PDF]
↓

Temps: 0.5s
┌─────────────────────────────────────────┐
│ [⏳ Export...] [💾 Word]               │  ← Chargement
└─────────────────────────────────────────┘

Temps: 1s
┌─────────────────────────────────────────┐
│ [✓ Téléchargé] [💾 Word]               │  ← Succès!
└─────────────────────────────────────────┘
📥 Fichier téléchargé: Consultation-JeanDupont-23112025.pdf

Temps: 3s
┌─────────────────────────────────────────┐
│ [📄 PDF] [💾 Word]                     │  ← Retour état initial
└─────────────────────────────────────────┘
```

---

## 🎯 Points d'Interaction

### Hover sur Bouton

```
État normal:
  [🔴 PDF]

État hover:
  [🔴 PDF]  ← Ombre portée + légère surbrillance
  ↑ Tooltip: "Télécharger en PDF"
```

### Clic sur Ligne du Tableau

```
┌─────────────────────────────────────────────────────────┐
│ 📄 Consultation  │ 👤 Jean Dupont  │ [PDF] [Word]     │
└─────────────────────────────────────────────────────────┘
                                            ↑
                        Hover sur ligne: fond gris léger
```

---

## 📱 Vue Mobile (Responsive)

### Affichage Mobile (320px)

```
┌────────────────────────────┐
│ 📄 Documents Médicaux     │
│                            │
│ [⚡ Masse] [+ Nouveau]    │
├────────────────────────────┤
│ GÉNÉRATION RAPIDE          │
│                            │
│ 📄 Consultation            │
│ 👤 Jean Dupont             │
│ [PDF] [Word]               │
├────────────────────────────┤
│ 🧪 Laboratoire             │
│ 👤 Marie Koffi             │
│ [PDF] [Word]               │
├────────────────────────────┤
│ ... (scroll vertical)      │
└────────────────────────────┘
```

---

## 🎨 Palette de Couleurs

```
OKAPIA BLUE:   #0F4A77  (En-tête, titres)
PDF RED:       #DC2626  (Bouton PDF)
WORD BLUE:     #2563EB  (Bouton Word)
SUCCESS GREEN: #10B981  (Succès)
GRAY:          #6B7280  (Texte secondaire)
```

---

## ✨ Animations

### Spinner de Chargement

```
Frame 1:  ⠋  Export...
Frame 2:  ⠙  Export...
Frame 3:  ⠹  Export...
Frame 4:  ⠸  Export...
Frame 5:  ⠼  Export...
Frame 6:  ⠴  Export...
Frame 7:  ⠦  Export...
Frame 8:  ⠧  Export...
```

### Barre de Progression

```
0%:   [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]
25%:  [████████░░░░░░░░░░░░░░░░░░░░░░]
50%:  [████████████████░░░░░░░░░░░░░░]
75%:  [████████████████████████░░░░░░]
100%: [████████████████████████████████]
```

---

## 🎉 Feedback Visuel

### Toast Notifications

```
┌─────────────────────────────────────────────┐
│ ✓ Document PDF téléchargé avec succès      │
│   [Télécharger PDF] [Télécharger Word]     │
└─────────────────────────────────────────────┘
Position: Bas-droite, disparaît après 5s
```

---

**Cette démonstration visuelle vous aide à comprendre l'interface avant même de l'utiliser!**
