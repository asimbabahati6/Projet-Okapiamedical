# Guide de Référence Rapide - Validation de Proximité par Rôle

## Vue d'Ensemble

Le système de pointage utilise maintenant la validation de proximité basée sur les rôles pour garantir que le personnel est physiquement présent à l'hôpital.

## Exigences de Proximité

### ✅ Rôles EXEMPTÉS (Pas de restriction de distance)

| Rôle | Nom du Rôle | Privilège |
|------|-------------|-----------|
| **Super Administrateur** | `super_admin` | Pointage depuis n'importe quel emplacement |
| **Administrateur** | `hospital_admin` | Pointage depuis n'importe quel emplacement |

**Note:** La distance est toujours enregistrée à des fins d'audit.

### ❌ Rôles REQUIS (Doivent être à moins de 5 mètres)

| Rôle | Nom du Rôle |
|------|-------------|
| **Médecin** | `doctor` |
| **Infirmier(ère)** | `nurse` |
| **Pharmacien** | `pharmacist` |
| **Réceptionniste** | `receptionist` |
| **Personnel Administratif** | `administrative_staff` |
| **Logisticien** | `logistician` |

## Pour les Utilisateurs

### Personnel (Proximité Requise)

**Avant le pointage:**
1. Assurez-vous d'être à l'hôpital OKAPIA Medical
2. Vérifiez que le GPS de votre appareil est activé
3. Autorisez l'accès à la localisation dans votre navigateur

**Lors du pointage:**
1. Vous verrez un **bandeau AMBRE** indiquant la proximité requise
2. Cliquez sur "Pointer l'arrivée"
3. Le système acquiert votre position GPS
4. Si vous êtes à plus de 5 mètres → **Pointage refusé**
5. Si vous êtes à moins de 5 mètres → **Pointage réussi**

**En cas de refus:**
- Message: "Vous êtes trop éloigné de la clinique OKAPIA Medical (X.Xm)"
- Solution: Rapprochez-vous de l'hôpital et réessayez
- La tentative est enregistrée dans l'audit

### Administrateurs (Exemption Active)

**Lors du pointage:**
1. Vous verrez un **bandeau BLEU** indiquant l'exemption active
2. Message: "En tant que [rôle], vous pouvez effectuer le pointage depuis n'importe quel emplacement"
3. Le pointage réussit quelle que soit votre distance
4. La distance réelle est enregistrée pour l'audit

## Configuration (Administrateurs Uniquement)

### Accès aux Paramètres

**Qui peut modifier:**
- Super Administrateur (`super_admin`)
- Administrateur (`hospital_admin`)

**Qui peut consulter:**
- Tous les utilisateurs (mode lecture seule)

### Paramètres Modifiables

1. **Distance maximale autorisée**
   - Par défaut: 5 mètres
   - Plage: 1-100 mètres
   - S'applique à tous les rôles non-exemptés

2. **Coordonnées de référence**
   - Latitude: -4.37° (OKAPIA Medical)
   - Longitude: 15.25° (OKAPIA Medical)
   - Peut utiliser la position actuelle

3. **Précision GPS minimale**
   - Par défaut: 3 mètres
   - Qualité minimale du signal GPS acceptée

4. **Activation/Désactivation**
   - Master switch pour activer/désactiver la validation GPS

### Interface de Configuration

**Pour les Administrateurs:**
- Tous les champs sont modifiables
- Bouton "Enregistrer les paramètres" visible
- Peuvent tester leur position actuelle
- Peuvent utiliser leur position comme référence

**Pour les Non-Administrateurs:**
- Badge "Lecture seule" affiché
- Tous les champs sont désactivés (grisés)
- Peuvent tester leur position (consultation uniquement)
- Message: "Modifications réservées aux administrateurs"

## Messages du Système

### Messages de Succès

**Personnel dans la zone:**
```
✓ Pointage d'arrivée enregistré avec succès
```

**Administrateur (avec exemption):**
```
✓ Pointage d'arrivée enregistré avec succès
  Accès privilégié accordé - Exemption de proximité pour le rôle [role]
```

### Messages d'Erreur

**Hors de portée:**
```
✗ Pointage Refusé
  Vous êtes trop éloigné de la clinique OKAPIA Medical (X.Xm).
  Vous devez être à moins de 5m pour valider votre présence.
  Cette exigence s'applique à votre rôle.
```

**GPS imprécis:**
```
✗ Pointage Refusé
  Précision GPS insuffisante (X.Xm).
  Une précision d'au moins 50m est requise.
```

**GPS désactivé:**
```
✗ Erreur de Géolocalisation
  La géolocalisation n'est pas supportée par votre navigateur
  [Instructions pour activer le GPS]
```

## Audit et Traçabilité

### Informations Enregistrées

Chaque tentative de pointage enregistre:
- 📍 Coordonnées GPS (latitude, longitude)
- 📏 Distance calculée depuis l'hôpital
- 👤 Rôle de l'utilisateur
- ✓/✗ Résultat de la validation
- 🛡️ Statut d'exemption (appliquée ou non)
- 📱 Informations sur l'appareil
- 🕐 Horodatage précis

### Consultation de l'Audit

**Où:** Page "Audit des Présences RH"

**Qui peut consulter:**
- Super Administrateurs
- Administrateurs

**Filtres disponibles:**
- Par résultat (succès, hors portée, erreur GPS)
- Par employé
- Par date
- Par statut d'exemption

## Dépannage

### Le pointage est refusé alors que je suis à l'hôpital

**Solutions:**
1. Vérifiez que le GPS est activé sur votre appareil
2. Rapprochez-vous d'une fenêtre pour améliorer le signal
3. Attendez quelques secondes que le GPS se stabilise
4. Rechargez la page et réessayez
5. Contactez un administrateur si le problème persiste

### Le GPS ne fonctionne pas

**Vérifications:**
1. Permission de localisation accordée dans le navigateur
2. GPS activé dans les paramètres de l'appareil
3. Connexion internet stable
4. Essayez avec un autre navigateur
5. Vérifiez les paramètres de confidentialité

### Je vois "Lecture seule" dans les paramètres

**Explication:**
- Seuls les Super Administrateurs et Administrateurs peuvent modifier les paramètres
- Vous pouvez consulter les paramètres actuels
- Vous pouvez tester votre position
- Contactez un administrateur pour toute modification nécessaire

## Support

Pour toute question ou problème:
1. Consultez ce guide de référence
2. Testez votre position dans les paramètres
3. Vérifiez votre rôle avec un administrateur
4. Consultez l'audit pour voir les tentatives précédentes
5. Contactez le support technique si nécessaire

---

**Version:** 1.0
**Date:** Janvier 2026
**Système:** OKAPIA Hospital Management System
